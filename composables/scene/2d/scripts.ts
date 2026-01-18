import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { sinCycle } from "~/composables/utils/math";
import { Scenes } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";

let _prog = 0;
let _state = 0;

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.DATASET]: {
    init: (engine) => {
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('scan-1');
    },
    update: (engine, time) => {
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('scan-1');
    }
  }
}
