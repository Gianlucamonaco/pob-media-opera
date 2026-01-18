import { ChannelNames, Scenes } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { sinCycle } from "~/composables/utils/math";
import { ShaderMaterial } from "three";

let _prog = 0;
let _state = 0;

export const sceneScripts: Partial<Record<Scenes, Scene3DScript>> = {
  [Scenes.DATASET]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('particles-1');
      if (!shapes) return;

      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const columns = shapes.config.layout.dimensions?.x ?? 1;
      const acceleration = clamp(mapLinear(harmonies.loudness, 0.2, 0.6, 0, 0.1), 0, 1);
      const { azimuth } = engine.getCameraAngles();

      engine.cameraRotate(azimuth + acceleration, 90);
      
      if (shapes.config.layout.origin.y < 0) {
        shapes.config.layout.origin.y += 1 + acceleration * 50;
      }
      
      let param;

      shapes.data.forEach((rect, i) => {
        // Each instrument controls a row
        const row = Math.floor(i / columns);

        if (row % 2 == 0) param = harmonies.loudness;
        else param = drums.centroid;

        rect.renderPosition.y = rect.position.y + Math.sin(time + (i*Math.PI/4)) * 0.05;
        rect.renderRotation.x += clamp(mapLinear(param, 0.25, 1, 0, 0.005), 0, 1);
        rect.renderRotation.y += clamp(mapLinear(param, 0.25, 1, 0, 0.010), 0, 1);
        rect.renderRotation.z += clamp(mapLinear(param, 0.25, 1, 0, 0.007), 0, 1);
      });
    }
  },

  [Scenes.ESGIBTBROT]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const shapes = engine.elements.get('shapes');
      if (!shapes) return;

      const { $wsAudio } = useNuxtApp() as any;
      const drums = $wsAudio[ChannelNames.PB_CH_1_DRUMS];
      const bass = $wsAudio[ChannelNames.PB_CH_2_BASS];
      const harmonies = $wsAudio[ChannelNames.PB_CH_3_HARMONIES];

      // shapes.data.forEach((ring, i) => {
      //   const curveTime = 1000; // time * 0.0001 + mapLinear(harmonies.loudness, 0, 1, 0, 10);
      //   const curveIntensity = 5; // + mapLinear(drums.loudness, 0, 1, 0, 5);
      //   const curveFreq = 0.02; // 0.005 * (i % 4) + mapLinear(harmonies.loudness, 0, 1, 0, 0.001);

      //   // Set the X and Y positions which the Circles.update() will then use
      //   ring.x = Math.sin(ring.z * curveFreq + curveTime) * curveIntensity;
      //   ring.y = Math.cos(ring.z * curveFreq * 0.5 + curveTime) * curveIntensity;
      //   ring.w = Math.max(0.01, (ring.z + shapes.depth / 2) / shapes.depth);
      // });
    }
  },

  [Scenes.GHOSTSSS]: {
    update: (engine, time) => {
      const { smoothedAudio } = engine.audioManager;
      const tunnel = engine.elements.get('tunnel-1');
      const tunnel2 = engine.elements.get('tunnel-2');
      if (!tunnel || !tunnel2) return;
      
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // engine.cameraZoom(sinCycle(time, master.tempo / 16, 2));

      // 1. Modulate thickness
      if (tunnel.uniforms?.uThickness && tunnel2.uniforms?.uThickness) {
        tunnel.uniforms.uThickness.value = clamp(mapLinear(drums.loudness, 0.3, 0.6, 0.02, 0.1), 0.01, 0.15);
        tunnel2.uniforms.uThickness.value = clamp(mapLinear(drums.loudness, 0.3, 0.6, 0.02, 0.1), 0.01, 0.35);
      }

      // 2. Update ring position Y
      tunnel.data.forEach((ring, i) => {
        const curveTime = mapLinear(harmonies.loudness, 0, 1, 0, 10);
        // const curveTime = 1; //time * 0.001 + mapLinear(harmonies.loudness, 0, 1, 0, 10);
        const curveIntensity = 25 + mapLinear(texture.loudness, 0, 1, 0, 10) + i * 0.001;
        const curveFreq = mapLinear(woodwinds.loudness, 0, 1, 0.0005, 0.0025); // 0.0005 -> 0.0025

        // Set the X and Y positions which the shapes.update() will then use
        ring.renderPosition.x = Math.sin(ring.renderPosition.z * curveFreq + curveTime) * curveIntensity;
        ring.renderPosition.y = Math.cos(ring.renderPosition.z * curveFreq * 0.25 + curveTime) * curveIntensity;

      });

      tunnel2.data.forEach((ring, i) => {
        const curveTime = mapLinear(harmonies.loudness, 0, 1, 0, 10);
        // const curveTime = 1; //time * 0.001 + mapLinear(harmonies.loudness, 0, 1, 0, 10);
        const curveIntensity = 25 + mapLinear(texture.loudness, 0, 1, 0, 10) + i * 0.001;
        const curveFreq = mapLinear(woodwinds.loudness, 0, 1, 0.0005, 0.0025); // 0.0005 -> 0.0025

        // Set the X and Y positions which the shapes.update() will then use
        ring.renderPosition.x = Math.sin(ring.renderPosition.z * curveFreq + curveTime) * curveIntensity;
        ring.renderPosition.y = Math.cos(ring.renderPosition.z * curveFreq * 0.25 + curveTime) * curveIntensity;
        // ring.renderPosition.z = Math.cos(ring.renderPosition.z * curveFreq * 0.5 + curveTime) * curveIntensity;

        // const pulse = 1 + (drums.loudness * 0.5);
        // ring.renderScale.setScalar(pulse);
      });
    }
  },

  [Scenes.LIKE_NOTHING]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      engine.cameraRotate(time * 0.005, 90);
    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {

    },
    update: (engine) => {
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      engine.cameraZoom(0.05);

      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const columns = shapes.config.layout.dimensions?.x ?? 1;

      // 1. Update rectangle position X
      shapes.data.forEach((rect, i) => {
        const row = Math.floor(i / columns);
        if (row % 2 == 0) {
          rect.position.x += mapLinear(harmonies.loudness, 0.05, 0.95, 0, 0.25);
          rect.renderPosition.y += clamp(mapLinear(harmonies.pitch, 0.2, 0.5, -0.2, 0.2), -0.25, 0.25);
        }
        else {
          rect.position.x += mapLinear(drums.flatness, 0.05, 0.95, 0, 0.25);
        }
      });
    }
  },

  [Scenes.RFBONGOS]: {
    init: (engine) => {
      _prog = 0;
      _state = 0;

      const shapes = engine.elements.get('shapes');
      if (!shapes) return;

      // shapes.setVisibility(false);
    },
    update: (engine) => {
      const shapes = engine.elements.get('shapes');
      if (!shapes) return;
      
      const { $wsAudio } = useNuxtApp() as any;
      const drums = $wsAudio[ChannelNames.PB_CH_1_DRUMS];
      
      engine.cameraZoom(0.02);

      // SCENE LOGIC: Visibility triggers
      // const _prev = _prog;

      // if (_state == 0 && drums.onOff == 1) {
      //   _state = 1;
      //   _prog++;
      // }

      // // Hide all elements When on/off is 0
      // else if (_state == 1 && drums.onOff == 0) {
      //   _state = 0;
      //   shapes.setVisibility(false);
      // }

      // // Show new elements every time the on/off count increases
      // if (_prog > _prev) {
      //   const count = Math.floor(drums.loudness * 4 + (2 * Math.random()));

      //   for (let i = 0; i < count; i++) {
      //     const index = Math.floor(shapes.data.length * Math.random());
      //     shapes.setInstanceVisibility(index, true);
      //   }
      // }
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      _prog = 0;

      const shapes = engine.elements.get('shapes');
      if (!shapes) return;

      // Offset rectangles rotation Y based on index
      // shapes.data.forEach((rect, index) => {
      //   rect.rotation.y += index / 180 * Math.PI;
      // });

    },
    update: (engine, time) => {
      const shapes = engine.elements.get('shapes');
      if (!shapes) return;

      if (engine.controls.getDistance() < 500) engine.cameraZoom(0.05);
      engine.cameraRotate(0, 90 + Math.sin(time / 350) * 15);      

      const { $wsAudio } = useNuxtApp() as any;
      const master = $wsAudio[ChannelNames.MASTER_CTRL];

      // TEMPO / 10: toggle visibility following index
      // if (time % Math.round(master.tempo / 10) == 1) {
      //   shapes.setVisibility(false);
      //   for (let i = 0; i < shapes.gridRows * shapes.gridColumns; i++) {
      //     if ((i + _prog) % 15 < 9) shapes.setInstanceVisibility(i, true);
      //   }
      //   _prog++;
      // }

      // // SCENE LOGIC: Modify rotation Y based on tempo
      // shapes.data.forEach((rect) => {
      //   rect.rotation.y += 4 / master.tempo;
      // });
    }
  },

};