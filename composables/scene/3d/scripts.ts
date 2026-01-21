import * as THREE from 'three';
import { clamp, mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Scenes } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { random, randomInt, chance, mapQuantize, mapClamp } from "~/composables/utils/math";
import { midiState } from '~/composables/controls/MIDI';
import { useSceneManager } from '../manager';
import { useSceneBridge } from '../bridge';

const dummy = new THREE.Object3D();

let _count = 0;
let _store = [] as any[];

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
        rect.params = {};
        rect.params.frequency = 0;
        rect.params.targetFrequency = 0;
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
        const driftX = Math.sin(driftFreqX * rect.params.frequency) * (driftIntensityX + harmonyImpact);
        const driftY = Math.cos(driftFreqY + indexOffset) * driftIntensityY;
        const swarmX = Math.sin(swarmFreq + indexOffset) * (drumImpact + swarmIntensityX);

        rect.renderPosition.x += driftX + swarmX;
        rect.renderPosition.y += driftY;

        // Update frequency smoothly for a less repetitive individual motion
        rect.params.frequency += (rect.params.targetFrequency - rect.params.frequency) * barProgress(time) * 0.005;
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
      const { screenPositions, setInstancesScreenPositions, removeScreenPosition } = useSceneBridge();
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const { knob1 } = midiState;
      const elements2D = useSceneManager().scene2D.value?.elements.get('scan-1');;
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
      const harmonyThreshold = harmonies.loudness > 0.62;
      const cameraSpeed = harmonyImpact + knob1 * 0.1;
      const originSpeed = 0.02 + harmonyImpact;
      const addScanChance = chance(0.2);
      const removeScanChance = chance(0.5);
      const scanIncrement = harmonies.loudness;

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
      
      // Add instance screen position for 2D scan
      if (elements2D && addScanChance && harmonyThreshold) {
        if (!shapes.config.layout.dimensions) return;

        const maxScans = (elements2D.config.layout.count ?? 1) * scanIncrement;
        const shapesCount = shapes.data.length;
        const count = randomInt(0, (maxScans - screenPositions.size));

        // Select new random indexes and update the local _store
        if (count) _store.push(...Array(count).fill(null).map(_ => randomInt(0, shapesCount)));

        // Add new instance positions
        if (_store.length) setInstancesScreenPositions('particles-1', _store);
      }

      // remove instance screen positions for 2D scan
      if (screenPositions.size) {
        if (removeScanChance) {
          const currentList = Array.from(screenPositions)[0];
    
          if (currentList) {
            // Remove always the oldest
            removeScreenPosition(currentList[0]);
            _store = _store.filter(i => i !== currentList[0])
          }
        }

        // Update selected instance positions on every frame
        setInstancesScreenPositions('particles-1', _store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _store = [];
    }
  },

  [Scenes.ESGIBTBROT]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('tunnel-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const TIME_BASE = time * 0.0001;

      // Computed audio values + MIDI
      const curveTime = mapLinear(harmonies.loudness, 0, 1, TIME_BASE, TIME_BASE + 10);
      const harmonyLoudness = (harmonies.pitch - 0.25) * 100;
      const harmonyImpact = harmonies.loudness * 0.001;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((ring, i) => {
        const indexOffset = 0.05 * (i % 4)
        const curveFreq = indexOffset + harmonyImpact;

        // Subtle up-down motion (to be improved)
        ring.renderPosition.y += Math.cos(curveFreq + curveTime) * harmonyLoudness;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {
      
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const shapes = [
        engine.elements.get('tunnel-1'),
        engine.elements.get('tunnel-2')
      ];
      if (!shapes?.[0] || !shapes[1]) return;

      // Audio channels

      // Constants

      // Computed audio values + MIDI

      // Camera params
      const CAMERA_CONFIG = {
        zoomCycle: 5 * beatCycle(time, { beats: 8 }),
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(CAMERA_CONFIG.zoomCycle);

      // --- 3. INSTANCE TRANSFORMATIONS ---


      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      
    }
  },

  [Scenes.GHOSTSSS]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // Constants
      const WAVE_SPEED = 250;
      const HARMONY_AMP = 25;
      const Z_START = 400;
      const Z_END = -800;

      // Computed audio values + MIDI
      const harmonyImpact = harmonies.loudness * HARMONY_AMP;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        // Depth-based pitch shifting
        rect.renderPosition.z = rect.position.z + (i % 30) / 12 * woodwinds.pitch;

        // Harmonic wave
        rect.renderPosition.y = rect.position.y + Math.cos(time / WAVE_SPEED + i) * harmonyImpact;

        // Scale mapping (Distance-based sizing)
        const scale = mapLinear(rect.position.z, Z_START, Z_END, 5, 0);
        rect.renderScale.set(scale, scale, 1);
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 8, offset: 5 }, () => {
        shapes.setVisibility(false);

        const cols = shapes.config.layout.dimensions?.x ?? 10;
        const rows = shapes.config.layout.dimensions?.y ?? 1;

        // Once for each column (on the X axis)
        for (let i = 0; i < cols; i++) {
          const randomY = randomInt(0, rows - 1);
          const targetIndices = shapes.getDepthRowIndices(i, randomY);

          // Make entire depth row visible
          targetIndices.forEach(index => {
            shapes.setInstanceVisibility(index, true);
            if (shapes.data[index]?.motionSpeed?.position) {
              shapes.data[index].motionSpeed.position.z = -0.01 - random();
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
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const grid = engine.elements.get('grid-1');
      if (!grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // Constants
      const BASE_FREQ = time * 0.001;

      // Computed audio values + MIDI
      
      // Camera params
      const cameraPos = engine.getCameraPosition();
      const CAMERA_CONFIG = { azimuth: BASE_FREQ * 5, polar: BASE_FREQ * 2 }

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraRotate(CAMERA_CONFIG.azimuth, CAMERA_CONFIG.polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      grid.data.forEach((rect, i) => {
        dummy.position.copy(rect.position);
        dummy.lookAt(cameraPos);
        
        // Transfer the calculated rotation to rect data
        // you might need to add a 90-degree offset here
        // dummy.rotateX(Math.PI / 2)
        rect.rotation.copy(dummy.rotation);
        
        // Update the renderRotation as well so it starts correct
        rect.renderRotation.copy(dummy.rotation);
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      
      // Computed audio values + MIDI
      const harmoniesImpact = mapLinear(harmonies.loudness, 0.05, 0.95, 0, 0.25);
      const harmoniesPitch = mapClamp(harmonies.pitch, 0.2, 0.5, -0.2, 0.2);
      const drumsFlatness = mapLinear(drums.flatness, 0.05, 0.95, 0, 0.25);

      // Camera params
      const CAMERA_CONFIG = {
        zoomSpeed: 0.05,
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);

      // --- 3. INSTANCE TRANSFORMATION SECTION ---
      const columns = shapes.config.layout.dimensions?.x ?? 1;

      shapes.data.forEach((rect, i) => {
        rect.position.x += knob2 * 0.1;

        // Alternated rows react to harmony or drums
        const row = Math.floor(i / columns);
        if (row % 2 == 0) {
          rect.position.x += harmoniesImpact;
          rect.renderPosition.y += harmoniesPitch;
        }
        else {
          rect.position.x += drumsFlatness;
        }
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    }
  },

  [Scenes.MTGO]: {
    init: (engine) => {
      _store = [];

      const shapes = engine.elements.get('flock-1');
      if (!shapes) return;

      // Set random frequency to each element for more natural movement
      shapes.data.forEach(rect => {
        rect.params = {};
        rect.params.amplitude = random(10, 50);
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { setInstancesScreenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery, beatCycle } = engine.audioManager;
      const { knob1, knob2 } = midiState;
      const shapes = engine.elements.get('flock-1');
      const elements2D = useSceneManager().scene2D.value?.elements.get('connections-1');;
      if (!shapes) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0.05, max: 1 };
      
      // Computed audio values + MIDI
      const harmonyImpact = mapClamp(harmonies.loudness, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraSpeed = 0.1 + knob1 * 0.1;
      const amplitude = harmonyImpact + knob2;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraRotate(azimuth + cameraSpeed, polar);

      // --- 3. INSTANCE TRANSFORMATION SECTION ---
      shapes.data.forEach((rect, i) => {
        const oscillationY = beatCycle(time, { beats: 8, offset: i * (Math.PI / 4) }) * rect.params.amplitude;
        const oscillationX = Math.abs(beatCycle(time, { beats: 8, offset: i * (Math.PI / 2) }) * rect.params.amplitude / 4);
        rect.renderPosition.y = rect.position.y + oscillationY * amplitude;
        rect.renderPosition.x = rect.position.x + oscillationX;
      })

      // Update instance screen position for 2D connection lines
      if (elements2D) {
        const shapesCount = shapes.data.length;

        // Store position indexes, if not set
        if (!_store.length) _store.push(...Array(shapesCount).fill(null).map((_, i) => i));

        // Update all instances positions
        setInstancesScreenPositions('flock-1', _store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 1 }, () => {
        // Randomize the oscillation amplitude
        shapes.data.forEach((rect) => {
          const oscillationChance = chance(0.25);
          if (oscillationChance) rect.params.amplitude = random(5, 40);
        })
      })
    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _store = [];
    }
  },

  [Scenes.PSSST]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const shapes = engine.elements.get('tunnel-1');
      if (!shapes) return;
      
      // Audio channels

      // Computed audio values + MIDI

      // Constants
      const BASE_FREQ = time * 0.001;

      // Camera params
      const { azimuth, polar } = engine.getCameraAngles();
      const CAMERA_CONFIG = {
        angleSpeed: Math.sin(BASE_FREQ * 0.2) * 0.025,
      }
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeed, polar);
      
      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        rect.renderPosition.x += Math.sin(BASE_FREQ * 0.2 + i) * 250;
        rect.renderPosition.y += Math.sin(BASE_FREQ * 0.3 + i) * 150;
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    }
  },


  [Scenes.RFBONGOS]: {
    init: (engine) => {
      const shapes = engine.elements.get('rectangles-1');
      if (!shapes) return;

      shapes.setVisibility(false);

      const camPos = engine.getCameraPosition();

      shapes.data.forEach(rect => {
        dummy.position.copy(rect.position);
        dummy.lookAt(camPos);
        
        // Make the rectangles always face the camera
        // you might need to add a 90-degree offset here (e.g., dummy.rotateX(Math.PI / 2))
        // dummy.rotateX(Math.PI / 2)
        rect.rotation.copy(dummy.rotation);
        rect.renderRotation.copy(dummy.rotation);
      });

      // Trigger a draw to commit these rotations to the GPU immediately
      shapes.draw();
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('rectangles-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      
      // Constants
      const BASE_ACCELERATION = 0.1;

      // Computed audio values + MIDI

      // Camera params
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      const CAMERA_CONFIG = {
        angleSpeed: BASE_ACCELERATION + mapClamp(drums.loudness, 0.25, 0.6, 0, BASE_ACCELERATION),
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(0.02);
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeed, polar);
      
      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        const angleMin = Math.PI * 0.25 + (i % 4);
        const angleMax = angleMin + Math.PI * (i%2 == 0 ? -0.5 : 0.5);

        // Make the rectangles always face the camera
        dummy.position.copy(rect.position);
        dummy.lookAt(cameraPos);
        dummy.rotateX(Math.PI / 2)
        rect.rotation.copy(dummy.rotation);
        
        // Update the renderRotation as well so it starts correct
        rect.renderRotation.copy(dummy.rotation);
        rect.renderRotation.x = mapLinear(drums.loudness, 0.3, 0.5, angleMin, angleMax)
      })

      
      if (drums.onOff) {
        const maxShapes = drums.loudness * 24;
        const shapesToActivate = 2 + randomInt(0, maxShapes);

        shapes.setVisibility(false);

        for (let i = 0; i < shapesToActivate; i++) {
          const randomIndex = randomInt(0, shapes.data.length - 1);
          shapes.setInstanceVisibility(randomIndex, true);
        }
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {
      const shapes = [
        engine.elements.get('sphere-1'),
        engine.elements.get('sphere-2'),
        engine.elements.get('sphere-3'),
        engine.elements.get('sphere-4'),
      ];

      shapes.forEach(el => el?.setVisibility(false));
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery, barProgress } = engine.audioManager;
      const shapes = [
        engine.elements.get('sphere-1'),
        engine.elements.get('sphere-2'),
        engine.elements.get('sphere-3'),
        engine.elements.get('sphere-4'),
      ];

      // Audio channels

      // Constants
      const scaleFactor = Math.sin(Math.PI * barProgress(time))

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---
      
      // --- 3. INSTANCE TRANSFORMATIONS ---
      // shapes.forEach(element => {
      //   element?.data.forEach(rect => {
      //     rect.position.x += 
      //   });
      // })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 5 }, () => {
        const target = shapes[randomInt(0, shapes.length)];
        if (!target) return;

        // Reset visibility
        shapes.forEach(el => el?.setVisibility(false));

        // Set a new origin for the sphere
        target.config.layout.origin = {
          x: random(-150, 150),
          y: random(-150, -50),
          z: random(-150, 150),
        }

        // Move every rect to origin and expand radially
        target.data.forEach(rect => {
          rect.position.copy(target.config.layout.origin);
          if (!rect.motionSpeed) return;

          rect.motionSpeed.position.x = random(-0.5, 0.5);
          rect.motionSpeed.position.y = random(0.15, 0.5);
          rect.motionSpeed.position.z = random(-0.5, 0.5);
        });

        target.setVisibility(true);
      })
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      _count = 0;

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, master, repeatEvery } = engine.audioManager;
      
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const BASE_POLAR_ANGLE = 90;

      // Computed audio values + MIDI
      const rotationSpeed = 4 / master.tempo;
      const bassImpact = bass.loudness * 8;
      const positionStepZ = 15;

      // Camera params
      const { azimuth } = engine.getCameraAngles();
      const zoom = engine.controls.getDistance();
      const CAMERA_CONFIG = {
        zoomSpeed: 0.05,
        angleSpeedY: Math.sin(BASE_FREQ * 0.5) * 10,
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      if (zoom < 750) engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth, BASE_POLAR_ANGLE + CAMERA_CONFIG.angleSpeedY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        const indexOffset = i * 0.02;

        rect.rotation.y += rotationSpeed;

        // Quantize the position to make the rects 'jump' instead of fluid motion
        rect.renderPosition.z = rect.position.z + Math.floor(Math.sin(BASE_FREQ * 0.1 + indexOffset) * bassImpact) * positionStepZ;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        const columns = shapes.config.layout.dimensions?.x || 10;

        // Create two random mathematical patterns to hide rects
        const patternA = {
          freq: columns / 2 + randomInt(0, 6),
          count: randomInt(3, 12),
        };
        const patternB = {
          freq: columns / 4 + randomInt(0, columns - 1),
          count: randomInt(2, 14),
        };

        shapes.setVisibility(false);
        
        // Toggle visibility following index
        shapes.data.forEach((_, i) => {
          if ((i + _count) % patternA.freq < patternA.count ||
              (i + _count) % patternB.freq < patternB.count) {
            shapes.setInstanceVisibility(i, true);
          }
        })

        _count++;
      })
    }
  },

    [Scenes.TUFTEEE]: {
    init: (engine) => {
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      const columns = shapes.config.layout.dimensions?.x ?? 1;

      // Set alternate direction X on every row
      shapes.data.forEach((rect, i) => {
        if (rect.motionSpeed && Math.floor(i / columns) % 2 === 0) {
          rect.motionSpeed.position.x *= -1;
        }
      });

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.002;
      const harmoniesImpact = (1 - harmonies.loudness) * 0.75;
      const harmoniesCentroid = harmonies.centroid;
      const drumsCentroid = drums.centroid;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        if (rect.motionSpeed) {
          rect.motionSpeed.scale.x = Math.sin(BASE_FREQ * 2 + i * 0.08) * harmoniesCentroid * drumsCentroid;
          rect.position.x -= rect.motionSpeed.position.x * harmoniesImpact;
        }
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.USBTEC]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('flock-1');
      if (!shapes) return;
      
      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // Constants
      const SCALE_FACTOR = 0.0001;
      const RESET_CHANCE = 0.75;

      // Computed audio values + MIDI

      // Camera params
      
      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        rect.scale.x += rect.scale.x * SCALE_FACTOR;
        rect.scale.y += rect.scale.y * SCALE_FACTOR;
        rect.scale.z += rect.scale.z * SCALE_FACTOR;
      })
      
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4 }, () => {
        shapes.data.forEach((rect, i) => {
          if (rect.motionSpeed && chance(RESET_CHANCE)) {
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
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const shapes = [
        engine.elements.get('flock-1'),
        engine.elements.get('flock-2'),
      ];
      if (!shapes[0] || !shapes[1]) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants

      // Computed audio values + MIDI
      const bassImpact = bass.loudness * 0.8;
      const harmonyImpact = harmonies.loudness * 0.8;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes[0].data.forEach((rect) => {
        if (rect.motionSpeed?.position.y) {
          rect.position.y -= rect.motionSpeed.position.y * bassImpact;
        }
      });

      shapes[1].data.forEach((rect) => {
        if (rect.motionSpeed?.position.y) {
          rect.position.y -= rect.motionSpeed.position.y * harmonyImpact;
        }
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    },
  },
  
  [Scenes.ZOHO]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('flock-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;

      // Computed audio values + MIDI
      const swingX = Math.sin(BASE_FREQ * 0.2) * 200;
      const swingY = Math.cos(BASE_FREQ * 0.2) * 200;
      const harmonyImpact = mapLinear(harmonies.pitch, 0.4, 0.65, -50, 50);
      
      // Camera params
      const { azimuth, polar } = engine.getCameraAngles();
      const CAMERA_CONFIG = {
        angleSpeedX: 0.005,
        angleSpeedY: 0.01,
        zoomSpeed: -0.005,
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeedX, polar + CAMERA_CONFIG.angleSpeedY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect) => {
        rect.renderPosition.x += swingX;
        rect.renderPosition.z += swingY
        rect.renderPosition.y += harmonyImpact;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    },
  }
};



/** OLD GHOSTSSS
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const shapes = [
        engine.elements.get('tunnel-1'),
        engine.elements.get('tunnel-2')
      ];
      if (!shapes?.[0] || !shapes[1]) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // Constants

      // Computed audio values + MIDI
      const harmoniesImpact = harmonies.loudness * 10;
      const textureImpact = texture.loudness * 10;
      const woodwindsImpact = mapLinear(woodwinds.loudness, 0, 1, 0.0005, 0.0025);

      // Camera params
      const CAMERA_CONFIG = {
        zoomCycle: 5 * beatCycle(time, { beats: 8 }),
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(CAMERA_CONFIG.zoomCycle);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      if (shapes[0].uniforms?.uThickness) {
        shapes[0].uniforms.uThickness.value = mapClamp(drums.loudness, 0.75, 0.85, 0.01, 0.05);
      }

      shapes[0].data.forEach((ring, i) => {
        const curveIntensity = 25 + i * 0.001 * textureImpact;

        // Set the X and Y positions (to be improved)
        ring.renderPosition.x = ring.position.x + Math.sin(ring.position.z * woodwindsImpact + harmoniesImpact) * curveIntensity;
        ring.renderPosition.y = ring.position.y + Math.cos(ring.position.z * woodwindsImpact * 0.25 + harmoniesImpact) * curveIntensity;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      
 */