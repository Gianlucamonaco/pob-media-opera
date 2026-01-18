import { lerp } from "three/src/math/MathUtils.js";
import { ChannelNames } from "~/data/constants";

// This object holds the values that are actually used by the 3D engine
const smoothedAudio = reactive(
  Array.from({ length: Object.keys(ChannelNames).length - 1 }, () => ({
    pitch: 0,
    loudness: 0,
    centroid: 0,
    flatness: 0,
  }))
);

export const useAudioManager = () => {
  const { $wsAudio } = useNuxtApp() as any;

  const master = $wsAudio[ChannelNames.MASTER_CTRL];

  // 0.1 is smooth/slow, 0.5 is snappy, 1.0 is raw/instant
  const factor = 0.15; 

  const update = () => {
    for (let key in $wsAudio) {
      const target = $wsAudio[key];
      const current = smoothedAudio[key];

      if (!target || !current) continue;

      // Smooth each parameter
      current.pitch = lerp(current.pitch, target.pitch || 0, factor);
      current.loudness = lerp(current.loudness, target.loudness || 0, factor);
      current.centroid = lerp(current.centroid, target.centroid || 0, factor);
      current.flatness = lerp(current.flatness, target.flatness || 0, factor);
    }

  };

  return { smoothedAudio, master, update };
};