import { chance, mapClamp, random, randomInt } from "~/composables/utils/math";
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
      const DISTANCE_RANGE = { min: 100, max: 750 };
      const SCALE_RANGE = { min: 0.15, max: 1.5 };

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Prevent "ghost" shapes from freezing on screen.
      shapes.data.forEach(item => item.visibility = false);

      if (screenPositions.size === 0) return;

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      screenPositions.forEach(value => {
        const item = shapes.data[poolIndex];

        if (!item || !value.distance ||  poolIndex >= shapes.data.length) return;

        const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

        item.visibility = true; // Restore visibility
        item.position.x = value.x * shapes.width;
        item.position.y = value.y * shapes.height;
        item.scale = value.visible && value.distance < 1000 ? scaleIncr : 0;

        poolIndex++;
      })

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
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('scan-1');
      if (!shapes) return;

      // Audio channels

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---
      
      // Prevent "ghost" shapes from freezing on screen.
      shapes.data.forEach(item => item.visibility = false);

      if (screenPositions.size === 0) return;
      
      
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      screenPositions.forEach(value => {
        const item = shapes.data[poolIndex];

        if (!item || poolIndex >= shapes.data.length) return;

        // const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        const w = Math.abs(value.x - value.left) * 2.2;
        const h = Math.abs(value.top - value.y) * 2.2;

        item.visibility = true; // Restore visibility
        item.position.x = value.x * shapes.width;
        item.position.y = value.y * shapes.height;
        item.size.x = w * shapes.width;
        item.size.y = h * shapes.height;
        item.scale = 1;

        poolIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4, offset: 1 }, () => {
        shapes.config.style.color = '#0f0'
      })
      repeatEvery({ beats: 4, offset: 2 }, () => {
        shapes.config.style.color = '#f00'
      })

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

        line.position.x = pos.x * shapes.width;
        line.position.y = pos.y * shapes.height;
        line.size.x = ((target?.[1]?.x || 0) - pos.x) * shapes.width;
        line.size.y = ((target?.[1]?.y || 0) - pos.y) * shapes.height;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        shapes.data.forEach(item => {
          const visibilityChance = chance(harmonies.loudness);
          if (visibilityChance) item.visibility = !item.visibility;
        })
      })
    },
    renderMatrix: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ctx, canvas, matrix, matrixRes } = engine;
      const shapes = engine.elements.get('matrix-1');
      if (!shapes) return;

      // Constants
      const dpr = window.devicePixelRatio;
      const cols = matrixRes.x;
      const rows = matrixRes.y;
      const cellH = canvas.height / rows;
      const cellH = canvas.height / rows / dpr;
      const { style } = shapes.config;

      // --- 2. STYLE ---
      let fontSize = style.fontSize?.px;

      // Scale font to cell
      if (style.fontSize?.y) {
        fontSize = Math.floor(cellH * (style.fontSize.y));
      }

      ctx.fillStyle = style.color ?? '#ff0000';
      ctx.font = `${fontSize}px Space Grotesk`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // --- 3. DRAW LOGIC ---
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i] === 1 || chance(0.0001)) {
          // Convert linear index to 2D coordinates
          const col = i % cols;
          const row = Math.floor(i / cols);

          const x = col * cellW + (cellW / 2);
          const y = row * cellH + (cellH / 2);

          const matrixChance = 1;

          const text = ((Math.floor(time / 60) + i * 10) % 1000).toString();
          if (matrixChance) ctx.fillText(text, x, y);
        }
      }
    }
  }
}
