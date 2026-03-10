import * as THREE from 'three';
import { lerp, mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Palette, Scenes, SEQUENCES } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { random, randomInt, chance, mapQuantize, mapClamp } from "~/composables/utils/math";
import { midiState } from '~/composables/controls/MIDI';
import { useSceneManager } from '../manager';
import { useSceneBridge } from '../bridge';
import { Modifiers } from "./modifiers";
import { getIndex } from '~/composables/utils/three';

const dummyVec = new THREE.Vector3();

let _state = {} as any;

export const sceneScripts: Partial<Record<Scenes, Scene3DScript>> = {
  [Scenes.ASFAY]: {
    init: (engine) => {
      _state = {
        coords: [],
      }

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID)
      };

      if (!elements.grid) return;

      elements.grid.setVisibility(false);
    },
    update: (engine) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const bridge = useSceneBridge();
      const { knob2 } = midiState;

      const labels = {
        GRID:       'grid-1',
        SET_COORDS: 'coords',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      }

      if (!elements.grid) return;

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
      const visibilityChance = harmonyImpact;
      const trackingChance = 0.005 + harmonyImpact * knob2;

      // Camera params
      const CAMERA_CONFIG = { angleMin: 30, angleMax: 90, angleSpeed: 0.01 }

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeed, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        if (i % SHAPE_GROUPS == activeGroup) {
          rect.rotation.y += harmonyImpact;
        }
      });

      bridge.clearAllScreenPositions();

      if (_state.coords?.length) {
        bridge.setInstancesScreenPositions(labels.SET_COORDS, labels.GRID, _state.coords)
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

      // Randomize camera angle X
      repeatEvery({ beats: 8 }, () => {
        const angle = random(CAMERA_CONFIG.angleMin, CAMERA_CONFIG.angleMax);
        engine.cameraRotate(azimuth + angle, polar);
      })

      // Randomize block visibility and add block coords
      repeatEvery({ beats: 1 }, () => {
        if (!elements.grid) return;

        elements.grid.setVisibility(false);

        elements.grid.data.forEach((_, i) => {
          if (chance(visibilityChance)) {
            elements.grid?.setInstanceVisibility(i, true)
          }

          // Add with lower chance the coords
          else if (chance(trackingChance)) {
            if (!_state.coords.includes(i)) _state.coords.push(i)
          }
        })
      })
    },
    dispose: (engine) => {
      _state = {};
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

      const labels = {
        CONNECTIONS:     'connections-1',
        SPIRAL:          'spiral-1',
        SET_CONNECTIONS: 'origins',
      }

      const elements = {
        connections: useScene2D().value?.elements.get(labels.CONNECTIONS),
        spiral: engine.elements.get(labels.SPIRAL),
      };

      if (!elements.spiral) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const MAX_LINES = elements.connections?.config.layout.count ?? 10;
      const MAX_INTERVAL = 42;
      
      // Computed audio values + MIDI
      const narrowFactor = 1 - knob2;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.spiral.data.forEach(rect => {
        Modifiers.gridNarrow(rect, 1, narrowFactor);
      })
      
      bridge.clearAllScreenPositions();

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({beats: 1}, () => {
        if (!elements.spiral) return;

        _state.store = [];

        // Get the element that is closer to camera
        const startIndex = elements.spiral.data.filter((rect) => {
          return rect.position.z > 1000 && rect.position.z < 1050;
        })[0]?.id || 0;

        // Increment randomly
        // const incr = mapQuantize(knob3, 0, 1, 1, 21);
        let incr = randomInt(1, MAX_INTERVAL);

        // Increment based on sequence
        // const sequenceKeys = Object.keys(SEQUENCES);
        // const sequenceKey = sequenceKeys[mapQuantize(knob3, 0, 1, 0, sequenceKeys.length)];

        for (let i = 0; i < MAX_LINES; i++) {
          // const incr = SEQUENCES[sequenceKey as 'fibonacci']?.[i] || 0;
          const randomIndex = Math.abs(startIndex - incr * i) % elements.spiral.data.length;
          
          if (elements.spiral.data[randomIndex]) {
            _state.store.push(randomIndex);
          }

          if (chance(knob3)) {
            incr = randomInt(1, MAX_INTERVAL);
          }
        }

      })

      // D. Synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions(labels.SET_CONNECTIONS, labels.SPIRAL, _state.store);
      }
    },
    dispose: (engine) => {
      _state = {};
    }
  },

  [Scenes.CONFINE]: {
    init: (engine) => {
      _state = {
        scans: [],
        center: null,
        _v1: new THREE.Vector3(),
      };

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
      const bridge = useSceneBridge();
      const { smoothedAudio, repeatEvery, beatCycle, barProgress } = engine.audioManager;
      const { knob2, knob3, knob4, knob5 } = midiState;

      const labels = {
        CENTER:     'flock-1',
        PARTICLES:  'particles-1',
        SET_CENTER: 'centers',
        SET_SCANS:  'scans',
      }

      const elements = {
        center: engine.elements.get(labels.CENTER),
        particles: engine.elements.get(labels.PARTICLES),
      };

      if (!elements.center || !elements.particles) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const FREQUENCY_CHANCE = 0.25;
      const DISTANCE_THRESHOLD = 750;
      const MAX_SCANS = 15;

      const driftFreqX = BASE_FREQ * 1.25;
      const driftFreqY = beatCycle(time, { beats: 8 });
      const swarmFreq = beatCycle(time, { beats: 16, offset: 4 });

      // Computed audio values + MIDI
      const drumImpact = drums.loudness;
      const harmonyImpact = harmonies.loudness * 25;
      const driftIntensityX = 5 + knob2 * 80;
      const driftIntensityY = 15 + knob3 * 40;
      const swarmIntensityX = 200 + knob4 * 25;
      const maxScanDistance = 150 + knob5 * DISTANCE_THRESHOLD; // ideal range from 150/200 to 750

      // Camera params
      const CAMERA_CONFIG = { zoomMin: 200, zoomSpeed: -0.1 };

      // --- 2. GLOBAL & CAMERA SECTION ---
      const distance = engine.controls.getDistance();
      if (distance > CAMERA_CONFIG.zoomMin) engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.center.data.forEach((rect, i) => {
        const indexOffset = i * 0.02;
        const driftX = Math.sin(driftFreqX * rect.params.frequency) * (driftIntensityX + harmonyImpact);
        const driftY = Math.cos(driftFreqY + indexOffset) * driftIntensityY;
        const swarmX = Math.sin(swarmFreq + indexOffset) * (drumImpact + swarmIntensityX);

        rect.renderPosition.x += driftX + swarmX;
        rect.renderPosition.y += driftY;

        // Update frequency smoothly for a less repetitive individual motion
        rect.params.frequency = lerp(rect.params.frequency, rect.params.targetFrequency, 0.005);
      });

      const center = elements.center?.data[_state.center];

      _state.scans.forEach((i: number) => {
        const rect = elements.particles?.data[i];
        if (rect && center) {
          rect.position.lerp(center.renderPosition, 0.025)
          rect.renderPosition.copy(rect.position);
        }
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---      
      repeatEvery({ beats: 1 }, () => {
        if (!elements.particles || !elements.center) return;

        // Clear local store
        _state.scans = [];

        // Adding logic
        for (let i = 0; i < MAX_SCANS; i++) {

          const randomIndex = randomInt(0, elements.particles.data.length - 1);
          const instance = elements.particles.data[randomIndex];
          const flock = elements.center?.container;

          if (!flock || !instance) return;

          if (_state._v1.copy(flock.position).distanceTo(instance.position) < maxScanDistance) {
            _state.scans.push(randomIndex);
          }
        }

        // Assign connection starting point
        _state.center = randomInt(0, elements.center.data.length - 1);
      })

      // Reset screen positions
      bridge.clearAllScreenPositions();

      // Update scanned instances screen positions on every frame
      if (!isNaN(_state.center)) bridge.setInstancesScreenPositions(labels.SET_CENTER, labels.CENTER, [_state.center]);
      if (_state.scans.length) bridge.setInstancesScreenPositions(labels.SET_SCANS, labels.PARTICLES, _state.scans);

      repeatEvery({ beats: 1 }, () => {
        elements.center?.data.forEach((rect, i) => {

          // Set a new target frequency
          if (chance(FREQUENCY_CHANCE)) {
            const frequency = rect.params.frequency + random(-0.25, 0.25);
            rect.params.targetFrequency = frequency;

            bridge.setSceneData((i).toString(), frequency)
          }
        })
      })
    },
    dispose: () => {
      _state = {}
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

      const labels = {
        SCANS:     'scan-1',
        PARTICLES: 'particles-1', 
        SET_SCANS: 'scans',
      };

      const elements = {
        scan: useSceneManager().scene2D.value?.elements.get(labels.SCANS),
        particles: engine.elements.get(labels.PARTICLES),
      }

      if (!elements.scan || !elements.particles) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0, max: 0.1 };
      const SHAPE_LOUDNESS_RANGE = { min: 0.25, max: 1 };
      const SHAPE_ROTATION_RANGE = { min: 0, max: 0.01 };
      const MAX_SCANS = elements.scan?.config.layout.count ?? 10;
      
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
      const columns = elements.particles.config.layout.dimensions?.x ?? 1;

      elements.particles.data.forEach((rect, i) => {
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

      // A. Clear set
      bridge.clearScreenSet(labels.SET_SCANS);

      // B. Remove oldest index from local store
      if (removeScanChance && _state.store.length > 0) {
        _state.store.shift();
      }

      // C. Add index to local store if not already tracked
      if (addScanChance && _state.store.length < MAX_SCANS) {
        const randomIndex = randomInt(0, elements.particles.data.length - 1);
        // const pos = elements.particles.data[randomIndex]?.position ?? { x: 0, y: 0, z: 0 };

        if (!_state.store.includes(randomIndex)) {
          _state.store.push(randomIndex);
        }
      }

      // D. Synchronize set with local store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions(labels.SET_SCANS, labels.PARTICLES, _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: (engine) => {
      useSceneBridge().clearAllScreenPositions();
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

    [Scenes.FAKE_OUT]: {
    init: (engine) => {
      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      }

      if (!elements.grid) return;

      elements.grid.data.forEach((rect) => {
        if (!rect.motionSpeed) return;
        rect.params = {}
        rect.scale.y = random();
        rect.motionSpeed.scale.y = random(-0.0015, 0.0015);
        rect.params.scaleDirection = Math.sign(rect.motionSpeed.scale.y);
      });
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2 } = midiState;

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID)
      }

      if (!elements.grid) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      
      // Computed audio values + MIDI

      // Constants

      // Computed audio values + MIDI
      const harmonyImpact = harmonies.loudness;

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        if (!rect.motionSpeed) return;

        rect.position.y += rect.motionSpeed.position.y * (harmonyImpact - knob2 * 5);

        if (rect.scale.y <= 0 && rect.params?.scaleDirection < 0) {
          rect.motionSpeed.scale.y = random(0.0005, 0.0015);
          rect.params.scaleDirection = 1;
        }
        if (rect.scale.y >= 1 && rect.params?.scaleDirection > 0) {
          rect.motionSpeed.scale.y = random(-0.0005, -0.0015);
          rect.params.scaleDirection = -1;
        }
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {
      _state = {
        store: [],
        _v1: new THREE.Vector3(),
      };
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob1, knob2 } = midiState;
      
      const labels = {
        GRID:      'tunnel-1',
        LABELS:    'labels-1',
        SCANS:     'scan-1',
        SET_SCANS: 'scans',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
        labels: useScene2D().value?.elements.get(labels.LABELS),
        scans: useScene2D().value?.elements.get(labels.SCANS),
      }

      if (!elements.grid || !elements.labels || !elements.scans) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;

      // Constants
      const BASE_FREQ = time * 0.001
      const MAX_SCANS = elements.scans.config.layout.count || 10;

      // Computed audio values + MIDI
      // const drumsThreshold = drums.loudness > 0.62;
      const distortion = 50;
      const addScanChance = chance(0.35 + drums.loudness);

      // Camera params
      const CAMERA_CONFIG = {
        lookatCycle: Math.cos(Math.PI * -0.5 + BASE_FREQ - 0.002) * distortion / 8,
        positionCycle: Math.cos(Math.PI * -0.5 + BASE_FREQ - 0.002) * distortion / 1,
      };

      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = _state._v1.copy(engine.getCameraPosition());
      cameraPos.z += 2000;

      // --- 3. INSTANCE TRANSFORMATIONS ---

      // Apply Slope

      const { dimensions, spacing } = elements.grid.config.layout;
      if (!dimensions || !spacing) return;

      const totalWidth = (dimensions.x * spacing.x) || 1;
      const totalHeight = (dimensions.y * spacing.y) || 1;
      const totalDepth = (dimensions.z * spacing.z) || 1;

      elements.grid?.data.forEach((rect, i) => {
        if (!elements.grid) return;
        // Update relative x, y, z for modifiers
        if (!rect.relative) rect.relative = { x: 0, y: 0, z: 0 };
        
        rect.relative.x = rect.position.x / totalWidth;
        rect.relative.y = rect.position.y / totalHeight;
        rect.relative.z = rect.position.z / totalDepth;

        // Push top layer further up
        const isTopLayer = rect.grid?.y == 1;

        // Apply narrow effect
        Modifiers.gridNarrow(rect, 1, 0.25);

        // Apply slope
        const slopeValue = isTopLayer ? 50 : -150;
        Modifiers.gridSlope(rect, slopeValue);

        // Elements look at camera
        if (cameraPos) {
          Modifiers.lookAt(rect, cameraPos)
        }

        // Apply Tunnel Bend
        const bendAmount = distortion * Math.sin(BASE_FREQ);
        Modifiers.gridBend(rect, {
          x: bendAmount,
          freqX: Math.PI * 5,
        });

        // Restore visibility on position reset
        if (elements.grid.resetIds.includes(i)) {
          elements.grid.setInstanceVisibility(i, true);

          // Chance element scale
          if (chance(0.33)) {
            rect.scale.x = random(0.25, 2.5);
            rect.scale.y = random(0.25, 2.5);
          }
        }
      })

      // Update screen positions
      bridge.clearAllScreenPositions();

      // A. Adding logic
      if (addScanChance && _state.store.length < MAX_SCANS) {
        const randomIndex = randomInt(0, elements.grid.data.length - 1);
        const pos = elements.grid.data[randomIndex]?.position ?? { x: 0, y: 0, z: 0 };

        // Only add if it's in the "Sweet Spot" and not already tracked
        const isCentral = pos.x > -1000 && pos.x < 1000;
        const isVisibleRange = pos.z > -2000;
        const isVisible = elements.grid.mesh.geometry.attributes.instanceVisible?.getX(randomIndex);

        if (isCentral && isVisibleRange && isVisible && !_state.store.includes(randomIndex)) {
          _state.store.push(randomIndex);
        }
      }

      // B. Safety check
      // If a 3D object moves too far away, stop tracking it automatically
      _state.store = _state.store.filter((index: number) => {
        const pos = elements.grid?.data[index]?.position ?? { x: 0, y: 0, z: 0 };
        const isTooFar = pos.z < -1800;
        return !isTooFar;
      });

      // D. Synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions(labels.SET_SCANS, labels.GRID, _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 3 }, () => {
        if (!elements.grid || !elements.scans || !elements.labels) return;

        elements.scans.config.style.color = Palette.GREEN;
        elements.labels.config.style.background = Palette.GREEN;

        _state.store.forEach((id: number) => {
          elements.grid?.setInstanceVisibility(id, false);
        })
      })

      repeatEvery({ beats: 4, offset: 4 }, () => {
        if (!elements.grid || !elements.scans || !elements.labels) return;

        _state.store = [];
        elements.scans.config.style.color = Palette.RED;
        elements.labels.config.style.background = Palette.RED;
      })

    },
    dispose: (engine) => {
      _state = {};
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
          rect.scale.y = lerp(rect.scale.y, 1, 0.01);
        }
        if (rect.scale.x > 1) {
          rect.scale.x = lerp(rect.scale.x, 1, 0.01);
        }

        if (drums.onOff) {
          if (rect.grid?.x == randomColumn && rect.grid?.z == randomDepth) {
            rect.scale.y = SCALE_FACTOR;
            rect.scale.x = random(1, SCALE_FACTOR);
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
      _state = {
        store: [],
      }

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      };

      if (!elements.grid) return;

      elements.grid.data.forEach((rect, i) => {
        rect.params = {
          rotationPeriod: i * 0.0005,
          rotationSpeed: 0.25,
        }
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const bridge = useSceneBridge();

      const labels = {
        GRID:       'grid-1',
        SET_BOUNDS: 'bounds',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      };

      if (!elements.grid) return;

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
      const CAMERA_CONFIG = { speedX: 0.1, speedZoom: 0.1 }

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraRotate(azimuth + CAMERA_CONFIG.speedX, polar);
      engine.cameraZoom(CAMERA_CONFIG.speedZoom);
            
      // --- 3. INSTANCE TRANSFORMATIONS ---
      const wobble = new THREE.Euler();

      elements.grid.data.forEach((rect, i) => {
        const period = rect.params?.rotationPeriod || 0;
        const speed = rect.params?.rotationSpeed || 0;
        const currentAngle = Math.sin(BASE_FREQ * speed + period) * Math.PI;
  
        wobble.set(0, 0, currentAngle);
        Modifiers.lookAt(rect, cameraPos, wobble)

        // Restore original size over time
        if (rect.scale.y > 1) rect.scale.y -= 0.0033;
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        let ax, bx, ay, by, az, bz;

        // Randomize the period for specific range
        const dimensions = elements.grid?.config.layout.dimensions;
        const period = random(-0.001, 0.001);
        const speed = random(-0.1, 0.1);
        const scale = randomInt(3, 10);
        const maxX = dimensions?.x || 10;
        const maxY = dimensions?.y || 10;
        const maxZ = dimensions?.z || 10;
        const periodChance = chance(0.5);

        ax = randomInt(0, maxX - 1);
        bx = randomInt(0, maxX - 1);
        if (bx == ax) bx = ax == 0 ? maxX - 1 : 0;

        ay = randomInt(0, maxY - 1);
        by = randomInt(0, maxY - 1);
        if (by == ay) by = ay == 0 ? maxY - 1 : 0;

        az = randomInt(0, maxZ - 1);
        bz = randomInt(0, maxZ - 1);
        if (bz == az) bz = az == 0 ? maxZ - 1 : 0;

        const range = {
          x: [ ax, bx ].sort((a, b) => a - b),
          y: [ ay, by ].sort((a, b) => a - b),
          z: [ az, bz ].sort((a, b) => a - b)
        }

        // Add range, then remove the oldest
        _state.store.push(range);
        if (_state.store.length > 5) _state.store.shift();

        // Apply transformation to matrix elements within range
        elements.grid?.data.forEach((rect, i) => {
          if (rect.grid &&
            rect.grid.x >= range.x[0]! && rect.grid.x <= range.x[1]! &&
            rect.grid.y >= range.y[0]! && rect.grid.y <= range.y[1]! &&
            rect.grid.z >= range.z[0]! && rect.grid.z <= range.z[1]!
          ) {
            rect.params.rotationPeriod = periodChance ? rect.params.rotationPeriod + period : lerp(rect.params.rotationPeriod, period * i, 0.75);
            rect.params.rotationSpeed += speed;
            rect.scale.y = scale;
          }
        })
      })

      // Update screen positions
      bridge.clearAllScreenPositions()
      
      const vertices: number[] = [];

      _state.store?.forEach((range: { x: number[], y: number[], z: number[]}) => {
        const dims = elements.grid?.config.layout.dimensions || { x: 10, y: 10, z: 10 };

        for (let x = 0; x < 2; x++) {
        for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          if (!range.x || !range.y || !range.z) return;
          const index = getIndex(range.x[x]!, range.y[y]!, range.z[z]!, dims);
          vertices.push(index);
        }
        } 
        }
      })

      bridge.setInstancesScreenPositions(labels.SET_BOUNDS, labels.GRID, vertices);
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      }
      if (!elements.grid) return;

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
      const columns = elements.grid.config.layout.dimensions?.x ?? 1;

      elements.grid.data.forEach((rect, i) => {
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

      const labels = {
        POINTS: 'flock-1',
      }

      const elements = {
        points: engine.elements.get(labels.POINTS),
      }

      if (!elements.points) return;

      // Set random frequency to each element for more natural movement
      elements.points.data.forEach(rect => {
        rect.params = {};
        rect.params.amplitude = random(10, 50);
        rect.params.targetAmplitude = rect.params.amplitude;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { setInstancesScreenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery, beatCycle } = engine.audioManager;
      const { knob1, knob2 } = midiState;

      const labels = {
        POINTS:      'flock-1',
        CONNECTIONS: 'connections-1',
        SET_POINTS:  'points'
      }

      const elements = {
        points: engine.elements.get(labels.POINTS),
        connections: useSceneManager().scene2D.value?.elements.get(labels.CONNECTIONS),
      }

      if (!elements.points) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0.05, max: 1 };
      const elementsCount = elements.points.data.length;
      
      // Computed audio values + MIDI
      const harmonyImpact = mapClamp(harmonies.loudness, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraSpeed = 0.1 + knob1 * 0.1;
      const amplitude = harmonyImpact + knob2;

      // Camera params
      const CAMERA_CONFIG = {
        angleRangeY: 15,
        angleBaseY: 90,
      };
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const angleY = CAMERA_CONFIG.angleBaseY + beatCycle(time, { beats: 28 }) * CAMERA_CONFIG.angleRangeY;
      engine.cameraRotate(azimuth + cameraSpeed, angleY);

      // --- 3. INSTANCE TRANSFORMATION SECTION ---
      elements.points.data.forEach((rect, i) => {
        rect.params.amplitude = lerp(rect.params.amplitude, rect.params.targetAmplitude, 0.05);

        const oscillationY = beatCycle(time, { beats: 8, offset: i * (Math.PI / 4) }) * rect.params.amplitude;
        const oscillationX = Math.abs(beatCycle(time, { beats: 8, offset: i * (Math.PI / 2) }) * rect.params.amplitude / 4);

        rect.renderPosition.y = rect.position.y + oscillationY * amplitude;
        rect.renderPosition.x = rect.position.x + oscillationX;
      })

      // Update instance screen position for 2D connection lines
      if (elements.connections) {
        // Store position indices, if not set
        if (!_state.store.length) _state.store.push(...Array(elementsCount).fill(null).map((_, i) => i));

        // Update all instances positions
        setInstancesScreenPositions(labels.SET_POINTS, labels.POINTS, _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 1 }, () => {
        // Randomize the oscillation amplitude
        elements.points?.data.forEach((rect) => {
          const oscillationChance = chance(0.25);
          if (oscillationChance) rect.params.targetAmplitude = random(5, 40);
        })
      })
    },
    dispose: (engine) => {
      _state = {};
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
      _state = {
        _dummy: new THREE.Euler(),
      }

      const labels = {
        GRID: 'rectangles-1'
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      }

      if (!elements.grid) return;

      elements.grid.setVisibility(false);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;

      const labels = {
        GRID: 'rectangles-1'
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      }

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      
      // Constants
      const BASE_ACCELERATION = 0.01; // TODO: Accelerate gradually as the track proceeds

      // Computed audio values + MIDI
      const maxShapes = drums.loudness * elements.grid.data.length / 2;

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
      elements.grid.data.forEach((rect, i) => {
        rect.renderPosition.copy(rect.position);

        // Calculate audio-reactive angle
        const angleMin = Math.PI * 0.25 + (i % 4);
        const angleMax = angleMin + Math.PI * (i%2 == 0 ? -0.5 : 0.5);
        const currentAngle = mapLinear(drums.loudness, 0.3, 0.5, angleMin, angleMax);

        // Set the relative X rotation
        _state._dummy.set(currentAngle, 0, 0);

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos, _state._dummy)
      })
      
      if (drums.onOff) {
        const shapesToActivate = randomInt(3, maxShapes);

        elements.grid.setVisibility(false);

        for (let i = 0; i < shapesToActivate; i++) {
          const randomIndex = randomInt(0, elements.grid.data.length - 1);
          elements.grid.setInstanceVisibility(randomIndex, true);
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

      const labels = {
        CIRCLES: 'flock-1'
      }

      const elements = {
        circles: engine.elements.get(labels.CIRCLES),
      }

      if (!elements.circles) return;
      
      // Audio channels

      // Constants
      const SCALE_FACTOR = 0.00005;
      const RESET_CHANCE = 0.8;

      // Computed audio values + MIDI

      // Camera params
      
      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.circles.data.forEach((rect, i) => {
        rect.scale.x += rect.scale.x * SCALE_FACTOR;
        rect.scale.y += rect.scale.y * SCALE_FACTOR;
        rect.scale.z += rect.scale.z * SCALE_FACTOR;
      })
      
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4 }, () => {
        elements.circles?.data.forEach((rect, i) => {
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

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const timePush = harmonies.loudness * -5.0; 
      const dynamicTime = BASE_FREQ * (15 + knob2) + timePush;

      const cols = elements.grid?.config.layout.dimensions?.x || 1;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * knob3;
        const colPhaseShift = col * 0.25;

        // Layering two frequencies creates a "pulse" that isn't a simple loop
        const mainWave = Math.sin(dynamicTime * colSpeedMult + colPhaseShift);
        const subWave = Math.cos(dynamicTime * 0.15 + row * Math.PI * 0.3);

        // Combine them with audio influence
        const combined = (mainWave * 0.6 + subWave * harmonies.loudness) * harmonies.loudness * 0.35;
        const offsetX = (rect.position.x - (elements.grid?.data[i - 1]?.position.x || rect.position.x)) * 5;

        rect.position.x += Math.sin(BASE_FREQ + i * 0.1) * 0.001;
        rect.renderPosition.x = rect.position.x + Math.sin(BASE_FREQ * 0.0001 * offsetX + i) * subWave * (1 + harmonies.loudness);
        // rect.renderPosition.z = rect.position.z + Math.sin(BASE_FREQ * 0.03 * offsetX + i) * subWave * (0.5 + harmonies.loudness);

        rect.renderScale.x = mapClamp(
          combined, 
          -1, 1,
          1,
          5 + offsetX * 0.05,
        );
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.SOLO_02]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const timePush = harmonies.loudness * -5.0; 
      const dynamicTime = BASE_FREQ * (15 + knob2) + timePush;

      const cols = elements.grid?.config.layout.dimensions?.x || 1;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * knob3;
        const colPhaseShift = col * 0.025;

        // Layering two frequencies creates a "pulse" that isn't a simple loop
        const mainWave = Math.sin(dynamicTime * colSpeedMult + colPhaseShift);
        const subWave = Math.cos(dynamicTime * 0.15 + row * Math.PI * 0.3);

        // Combine them with audio influence
        const combined = (mainWave * 0.4 + subWave * 0.5) * harmonies.loudness * 0.5;
        const offsetX = (rect.position.x - (elements.grid?.data[i - 1]?.position.x || rect.position.x)) * 5;

        rect.position.x += Math.sin(BASE_FREQ + i) * 0.001;
        rect.renderPosition.x = rect.position.x + Math.sin(BASE_FREQ * 0.0005 * offsetX + i) * subWave * (1 + harmonies.loudness);
        // rect.renderPosition.z = rect.position.z + Math.sin(BASE_FREQ * 0.03 * offsetX + i) * subWave * (0.5 + harmonies.loudness);

        rect.renderScale.x = mapClamp(
          combined, 
          -1, 1, 
          3,
          10 + offsetX * 0.05,
        );
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.SOLO_03]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const timePush = harmonies.loudness * -5.0; 
      const dynamicTime = BASE_FREQ * (15 + knob2) + timePush;

      const cols = elements.grid?.config.layout.dimensions?.x || 1;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * knob3;
        const colPhaseShift = col * 0.25;

        // Layering two frequencies creates a "pulse" that isn't a simple loop
        const mainWave = Math.sin(dynamicTime * colSpeedMult + colPhaseShift);
        const subWave = Math.cos(dynamicTime * 0.15 + row * Math.PI * 0.3);

        // Combine them with audio influence
        const combined = (mainWave * 0.7 + subWave * 0.2) * harmonies.loudness * 0.5;
        const offsetX = (rect.position.x - (elements.grid?.data[i - 1]?.position.x || rect.position.x)) * 5;

        rect.position.x += Math.sin(BASE_FREQ + i) * 0.001;
        rect.renderPosition.x = rect.position.x + Math.sin(BASE_FREQ * 0.005 * offsetX + i) * subWave * (1 + harmonies.loudness);
        // rect.renderPosition.z = rect.position.z + Math.sin(BASE_FREQ * 0.03 * offsetX + i) * subWave * (0.5 + harmonies.loudness);

        rect.renderScale.x = mapClamp(
          combined, 
          -1, 1, 
          2.5,
          5 + offsetX * 0.05,
        );
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.SOLO_04]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const timePush = harmonies.loudness * 5.0; 
      const dynamicTime = BASE_FREQ * (15 + knob2) + timePush;

      const cols = elements.grid?.config.layout.dimensions?.x || 1;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * knob3;
        const colPhaseShift = col * 0.25;

        // Layering two frequencies creates a "pulse" that isn't a simple loop
        const mainWave = Math.sin(dynamicTime * colSpeedMult + colPhaseShift);
        const subWave = Math.cos(dynamicTime * 0.35 + row * Math.PI * 0.3);

        // Combine them with audio influence
        const combined = (mainWave * 0.7 + subWave * 0.2) * harmonies.loudness * 0.5;
        const offsetX = (rect.position.x - (elements.grid?.data[i - 1]?.position.x || rect.position.x)) * 5;

        rect.position.x += Math.sin(BASE_FREQ + i) * 0.001;
        rect.renderPosition.x = rect.position.x + Math.sin(BASE_FREQ * 0.1 * offsetX + i) * subWave * (1 + harmonies.loudness);
        // rect.renderPosition.z = rect.position.z + Math.sin(BASE_FREQ * 0.03 * offsetX + i) * subWave * (0.5 + harmonies.loudness);

        rect.renderScale.x = mapClamp(
          combined, 
          -1, 1, 
          2.5,
          10 + offsetX * 0.05,
        );
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

    }
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {
      _state = {
        activePoints: [0, 1, 2, 3, 4],
        connections: [], // { [index]: particleId[] }
        _v1: new THREE.Vector3(), // Reusable scratch vector
        _v2: new THREE.Vector3(),
      }

      const labels = {
        MATRIX: 'sphere-matrix-1',
        POINTS: 'particles',
      }

      const elements = {
        matrix: engine.elements.get(labels.MATRIX),
        particles: engine.elements.get(labels.POINTS),
      }

      if (!elements.matrix || !elements.particles) return;

      // Hide all sphere matrix instances
      elements.matrix.data.forEach(rect => {
        rect.scale.setScalar(0);
      });

      // Set only one point visible
      _state.activePoints.forEach((index: number) => {
        elements.particles?.setInstanceVisibility(index, _state.activePoints.include(index))
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;

      const labels = {
        MATRIX:          'sphere-matrix-1',
        ORIGINS:         'flock-1',
        SET_ORIGINS:     'origins',
        SET_CONNECTIONS: 'connections',
      }

      const elements = {
        matrix: engine.elements.get(labels.MATRIX),
        origins: engine.elements.get(labels.ORIGINS),
      }

      if (!elements.matrix || !elements.origins) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const DISTANCE_RANGE = { min: 100, max: 600};
      const SCALE_RANGE = { min: 0.2, max: 2.5 }
      const SPEED_RANGE = { min: 5, max: 20 }
      const CONNECTION_RANGE = { min: 150, max: 600 };
      const CONNECTION_CHANCE = 0.01;

      // Computed audio values + MIDI
      const connectionDistance = mapLinear(harmonies.loudness, 0, 1, CONNECTION_RANGE.min, CONNECTION_RANGE.max);

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

      // Clear previous connections
      _state.connections = Array(elements.origins.data.length).fill(null).map(_ => []);

      elements.matrix.data.forEach((rect, index) => {
        if (!elements.origins) return;
        const [sphereColumn, sphereRow, sphereDepth] = rect.params.sphereIndex;
        
        // Find closest particle distance
        let minParticleDist = Infinity;
        let particleIndex = -1;

        elements.origins.data.forEach(p => {
          const d = p.position.distanceTo(rect.position);
          if (d < minParticleDist) {
            minParticleDist = d;
            particleIndex = p.id;
          }
        });

        // Store connections as [rectId]: particleId
        if (minParticleDist < connectionDistance && chance(CONNECTION_CHANCE)) {
          _state.connections[particleIndex].push(index);
          console.log(particleIndex, minParticleDist);
        }

        const distFactor = mapClamp(minParticleDist, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        
        // Audio reaction: Harmonies drive the matrix pulse
        const audioScale = mapLinear(harmonies.loudness, 0, 1, 0.8, 2.5);
        const pulse = Math.sin(BASE_FREQ * 2 + sphereDepth + sphereColumn) * 0.1;
        
        rect.scale.setScalar(distFactor * audioScale + pulse);
      });

      elements.origins.data.forEach((rect) => {
        if (!elements.origins) return;

        // Origins always look at camera
        rect.renderPosition.copy(rect.position);
        Modifiers.lookAt(rect, cameraPos);

        // Recalculate direction and speed when particle hits bounds
        if (elements.origins.resetIds.length > 0 && elements.origins.resetIds.includes(rect.id)) {

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

      bridge.clearAllScreenPositions();

      // 1. Origins coords
      bridge.setInstancesScreenPositions(labels.SET_ORIGINS, labels.ORIGINS, _state.activePoints);

      // 2. Connection coords
      if (_state.connections.length) {
        const connections: number[] = [];
        const targets: any[] = []; 

        // Flatten connections array and create a 'targets' array with index of the target point
        _state.connections?.forEach((set: number[], index: number) => {

          // Filter connections with non-active points
          if (!set.length || !_state.activePoints.includes(index)) return;

          connections.push(...set)
          targets.push(...Array(set.length).fill(null).map(_ => ({ originIndex: index })));
        })

        // Add all screen positions as single set
        bridge.setInstancesScreenPositions(labels.SET_CONNECTIONS, labels.MATRIX, connections, targets);
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
      _state = {};
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      _state = {
        beatCount: 0,
        subBeat: 0,
        color: new THREE.Color(),
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, master, repeatEvery, beatCycle, barSubBeat } = engine.audioManager;
      
      const labels = {
        GRID: 'grid-1',
      }

      const elements = {
        grid: engine.elements.get(labels.GRID),
      }

      if (!elements.grid) return;

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
        zoomSpeed: 0.05,
        angleSpeedY: Math.sin(BASE_FREQ * 0.25) * 5,
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      if (zoom < 1000) engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth, BASE_POLAR_ANGLE + CAMERA_CONFIG.angleSpeedY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        const indexOffset = i * 0.02;

        rect.renderRotation.y = rect.rotation.y + rotationAngle;

        // Quantize the position to make the rects 'jump' instead of fluid motion
        rect.renderPosition.z = rect.position.z + Math.floor(Math.sin(BASE_FREQ * 0.1 + indexOffset) * bassImpact) * positionStepZ;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 2 }, () => {
        if (!elements.grid) return;

        const columns = elements.grid.config.layout.dimensions?.x || 10;
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

        elements.grid.setVisibility(false);
        
        // Toggle visibility following index
        elements.grid.data.forEach((rect, i) => {
          if (!elements.grid) return;
  
          if ((i + _state.beatCount) % patternA.freq < patternA.count ||
              (i + _state.beatCount) % patternB.freq < patternB.count) {
            elements.grid.setInstanceVisibility(i, true);
          }

          // Reset all colors to black
          elements.grid.mesh.setColorAt(i, baseColor)

          // Reset red elements rotation
          if (rect.motionSpeed) {
            rect.rotation.y = 0;
            rect.motionSpeed.rotation.y = 0;
          }
        })  

        elements.grid.mesh.instanceColor!.needsUpdate = true;
        _state.beatCount++;
      })

      // Substep trigger
      const subBeat = barSubBeat(time, 4);

      if (subBeat !== _state.subBeat) {
        const activeColor = _state.color.set(Palette.RED);

        for (let i = 0; i < 10; i++) {
          const randomIndex = randomInt(0, elements.grid.data.length);
          elements.grid.mesh.setColorAt(randomIndex, activeColor);

          if (elements.grid.data[randomIndex]?.motionSpeed) {
            elements.grid.data[randomIndex].motionSpeed.rotation.y = 0.1;
          }
        }

        elements.grid.mesh.instanceColor!.needsUpdate = true;
        _state.subBeat = subBeat;
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

      const labels = {
        ORIGINS:     'origins-1',
        PARTICLES_1: 'flock-1',
        PARTICLES_2: 'flock-2',
        PARTICLES_3: 'flock-3',
        SET_ORIGINS: 'origins',
      }

      const elements = {
        origins: engine.elements.get(labels.ORIGINS),
        particles: [
          engine.elements.get(labels.PARTICLES_1),
          engine.elements.get(labels.PARTICLES_2),
          engine.elements.get(labels.PARTICLES_3),
        ]
      };

      if (!elements.particles[0] || !elements.particles[1] || !elements.particles[2] || !elements.origins) return;
      
      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

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
        zoomCycle: 2.5,
        rotationX: -0.025,
        rotationY: 0.002
      };
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraZoom = CAMERA_CONFIG.zoomCycle * harmonies.loudness * beatCycle(time, { beats: 2, offset: 2 });
      engine.cameraRotate(azimuth + CAMERA_CONFIG.rotationX, polar + CAMERA_CONFIG.rotationY);
      engine.cameraZoom(cameraZoom);
      
      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.origins.data.forEach((center, i) => {
        const { origin } = elements.particles[i]?.config.layout || {};
        const container = elements.particles[i]?.container;
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

      elements.particles.forEach((element) => {
        element?.data.forEach((rect) => {
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
        _state.centers.push(...Array(elements.origins.data.length).fill(null).map((_, i) => i));
      }

      bridge.setInstancesScreenPositions(labels.SET_ORIGINS, labels.ORIGINS, _state.centers);

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {
      _state = {
        points: [],
        rowIndices: [],
        progress: 0,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { setInstancesScreenPositions, clearAllScreenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;

      const labels = {
        GRID_FRONT:  'grid-1',
        GRID_BACK:   'grid-2',
        CONNECTIONS: 'connections-1',
        SET_FRONT:   'connections-front',
        SET_BACK:    'connections-back',
      }

      const elements = {
        gridFront: engine.elements.get(labels.GRID_FRONT),
        gridBack: engine.elements.get(labels.GRID_BACK),
        connections: useSceneManager().scene2D.value?.elements.get(labels.CONNECTIONS),
      };

      if (!elements.gridFront || !elements.gridBack) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants

      // Computed audio values + MIDI
      const bassImpact = bass.loudness * 0.8;
      const harmonyImpact = harmonies.loudness * 0.8;
      const translateChance = 0.2;

      // Camera params
      const cameraPos = engine.getCameraPosition();

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.gridFront.data.forEach((rect, i) => {
        if (rect.motionSpeed?.position.y) {
          rect.position.y -= rect.motionSpeed.position.y * bassImpact;
          rect.motionSpeed.rotation.y = _state.points.includes(i) ? 0.025 : 0;
          rect.scale.x = _state.points.includes(i) ? 4 : 1;
        }
      });

      elements.gridBack.data.forEach((rect, i) => {
        if (rect.motionSpeed?.position.y) {
          rect.position.y -= rect.motionSpeed.position.y * harmonyImpact;
          rect.motionSpeed.rotation.y = _state.points.includes(i) ? 0.025 : 0;
          rect.scale.x = _state.points.includes(i) ? 4 : 1;
        }
      });

      // Update instance screen position for 2D connection lines
      if (elements.connections) {
        
        // Store position indices
        setInstancesScreenPositions(labels.SET_FRONT, labels.GRID_FRONT, _state.points);
        setInstancesScreenPositions(labels.SET_BACK, labels.GRID_BACK, _state.points);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        // Reset existing connections
        _state.points = [];
        clearAllScreenPositions();

        // Initial row fill e.g. [ 3, 3, 3, ... ]
        const rows = elements.gridFront?.config.layout.dimensions?.y || 10;
        const cols = elements.gridFront?.config.layout.dimensions?.x || 10;

        if (!_state.rowIndices.length) {
          const rowIndex = randomInt(0, rows - 1)
          _state.rowIndices = Array(cols).fill(null).map((_) => rowIndex)
        }

        // Increase / decrease one column per beat
        const targetColumn = _state.progress % cols;
        _state.rowIndices[targetColumn] = Math.abs(_state.rowIndices[targetColumn] + randomInt(-1, 1) % cols);

        // Translate the connection structure entirely
        if (chance(translateChance)) {
          const rowInterval = randomInt(0, cols - 1) % cols;
          _state.rowIndices = _state.rowIndices.map((i: number) => {
            return Math.abs(i + rowInterval)
          })
        }

        // Update list of point indices
        _state.points = _state.rowIndices.map((row: number, i: number) => {
          return (row * cols + i) % (rows * cols)
        });

        _state.progress++;
      })

      // Update elements motion speed
      repeatEvery({ beats: 4 }, () => {
        elements.gridFront?.data.forEach((rect) => {
          if (rect.motionSpeed) {
            // Apply to the whole grid
            if (chance(harmonyImpact)) {
              rect.motionSpeed.position.y += random(-0.025, 0.025);
            }

            // Apply to specific rows
            if (chance(harmonyImpact)) {
              const rowInterval = rect.grid?.x! % randomInt(3, 5) == randomInt(0, 2);
              if (rowInterval) rect.motionSpeed.position.y += random(-0.1, 0.1);
            }
          }
        })

        elements.gridBack?.data.forEach((rect) => {
          if (rect.motionSpeed) {
            // Apply to the whole grid
            if (chance(harmonyImpact)) {
              rect.motionSpeed.position.y += random(-0.025, 0.025);
            }

            // Apply to specific rows
            if (chance(harmonyImpact)) {
              const rowInterval = rect.grid?.x! % randomInt(3, 5) == randomInt(0, 2);
              if (rowInterval) rect.motionSpeed.position.y += random(-0.1, 0.1);
            }
          }
        })
      })
    },
  },
  
  [Scenes.ZOHO]: {
    init: (engine) => {
      _state = {
        orbits: [], // the 'stars' that are tracked
        trails: [] as number[][], // the positions of the trails left by the orbits
        // targetStar: 0,
        subBeat: 0,
      }

      const labels = {
        ORBITS:    'flock-1',
        PARTICLES: 'particles-1',
      }

      const elements = {
        orbits: engine.elements.get(labels.ORBITS),
        particles: engine.elements.get(labels.PARTICLES),
      };

      if (!elements.orbits || !elements.particles) return;

      elements.orbits.data.forEach(rect => {
        rect.params.freq = random(0.05, 0.35);
        rect.params.offsetFreq = random(Math.PI * 2);
        rect.params.orbitX = random(100, 350);
        rect.params.orbitZ = random(100, 250);
        rect.params.orbitY = random(-0.5, 0.5);
      })
      
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, beatCycle, barSubBeat } = engine.audioManager;
      const bridge = useSceneBridge();

      const labels = {
        ORBITS:     'flock-1',
        PARTICLES:  'particles-1',
        TRAILS:     'track-1',
        SET_SCANS:  'scans',
        SET_TRAILS: 'trails',
      }

      const elements = {
        orbits: engine.elements.get(labels.ORBITS),
        particles: engine.elements.get(labels.PARTICLES),
        trails: useScene2D().value?.elements.get(labels.TRAILS),
      };

      if (!elements.orbits || !elements.particles || !elements.trails) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const orbitsCount = elements.orbits.data.length;
      const trailsCount = elements.trails.data.length || 25;
      const maxTrailElements = trailsCount / orbitsCount;
      
      // Computed audio values + MIDI
      const harmonyImpact = mapLinear(harmonies.pitch, 0.4, 0.65, -50, 50);
      
      // Camera params
      const cameraPos = engine.getCameraPosition();
      const { azimuth } = engine.getCameraAngles();
      const CAMERA_CONFIG = {
        angleSpeedX: 0.005,
        angleSpeedY: 0.01,
        zoomSpeed: -0.005,
      }
      const angleY = beatCycle(time, { beats: 128 }) * 30 + 30;

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeedX, angleY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.orbits.data.forEach((rect, i) => {

        // Apply orbits
        const swingX = Math.sin(BASE_FREQ * rect.params.freq + rect.params.offsetFreq) * rect.params.orbitX;
        const swingZ = Math.cos(BASE_FREQ * rect.params.freq + rect.params.offsetFreq) * rect.params.orbitZ;
        const swingY = harmonyImpact * rect.params.orbitY;

        rect.renderPosition.x += swingX;
        rect.renderPosition.z += swingZ;
        rect.renderPosition.y += swingY;

        // Add element screen positions
        if (_state.orbits.length < orbitsCount) {
          if (!_state.orbits.includes(i)) {
            _state.orbits.push(i);
            _state.trails.push([]);
          }
        }

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos);
      })

      // Star position synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.orbits.length > 0) {
        bridge.setInstancesScreenPositions(labels.SET_SCANS, labels.ORBITS, _state.orbits);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      // Synchronize track every 1/3 step
      const subBeat = barSubBeat(time, 3);

      if (subBeat !== _state.subBeat) {

        // Clear trail points
        bridge.clearScreenSet(labels.SET_TRAILS);
        
        // One trail for each orbit
        let trail;
        for (let i = 0; i < _state.orbits.length; i++) {
          trail = _state.trails[i];

          // A. Removing logic: remove oldest trail point
          if (trail?.length >= maxTrailElements) {
            trail.shift();
          }

          // B. Adding logic: add new point for each orbit
          if (trail?.length < maxTrailElements) {
            const orbit = bridge.getScreenPosition(labels.SET_SCANS, i);
            if (!orbit) return;
  
            // Quantize positions here only once every sub beat,
            // so it doesn't need to compute every frame
            const point = JSON.parse(JSON.stringify(orbit))
            point.x = Math.floor(point.x * elements.trails.width / 10) * 10;
            point.y = Math.floor(point.y * elements.trails.height / 10) * 10;

            trail.push(point);
          }
        }

        // Update screen positions
        bridge.setScreenPositions(labels.SET_TRAILS, _state.trails.flat());

        _state.subBeat = subBeat;
      }
    },
    dispose: () => {
      _state = {};

    }
  }
};