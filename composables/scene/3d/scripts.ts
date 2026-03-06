import * as THREE from 'three';
import { mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Palette, Scenes } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { random, randomInt, chance, mapQuantize, mapClamp } from "~/composables/utils/math";
import { midiState } from '~/composables/controls/MIDI';
import { useSceneManager } from '../manager';
import { useSceneBridge } from '../bridge';
import { Modifiers } from "./modifiers";

const dummy = new THREE.Object3D();
const dummyVec = new THREE.Vector3();

let _state = {} as any;

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

  [Scenes.ASSIOMA]: {
    init: (engine) => {
      _state = {
        store: [],
      };

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob1, knob2, knob3 } = midiState;
      const lines2D = useSceneManager().scene2D.value?.elements.get('connections-1');;
      const shapes = engine.elements.get('spiral-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const MAX_LINES = lines2D?.config.layout.count ?? 10;
      
      // Computed audio values + MIDI
      const addScanChance = chance(knob3 + harmonies.loudness);
      const removeScanChance = chance(0.35);
      const narrowFactor = 1 - knob2;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach(rect => {
        Modifiers.gridNarrow(rect, 1, narrowFactor);
      })
      
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({beats: 1}, () => {

        // A. Removing logic
        if (removeScanChance && _state.store.length > 0) {
          // Remove the first (oldest) element
          const target = randomInt(0, _state.store.length);
          const removedIndex = _state.store.splice(target, 1);
  
          if (removedIndex !== undefined) {
            bridge.removeScreenPosition(removedIndex);
          }
        }

        // B. Adding logic
        if (addScanChance && _state.store.length < MAX_LINES) {
          const randomIndex = randomInt(0, shapes.data.length - 1);
          // const visibilityRange = shapes.data[randomIndex]?.position.z && shapes.data[randomIndex]?.position.z < 350;

          // Only add if is not already tracked
          if (!_state.store.includes(randomIndex)) {
            _state.store.push(randomIndex);
          }
        }

      })

      // D. Synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions('spiral-1', _state.store);
      }
    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _state.store = [];
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
      const BASE_FREQ = time * 0.001;
      const driftFreqX = BASE_FREQ * 1.25;
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
      _state = {
        store: [],
      };

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const { knob1, knob2, knob3 } = midiState;
      const scan2D = useSceneManager().scene2D.value?.elements.get('scan-1');;
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
      const MAX_SCANS = scan2D?.config.layout.count ?? 10;
      
      // Computed audio values + MIDI
      const harmonyRotation = mapClamp(harmonies.loudness, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const drumsRotation = mapClamp(drums.centroid, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const harmonyImpact = mapClamp(harmonies.loudness, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const harmonyThreshold = harmonies.loudness > 0.62;
      const cameraSpeed = harmonyImpact + knob2 * 0.25;
      const originSpeed = 0.02 + harmonyImpact;
      const addScanChance = chance(knob3 + harmonies.loudness);
      const removeScanChance = chance(0.35);
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
      // engine.cameraPan(0, 0, -150)

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

      // A. Removing logic
      if (removeScanChance && _state.store.length > 0) {
        // Remove the first (oldest) element
        const removedIndex = _state.store.shift();

        if (removedIndex !== undefined) {
          bridge.removeScreenPosition(removedIndex);
        }
      }

      // B. Adding logic
      if (addScanChance && _state.store.length < MAX_SCANS) {
        const randomIndex = randomInt(0, shapes.data.length - 1);
        const pos = shapes.data[randomIndex]?.position ?? { x: 0, y: 0, z: 0 };

        // Only add if is not already tracked
        if (!_state.store.includes(randomIndex)) {
          _state.store.push(randomIndex);
        }
      }

      // D. Synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions('particles-1', _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _state.store = [];
    }
  },

  [Scenes.ESGIBTBROT]: {
    init: (engine) => {
      const shapes = engine.elements.get('tunnel-1');
      if (!shapes) return;

      const { dimensions } = shapes.config.layout;
      const { motion } = shapes.config;
      if (!dimensions || !motion) return;

      // Set custom speed per depth row
      const speeds = [] as number[];
      for (let i = 0; i < dimensions.x * dimensions.y; i++) {
        speeds.push(random(1, 3)); // multiplier: from half to double speed
      }

      shapes.data.forEach(rect => {
        if (!rect.grid) rect.grid = { x: 0, y: 0, z: 0 };
        
        // Multiply original speed by Z index
        if (rect.motionSpeed) {
          rect.motionSpeed.position.z = (motion?.position?.z || 1) * speeds[rect.grid.x + rect.grid.y * dimensions.x]!;
        }

      })
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
      const BASE_FREQ = time * 0.001;
      const TUNNEL_FREQ = Math.PI;
      const distortion = 250;

      // Computed audio values + MIDI

      // Camera params
      const CAMERA_CONFIG = {
        positionCycle: Math.cos(Math.PI * -0.5 + BASE_FREQ - 0.002) * distortion / 16,
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraPosition(CAMERA_CONFIG.positionCycle, 0, 90);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      const { dimensions, spacing } = shapes.config.layout;
      if (!dimensions || !spacing) return;

      const totalWidth = (dimensions.x * spacing.x) || 1;
      const totalHeight = (dimensions.y * spacing.y) || 1;
      const totalDepth = (dimensions.z * spacing.z) || 1;

      shapes.data.forEach(rect => {
        // Update relative x, y, z for modifiers
        if (!rect.relative) rect.relative = { x: 0, y: 0, z: 0 };
        
        rect.relative.x = rect.position.x / totalWidth;
        rect.relative.y = rect.position.y / totalHeight;
        rect.relative.z = rect.position.z / totalDepth;

        // Apply Tunnel Bend
        const bendAmount = distortion * Math.sin(BASE_FREQ);
        Modifiers.gridBend(rect, {
          x: bendAmount,
          freqX: Math.PI * 2,
        });
        
        Modifiers.gridNarrow(rect, 1, 0.05, true)
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {
      _state = {
        store: [],
      };

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob1, knob2 } = midiState;
      const scan2D = useSceneManager().scene2D.value?.elements.get('scan-1');
      const labels2D = useSceneManager().scene2D.value?.elements.get('labels-1');
      const shapes = [
        engine.elements.get('tunnel-1'),
        engine.elements.get('tunnel-2')
      ];
      if (!shapes?.[0] || !scan2D || !labels2D) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;

      // Constants
      const BASE_FREQ = time * 0.001
      const MAX_SCANS = scan2D.config.layout.count ?? 10;

      // Computed audio values + MIDI
      // const drumsThreshold = drums.loudness > 0.62;
      const distortion = 50;
      const addScanChance = chance(0.35 + drums.loudness);
      const removeScanChance = chance(0.2);

      // Camera params
      const CAMERA_CONFIG = {
        lookatCycle: Math.cos(Math.PI * -0.5 + BASE_FREQ - 0.002) * distortion / 8,
        positionCycle: Math.cos(Math.PI * -0.5 + BASE_FREQ - 0.002) * distortion / 1,
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraPosition(CAMERA_CONFIG.positionCycle, 0, 90);
      engine.cameraLookAt(CAMERA_CONFIG.positionCycle, -10, 0);

      // --- 3. INSTANCE TRANSFORMATIONS ---

      // Apply Slope
      shapes.forEach(element => {
        if (!element) return;

        const { dimensions, spacing } = element.config.layout;
        if (!dimensions || !spacing) return;

        const totalWidth = (dimensions.x * spacing.x) || 1;
        const totalHeight = (dimensions.y * spacing.y) || 1;
        const totalDepth = (dimensions.z * spacing.z) || 1;

        element?.data.forEach(rect => {
          // Update relative x, y, z for modifiers
          if (!rect.relative) rect.relative = { x: 0, y: 0, z: 0 };
          
          rect.relative.x = rect.position.x / totalWidth;
          rect.relative.y = rect.position.y / totalHeight;
          rect.relative.z = rect.position.z / totalDepth;

          // Apply narrow effect
          Modifiers.gridNarrow(rect, 1, 0.25);

          // Apply slope
          Modifiers.gridSlope(rect, -350);

          // Apply Tunnel Bend
          const bendAmount = distortion * Math.sin(BASE_FREQ);
          Modifiers.gridBend(rect, {
            x: bendAmount,
            freqX: Math.PI * 5,
          });

        })
      })

      // A. Removing logic
      if (removeScanChance && _state.store.length > 0) {
        // Remove the first (oldest) element
        const removedIndex = _state.store.shift();

        if (removedIndex !== undefined) {
          bridge.removeScreenPosition(removedIndex);
        }
      }

      // B. Adding logic
      if (addScanChance && _state.store.length < MAX_SCANS) {
        const randomIndex = randomInt(0, shapes[0].data.length - 1);
        const pos = shapes[0].data[randomIndex]?.position ?? { x: 0, y: 0, z: 0 };

        // Only add if it's in the "Sweet Spot" and not already tracked
        const isCentral = pos.x > -650 && pos.x < 650;
        const isVisibleRange = pos.z > -1750 && pos.z < 500;

        if (isCentral && isVisibleRange && !_state.store.includes(randomIndex)) {
          _state.store.push(randomIndex);
        }
      }

      // C. Safety check
      // If a 3D object moves too far away, stop tracking it automatically
      _state.store = _state.store.filter((index: number) => {
        const pos = shapes[0]?.data[index]?.position ?? { x: 0, y: 0, z: 0 };
        const isTooFar = pos.z < -1800;
        if (isTooFar) {
          bridge.removeScreenPosition(index);
          return false;
        }
        return true;
      });

      // D. Synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions('tunnel-1', _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 1 }, () => {
        if (!shapes[0] || !shapes[1]) return;
        scan2D.config.style.color = Palette.GREEN;
        labels2D.config.style.background = Palette.GREEN;
      })

      repeatEvery({ beats: 4, offset: 2 }, () => {
        useSceneBridge().removeScreenPositions();
        _state.store = [];
        scan2D.config.style.color = Palette.RED;
        labels2D.config.style.background = Palette.RED;
      })

    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _state.store = [];
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
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      // Constants
      const WAVE_SPEED = 0.005;
      const HARMONY_AMP = 5;
      const SCALE_FACTOR = 40;

      // Computed audio values + MIDI
      const harmonyImpact = harmonies.loudness * HARMONY_AMP;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      let randomDepth: number, randomColumn: number;
      const cols = shapes.config.layout.dimensions?.x || 10;
      const depth = shapes.config.layout.dimensions?.z || 10;

      // When drum is hit, calculate new random index
      if (drums.onOff) {
        randomColumn = randomInt(0, cols);
        randomDepth = randomInt(0, depth);
      }

      shapes.data.forEach((rect, i) => {
        // Depth-based pitch shifting
        rect.renderPosition.z = rect.position.z + (i % 30) / 12 * woodwinds.pitch;

        // Harmonic wave
        rect.renderPosition.y = rect.position.y + Math.cos((time + i) * WAVE_SPEED) * harmonyImpact;

        // Reduce scale
        if (rect.scale.y > 1) {
          rect.scale.y -= 0.1;
        }

        if (drums.onOff) {
          if (rect.grid?.x == randomColumn && rect.grid?.z == randomDepth) {
            rect.scale.y = SCALE_FACTOR;
          }
        }
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      // repeatEvery({ beats: 1, offset: 0 }, () => {
      //   shapes.setVisibility(false);

      //   const cols = shapes.config.layout.dimensions?.x ?? 10;
      //   const rows = shapes.config.layout.dimensions?.y ?? 1;

      //   // Once for each column (on the X axis)
      //   for (let i = 0; i < cols; i++) {
      //     const randomY = randomInt(0, rows - 1);
      //     const targetIndices = shapes.getDepthRowIndices(i, randomY);

      //     // Make entire depth row visible
      //     targetIndices.forEach(index => {
      //       shapes.setInstanceVisibility(index, true);
      //       if (shapes.data[index]?.motionSpeed?.position) {
      //         shapes.data[index].motionSpeed.position.z = -0.01 - random();
      //       }
      //     });
      //   }
      // })
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
      const { azimuth, polar } = engine.getCameraAngles();
      // const camera = { azimuth: BASE_FREQ * 5, polar: BASE_FREQ * 2 }
      // const CAMERA_CONFIG = { azimuth: BASE_FREQ * 5, polar: BASE_FREQ * 2 }
      const CAMERA_CONFIG = { speedX: 0.1, speedZoom: 0.1 }

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraRotate(azimuth + CAMERA_CONFIG.speedX, polar);
      engine.cameraZoom(CAMERA_CONFIG.speedZoom);
            
      // --- 3. INSTANCE TRANSFORMATIONS ---
      const wobble = new THREE.Euler();

      grid.data.forEach((rect, i) => {
        const currentAngle = Math.sin(BASE_FREQ * 0.25 + i * 0.001) * Math.PI;
  
        wobble.set(0, 0, currentAngle);
        Modifiers.lookAt(rect, cameraPos, wobble)
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
      _state = {
        store: [],
      };

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
        if (!_state.store.length) _state.store.push(...Array(shapesCount).fill(null).map((_, i) => i));

        // Update all instances positions
        setInstancesScreenPositions('flock-1', _state.store);
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
      _state.store = [];
    }
  },

  [Scenes.PSSST]: {
    init: (engine) => {
      const shapes = engine.elements.get('tunnel-1');
      if (!shapes) return;

      const columns = shapes.config.layout.dimensions?.x || 5;
      const rows = shapes.config.layout.dimensions?.y || 5;

      // Hide the central rows
      // shapes.data.forEach((rect, i) => {
      //   if (rect.grid && ((rect.grid.y > 0 && rect.grid.y < rows - 1) && (rect.grid.x > 0 && rect.grid.x < columns - 1))) {
      //     shapes.setInstanceVisibility(i, false);
      //   }
      // })

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
      const maxShapes = drums.loudness * shapes.data.length / 2;

      // Camera params
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      const CAMERA_CONFIG = {
        angleSpeed: BASE_ACCELERATION + mapClamp(drums.loudness, 0.25, 0.6, 0, BASE_ACCELERATION),
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(0.02);
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeed, polar);
      
      const wobble = new THREE.Euler();

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        rect.renderPosition.copy(rect.position);

        // Calculate audio-reactive angle
        const angleMin = Math.PI * 0.25 + (i % 4);
        const angleMax = angleMin + Math.PI * (i%2 == 0 ? -0.5 : 0.5);
        const currentAngle = mapLinear(drums.loudness, 0.3, 0.5, angleMin, angleMax);

        // Set the relative X rotation
        wobble.set(currentAngle, 0, 0);

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos, wobble)
      })
      
      if (drums.onOff) {
        const shapesToActivate = randomInt(3, maxShapes);

        shapes.setVisibility(false);

        for (let i = 0; i < shapesToActivate; i++) {
          const randomIndex = randomInt(0, shapes.data.length - 1);
          shapes.setInstanceVisibility(randomIndex, true);
        }
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.SISTEMA]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('flock-1');
      if (!shapes) return;
      
      // Audio channels
      // Constants
      const SCALE_FACTOR = 0.00005;
      const RESET_CHANCE = 0.8;

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

  [Scenes.SOLO_01]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const timePush = drums.loudness * 2.0; 
      const dynamicTime = BASE_FREQ * (15 + knob2) + timePush;

      const cols = shapes.config.layout.dimensions?.x || 1;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * knob3;
        const colPhaseShift = col * 0.2;

        // Layering two frequencies creates a "pulse" that isn't a simple loop
        const mainWave = Math.sin(dynamicTime * colSpeedMult + colPhaseShift);
        const subWave = Math.cos(dynamicTime * 0.5 + row * Math.PI * 0.3);

        // Combine them with audio influence
        const combined = (mainWave * 0.6 + subWave * 0.4) * harmonies.loudness;
        const offsetX = (rect.position.x - (shapes.data[i - 1]?.position.x || rect.position.x)) * 1;

        rect.position.x += Math.sin(BASE_FREQ + i) * 0.001;
        rect.renderPosition.x = rect.position.x + Math.sin(BASE_FREQ * 0.03 * offsetX + i) * subWave * (0.25 + harmonies.loudness);

        rect.renderScale.x = rect.scale.x * mapClamp(
          combined, 
          -1, 1, 
          0.2,
          1.5 + drums.loudness * offsetX,
        );
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {
      _state = {
        activePoint: 0,
        connections: {}, // { [rectId]: particleId }
        _v1: new THREE.Vector3(), // Reusable scratch vector
        _v2: new THREE.Vector3(),
      }

      const shapes = engine.elements.get('sphere-matrix-1');
      const particles = engine.elements.get('particles');
      if (!shapes || !particles) return;

      // Hide all sphere matrix instances
      shapes.data.forEach(rect => {
        rect.scale.setScalar(0);
      });

      // Set only one point visible
      // particles.setVisibility(false);
      // particles.setInstanceVisibility(_state.activePoint, true)
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;
      const matrix = engine.elements.get('sphere-matrix-1');
      const particles = engine.elements.get('particles');
      if (!matrix || !particles) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const DISTANCE_RANGE = { min: 100, max: 600};
      const SCALE_RANGE = { min: 0.2, max: 2.5 }
      const SPEED_RANGE = { min: 5, max: 20 }
      const CONNECTION_THRESHOLD = 250;
      const CONNECTION_CHANCE = 0.1;

      // Computed audio values + MIDI
      const countPerSphere = 64;
      const targets = particles.data;
      if (!targets.length) return;

      // Camera params
      const CAMERA_CONFIG = {
        speedX: 0.025,
        rangeY: 10,
      };
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const bassImpact = mapLinear(bass.loudness, 0, 1, 0, 0.25);
      const deltaY = Math.sin(BASE_FREQ * 0.25) * CAMERA_CONFIG.rangeY
      engine.cameraRotate(azimuth + CAMERA_CONFIG.speedX + bassImpact, 90 + deltaY);
      
      // --- 3. INSTANCE TRANSFORMATIONS ---
      _state.connections = {};
      bridge.removeScreenPositions();
      
      matrix.data.forEach((rect, i) => {
        if (!targets[0])return;
        const [sphereColumn, sphereRow, sphereDepth] = rect.params.sphereIndex;
        
        // Find closest particle distance
        let minParticleDist = Infinity;
        particles.data.forEach(p => {
          const d = p.position.distanceTo(rect.position);
          if (d < minParticleDist) minParticleDist = d;

          // Store connections as [rectId]: particleId
          if (minParticleDist < CONNECTION_THRESHOLD && i > 10 && chance(CONNECTION_CHANCE)) {
            _state.connections[i] = p.id;
          }
        });

        const distFactor = mapClamp(minParticleDist, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        
        // Audio reaction: Harmonies drive the matrix pulse
        const audioScale = mapLinear(harmonies.loudness, 0, 1, 0.8, 2.5);
        const pulse = Math.sin(BASE_FREQ * 2 + sphereDepth + sphereColumn) * 0.1;
        
        rect.scale.setScalar(distFactor * audioScale + pulse);
      });

      particles.data.forEach((rect) => {
        // Particles always look at camera
        rect.renderPosition.copy(rect.position);
        Modifiers.lookAt(rect, cameraPos);

        // Recalculate direction and speed when particle hits bounds
        if (particles.resetIds.length > 0 && particles.resetIds.includes(rect.id)) {
          if (rect && rect.motionSpeed) {
            // Create random direction vector [-1 to 1] based on last point
            const newY = (rect.position.y >= 1500) ? random(0, 1) : (rect.position.y <= -1500) ? random(-1, 0) : random(-1, 1);
            const newX = (rect.position.x >= 2000) ? random(0, 1) : (rect.position.x <= -2000) ? random(-1, 0) : random(-1, 1);
            const newZ = (rect.position.z >= 2000) ? random(0, 1) : (rect.position.z <= -2000) ? random(-1, 0) : random(-1, 1);

            const dir = new THREE.Vector3(newX, newY, newZ).normalize();
    
            // Random speed between 1 and 10
            const speed = random(SPEED_RANGE.min, SPEED_RANGE.max)
            rect.position.multiplyScalar(-1);
            rect.motionSpeed.position.copy(dir.multiplyScalar(speed));
          }
        }
      })

      // Store screen positions to be handled in 2d/scripts.ts

      // 1. Particles coords
      const harmoniesImpact = mapQuantize(harmonies.loudness, 0, 1, 1, 5);
      const particlesIndices = particles.data.map((_, i) => i).filter(i => i < harmoniesImpact);
      bridge.setInstancesScreenPositions('particles', particlesIndices);

      // 2. Connection coords
      if (_state.connections) {
        const indices = Object.keys(_state.connections).map(key => parseInt(key));
        const data = Object.values(_state.connections).map(value => ({ particleIndex: value }));
        bridge.setInstancesScreenPositions('sphere-matrix-1', indices, data);
      }


    },
    dispose: () => {
      _state = {};
    }
  },


  [Scenes.STRANGE_ATTRACTOR]: {
    init: (engine) => {
      _state = {

      }

      const shapes = [
        engine.elements.get('flock-1'),
        engine.elements.get('flock-2'),
      ]

      const MIN_DISTANCE = 250;
      const MAX_DISTANCE = 500;

      shapes.forEach(element => {
        if (!element) return;

        element.data.forEach((rect, i) => {
          const dist = rect.position.length();
          
          // Constrain rects in a ring
          if (dist < MIN_DISTANCE || dist > MAX_DISTANCE) {
            const targetDist = MIN_DISTANCE + random(MAX_DISTANCE - MIN_DISTANCE);
            rect.position.normalize().multiplyScalar(targetDist);
          }
    
        })
      })


    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;
      const shapes = [
        engine.elements.get('flock-1'),
        engine.elements.get('flock-2'),
      ];
      if (!shapes) return;
      
      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const ANGULAR_RANGE = { min: 0.005, max: 0.015 };

      // Computed audio values + MIDI
      const harmonyImpact = 0.1 + harmonies.loudness;
      
      // Camera params
      const CAMERA_CONFIG = {
        speedX: 0.05,
      };
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraRotate(azimuth + CAMERA_CONFIG.speedX, polar);      

      shapes.forEach(element => {
        if (!element) return;

        // Get the rotation of the container
        const containerQuat = element.mesh.quaternion;

        element.data.forEach((rect, i) => {
          // Set angular rotation
          const swirlForce = mapClamp(rect.position.length(), 0, 500, ANGULAR_RANGE.min, ANGULAR_RANGE.max) * harmonyImpact;
          Modifiers.setOrbit(rect, swirlForce);

          // Make the rectangles always face the camera
          Modifiers.lookAt(rect, cameraPos, undefined, containerQuat);
        })
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      useSceneBridge().removeScreenPositions();
      _state = {};
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
    
      _state = {
        beatCount: 0,
        subBeatCount: 0,
        color: new THREE.Color(),
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, master, repeatEvery, beatCycle, barProgress } = engine.audioManager;
      
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const BASE_POLAR_ANGLE = 90;

      // Computed audio values + MIDI
      const bassImpact = bass.loudness * 8;
      const positionStepZ = 15;
      const rotationAngle = beatCycle(time, { beats: 4 }) * Math.PI * 0.1;

      // Camera params
      const { azimuth } = engine.getCameraAngles();
      const zoom = engine.controls.getDistance();
      const CAMERA_CONFIG = {
        zoomSpeed: 0.1,
        angleSpeedY: Math.sin(BASE_FREQ * 0.5) * 10,
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      if (zoom < 1000) engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth, BASE_POLAR_ANGLE + CAMERA_CONFIG.angleSpeedY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        const indexOffset = i * 0.02;

        rect.renderRotation.y = rect.rotation.y + rotationAngle;

        // Quantize the position to make the rects 'jump' instead of fluid motion
        rect.renderPosition.z = rect.position.z + Math.floor(Math.sin(BASE_FREQ * 0.1 + indexOffset) * bassImpact) * positionStepZ;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 2 }, () => {
        const columns = shapes.config.layout.dimensions?.x || 10;
        const baseColor = _state.color.set(Palette.DARK);

        // Create two random mathematical patterns to hide rects
        const patternA = {
          freq: columns / 2 + randomInt(0, 34),
          count: randomInt(8, 13),
        };
        const patternB = {
          freq: columns / 3 + randomInt(0, columns - 1),
          count: randomInt(5, 21),
        };

        shapes.setVisibility(false);
        
        // Toggle visibility following index
        shapes.data.forEach((rect, i) => {
          if ((i + _state.beatCount) % patternA.freq < patternA.count ||
              (i + _state.beatCount) % patternB.freq < patternB.count) {
            shapes.setInstanceVisibility(i, true);
          }

          // Reset all colors to black
          shapes.mesh.setColorAt(i, baseColor)

          // Reset red elements rotation
          if (rect.motionSpeed) {
            rect.rotation.y = 0;
            rect.motionSpeed.rotation.y = 0;
          }
        })  

        shapes.mesh.instanceColor!.needsUpdate = true;
        _state.beatCount++;
      })

      // Substep trigger
      const subStep = Math.floor(barProgress(time) * 4);

      if (subStep !== _state.subBeatCount) {
        const activeColor = new THREE.Color(Palette.RED);

        for(let i = 0; i < 10; i++) {
          const randomIndex = randomInt(0, shapes.data.length);
          shapes.mesh.setColorAt(randomIndex, activeColor);

          if (shapes.data[randomIndex]?.motionSpeed) {
            shapes.data[randomIndex].motionSpeed.rotation.y = 0.1;
          }
        }

        shapes.mesh.instanceColor!.needsUpdate = true;
        _state.subBeatCount = subStep;
      }
    }
  },

  [Scenes.TUFTEEE]: {
    init: (engine) => {
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      shapes.data.forEach((rect, i) => {
        const ringIndex = rect.grid?.y || 0;
    
        // Alternate directions: Even rings go left, odd go right
        const direction = ringIndex % 2 === 0 ? 1 : -1;
        const speed = random(0.001, 0.005)
        
        Modifiers.setOrbit(rect, speed * direction);
      });

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const shapes = engine.elements.get('grid-1');
      if (!shapes) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.002;
      const harmoniesCentroid = harmonies.centroid;
      const drumsCentroid = drums.centroid;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.data.forEach((rect, i) => {
        if (rect.motionSpeed) {
          rect.motionSpeed.scale.x = 0.1 * Math.sin(BASE_FREQ * 2 + i * 0.08) * harmoniesCentroid * drumsCentroid;
        }

        // Always look at Y axis
        dummyVec.set(0, rect.position.y, 0);
        Modifiers.lookAt(rect, dummyVec);
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.USBTEC]: {
    init: (engine) => {
      _state = {
        centers: []
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const { knob2, knob3 } = midiState;
      const centers = engine.elements.get('centers');
      const shapes = [
        engine.elements.get('flock-1'),
        engine.elements.get('flock-2'),
        engine.elements.get('flock-3'),
      ];
      if (!shapes[0] || !shapes[1] || !shapes[2] || !centers) return;
      
      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0, max: 0.1 };

      // Computed audio values + MIDI
      const drumsImpact = mapClamp(drums.loudness, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const bassImpact = mapClamp(bass.loudness, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraRotationX = 0.025;
      const attractionSpeed = [drumsImpact * 12, bassImpact * 18, drumsImpact * 11 ];
      const orbits = [
        { x: beatCycle(time, { beats: 14, offset: 5 }) * 100,
          z: beatCycle(time, { beats: 17, offset: 1 }) * 20,
        },
        {
          x: beatCycle(time, { beats: 15, offset: 2 }) * 20,
          z: beatCycle(time, { beats: 18, offset: 4 }) * 80,
        },
        {
          x: beatCycle(time, { beats: 12, offset: 3 }) * 40,
          z: beatCycle(time, { beats: 24, offset: 6 }) * 100,
        }
      ];
      
      // Camera params
      const CAMERA_CONFIG = {
        zoomMin: 200,
        zoomCycle: 2.5 * beatCycle(time, { beats: 2, offset: 2 }),
        rotationX: -0.025,
        rotationY: 0.002
      };
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraRotate(azimuth + CAMERA_CONFIG.rotationX, polar + CAMERA_CONFIG.rotationY);
      engine.cameraZoom(CAMERA_CONFIG.zoomCycle);
      
      // --- 3. INSTANCE TRANSFORMATIONS ---
      centers.data.forEach((center, i) => {
        const { origin } = shapes[i]?.config.layout || {};
        const container = shapes[i]?.container;
        const orbit = orbits[i];

        // Each center follows an orbit
        if (container && orbit && origin) {
          center.position.x = origin.x + orbit.x;
          center.position.y = origin.y;
          center.position.z = origin.z + orbit.z;

          container.position.x = center.position.x;
          container.position.y = center.position.y;
          container.position.z = center.position.z;
        }

        // Make the centers always face the camera
        Modifiers.lookAt(center, cameraPos);
      })

      shapes.forEach((element, i) => {
        const center = centers.data[i];

        element?.data.forEach((rect, i) => {
          // Rotate based on distance
          // Elements closer to the center swirl faster
          const dist = rect.position.length();
          const swirlForce = 0.05 / (dist * 0.01 + 0.35);
          const attractionForce = -((dist * 0.00025 + 0.15));

          rect.scale.x = 1 + 15 * swirlForce;

          Modifiers.setOrbit(rect, swirlForce, attractionForce);

          // Make the rectangles always face the camera
          Modifiers.lookAt(rect, cameraPos);
       })
      })
      
      // Set position
      if (!_state.centers.length) {
        _state.centers.push(...Array(centers.data.length).fill(null).map((_, i) => i));
      }

      bridge.setInstancesScreenPositions('centers', _state.centers);

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      useSceneBridge().removeScreenPositions();
      _state = {};
    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {
      _state = {
        points: [],
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { setInstancesScreenPositions, removeScreenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const elements2D = useSceneManager().scene2D.value?.elements.get('connections-1');;
      const shapes = [
        engine.elements.get('grid-1'),
        engine.elements.get('grid-2'),
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

      // Update instance screen position for 2D connection lines
      if (elements2D) {
        
        // Store position indexes, if not set
        if (!_state.points.length) {
          const rows = shapes[0].config.layout.dimensions?.y || 10;
          const cols = shapes[0].config.layout.dimensions?.x || 10;
          const startIndex = randomInt(0, rows - 1) * cols;

          _state.points.push(...Array(cols).fill(null).map((_, i) => startIndex + i));
        }

        // Update all instances positions
        setInstancesScreenPositions('grid-1', _state.points);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 8, offset: 1 }, () => {
        // Reset existing connections
        _state.points = [];
        removeScreenPositions();

        // Set new row of connections
        if (shapes[0]) {
          const rows = shapes[0].config.layout.dimensions?.y || 10;
          const cols = shapes[0].config.layout.dimensions?.x || 10;
          const startIndex = randomInt(0, rows - 1) * cols;
  
          _state.points.push(...Array(cols).fill(null).map((_, i) => startIndex + i));
        }
      })

    },
  },
  
  [Scenes.ZOHO]: {
    init: (engine) => {
      _state = {
        stars: [],
        tracks: [] as number[][],
        // targetStar: 0,
        lastAdded: 0,
        lastRemoved: 0,
        subBeatCount: 0,
      }

      const shapes = [
        engine.elements.get('flock-1'),
        engine.elements.get('particles-1'),
      ];
      if (!shapes) return;

      shapes[0]?.data.forEach(rect => {
        rect.params.freq = random(0.05, 0.35);
        rect.params.offsetFreq = random(Math.PI * 2);
        rect.params.orbitX = random(100, 350);
        rect.params.orbitZ = random(100, 250);
        rect.params.orbitY = random(-0.5, 0.5);
      })
      
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, beatCycle, barProgress } = engine.audioManager;
      const bridge = useSceneBridge();
      const shapes = [
        engine.elements.get('flock-1'),
        engine.elements.get('particles-1'),
      ];
      if (!shapes[0] || !shapes[1]) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const STARS_COUNT = shapes[0].data.length;
      const TOTAL_TRACKS = (useScene2D().value?.elements.get('track-1')?.data.length || 25);
      const MAX_TRACK_ELEMENTS = TOTAL_TRACKS / STARS_COUNT;
      
      // Computed audio values + MIDI
      const harmonyImpact = mapLinear(harmonies.pitch, 0.4, 0.65, -50, 50);
      
      // Camera params
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      const CAMERA_CONFIG = {
        angleSpeedX: 0.005,
        angleSpeedY: 0.01,
        zoomSpeed: -0.005,
      }
      const angleY = beatCycle(time, { beats: 128 }) * 30 + 30;

      // console.log(angleY);
      // const angleY = polar;

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeedX, angleY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      shapes.forEach((element, elementIndex) => {
        element?.data.forEach((rect, i) => {

          // Apply orbits
          if (elementIndex == 0) {
            const swingX = Math.sin(BASE_FREQ * rect.params.freq + rect.params.offsetFreq) * rect.params.orbitX;
            const swingZ = Math.cos(BASE_FREQ * rect.params.freq + rect.params.offsetFreq) * rect.params.orbitZ;
            const swingY = harmonyImpact * rect.params.orbitY;

            rect.renderPosition.x += swingX;
            rect.renderPosition.z += swingZ;
            rect.renderPosition.y += swingY;

            // Add element screen positions
            if (_state.stars.length < STARS_COUNT) {
              if (!_state.stars.includes(i)) {
                _state.stars.push(i);
                _state.tracks.push([]);
              }
            }
          }

          // Make the rectangles always face the camera
          Modifiers.lookAt(rect, cameraPos);
       })
      })

      // Star position synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.stars.length > 0) {
        bridge.setInstancesScreenPositions('flock-1', _state.stars);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      // Synchronize track every 1/3 step
      const subStep = Math.floor(barProgress(time) * 3);

      if (subStep !== _state.subBeatCount) {
        
        let track;

        // There is one track for each star
        for (let i = 0; i < _state.stars.length; i++) {
          track = _state.tracks[i];

          // A. Removing logic: remove oldest
          if (track?.length >= MAX_TRACK_ELEMENTS) {
            const removedIndex = track.shift();

            if (removedIndex !== undefined) {
              bridge.removeTrackPosition(_state.lastRemoved);
              _state.lastRemoved++;
            }
          }

          // B. Adding logic: add new track for each star
          if (track?.length < MAX_TRACK_ELEMENTS) {
            const target = bridge.getScreenPosition(i);
            if (!target) return;
  
            track.push(JSON.parse(JSON.stringify(target)));
  
            bridge.setTrackPosition(_state.lastAdded, target);
  
            _state.lastAdded++;
          }
        }

        _state.subBeatCount = subStep;
      }

    },
    dispose: () => {
      useSceneBridge().removeScreenPositions();
      useSceneBridge().removeTrackPositions();
      _state = {};

    }
  }
};