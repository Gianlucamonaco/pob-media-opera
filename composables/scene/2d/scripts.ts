import { chance, mapClamp, random, randomInt } from "~/composables/utils/math";
import { useSceneBridge } from "~/composables/scene/bridge";
import { ChannelNames, Fonts, Palette, Scenes, TextAligns, VerticalAligns } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";

let _state = {} as any;

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.ASSIOMA]: {
    init: (engine) => {
      const shapes = engine.elements.get('connections-1');
      if (!shapes) return;

      shapes.data.forEach(item => {
        item.visibility = false;
      })
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
        shapes.data.forEach((item, i) => {
          const visibilityChance = chance(harmonies.loudness);
          if (i < positions.length && visibilityChance) item.visibility = !item.visibility;
        })
      })
    },
  },

  [Scenes.CONFINE]: {
    init: (engine) => {
      _state = {
        progress: 0, // Use for modulo calculation for grid pattern
      };

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

        // Randomize modulo for
        _state.progress++;
      })

      if (chance(0.01)) _state.progress++;
    },
    }
  },

  [Scenes.DATASET]: {
    init: (engine) => {

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

    }
  },

  [Scenes.FUNCTIII]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions } = useSceneBridge();
      const { repeatEvery } = engine.audioManager;
      const shapes = [
        engine.elements.get('scan-1'),
        engine.elements.get('labels-1'),
      ];
      if (!shapes[0] || !shapes[1]) return;

      // Audio channels

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---
      
      // Prevent "ghost" shapes from freezing on screen.
      shapes[0].data.forEach(item => item.visibility = false);
      shapes[1].data.forEach(item => item.visibility = false);

      if (screenPositions.size === 0) return;
      
      
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      screenPositions.forEach(value => {
        if (!shapes[0] || !shapes[1]
          || poolIndex >= shapes[0].data.length
          || poolIndex >= shapes[1].data.length
        ) return;

        const item = shapes[0].data[poolIndex];
        if (!item) return;

        // const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        const w = Math.abs(value.x - value.left) * 2.2;
        const h = Math.abs(value.top - value.y) * 2.2;

        item.visibility = true; // Restore visibility
        item.position.x = value.x * shapes[0].width;
        item.position.y = value.y * shapes[0].height;
        item.size.x = w * shapes[0].width;
        item.size.y = h * shapes[0].height;
        item.scale = 1;

        const label = shapes[1].data[poolIndex];
        if (!label) return;

        label.visibility = true;
        label.position.x = value.x * shapes[0].width - item.size.x / 2;
        label.position.y = value.y * shapes[0].height - item.size.y / 2;
        label.size.x = w * shapes[0].width;
        label.size.y = h * shapes[0].height;
        label.scale = 1;

        poolIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {

    }
  },

  [Scenes.MTGO]: {
    init: (engine) => {

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
      const cellW = canvas.width / cols / dpr;
      const cellH = canvas.height / rows / dpr;
      const { style } = shapes.config;

      // --- 2. STYLE ---
      let fontSize = style.fontSize?.px;

      // Scale font to cell
      if (style.fontSize?.y) {
        fontSize = Math.floor(cellH * (style.fontSize.y));
      }

      ctx.fillStyle = style.color ?? Palette.RED;
      ctx.font = `${fontSize}px ${Fonts.MONO}`;
      ctx.textAlign = TextAligns.CENTER;
      ctx.textBaseline = VerticalAligns.MIDDLE;

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
  },

  [Scenes.SOLO_01]: {
    init: (engine) => {
      _state = {
        progress: 0, // Use for modulo calculation for grid pattern
      };

      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      // Set initial visibility false
      shapes.data.forEach((item, i) => item.visibility = false )
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const cols = shapes.config.layout.dimensions?.x || 10;
      const rows = shapes.config.layout.dimensions?.y || 10;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 4 }, () => {
        const visibleCol = randomInt(0, cols);
        const visibleRow = _state.progress % rows;
        
        shapes.data.forEach((item, i) => {

          // Set current cell visible (progressive row + random col)
          item.visibility = i === visibleRow * cols + visibleCol;

          // Set extra cells visible (in the same column)
          if (chance(0.25) && i % cols == visibleCol) item.visibility = true;

          // Change text every beat
          if (shapes.config.content) {
            item.contentOverride = shapes.config.content[_state.progress % shapes.config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })
    },
  }
}
