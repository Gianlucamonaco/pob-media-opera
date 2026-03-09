import { chance, mapClamp, random, randomInt } from "~/composables/utils/math";
import { useSceneBridge } from "~/composables/scene/bridge";
import { midiState } from '~/composables/controls/MIDI';
import { ChannelNames, DrawModes, Fonts, Palette, Scenes, TextAligns, VerticalAligns } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";

let _state = {} as any;

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.ASSIOMA]: {
    init: (engine) => {
      _state = {
        drawMode: DrawModes.PATH,
        activeSegments: [],
      }
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
      const FRAME_INTERVAL = Math.floor(time / 60);

      // Computed audio values + MIDI
      const positions = Array.from(screenPositions);

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update scan / tracking positions
      positions.forEach(([_, pos], index) => {
        const target = positions[index + 1];
        const line = shapes.data[index];

        if (!line) return;

        line.size.x = 0;
        line.size.y = 0;
        line.visibility = false;

        if (!target) return;

        line.position.x = pos.x * shapes.width;
        line.position.y = pos.y * shapes.height;
        line.size.x = ((target?.[1]?.x || 0) - pos.x) * shapes.width;
        line.size.y = ((target?.[1]?.y || 0) - pos.y) * shapes.height;

        switch (_state.drawMode) {
          case DrawModes.SEGMENT:
            line.visibility = FRAME_INTERVAL % positions.length == index || FRAME_INTERVAL % positions.length == index + 1;
            break;
          case DrawModes.RANDOM:
            line.visibility = _state.activeSegments[index] || false;
            break;
          case DrawModes.PATH:
            line.visibility = true;
            break;
        }
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 2 }, () => {
        _state.drawMode = random(Object.values(DrawModes));

        if (_state.drawMode == DrawModes.RANDOM) {
          _state.activeSegments = Array(positions.length).fill(null).map(_ => chance(0.25))
        }
      })
    },
  },

  [Scenes.CONFINE]: {
    init: (engine) => {
      _state = {
        center: null,
      };

      const shapes = engine.elements.get('lines-1');
      if (!shapes) return;

      shapes.data.forEach(item => {
        // item.visibility = false;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getSceneData, screenPositions } = useSceneBridge();
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('lines-1');
      const connections = engine.elements.get('connections-1');
      const scans = engine.elements.get('scan-1');
      const flock = useScene3D().value?.elements.get('flock-1');
      if (!shapes || !connections || !scans) return;

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 1500 };
      const SCALE_RANGE = { min: 0.5, max: 1 };

      // --- 2. SHAPE TRANSFORMATIONS ---
      const center = Array.from(screenPositions)[0]?.[1];

      connections.data.forEach((connection, i) => {
        const target = Array.from(screenPositions)[i + 1];
        connection.size.x = 0;
        connection.size.y = 0;

        if (!target?.[1]?.visible || !center?.visible) return;
        connection.position.x = center.x * connections.width;
        connection.position.y = center.y * connections.height;
        connection.size.x = target[1].x * connections.width - connection.position.x;
        connection.size.y = target[1].y * connections.height - connection.position.y;
      })

      scans.data.forEach((item, i) => {
        const target = Array.from(screenPositions)[i + 1];
        item.scale = 0;
        
        if (!target?.[1]?.visible || !target?.[1]?.distance || !center?.visible) return;

        const scaleIncr = mapClamp(target[1].distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

        item.position.x = target[1].x * scans.width;
        item.position.y = target[1].y * scans.height;
        item.scale = scaleIncr;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {

        // Calculate line pattern based on frequency sign for each flock item
        shapes.data.forEach((item, i) => {
          const index = flock?.data.length || 0;
          item.visibility = getSceneData((i % index).toString()) > 0;
        })
      })
    },
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
        label.contentOverride = Math.round(value.distance || 0)?.toString();

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

      repeatEvery({ beats: 2 }, () => {
        // Switch randomly between connections and matrix
        if (chance(0.33)) {
          engine.matrixMode = !engine.matrixMode;
        }
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
        if (matrix[i] === 1) {
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
    },
    dispose: (engine) => {
      engine.matrixMode = false;
    }
  },

  [Scenes.SOLO_01]: {
    init: (engine) => {
      _state = {
        progress: 0,
        fadeProgress: 0,
        isFadingText: false,
        textPosition: { x: 0, y: 0 },
      };

      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      shapes.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (shapes.config.content && _state.progress >= shapes.config.content.length) return;

        shapes.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * shapes.width,
            y: (shapes.config.layout.spacing?.y || 0.1) * (_state.progress % 5) * shapes.height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (shapes.config.content) {
            item.contentOverride = shapes.config.content[_state.progress % shapes.config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (shapes.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        shapes.data.forEach((item) => {
          item.params.progress = _state.fadeProgress / duration;
          item.params.position = _state.textPosition;
        })

        _state.fadeProgress++;
      }
    },
  },

  [Scenes.SOLO_02]: {
    init: (engine) => {
      _state = {
        progress: 0,
        fadeProgress: 0,
        isFadingText: false,
        textPosition: { x: 0, y: 0 },
      };

      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      shapes.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (shapes.config.content && _state.progress >= shapes.config.content.length) return;

        shapes.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * shapes.width,
            y: (shapes.config.layout.spacing?.y || 0.1) * (_state.progress % 5) * shapes.height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (shapes.config.content) {
            item.contentOverride = shapes.config.content[_state.progress % shapes.config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (shapes.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        shapes.data.forEach((item) => {
          item.params.progress = _state.fadeProgress / duration;
          item.params.position = _state.textPosition;
        })

        _state.fadeProgress++;
      }
    },
  },

  [Scenes.SOLO_03]: {
    init: (engine) => {
      _state = {
        progress: 0,
        fadeProgress: 0,
        isFadingText: false,
        textPosition: { x: 0, y: 0 },
      };

      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      shapes.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (shapes.config.content && _state.progress >= shapes.config.content.length) return;

        shapes.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * shapes.width,
            y: (shapes.config.layout.spacing?.y || 0.1) * (_state.progress % 5) * shapes.height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (shapes.config.content) {
            item.contentOverride = shapes.config.content[_state.progress % shapes.config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (shapes.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        shapes.data.forEach((item) => {
          item.params.progress = _state.fadeProgress / duration;
          item.params.position = _state.textPosition;
        })

        _state.fadeProgress++;
      }
    },
  },

  [Scenes.SOLO_04]: {
    init: (engine) => {
      _state = {
        progress: 0,
        fadeProgress: 0,
        isFadingText: false,
        textPosition: { x: 0, y: 0 },
      };

      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      shapes.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const shapes = engine.elements.get('text-1');
      if (!shapes) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (shapes.config.content && _state.progress >= shapes.config.content.length) return;

        shapes.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * shapes.width,
            y: (shapes.config.layout.spacing?.y || 0.1) * (_state.progress % 5) * shapes.height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (shapes.config.content) {
            item.contentOverride = shapes.config.content[_state.progress % shapes.config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (shapes.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        shapes.data.forEach((item) => {
          item.params.progress = _state.fadeProgress / duration;
          item.params.position = _state.textPosition;
        })

        _state.fadeProgress++;
      }
    },
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {
      _state = {
        particlesPositions: [],
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions } = useSceneBridge();
      const connections = engine.elements.get('connections-1');
      const particles = useScene3D().value?.elements.get('particles');

      // Computed audio values + MIDI
      if (!connections || !particles) return;

      // --- 2. SHAPE TRANSFORMATIONS ---
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      particles.data.forEach((_, i) => {
        _state.particlesPositions[i] = screenPositions.get(i);
      })

      connections.data.forEach((connection, i) => {
        const target = Array.from(screenPositions)[i + particles.data.length];
        connection.size.x = 0;
        connection.size.y = 0;

        if (!target) return;

        const particle = _state.particlesPositions[target[1].params?.particleIndex]

        if (!particle?.visible || !target[1].visible) return;

        connection.position.x = particle.x * connections.width;
        connection.position.y = particle.y * connections.height;
        connection.size.x = target[1].x * connections.width - connection.position.x;
        connection.size.y = target[1].y * connections.height - connection.position.y;
      })

    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.USBTEC]: {
    init: (engine) => {
      _state = {
        resets: [ [], [], [] ],
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions, setInstancesScreenPositions, removeInstancesScreenPositions } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;
      const elements3D = [
        useScene3D().value?.elements.get('flock-1'),
        useScene3D().value?.elements.get('flock-2'),
        useScene3D().value?.elements.get('flock-3'),
      ];
      const shapes = [
        engine.elements.get('scan-1'),
        engine.elements.get('text-1'),
        engine.elements.get('connections-1'),
      ];

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const MAX_LINES = 92;

      // Computed audio values + MIDI
      if (screenPositions.size === 0) return;

      // --- 2. SHAPE TRANSFORMATIONS ---
      let poolIndex = 0;

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      screenPositions.forEach((value, i) => {

        // Center points
        if (i < 3) {
          if (!shapes[0] || !shapes[1]) return;
          const target = shapes[0].data[poolIndex];
          const text = shapes[1].data[poolIndex];
  
          if (target) {
            target.position.x = value.x * shapes[0].width;
            target.position.y = value.y * shapes[0].height;
          }
  
          if (text) {
            // Each column displays reset instance ids with 6 digits
            text.contentOverride = _state.resets[i].map((id: number) => {
              return '0'.repeat(6 - id.toString().length) + id.toString();
            })
          }
        }

        // Connections lines
        else {
          if (!shapes[0] || !shapes[2]) return;
          const connection = shapes[2].data[poolIndex - 3];
          const centerId = ['flock-1', 'flock-2', 'flock-3'].indexOf(value.params.elementId) || 0;
          const center = screenPositions.get(centerId);

          if (connection && center) {
            connection.position.x = center.x * shapes[0].width;
            connection.position.y = center.y * shapes[0].height;
            connection.size.x = value.x * shapes[2].width - connection.position.x;
            connection.size.y = value.y * shapes[2].height - connection.position.y;
          }
        }

        poolIndex++;
      })

      // Store the IDs of instances whose position has been reset
      elements3D?.forEach((element, i) => {
        if (!_state.resets[i]) return;

        // 1. Adding logic
        if (element?.resetIds.length) {

          for (let id = 0; id < element.resetIds.length; id++) {
            const newId = element.resetIds[id];
            if (newId && newId > 2 && !_state.resets[i].includes(newId)) {
              removeInstancesScreenPositions(element.id, _state.resets[i]);
              _state.resets[i].push(newId);
            }
          }
        }

        // 2. Removing logic
        if (_state.resets[i].length > MAX_LINES) {
          const overflow = _state.resets[i].length - MAX_LINES;
          _state.resets[i].splice(0, overflow);
        }

        // Update screen positions
        if (element) {
          setInstancesScreenPositions(element.id, _state.resets[i]);
        }
      })

    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {
      _state = {
        visibility: [],
      }

      const text = engine.elements.get('text-1');

      // Initially text is hidden, assign content override
      text?.data.forEach((t) => {
        t.visibility = false;
        t.contentOverride = t.id.toString();
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions } = useSceneBridge();
      const shapes = engine.elements.get('connections-1');
      const text = engine.elements.get('text-1');
      if (!shapes || !text) return;

      // Audio channels

      // Constants

      // Computed audio values + MIDI
      const positions = Array.from(screenPositions);

      const points = [
        positions.filter(p => p[1]?.params?.elementId == 'grid-1'),
        positions.filter(p => p[1]?.params?.elementId == 'grid-2'),
      ]

      // --- 2. SHAPE TRANSFORMATIONS ---
      // Update scan / tracking positions
      points.forEach((set, setIndex) => {
        const baseIndex = setIndex * set.length;

        set.forEach(([_, pos], index) => {
          const target = set[index + 1];
          const line = shapes.data[baseIndex + index];

          if (!target || !line) return;

          // Hide line if points are behind camera
          if (!target?.[1].visible || !pos.visible) {
            line.size.x = 0;
            line.size.y = 0;
          }
          // Draw grid line
          else {
            line.position.x = pos.x * shapes.width;
            line.position.y = pos.y * shapes.height;
            line.size.x = ((target[1].x || 0) - pos.x) * shapes.width;
            line.size.y = ((target[1].y || 0) - pos.y) * shapes.height;
          }

          // Anchor text label to each point
          const textElement = text.data[baseIndex + index];
          if (!textElement) return;
          textElement.visibility = true;
          textElement.position.x = line.position.x;
          textElement.position.y = line.position.y - 10;
        })
      })

      points[0]?.forEach(([_, pos], index) => {
        if (!points[0] || !points[1]) return;
        const baseIndex = 2 * points[0].length;
        const target = points[1][index];
        const line = shapes.data[baseIndex + index];

        if (!target || !line) return;

        // Hide line if points are behind camera
        if (!target?.[1].visible || !pos.visible) {
          line.size.x = 0;
          line.size.y = 0;
        }
        // Draw bridge line between grids
        else {
          line.position.x = pos.x * shapes.width;
          line.position.y = pos.y * shapes.height;
          line.size.x = ((target?.[1]?.x || 0) - pos.x) * shapes.width;
          line.size.y = ((target?.[1]?.y || 0) - pos.y) * shapes.height;
        }
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      // line visibility
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.ZOHO]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { screenPositions, trackPositions } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;
      const shapes = [
        engine.elements.get('scan-1'),
        engine.elements.get('track-1'),
      ]
      if (!shapes[0] || !shapes[1]) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const STARS_COUNT = useScene3D().value?.elements.get('flock-1')?.data.length || 10;

      // Computed audio values + MIDI
      const harmonyImpact = harmonies.loudness;

      // --- 2. SHAPE TRANSFORMATIONS ---

      if (screenPositions.size === 0) return;

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      screenPositions.forEach(value => {
        if (!shapes[0]) return;

        const item = shapes[0].data[poolIndex];

        if (!item || !value.distance || poolIndex >= shapes[0].data.length) return;
        item.position.x = value.x * shapes[0].width;
        item.position.y = value.y * shapes[0].height;

        poolIndex++;
      })

      let trackIndex = 0;
      
      trackPositions.forEach((value, i) => {
        if (!shapes[1]) return;

        const item = shapes[1].data[trackIndex];

        if (!item || !value.distance || trackIndex >= shapes[1].data.length) return;
        const indexIncr = Math.floor(Math.floor(trackIndex / STARS_COUNT) / (trackPositions.size / STARS_COUNT / 8)) / 8;
        item.visibility = indexIncr > 1 - harmonyImpact;

        item.position.x = Math.floor(value.x * shapes[1].width / 10) * 10;
        item.position.y = Math.floor(value.y * shapes[1].height / 10) * 10;
        item.scale = indexIncr;

        trackIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {

    }
  }
}
