import { chance, mapClamp, random, randomInt } from "~/composables/utils/math";
import { useSceneBridge } from "~/composables/scene/bridge";
import { ChannelNames, DrawModes, Fonts, Palette, Scenes, TextAligns, VerticalAligns } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";

let _state = {} as any;

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.ASFAY]: {
    init: (engine) => {
      _state = {}

      const labels = {
        COORDS: 'text-1',
      }

      const elements = {
        coords: engine.elements.get(labels.COORDS),
      }

      if (!elements.coords) return;

      elements.coords.data.forEach(item => {
        item.visibility = false;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();

      const labels = {
        GRID:       'grid-1',
        COORDS:     'text-1',
        SET_COORDS: 'coords',
      }

      const elements = {
        coords: engine.elements.get(labels.COORDS),
        grid: useScene3D().value?.elements.get(labels.GRID),
      }

      if (!elements.coords || !elements.grid) return;

      // Audio channels

      // Constants

      // Computed audio values + MIDI
      const points = {
        coords: getScreenSet(labels.SET_COORDS),
      }

      // --- 2. SHAPE TRANSFORMATIONS ---
      let poolIndex = 0;

      // Update scan / tracking positions
      points.coords?.forEach((point, index) => {
        if (!elements.coords || !elements.grid) return;;

        const element = elements.coords.data[poolIndex];
        const block = elements.grid.data[index]

        if (!element || !block) return;
        element.visibility = false;

        if (!point.visible) return;

        element.position.x = point.x * elements.coords.width;
        element.position.y = point.y * elements.coords.height;
        element.visibility = true;

        // Set coords
        if (!element.contentOverride) element.contentOverride = `${( block.position.x / 2500 ).toFixed(4)} ${( block.position.y / 2500 ).toFixed(4)} ${( block.position.z / 2500 ).toFixed(4)}`;

        poolIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
  },

  [Scenes.ASSIOMA]: {
    init: (engine) => {
      _state = {
        drawMode: DrawModes.PATH,
        activeSegments: [],
      }

      const labels = {
        CONNECTIONS:     'connections-1',
      }

      const elements = {
        connections: engine.elements.get(labels.CONNECTIONS),
      }

      if (!elements.connections) return;

      elements.connections.data.forEach(item => {
        item.visibility = false;
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;

      const labels = {
        CONNECTIONS:     'connections-1',
        SPIRAL:          'spiral-1',
        SET_CONNECTIONS: 'origins',
      }

      const elements = {
        connections: engine.elements.get(labels.CONNECTIONS),
      }

      const points = {
        connections: getScreenSet(labels.SET_CONNECTIONS),
      }

      elements.connections?.data.forEach(connection => {
        connection.visibility = false;
      });

      if (!elements.connections || !points.connections) return;
      const connectionPoints = Array.from(points.connections);

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const FRAME_INTERVAL = Math.floor(time / 60);

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update scan / tracking positions
      connectionPoints.forEach(([_, pos], index) => {
        const target = connectionPoints[index + 1];
        const line = elements.connections?.data[index];

        if (!line || !target || !elements.connections) return;

        line.position.x = pos.x * elements.connections.width;
        line.position.y = pos.y * elements.connections.height;
        line.size.x = ((target?.[1]?.x || 0) - pos.x) * elements.connections.width;
        line.size.y = ((target?.[1]?.y || 0) - pos.y) * elements.connections.height;

        switch (_state.drawMode) {
          case DrawModes.SEGMENT:
            line.visibility = FRAME_INTERVAL % connectionPoints.length == index || FRAME_INTERVAL % connectionPoints.length == index + 1;
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
          _state.activeSegments = Array(connectionPoints.length).fill(null).map(_ => chance(0.25))
        }
      })
    },
  },

  [Scenes.CONFINE]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getSceneData, getScreenSet } = useSceneBridge();
      const { repeatEvery } = engine.audioManager;

      const labels = {
        LINES: 'lines-1',
        CONNECTIONS: 'connections-1',
        SCAN: 'scan-1',
        CENTER: 'flock-1',
        SET_CENTER: 'centers',
        SET_SCANS: 'scans',
      };

      const elements = {
        dataLines: engine.elements.get(labels.LINES),
        connections: engine.elements.get(labels.CONNECTIONS),
        scans: engine.elements.get(labels.SCAN),
        centers: useScene3D().value?.elements.get(labels.CENTER),
      }

      const points = {
        center: getScreenSet(labels.SET_CENTER),
        scans: getScreenSet(labels.SET_SCANS),
      }

      if (!elements.dataLines || !elements.connections || !elements.scans || !points.center) return;

      // Clear to prevent "ghost" shapes from freezing on screen
      elements.scans.data.forEach(item => item.visibility = false);
      elements.connections.data.forEach(item => item.visibility = false);

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 1500 };
      const SCALE_RANGE = { min: 0.5, max: 1 };

      // --- 2. SHAPE TRANSFORMATIONS ---
      const center = Array.from(points.center)[0]?.[1];

      if (!points.scans?.size) return;

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      Array.from(points.scans)?.forEach(([_, point]) => {
        const connection = elements.connections?.data[poolIndex];
        const scan = elements.scans?.data[poolIndex];

        if (!center || !center?.visible || !point?.visible || !point.distance) return;

        // Draw connection lines
        if (connection && elements.connections) {
          connection.visibility = true;
          connection.position.x = center.x * elements.connections.width;
          connection.position.y = center.y * elements.connections.height;
          connection.size.x = point.x * elements.connections.width - connection.position.x;
          connection.size.y = point.y * elements.connections.height - connection.position.y;
        }

        // Draw scan element
        if (scan && elements.scans) {
          const scaleIncr = mapClamp(point.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

          scan.visibility = true;
          scan.position.x = point.x * elements.scans.width;
          scan.position.y = point.y * elements.scans.height;
          scan.scale = scaleIncr;
        }

        poolIndex++
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {

        // Calculate line pattern based on frequency sign for each flock item
        elements.dataLines?.data.forEach((item, i) => {
          const index = elements.centers?.data.length || 0;
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
      const { getScreenSet } = useSceneBridge();
      const labels = {
        SCANS:     'scan-1',
        SET_SCANS: 'scans',
      }

      const elements = {
        scans: engine.elements.get(labels.SCANS),
      }

      const points = {
        scans: getScreenSet(labels.SET_SCANS),
      }

      if (!elements.scans || !points.scans || points.scans.size === 0) return;

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 750 };
      const SCALE_RANGE = { min: 0.15, max: 1.5 };

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Prevent "ghost" shapes from freezing on screen
      elements.scans.data.forEach(item => item.visibility = false);

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      points.scans.forEach(value => {
        if (!elements.scans) return;

        const scan = elements.scans.data[poolIndex];
        if (!scan || !value.distance || poolIndex >= elements.scans.data.length) return;

        const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

        scan.visibility = true;
        scan.position.x = value.x * elements.scans.width;
        scan.position.y = value.y * elements.scans.height;
        scan.scale = value.visible && value.distance < 1000 ? scaleIncr : 0;

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
      const { getScreenSet } = useSceneBridge();
      const { repeatEvery } = engine.audioManager;

      const labels = {
        GRID:      'tunnel-1',
        LABELS:    'labels-1',
        SCANS:     'scan-1',
        SET_SCANS: 'scans',
      }

      const elements = {
        scans: engine.elements.get(labels.SCANS),
        labels: engine.elements.get(labels.LABELS),
      };

      const points = {
        scans: getScreenSet(labels.SET_SCANS),
      }

      // Prevent "ghost" elements from freezing on screen.
      elements.scans?.data.forEach(item => item.visibility = false);
      elements.labels?.data.forEach(item => item.visibility = false);

      if (!elements.scans || !elements.labels || !points.scans) return;

      const scansPoints = Array.from(points.scans);

      // Audio channels

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---
      
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      scansPoints.forEach(([_, value]) => {
        if (!elements.scans || !elements.labels
          || poolIndex >= elements.scans.data.length
          || poolIndex >= elements.labels.data.length
        ) return;

        const item = elements.scans.data[poolIndex];
        if (!item) return;

        // const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);
        const w = Math.abs(value.x - value.left) * 2.2;
        const h = Math.abs(value.top - value.y) * 2.2;

        item.visibility = true; // Restore visibility
        item.position.x = value.x * elements.scans.width;
        item.position.y = value.y * elements.scans.height;
        item.size.x = w * elements.scans.width;
        item.size.y = h * elements.scans.height;
        item.scale = 1;

        const label = elements.labels.data[poolIndex];
        if (!label) return;

        label.visibility = true;
        label.contentOverride = Math.round(value.distance || 0)?.toString();

        label.position.x = value.x * elements.scans.width - item.size.x / 2;
        label.position.y = value.y * elements.scans.height - item.size.y / 2;
        label.size.x = w * elements.scans.width;
        label.size.y = h * elements.scans.height;
        label.scale = 1;

        poolIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {

    }
  },

    [Scenes.LIKE_NOTHING]: {
    init: (engine) => {
      _state = {
        boundsConnections: [
          [0, 1], [0, 2], [1, 3], [2, 3],
          [4, 5], [4, 6], [5, 7], [6, 7],
          [0, 4], [1, 5], [2, 6], [3, 7],
        ],
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;

      const labels = {
        CONNECTIONS: 'connections-1',
        SET_BOUNDS:  'bounds',
      }

      const elements = {
        connections: engine.elements.get(labels.CONNECTIONS),
      };

      const points = {
        bounds: getScreenSet(labels.SET_BOUNDS),
      }

      if (!elements.connections || !points.bounds) return;
      
      const boundsPoints = Array.from(points.bounds);

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const BOUNDS_COUNT = 5;
      const POINTS_PER_BOUNDS = 8;
      const VERTICES_COUNT = 12;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update scan / tracking positions
      for (let i = 0; i < BOUNDS_COUNT; i++) {
        const basePointIndex = i * POINTS_PER_BOUNDS;
        const baseLineIndex = i * VERTICES_COUNT;

        for (let n = 0; n < VERTICES_COUNT; n++) {
          const startIndex = _state.boundsConnections[n][0] || 0;
          const endIndex = _state.boundsConnections[n][1] || 1;
          const start = boundsPoints[basePointIndex + startIndex]?.[1];
          const end = boundsPoints[basePointIndex + endIndex]?.[1];
          const connection = elements.connections.data[baseLineIndex + n];

          // Set initial visibility false
          if (!connection) return;
          connection.visibility = false;

          if (start && end) {
            connection.visibility = start.visible || end.visible;
            connection.position.x = start.x * elements.connections.width;
            connection.position.y = start.y * elements.connections.height;
            connection.size.x = (end.x - start.x) * elements.connections.width;
            connection.size.y = (end.y - start.y) * elements.connections.height;
          }
        }
      }

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {
      _state = {}
    }
  },

  [Scenes.MTGO]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();
      const { smoothedAudio, repeatEvery } = engine.audioManager;

      const labels = {
        POINTS:      'flock-1',
        CONNECTIONS: 'connections-1',
        SET_POINTS:  'points',
        MATRIX:      'matrix-1',
      }

      const elements = {
        connections: engine.elements.get(labels.CONNECTIONS),
      }

      const points = {
        connections: getScreenSet(labels.SET_POINTS)
      }

      if (!elements.connections || !points.connections) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants

      // Computed audio values + MIDI
      const positions = Array.from(points.connections);

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update scan / tracking positions
      positions.forEach(([_, pos], index) => {
        if (!elements.connections) return;

        const target = positions[index + 1] ? positions[index + 1] : positions[0];
        const line = elements.connections.data[index];

        if (!line) return;

        line.position.x = pos.x * elements.connections.width;
        line.position.y = pos.y * elements.connections.height;
        line.size.x = ((target?.[1]?.x || 0) - pos.x) * elements.connections.width;
        line.size.y = ((target?.[1]?.y || 0) - pos.y) * elements.connections.height;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 1 }, () => {
        elements.connections?.data.forEach(item => {
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

      const labels = {
        MATRIX: 'matrix-1',
      };

      const elements = {
        matrix: engine.elements.get(labels.MATRIX),
      }

      if (!elements.matrix) return;

      // Constants
      const dpr = window.devicePixelRatio;
      const cols = matrixRes.x;
      const rows = matrixRes.y;
      const cellW = canvas.width / cols / dpr;
      const cellH = canvas.height / rows / dpr;
      const { style } = elements.matrix.config;

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

      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (!elements.text) return;

        const { config, width, height } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * width,
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 5) * height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (config.content) {
            item.contentOverride = config.content[_state.progress % config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (elements.text.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        elements.text.data.forEach((item) => {
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

      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (!elements.text) return;

        const { config, width, height } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * width,
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 5) * height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (config.content) {
            item.contentOverride = config.content[_state.progress % config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (elements.text.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        elements.text.data.forEach((item) => {
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

      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (!elements.text) return;

        const { config, width, height } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * width,
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 5) * height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (config.content) {
            item.contentOverride = config.content[_state.progress % config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (elements.text.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        elements.text.data.forEach((item) => {
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

      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;
      const labels = {
        TEXT: 'text-1',
      }
      
      const elements = {
        text: engine.elements.get(labels.TEXT),
      };

      if (!elements.text) return;

      // Audio channels

      // Constants
      const BASE_PROGRESS = 25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: 12 }, () => {
        if (!elements.text) return;

        const { config, width, height } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33) * width,
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 5) * height,
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

          // Set extra cells visible (in the same column)
          item.position.x -= 0.1;

          // Change text every beat
          if (config.content) {
            item.contentOverride = config.content[_state.progress % config.content.length]; // Middle row becomes dashes
          }
        })

        _state.progress++;
      })

      // TEST: Update progress manually
      if (_state.isFadingText) {
        const duration = BASE_PROGRESS * (elements.text.data[0]?.contentOverride?.split(' ').length || 4);

        // Stop progress once the fade is complete
        if (_state.fadeProgress >= duration) {
          _state.isFadingText = false
        }

        // Update progress
        elements.text.data.forEach((item) => {
          item.params.progress = _state.fadeProgress / duration;
          item.params.position = _state.textPosition;
        })

        _state.fadeProgress++;
      }
    },
  },

  [Scenes.STAYS_NOWHERE]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();

      const labels = {
        CONNECTIONS:     'connections-1',
        ORIGINS:         'flock-1',
        SET_ORIGINS:     'origins',
        SET_CONNECTIONS: 'connections',
      }

      const elements = {
        connections: engine.elements.get(labels.CONNECTIONS),
        origins: useScene3D().value?.elements.get(labels.ORIGINS),
      }

      const points = {
        origins: getScreenSet(labels.SET_ORIGINS),
        connections: getScreenSet(labels.SET_CONNECTIONS),
      };

      elements.connections?.data.forEach((connection) => {
        connection.visibility = false;
      })

      // Computed audio values + MIDI
      if (!elements.connections || !elements.origins || !points.connections) return;
      
      // --- 2. SHAPE TRANSFORMATIONS ---
      const connectionPoints = Array.from(points.connections);
      
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      elements.connections?.data.forEach((connection) => {
        const connectionPoint = connectionPoints[poolIndex]?.[1];

        if (!connectionPoint || !elements.connections) return;

        const origin = points.origins?.get(connectionPoint.params.originIndex);
        if (!origin?.visible || !connectionPoint.visible) return;
        
        connection.visibility = true;
        connection.position.x = origin.x * elements.connections.width;
        connection.position.y = origin.y * elements.connections.height;
        connection.size.x = connectionPoint.x * elements.connections.width - connection.position.x;
        connection.size.y = connectionPoint.y * elements.connections.height - connection.position.y;

        poolIndex++;
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
      const { screenPositions, getScreenSet, setInstancesScreenPositions, removeInstancesScreenPositions } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;

      const labels = {
        SCANS: 'scan-1',
        NUMBERS: 'text-1',
        CONNECTIONS: 'connections-1',
        ORIGINS: 'origins-1',
        PARTICLES_1: 'flock-1',
        PARTICLES_2: 'flock-2',
        PARTICLES_3: 'flock-3',
        SET_ORIGINS: 'origins',
        SET_CONNECTIONS: 'connections',
      }

      const elements = {
        scans: engine.elements.get(labels.SCANS),
        numbers: engine.elements.get(labels.NUMBERS),
        connections: engine.elements.get(labels.CONNECTIONS),
        origins: engine.elements.get(labels.ORIGINS),
        particles: [
          useScene3D().value?.elements.get(labels.PARTICLES_1),
          useScene3D().value?.elements.get(labels.PARTICLES_2),
          useScene3D().value?.elements.get(labels.PARTICLES_3),
        ]
      };
      
      const points = {
        origins: getScreenSet(labels.SET_ORIGINS),
        connections: getScreenSet(labels.SET_CONNECTIONS),
      }

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const MAX_LINES = 92;

      // Computed audio values + MIDI
      if (screenPositions.size === 0) return;

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Note: The instance tracking logic is handled in /3d/scripts.ts      
      points.origins?.forEach((value, i) => {
        if (!elements.scans || !elements.numbers) return;
        const target = elements.scans.data[i];
        const number = elements.numbers.data[i];

        if (target) {
          target.position.x = value.x * elements.scans.width;
          target.position.y = value.y * elements.scans.height;
        }

        if (number) {
          // Each column displays reset instance ids with 6 digits
          number.contentOverride = _state.resets[i].map((id: number) => {
            return '0'.repeat(6 - id.toString().length) + id.toString();
          })
        }
      })

      let poolIndex = 0;
      points.connections?.forEach((value) => {
        // Connections lines
        if (!elements.scans || !elements.connections) return;
        const connection = elements.connections.data[poolIndex];
        const centerId = [labels.PARTICLES_1, labels.PARTICLES_2, labels.PARTICLES_3].indexOf(value.params.elementId) || 0;
        const center = points.origins?.get(centerId);

        if (connection && center) {
          connection.position.x = center.x * elements.scans.width;
          connection.position.y = center.y * elements.scans.height;
          connection.size.x = value.x * elements.connections.width - connection.position.x;
          connection.size.y = value.y * elements.connections.height - connection.position.y;
        }

        poolIndex++;
      })

      // Store the IDs of instances whose position has been reset
      elements.particles?.forEach((element, i) => {
        if (!_state.resets[i]) return;

        // 1. Adding logic
        if (element?.resetIds.length) {

          for (let id = 0; id < element.resetIds.length; id++) {
            const newId = element.resetIds[id];
            if (newId && newId > 2 && !_state.resets[i].includes(newId)) {
              removeInstancesScreenPositions(labels.SET_CONNECTIONS, element.id, _state.resets[i]);
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
          setInstancesScreenPositions(labels.SET_CONNECTIONS, element.id, _state.resets[i]);
        }
      })

    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {

      const labels = {
        NUMBERS: 'text-1',
      }

      const elements = {
        numbers: engine.elements.get(labels.NUMBERS),
      }

      // Initially text is hidden, assign content override
      elements.numbers?.data.forEach((t) => {
        t.visibility = false;
        t.contentOverride = t.id.toString();
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();

      const labels = {
        NUMBERS:     'text-1',
        GRID_FRONT:  'grid-1',
        GRID_BACK:   'grid-2',
        CONNECTIONS: 'connections-1',
        SET_FRONT:   'connections-front',
        SET_BACK:    'connections-back',
      }

      const elements = {
        grid: useScene3D().value?.elements.get(labels.GRID_FRONT),
        connections: engine.elements.get(labels.CONNECTIONS),
        numbers: engine.elements.get(labels.NUMBERS),
      }

      const points = {
        front: getScreenSet(labels.SET_FRONT),
        back: getScreenSet(labels.SET_BACK),
      }

      if (!elements.connections || !elements.numbers || !points.front || !points.back) return;

      // Audio channels

      // Constants

      // Computed audio values + MIDI
      const connectionsFront = Array.from(points.front);
      const connectionsBack = Array.from(points.back);
      const pointsCount = elements.grid?.config.layout.dimensions?.x || 10;

      // --- 2. SHAPE TRANSFORMATIONS ---
      
      elements.connections.data.forEach(line => {
        line.visibility = false;
      })

      // Update scan / tracking positions
      connectionsFront.forEach(([_, point], index) => {
        if (!elements.connections) return;

        const target = connectionsFront[index + 1]?.[1];
        const line = elements.connections?.data[index];

        if (!target || !line || !target.visible || !point.visible) return;

        line.visibility = true;
        line.position.x = point.x * elements.connections.width;
        line.position.y = point.y * elements.connections.height;
        line.size.x = (target.x - point.x) * elements.connections.width;
        line.size.y = (target.y - point.y) * elements.connections.height;

        // Anchor text label to each point
        const textElement = elements.numbers?.data[index];
        if (!textElement) return;

        textElement.visibility = true;
        textElement.position.x = line.position.x;
        textElement.position.y = line.position.y - 10;
      })

      connectionsBack.forEach(([_, point], index) => {
        if (!elements.connections) return;

        const target = connectionsBack[index + 1]?.[1];
        const line = elements.connections?.data[index + pointsCount];

        if (!target || !line || !target.visible || !point.visible) return;

        line.visibility = true;
        line.position.x = point.x * elements.connections.width;
        line.position.y = point.y * elements.connections.height;
        line.size.x = (target.x - point.x) * elements.connections.width;
        line.size.y = (target.y - point.y) * elements.connections.height;

        // Anchor text label to each point
        const textElement = elements.numbers?.data[index + pointsCount];
        if (!textElement) return;

        textElement.visibility = true;
        textElement.position.x = line.position.x;
        textElement.position.y = line.position.y - 10;

        // Draw connections between front and back
        const connectionTarget = connectionsFront[index]?.[1];
        const connectionLine = elements.connections.data[index + pointsCount * 2];

        if (!connectionTarget || !connectionLine) return;

        // Draw bridge connectionLine between grids
        connectionLine.visibility = true
        connectionLine.position.x = point.x * elements.connections.width;
        connectionLine.position.y = point.y * elements.connections.height;
        connectionLine.size.x = (connectionTarget.x - point.x) * elements.connections.width;
        connectionLine.size.y = (connectionTarget.y - point.y) * elements.connections.height;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      // line visibility
    },
    dispose: () => {

    }
  },

  [Scenes.ZOHO]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;

      const labels = {
        SCANS:      'scan-1',
        TRAILS:     'track-1',
        ORBITS:     'flock-1',
        SET_SCANS:  'scans',
        SET_TRAILS: 'trails',
      }

      const elements = {
        orbits: useScene3D().value?.elements.get(labels.ORBITS),
        scans: engine.elements.get(labels.SCANS),
        trails: engine.elements.get(labels.TRAILS),
      }

      const points = {
        scans: getScreenSet(labels.SET_SCANS),
        trails: getScreenSet(labels.SET_TRAILS),
      }

      if (!elements.scans || !elements.trails || !elements.orbits || !points.scans || points.scans.size === 0) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      // Constants
      const orbitsCount = elements.orbits.data.length || 10;

      // Computed audio values + MIDI
      const harmonyImpact = harmonies.loudness;

      // --- 2. SHAPE TRANSFORMATIONS ---
      // Note: The instance tracking logic is handled in /3d/scripts.ts

      // Update scan positions
      let poolIndex = 0;
      points.scans.forEach(value => {
        if (!elements.scans) return;

        const item = elements.scans.data[poolIndex];

        if (!item || poolIndex >= elements.scans.data.length) return;
        item.position.x = value.x * elements.scans.width;
        item.position.y = value.y * elements.scans.height;

        poolIndex++;
      })

      // Update trail positions
      let trailIndex = 0;

      points.trails?.forEach((value, i) => {
        if (!elements.trails || !points.trails ) return;
        const item = elements.trails.data[trailIndex];

        if (!item || !value.distance || trailIndex >= elements.trails.data.length) return;

        const indexIncr = Math.floor(Math.floor(trailIndex / orbitsCount) / (points.trails.size / orbitsCount / 8)) / 8;

        item.visibility = indexIncr > 1 - harmonyImpact;
        item.position.x = value.x;
        item.position.y = value.y;
        item.scale = indexIncr;

        trailIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---

    },
    dispose: (engine) => {

    }
  }
}
