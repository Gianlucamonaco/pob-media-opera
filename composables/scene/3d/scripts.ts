import { Scenes } from "~/data/constants";
import { sinCycle } from "~/composables/utils/math";
import type { SceneScript } from "~/data/types";

export const sceneScripts: Partial<Record<Scenes, SceneScript>> = {
  [Scenes.GHOSTSSS]: {
    update: (engine, time) => {
      engine.cameraZoom(sinCycle(time, 3, 1))
    }
  },

  [Scenes.LIKE_NOTHING]: {
    init: (engine) => {
      engine.shapes.elements[0].setVisibility(true);
      engine.registerInterval(setInterval(() => {
        engine.shapes.elements[1]?.setVisibility(false);
        for (let i = 0; i < 10; i++) {
          const index = Math.round(engine.shapes.elements[1].count * Math.random());
          engine.shapes.elements[1].setInstanceVisibility(index, true);
        }
      }, 250));
    },
    update: (engine, time) => {
      engine.cameraRotate(time * 0.015, 90)
    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {
      const shapes = engine.shapes.elements[0];
      shapes.setVisibility(true);
    },
    update: (engine) => {
      engine.cameraZoom(0.02)
    }
  },

  [Scenes.RFBONGOS]: {
    init: (engine) => {
    },
    update: (engine) => {
      engine.cameraZoom(0.02)
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      let prog = 0;

      engine.registerInterval(setInterval(() => {
        const shapes = engine.shapes.elements[0];
        shapes.setVisibility(false);
        for (let i = 0; i < shapes.gridRows * shapes.gridColumns; i++) {
          if ((i + prog) % 15 < 9) shapes.setInstanceVisibility(i, true);
        }
        prog++;
      }, 100));
    },
    update: (engine, time) => {
      if (engine.controls.getDistance() < 500) engine.cameraZoom(0.05);
      engine.cameraRotate(0, 90 + Math.sin(time / 350) * 15);
    }
  },

};