import * as THREE from 'three';
import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Scenes } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { random, randomInt, chance, sinCycle, mapQuantize, mapClamp } from "~/composables/utils/math";
import { midiState } from '~/composables/controls/MIDI';

const dummy = new THREE.Object3D();
let _count = 0;

export const sceneScripts: Partial<Record<Scenes, Scene3DScript>> = {
  [Scenes.ASFAY]: {
    init: (engine) => {
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      shapes.setVisibility(false);
    },
    update: (engine) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const SHAPE_GROUPS = 6;
      const PITCH_RANGE = { min: 0.3, max: 0.6 };
      const HARMONIES_RANGE = { min: 0.05, max: 0.95 };
      const ROT_RANGE = { min: 0, max: 0.25 }

      // Computed audio values + MIDI
      const activeGroup = mapQuantize(harmonies.pitch, PITCH_RANGE.min, PITCH_RANGE.max, 0, SHAPE_GROUPS);
      const harmonyImpact = mapLinear(harmonies.loudness, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max);

      // Camera params
      const CAMERA_CONFIG = { angleMin: 30, angleMax: 90, angleSpeed: 0.01 }

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeed, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        if (i % SHAPE_GROUPS == activeGroup) {
          rect.rotation.y += harmonyImpact;
        }
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 8 }, () => {
        const angle = random(CAMERA_CONFIG.angleMin, CAMERA_CONFIG.angleMax);
        engine.cameraRotate(azimuth + angle, polar);
      })

      repeatEvery({ beats: 1 }, () => {
        shapes.setVisibility(false);
        shapes.data.forEach((_, i) => {
          if (chance(harmonyImpact)) {
            shapes.setInstanceVisibility(i, true)
          }
        })

      })
    }
  },

  [Scenes.CONFINE]: {
    init: (engine) => {
      const shapes = engine.elements.get('flock-1');
      if (!shapes) return;

      // Set random frequency to each element for more natural movement
      shapes.data.forEach(rect => {
        if (!rect.params) {
          rect.params = {};
          rect.params.frequency = 0;
          rect.params.targetFrequency = 0;
        }
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery, beatCycle, barProgress } = engine.audioManager;
      const { knob2, knob3, knob4 } = midiState;
      const shapes = engine.elements.get('flock-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const FREQ_BASE = time * 0.001;
      const driftFreqX = FREQ_BASE * 1.25;
      const driftFreqY = beatCycle(time, { beats: 8 });
      const swarmFreq = beatCycle(time, { beats: 16, offset: 4 });

      // Computed audio values + MIDI
      const drumImpact = drums.loudness;
      const harmonyImpact = harmonies.loudness * 25;
      const driftIntensityX = 5 + knob2 * 80;
      const driftIntensityY = 15 + knob3 * 40;
      const swarmIntensityX = 200 + knob4 * 25;

      // Camera params
      const CAMERA_CONFIG = { zoomMin: 200, zoomSpeed: -0.1 };

      // --- 2. GLOBAL & CAMERA SECTION ---
      const distance = engine.controls.getDistance();
      if (distance > CAMERA_CONFIG.zoomMin) engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        const indexOffset = i * 0.02;
        const driftX = Math.sin(driftFreqX * rect.params?.frequency) * (driftIntensityX + harmonyImpact);
        const driftY = Math.cos(driftFreqY + indexOffset) * driftIntensityY;
        const swarmX = Math.sin(swarmFreq + indexOffset) * (drumImpact + swarmIntensityX);

        rect.renderPosition.x += driftX + swarmX;
        rect.renderPosition.y += driftY;

        // Update frequency smoothly for a less repetitive individual motion
        rect.params.frequency += (rect.params.targetFrequency - rect.params?.frequency) * barProgress(time) * 0.005;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---      
      repeatEvery({ beats: 4 }, () => {
        shapes.data.forEach((rect, i) => {
          // Set a new target frequency
          if (chance(0.5)) {
            rect.params.targetFrequency = rect.params.frequency + random(-0.25, 0.25);
          }
        })
      })
    }
  },

  [Scenes.DATASET]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const { knob1 } = midiState;
      const shapes = engine.elements.get('particles-1');
      if (!shapes) return;

        // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0, max: 0.1 };
      const SHAPE_LOUDNESS_RANGE = { min: 0.25, max: 1 };
      const SHAPE_ROTATION_RANGE = { min: 0, max: 0.01 };
      
      // Computed audio values + MIDI
      const harmonyRotation = mapClamp(harmonies.loudness, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const drumsRotation = mapClamp(drums.centroid, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const harmonyImpact = mapClamp(harmonies.loudness, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraSpeed = harmonyImpact + knob1 * 0.1;
      const originSpeed = 0.02 + harmonyImpact;

      // Camera params
      const CAMERA_CONFIG = {
        zoomMin: 200,
        zoomCycle: 0.25 * beatCycle(time, { beats: 8 }),
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraRotate(azimuth + cameraSpeed, polar);
      engine.cameraZoom(CAMERA_CONFIG.zoomCycle);

      // Global layout shift
      if (shapes.config.layout.origin.y < 0) {
        shapes.config.layout.origin.y += originSpeed;
      }      

      // --- 3. INSTANCE TRANSFORMATIONS ---
      const columns = shapes.config.layout.dimensions?.x ?? 1;

      shapes.data.forEach((rect, i) => {
        const row = Math.floor(i / columns);
        const rotationIncr = (row % 2 === 0) ? harmonyRotation : drumsRotation;
        const hoverMotion = beatCycle(time, { beats: 8, offset: i * Math.PI / 4 });

        // Subtle hover motion
        rect.renderPosition.y = rect.position.y + hoverMotion;

        // Audio-driven rotation
        rect.renderRotation.x += rotationIncr * 0.5;
        rect.renderRotation.y += rotationIncr;
        rect.renderRotation.z += rotationIncr * 0.7;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    }
  },

  [Scenes.ESGIBTBROT]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const tunnel = engine.elements.get('tunnel-1');
      if (!tunnel) return;

      const { smoothedAudio } = engine.audioManager;
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      tunnel.data.forEach((ring, i) => {
        const curveTime = time * 0.0001 + mapLinear(harmonies.loudness, 0, 1, 0, 10);
        const curveIntensity = mapLinear(drums.loudness, 0, 1, 0, 50);
        const curveFreq = 0.05 * (i % 4) + mapLinear(harmonies.loudness, 0, 1, 0, 0.001);
        const amount = 1;
          // (ring.position.z - ((tunnel.config.layout.spacing?.z || 0) * (tunnel.config.layout.dimensions?.z || 0)))
          // / (tunnel.config.layout.origin.z);

        // Set the X and Y positions which the Circles.update() will then use
        // ring.renderPosition.x += Math.sin(curveFreq + curveTime) * curveIntensity;
        ring.renderPosition.y += Math.cos(curveFreq + curveTime) * (harmonies.pitch - 0.25) * 100 * amount;
        // ring.position.w = Math.max(0.01, (ring.position.z + tunnel.depth / 2) / tunnel.depth);
      });
    }
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {
      
    },
    update: (engine, time) => {
      const { smoothedAudio, master } = engine.audioManager;
      const tunnel = engine.elements.get('tunnel-1');
      const tunnel2 = engine.elements.get('tunnel-2');
      if (!tunnel || !tunnel2) return;
      
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      engine.cameraZoom(sinCycle(time, master.tempo / 8, 5));

      // 1. Modulate thickness
      if (tunnel.uniforms?.uThickness && tunnel2.uniforms?.uThickness) {
        tunnel.uniforms.uThickness.value = clamp(mapLinear(drums.loudness, 0.75, 0.85, 0.01, 0.05), 0.01, 0.05);
        tunnel2.uniforms.uThickness.value = clamp(mapLinear(drums.loudness, 0.75, 0.85, 0.01, 0.05), 0.01, 0.05);
      }

      // 2. Update ring position Y
      tunnel.data.forEach((ring, i) => {
        const curveTime = mapLinear(harmonies.loudness, 0, 1, 0, 10);
        // const curveTime = 1; //time * 0.001 + mapLinear(harmonies.loudness, 0, 1, 0, 10);
        const curveIntensity = 25 + mapLinear(texture.loudness, 0, 1, 0, 10) + i * 0.001;
        const curveFreq = mapLinear(woodwinds.loudness, 0, 1, 0.0005, 0.0025); // 0.0005 -> 0.0025

        // Set the X and Y positions which the shapes.update() will then use
        ring.renderPosition.x = ring.position.x + Math.sin(ring.renderPosition.z * curveFreq + curveTime) * curveIntensity;
        ring.renderPosition.y = ring.position.y + Math.cos(ring.renderPosition.z * curveFreq * 0.25 + curveTime) * curveIntensity;
      });

      tunnel2.data.forEach((ring, i) => {
        const curveTime = 20; // mapLinear(harmonies.loudness, 0, 1, 0, 10);
        // const curveTime = 1; //time * 0.001 + mapLinear(harmonies.loudness, 0, 1, 0, 10);
        const curveIntensity = 25; // + mapLinear(texture.loudness, 0, 1, 0, 10) + i * 0.001;
        const curveFreq = mapLinear(woodwinds.loudness, 0, 1, 0.0005, 0.0025); // 0.0005 -> 0.0025

        // Set the X and Y positions which the shapes.update() will then use
        ring.renderPosition.x = ring.position.x + Math.sin(ring.renderPosition.z * curveFreq + curveTime) * curveIntensity;
        ring.renderPosition.y = ring.position.y + Math.cos(ring.renderPosition.z * curveFreq * 0.25 + curveTime) * curveIntensity;
        // ring.renderPosition.z = Math.cos(ring.renderPosition.z * curveFreq * 0.5 + curveTime) * curveIntensity;

        // const pulse = 1 + (drums.loudness * 0.5);
        // ring.renderScale.setScalar(pulse);
      });
    }
  },

  [Scenes.GHOSTSSS]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const grid = engine.elements.get('grid-1');
      if (!grid) return;
      
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // 2. Update ring position Y
      grid.data.forEach((rect, i) => {
        rect.renderPosition.z = rect.position.z + (i % 30) / 12 * woodwinds.pitch;
        rect.renderPosition.y = rect.position.y + Math.cos(time / 250 + i) * harmonies.loudness * 25;
        // rect.renderScale.x = 2 + Math.cos(time / 250 + i) * drums.loudness * 2;
        // rect.renderScale.y = 2 + Math.cos(time / 250 + i) * drums.loudness * 2;
        rect.renderScale.x = mapLinear(rect.position.z, 400, -800, 5, 0);
        rect.renderScale.y = mapLinear(rect.position.z, 400, -800, 5, 0);

      });

     repeatEvery({ beats: 8, offset: 5 }, () => {
        grid.setVisibility(false);
        
        // const count = 1 + Math.floor((0.25 + Math.random() * 0.75) * 24 * drums.loudness);
        const count = grid.config.layout.dimensions?.x ?? 10;
        // const randomY = Math.floor(Math.random() * (grid.config.layout.dimensions?.y || 1));

        // Make entire depth rows visible
        for (let i = 0; i < count; i++) {
          const randomX = Math.floor(Math.random() * (grid.config.layout.dimensions?.x || 1));
          const randomY = Math.floor(Math.random() * (grid.config.layout.dimensions?.y || 1));
          const targetIndices = grid.getDepthRowIndices(i, randomY);
          // const targetIndices = grid.getDepthRowIndices(randomX, randomY);
          
          targetIndices.forEach(index => {
            // Update visibility
            grid.setInstanceVisibility(index, true);

            // Update speed
            if (index && grid.data[index]?.motionSpeed?.position) {
              grid.data[index].motionSpeed.position.z = -0.01 - Math.random() * 1;
            }
          });
        }
      })
    }
  },

  [Scenes.LIKE_NOTHING]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      engine.cameraRotate(time * 0.005, time * 0.002);

      const camPos = engine.getCameraPosition();
      const { smoothedAudio } = engine.audioManager;
      const grid = engine.elements.get('grid-1');
      if (!grid) return;
      
      // const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      // const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      // const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      grid.data.forEach((rect, i) => {

        dummy.position.copy(rect.position);
        dummy.lookAt(camPos);
        
        // Transfer the calculated rotation to rect data
        // you might need to add a 90-degree offset here (e.g., dummy.rotateX(Math.PI / 2))
        // dummy.rotateX(Math.PI / 2)
        rect.rotation.copy(dummy.rotation);
        
        // Update the renderRotation as well so it starts correct
        rect.renderRotation.copy(dummy.rotation);

      })
    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {

    },
    update: (engine, time) => {
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

  [Scenes.PSSST]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const tunnel = engine.elements.get('tunnel-1');
      if (!tunnel) return;

      const { azimuth } = engine.getCameraAngles();

      engine.cameraRotate(azimuth + Math.sin(time * 0.0002) * 0.025, 90);

      tunnel.data.forEach((rect, i) => {
        rect.renderPosition.x += Math.sin(time * 0.0002 + i) * 250;
        rect.renderPosition.y += Math.sin(time * 0.0003 + i) * 150;
      })
    }
  },


  [Scenes.RFBONGOS]: {
    init: (engine) => {
      const rectangles = engine.elements.get('rectangles-1');
      if (!rectangles) return;

      rectangles.setVisibility(false);

      // const camPos = engine.getCameraPosition();

      // rectangles.data.forEach(rect => {
      //   dummy.position.copy(rect.position);
      //   dummy.lookAt(camPos);
        
      //   // Transfer the calculated rotation to rect data
      //   // you might need to add a 90-degree offset here (e.g., dummy.rotateX(Math.PI / 2))
      //   // dummy.rotateX(Math.PI / 2)
      //   rect.rotation.copy(dummy.rotation);
        
      //   // Update the renderRotation as well so it starts correct
      //   rect.renderRotation.copy(dummy.rotation);
      // });

      // 4. Important: Trigger a draw to commit these rotations to the GPU immediately
      // rectangles.draw();

    },
    update: (engine, time) => {
      const { smoothedAudio } = engine.audioManager;

      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      // const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      const camPos = engine.getCameraPosition();
      const { azimuth } = engine.getCameraAngles();
      const baseAcceleration = 0.1;
      const acceleration = clamp(mapLinear(drums.loudness, 0.25, 0.6, 0, 0.1), 0, 0.5);

      engine.cameraZoom(0.02);
      engine.cameraRotate(azimuth + baseAcceleration + acceleration, 90);

      const rectangles = engine.elements.get('rectangles-1');
      if (!rectangles) return;

      
      rectangles.data.forEach((rect, i) => {
        dummy.position.copy(rect.position);
        dummy.lookAt(camPos);
        
        // Transfer the calculated rotation to rect data
        // you might need to add a 90-degree offset here (e.g., dummy.rotateX(Math.PI / 2))
        dummy.rotateX(Math.PI / 2)
        rect.rotation.copy(dummy.rotation);
        
        // Update the renderRotation as well so it starts correct
        rect.renderRotation.copy(dummy.rotation);

        const angle = Math.PI * 0.25 + (i % 4)
        rect.renderRotation.x = mapLinear(drums.loudness, 0.3, 0.5, angle, angle + Math.PI * (i%2 == 0 ? -0.5 : 0.5))
      })

      if (drums.onOff) {
        rectangles.setVisibility(false);
        const count = Math.floor(drums.loudness * 24 + (2 * Math.random()));
        for (let i = 0; i < count; i++) {
          const index = Math.floor(rectangles.data.length * Math.random());
          rectangles.setInstanceVisibility(index, true);
        }
      }
    }
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {
      _count = 0;
    },
    update: (engine, time) => {

      // const { azimuth } = engine.getCameraAngles();
      const { smoothedAudio, repeatEvery } = engine.audioManager;

      repeatEvery({ beats: 5 }, () => {
        // Activate
        const target = _count % 4;
        const elements = [
          engine.elements.get('sphere-1'),
          engine.elements.get('sphere-2'),
          engine.elements.get('sphere-3'),
          engine.elements.get('sphere-4'),
        ];

        elements.forEach(el => el?.setVisibility(false));
        elements[target]?.setVisibility(true);

        elements[target]?.data.forEach(rect => {
          // Logic to expand shapes radially

        });

        _count++;
      })
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      _count = 0;
    },
    update: (engine, time) => {
      const zoom = engine.controls.getDistance();

      if (zoom < 750) engine.cameraZoom(0.1);
      engine.cameraRotate(0, 90 + Math.sin(time * 0.0005) * 15);      

      const { smoothedAudio, master, repeatEvery } = engine.audioManager;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      const grid = engine.elements.get('grid-1');
      if (!grid) return;

      // TEMPO / 10: toggle visibility following index
      repeatEvery({ beats: 1 }, () => {
          const columns = grid.config.layout.dimensions?.x || 10;
          const multipleA = columns / 2 + Math.floor(Math.random() * 7);
          const multipleB = columns / 4 + Math.floor(Math.random() * columns);
          const targetA = 3 + Math.floor(Math.random() * 9);
          const targetB = 2 + Math.floor(Math.random() * 12);
          grid.setVisibility(false);

          grid.data.forEach((_, i) => {
            if ((i + _count) % multipleA < targetA || (i + _count) % multipleB < targetB) {
              grid.setInstanceVisibility(i, true);
            }
          })
          _count++;
        }
      )

      // SCENE LOGIC: Modify rotation Y based on tempo
      grid.data.forEach((rect, i) => {
        rect.rotation.y += 4 / master.tempo;
        rect.renderPosition.z = rect.position.z + Math.sin(time * 0.0001 + i * 0.02) * bass.loudness * 50;
      });
    }
  },

    [Scenes.TUFTEEE]: {
    init: (engine) => {
      const grid = engine.elements.get('grid-1');
      if (!grid) return;

      const columns = grid.config.layout.dimensions?.x ?? 1;

      grid.data.forEach((rect, i) => {
        if (rect.motionSpeed && Math.floor(i / columns) % 2 === 0 ) {
          rect.motionSpeed.position.x *= -1;
        }
      });

    },
    update: (engine, time) => {
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const grid = engine.elements.get('grid-1');
      if (!grid) return;
      
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // 2. Update ring position Y
      grid.data.forEach((rect, i) => {
        if (rect.motionSpeed) {
          rect.motionSpeed.scale.x = Math.sin(time * 0.002 + i * 0.08) * harmonies.centroid * drums.centroid;
          rect.position.x -= rect.motionSpeed.position.x * (1 - harmonies.loudness) * 0.75;
        }
      });
    }
  },

  [Scenes.USBTEC]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const flock = engine.elements.get('flock-1');
      if (!flock) return;
      
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      flock.data.forEach((rect, i) => {
        rect.scale.x += rect.scale.x * 0.0001;
        rect.scale.y += rect.scale.y * 0.0001;
        rect.scale.z += rect.scale.z * 0.0001;
      })

      repeatEvery({ beats: 4 }, () => {
        flock.data.forEach((rect, i) => {
          if (Math.random() > 0.25 && rect.motionSpeed) {
            rect.scale.x = 1;
            rect.scale.y = 1;
            rect.scale.z = 1;
          }
        })
      })
    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const { smoothedAudio } = engine.audioManager;

      const flock1 = engine.elements.get('flock-1');
      const flock2 = engine.elements.get('flock-2');

      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Update rectangle speed
      if (flock1) {
        flock1.data.forEach((rect, i) => {
          rect.position.y -= rect.motionSpeed?.position.y! * mapLinear(bass.loudness, 0, 0.8, 0, 1);
        });
      }

      if (flock2) {
        flock2.data.forEach((rect, i) => {
          rect.position.y -= rect.motionSpeed?.position.y! * mapLinear(harmonies.loudness, 0, 0.8, 0, 1);
        });
      }
    },
  },
  
  [Scenes.ZOHO]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      const { smoothedAudio } = engine.audioManager;

      const { azimuth, polar } = engine.getCameraAngles();
      const baseAccelerationX = 0.005;
      const baseAccelerationY = 0.01;

      engine.cameraZoom(-0.005);
      engine.cameraRotate(azimuth + baseAccelerationX, polar + baseAccelerationY);

      const flock = engine.elements.get('flock-1');
      if (!flock) return;

      // const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      // const columns = flock.config.layout.dimensions?.x ?? 1;

      // 1. Update rectangle position X
      flock.data.forEach((rect, i) => {
        rect.renderPosition.x += Math.sin(time * 0.0002) * 200;
        rect.renderPosition.z += Math.cos(time * 0.0002) * 200;
        rect.renderPosition.y += -50 + 100 * mapLinear(harmonies.pitch, 0.4, 0.65, 0, 1);
      });
    },
  }
};