import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { sinCycle } from "~/composables/utils/math";
import { ChannelNames, Scenes } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";
import { useSceneBridge } from "../bridge";
import { scene3DConfig } from "~/data/scene3DConfig";
import { scene2DConfig } from "~/data/scene2DConfig";

let _prog = 0;
let _state = 0;
let _store = [] as any[];

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.DATASET]: {
    init: (engine) => {
      _prog = 0;
      _state = 0;
      _store = [];

    },
    update: (engine, time) => {
      const { screenPositions } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const config3D = scene3DConfig[Scenes.DATASET];
      const config2D = scene2DConfig[Scenes.DATASET];
      const maxScans = config2D?.elements[0]?.layout.count;
      const { x, y, z } = config3D?.elements[0]?.layout.dimensions ?? {};

      if (!x || !y || !z || !maxScans) return;

      if (screenPositions.size) {
        useSceneBridge().setInstancesScreenPositions('particles-1', _store);

        if (Math.random() > 0.9) {
          const currentList = Array.from(screenPositions)[0];
          if (currentList) {
            useSceneBridge().removeScreenPosition(currentList[0]);
            _store = _store.filter(i => i !== currentList[0])
          }
        }
      }

      if (harmonies.loudness > 0.62 && Math.random() > 0.5) {
        _state = 1;
        const count = Math.floor(Math.random() * (maxScans - screenPositions.size) * harmonies.loudness);
        if (count === 0) return;

        // Select new instances and store positions
        _store.push(...Array(count).fill(null).map(_ => Math.floor(Math.random() * x * y * z)));

        useSceneBridge().setInstancesScreenPositions('particles-1', _store);
      }
    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _store = [];
    }

  }
}
