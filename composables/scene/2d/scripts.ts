import { chance, mapClamp } from "~/composables/utils/math";
import { useSceneBridge } from "~/composables/scene/bridge";
import { ChannelNames, Scenes } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";

let _store = [] as any[];
let _prog = 0;
let _state = 0;

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.CONFINE]: {
    init: (engine) => {
      const shapes = engine.elements.get('lines-1');
      if (!shapes) return;

      shapes.data.forEach(item => {
        item.targetPosition.x = 0;
        item.targetPosition.y = 10;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('lines-1');
      if (!shapes) return;

      // Audio channels

      // Constants

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        shapes.data.forEach(item => {
          const visibilityChance = chance(0.5);
          if (visibilityChance) item.visibility = !item.visibility;
        })
      })
    }
  },

  [Scenes.DATASET]: {
    init: (engine) => {
      _prog = 0;
      _state = 0;
      _store = [];

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions } = useSceneBridge();
      const shapes = engine.elements.get('scan-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 1000 };
      const SCALE_RANGE = { min: 0.15, max: 1.5 };

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update 2D scan positions
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      if (screenPositions.size) {
        Array.from(screenPositions).forEach(([_, value], index) => {
          const item = shapes.data[index];
          if (!item || !value.distance) return;

          const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

          item.position.x = value.visible ? value.x * shapes.width / window.devicePixelRatio : -1000;
          item.position.y = value.visible ? value.y * shapes.height / window.devicePixelRatio : -1000;
          item.scale = value.visible && value.distance < 1000 ? scaleIncr : 0;
          // if (index == 0) console.log(value.distance, item.scale)
        })
      }

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _store = [];
    }
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {
      _prog = 0;
      _state = 0;
      _store = [];

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions } = useSceneBridge();
      const shapes = engine.elements.get('scan-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 2000 };
      const SCALE_RANGE = { min: 0.35, max: 3 };

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update 2D scan positions
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      if (screenPositions.size) {
        Array.from(screenPositions).forEach(([_, value], index) => {
          const item = shapes.data[index];
          if (!item || !value.distance) return;

          const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

          item.position.x = value.visible ? value.x * shapes.width / window.devicePixelRatio : -1000;
          item.position.y = value.visible ? value.y * shapes.height / window.devicePixelRatio : -1000;
          // item.size.x = scaleIncr * (value._ref.scale.y || 10);
          item.size.y = item.size.x * (value.ratio || 2) / 0.5;
          item.scale = (value.visible && value.distance < 2000 && value.distance > 250) ? Math.pow(scaleIncr, 1) : 0;
          // if (index == 0) console.log(value.distance, item.scale)
        })
      }

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {
      useSceneBridge().removeScreenPositions();
      _store = [];
    }
  },

  [Scenes.MTGO]: {
    init: (engine) => {
      _store = [];

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions } = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('connections-1');
      if (!shapes) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants

      // Computed audio values + MIDI
      const positions = Array.from(screenPositions);

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update scan / tracking positions
      positions.forEach(([_, pos], index) => {
        const target = positions[index + 1] ? positions[index + 1] : positions[0];
        const line = shapes.data[index];
        if (!line) return;

        line.position.x = pos.x * shapes.width / window.devicePixelRatio;
        line.position.y = pos.y * shapes.height / window.devicePixelRatio;
        line.size.x = ((target?.[1]?.x || 0) - pos.x) * shapes.width / window.devicePixelRatio;
        line.size.y = ((target?.[1]?.y || 0) - pos.y) * shapes.height / window.devicePixelRatio;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        shapes.data.forEach(item => {
          const visibilityChance = chance(harmonies.loudness);
          if (visibilityChance) item.visibility = !item.visibility;
        })
      })
    }
  }

}
