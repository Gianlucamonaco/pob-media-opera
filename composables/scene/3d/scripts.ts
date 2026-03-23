import * as THREE from 'three';
import { clamp, lerp, mapLinear } from "three/src/math/MathUtils.js";
import { ChannelNames, Easing, Palette, Scenes, SEQUENCES } from "~/data/constants";
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
const dummyEuler = new THREE.Euler();
const dummyColor = new THREE.Color();

let _state = {} as any;
let _input = {} as any;
let _camera: {
  targetAngle?: number,
  angleX?: number,
  minAngleX?: number,
  maxAngleX?: number,
  speedAngleX?: number,
  angleY?: number,
  minAngleY?: number,
  maxAngleY?: number,
  speedAngleY?: number, 
  minDistance?: number,
  speedZoom?: number,
  progressZoom?: number,
  _triggered?: boolean,
} = {};

export const sceneScripts: Partial<Record<Scenes, Scene3DScript>> = {
  [Scenes.ASFAY]: {
    init: (engine) => {
      _state = {
        coords: [],
        targetDistance: 0.1,
      }
  
      _camera = {
        minAngleX: 30,
        maxAngleX: 90,
        speedAngleX: 0.01,
        _triggered: false,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.setVisibility(false);
    },
    update: (engine) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio, repeatEvery, currentBar } = engine.audioManager;
      const bridge = useSceneBridge();
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;
      const { pad1, pad2 } = midiState.pads;

      const elements = { grid: engine.elements.get(elementIds.GRID) }

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        rectVisibilityChance: drums.loudness || harmonies.loudness || knob1,
        rectRotationIntensity1: brass.pitch || knob2,
        rectRotationIntensity2: woodwinds.pitch || knob3,
        rectRotationIntensity3: bass.pitch || knob4,
        rectRotationIntensity4: keys.pitch,
        textVisibilityChance: bass.loudness || knob5,
        textVisibilityFactor: knob6,
        cameraTriggerDistance: pad1,
        cameraTriggerAngle: pad2,
        visibilityTrigger: drums.onOff || harmonies.onOff,
      }

      // Constants
      const HARMONIES_RANGE = { min: 0.025, max: 0.75 };
      const ROT_RANGE = { min: 0, max: 0.25 }
      const MAX_DISTANCE = 750;
      const DISTANCE_INCREMENT = 25;

      // Computed audio values + MIDI
      const visibilityChance = mapLinear(_input.rectVisibilityChance, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max);
      const rotationIntensities = [
        mapLinear(_input.rectRotationIntensity1, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max),
        mapLinear(_input.rectRotationIntensity2, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max),
        mapLinear(_input.rectRotationIntensity3, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max),
        mapLinear(_input.rectRotationIntensity4, HARMONIES_RANGE.min, HARMONIES_RANGE.max, ROT_RANGE.min, ROT_RANGE.max),
      ];
      const visibilityTrigger = _input.visibilityTrigger;
      const textVisibilityChance = 0.25 * _input.textVisibilityChance * _input.textVisibilityFactor;
      const maxDistance = Math.min(MAX_DISTANCE, currentBar() * DISTANCE_INCREMENT)

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const distance = engine.controls.getDistance();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0);
      const cameraZoom = ((_state.targetDistance || distance) - distance) * 0.01;

      engine.cameraRotate(cameraAngleX, polar);
      engine.cameraZoom(cameraZoom);

      // Manually switch camera view
      if (_input.cameraTriggerDistance && !_camera._triggered) {
        _state.targetDistance = random(10, maxDistance);
        _camera._triggered = true;
      }
      else if (_input.cameraTriggerAngle && !_camera._triggered) {
        const randomAngleX = random((_camera.minAngleX! || 0), (_camera.minAngleX || 0));
        const cameraAngleX = azimuth + randomAngleX;
        engine.cameraRotate(cameraAngleX, polar);
        _camera._triggered = true;
      }
      else if ((!_input.cameraTriggerDistance && !_input.cameraTriggerAngle) && _camera._triggered) {
        _camera._triggered = false;
      }

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        rect.rotation.y += rotationIntensities[i % rotationIntensities.length] || 0;
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
      if (visibilityTrigger) {
        // Hide all elements
        elements.grid.setVisibility(false);

        // Hide all elements
        elements.grid.data.forEach((_, i) => {
          if (chance(visibilityChance)) {
            elements.grid?.setInstanceVisibility(i, true)

            // Add with lower chance the coords
            if (chance(textVisibilityChance)) {
              if (!_state.coords.includes(i)) _state.coords.push(i)
            }
          }
        })
      }
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
        pulseFrequencyPrimary: 0,
        pulseFrequencySecondary: 0,
      };
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        connections: useSceneManager().scene2D.value?.elements.get(elementIds.CONNECTIONS),
        structure: engine.elements.get(elementIds.STRUCTURE),
      };

      if (!elements.structure) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const snare = smoothedAudio[ChannelNames.SN]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        tunnelNarrowFactor: snare.loudness || knob3,
        tunnelSpeedVariation: drums.loudness,
        tunnelSpeedFactor: knob4,
        pulseFrequency1: brass.loudness || knob5,
        pulseFrequency2: woodwinds.loudness || knob6,
        connectionCountFactor: keys.loudness || knob1,
        connectionRandomness: texture.loudness || knob2,
        connectionFrequencyLow: brass.pitch,
        connectionFrequencyHigh: woodwinds.pitch,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const MAX_INTERVAL = 42;
      
      // Computed audio values + MIDI
      const maxLines = (elements.connections?.config.layout.count || 10) * (0.5 + _input.connectionCountFactor * 0.5);
      const tunnelNarrowFactor = mapLinear(_input.tunnelNarrowFactor, 0, 1, 1, 0.65);
      const tunnelSpeedVariation = mapClamp(_input.tunnelSpeedVariation, 0.5, 0.7, -0.25, 1) * _input.tunnelSpeedFactor;
      const connectionRandomness = _input.connectionRandomness * 0.2;
      const pulseFrequencyPrimary = _input.pulseFrequency1;
      const pulseFrequencySecondary = _input.pulseFrequency2;
      const intervalRangeMin = mapQuantize(_input.connectionFrequencyLow, 0.2, 0.7, 1, MAX_INTERVAL / 4);
      const intervalRangeMax = mapQuantize(_input.connectionFrequencyHigh, 0.2, 0.7, 3, MAX_INTERVAL);

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

      elements.structure.data.forEach((rect, i) => {
        if (!rect.motionSpeed) return;

        _state.pulseFrequencyPrimary = lerp(_state.pulseFrequencyPrimary, pulseFrequencyPrimary, 0.01);
        _state.pulseFrequencySecondary = lerp(_state.pulseFrequencySecondary, pulseFrequencySecondary, 0.01);

        const freqPrimary = BASE_FREQ * 2 + i * Math.PI * 0.11;
        const freqSecondary = BASE_FREQ * 4 + i * Math.PI * 0.02;
        const scaleFactor = 0.5 + Math.abs(Math.sin(freqPrimary) * _state.pulseFrequencyPrimary) + Math.abs(Math.cos(freqSecondary) * _state.pulseFrequencySecondary);

        rect.position.z += rect.motionSpeed.position.z * tunnelSpeedVariation;
        rect.scale.y = scaleFactor;

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
        let incr = randomInt(intervalRangeMin, intervalRangeMax);

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
          if (chance(connectionRandomness)) {
            incr = randomInt(intervalRangeMin, intervalRangeMax);
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
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery, beatCycle, barProgress } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;
      const { pad1 } = midiState.pads;

      const elements = {
        center: engine.elements.get(elementIds.MAIN),
        particles: engine.elements.get(elementIds.PARTICLES),
      };

      if (!elements.center || !elements.particles) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        singleMotionX: keys.pitch || knob1,
        singleIntensityX: brass.loudness || knob2,
        groupMotionX: woodwinds.loudness || knob3,
        groupIntensityX: woodwinds.pitch || knob4,
        groupMotionY: bass.pitch || knob5,
        groupIntensityY: bass.loudness || knob6,
        scanDistanceThreshold: knob5,
        scanCountFactor: keys.loudness || knob6,
        cameraTriggerAngle: pad1,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const FREQUENCY_CHANCE = 0.5;
      const DISTANCE_STEP = 50;
      const DISTANCE_RANGE = { min: 250, max: 1500 };
      const SINGLE_MOTION_RANGE = { min: 5, max: 35 };
      const GROUP_MOTION_X_RANGE = { min: 100, max: 50 };
      const GROUP_MOTION_Y_RANGE = { min: 15, max: 75 };
      const SCANS_RANGE = { min: 1, max: 10 };

      const driftFreqX = BASE_FREQ * 1.25;
      const driftFreqY = beatCycle(time, { beats: 8 });
      const swarmFreqX = beatCycle(time, { beats: 16, offset: 4 });
      const distanceIncrement = Math.min(DISTANCE_RANGE.max, barProgress(time) * DISTANCE_STEP); // ideal range from 150/200 to 750
      
      // Computed audio values + MIDI
      const singleMotionX = SINGLE_MOTION_RANGE.min + _input.singleMotionX * _input.singleIntensityX * SINGLE_MOTION_RANGE.max;
      const groupMotionX = GROUP_MOTION_X_RANGE.min + _input.groupMotionX * _input.groupIntensityX * GROUP_MOTION_X_RANGE.max;
      const groupMotionY = GROUP_MOTION_Y_RANGE.min + _input.groupMotionY * _input.groupIntensityY * GROUP_MOTION_Y_RANGE.max;
      const maxScanDistance = DISTANCE_RANGE.min + _input.scanDistanceThreshold * distanceIncrement;
      const scansCount = SCANS_RANGE.min + _input.scanCountFactor * SCANS_RANGE.max;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const distance = engine.controls.getDistance();

      // Slowly zoom towards the swarm
      if (distance > (_camera.minDistance || 0)) {
        engine.cameraZoom(_camera.speedZoom || 0);
      }

      // Manually switch camera view
      if (_input.cameraTriggerAngle && !_camera._triggered) {
        engine.cameraRotate(azimuth + 90, polar);
        _camera._triggered = true;
      }
      else if (!_input.cameraTriggerAngle && _camera._triggered) {
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

      if (ended) {
        bridge.clearAllScreenPositions();
        _state.scans = [];
        return;
      }

      // --- 4. MUSICAL EVENTS & TRIGGERS ---      
      repeatEvery({ beats: 1 }, () => {
        if (!elements.particles || !elements.center) return;

        // Clear local store
        _state.scans = [];

        // Adding logic
        for (let i = 0; i < scansCount; i++) {
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
        fadeSteps: 2500,
      };

      _camera = {
        speedAngleX: 0.075,
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
      const { knob1, knob2, knob3, knob4, knob5 } = midiState.knobs;

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
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const keysClem = smoothedAudio[ChannelNames.KEYS_CLEM]!;

      _input = {
        rectRotation1: woodwinds.loudness,
        rectRotation2: brass.loudness,
        cameraRotationStep: texture.loudness,
        cameraRotationFactor: keys.loudness,
        cameraSpeedFactor: knob1,
        scanChance1: keys.loudness,
        scanChance2: knob2,
        scanTriggerFactor: keysClem.onOff,
        scanCountFactor: keysClem.pitch,
      }

      // Constants
      const LOUDNESS_RANGE = { min: 0.2, max: 0.5 };
      const LOUDNESS_FACTOR_RANGE = { min: 0.33, max: 0.66 };
      const ACCELERATION_RANGE = { min: 0, max: 0.25 };
      const SHAPE_LOUDNESS_RANGE = { min: 0.25, max: 1 };
      const SHAPE_ROTATION_RANGE = { min: 0, max: 0.01 };
      
      // Computed audio values + MIDI
      const rectRotation1 = mapClamp(_input.rectRotation1, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const rectRotation2 = mapClamp(_input.rectRotation2, SHAPE_LOUDNESS_RANGE.min, SHAPE_LOUDNESS_RANGE.max, SHAPE_ROTATION_RANGE.min, SHAPE_ROTATION_RANGE.max)
      const cameraRotationStep = mapClamp(_input.cameraRotationStep, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraRotationFactor = mapClamp(_input.cameraRotationFactor, LOUDNESS_FACTOR_RANGE.min, LOUDNESS_FACTOR_RANGE.max, 0, 1);
      const cameraSpeedFactor = 1 + _input.cameraSpeedFactor;
      const scanChance = _input.scanTriggerFactor ? 1 : _input.scanChance1 + _input.scanChance2;
      const addScanChance = chance(scanChance * (0.1 + currentBar() * 0.05));
      const removeScanChance = chance(0.07 + scanChance * 0.2);
      const maxScans = Math.floor(currentBar() / 4) * (5 + _input.scanCountFactor * 5);

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0) + cameraRotationStep * cameraRotationFactor * cameraSpeedFactor;
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
        structureAngle: 0,
        rectPulse: 0,
        bendFrequencyX: 0,
        bendFrequencyY: 0,
        pulseFrequency1: 0,
        pulseFrequency2: 0,
        fadeProgress: 0,
        fadeStep: 8, // How many frames between each fade
        fadeElements: 9, // How many elements fade at once
      };

      _camera = {
        speedAngleX: 0.05,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

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
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const bassDrum = smoothedAudio[ChannelNames.BD]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const keysClem = smoothedAudio[ChannelNames.KEYS_CLEM]!;

      _input = {
        rotationFactor: bassDrum.onOff,
        pulseFactor: bassDrum.onOff,
        narrowFactor: bass.loudness || knob6,
        bendIntensityX: keysClem.loudness || knob1,
        bendFrequencyX: keysClem.pitch || knob2,
        bendIntensityY: keys.loudness || knob3,
        bendFrequencyY: keys.pitch || knob4,
        pulseFrequency1: woodwinds.pitch || knob5,
        pulseFrequency2: brass.loudness || knob6,
        cameraSpeedX: brass.loudness,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const RECT_DEFORMATION = { min: 0.25, max: 2.5 };
      const STRUCTURE_DISTORTION = 150;
      const STRUCTURE_ROTATION_STEP = Math.PI * 0.025;
      const RECT_PULSE_FACTOR = 5;
      const RECT_PULSE_RANGE = { min: 0.5, max: 2.5 };

      // Computed audio values + MIDI
      const structureNarrowFactor = mapLinear(_input.narrowFactor, 0, 1, 0.5, 1.5);
      const structureBendIntensityX = Math.sin(BASE_FREQ) * mapLinear(_input.bendIntensityX + 0.5, 0, 1, -STRUCTURE_DISTORTION, STRUCTURE_DISTORTION) * 0.32;
      const structureBendIntensityY = Math.sin(BASE_FREQ + Math.PI * 0.5) * mapLinear(_input.bendIntensityY + 0.5, 0, 1, -STRUCTURE_DISTORTION, STRUCTURE_DISTORTION) * 0.05;
      const structureBendFrequencyX = Math.PI * _input.bendFrequencyX;
      const structureBendFrequencyY = Math.PI * _input.bendFrequencyY * 5;

      _state.bendFrequencyX = lerp(_state.bendFrequencyX, structureBendFrequencyX, 0.01);
      _state.bendFrequencyY = lerp(_state.bendFrequencyY, structureBendFrequencyY, 0.01);

      const rectPrimaryDeformationSpeed = BASE_FREQ * _input.pulseFrequency1 * 1.5;
      const rectSecondaryDeformationSpeed = BASE_FREQ * _input.pulseFrequency2 * 5;
      const rectPrimaryDeformationInterval = 0.03085;
      const rectSecondaryDeformationInterval = 0.22;

      _state.pulseFrequency1 = lerp(_state.pulseFrequency1, rectPrimaryDeformationSpeed, 0.005);
      _state.pulseFrequency2 = lerp(_state.pulseFrequency2, rectSecondaryDeformationSpeed, 0.005);

      // Constant pulsing structure rotation
      _state.structureAngle += _input.rotationFactor * STRUCTURE_ROTATION_STEP;
      const structureRotationZ = elements.structure.container.rotation.z;

      // Constant pulsing rect scale
      _state.rectPulse = lerp(_state.rectPulse, _input.pulseFactor, 0.1);
      const pulseFactor = RECT_PULSE_RANGE.min + Math.min(RECT_PULSE_RANGE.max, _state.rectPulse * RECT_PULSE_FACTOR);

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + Math.cos(BASE_FREQ + _input.cameraSpeedX * Math.PI * 0.33) * (_camera.speedAngleX || 0);

      engine.cameraRotate(cameraAngleX, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      const { radius, pitch, count, verticalStep } = elements.structure.config.layout;
      const totalWidth = (radius || 100) * 2;
      const totalHeight = (radius || 100) * 2;
      const totalDepth = (pitch || 0.5) * (count || 100) * (verticalStep || 5);

      // Rotate structure
      elements.structure.container.rotation.z = lerp(structureRotationZ, _state.structureAngle, 0.1);

      elements.structure.data.forEach((rect, i) => {
        // Update relative x, y, z for modifiers
        if (!rect.relative) rect.relative = { x: 0, y: 0, z: 0 };
        
        const mixedFrequencies = Math.sin(_state.pulseFrequency1 + i * rectPrimaryDeformationInterval)
                               * Math.sin(_state.pulseFrequency2 + i * rectSecondaryDeformationInterval)

        const scaleFactor = mapLinear(mixedFrequencies, -1, 1, RECT_DEFORMATION.min, RECT_DEFORMATION.max)

        rect.relative.x = rect.position.x / totalWidth;
        rect.relative.y = rect.position.y / totalHeight;
        rect.relative.z = rect.position.z / totalDepth;
        rect.renderScale.x = rect.scale.x * scaleFactor * pulseFactor;

        // Apply Tunnel Bend
        Modifiers.gridBend(rect, {
          x: structureBendIntensityX,
          freqX: _state.bendFrequencyX,
          y: structureBendIntensityY,
          freqY: _state.bendFrequencyY,
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
        fadeInSteps: 8000,
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

        _state.fadeInIndices.push(randomInt(400, _state.fadeInSteps))
        _state.fadeOutIndices.push(randomInt(0, _state.fadeOutSteps))
      });

      elements.grid.setVisibility(false);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.GRID)
      }

      if (!elements.grid) return;

      // Audio channels
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      _input = {
        speedFactor1: woodwinds.loudness,
        speedFactor2: knob1,
        speedFactor3: brass.loudness,
        speedFactor4: knob2,
        speedFactor5: keys.loudness,
        speedFactor6: knob3,
        scaleFactor1: woodwinds.pitch,
        scaleFactor2: knob4,
        scaleFactor3: brass.pitch,
        scaleFactor4: knob5,
        scaleFactor5: keys.pitch,
        scaleFactor6: knob6,
      }

      // Constants
      const SCALE_SPEED_RANGE = { min: 0.0005, max: 0.0015 };

      // Computed audio values + MIDI
      const speedFactors = [
        (_input.speedFactor1 - _input.speedFactor2 * 5),
        (_input.speedFactor3 - _input.speedFactor4 * 5),
        (_input.speedFactor5 - _input.speedFactor6 * 5),
      ];
      const scaleFactors = [
        (1 - _input.scaleFactor1 - _input.scaleFactor2),
        (1 - _input.scaleFactor3 - _input.scaleFactor4),
        (1 - _input.scaleFactor5 - _input.scaleFactor6),
      ]

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        if (!rect.motionSpeed) return;
        const speedFactor = speedFactors[i % speedFactors.length] || 0;
        const scaleFactor = scaleFactors[i % scaleFactors.length] || 0;

        rect.position.y += rect.motionSpeed.position.y * speedFactor;
        rect.scale.y -= rect.motionSpeed.scale.y * scaleFactor;

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
        rotationProgress: 0,
      };

      const elements = { grid: engine.elements.get(elementIds.GRID) }

      _state.fadeIndices = Array(elements.grid?.data.length).fill(null).map(_ => randomInt(0, _state.fadeSteps))
      elements.grid?.setVisibility(false);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob2, knob3 } = midiState.knobs;
      
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

              rect.scale.x = lerp(rect.scale.x, 0.005, 0.0008);
              rect.scale.y = lerp(rect.scale.y, 0.05, 0.0008);
            }
          }

          // Then arrange the remaining shapes into a grid
          else if (rect.grid && rect.motionSpeed) {
            rect.position.x = lerp(rect.position.x, -500 + rect.grid.x * 30, 0.001);
            rect.position.y = lerp(rect.position.y, -250 + rect.grid.y * 30, 0.001);
            rect.position.z = lerp(rect.position.z, 1750 + rect.grid.z * 30, 0.001);
  
            rect.scale.x = lerp(rect.scale.x, 0.005, 0.003);
            rect.scale.y = lerp(rect.scale.y, 0.05, 0.003);
  
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
      const bassDrum = smoothedAudio[ChannelNames.BD]!;
      const snare = smoothedAudio[ChannelNames.SN]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        scanChance: drums.loudness, // Note: Update instrument
        scanMinX: drums.loudness,
        scanMaxX: snare.loudness,
        scanMinY: harmonies.loudness,
        scanMaxY: bassDrum.loudness,
        rectRotationX: texture.loudness, // Note: Update instrument
        narrowFactor: bass.loudness || knob2,
        slopeFactor: keys.pitch || knob3,
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
      const rectRotationFrequency = _state.rotationProgress;
      const slopeFactorTop = SLOPE_FACTOR.top * (0.5 + _input.slopeFactor);
      const slopeFactorBottom = SLOPE_FACTOR.bottom * (0.5 + _input.slopeFactor);

      _state.rotationProgress += _input.rectRotationX * 0.01;

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
        if (rectRotationFrequency) {
          const rotationFactor = Math.PI * Math.sin(rectRotationFrequency + BASE_FREQ * (i % 2 == 0 ? 2 : -2) + i * 0.01);
          rect.renderRotation.y = rotationFactor;
        }
        // Elements look at camera
        else if (cameraPos && !rectRotationFrequency) {
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
      const { smoothedAudio, currentBar, beatDuration } = engine.audioManager;
      const { knob1, knob2, knob3, knob4 } = midiState.knobs;
      const { pad1 } = midiState.pads;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const snare = smoothedAudio[ChannelNames.SN]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;

      _input = {
        gridDistortion1: harmonies.loudness,
        gridDistortion2: keys.loudness,
        gridDistortionCenter: snare.pitch || knob1,
        gridDistortionDepth: bass.pitch || knob2,
        triggerCountFactor: knob3,
        scaleTrigger: drums.onOff,
        cameraRotationFactor: texture.loudness,
        cameraTriggerAngle: pad1,
      }

      // Constants
      const BASE_FREQ = 0.001;
      const DISTORTION_AMPLITUDE = 15;
      const SCALE_FACTOR = 30;
      const INTRO_BARS = 6;
      const START_POSITIONS_X = [0, 1, 2, 3, 4, 11, 12, 13, 14, 15];

      // Computed audio values + MIDI
      const primaryDistortionIntensity = _input.gridDistortion1 * DISTORTION_AMPLITUDE;
      const primaryDistortionFrequency = Math.PI * 0.33;
      const secondaryDistortionIntensity = _input.gridDistortion2 * DISTORTION_AMPLITUDE * 4;
      const secondaryDistortionFrequency = Math.PI * 0.1;
      const centerDistortionIntensity = _input.gridDistortionCenter * DISTORTION_AMPLITUDE * 4;
      const centerDistortionFrequency = Math.PI / 16;
      const depthDistortionIntensity = _input.gridDistortionDepth * DISTORTION_AMPLITUDE * -3;
      const depthDistortionFrequency = Math.PI / 16;
      const scaleTrigger = _input.scaleTrigger;
      const scaleStep = ended ? 1 / 320 : 1 / 80;
      const isIntro = currentBar() < INTRO_BARS;
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const rotationDuration = INTRO_BARS * (beatDuration() / 1000) * 4; // duration in seconds
      const rotationIncrement = 1 / (rotationDuration * 60);
      const cameraAngleX = azimuth + Easing.SINE_IN(_input.cameraRotationFactor) * 0.75;

      engine.cameraRotate(cameraAngleX, polar);
      
      // Initial camera rotation
      if (_state.rotationProgress < 1) {
        const cameraAngleY = Easing.POWER2_IN_OUT(_state.rotationProgress) * (_camera.angleY || 0);
        engine.cameraRotate(azimuth, cameraAngleY)  
        _state.rotationProgress += rotationIncrement;
      }
      else {
        // Manually switch camera view
        if (_input.cameraTriggerAngle && !_camera._triggered) {
          engine.cameraRotate(azimuth + random((_camera.minAngleX || 0), (_camera.maxAngleX || 0)), polar);
          _camera._triggered = true;
        }
        else if (!_input.cameraTriggerAngle && _camera._triggered) {
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
          + Math.sin(time * BASE_FREQ + rect.grid.z * secondaryDistortionFrequency) * secondaryDistortionIntensity
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
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      };

      if (!elements.grid) return;

      if (ended) {
        if (_state.fadeProgress == 0) elements.grid?.setVisibility(false);
        _state.fadeProgress++;
      }

      // Audio channels
      const bass = smoothedAudio[ChannelNames.BASS]!;

      const bassDrum = smoothedAudio[ChannelNames.BD]!;
      const overhead = smoothedAudio[ChannelNames.OH]!;

      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      
      _input = {
        scaleFactor1: woodwinds.centroid || knob1,
        indexFactor1: woodwinds.pitch,
        scaleFactor2: brass.centroid || knob2,
        indexFactor2: brass.pitch,
        scaleFactor3: keys.centroid || knob3,
        indexFactor3: keys.pitch,
        boxFactorX: bassDrum.centroid || knob4,
        boxFactorY: overhead.centroid || knob5,
        boxFactorZ: bass.centroid || knob6,
        cameraRotationFactor: bass.loudness,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const RESET_SCALE_FACTOR = 0.005;
      const BOX_RANGE_X = { min: 2, max: 12 };
      const BOX_RANGE_Y = { min: 2, max: 12 };
      const BOX_RANGE_Z = { min: 2, max: 12 };

      // Computed audio values + MIDI
      const scaleFactors = [_input.scaleFactor1, _input.scaleFactor2, _input.scaleFactor3, _input.scaleFactor4, _input.scaleFactor5];
      const indexFactors = [_input.indexFactor1, _input.indexFactor2, _input.indexFactor3, _input.indexFactor4, _input.indexFactor5];
      const boxFactorX = mapQuantize(_input.boxFactorX, 0.2, 0.8, BOX_RANGE_X.min, BOX_RANGE_X.max);
      const boxFactorY = mapQuantize(_input.boxFactorY, 0.2, 0.8, BOX_RANGE_Y.min, BOX_RANGE_Y.max);
      const boxFactorZ = mapQuantize(_input.boxFactorZ, 0.2, 0.8, BOX_RANGE_Z.min, BOX_RANGE_Z.max);

      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraPos = engine.getCameraPosition();
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0);
      const cameraZoom = (_camera.speedZoom || 0) * beatCycle(time, { beats: 48 })

      engine.cameraRotate(cameraAngleX, polar);
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

        // Skip if channel is off
        if (scaleFactor == 0) return;

        // Randomize the period for specific range
        const dimensions = elements.grid?.config.layout.dimensions;
        const period = mapClamp(indexFactor, 0, 1, 0, 0.00025) * random([-1, 1]); // was random(-0.001, 0.001)
        const scale = mapClamp(scaleFactor, 0, 1, 1, 10); // was random(3, 10)
        const speed = random(-0.1, 0.1);
        const maxX = dimensions?.x || 10;
        const maxY = dimensions?.y || 10;
        const maxZ = dimensions?.z || 10;

        const baseX = randomInt(1, maxX - 2);
        const baseY = randomInt(1, maxY - 2);
        const baseZ = randomInt(1, maxZ - 2);

        ax = clamp(baseX - Math.floor(boxFactorX / 2), 0, maxX - 1);
        bx = clamp(baseX + Math.floor(boxFactorX / 2), 0, maxX - 1);
        ay = clamp(baseY - Math.floor(boxFactorY / 2), 0, maxY - 1);
        by = clamp(baseY + Math.floor(boxFactorY / 2), 0, maxY - 1);
        az = clamp(baseZ - Math.floor(boxFactorZ / 2), 0, maxZ - 1);
        bz = clamp(baseZ + Math.floor(boxFactorZ / 2), 0, maxZ - 1);

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
        speedZoom: 0.03,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) }

      _state.fadeIndices = Array(elements.grid?.data.length).fill(null).map(_ => randomInt(0, _state.fadeSteps))
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT SECTION ---
      const { ended } = useSceneState().value;
      const { smoothedAudio } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

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
      const keysClem = smoothedAudio[ChannelNames.KEYS_CLEM]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;

      _input = {
        speedFactor: keysClem.loudness,
        rowFactor: keysClem.pitch,
        rowFactor1: brass.loudness || knob1,
        rowFactor2: woodwinds.loudness || knob2,
        rowFactor3: keys.loudness || knob3,
        rowFactor4: brass.loudness || knob4,
        rowFactor5: woodwinds.loudness || knob5,
        rowFactor6: bass.loudness || knob6,
        singleFactor1: bass.pitch || knob1,
        singleFactor2: keys.pitch || knob2,
        singleFactor3: brass.pitch || knob3,
        singleFactor4: woodwinds.pitch || knob4,
        cameraZoomFactor: keysClem.flatness,
      }

      // Constants
      const MAX_GLOBAL_SPEED = 0.5;
      const MAX_ROW_SPEED = 0.15;
      const MAX_SINGLE_SPEED = 0.15;

      // Computed audio values + MIDI
      const speedFactor = Easing.EXPO_IN(0.2 + _input.speedFactor) * MAX_GLOBAL_SPEED;
      const rowSpeedFactors = [_input.rowFactor1, _input.rowFactor2, _input.rowFactor3, _input.rowFactor4, _input.rowFactor5, _input.rowFactor6];
      const singleSpeedFactors = [_input.singleFactor1, _input.singleFactor2, _input.singleFactor3, _input.singleFactor4];
      const rowIntensityFactors = rowSpeedFactors.map((row, i) => row + Math.abs(i - _input.rowFactor * rowSpeedFactors.length));

      // --- 2. GLOBAL & CAMERA SECTION ---
      const cameraZoom = (_camera.speedZoom || 0) * (1 + _input.cameraZoomFactor * 2);
      engine.cameraZoom(cameraZoom);

      // --- 3. INSTANCE TRANSFORMATION SECTION ---
      elements.grid.data.forEach((rect, i) => {
        if (!rect.grid) return;

        // Speed variation depends on rect's row and column
        const { y: row, x: col } = rect.grid;
        const rowSpeedFactor = rowSpeedFactors[row % rowSpeedFactors.length] * MAX_ROW_SPEED;
        const singleSpeedFactor = singleSpeedFactors[col % singleSpeedFactors.length] * MAX_SINGLE_SPEED;
        const rowIntensityFactor = rowIntensityFactors[row % rowIntensityFactors.length];
        
        rect.position.x += speedFactor + rowIntensityFactor * rowSpeedFactor + singleSpeedFactor;
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

      _camera = {
        minAngleX: 0.05,
        maxAngleX: 0.15,
        minAngleY: 5,
        maxAngleY: 15,
        angleY: 90,
      }

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
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        main: engine.elements.get(elementIds.MAIN),
        connections: useSceneManager().scene2D.value?.elements.get(elementIds.CONNECTIONS),
      }

      if (!elements.main) return;

      // Audio channels
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        amplitudeFactor: bass.pitch || knob1,
        amplitudeGroup1: woodwinds.pitch || knob2,
        amplitudeGroup2: brass.loudness || knob3,
        amplitudeGroup3: keys.pitch || knob4,
        cameraSpeedFactor: bass.loudness,
        cameraAngleFactor: bass.centroid,
      }

      // Constants
      const LOUDNESS_RANGE = { min: 0.25, max: 0.6 };
      const ACCELERATION_RANGE = { min: 0.05, max: 1 };
      const AMPLITUDE_RANGE = { min: 5, max: 100 };

      // Computed audio values + MIDI
      const amplitudeGroups = [_input.amplitudeGroup1, _input.amplitudeGroup2, _input.amplitudeGroup3];
      const amplitudeFactor = mapClamp(_input.amplitudeFactor, LOUDNESS_RANGE.min, LOUDNESS_RANGE.max, ACCELERATION_RANGE.min, ACCELERATION_RANGE.max);
      const cameraBaseAngleY = (_camera.angleY || 90);
      const cameraSpeedFactorX = (_camera.minAngleX || 0) + _input.cameraSpeedFactor * (_camera.maxAngleX || 0);
      const cameraSpeedFactorY = (_camera.minAngleY || 0) + _input.cameraAngleFactor * (_camera.maxAngleY || 0);
      const maxPoints = Math.min(currentBar() + 1, elements.main.data.length);

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + cameraSpeedFactorX;
      const cameraAngleY = cameraBaseAngleY + beatCycle(time, { beats: 28 }) * cameraSpeedFactorY;

      engine.cameraRotate(cameraAngleX, cameraAngleY);

      // --- 3. INSTANCE TRANSFORMATION SECTION ---
      elements.main.data.forEach((rect, i) => {
        // Always interpolate between previous and new amplitude to prevent position jumps
        rect.params.amplitude = lerp(rect.params.amplitude, rect.params.targetAmplitude, 0.02);

        const oscillationY = beatCycle(time, { beats: 8, offset: i * (Math.PI / 4) }) * rect.params.amplitude;
        const oscillationX = Math.abs(beatCycle(time, { beats: 8, offset: i * (Math.PI / 2) }) * rect.params.amplitude / 4);

        rect.renderPosition.y = rect.position.y + oscillationY * amplitudeFactor;
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
        elements.main?.data.forEach((rect, i) => {
          const oscillationChance = chance(0.25);
          const amplitudeGroup = amplitudeGroups[i % amplitudeGroups.length]
          if (oscillationChance) {
            rect.params.targetAmplitude = random(AMPLITUDE_RANGE.min, AMPLITUDE_RANGE.max) * amplitudeGroup;
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

  [Scenes.RFBONGOS]: {
    init: (engine) => {
      _state = {
        visibilityRow: [0, 0],
        visibilityProgress: [0, 0],
        visibilityInterval: [1, 1],
      }

      _camera = {
        angleX: 0.05,
        speedAngleX: 0.0035,
        speedZoom: 0.02,
      }

      const elements = { grid: engine.elements.get(elementIds.STRUCTURE) }

      elements.grid?.setVisibility(false);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio, currentBar } = engine.audioManager;
      const { knob1 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.grid) return;
      
      elements.grid.setVisibility(false);

      if (ended) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const overhead = smoothedAudio[ChannelNames.OH]!;
      const liveFx = smoothedAudio[ChannelNames.LIVE_FX]!;

      _input = {
        rectRotationFactor: drums.loudness,
        visibilityTrigger1: drums.onOff,
        visibilityTrigger2: overhead.onOff,
        visibilityRow1: drums.pitch,
        visibilityRow2: overhead.pitch,
        visibilityInterval1: drums.loudness,
        visibilityInterval2: overhead.loudness,
        offsetX: liveFx.loudness,
        cameraRotationFactor: knob1,
      }

      // Constants
      const INTERVAL_RANGE = { min: 2, max: 9 };
      const PROGRESS_STEP = 0.04;

      // Computed audio values + MIDI
      const rows = elements.grid.config.layout.dimensions?.y || 10;
      const rectRotationFactor = _input.rectRotationFactor;
      const cameraRotationFactor = currentBar() * _input.cameraRotationFactor;

      const visibilityTriggers = [ _input.visibilityTrigger1, _input.visibilityTrigger2 ];
      const visibilityRows = [ _input.visibilityRow1, _input.visibilityRow2 ];
      const visibilityIntervals = [ _input.visibilityInterval1, _input.visibilityInterval2 ];

      const indexOffset = mapQuantize(_input.offsetX, 0, 0.2, 0, 6);

      // Trigger new rect interval
      for (let i = 0; i < visibilityTriggers.length; i++) {
        // Progress to 0
        _state.visibilityProgress[i] = lerp(_state.visibilityProgress[i], 0, PROGRESS_STEP);

        // When triggered, reset progress to 1 and compute new interval
        if (visibilityTriggers[i]) {
          _state.visibilityInterval[i] = mapQuantize(visibilityIntervals[i], 0.85, 0.2, INTERVAL_RANGE.min, INTERVAL_RANGE.max, true);
          _state.visibilityProgress[i] = 1;
          _state.visibilityRow[i] = mapQuantize(visibilityRows[i], 0.2, 0.8, 1, rows);
        }
      }

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const cameraAngleX = azimuth + (_camera.angleX || 0) + (_camera.speedAngleX || 0) * cameraRotationFactor;
      const cameraZoom = (_camera.speedZoom || 0);

      engine.cameraZoom(cameraZoom);
      engine.cameraRotate(cameraAngleX, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid.data.forEach((rect, i) => {
        rect.renderPosition.copy(rect.position);
        const row = rect.grid?.y || 0;
        const isTrigger1 = (i + indexOffset) % _state.visibilityInterval[0] == 0 && _state.visibilityRow[0] == row && _state.visibilityProgress[0] > 0;
        const isTrigger2 = (i + indexOffset) % _state.visibilityInterval[1] == 0 + 1 && _state.visibilityRow[1] == row && _state.visibilityProgress[1] > 0;

        // Compute speed and direction for row rotation
        const speedFactor = Math.sin(Math.PI * 0.25 * row) * 0.008 * rectRotationFactor;
        const direction = row % 2 === 0 ? 1 : -1;

        // Compute angle for rect rotation on trigger
        const beatFactor = Easing.POWER3_IN(_state.visibilityProgress[isTrigger1 ? 0 : 1]);
        const currentAngle = Math.PI * (1 - beatFactor);

        // Set the relative X rotation
        dummyEuler.set(currentAngle, 0, 0);

        Modifiers.setOrbit(rect, speedFactor * direction);

        // Make the rectangles always face the camera
        Modifiers.lookAt(rect, cameraPos, dummyEuler)

        if (isTrigger1 || isTrigger2) {
          elements.grid?.setInstanceVisibility(i, true);
        }
      })
      
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.SISTEMA]: {
    init: (engine) => {
      _state = {
        isIntro: true,
        fadeProgress: 0,
        fadeStep: 60,
      }

      const elements = { circles: engine.elements.get(elementIds.MAIN) };

      elements.circles?.data.forEach(circle => {
        circle.scale.x = 0;
        circle.scale.y = 0
      });
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio, currentBar, executeAt } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        circles: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.circles) return;
      
      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const overhead = smoothedAudio[ChannelNames.OH]!;

      _input = {
        globalSpeedFactor: texture.pitch,
        globalPositionFactor: harmonies.centroid,
        speedFactor1: drums.loudness || knob1,
        positionFactor1: drums.pitch || knob2,
        speedFactor2: overhead.loudness,
        positionFactor2: overhead.pitch,
        speedFactor3: texture.loudness,
        positionFactor3: texture.pitch,
        speedFactor4: brass.loudness || knob3,
        positionFactor4: brass.pitch || knob4,
        speedFactor5: woodwinds.loudness || knob5,
        positionFactor5: woodwinds.pitch || knob6,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const INTRO_BARS = 13;
      const BEATS_PER_BAR = 10;
      const VISIBILITY_THRESHOLD = 500;
      const AMPLITUDE_X = 100;
      const AMPLITUDE_Y = 100;
      const GLOBAL_SPEED = 2;

      const introBeats = INTRO_BARS * BEATS_PER_BAR;
      const visibleCount = Math.floor(currentBar() / 2) - INTRO_BARS;

      // Computed audio values + MIDI
      const globalSpeedFactor = _input.globalSpeedFactor;
      const globalPositionFactor = _input.globalPositionFactor;
      const positionFactors = [_input.positionFactor1, _input.positionFactor2, _input.positionFactor3, _input.positionFactor4, _input.positionFactor5];
      const speedFactors = [_input.speedFactor1, _input.speedFactor2, _input.speedFactor3, _input.speedFactor4, _input.speedFactor5];

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      if (ended) {
        const step = Math.floor(_state.fadeProgress / _state.fadeStep);

        if (!elements.circles?.data?.length || step > elements.circles.data.length) return;

        // Hide gradually all elements
        elements.circles?.data.forEach((rect, i) => {
          if (i < _state.fadeProgress) {
            rect.scale.x = 0;
            rect.scale.y = 0;
          }
        })

        // Increase progress counter
        _state.fadeProgress++;
      }

      if (ended) return;

      elements.circles.data.forEach((rect, i) => {
        // Hide circles when intro or not visible on screen
        if (_state.isIntro || i > visibleCount || rect.renderPosition.z > VISIBILITY_THRESHOLD) {
          rect.scale.x = 0;
          rect.scale.y = 0;
        }
        else {
          if (!rect.motionSpeed) return;

          // Reset position, speed and visibility when circle reset
          if (elements.circles?.resetIds.includes(i)) {
            const positionSpeed = random(0.25, 4);
            const scaleSpeed = random(0.005, 0.02);
            rect.motionSpeed.position.set(0, 0, positionSpeed);
            rect.motionSpeed.scale.set(scaleSpeed, scaleSpeed, 1);
            rect.scale.x = 1;
            rect.scale.y = 1;
          }

          // Increment scale and speed based on
          const positionFactorX = positionFactors[i % positionFactors.length];
          const positionFactorY = positionFactors[(i + 1) % positionFactors.length];
          rect.renderPosition.x += Math.sin(BASE_FREQ * 0.5 + i * 0.02) * globalPositionFactor * AMPLITUDE_X
                                 + Math.sin(BASE_FREQ + i * 0.01) * positionFactorX * AMPLITUDE_X;
          rect.renderPosition.y += Math.cos(BASE_FREQ * 0.5 - i * 0.02) * globalPositionFactor * AMPLITUDE_Y
                                 + Math.sin(BASE_FREQ + i * 0.01) * positionFactorY * AMPLITUDE_Y;

          const speedFactor = speedFactors[i % speedFactors.length];
          rect.position.z = rect.position.z + globalSpeedFactor * GLOBAL_SPEED + rect.motionSpeed.position.z * speedFactor;
        }
      })
      
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      executeAt({ beats: introBeats }, () => {
        _state.isIntro = false;
      })
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.SOLO_01]: {
   init: (engine) => {
      _state = {
        speedFactor: 0,
        frequencyProgress: 0,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.data.forEach((rect, i) => {
        rect.params = {
          factorX: 0,
          factorY: 0,
          offsetIndex: 0,
        };
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const texture = smoothedAudio[ChannelNames.PB_CH_4_TEXTURE]!;

      _input = {
        speedFactor1: brass.pitch,
        speedFactor2: texture.pitch,
        scaleFactor1: brass.loudness,
        scaleFactor2: texture.loudness,
        frequencyFactor: brass.loudness,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const SCALE_RANGE = { min: 1, max: 25 };

      // Computed audio values + MIDI
      const rows = elements.grid?.config.layout.dimensions?.y || 1;
      const cols = elements.grid?.config.layout.dimensions?.x || 1;
      const scaleFactors = [ _input.scaleFactor1, _input.scaleFactor2 ];
      const speedFactors = [ _input.speedFactor1, _input.speedFactor2 ];
      const waveFrequency = BASE_FREQ * 0.003 + _state.frequencyProgress * 5 + _input.frequencyFactor * 0.2;
      const motionFrequency = BASE_FREQ * 0.005 + _state.frequencyProgress;

      _state.speedFactor = lerp(_state.speedFactor, (_input.speedFactor1 * 0.008 + _input.speedFactor2 * 0.005), 0.01);
      _state.frequencyProgress += _state.speedFactor;

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = rect.grid?.x || 10;
        const row = rect.grid?.y || 10;

        const scaleFactor = (1 - Math.abs(row - rows * speedFactors[0]) * 0.25) * scaleFactors[0]
                          + (1 - Math.abs(row - rows * speedFactors[1]) * 0.25) * scaleFactors[1];
        const midiFactorY = Math.sin(scaleFactors[0] + row * Math.PI * 0.25) + scaleFactors[0];
        const midiFactorX = Math.cos(BASE_FREQ + i * Math.PI * 0.25) * scaleFactors[1];

        rect.params.factorX = lerp(rect.params.factorX, midiFactorX, 0.01);
        rect.params.factorY = lerp(rect.params.factorY, midiFactorY, 0.01);
        rect.params.offsetIndex = lerp(rect.params.offsetIndex, midiFactorY * midiFactorX, 0.005);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * _state.speedFactor;

        // Layering two frequencies to create a pulse
        const mainWave = Math.sin(waveFrequency * colSpeedMult + rect.params.factorY);
        const subWave = Math.cos(waveFrequency * 0.5 + row * Math.PI * rect.params.factorX);
        const combined = (mainWave * 0.6 + subWave * 0.4) * scaleFactor;
        const scaleValue = Easing.SINE_IN_OUT(Math.abs(combined));

        rect.position.x += Math.sin(motionFrequency + row * rect.params.offsetIndex) * 0.1 * rect.params.factorX;
        rect.renderPosition.x = rect.position.x + Math.sin(motionFrequency + col) * combined * rect.params.factorX;
        rect.renderScale.x = mapClamp(scaleValue, 0, 1,  SCALE_RANGE.min, SCALE_RANGE.max);
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.SOLO_02]: {
   init: (engine) => {
      _state = {
        speedFactor: 0,
        frequencyProgress: 0,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.data.forEach((rect, i) => {
        rect.params = {
          factorX: 0,
          factorY: 0,
          offsetIndex: 0,
        };
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const brass = smoothedAudio[ChannelNames.BRASS]!;

      _input = {
        speedFactor1: brass.pitch,
        speedFactor2: knob2,
        scaleFactor1: brass.loudness,
        scaleFactor2: knob3,
        frequencyFactor: brass.loudness,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const SCALE_RANGE = { min: 0.1, max: 10 };

      // Computed audio values + MIDI
      const rows = elements.grid?.config.layout.dimensions?.y || 1;
      const cols = elements.grid?.config.layout.dimensions?.x || 1;
      const scaleFactors = [ _input.scaleFactor1, _input.scaleFactor2 ];
      const waveFrequency = BASE_FREQ * 0.01 + _state.frequencyProgress + _input.frequencyFactor * 0.25;
      const motionFrequency = BASE_FREQ * 0.01 + _state.frequencyProgress;

      _state.speedFactor = lerp(_state.speedFactor, (_input.speedFactor1 + _input.speedFactor2) * 0.1, 0.01);
      _state.frequencyProgress += _state.speedFactor;

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = rect.grid?.x || 10;
        const row = rect.grid?.y || 10;

        const scaleFactor = (0.35 - Math.abs(row - rows * scaleFactors[0]) * 0.09) + (0.35 - Math.abs(row - rows * scaleFactors[1]) * 0.09);
        const midiFactorY = Math.sin(scaleFactors[0] + row * 0.5) * (row % 2) + scaleFactors[0];
        const midiFactorX = 0.01 + scaleFactors[1];

        rect.params.factorX = lerp(rect.params.factorX, midiFactorX, 0.01);
        rect.params.factorY = lerp(rect.params.factorY, midiFactorY, 0.01);
        rect.params.offsetIndex = lerp(rect.params.offsetIndex, midiFactorY * midiFactorX, 0.005);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * _state.speedFactor;

        // Layering two frequencies to create a pulse
        const mainWave = Math.sin(waveFrequency * colSpeedMult + rect.params.factorY);
        const subWave = Math.cos(waveFrequency * 0.5 + row * Math.PI * 0.15 + rect.params.factorX);
        const combined = (mainWave * 0.65 + subWave * 0.35) * scaleFactor;
        const scaleValue = Easing.POWER3_IN_OUT(Math.abs(combined));

        rect.position.x += Math.sin(motionFrequency + row * rect.params.factorY) * 0.1;
        rect.renderPosition.x = rect.position.x + Math.sin(motionFrequency + col) * combined * rect.params.factorX;
        rect.renderScale.x = mapClamp(scaleValue, 0, 1,  SCALE_RANGE.min, SCALE_RANGE.max);
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.SOLO_03]: {
    init: (engine) => {
      _state = {
        speedFactor: 0,
        frequencyProgress: 0,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.data.forEach((rect, i) => {
        rect.params = {
          factorX: 0,
          factorY: 0,
          offsetIndex: 0,
        };
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;

      _input = {
        speedFactor1: woodwinds.centroid,
        speedFactor2: knob2,
        scaleFactor1: woodwinds.centroid,
        scaleFactor2: knob3,
        frequencyFactor: woodwinds.loudness,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const SCALE_RANGE = { min: 0.1, max: 10 };

      // Computed audio values + MIDI
      const rows = elements.grid?.config.layout.dimensions?.y || 1;
      const cols = elements.grid?.config.layout.dimensions?.x || 1;
      const scaleFactors = [ _input.scaleFactor1, _input.scaleFactor2 ];
      const waveFrequency = BASE_FREQ * 0.01 + _state.frequencyProgress + _input.frequencyFactor * 0.25;
      const motionFrequency = BASE_FREQ * 0.01 + _state.frequencyProgress;

      _state.speedFactor = lerp(_state.speedFactor, (_input.speedFactor1 + _input.speedFactor2) * 0.1, 0.01);
      _state.frequencyProgress += _state.speedFactor;

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = rect.grid?.x || 10;
        const row = rect.grid?.y || 10;

        const scaleFactor = (0.35 - Math.abs(row - rows * scaleFactors[0]) * 0.09) + (0.35 - Math.abs(row - rows * scaleFactors[1]) * 0.09);
        const midiFactorY = Math.sin(scaleFactors[0] + row * 0.5) * (row % 2) + scaleFactors[0];
        const midiFactorX = 0.01 + scaleFactors[1];

        rect.params.factorX = lerp(rect.params.factorX, midiFactorX, 0.01);
        rect.params.factorY = lerp(rect.params.factorY, midiFactorY, 0.01);
        rect.params.offsetIndex = lerp(rect.params.offsetIndex, midiFactorY * midiFactorX, 0.005);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * _state.speedFactor;

        // Layering two frequencies to create a pulse
        const mainWave = Math.sin(waveFrequency * colSpeedMult + rect.params.factorY);
        const subWave = Math.cos(waveFrequency * 0.5 + row * Math.PI * 0.15 + rect.params.factorX);
        const combined = (mainWave * 0.65 + subWave * 0.35) * scaleFactor;
        const scaleValue = Easing.POWER3_IN_OUT(Math.abs(combined));

        rect.position.x += Math.sin(motionFrequency + row * rect.params.factorY) * 0.1;
        rect.renderPosition.x = rect.position.x + Math.sin(motionFrequency + col) * combined * rect.params.factorX;
        rect.renderScale.x = mapClamp(scaleValue, 0, 1,  SCALE_RANGE.min, SCALE_RANGE.max);
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.SOLO_04]: {
    init: (engine) => {
      _state = {
        speedFactor: 0,
        frequencyProgress: 0,
      }

      const elements = { grid: engine.elements.get(elementIds.GRID) };

      elements.grid?.data.forEach((rect, i) => {
        rect.params = {
          rowFactor: 0,
          colFactor: 0,
          factorX: 0,
          factorY: 0,
          offsetIndex: 0,
        };
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      };

      if (!elements.grid) return;

      // Audio channels
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const midikeys = smoothedAudio[ChannelNames.KEYS_MIDI]!;

      _input = {
        midi1: midikeys.drawbars[0],
        midi2: midikeys.drawbars[1],
        midi3: midikeys.drawbars[2],
        midi4: midikeys.drawbars[3],
        midi5: midikeys.drawbars[4],
        midi6: midikeys.drawbars[5],
        midi7: midikeys.drawbars[6],
        midi8: midikeys.drawbars[7],
        midi9: midikeys.drawbars[8],
        speedFactor: midikeys.express_and_rotary[2],
        scaleFactor: keys.loudness || knob2,
        frequencyFactor: keys.loudness || knob3,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const MIDI_STEPS = 5; // used to normalize midi signal (0 to 1)
      const SCALE_RANGE = { min: 0.2, max: 20 };

      // Computed audio values + MIDI
      const cols = elements.grid?.config.layout.dimensions?.x || 1;
      const midiFactors = [ _input.midi1, _input.midi2, _input.midi3, _input.midi4, _input.midi5, _input.midi6, _input.midi7, _input.midi8, _input.midi9 ];
      const scaleFactor = _input.scaleFactor;
      const waveFrequency = BASE_FREQ * 0.1 + _state.frequencyProgress + _input.frequencyFactor * 2.5;
      const motionFrequency = BASE_FREQ * 0.1 + _state.frequencyProgress * 2.5;

      _state.speedFactor = lerp(_state.speedFactor, Math.abs(_input.speedFactor || 1) / 128 * 0.07, 0.01);
      _state.frequencyProgress += _state.speedFactor;

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.grid?.data.forEach((rect, i) => {
        const col = rect.grid?.x || 10;
        const row = rect.grid?.y || 10;

        const midiFactorRow = 0.05 + midiFactors[row % midiFactors.length] || 0;
        const midiFactorCol = 0.05 + midiFactors[col % midiFactors.length] || 0;

        rect.params.rowFactor = lerp(rect.params.rowFactor, midiFactorRow, 0.1);
        rect.params.colFactor = lerp(rect.params.colFactor, midiFactorCol, 0.1);

        const midiFactorY = 0.1 + rect.params.rowFactor / MIDI_STEPS;
        const midiFactorX = 0.1 + rect.params.colFactor / MIDI_STEPS;

        rect.params.factorX = lerp(rect.params.factorX, midiFactorX, 0.01);
        rect.params.factorY = lerp(rect.params.factorY, midiFactorY, 0.01);

        rect.params.offsetIndex = lerp(rect.params.offsetIndex, midiFactorY * midiFactorX, 0.005);

        // Create a unique variation for each column
        const colSpeedMult = 1.0 + (col / cols) * _state.speedFactor;

        // Layering two frequencies to create a pulse
        const mainWave = Math.sin(waveFrequency * colSpeedMult + rect.params.factorX * 10);
        const subWave = Math.cos(waveFrequency * 0.35 + row * Math.PI * 0.3 + rect.params.offsetIndex);
        const combined = (mainWave * 0.5 + subWave * 0.5) * scaleFactor * (0.6 + 0.4 * rect.params.factorY % rect.params.factorY);
        const scaleValue = Easing.SINE_IN_OUT(Math.abs(combined));

        rect.position.x += Math.sin(motionFrequency * rect.params.factorY + i * rect.params.offsetIndex) * rect.params.rowFactor * 10;
        rect.renderPosition.x = rect.position.x + Math.sin(motionFrequency + col) * combined * rect.params.rowFactor;
        rect.renderScale.x = mapClamp(scaleValue, 0, 1,  SCALE_RANGE.min, SCALE_RANGE.max);
      });

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {
      _state = {
        activePoints: [0, 1, 2, 3, 4],
        connections: [],
        polarSpeed: 0,
      }

      _camera = {
        speedAngleX: 0.025,
        angleY: 90,
        maxAngleY: 10,
      };

      const elements = {
        matrix: engine.elements.get(elementIds.GRID),
        main: engine.elements.get(elementIds.MAIN),
      }

      // Hide all sphere matrix instances
      elements.matrix?.data.forEach(rect => {
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
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        matrix: engine.elements.get(elementIds.GRID),
        main: engine.elements.get(elementIds.MAIN),
      }

      if (!elements.matrix || !elements.main) return;

      // Audio channels
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const liveFx = smoothedAudio[ChannelNames.LIVE_FX]!;

      _input = {
        distanceFactor1: brass.loudness,
        distanceFactor2: brass.loudness || knob2,
        distanceFactor3: woodwinds.loudness || knob3,
        distanceFactor4: keys.loudness || knob4,
        distanceFactor5: brass.loudness || knob5,
        scaleFactor: brass.loudness || knob1,
        cameraAngleFactor: bass.loudness,
        cameraPolarFactor: liveFx.loudness || knob6,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const SPEED_RANGE = { min: 5, max: 20 }
      const SCALE_RANGE = { min: 0.2, max: 2.5 }
      const SCALE_DISTANCE_RANGE = { min: 100, max: 600 };
      const CONNECTION_RANGE = { min: 150, max: 750 };
      const CONNECTION_CHANCE = 0.01;

      // Computed audio values + MIDI
      const scaleFactor = mapLinear(_input.scaleFactor, 0, 1, 0.8, 2.5);
      const distanceFactors = [_input.distanceFactor1, _input.distanceFactor2, _input.distanceFactor3, _input.distanceFactor4, _input.distanceFactor5];
      const cameraAngleFactor = mapLinear(_input.cameraAngleFactor, 0, 1, 0, 0.25);
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0) + cameraAngleFactor;
      const cameraAngleY = (_camera.angleY || polar) + Math.sin(BASE_FREQ * 0.25 + _state.polarSpeed) * ((_camera.maxAngleY || 0) * (1.1 - _input.cameraPolarFactor));

      _state.polarSpeed += _input.cameraPolarFactor * 0.05;

      engine.cameraRotate(cameraAngleX, cameraAngleY);
      
      // --- 3. INSTANCE TRANSFORMATIONS ---

      // Clear previous connections
      _state.connections = Array(elements.main.data.length).fill(null).map(_ => []);

      elements.matrix.data.forEach((rect, index) => {
        if (!elements.main) return;
        const [sphereColumn, sphereRow, sphereDepth] = rect.params.sphereIndex;
        
        // Find closest particle distance
        let minParticleDist = Infinity;
        let mainIndex = -1;

        elements.main.data.forEach(p => {
          const d = p.position.distanceTo(rect.position);
          if (d < minParticleDist) {
            minParticleDist = d;
            mainIndex = p.id;
          }
        });

        // Get the distance range of the closest main rect
        const distanceFactor = distanceFactors[mainIndex];
        const connectionDistance = mapLinear(distanceFactor, 0, 1, CONNECTION_RANGE.min, CONNECTION_RANGE.max);
        
        // Store connections as [centerId]: particleId
        if (minParticleDist < connectionDistance && chance(CONNECTION_CHANCE)) {
          _state.connections[mainIndex].push(index);
        }

        // Compute scale factor based on distance, loudness and pulse
        const scaleDistance = mapClamp(minParticleDist, SCALE_DISTANCE_RANGE.max, SCALE_DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        const scalePulse = Math.sin(BASE_FREQ * 2 + sphereDepth + sphereColumn) * 0.1;

        rect.scale.setScalar(scaleDistance * scaleFactor + scalePulse);
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

            dummyVec.set(newX, newY, newZ).normalize();
    
            // Random speed between 1 and 10
            const speed = random(SPEED_RANGE.min, SPEED_RANGE.max)
            rect.position.multiplyScalar(-1);
            rect.motionSpeed.position.copy(dummyVec.multiplyScalar(speed));
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
      _input = {};
      _camera = {};
    }
  },

  [Scenes.STRANGE_ATTRACTOR]: {
    init: (engine) => {
      _camera = {
        speedAngleX: 0.05,
        speedZoom: 1.5,
        progressZoom: 0,
      }

      const MIN_DISTANCE = 250;
      const MAX_DISTANCE = 500;

      const elements = {
        rings: [
          engine.elements.get(elementIds.PARTICLES),
          engine.elements.get(elementIds.PARTICLES_2),
        ]
      }

      elements.rings.forEach(ring => {
        ring?.data.forEach((rect) => {
          const dist = rect.position.length();

          // Constrain elements into a ring
          if (dist < MIN_DISTANCE || dist > MAX_DISTANCE) {
            const targetDist = MIN_DISTANCE + random(MAX_DISTANCE - MIN_DISTANCE);
            rect.position.normalize().multiplyScalar(targetDist);
          }
        })
      })

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { smoothedAudio } = engine.audioManager;
      const { knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        rings: [
          engine.elements.get(elementIds.PARTICLES),
          engine.elements.get(elementIds.PARTICLES_2),
        ]
      }

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const harmonies = smoothedAudio[ChannelNames.PB_CH_2_BASS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const bassDrum = smoothedAudio[ChannelNames.BD]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        orbitGlobalFactor: harmonies.loudness,
        orbitFactor1: brass.loudness,
        orbitFactor2: woodwinds.loudness,
        orbitFactor3: bass.loudness,
        orbitFactor4: keys.loudness,
        cameraRotationFactor: harmonies.loudness,
        cameraZoomSpeed: bassDrum.loudness,
        cameraZoomFactor: drums.loudness,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const BASE_ZOOM_PROGRESS = 0.03;
      const ANGULAR_RANGE = { min: 0.005, max: 0.015 };

      // Computed audio values + MIDI
      const orbitSpeeds = [ _input.orbitFactor1, _input.orbitFactor2, _input.orbitFactor3, _input.orbitFactor4 ];
      const progressZoomStep = BASE_ZOOM_PROGRESS * _input.cameraZoomSpeed;
      const zoomFactor = _input.cameraZoomFactor;
      const rotationFactor = 1 + _input.cameraRotationFactor;

      // Accumulate zoom progress so the frequency keeps increasing and does not jump
      _camera.progressZoom = (_camera.progressZoom || 0) + progressZoomStep;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0) * rotationFactor;
      const cameraZoom = (_camera.speedZoom || 0) * Math.sin(BASE_FREQ * 0.3 + (_camera.progressZoom || 0)) * zoomFactor;
      
      engine.cameraRotate(cameraAngleX, polar);
      engine.cameraZoom(cameraZoom);

      elements.rings.forEach(ring => {
        // Get the rotation of the container
        const quat = ring?.mesh.quaternion;

        ring?.data.forEach((rect, i) => {
          const speedFactor = orbitSpeeds[i % orbitSpeeds.length];

          // Set angular rotation
          const swirlForce = mapClamp(rect.position.length(), 0, 500, ANGULAR_RANGE.min, ANGULAR_RANGE.max) * speedFactor;
          Modifiers.setOrbit(rect, swirlForce);

          // Make the rectangles always face the camera
          Modifiers.lookAt(rect, cameraPos, undefined, quat);
        })
      })

      // --- 4. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
      _camera = {};
    }
  },

  [Scenes.SUPER_JUST]: {
    init: (engine) => {
      _state = {
        beatCount: 0,
        subBeat: 0,
      }

      _camera = {
        speedZoom: 0.04,
        angleY: 5,
        speedAngleY: 0.25
      }

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { smoothedAudio, repeatEvery, beatCycle, currentBar } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5 } = midiState.knobs;
      
      const elements = {
        grid: engine.elements.get(elementIds.GRID),
      }

      if (!elements.grid) return;

      // Audio channels
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const keysClem = smoothedAudio[ChannelNames.KEYS_CLEM]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      _input = {
        depthFactor1: bass.loudness,
        depthFactor2: keys.pitch,
        depthFactor3: keysClem.loudness,
        rowFactorPrimary: brass.pitch || knob1,
        rowFactorSecondary: woodwinds.pitch || knob3,
        rowVisibilityPrimary: brass.loudness || knob2,
        rowVisibilitySecondary: woodwinds.loudness || knob4,
        cameraZoomFactor: bass.loudness || knob5,
      }

      // Constants
      const BASE_FREQ = time * 0.001;
      const BASE_ANGLE_Y = 90;
      const MAX_DISTANCE = 1000;
      const DEPTH_STEPS = 8;
      const DEPTH_FREQUENCY = 0.2;

      const rows = elements.grid.config.layout.dimensions?.y || 10;

      // Computed audio values + MIDI
      const depthGap = currentBar();
      const depthSteps = [ _input.depthFactor1, _input.depthFactor2, _input.depthFactor3 ];
      const rowVisibilityPrimary = _input.rowVisibilityPrimary;
      const rowVisibilitySecondary = _input.rowVisibilitySecondary;
      const rowFactorPrimary = mapQuantize(_input.rowFactorPrimary, 1, 0, 0, rows);
      const rowFactorSecondary = mapQuantize(_input.rowFactorSecondary, 1, 0, 0, rows);
      const rotationAngle = beatCycle(time, { beats: 4 }) * Math.PI * 0.1;

      // Camera params
      const { azimuth } = engine.getCameraAngles();
      const zoom = engine.controls.getDistance();
      const cameraAngleY = BASE_ANGLE_Y + Math.sin(BASE_FREQ * (_camera.speedAngleY || 0)) * (_camera.angleY || 0)
      const cameraZoom = (_camera.speedZoom || 0) * (1 + _input.cameraZoomFactor);
      const cameraCanZoom = zoom < MAX_DISTANCE;

      // --- 2. GLOBAL & CAMERA SECTION ---
      engine.cameraRotate(azimuth, cameraAngleY);
      if (cameraCanZoom) engine.cameraZoom(cameraZoom);

      // --- 3. INSTANCE TRANSFORMATIONS ---

      // Hide all elements when ended
      if (ended) {
        elements.grid.setVisibility(false);
      }

      elements.grid.data.forEach((rect, i) => {
        const row = rect.grid?.y || 12;
        const col = rect.grid?.x || 24;
        const indexOffset = i * 0.02;
        const depthStep = depthSteps[i % depthSteps.length] * DEPTH_STEPS;

        // Quantize the position to make the rects 'jump' instead of fluid motion
        rect.renderRotation.y = rect.rotation.y + rotationAngle;
        rect.renderPosition.z = rect.position.z + Math.floor(Math.sin(BASE_FREQ * DEPTH_FREQUENCY + indexOffset) * depthStep) * depthGap;

        // Reset all colors to black
        const baseColor = dummyColor.set(Palette.DARK);
        elements.grid?.mesh.setColorAt(i, baseColor)

        const rowOffsetPrimary = mapQuantize(Math.sin(BASE_FREQ + col * 0.25) * rowVisibilityPrimary, -1, 1, -4, 4);
        const rowOffsetSecondary = mapQuantize(Math.sin(BASE_FREQ + col * 0.33) * rowVisibilitySecondary, -1, 1, -4, 4);

        // Apply color to selected rows
        if ((rowVisibilityPrimary && row == (rowFactorPrimary + rowOffsetPrimary))
         || (rowVisibilitySecondary && row == (rowFactorSecondary + rowOffsetSecondary))) {
          const activeColor = dummyColor.set(Palette.RED);
          elements.grid?.mesh.setColorAt(i, activeColor);
  
          if (elements.grid?.data[i]?.motionSpeed) {
            elements.grid.data[i].motionSpeed.rotation.y = 0.1;
          }

          // Make all active visible when track ends
          if (ended) elements.grid?.setInstanceVisibility(i, true);
        }
      });

      elements.grid.mesh.instanceColor!.needsUpdate = true;
 
      // --- 4. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 2 }, () => {
        if (!elements.grid || ended) return;

        const sequence = random([ SEQUENCES.prime, SEQUENCES.square, SEQUENCES.triangular, SEQUENCES.lucas, SEQUENCES.fibonacci ]);

        // Create two random mathematical patterns to hide rects
        const patternA = {
          freq:  randomInt((sequence[4] || 0), (sequence[7] || 0)),
          count: randomInt((sequence[3] || 0), (sequence[4] || 0)),
        };
        const patternB = {
          freq:  randomInt((sequence[4] || 0), (sequence[6] || 0)),
          count: randomInt((sequence[2] || 0), (sequence[4] || 0)),
        };

        elements.grid.setVisibility(false);
        
        // Toggle visibility following index
        elements.grid.data.forEach((rect, i) => {
          if (!elements.grid || ended) return;
  
          if ((i + _state.beatCount) % patternA.freq < patternA.count ||
              (i + _state.beatCount) % patternB.freq < patternB.count) {
            elements.grid.setInstanceVisibility(i, true);
          }

          // Reset red elements rotation
          if (rect.motionSpeed) {
            rect.rotation.y = 0;
            rect.motionSpeed.rotation.y = 0;
          }
        })  

        elements.grid.mesh.instanceColor!.needsUpdate = true;
        _state.beatCount++;
      })
    }
  },

  [Scenes.TUFTEEE]: {
    init: (engine) => {
      _state = {
        store: [],
        progress: 0,
        randomDirection: 0,
      };

      const elements = { grid: engine.elements.get(elementIds.STRUCTURE) }

      elements.grid?.data.forEach((rect) => {
        const ringIndex = rect.grid?.y || 0;
    
        // Alternate directions: even rings go left, odd go right
        const direction = ringIndex % 2 === 0 ? 1 : -1;
        const speed = random(0.0001, 0.001)

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
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        grid: engine.elements.get(elementIds.STRUCTURE),
      }

      if (!elements.grid) return;

      // Audio channels
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const overhead = smoothedAudio[ChannelNames.OH]!;

      _input = {
        scaleFactor1: drums.centroid || knob1,
        scaleFactor2: bass.centroid || knob2,
        scaleFactor3: keys.centroid || knob3,
        globalSpeedFactor: brass.loudness || knob4,
        offsetFactor: woodwinds.loudness || knob5,
        speedFactor1: drums.loudness || knob6,
        speedFactor2: bass.loudness || knob6,
        speedFactor3: keys.loudness || knob6,
        scrollDirection: overhead.flatness,
      }

      // Constants
      const BASE_FREQ = time * 0.002;
      const PROGRESS_STEP = 1 / 120; // 1 / SECONDS * FPS
      const VISIBILITY_RANGE_X = { min: -180, max: 180 };
      const VISIBILITY_RANGE_Z = { min: 25, max: 500 };
      
      // Computed audio values + MIDI
      const globalScaleFrequency = BASE_FREQ * 2;
      const globalSpeedFactor = _input.globalSpeedFactor * 0.5;
      const offsetFactor = _input.offsetFactor + 0.5;
      const speedFactors = [_input.speedFactor1, _input.speedFactor2, _input.speedFactor3];
      const scaleFactors = [_input.scaleFactor1, _input.scaleFactor2, _input.scaleFactor3];
      const scrollDirection = overhead.flatness > 0 ? Math.sign(overhead.flatness - 0.5) : random([-1, 1]);
      const rowHeight = elements.grid.config.style.size.y;
      const rows = elements.grid.config.layout.dimensions?.y || 10;

      // --- 2. GLOBAL & CAMERA SECTION ---

      // --- 3. INSTANCE TRANSFORMATIONS ---

      // Reset local store and element visibility
      elements.grid.setVisibility(false);

      _state.store = [];

      elements.grid.data.forEach((rect, i) => {
        const isOnScreen = rect.position.z > VISIBILITY_RANGE_Z.min && rect.position.z < VISIBILITY_RANGE_Z.max
                        && rect.position.x > VISIBILITY_RANGE_X.min && rect.position.x < VISIBILITY_RANGE_X.max;

        const coordsText = (rect.renderScale.x * 0.2 * Math.sign(rect.motionSpeed?.angular || 1)).toFixed(4);
        const scaleFactor = scaleFactors[i % scaleFactors.length] * 0.5;

        // Store data for 2d rendering
        _state.store.push({
          visibility: isOnScreen,
          text: coordsText
        });

        if (rect.motionSpeed) {
          if (!ended) {
            rect.motionSpeed.scale.x = 0.1 * Math.sin(globalScaleFrequency + i * 0.08) * scaleFactor;
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

        // Translate vertically
        if (_state.progress < 0.92 && rect.params) {
          rect.position.y = rect.params.prevPosY + Easing.POWER3_IN_OUT(_state.progress) * _state.randomDirection * rowHeight;
        }
        // Update previous pos to new
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
        _state.progress += PROGRESS_STEP;
      }

      repeatEvery({ beats: 3 }, () => {
        if (ended) return;

        _state.progress = 0;
        _state.randomDirection = random([0, 0, 1, 2]) * scrollDirection;

        // Apply new radial speed to the whole ring
        const randomIndex = randomInt(0, rows - 1);

        elements.grid?.data.forEach((rect, i) => {
          const row = rect.grid?.y || 5;

          if (row == randomIndex) {
            const direction = randomIndex % 2 === 0 ? 1 : -1;
            const speed = 0;
            
            Modifiers.setOrbit(rect, speed * direction);
            
            const activeColor = dummyColor.set(Palette.RED);
            elements.grid?.mesh.setColorAt(i, activeColor);
          }
          // Reset black color
          else {
            const speedFactor = 0.0005 * (0.25 + speedFactors[row % speedFactors.length] + globalSpeedFactor);
            const distanceFromTarget = Math.abs(randomIndex - row) * offsetFactor;
            const direction = randomIndex % 2 === 0 ? 1 : -1;

            Modifiers.setOrbit(rect, speedFactor * distanceFromTarget * direction);

            const baseColor = dummyColor.set(Palette.DARK);
            elements.grid?.mesh.setColorAt(i, baseColor);
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

  [Scenes.USBTEC]: {
    init: (engine) => {
      _state = {
        centers: [],
        connections: Array(3).fill(null).map(_ => []),
        instanceIds: Array(3).fill(null).map(_ => []),
      }

      _camera = {
        speedZoom: 2.5,
        speedAngleX: 0.05,
        angleY: 0.1,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const bridge = useSceneBridge();
      const { smoothedAudio, beatCycle } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

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
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const bassDrum = smoothedAudio[ChannelNames.BD]!;
      const bass = smoothedAudio[ChannelNames.BASS]!;
      const liveFx = smoothedAudio[ChannelNames.LIVE_FX]!;

      _input = {
        swirlFactor1: liveFx.loudness || knob1,
        swirlFactor2: woodwinds.loudness || knob2,
        swirlFactor3: brass.loudness || knob3,
        attractionFactor1: liveFx.centroid || knob4,
        attractionFactor2: woodwinds.centroid || knob5,
        attractionFactor3: brass.centroid || knob6,
        cameraZoomFactor: bassDrum.loudness,
        cameraAngleFactor: bass.loudness,
      }

      // Constants
      const maxPoints = 92; // This indicates the stored max, does not concern visibility

      // Computed audio values + MIDI
      const swirlFactors = [ _input.swirlFactor1, _input.swirlFactor2, _input.swirlFactor3 ];
      const attractionFactors = [ _input.attractionFactor1, _input.attractionFactor2, _input.attractionFactor3 ];
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
      
      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const cameraZoom = (_camera.speedZoom || 0) * _input.cameraZoomFactor * beatCycle(time, { beats: 2, offset: 2 });
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0) * _input.cameraAngleFactor;
      const cameraAngleY = polar + beatCycle(time, { beats: 12 }) * (_camera.angleY || 0);

      engine.cameraRotate(cameraAngleX, cameraAngleY);
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

      elements.particles.forEach((element, orbitIndex) => {
        element?.data.forEach((rect) => {
          const dist = rect.position.length();
          
          // Rotate based on distance
          // Elements closer to the center swirl faster
          const swirlFactor = 0.5 - swirlFactors[orbitIndex] * 0.5; // 0.35
          const attractionFactor = 0.35 - attractionFactors[orbitIndex] * 0.2; // 0.15
          const swirlForce = 0.05 / (dist * 0.01 + swirlFactor) * (swirlFactors[orbitIndex] + 0.1);
          const attractionForce = -((dist * 0.00025 + attractionFactor)) * (attractionFactors[orbitIndex] + 0.1);

          rect.scale.x = 1 + swirlFactor;

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

          for (let id = 0; id < maxPoints; id++) {
            const newId = element.resetIds[id];

            // Store connection ids
            if (newId && newId > 2 && !_state.connections[i].includes(newId)) {
              _state.connections[i].push(newId);
            }
          }
        }

        // 2. Removing logic
        if (_state.connections[i].length > maxPoints) {
          const overflow = _state.connections[i].length - maxPoints;
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
      _input = {};
      _camera = {};
    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {
      _state = {
        points: [],
        rowIndices: [],
        progress: 0,
        pushFactor: 0,
      }

      _camera = {
        minAngleX: -45,
        maxAngleX: 45,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { setInstancesScreenPositions, clearAllScreenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;

      const elements = {
        gridFront: engine.elements.get(elementIds.GRID),
        gridBack: engine.elements.get(elementIds.GRID_2),
        connections: useSceneManager().scene2D.value?.elements.get(elementIds.CONNECTIONS),
      };

      if (!elements.gridFront || !elements.gridBack) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const overhead = smoothedAudio[ChannelNames.OH]!;
      const snare = smoothedAudio[ChannelNames.SN]!;
      const bassDrum = smoothedAudio[ChannelNames.BD]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;

      _input = {
        speedFactorFront: snare.loudness || knob1,
        speedFactorBack: overhead.loudness || knob2,
        rotationFactorFront: brass.pitch,
        rotationFactorBack: woodwinds.pitch,
        pushFactor: woodwinds.loudness || knob3,
        changeSpeedChance: harmonies.centroid || knob4,
        changeRowChance: bassDrum.loudness || knob5,
        cameraRotationFactor: brass.loudness || knob6,
      }

      // Constants
      const GLOBAL_SPEED_RANGE = { min: -0.005, max: 0.005 };
      const SPEED_RANGE = { min: -0.05, max: 0.05 };
      const ROTATION_FACTOR = 0.1;
      const TRIGGER_CAMERA_CHANCE = 0.1;
      const PUSH_DEPTH = 50;

      // Computed audio values + MIDI
      const changeRowChance = _input.changeRowChance;
      const changeSpeedChance = _input.changeSpeedChance * 0.5;
      const speedFactorFront = _input.speedFactorFront * 0.75;
      const speedFactorBack = _input.speedFactorBack * 0.75;
      const rotationFactorFront = _input.rotationFactorFront * ROTATION_FACTOR;
      const rotationFactorBack = _input.rotationFactorBack * ROTATION_FACTOR;

      _state.pushFactor = lerp(_state.pushFactor, _input.pushFactor, 0.05);
      const pushFactor = _state.pushFactor;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraAngleX = azimuth + Easing.SINE_IN(_input.cameraRotationFactor) * 0.05;

      engine.cameraRotate(cameraAngleX, polar);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.gridFront.data.forEach((rect, i) => {
        if (rect.motionSpeed?.position.y) {
          rect.position.y -= rect.motionSpeed.position.y * speedFactorFront;
          rect.motionSpeed.rotation.y = _state.points.includes(i) ? rotationFactorFront : 0;
          rect.scale.x = _state.points.includes(i) ? 4 : 1;
          rect.renderPosition.z += pushFactor * Math.sin(rect.position.y / 128 * Math.PI + Math.PI * 0.5) * PUSH_DEPTH;
        }
      });

      elements.gridBack.data.forEach((rect, i) => {
        if (rect.motionSpeed?.position.y) {
          rect.position.y -= rect.motionSpeed.position.y * speedFactorBack;
          rect.motionSpeed.rotation.y = _state.points.includes(i) ? rotationFactorBack : 0;
          rect.scale.x = _state.points.includes(i) ? 4 : 1;
          rect.renderPosition.z -= pushFactor * Math.sin(rect.position.y / 128 * Math.PI + Math.PI * 0.5) * PUSH_DEPTH;
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
        if (chance(changeRowChance)) {
          const rowInterval = random([-1, 1]);
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
          const randomRowInterval = randomInt(3, 5);
          const randomRowOffset = randomInt(0, 2);

          if (rect.motionSpeed) {
            // Apply to the whole grid
            if (chance(changeSpeedChance)) {
              rect.motionSpeed.position.y += random(GLOBAL_SPEED_RANGE.min, GLOBAL_SPEED_RANGE.max);
            }

            // Apply to specific rows
            if (chance(changeSpeedChance)) {
              const rowInterval = rect.grid?.x! % randomRowInterval == randomRowOffset;
              if (rowInterval) rect.motionSpeed.position.y += random(SPEED_RANGE.min, SPEED_RANGE.max);
            }
          }
        })

        elements.gridBack?.data.forEach((rect) => {
          const randomRowInterval = randomInt(3, 5);
          const randomRowOffset = randomInt(0, 2);

          if (rect.motionSpeed) {
            // Apply to the whole grid
            if (chance(changeSpeedChance)) {
              rect.motionSpeed.position.y += random(GLOBAL_SPEED_RANGE.min, GLOBAL_SPEED_RANGE.max);
            }

            // Apply to specific rows
            if (chance(changeSpeedChance)) {
              const rowInterval = rect.grid?.x! % randomRowInterval == randomRowOffset;
              if (rowInterval) rect.motionSpeed.position.y += random(SPEED_RANGE.min, SPEED_RANGE.max);
            }
          }
        })

        // Switch camera view
        if (chance(TRIGGER_CAMERA_CHANCE)) {
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
  
  [Scenes.ZOHO]: {
    init: (engine) => {
      _state = {
        orbits: [], // the 'stars' that are tracked
        trails: [] as number[][], // the positions of the trails left by the orbits
        targetOrbits: [0, 1],
        orbitsSpeed: [],
        subBeat: 0,
        cameraProgress: 0,
        _triggered: false,
      }

      _camera = {
        angleY: 30,
        targetAngle: 0,
        speedAngleX: -0.025,
        speedAngleY: 0.01,
        speedZoom: -0.25,
      }

      const elements = { orbits: engine.elements.get(elementIds.MAIN) };

      elements.orbits?.data.forEach((rect, i) => {
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
      const bridge = useSceneBridge();
      const { smoothedAudio, beatCycle, barSubBeat, repeatEvery } = engine.audioManager;
      const { knob1, knob2, knob3, knob4, knob5, knob6 } = midiState.knobs;
      const { pad1 } = midiState.pads;

      const elements = {
        orbits: engine.elements.get(elementIds.MAIN),
        particles: engine.elements.get(elementIds.PARTICLES),
        trails: useSceneManager().scene2D.value?.elements.get(elementIds.TRAILS),
      };

      if (!elements.orbits || !elements.particles || !elements.trails) return;

      // Audio channels
      const keys = smoothedAudio[ChannelNames.KEYS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;

      _input = {
        globalOrbitFactor: brass.loudness,
        orbitFactor1: knob1,
        orbitFactor2: knob2,
        orbitFactor3: knob3,
        orbitFactor4: knob4,
        orbitFactor5: knob5,
        orbitFactor6: knob6,
        scanCountFactor: keys.loudness || knob1,
        scansTrigger: pad1,
      }

      // Constants
      const BASE_FREQ = time * 0.001;

      const orbitsCount = elements.orbits.data.length;
      const trailsCount = elements.trails.data.length || 25;
      const maxTrailElements = trailsCount / orbitsCount;

      // Computed audio values + MIDI
      const globalOrbitFactor = _input.globalOrbitFactor;
      const scanCountFactor = _input.scanCountFactor;
      const orbitFactors = [ _input._orbitFactor1, _input.orbitFactor2, _input.orbitFactor3, _input.orbitFactor4, _input.orbitFactor5,, _input.orbitFactor6 ];
      const scansTrigger = _input.scansTrigger;

      // --- 2. GLOBAL & CAMERA SECTION ---
      const { azimuth, polar } = engine.getCameraAngles();
      const cameraPos = engine.getCameraPosition();
      const cameraAngleX = azimuth + (_camera.speedAngleX || 0);
      const cameraAngleY = polar + Easing.SINE_IN_OUT(_state.cameraProgress) * (_camera.targetAngle || 0);
      const cameraZoom = (_camera.speedZoom || 0) * beatCycle(time, { beats: 12 })

      if (_state.cameraProgress < 1) _state.cameraProgress += 0.01;

      engine.cameraZoom(cameraZoom);
      engine.cameraRotate(cameraAngleX, cameraAngleY);

      // --- 3. INSTANCE TRANSFORMATIONS ---
      elements.orbits.data.forEach((rect, i) => {
        const orbitFactor = orbitFactors[i % orbitFactors.length];

        if (!_state.orbitsSpeed[i]) _state.orbitsSpeed[i] = 0;
        _state.orbitsSpeed[i] += orbitFactor * 0.01;

        const orbitSpeed = _state.orbitsSpeed[i];

        const orbitFreqX = Math.sin(BASE_FREQ * rect.params.freq + orbitSpeed + rect.params.offsetFreq) * rect.params.orbitX;
        const orbitFreqY = Math.cos(BASE_FREQ * rect.params.freq + orbitSpeed + rect.params.offsetFreq) * rect.params.orbitZ;
        const orbitFreqZ = Math.cos(BASE_FREQ * rect.params.freq + orbitSpeed - rect.params.offsetFreq) * rect.params.orbitY;

        const globalOrbitX = 0.2 * globalOrbitFactor * rect.params.orbitX;
        const globalOrbitY = 0.2 * globalOrbitFactor * rect.params.orbitZ;
        const globalOrbitZ = 0.2 * globalOrbitFactor * rect.params.orbitY;

        // Apply orbits
        rect.renderPosition.x += orbitFreqX + globalOrbitX;
        rect.renderPosition.z += orbitFreqY + globalOrbitY;
        rect.renderPosition.y += orbitFreqZ + globalOrbitZ;

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
        const orbitCount = mapQuantize(scanCountFactor, 0.2, 0.8, 1, 9);
        const orbitIndices = Array(_state.orbits.length).fill(null).map((_, i) => i);
        
        shuffle(orbitIndices)
        _state.targetOrbits = orbitIndices.slice(0, orbitCount);

        // Randomize camera target
        _camera.targetAngle = random((_camera.speedAngleY || 0.01) * -1, (_camera.speedAngleY || 0.01));
        _state.cameraProgress = 0;
      })

      // Manual: Randomize target orbits
      if (scansTrigger && !_state._triggered) {
        const orbitCount = mapQuantize(scanCountFactor, 0.2, 0.8, 1, 9);
        const orbitIndices = Array(_state.orbits.length).fill(null).map((_, i) => i);
        
        shuffle(orbitIndices)
        _state.targetOrbits = orbitIndices.slice(0, orbitCount);

        _state._triggered = true;
      }
      else if (!_input.scanTrigger && _state._triggered) {
        _state._triggered = false;
      }

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
            point.params.trailId = i;

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
      _input = {};
      _camera = {};
    }
  }
};