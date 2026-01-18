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

export const useAudioManager = () => {
  const { $wsAudio } = useNuxtApp() as any;
  const factor = useSmoothFactor();
  const master = $wsAudio[ChannelNames.MASTER_CTRL];

  const update = () => {
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
  };

  /** Reset audio params */
  const reset = (delay = BASE_AUDIO_INTERVAL) => {
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

  return { smoothedAudio, master, update, reset };
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
