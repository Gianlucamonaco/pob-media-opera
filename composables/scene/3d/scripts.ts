import { sinCycle } from "~/composables/utils/math";
import type { Rectangles } from "~/composables/shapes/3d/rectangles";
import { ChannelNames, Scenes } from "~/data/constants";
import type { SceneScript } from "~/data/types";
import { clamp, mapLinear } from "three/src/math/MathUtils.js";

let _prog = 0;
let _state = 0;

export const sceneScripts: Partial<Record<Scenes, SceneScript>> = {
  [Scenes.DATASET]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // engine.cameraZoom(sinCycle(time, 120, 0.5))
      // engine.cameraRotate(time * 0.001, 90)

      const { $wsAudio } = useNuxtApp() as any;
      const shapes = engine.shapes.elements[0] as Rectangles;
      const drums = $wsAudio[ChannelNames.PB_CH_1_DRUMS];
      const harmonies = $wsAudio[ChannelNames.PB_CH_3_HARMONIES];

      let param;

      shapes.data.forEach((rect, i) => {
        // Each instrument controls a row
        const row = Math.floor(i / shapes.gridColumns);

        if (row % 2 == 0) param = harmonies.loudness;
        else param = drums.centroid;

        rect.position.y = rect.position.y + Math.sin(time + (i*Math.PI/4)) * 0.05;
        rect.rotation.x += clamp(mapLinear(param, 0.25, 1, 0, 0.005), 0, 1);
        rect.rotation.y += clamp(mapLinear(param, 0.25, 1, 0, 0.010), 0, 1);
        rect.rotation.z += clamp(mapLinear(param, 0.25, 1, 0, 0.007), 0, 1);
      });

    }
  },

  [Scenes.GHOSTSSS]: {
    update: (engine, time) => {
      engine.cameraZoom(sinCycle(time, 10, 1))
    }
  },

  [Scenes.LIKE_NOTHING]: {
    init: (engine) => {
      const shapes = engine.shapes.elements;
      if (!shapes) return;

      engine.registerInterval(setInterval(() => {
        shapes[1].setVisibility(false);
        for (let i = 0; i < 10; i++) {
          const index = Math.round(shapes[1].count * Math.random());
          shapes[1].setInstanceVisibility(index, true);
        }
      }, 250));
    },
    update: (engine, time) => {
      engine.cameraRotate(time * 0.005, 90);
    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {

    },
    update: (engine) => {
      engine.cameraZoom(0.05);

      const { $wsAudio } = useNuxtApp() as any;
      const shapes = engine.shapes.elements[0] as Rectangles;
      const drums = $wsAudio[ChannelNames.PB_CH_1_DRUMS];
      const harmonies = $wsAudio[ChannelNames.PB_CH_3_HARMONIES];

      shapes.data.forEach((rect, i) => {
        // Each instrument controls a row
        const row = Math.floor(i / shapes.gridColumns);
        if (row % 2 == 0) {
          rect.position.x += 0.20 * clamp(harmonies.loudness, 0, 1);
          rect.position.y += 0.02 * clamp(mapLinear(harmonies.pitch, 0.2, 0.5, -1, 1), -1, 1);
        }
        else {
          rect.position.x += 0.05 * (drums.flatness || 0);
        }
      });
    }
  },

  [Scenes.RFBONGOS]: {
    init: (engine) => {
      _prog = 0;
      _state = 0;

      const shapes = engine.shapes.elements[0];
      if (!shapes) return;

      shapes.setVisibility(false);
    },
    update: (engine) => {
      engine.cameraZoom(0.02);

      // Get the rectangles instance
      const shapes = engine.shapes.elements[0] as Rectangles;
      if (!shapes) return;

      const { $wsAudio } = useNuxtApp() as any;
      const drums = $wsAudio[ChannelNames.PB_CH_1_DRUMS];
      
      // SCENE LOGIC: Visibility triggers
      const _prev = _prog;

      if (_state == 0 && drums.onOff == 1) {
        _state = 1;
        _prog++;
      }

      // Hide all elements When on/off is 0
      else if (_state == 1 && drums.onOff == 0) {
        _state = 0;
        shapes.setVisibility(false);
      }

      // Show new elements every time the on/off count increases
      if (_prog > _prev) {
        const count = Math.floor(drums.loudness * 4 + (2 * Math.random()));

        for (let i = 0; i < count; i++) {
          const index = Math.floor(shapes.data.length * Math.random());
          shapes.setInstanceVisibility(index, true);
        }
      }
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      _prog = 0;

      const shapes = engine.shapes.elements[0] as Rectangles;
      if (!shapes) return;

      // Offset rectangles rotation Y based on index
      shapes.data.forEach((rect, index) => {
        rect.rotation.y += index / 180 * Math.PI;
      });

    },
    update: (engine, time) => {
      if (engine.controls.getDistance() < 500) engine.cameraZoom(0.05);
      engine.cameraRotate(0, 90 + Math.sin(time / 350) * 15);
      
      // Get the rectangles instance
      const shapes = engine.shapes.elements[0] as Rectangles;
      if (!shapes) return;

      const { $wsAudio } = useNuxtApp() as any;
      const master = $wsAudio[ChannelNames.MASTER_CTRL];

      // TEMPO / 10: toggle visibility following index
      if (time % Math.round(master.tempo / 10) == 1) {
        shapes.setVisibility(false);
        for (let i = 0; i < shapes.gridRows * shapes.gridColumns; i++) {
          if ((i + _prog) % 15 < 9) shapes.setInstanceVisibility(i, true);
        }
        _prog++;
      }

      // SCENE LOGIC: Modify rotation Y based on tempo
      shapes.data.forEach((rect) => {
        rect.rotation.y += 4 / master.tempo;
      });
    }
  },

};