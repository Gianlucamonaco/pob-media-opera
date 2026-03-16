import * as THREE from 'three';
import { lerp, mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Easing, Palette, Scenes } from "~/data/constants";
import type { Scene3DScript } from "~/data/types";
import { random, randomInt, chance, mapQuantize, mapClamp } from "~/composables/utils/math";
import { midiState } from '~/composables/controls/MIDI';
import { getIndex } from '~/composables/utils/three';
import { useSceneManager } from '../manager';
import { useSceneBridge } from '../bridge';
import { Modifiers } from "./modifiers";
import { elementIds } from '~/data/sceneLabels';
import { shuffle } from '~/composables/utils/array';

const dummyVec = new THREE.Vector3();

let _state = {} as any;
let _input = {} as any;
let _camera: {
  minAngleX?: number,
  maxAngleX?: number,
  speedAngleX?: number,
  angleY?: number, 
  minDistance?: number,
  speedZoom?: number,
  _triggered?: boolean,
} = {};

export const sceneScripts: Partial<Record<Scenes, Scene3DScript>> = {
  [Scenes.ASFAY]: {
    init: (engine) => {
      _state = {
        coords: [],
      }
  
      _camera = {
        minAngleX: 30,
        maxAngleX: 90,
        speedAngleX: 0.01,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.setVisibility(false);
    },
    update: (engine) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const bridge = useSceneBridge();
      const { knob2 } = midiState;

      const elements = { grid: engine.elements.get(elementIds.GRID) }

      if (!elements.grid) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      _input = {
        rectVisibilityChance: harmonies.loudness, // Note: Add multiple instruments
        rectRotationIndex: harmonies.pitch, // Note: Add multiple instruments
        rectRotationIntensity: harmonies.loudness,
        textVisibilityChance: harmonies.loudness * knob2, // Note: Maybe specific instrument only?
      }

      // Constants
      const PITCH_RANGE = { min: 0.3, max: 0.6 };
      const HARMONIES_RANGE = { min: 0.05, max: 0.95 };
      const ROT_RANGE = { min: 0, max: 0.25 }
      const rotationGroups = 7;

      // Computed audio values + MIDI
      const visibilityChance = mapLinear(_input.rectVisibilityChance, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max);
      const rotationIndex = mapQuantize(_input.rectRotationIndex, PITCH_RANGE.min, PITCH_RANGE.max, 0, rotationGroups);
      const rotationIntensity = mapLinear(_input.rectRotationIntensity, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max);
      const textVisibilityChance = 0.25 * _input.textVisibilityChance;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0);

      engine.cameraRotate(cameraAngleX, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        if (i % rotationGroups == rotationIndex) {
          rect.rotation.y += rotationIntensity;
        }
      });

      // Clear all positions
      bridge.clearAllScreenPositions();

      // Store positions for 2d coords text
      if (_state.coords?.length) {
        bridge.setInstancesScreenPositions(elementIds.SET_TEXT, elementIds.GRID, _state.coords)
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

      // Randomize camera angle X
      repeatEvery({ beats: 8 }, () => {
        const randomAngleX = random((_camera.minAngleX! || 0), (_camera.minAngleX || 0));
        const cameraAngleX = azimuth + randomAngleX;

        engine.cameraRotate(cameraAngleX, polar);
      })

      // Randomize block visibility and add block coords
      repeatEvery({ beats: 1 }, () => {
        if (!elements.grid) return;

        // Hide all elements
        elements.grid.setVisibility(false);

        // Hide all elements
        elements.grid.data.forEach((_, i) => {
          if (chance(visibilityChance)) {
            elements.grid?.setInstanceVisibility(i, true)
          }

          // Add with lower chance the coords
          else if (chance(textVisibilityChance)) {
            if (!_state.coords.includes(i)) _state.coords.push(i)
          }
        })
      })
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.ASSIOMA]: {
    init: (engine) => {
      _state = {
        store: [],
        fadeProgress: 0,
        fadeStep: 8, // How many frames between each fade
        fadeElements: 5, // How many elements fade at once
      };
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob1, knob2, knob3 } = midiState;

      const elements = {
        connections: useSceneManager().scene2D.value?.elements.get(elementIds.CONNECTIONS),
        structure: engine.elements.get(elementIds.STRUCTURE),
      };

      if (!elements.structure) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;

      _input = {
        tunnelNarrowFactor: knob2, // Note: Maybe an instrument for tunnel distortion?
        tunnelSpeedVariation: drums.loudness,
        connectionCountFactor: harmonies.loudness + texture.loudness, // Note: Add multiple instruments
        connectionVariationChance: knob3,
      }

      // Constants
      const MAX_INTERVAL = 42;
      
      // Computed audio values + MIDI
      const maxLines = (elements.connections?.config.layout.count || 10) * _input.connectionCountFactor;
      const tunnelNarrowFactor = 1 - _input.tunnelNarrowFactor;
      const tunnelSpeedVariation = mapClamp(_input.tunnelSpeedVariation, 0.5, 0.7, 0, 1);
      const connectionVariationChance = _input.connectionVariationChance;

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      if (ended) {
        const step = Math.floor(_state.fadeProgress / _state.fadeStep)

        if (step > elements.structure.data.length / _state.fadeElements) return;

        // Hide gradually all elements
        for (let i = 0; i < _state.fadeElements; i++) {
          const index = step * _state.fadeElements + i;
          elements.structure?.setInstanceVisibility(index, false);
        }

        // Increase progress counter
        _state.fadeProgress++;
      }

      elements.structure.data.forEach(rect => {
        if (!rect.motionSpeed) return;

        rect.position.z += rect.motionSpeed.position.z * tunnelSpeedVariation;

        // Makes the tunnel look more deep
        Modifiers.gridNarrow(rect, 1, tunnelNarrowFactor);
      })
      
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({beats: 1}, () => {
        if (!elements.structure) return;

        _state.store = [];

        // Get the element that is closer to camera
        const startIndex = elements.structure.data.filter((rect) => {
          return rect.position.z > 1000 && rect.position.z < 1050;
        })[0]?.id || 0;

        // Increment randomly
        // const incr = mapQuantize(knob3, 0, 1, 1, 21);
        let incr = randomInt(1, MAX_INTERVAL);

        // Increment based on sequence
        // const sequenceKeys = Object.keys(SEQUENCES);
        // const sequenceKey = sequenceKeys[mapQuantize(knob3, 0, 1, 0, sequenceKeys.length)];

        for (let i = 0; i < maxLines; i++) {
          // const incr = SEQUENCES[sequenceKey as 'fibonacci']?.[i] || 0;
          const randomIndex = Math.abs(startIndex - incr * i) % elements.structure.data.length;
          
          if (elements.structure.data[randomIndex]) {
            _state.store.push(randomIndex);
          }

          // Change interval for more dynamic sequences
          if (chance(connectionVariationChance)) {
            incr = randomInt(1, MAX_INTERVAL);
          }
        }
      })

      // Clear all positions
      bridge.clearAllScreenPositions();

      // Store interval positions for 2d connections
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions(elementIds.SET_CONNECTIONS, elementIds.STRUCTURE, _state.store);
      }
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.CONFINE]: {
    init: (engine) => {
      _state = {
        scans: [],
        center: null,
      };

      _camera = {
        minDistance: 200,
        speedZoom: -0.05,
      }

      const elements = { center: engine.elements.get(elementIds.MAIN) }

      // Set random frequency to each element for more natural movement
      elements.center?.data.forEach(rect => {
        rect.params = {};
        rect.params.frequency = 0;
        rect.params.targetFrequency = 0;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, repeatEvery, beatCycle, barProgress } = engine.audioManager;
      const { knob2, knob3, knob4, pad1 } = midiState;

      const elements = {
        center: engine.elements.get(elementIds.MAIN),
        particles: engine.elements.get(elementIds.PARTICLES),
      };

      if (!elements.center || !elements.particles) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      _input = {
        singleMotionX: harmonies.loudness + knob2, // Note: Update instrument
        groupMotionX: drums.loudness * knob3, // Note: Update instrument
        groupMotionY: harmonies.loudness * knob4, // Note: Update instrument
        scanDistanceThreshold: 1,
        scanCountFactor: 1, // Note: can depend on instrument?
        cameraChange: pad1,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const FREQUENCY_CHANCE = 0.5;
      const DISTANCE_MAX = 750;
      const DISTANCE_STEP = 50;
      const MAX_SCANS = 15;

      const driftFreqX = BASE_FREQ * 1.25;
      const driftFreqY = beatCycle(time, { beats: 8 });
      const swarmFreqX = beatCycle(time, { beats: 16, offset: 4 });
      const distanceIncrement = Math.min(DISTANCE_MAX, barProgress(time) * DISTANCE_STEP); // ideal range from 150/200 to 750
      
      // Computed audio values + MIDI
      const maxScans = _input.scanCountFactor * MAX_SCANS;
      const singleMotionX = 5 + _input.singleMotionX * 25;
      const groupMotionY = 15 + _input.groupMotionY * 40;
      const groupMotionX = 100 + _input.groupMotionX * 50;
      const maxScanDistance = 150 + _input.scanDistanceThreshold * distanceIncrement;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const distance = engine.controls.getDistance();

      // Slowly zoom towards the swarm
      if (distance > (_camera.minDistance || 0)) {
        engine.cameraZoom(_camera.speedZoom || 0);
      }

      // Manually switch camera view
      if (_input.cameraChange && !_camera._triggered) {
        engine.cameraRotate(azimuth + 90, polar);
        _camera._triggered = true;
      }
      else if (!_input.cameraChange && _camera._triggered) {
        _camera._triggered = false;
      }

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.center.data.forEach((rect, i) => {
        const indexOffset = i * 0.02;
        const driftX = Math.sin(driftFreqX * rect.params.frequency) * singleMotionX;
        const driftY = Math.cos(driftFreqY + indexOffset) * groupMotionY;
        const swarmX = Math.sin(swarmFreqX + indexOffset) * groupMotionX;

        rect.renderPosition.x += driftX + swarmX;
        rect.renderPosition.y += driftY;

        // Update frequency smoothly for a less repetitive individual motion
        rect.params.frequency = lerp(rect.params.frequency, rect.params.targetFrequency, 0.001);
      });

      // Update current attractor point
      const center = elements.center?.data[_state.center];

      // Scanned rects are attracted towards the swarm
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
        for (let i = 0; i < maxScans; i++) {
          const randomIndex = randomInt(0, elements.particles.data.length - 1);
          const instance = elements.particles.data[randomIndex];
          const flock = elements.center?.container;

          if (!flock || !instance) return;

          if (dummyVec.copy(flock.position).distanceTo(instance.position) < maxScanDistance) {
            _state.scans.push(randomIndex);
          }
        }

        // Assign connection starting point
        _state.center = randomInt(0, elements.center.data.length - 1);
      })

      // Reset screen positions
      bridge.clearAllScreenPositions();

      // Update scanned instances screen positions on every frame
      if (!isNaN(_state.center)) bridge.setInstancesScreenPositions(elementIds.SET_CENTERS, elementIds.MAIN, [_state.center]);
      if (_state.scans.length) bridge.setInstancesScreenPositions(elementIds.SET_SCANS, elementIds.PARTICLES, _state.scans);

      repeatEvery({ beats: 1 }, () => {
        elements.center?.data.forEach((rect, i) => {

          // Set a new target frequency
          if (chance(FREQUENCY_CHANCE)) {
            const frequency = rect.params.frequency + random(-0.2, 0.2);
            rect.params.targetFrequency = frequency;

            bridge.setSceneData((i).toString(), frequency)
          }
        })
      })
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.DATASET]: {
    init: (engine) => {
      const elements = { particles: engine.elements.get(elementIds.PARTICLES) }
      if (!elements.particles) return;

      _state = {
        store: [],
        fadeProgress: 0,
        fadeSteps: 3000,
      };

      _camera = {
        speedAngleX: 0.025,
        speedZoom: 0.25,
      }

      _state.fadeIndices = Array(elements.particles.data.length).fill(null).map(_ => randomInt(0, _state.fadeSteps))

      elements.particles.setVisibility(false);
    },

    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, beatCycle, currentBar } = engine.audioManager;
      const { knob2, knob3, knob6 } = midiState;

      const elements = {
        scan: useSceneManager().scene2D.value?.elements.get(elementIds.SCANS),
        particles: engine.elements.get(elementIds.PARTICLES),
      }

      if (!elements.scan || !elements.particles) return;

      // Handles start and end transitions
      if (!ended && _state.fadeProgress < _state.fadeSteps) {

        // Show gradually all elements
        elements.particles.data.forEach((_, i) => {
          if (_state.fadeIndices[i] == _state.fadeProgress) elements.particles?.setInstanceVisibility(i, true);
        })

        // Increase progress counter
        _state.fadeProgress++;
      }
      else if (ended) {
        if (_state.fadeProgress > 0) {
          // Hide gradually all elements
          elements.particles.data.forEach((_, i) => {
            if (_state.fadeIndices[i] == _state.fadeProgress) elements.particles?.setInstanceVisibility(i, false);
          })
  
          bridge.clearAllScreenPositions();

          // Increase progress counter
          _state.fadeProgress--;
        }
        return;
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      _input = {
        rectRotation1: harmonies.loudness, // Note: Update instrument
        rectRotation2: drums.centroid, // Note: Update instrument
        cameraRotationStep: harmonies.loudness, // Note: Update instrument
        cameraRotationFactor: knob2,
        scanChance: harmonies.loudness, // Note: Update instrument
        scanCountFactor: knob3,
      }

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0, max: 0.1 };
      const SHAPE_LOUDNESS_RANGE = { min: 0.25, max: 1 };
      const SHAPE_ROTATION_RANGE = { min: 0, max: 0.01 };
      
      // Computed audio values + MIDI
      const rectRotation1 = mapClamp(_input.rectRotation1, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const rectRotation2 = mapClamp(_input.rectRotation2, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const cameraRotationStep = mapClamp(_input.cameraRotationStep, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraRotationFactor = 0.5 + _input.cameraRotationFactor;
      const addScanChance = chance(_input.scanChance * (0.1 + currentBar() * 0.05));
      const removeScanChance = chance(0.07 + _input.scanChance * 0.2);
      const maxScans = Math.floor(currentBar() / 5) * (5 + _input.scanCountFactor * 5);

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0) + cameraRotationStep * cameraRotationFactor;
      const cameraZoom = (_camera.speedZoom || 0) * beatCycle(time, { beats: 8 })

      engine.cameraRotate(cameraAngleX, polar);
      engine.cameraZoom(cameraZoom);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      const columns = elements.particles.config.layout.dimensions?.x ?? 1;

      elements.particles.data.forEach((rect, i) => {
        const row = Math.floor(i / columns);
        const rotationIncr = (row % 2 === 0) ? rectRotation1 : rectRotation2;
        const hoverMotion = beatCycle(time, { beats: 8, offset: i * Math.PI / 4 });

        // Subtle hover motion
        rect.renderPosition.y = rect.position.y + hoverMotion;

        // Audio-driven rotation
        rect.renderRotation.x += rotationIncr * 0.5;
        rect.renderRotation.y += rotationIncr;
        rect.renderRotation.z += rotationIncr * 0.7;
      });

      // A. Clear
      bridge.clearAllScreenPositions();

      // B. Remove oldest index from local store
      if (removeScanChance && _state.store.length > 0) {
        _state.store.shift();
      }

      // C. Add index to local store if not already tracked
      if (addScanChance && _state.store.length < maxScans) {
        const randomIndex = randomInt(0, elements.particles.data.length - 1);
        // const pos = elements.particles.data[randomIndex]?.position ?? { x: 0, y: 0, z: 0 };

        if (!_state.store.includes(randomIndex)) {
          _state.store.push(randomIndex);
        }
      }

      // D. Synchronize set with local store
      if (_state.store.length > 0) {
        bridge.setInstancesScreenPositions(elementIds.SET_SCANS, elementIds.PARTICLES, _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.ESGIBTBROT]: {
    init: (engine) => {
      _state = {
        fadeProgress: 0,
        fadeStep: 8, // How many frames between each fade
        fadeElements: 7, // How many elements fade at once
      };

      _camera = {
        speedAngleX: 0.05,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3, knob4, knob5, knob6 } = midiState;

      const elements = {
        structure: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.structure) return;

      if (ended) {
        const step = Math.floor(_state.fadeProgress / _state.fadeStep)

        if (step > elements.structure.data.length / _state.fadeElements) return;

        // Hide gradually all elements
        for (let i = 0; i < _state.fadeElements; i++) {
          const index = step * _state.fadeElements + i;
          elements.structure?.setInstanceVisibility(index, false);
        }

        // Increase progress counter
        _state.fadeProgress++;
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      _input = {
        narrowFactor: harmonies.centroid || knob2, // Note: Update instrument
        bendIntensityX: drums.centroid || knob3, // Note: Update instrument
        bendIntensityY: harmonies.centroid || knob4, // Note: Update instrument
        bendFrequencyX: harmonies.loudness, // Note: Update instrument
        bendFrequencyY: bass.pitch, // Note: Update instrument
        deformationSpeed1: harmonies.loudness, // Note: Update instrument
        deformationSpeed2: bass.loudness, // Note: Update instrument
        cameraSpeedX: harmonies.loudness, // Note: Update instrument
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const RECT_DEFORMATION = { min: 0.25, max: 2.5 };
      const STRUCTURE_DISTORTION = 150;

      // Computed audio values + MIDI
      const structureNarrowFactor = mapLinear(_input.narrowFactor, 0, 1, 0.5, 1.5);
      const structureBendIntensityX = Math.sin(BASE_FREQ) * mapLinear(_input.bendIntensityX + 0.5, 0, 1, -STRUCTURE_DISTORTION, STRUCTURE_DISTORTION) * 0.33;
      const structureBendIntensityY = Math.sin(BASE_FREQ + Math.PI * 0.5) * mapLinear(_input.bendIntensityY + 0.5, 0, 1, -STRUCTURE_DISTORTION, STRUCTURE_DISTORTION) * 0.2;
      const structureBendFrequencyX = Math.PI * _input.bendFrequencyX;
      const structureBendFrequencyY = Math.PI * _input.bendFrequencyY * 5;

      const rectPrimaryDeformationSpeed = 2 + 0.1 * _input.deformationSpeed1;
      const rectSecondaryDeformationSpeed = 2 + 0.5 * _input.deformationSpeed2;
      const rectPrimaryDeformationInterval = 0.03085;
      const rectSecondaryDeformationInterval = 0.22;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + Math.cos(BASE_FREQ + _input.cameraSpeedX * Math.PI * 0.33) * (_camera.speedAngleX || 0);

      engine.cameraRotate(cameraAngleX, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      const { radius, pitch, count, verticalStep } = elements.structure.config.layout;
      const totalWidth = (radius || 100) * 2;
      const totalHeight = (radius || 100) * 2;
      const totalDepth = (pitch || 0.5) * (count || 100) * (verticalStep || 5);

      elements.structure.data.forEach((rect, i) => {
        // Update relative x, y, z for modifiers
        if (!rect.relative) rect.relative = { x: 0, y: 0, z: 0 };
        
        const mixedFrequencies = Math.sin(BASE_FREQ * rectPrimaryDeformationSpeed + i * rectPrimaryDeformationInterval)
                               * Math.sin(BASE_FREQ * rectSecondaryDeformationSpeed + i * rectSecondaryDeformationInterval)

        const scaleFactor = mapLinear(mixedFrequencies, -1, 1, RECT_DEFORMATION.min, RECT_DEFORMATION.max)

        rect.relative.x = rect.position.x / totalWidth;
        rect.relative.y = rect.position.y / totalHeight;
        rect.relative.z = rect.position.z / totalDepth;
        rect.renderScale.x = rect.scale.x * scaleFactor;

        // Apply Tunnel Bend
        Modifiers.gridBend(rect, {
          x: structureBendIntensityX,
          freqX: structureBendFrequencyX,
          y: structureBendIntensityY,
          freqY: structureBendFrequencyY,
        });

        Modifiers.gridNarrow(rect, 1, structureNarrowFactor)
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    end: (engine) => {

    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.FAKE_OUT]: {
    init: (engine) => {
      _state = {
        store: [],
        fadeInProgress: 0,
        fadeOutProgress: 0,
        fadeInSteps: 6000,
        fadeOutSteps: 600,
        fadeInIndices: [],
        fadeOutIndices: [],
      };

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      elements.grid.data.forEach((rect, i) => {
        if (!rect.motionSpeed) return;
        rect.params = {}
        rect.scale.y = random();
        rect.motionSpeed.scale.y = random(-0.0015, 0.0015);
        rect.params.scaleDirection = Math.sign(rect.motionSpeed.scale.y);

        _state.fadeInIndices.push(randomInt(150, _state.fadeInSteps))
        _state.fadeOutIndices.push(randomInt(0, _state.fadeOutSteps))
      });

      elements.grid.setVisibility(false);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const elements = {
        grid: engine.elements.get(elementIds.GRID)
      }

      if (!elements.grid) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;

      _input = {
        speedFactor1: harmonies.loudness, // Note: Update instrument
        speedFactor2: bass.loudness, // Note: Update instrument
        scaleFactor1: harmonies.loudness, // Note: Update instrument
        scaleFactor2: bass.loudness, // Note: Update instrument
        // Add camera rotation Y?
      }

      // Constants
      const SCALE_SPEED_RANGE = { min: 0.0005, max: 0.0015 };

      // Computed audio values + MIDI
      const speedFactor1 = (_input.speedFactor1 - knob2 * 5);
      const speedFactor2 = (_input.speedFactor2 - knob2 * 5);
      const scaleFactor1 = (1 - _input.scaleFactor1 - knob3);
      const scaleFactor2 = (1 - _input.scaleFactor2 - knob3);

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        if (!rect.motionSpeed) return;

        rect.position.y += rect.motionSpeed.position.y * (i % 2 == 0 ? speedFactor1 : speedFactor2);
        rect.scale.y -= rect.motionSpeed.scale.y * (i % 2 == 0 ? scaleFactor1 : scaleFactor2);

        // Invert direction
        if (rect.scale.y <= 0 && rect.params?.scaleDirection < 0) {
          rect.motionSpeed.scale.y = random(SCALE_SPEED_RANGE.min, SCALE_SPEED_RANGE.max);
          rect.params.scaleDirection = 1;
        }
        if (rect.scale.y >= 1 && rect.params?.scaleDirection > 0) {
          rect.motionSpeed.scale.y = random(-SCALE_SPEED_RANGE.max, -SCALE_SPEED_RANGE.min);
          rect.params.scaleDirection = -1;
        }
      });

      // Handles start and end transitions
      if (!ended && _state.fadeInProgress < _state.fadeInSteps) {
        // Show gradually all elements
        elements.grid.data.forEach((_, i) => {
          if (_state.fadeInIndices[i] === _state.fadeInProgress) elements.grid?.setInstanceVisibility(i, true);
        })

        // Increase progress counter
        _state.fadeInProgress++;
      }
      if (ended && _state.fadeOutProgress < _state.fadeOutSteps) {
        // Hide gradually all elements
        elements.grid.data.forEach((_, i) => {
          if (_state.fadeOutIndices[i] == _state.fadeOutProgress) {
            elements.grid?.setInstanceVisibility(i, false);
          }
        })

        // Increase progress counter
        _state.fadeOutProgress++;
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {
      _state = {
        store: [],
        distortion: 50,
        fadeProgress: 0,
        fadeSteps: 3000,
      };

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      _state.fadeIndices = Array(elements.grid.data.length).fill(null).map(_ => randomInt(0, _state.fadeSteps))

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob2, knob3 } = midiState;
      
      const elements = {
        grid: engine.elements.get(elementIds.GRID),
        labels: useSceneManager().scene2D.value?.elements.get(elementIds.TEXT),
        scans: useSceneManager().scene2D.value?.elements.get(elementIds.SCANS),
      }

      if (!elements.grid || !elements.labels || !elements.scans) return;

      if (ended) {
        elements.grid.data.forEach((rect, i) => {
          
          // Initially, hide gradually all elements
          if (_state.fadeProgress < _state.fadeSteps - 500) {
          
            if (_state.fadeIndices[i] == _state.fadeProgress) elements.grid?.setInstanceVisibility(i, false);

            if (rect.motionSpeed && rect.motionSpeed.position.z > 0.002) {
              rect.motionSpeed.position.z -= 0.0027;
            }
          }

          // Then arrange the remaining shapes into a grid
          else if (rect.grid && rect.motionSpeed) {
            rect.position.x = lerp(rect.position.x, -550 + rect.grid.x * 30, 0.001);
            rect.position.y = lerp(rect.position.y, -250 + rect.grid.y * 30, 0.001);
            rect.position.z = lerp(rect.position.z, 1750 + rect.grid.z * 30, 0.001);
  
            rect.scale.x = lerp(rect.scale.x, 0.002, 0.001);
            rect.scale.y = lerp(rect.scale.y, 0.02, 0.001);
  
            rect.motionSpeed.position.set(0, 0 ,0);
          }
        })

        // Slowly normalize distortion
        _state.distortion = lerp(_state.distortion, 0, 0.002)

        // Increase progress counter
        _state.fadeProgress++;
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;

      _input = {
        scanChance: drums.loudness, // Note: Update instrument
        scanMinX: drums.loudness, // Note: Update instrument
        scanMaxX: drums.loudness, // Note: Update instrument
        scanMinY: harmonies.loudness, // Note: Update instrument
        scanMaxY: harmonies.loudness, // Note: Update instrument
        rectRotationX: texture.loudness, // Note: Update instrument
        narrowFactor: knob2, // Note: Update instrument
        slopeFactor: knob3, // Note: Update instrument
      }

      // Constants
      const BASE_FREQ = time * 0.001
      const VISIBILITY_RANGE_X = { min: -2000, max: 2000 };
      const VISIBILITY_RANGE_Z = { min: -4000, max: 500 };
      const SLOPE_FACTOR = { top: 50, bottom: -150 }; // slope Y of the top and bottom layer
      const GRID_OFFSET_Z = 2000;
      
      const { dimensions, spacing } = elements.grid.config.layout;
      if (!dimensions || !spacing) return;

      const totalWidth = (dimensions.x * spacing.x) || 1;
      const totalHeight = (dimensions.y * spacing.y) || 1;
      const totalDepth = (dimensions.z * spacing.z) || 1;

      // Computed audio values + MIDI
      const maxScans = elements.scans.config.layout.count || 10;
      const addScanChance = ended ? 0 : chance(0.35 + _input.scanChance);
      const minVisibilityX = _input.scanMinX * VISIBILITY_RANGE_X.min;
      const maxVisibilityX = _input.scanMaxX * VISIBILITY_RANGE_X.max;
      const minVisibilityZ = (0.5 + _input.scanMinY) * VISIBILITY_RANGE_Z.min;
      const maxVisibilityZ = (0.5 + _input.scanMaxY) * VISIBILITY_RANGE_Z.max;
      const narrowFactor = 0.25 + _input.narrowFactor * 0.5;
      const rectRotation = _input.rectRotationX;
      const slopeFactorTop = SLOPE_FACTOR.top * (0.5 + _input.slopeFactor);
      const slopeFactorBottom = SLOPE_FACTOR.bottom * (0.5 + _input.slopeFactor);

      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = dummyVec.copy(engine.getCameraPosition());
      cameraPos.z += GRID_OFFSET_Z;

      // --- 3. INSTANCE TRANSFORMATIONS ---

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
        Modifiers.gridNarrow(rect, 1, narrowFactor);

        // Apply slope
        const slopeValue = isTopLayer ? slopeFactorTop : slopeFactorBottom;
        Modifiers.gridSlope(rect, slopeValue);

        // Elements rotate independently
        if (rectRotation) {
          const rotationFactor = Math.PI * Math.sin(BASE_FREQ * (i % 2 == 0 ? 2 : -2) + i * 0.01);
          rect.renderRotation.y = rectRotation * rotationFactor;
        }
        // Elements look at camera
        else if (cameraPos && !rectRotation) {
          Modifiers.lookAt(rect, cameraPos)
        }

        // Apply Tunnel Bend
        const bendAmount = _state.distortion * Math.sin(BASE_FREQ);
        Modifiers.gridBend(rect, {
          x: bendAmount,
          freqX: Math.PI * 5,
        });


        // Restore visibility on position reset
        if (elements.grid.resetIds.includes(i) && !ended) {
          elements.grid.setInstanceVisibility(i, true);

          // Scale element on reset
          rect.scale.x = random(0.25, 2.5);
          rect.scale.y = random(0.25, 2.5);
        }
      })

      // Update screen positions
      bridge.clearAllScreenPositions();

      // A. Adding logic
      if (addScanChance && _state.store.length < maxScans) {
        const randomIndex = randomInt(0, elements.grid.data.length - 1);
        const pos = elements.grid.data[randomIndex]?.position ?? { x: 0, y: 0, z: 0 };

        // Only add if it's in the "Sweet Spot" and not already tracked
        const isCentral = pos.x > minVisibilityX && pos.x < maxVisibilityX;
        const isVisibleRange = pos.z > minVisibilityZ && pos.z < maxVisibilityZ;
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
        bridge.setInstancesScreenPositions(elementIds.SET_SCANS, elementIds.GRID, _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 0 }, () => {
        if (!elements.grid || !elements.scans || !elements.labels) return;

        elements.scans.config.style.color = Palette.GREEN;
        elements.labels.config.style.background = Palette.GREEN;

        _state.store.forEach((id: number) => {
          elements.grid?.setInstanceVisibility(id, false);
        })
      })

      repeatEvery({ beats: 4, offset: 1 }, () => {
        if (!elements.grid || !elements.scans || !elements.labels) return;

        _state.store = [];
        elements.scans.config.style.color = Palette.RED;
        elements.labels.config.style.background = Palette.RED;
      })
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.GHOSTSSS]: {
    init: (engine) => {
      _state = {
        rotationProgress: 0,
        targetCells: { x: [], z: [] },
        targetProgress: 0,
      }

      _camera = {
        angleY: 90,
        minAngleX: 15,
        maxAngleX: 60,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery, currentBar, beatDuration } = engine.audioManager;
      const { knob3, knob4, knob5, pad1 } = midiState;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;

      _input = {
        gridDistortion1: harmonies.loudness, // Note: Update instrument
        gridDistortion2: knob4, // Note: Update instrument
        gridDistortionCenter: texture.loudness, // Note: Update instrument
        gridDistortionDepth: knob5, // Note: Update instrument
        triggerCountFactor: knob3, // Note: Update instrument
        scaleTrigger: drums.onOff,
        cameraChange: pad1,
      }

      // Constants
      const BASE_FREQ = 0.001;
      const DISTORTION_AMPLITUDE = 25;
      const SCALE_FACTOR = 30;
      const INTRO_BARS = 6;
      const TRIGGER_CAMERA_CHANCE = 0.15;
      const START_POSITIONS_X = [0, 1, 2, 3, 4, 11, 12, 13, 14, 15];

      // Computed audio values + MIDI
      const primaryDistortionIntensity = _input.gridDistortion1 * DISTORTION_AMPLITUDE;
      const primaryDistortionFrequency = Math.PI / 2;
      const secondaryDistortionIntensity = _input.gridDistortion2 * DISTORTION_AMPLITUDE;
      const secondaryDistortionFrequency = 0.031;
      const centerDistortionIntensity = _input.gridDistortionCenter * DISTORTION_AMPLITUDE * 4;
      const centerDistortionFrequency = Math.PI / 16;
      const depthDistortionIntensity = _input.gridDistortionDepth * DISTORTION_AMPLITUDE * -3;
      const depthDistortionFrequency = Math.PI / 16;
      const scaleTrigger = _input.scaleTrigger;
      const scaleStep = 1 / 80;
      const isIntro = currentBar() < INTRO_BARS;
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const rotationDuration = INTRO_BARS * (beatDuration() / 1000) * 4; // duration in seconds
      const rotationIncrement = 1 / (rotationDuration * 60);
      
      // Initial camera rotation
      if (_state.rotationProgress < 1) {
        const cameraAngleY = Easing.POWER2_IN_OUT(_state.rotationProgress) * (_camera.angleY || 0);
        engine.cameraRotate(azimuth, cameraAngleY)  
        _state.rotationProgress += rotationIncrement;
      }
      else {
        // Manually switch camera view
        if (_input.cameraChange && !_camera._triggered) {
          engine.cameraRotate(azimuth + random((_camera.minAngleX || 0), (_camera.maxAngleX || 0)), polar);
          _camera._triggered = true;
        }
        else if (!_input.cameraChange && _camera._triggered) {
          _camera._triggered = false;
        }
      }

      // --- 3. INSTANCE TRANSFORMATIONS ---

      // When drum is hit, calculate new random index
      if (!isIntro && !ended && scaleTrigger) {
        _state.targetCells = {};

        // Calculate random row (x) or depth row (x) of cells
        const startX = random(START_POSITIONS_X);
        const startZ = randomInt(0, 15);
        const axis = random(['x', 'z']) 
        const rectCount = randomInt(2 + _input.triggerCountFactor * 2, 8 + _input.triggerCountFactor * 8);

        _state.targetCells = { 
          x: axis == 'x' ? Array(rectCount).fill(null).map((_, i) => startX + (startX < 7 ? -i : i)) : [ startX ],
          z: axis == 'z' ? Array(rectCount).fill(null).map((_, i) => startZ + i) : [ startZ ],
        };

        _state.targetProgress = 0;
      }

      elements.grid.data.forEach((rect, i) => {
        if (!rect.grid) return

        // Depth-based pitch shifting
        // rect.renderPosition.z = rect.position.z + (i % 30) * texture.loudness;

        // Harmonic wave
        rect.renderPosition.y = rect.position.y
          + Math.cos(time * BASE_FREQ * 3 + i * primaryDistortionFrequency) * primaryDistortionIntensity
          + Math.sin(time * BASE_FREQ + rect.grid.x * secondaryDistortionFrequency) * secondaryDistortionIntensity
          + Math.sin(centerDistortionFrequency + rect.grid.x * centerDistortionFrequency) * centerDistortionIntensity
          + Math.sin(depthDistortionFrequency + rect.grid.z * depthDistortionFrequency) * depthDistortionIntensity;

        // Reduce scale
        const targetScale = ended ? 0.1 : 1;

        if (rect.scale.y > targetScale) {
          rect.scale.y = lerp(rect.scale.y, targetScale, Easing.CIRC_IN(_state.targetProgress));
        }
        if (rect.scale.x > targetScale) {
          rect.scale.x = lerp(rect.scale.x, targetScale, Easing.CIRC_IN(_state.targetProgress));
        }

        if (drums.onOff) {
          if (_state.targetCells.x.includes(rect.grid?.x) && _state.targetCells.z.includes(rect.grid?.z)) {
            rect.scale.y = SCALE_FACTOR;
            rect.scale.x = SCALE_FACTOR;
          }
        }
      });

      if (_state.targetProgress < 1) {
        _state.targetProgress += scaleStep;
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 1 }, () => {

        // Switch camera view
        if (!isIntro && chance(TRIGGER_CAMERA_CHANCE)) {
          engine.cameraRotate(azimuth + random((_camera.minAngleX || 0), (_camera.maxAngleX || 0)), polar);
        }
      })
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.LIKE_NOTHING]: {
    init: (engine) => {
      _state = {
        store: [],
        fadeProgress: 0,
        progress: 0,
      }

      _camera = {
        speedAngleX: 0.1,
        speedZoom: 0.5,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.data.forEach((rect, i) => {
        rect.params = {
          rotationPeriod: i * 0.0005,
          rotationSpeed: 0.25,
        }
      })

      engine.cameraMaxDistance(1500);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery, beatCycle } = engine.audioManager;
      const { knob2, knob3, knob4, knob5, knob6 } = midiState;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      };

      if (!elements.grid) return;

      if (ended) {
        if (_state.fadeProgress == 0) elements.grid?.setVisibility(false);
        _state.fadeProgress++;
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;

      _input = {
        scaleFactor1: knob2, // Note: update instrument
        indexFactor1: knob2, // Note: update instrument
        scaleFactor2: knob3, // Note: update instrument
        indexFactor2: knob3, // Note: update instrument
        scaleFactor3: knob4, // Note: update instrument
        indexFactor3: knob4, // Note: update instrument
        scaleFactor4: knob5, // Note: update instrument
        indexFactor4: knob5, // Note: update instrument
        scaleFactor5: knob6, // Note: update instrument
        indexFactor5: knob6, // Note: update instrument
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const RESET_SCALE_FACTOR = 0.005;

      // Computed audio values + MIDI
      const scaleFactors = [_input.scaleFactor1, _input.scaleFactor2, _input.scaleFactor3, _input.scaleFactor4, _input.scaleFactor5];
      const indexFactors = [_input.indexFactor1, _input.indexFactor2, _input.indexFactor3, _input.indexFactor4, _input.indexFactor5];

      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleY = azimuth + (_camera.speedAngleX || 0);
      const cameraZoom = (_camera.speedZoom || 0) * beatCycle(time, { beats: 48 })

      engine.cameraRotate(cameraAngleY, polar);
      engine.cameraZoom(cameraZoom);
            
      // --- 3. INSTANCE TRANSFORMATIONS ---
      const wobble = new THREE.Euler();

      elements.grid.data.forEach((rect, i) => {
        const period = rect.params?.rotationPeriod || 0;
        const speed = rect.params?.rotationSpeed || 0;
        const currentAngle = Math.sin(BASE_FREQ * speed + period) * Math.PI;
  
        wobble.set(0, 0, currentAngle);
        Modifiers.lookAt(rect, cameraPos, wobble)

        // Restore original size over time
        if (rect.scale.y > 1) rect.scale.y -= RESET_SCALE_FACTOR;
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        let ax, bx, ay, by, az, bz;

        // Transformations depend on different instruments in loop
        const step = _state.progress % indexFactors.length;
        const scaleFactor = scaleFactors[step];
        const indexFactor = indexFactors[step];

        // Randomize the period for specific range
        const dimensions = elements.grid?.config.layout.dimensions;
        const period = mapClamp(indexFactor, 0, 1, 0, 0.001) * random([-1, 1]); // was random(-0.001, 0.001)
        const scale = mapClamp(scaleFactor, 0, 1, 1, 10); // was random(3, 10)
        const speed = random(-0.1, 0.1);
        const maxX = dimensions?.x || 10;
        const maxY = dimensions?.y || 10;
        const maxZ = dimensions?.z || 10;
        // const periodChance = chance(0.5);

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
        let targetIndex = 0;
        elements.grid?.data.forEach((rect, i) => {
          if (rect.grid &&
            rect.grid.x >= range.x[0]! && rect.grid.x <= range.x[1]! &&
            rect.grid.y >= range.y[0]! && rect.grid.y <= range.y[1]! &&
            rect.grid.z >= range.z[0]! && rect.grid.z <= range.z[1]!
          ) {
            rect.params.rotationPeriod = lerp(rect.params.rotationPeriod, period * targetIndex, 0.75);
            rect.params.rotationSpeed += speed;
            rect.scale.y = scale;

            targetIndex++;
          }
        })

        _state.progress++;
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

      bridge.setInstancesScreenPositions(elementIds.SET_CONNECTIONS, elementIds.GRID, vertices);
    },
    dispose: (engine) => {
      engine.cameraMaxDistance(1000);

      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.MITTERGRIES]: {
    init: (engine) => {
      _state = {
        fadeProgress: 0,
        fadeSteps: 240,
      };

      _camera = {
        speedZoom: 0.04,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) }

      _state.fadeIndices = Array(elements.grid?.data.length).fill(null).map(_ => randomInt(0, _state.fadeSteps))
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { ended } = useSceneState().value;
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3, knob4, knob5, knob6 } = midiState;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      if (ended) {
        if (_state.fadeProgress > _state.fadeSteps) return;

        // Hide gradually all elements
        elements.grid.data.forEach((_, i) => {
          if (_state.fadeIndices[i] == _state.fadeProgress) elements.grid?.setInstanceVisibility(i, false);
        })

        // Increase progress counter
        _state.fadeProgress++;
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;

      _input = {
        rowFactor1: knob2, // Note: update instrument
        rowFactor2: knob3, // Note: update instrument
        rowFactor3: knob4, // Note: update instrument
        rowFactor4: knob5, // Note: update instrument
        rowFactor5: knob6, // Note: update instrument
        singleFactor1: knob2, // Note: update instrument
        singleFactor2: knob3, // Note: update instrument
        singleFactor3: knob4, // Note: update instrument
        singleFactor4: knob5, // Note: update instrument
        singleFactor5: knob6, // Note: update instrument
      }

      // Constants
      const MAX_ROW_SPEED = 0.5;
      const MAX_SINGLE_SPEED = 0.25;

      // Computed audio values + MIDI
      const rowSpeedFactors = [_input.rowFactor1, _input.rowFactor2, _input.rowFactor3, _input.rowFactor4, _input.rowFactor5];
      const singleSpeedFactors = [_input.singleFactor1, _input.singleFactor2, _input.singleFactor3, _input.singleFactor4, _input.singleFactor5];

      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraZoom = (_camera.speedZoom || 0);
      engine.cameraZoom(cameraZoom);

      // --- 3. INSTANCE TRANSFORMATION SECTION ---
      elements.grid.data.forEach((rect, i) => {
        if (!rect.grid) return;

        // Speed variation depends on rect's row and column
        const { y: row, x: col } = rect.grid;
        const rowSpeedFactor = rowSpeedFactors[row % rowSpeedFactors.length] * MAX_ROW_SPEED;
        const singleSpeedFactor = singleSpeedFactors[col % singleSpeedFactors.length] * MAX_SINGLE_SPEED;
        
        rect.position.x += rowSpeedFactor + singleSpeedFactor;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.MTGO]: {
    init: (engine) => {
      _state = {
        store: [],
      };

      const elements = {
        main: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.main) return;

      // Set random frequency to each element for more natural movement
      elements.main.data.forEach(rect => {
        rect.params = {};
        rect.params.amplitude = random(10, 50);
        rect.params.targetAmplitude = rect.params.amplitude;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { setInstancesScreenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery, beatCycle, currentBar } = engine.audioManager;
      const { knob1, knob2 } = midiState;

      const elements = {
        main: engine.elements.get(elementIds.MAIN),
        connections: useSceneManager().scene2D.value?.elements.get(elementIds.CONNECTIONS),
      }

      if (!elements.main) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0.05, max: 1 };
      const maxPoints = Math.min(currentBar() + 1, elements.main.data.length);
      
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
      elements.main.data.forEach((rect, i) => {
        rect.params.amplitude = lerp(rect.params.amplitude, rect.params.targetAmplitude, 0.05);

        const oscillationY = beatCycle(time, { beats: 8, offset: i * (Math.PI / 4) }) * rect.params.amplitude;
        const oscillationX = Math.abs(beatCycle(time, { beats: 8, offset: i * (Math.PI / 2) }) * rect.params.amplitude / 4);

        rect.renderPosition.y = rect.position.y + oscillationY * amplitude;
        rect.renderPosition.x = rect.position.x + oscillationX;
      })

      // Update instance screen position for 2D connection lines
      if (elements.connections) {
        // Store position indices, if not set
        if (_state.store.length < elements.connections.data.length) _state.store = Array(maxPoints).fill(null).map((_, i) => i);

        // Update all instances positions
        setInstancesScreenPositions(elementIds.SET_CONNECTIONS, elementIds.MAIN, _state.store);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 1 }, () => {
        // Randomize the oscillation amplitude
        elements.main?.data.forEach((rect) => {
          const oscillationChance = chance(0.25);
          if (oscillationChance) rect.params.targetAmplitude = random(5, 40);
        })
      })
    },
    dispose: (engine) => {
      _state = {};
    }
  },

  [Scenes.RFBONGOS]: {
    init: (engine) => {
      _state = {
        _dummy: new THREE.Euler(),
        fadeProgress: 0,
      }

      const elements = {
        grid: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.grid) return;

      elements.grid.setVisibility(false);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio, currentBar } = engine.audioManager;

      const elements = {
        grid: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.grid) return;

      if (ended) {
        if (_state.fadeProgress > 0) return;

        elements.grid.setVisibility(false);
        _state.fadeProgress++;
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      
      // Constants

      // Computed audio values + MIDI
      const minShapes = 5;
      const maxShapes = drums.loudness * (4 + currentBar());

      // Camera params
      const CAMERA_CONFIG = {
        angleSpeed: 0.05,
        angleIncrement: 0.0035,
        angleZoom: 0.02,
      }
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const cameraAngleX = azimuth + CAMERA_CONFIG.angleSpeed + CAMERA_CONFIG.angleIncrement * currentBar();
      const cameraZoom = CAMERA_CONFIG.angleZoom

      engine.cameraZoom(cameraZoom);
      engine.cameraRotate(cameraAngleX, polar);
      

      // --- 3. INSTANCE TRANSFORMATIONS ---
      let incr = 0;
      if (drums.onOff) {
        incr = randomInt(0, mapQuantize(drums.loudness, 0, 1, 21, 4));

        elements.grid.setVisibility(false);
      }

      elements.grid.data.forEach((rect, i) => {
        rect.renderPosition.copy(rect.position);

        // Calculate audio-reactive angle
        const angleMin = Math.PI * 0.5;
        const angleMax = angleMin + Math.PI * (i%2 == 0 ? 1 : 0);
        const currentAngle = mapLinear(drums.loudness, 0.3, 0.5, angleMin, angleMax);

        // Set the relative X rotation
        _state._dummy.set(currentAngle, 0, 0);

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos, _state._dummy)

        if (drums.onOff && i % incr == randomInt(0, 1)) {
          elements.grid?.setInstanceVisibility(i, true);
        }
      })
      
      // if (drums.onOff) {
      //   const shapesToActivate = randomInt(minShapes, maxShapes);

      //   elements.grid.setVisibility(false);
        
      //   const incr = randomInt(0, mapQuantize(drums.loudness, 0, 1, 21, 4));

      //   for (let i = 0; i < shapesToActivate; i++) {
      //     const randomIndex = randomInt(0, elements.grid.data.length - 1);
      //     elements.grid.setInstanceVisibility(randomIndex, true);
      //   }
      // }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    }
  },

  [Scenes.SISTEMA]: {
    init: (engine) => {
      _state = {
        isCirclesVisible: false,
      }

      const elements = {
        circles: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.circles?.uniforms?.uThickness) return;
      elements.circles.uniforms.uThickness.value = 0;
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery, executeAt } = engine.audioManager;

      const elements = {
        circles: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.circles) return;
      
      // Audio channels

      // Constants
      const SCALE_FACTOR = 0.00005;
      const HIDE_CHANCE = 0.2;
      const RESET_CHANCE = 0.5;

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      if (_state.isCirclesVisible) {
        elements.circles.data.forEach((rect, i) => {
          rect.scale.x += rect.scale.x * SCALE_FACTOR;
          rect.scale.y += rect.scale.y * SCALE_FACTOR;
          rect.scale.z += rect.scale.z * SCALE_FACTOR;
        })
        
        // --- 4. MUSICAL EVENTS & TRIGGERS ---
        repeatEvery({ beats: 2 }, () => {
          elements.circles?.data.forEach((rect, i) => {
            // Stop movement and hide circles when track ends
            if (ended) {
              if (chance(HIDE_CHANCE)) {
                rect.motionSpeed?.position.set(0, 0, 0);
                rect.motionSpeed?.scale.set(0, 0, 0);
                rect.scale.set(0, 0, 0);
              }
            }
            else if (rect.motionSpeed && chance(RESET_CHANCE)) {
              const positionSpeed = random(0.25, 5);
              const scaleSpeed = random(0.005, 0.025);

              rect.motionSpeed?.position.set(0, 0, positionSpeed);
              rect.motionSpeed?.scale.set(scaleSpeed, scaleSpeed, scaleSpeed);
              rect.scale.set(1, 1, 1);
            }
          })
        })
      }

      executeAt({ beats: 72 }, () => {
        if (!elements.circles?.uniforms?.uThickness || ended) return;
        elements.circles.uniforms.uThickness.value = elements.circles.config.style.thickness;
        _state.isCirclesVisible = true;
      })
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.SOLO_01]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
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

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
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

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
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

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
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

      const elements = {
        matrix: engine.elements.get(elementIds.GRID),
        main: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.matrix || !elements.main) return;

      // Hide all sphere matrix instances
      elements.matrix.data.forEach(rect => {
        rect.scale.setScalar(0);
      });

      // Set only one point visible
      _state.activePoints.forEach((index: number) => {
        elements.main?.setInstanceVisibility(index, _state.activePoints.includes(index))
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;

      const elements = {
        matrix: engine.elements.get(elementIds.GRID),
        main: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.matrix || !elements.main) return;

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
      _state.connections = Array(elements.main.data.length).fill(null).map(_ => []);

      elements.matrix.data.forEach((rect, index) => {
        if (!elements.main) return;
        const [sphereColumn, sphereRow, sphereDepth] = rect.params.sphereIndex;
        
        // Find closest particle distance
        let minParticleDist = Infinity;
        let particleIndex = -1;

        elements.main.data.forEach(p => {
          const d = p.position.distanceTo(rect.position);
          if (d < minParticleDist) {
            minParticleDist = d;
            particleIndex = p.id;
          }
        });

        // Store connections as [rectId]: particleId
        if (minParticleDist < connectionDistance && chance(CONNECTION_CHANCE)) {
          _state.connections[particleIndex].push(index);
        }

        const distFactor = mapClamp(minParticleDist, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        
        // Audio reaction: Harmonies drive the matrix pulse
        const audioScale = mapLinear(harmonies.loudness, 0, 1, 0.8, 2.5);
        const pulse = Math.sin(BASE_FREQ * 2 + sphereDepth + sphereColumn) * 0.1;
        
        rect.scale.setScalar(distFactor * audioScale + pulse);
      });

      elements.main.data.forEach((rect) => {
        if (!elements.main) return;

        // Main points always look at camera
        rect.renderPosition.copy(rect.position);
        Modifiers.lookAt(rect, cameraPos);

        // Recalculate direction and speed when particle hits bounds
        if (elements.main.resetIds.length > 0 && elements.main.resetIds.includes(rect.id)) {

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

      // 1. Main points coords
      bridge.setInstancesScreenPositions(elementIds.SET_CENTERS, elementIds.MAIN, _state.activePoints);

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
        bridge.setInstancesScreenPositions(elementIds.SET_CONNECTIONS, elementIds.GRID, connections, targets);
      }
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.STRANGE_ATTRACTOR]: {
    init: (engine) => {
      const MIN_DISTANCE = 250;
      const MAX_DISTANCE = 500;

      const elements = {
        ringLeft: engine.elements.get(elementIds.PARTICLES),
        ringRight: engine.elements.get(elementIds.PARTICLES_2),
      }

      elements.ringLeft?.data.forEach((rect) => {
        const dist = rect.position.length();
        
        // Constrain rects in a ring
        if (dist < MIN_DISTANCE || dist > MAX_DISTANCE) {
          const targetDist = MIN_DISTANCE + random(MAX_DISTANCE - MIN_DISTANCE);
          rect.position.normalize().multiplyScalar(targetDist);
        }
      })

      elements.ringRight?.data.forEach((rect) => {
        const dist = rect.position.length();
        
        // Constrain rects in a ring
        if (dist < MIN_DISTANCE || dist > MAX_DISTANCE) {
          const targetDist = MIN_DISTANCE + random(MAX_DISTANCE - MIN_DISTANCE);
          rect.position.normalize().multiplyScalar(targetDist);
        }
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const elements = {
        ringLeft: engine.elements.get(elementIds.PARTICLES),
        ringRight: engine.elements.get(elementIds.PARTICLES_2),
      }

      if (!elements.ringLeft || !elements.ringRight) return;
      
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

      // Get the rotation of the container
      const leftQuat = elements.ringLeft.mesh.quaternion;
      const rightQuat = elements.ringLeft.mesh.quaternion;

      elements.ringLeft.data.forEach((rect, i) => {
        // Set angular rotation
        const swirlForce = mapClamp(rect.position.length(), 0, 500, ANGULAR_RANGE.min, ANGULAR_RANGE.max) * harmonyImpact;
        Modifiers.setOrbit(rect, swirlForce);

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos, undefined, leftQuat);
      })

      elements.ringRight.data.forEach((rect, i) => {
        // Set angular rotation
        const swirlForce = mapClamp(rect.position.length(), 0, 500, ANGULAR_RANGE.min, ANGULAR_RANGE.max) * harmonyImpact;
        Modifiers.setOrbit(rect, swirlForce);

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos, undefined, rightQuat);
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
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery, beatCycle, barSubBeat, currentBar } = engine.audioManager;
      
      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.001;
      const BASE_POLAR_ANGLE = 90;

      // Computed audio values + MIDI
      const bassImpact = bass.loudness * 8;
      const positionStepZ = currentBar();
      const rotationAngle = beatCycle(time, { beats: 4 }) * Math.PI * 0.1;
      const activeCount = 2 + harmonies.loudness * 20;

      // Camera params
      const { azimuth } = engine.getCameraAngles();
      const zoom = engine.controls.getDistance();
      const CAMERA_CONFIG = {
        zoomSpeed: 0.04,
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
        rect.renderPosition.z = rect.position.z + Math.floor(Math.sin(BASE_FREQ * 0.2 + indexOffset) * bassImpact) * positionStepZ;
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 2 }, () => {
        if (!elements.grid || ended) return;

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

        // Force hide all when track is ended
        if (ended) elements.grid.setVisibility(false);

        for (let i = 0; i < activeCount; i++) {
          const randomIndex = randomInt(0, elements.grid.data.length);
          elements.grid.mesh.setColorAt(randomIndex, activeColor);

          // Red elements are visible also when track is ended
          if (ended && chance(0.05)) elements.grid.setInstanceVisibility(randomIndex, true);

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
      _state = {
        store: [],
        progress: 0,
        randomDirection: 0,
        color: new THREE.Color(),
      };

      const elements = {
        grid: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.grid) return;

      elements.grid.data.forEach((rect) => {
        const ringIndex = rect.grid?.y || 0;
    
        // Alternate directions: Even rings go left, odd go right
        const direction = ringIndex % 2 === 0 ? 1 : -1;
        const speed = random(0.0005, 0.005)

        rect.params = {
          prevPosY: rect.position.y,
        }

        Modifiers.setOrbit(rect, speed * direction);
      });

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery } = engine.audioManager;

      const elements = {
        grid: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BASE_FREQ = time * 0.002;
      const harmoniesCentroid = harmonies.centroid;
      const drumsCentroid = drums.centroid;
      const rows = elements.grid.config.layout.dimensions?.y || 10;
      const rowHeight = elements.grid.config.style.size.y;
      const step = 1 / 120; // 1 / SECONDS * FPS

      // Computed audio values + MIDI

      // Camera params

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---

      // Reset local store and element visibility
      elements.grid.setVisibility(false);
      _state.store = [];

      elements.grid.data.forEach((rect, i) => {
        const isOnScreen = rect.position.z > 25 && rect.position.x < 180 && rect.position.x > -180;
        // const isOnScreen = rect.position.z < 25;

        // Store data for 2d rendering
        _state.store.push({
          visibility: isOnScreen,
          text: (rect.renderScale.x * 0.2 * Math.sign(rect.motionSpeed?.angular || 1)).toFixed(4)
        });

        if (rect.motionSpeed) {
          if (!ended) {
            rect.motionSpeed.scale.x = 0.1 * Math.sin(BASE_FREQ * 2 + i * 0.08) * harmoniesCentroid * drumsCentroid;
          }
          else {
            rect.motionSpeed.scale.x = 0;
            rect.scale.x = lerp(rect.scale.x, 0, 0.01);
          }
        }

        // Hide elements in the back side
        if (isOnScreen) {
          elements.grid?.setInstanceVisibility(i, true);
        }

        // Translate
        if (_state.progress < 0.9 && rect.params) {
          rect.position.y = rect.params.prevPosY + Easing.POWER3_IN_OUT(_state.progress) * _state.randomDirection * rowHeight;
        }
        else {
          rect.params.prevPosY = rect.position.y;
        }

        // Always look at Y axis
        dummyVec.set(0, rect.position.y, 0);
        Modifiers.lookAt(rect, dummyVec);
      });

      // Store to be rendered in grid
      bridge.setSceneData(elementIds.SET_TEXT, _state.store)

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      if (_state.progress < 1) {
        _state.progress += step;
      }

      repeatEvery({ beats: 3 }, () => {
        if (ended) return;

        _state.progress = 0;
        _state.randomDirection = random([-2, -1, 0, 0, 0, 1, 2]);

        // Apply new radial speed to the whole ring
        const randomIndex = randomInt(0, rows - 1);

        elements.grid?.data.forEach((rect, i) => {
          if (rect.grid?.y == randomIndex) {
            const direction = randomIndex % 2 === 0 ? 1 : -1;
            const speed = 0; // random(0.0005, 0.005)
            
            Modifiers.setOrbit(rect, speed * direction);
            
            const activeColor = _state.color.set(Palette.RED);
            elements.grid?.mesh.setColorAt(i, activeColor);
          }
          // Reset black color
          else {
            const direction = randomIndex % 2 === 0 ? 1 : -1;
            const speed = random(0.0001, 0.0007)

            Modifiers.setOrbit(rect, speed * Math.abs(randomIndex - (rect.grid?.y || 5)) * direction);

            const baseColor = _state.color.set(Palette.DARK);
            elements.grid?.mesh.setColorAt(i, baseColor);
          }
        })
      })
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.USBTEC]: {
    init: (engine) => {
      _state = {
        centers: [],
        connections: Array(3).fill(null).map(_ => []),
        instanceIds: Array(3).fill(null).map(_ => []),
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, beatCycle, currentBar } = engine.audioManager;
      const { knob2, knob3 } = midiState;

      const elements = {
        origins: engine.elements.get(elementIds.MAIN),
        particles: [
          engine.elements.get(elementIds.PARTICLES),
          engine.elements.get(elementIds.PARTICLES_2),
          engine.elements.get(elementIds.PARTICLES_3),
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
      const MAX_POINTS = 92;

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
      
      // Clear positions
      bridge.clearAllScreenPositions();

      // 1. Set center positions
      if (!_state.centers.length) {
        _state.centers.push(...Array(elements.origins.data.length).fill(null).map((_, i) => i));
      }

      bridge.setInstancesScreenPositions(elementIds.SET_CENTERS, elementIds.MAIN, _state.centers);

      // Store the IDs of instances whose position has been reset
      elements.particles?.forEach((element, i) => {
        if (!_state.connections[i]) return;

        // 1. Adding logic
        if (element?.resetIds.length) {

          for (let id = 0; id < MAX_POINTS; id++) {
            const newId = element.resetIds[id];

            // Store connection ids
            if (newId && newId > 2 && !_state.connections[i].includes(newId)) {
              _state.connections[i].push(newId);
            }
          }
        }

        // 2. Removing logic
        if (_state.connections[i].length > MAX_POINTS) {
          const overflow = _state.connections[i].length - MAX_POINTS;
          _state.connections[i].splice(0, overflow);
        }

        if (element) {
          // Update screen positions
          bridge.setInstancesScreenPositions(elementIds.SET_CONNECTIONS, element.id, _state.connections[i]);

          // Use scene data to store the array of ids to be rendered as text
          bridge.setSceneData(i.toString(), _state.connections[i])
        }
      })

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

      const elements = {
        gridFront: engine.elements.get(elementIds.GRID),
        gridBack: engine.elements.get(elementIds.GRID_2),
        connections: useSceneManager().scene2D.value?.elements.get(elementIds.CONNECTIONS),
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
        setInstancesScreenPositions(elementIds.SET_CONNECTIONS, elementIds.GRID, _state.points);
        setInstancesScreenPositions(elementIds.SET_CONNECTIONS_2, elementIds.GRID_2, _state.points);
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
        targetOrbits: [0, 1],
        subBeat: 0,
      }

      const elements = {
        orbits: engine.elements.get(elementIds.MAIN),
        particles: engine.elements.get(elementIds.PARTICLES),
      };

      if (!elements.orbits || !elements.particles) return;

      elements.orbits.data.forEach((rect, i) => {
        if (!elements.orbits) return;

        rect.params.freq = random(0.05, 0.35);
        rect.params.offsetFreq = random(Math.PI * 2);
        rect.params.orbitX = random(100, 500);
        rect.params.orbitZ = random(100, 350);
        rect.params.orbitY = random(-50, 50);

        // Add element screen positions
        if (_state.orbits.length < elements.orbits.data.length) {
          if (!_state.orbits.includes(i)) {
            _state.orbits.push(i);
            _state.trails.push([]);
          }
        }

      })
      
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, beatCycle, barSubBeat, repeatEvery } = engine.audioManager;
      const bridge = useSceneBridge();

      const elements = {
        orbits: engine.elements.get(elementIds.MAIN),
        particles: engine.elements.get(elementIds.PARTICLES),
        trails: useSceneManager().scene2D.value?.elements.get(elementIds.TRAILS),
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
      const harmonyImpact = mapLinear(harmonies.pitch, 0.4, 0.65, -1, 1);
      
      // Camera params
      const cameraPos = engine.getCameraPosition();
      const CAMERA_CONFIG = {
        angleSpeedX: -0.025,
        angleSpeedY: 0.01,
        zoomSpeed: -0.005,
      }
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const angleY = beatCycle(time, { beats: 128 }) * 30 + 30;

      engine.cameraZoom(CAMERA_CONFIG.zoomSpeed);
      engine.cameraRotate(azimuth + CAMERA_CONFIG.angleSpeedX, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.orbits.data.forEach((rect, i) => {

        // Apply orbits
        const swingX = Math.sin(BASE_FREQ * rect.params.freq + rect.params.offsetFreq) * rect.params.orbitX + 0.02 * harmonyImpact * rect.params.orbitX;
        const swingZ = Math.cos(BASE_FREQ * rect.params.freq + rect.params.offsetFreq) * rect.params.orbitZ + 0.02 * harmonyImpact * rect.params.orbitZ;
        const swingY = Math.cos(BASE_FREQ * rect.params.freq - rect.params.offsetFreq) * rect.params.orbitY + 0.02 * harmonyImpact * rect.params.orbitY;

        rect.renderPosition.x += swingX;
        rect.renderPosition.z += swingZ;
        rect.renderPosition.y += swingY;

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos);
      })

      // Clear all screen points
      bridge.clearAllScreenPositions();

      // Orbit position synchronization
      // Every frame, we tell the bridge to project the current store
      if (_state.targetOrbits.length > 0) {
        bridge.setInstancesScreenPositions(elementIds.SET_SCANS, elementIds.MAIN, _state.targetOrbits);
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---

      // Randomize target orbits
      repeatEvery({ beats: 3 }, () => {
        const orbitCount = randomInt(0, 9);
        const orbitIndices = Array(_state.orbits.length).fill(null).map((_, i) => i);
        
        shuffle(orbitIndices)
        _state.targetOrbits = orbitIndices.slice(0, orbitCount);
      })

      // Rotate camera position
      // repeatEvery({ beats: 3 }, () => {
      //   if (chance(0.25)) {
      //     engine.cameraRotate(azimuth + 90, polar);
      //   }
      // })

      // Synchronize track every 1/3 step
      const subBeat = barSubBeat(time, 3);

      if (subBeat !== _state.subBeat) {        
        // One trail for each orbit
        let trail;
        for (let i = 0; i < _state.orbits.length; i++) {

          // Skip if orbit is not currently tracked
          // if (!_state.targetOrbits.includes(i)) continue;

          trail = _state.trails[i];

          // A. Removing logic: remove oldest trail point
          if (trail?.length >= maxTrailElements || !_state.targetOrbits.includes(i)) {
            trail.shift();
          }

          // B. Adding logic: add new point for each orbit
          if (trail?.length < maxTrailElements) {
            const orbit = bridge.getScreenPosition(elementIds.SET_SCANS, i);
            if (!orbit) continue;
  
            // Quantize positions here only once every sub beat,
            // so it doesn't need to compute every frame
            const point = JSON.parse(JSON.stringify(orbit))
            point.x = Math.floor(point.x * elements.trails.width / 10) * 10;
            point.y = Math.floor(point.y * elements.trails.height / 10) * 10;

            trail.push(point);
          }
        }

        // Update screen positions
        bridge.setScreenPositions(elementIds.SET_TRAILS, _state.trails.flat());

        _state.subBeat = subBeat;
      }
    },
    dispose: () => {
      _state = {};
    }
  }
};