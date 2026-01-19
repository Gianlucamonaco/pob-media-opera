import { lerp } from "three/src/math/MathUtils.js";
import { BASE_AUDIO_INTERVAL, BASE_SMOOTH_FACTOR, ChannelNames } from "~/data/constants";

// This object holds the values that are actually used by the 3D engine
const smoothedAudio = reactive(
  Array.from({ length: Object.keys(ChannelNames).length - 1 }, () => ({
    pitch: 0,
    loudness: 0,
    centroid: 0,
    flatness: 0,
    onOff: 0,
    _onOffActive: false,
  }))
);

// Track musical progression
const musicalState = reactive({
  currentBeat: 0,
  prevBeat: 0,
  beatCount: 0,
  barCount: 0,
  isNewBeat: false
});

export const useAudioManager = () => {
  const { $wsAudio } = useNuxtApp() as any;
  const factor = useSmoothFactor();
  const master = $wsAudio[ChannelNames.MASTER_CTRL];

  const update = () => {
    // 1. Update Smoothing logic
    for (let ch in $wsAudio) {
      const index = parseInt(ch);
      const target = $wsAudio[index];
      const current = smoothedAudio[index];

      if (!target || !current) continue;

      // Smooth each parameter
      current.pitch = lerp(current.pitch, target.pitch || 0, factor.value);
      current.loudness = lerp(current.loudness, target.loudness || 0, factor.value);
      current.centroid = lerp(current.centroid, target.centroid || 0, factor.value);
      current.flatness = lerp(current.flatness, target.flatness || 0, factor.value);

      // onOff is only active for one frame, than disable as long as the raw value stays 1
      if (target.onOff == 1 && current._onOffActive === false) {
        current.onOff = 1;
        current._onOffActive = true;
      }
      else if (target.onOff == 1 && current._onOffActive === true) {
        current.onOff = 0;
      }
      else if (target.onOff == 0 && current._onOffActive === true) {
        current._onOffActive = false;
      }
    }

    // 2. Musical Beat Detection
    if (master) {      
      // Check if the beat integer has changed
      if (master.beat !== musicalState.prevBeat) {
        // Handle Measure Wrapping (if beat goes from 4 back to 1)
        if (master.beat < musicalState.prevBeat) {
          musicalState.barCount++;
        }
        
        musicalState.currentBeat = master.beat;
        musicalState.isNewBeat = true;
        musicalState.prevBeat = master.beat;
        musicalState.beatCount++;
      } else {
        musicalState.isNewBeat = false;
      }
    }
  };

/** * Triggers a callback based on musical timing.
   * @param params.beats - Every X beats
   * @param params.offset - Initial offset (optional)
   */
  const repeatEvery = ({beats, offset = 0}: { beats: number; offset?: number }, callback: () => void) => {
    if (!musicalState.isNewBeat) return;
    const isTargetBeat = (musicalState.beatCount + 1 - offset) % beats === 0;

    if (isTargetBeat) {
      callback();
    }
  };

  /** Reset audio params */
  const reset = (delay = BASE_AUDIO_INTERVAL) => {
    musicalState.beatCount = 0;


    setTimeout (() => {
      for (let ch in $wsAudio) {
        const index = parseInt(ch);
        if (index !== ChannelNames.MASTER_CTRL) {
          for (let param in $wsAudio[index]) {
            $wsAudio[index][param] = 0;
          }
        }
      }
    }, delay);
  }

  return { smoothedAudio, master, update, repeatEvery, reset };
};

/** Interpolate audio params on each frame
 *  0.1 is smooth/slow
 *  0.5 is snappy
 *  1.0 is raw/instant
 */
export const useSmoothFactor = () => useState<number>(() => BASE_SMOOTH_FACTOR);

export const setSmoothFactor = (value: number) => {
  useSmoothFactor().value = value;
};
