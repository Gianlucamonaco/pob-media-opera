import { chance, mapClamp, random, randomInt } from "~/composables/utils/math";
import { useSceneBridge } from "~/composables/scene/bridge";
import { ChannelNames, DrawModes, Fonts, Palette, Scenes, TextAligns, VerticalAligns } from "~/data/constants";
import type { Scene2DScript } from "~/data/types";
import { elementIds } from "~/data/sceneLabels";
import { useSceneManager } from "../manager";
import { midiState } from "~/composables/controls/MIDI";

let _state = {} as any;
let _input = {} as any;

export const scene2DScripts: Partial<Record<Scenes, Scene2DScript>> = {
  [Scenes.ASFAY]: {
    init: (engine) => {
      _state = {}

      const elements = { coords: engine.elements.get(elementIds.TEXT) }
      
      // Hide all coords
      elements.coords?.data.forEach(item => item.visibility = false)
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();

      const elements = {
        coords: engine.elements.get(elementIds.TEXT),
        grid: useSceneManager().scene3D.value?.elements.get(elementIds.GRID),
      }

      const points = {
        coords: getScreenSet(elementIds.SET_TEXT),
      }

      // Audio channels

      // Constants

      // Computed audio values + MIDI

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

        element.position.x = point.x;
        element.position.y = point.y;
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
        drawMode: DrawModes.SEGMENT,
        activeSegments: [],
      }

      const elements = { connections: engine.elements.get(elementIds.CONNECTIONS) }

      // Hide all connections
      elements.connections?.data.forEach(item => item.visibility = false)
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { getScreenSet } = useSceneBridge();
      const { repeatEvery, currentBar } = engine.audioManager;

      const elements = {
        connections: engine.elements.get(elementIds.CONNECTIONS),
      }

      const points = {
        connections: getScreenSet(elementIds.SET_CONNECTIONS),
      }

      if (!points.connections) return;

      // Hide all elements when track ends
      if (ended) {
        elements.connections?.data.forEach(connection => connection.visibility = false);
        return;
      }

      // Get current connection points
      const connectionPoints = Array.from(points.connections);

      // Audio channels

      // Constants
      const FRAME_INTERVAL = Math.floor(time / 60);
      const INTRO_BARS = 16;
      const RANDOM_SEGMENT_CHANCE = 0.25;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Clear to prevent "ghost" shapes from freezing on screen
      elements.connections?.data.forEach(connection => connection.visibility = false);

      // Update scan / tracking positions
      connectionPoints.forEach(([_, point], index) => {
        const target = connectionPoints[index + 1];
        const line = elements.connections?.data[index];
        const endPoint = target?.[1];

        if (!line || !endPoint) return;

        line.position.x = point.x;
        line.position.y = point.y;
        line.size.x = endPoint.x - point.x;
        line.size.y = endPoint.y - point.y;

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
        if (currentBar() < INTRO_BARS) return;

        _state.drawMode = random([DrawModes.PATH, DrawModes.RANDOM, DrawModes.SEGMENT]);

        if (_state.drawMode == DrawModes.RANDOM) {
          _state.activeSegments = Array(connectionPoints.length).fill(null).map(_ => chance(RANDOM_SEGMENT_CHANCE))
        }
      })
    },
  },

  [Scenes.CONFINE]: {
    init: (engine) => {
      const elements = { dataLines: engine.elements.get(elementIds.LINES) }

      // Hide all data lines
      elements.dataLines?.data.forEach(item => item.visibility = false)
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getSceneData, getScreenSet } = useSceneBridge();
      const { repeatEvery } = engine.audioManager;

      const elements = {
        dataLines: engine.elements.get(elementIds.LINES),
        connections: engine.elements.get(elementIds.CONNECTIONS),
        scans: engine.elements.get(elementIds.SCANS),
        centers: useSceneManager().scene3D.value?.elements.get(elementIds.MAIN),
      }

      const points = {
        center: getScreenSet(elementIds.SET_CENTERS),
        scans: getScreenSet(elementIds.SET_SCANS),
      }

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 1500 };
      const SCALE_RANGE = { min: 0.5, max: 1 };

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Clear to prevent "ghost" shapes from freezing on screen
      elements.scans?.data.forEach(item => item.visibility = false);
      elements.connections?.data.forEach(item => item.visibility = false);

      if (!points.center?.size || !points.scans?.size) return;
      
      // Get center point
      const center = Array.from(points.center)[0]?.[1];

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      Array.from(points.scans)?.forEach(([_, point]) => {
        const connection = elements.connections?.data[poolIndex];
        const scan = elements.scans?.data[poolIndex];

        if (!center || !center?.visible || !point?.visible || !point.distance) return;

        // Draw connection lines
        if (connection && elements.connections) {
          connection.visibility = true;
          connection.position.x = center.x;
          connection.position.y = center.y;
          connection.size.x = point.x - center.x;
          connection.size.y = point.y - center.y;
        }

        // Draw scan element
        if (scan && elements.scans) {
          const scaleIncr = mapClamp(point.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

          scan.visibility = true;
          scan.position.x = point.x;
          scan.position.y = point.y;
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

      const elements = {
        scans: engine.elements.get(elementIds.SCANS),
      }

      const points = {
        scans: getScreenSet(elementIds.SET_SCANS),
      }

      // Audio channels

      // Constants
      const DISTANCE_RANGE = { min: 100, max: 750 };
      const SCALE_RANGE = { min: 0.15, max: 1.5 };

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Prevent "ghost" shapes from freezing on screen
      elements.scans?.data.forEach(item => item.visibility = false);

      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      points.scans?.forEach(value => {
        if (!elements.scans) return;

        const scan = elements.scans.data[poolIndex];
        if (!scan || !value.distance || poolIndex >= elements.scans.data.length) return;

        const scaleIncr = mapClamp(value.distance, DISTANCE_RANGE.max, DISTANCE_RANGE.min, SCALE_RANGE.min, SCALE_RANGE.max);

        scan.visibility = true;
        scan.position.x = value.x;
        scan.position.y = value.y;
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

      const elements = {
        scans: engine.elements.get(elementIds.SCANS),
        labels: engine.elements.get(elementIds.TEXT),
      };

      const points = {
        scans: getScreenSet(elementIds.SET_SCANS),
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

        const w = Math.abs(value.x - value.left) * 2.2;
        const h = Math.abs(value.top - value.y) * 2.2;

        item.visibility = true;
        item.position.x = value.x;
        item.position.y = value.y;
        item.size.x = w;
        item.size.y = h;

        const label = elements.labels.data[poolIndex];
        if (!label) return;

        label.visibility = true;
        label.contentOverride = Math.round(value.distance || 0)?.toString();

        label.position.x = value.x - item.size.x / 2;
        label.position.y = value.y - item.size.y / 2;
        label.size.x = w;
        label.size.y = h;
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

      const elements = {
        connections: engine.elements.get(elementIds.CONNECTIONS),
      };

      const points = {
        bounds: getScreenSet(elementIds.SET_CONNECTIONS),
      }

      if (!elements.connections || !points.bounds) return;
      
      const boundsPoints = Array.from(points.bounds);

      // Audio channels

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
          const point = boundsPoints[basePointIndex + startIndex]?.[1];
          const endPoint = boundsPoints[basePointIndex + endIndex]?.[1];
          const connection = elements.connections.data[baseLineIndex + n];

          // Set initial visibility false
          if (!connection) return;
          connection.visibility = false;

          if (point?.visible && endPoint?.visible) {
            connection.visibility = point.visible || endPoint.visible;
            connection.position.x = point.x;
            connection.position.y = point.y;
            connection.size.x = endPoint.x - point.x;
            connection.size.y = endPoint.y - point.y;
          }
        }
      }

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {}
    }
  },

  [Scenes.MTGO]: {
    init: (engine) => {
      _state = {
        drawMode: DrawModes.NONE,
      }
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getScreenSet } = useSceneBridge();
      const { smoothedAudio, repeatEvery, currentBar } = engine.audioManager;
      const { knob5, knob6 } = midiState.knobs;

      const elements = {
        connections: engine.elements.get(elementIds.CONNECTIONS),
      }

      const points = {
        connections: getScreenSet(elementIds.SET_CONNECTIONS)
      }

      if (!elements.connections || !points.connections) return;

      // Audio channels
      const woodwinds = smoothedAudio[ChannelNames.WOODWINDS]!;
      const brass = smoothedAudio[ChannelNames.BRASS]!;
      const keys = smoothedAudio[ChannelNames.KEYS]!;

      _input = {
        visibilityFactor1: woodwinds.pitch,
        visibilityFactor2: brass.loudness,
        visibilityFactor3: keys.pitch,
        visibilityFactor4: knob5,
        chanceFactor1: woodwinds.loudness,
        chanceFactor2: brass.loudness,
        chanceFactor3: keys.loudness,
        chanceFactor4: knob6,
     }

      // Constants
      const NEW_MODE_CHANCE = 0.5;
      const VISIBILITY_THRESHOLD = 0.2;
      const INTRO_BARS = 2;

      const visibilityFactor = Math.max(_input.visibilityFactor1, _input.visibilityFactor2, _input.visibilityFactor3, _input.visibilityFactor4);
      const visibilityChance = Math.max(_input.chanceFactor1, _input.chanceFactor2, _input.chanceFactor3, _input.chanceFactor4);
      const isIntro = currentBar() < INTRO_BARS;

      // Computed audio values + MIDI
      const positions = Array.from(points.connections);

      // --- 2. SHAPE TRANSFORMATIONS ---

      // Update scan / tracking positions
      positions.forEach(([_, point], index) => {
        if (!elements.connections) return;

        const target = positions[index + 1] ? positions[index + 1] : positions[0];
        const line = elements.connections.data[index];
        const endPoint = target?.[1];

        if (!line || !endPoint) return;

        line.position.x = point.x;
        line.position.y = point.y;
        line.size.x = endPoint.x - point.x;
        line.size.y = endPoint.y - point.y;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      // Alternate connection visibility
      repeatEvery({ beats: 1 }, () => {
        elements.connections?.data.forEach(item => {
          // Hide all connections
          if (_state.drawMode == DrawModes.NONE) {
            item.visibility = false;
          }

          // Alternate visibility
          else if (chance(visibilityChance)) {
            item.visibility = !item.visibility;
          }
        })
      })

      // Alternate draw modes
      repeatEvery({ beats: 2 }, () => {
        if (isIntro) return;

        // Hide all connections if channel below threshold
        if (visibilityFactor < VISIBILITY_THRESHOLD) {
          _state.drawMode = DrawModes.NONE;
          engine.matrixMode = false;
        }

        // Switch randomly between connections and matrix
        else if (chance(NEW_MODE_CHANCE)) {
          _state.drawMode = random([DrawModes.PATH, DrawModes.MATRIX]);
          engine.matrixMode = _state.drawMode === DrawModes.MATRIX;
        }
      })
    },
    renderMatrix: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ctx, canvas, matrix, matrixRes } = engine;

      const elements = {
        matrix: engine.elements.get(elementIds.TEXT),
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

      _state = {};
      _input = {};
    }
  },

  [Scenes.SISTEMA]: {
    init: (engine) => {
      _state = {
        progress: 0,
        fadeProgress: 0,
        isFadingText: false,
        textPosition: { x: 0, y: 0 },
      };

      const elements = { text: engine.elements.get(elementIds.TEXT) };

      elements.text?.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
      };

      if (!elements.text) return;

      // Audio channels

      // Constants
      const INTRO_BARS = 12;
      const BEATS_PER_BAR = 10;
      const BASE_PROGRESS = 25;

      const lineBeats = BEATS_PER_BAR * 2;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      repeatEvery({ beats: lineBeats }, () => {
        if (!elements.text) return;

        const { config } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;
          _state.textPosition = {
            x: random(0, 0.33),
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 3),
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

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
          item.params.width = elements.text?.width;
          item.params.height = elements.text?.height;
        })

        _state.fadeProgress++;
      }
    },
    dispose: () => {
      _state = {};
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

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
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

        const { config } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;
          _state.textPosition = {
            x: random(0, 0.33),
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 3),
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

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
          item.params.width = elements.text?.width;
          item.params.height = elements.text?.height;
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

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
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

        const { config } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;
          _state.textPosition = {
            x: random(0, 0.33),
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 3),
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

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
          item.params.width = elements.text?.width;
          item.params.height = elements.text?.height;
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

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
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

        const { config } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33),
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 3),
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

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
          item.params.width = elements.text?.width;
          item.params.height = elements.text?.height;
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

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
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

        const { config } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;

          _state.textPosition = {
            x: random(0, 0.33),
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 3),
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

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
          item.params.width = elements.text?.width;
          item.params.height = elements.text?.height;
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

      const elements = {
        connections: engine.elements.get(elementIds.CONNECTIONS),
        origins: useSceneManager().scene3D.value?.elements.get(elementIds.MAIN),
      }

      const points = {
        origins: getScreenSet(elementIds.SET_CENTERS),
        connections: getScreenSet(elementIds.SET_CONNECTIONS),
      };

      // Prevent "ghost" elements from freezing on screen.
      elements.connections?.data.forEach((connection) => { connection.visibility = false })

      // Computed audio values + MIDI
      if (!elements.connections || !elements.origins || !points.connections) return;
      
      // --- 2. SHAPE TRANSFORMATIONS ---
      const connectionPoints = Array.from(points.connections);
      
      // Note: The instance tracking logic is handled in /3d/scripts.ts
      let poolIndex = 0;
      elements.connections.data.forEach((connection) => {
        const endPoint = connectionPoints[poolIndex]?.[1];

        if (!endPoint || !elements.connections) return;

        const startPoint = points.origins?.get(endPoint.params.originIndex);
        if (!startPoint?.visible || !endPoint.visible) return;
        
        connection.visibility = true;
        connection.position.x = startPoint.x;
        connection.position.y = startPoint.y;
        connection.size.x = endPoint.x - startPoint.x;
        connection.size.y = endPoint.y - startPoint.y;

        poolIndex++;
      })
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.STRANGE_ATTRACTOR]: {
    init: (engine) => {
      _state = {
        progress: 0,
        fadeProgress: 0,
        isFadingText: false,
        textPosition: { x: 0, y: 0 },
      };

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
      };

      if (!elements.text) return;

      elements.text.data.forEach((item) => {
        item.params = {};
      })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { repeatEvery } = engine.audioManager;

      const elements = {
        text: engine.elements.get(elementIds.TEXT),
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

        const { config } = elements.text;
        if (config.content && _state.progress >= config.content.length) return;

        elements.text.data.forEach((item, i) => {

          // Reset fade progress
          _state.isFadingText = true;
          _state.fadeProgress = 0;
          _state.textPosition = {
            x: random(0, 0.33),
            y: (config.layout.spacing?.y || 0.1) * (_state.progress % 3),
          },

          // Set current cell visible (progressive row + random col)
          item.visibility = true;

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
          item.params.width = elements.text?.width;
          item.params.height = elements.text?.height;
        })

        _state.fadeProgress++;
      }
    },
    dispose: () => {
      _state = {};
    }
  },

  [Scenes.TUFTEEE]: {
    init: (engine) => {
      const elements = { coords: engine.elements.get(elementIds.TEXT) }

      elements.coords?.data.forEach(item => { item.visibility = false })
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { getSceneData } = useSceneBridge();

      const elements = {
        coords: engine.elements.get(elementIds.TEXT),
      }

      if (!elements.coords) return;

      // Audio channels

      // Constants

      // Computed audio values + MIDI
      const points = {
        coords: getSceneData(elementIds.SET_TEXT),
      }

      // --- 2. SHAPE TRANSFORMATIONS ---
      points.coords?.forEach((item: { visibility: boolean, text: string}, index: number) => {
        if (!elements.coords) return;

        const element = elements.coords.data[index];
        if (!element) return;

        // Hide the coords of the corresponding 3D rect which is not currently visible
        element.visibility = item.visibility;
        element.contentOverride = item.text;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {

    }
  },

  [Scenes.USBTEC]: {
    init: (engine) => {

    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { screenPositions, getScreenSet, getSceneData } = useSceneBridge();
      const { currentBar } = engine.audioManager;

      const elements = {
        scans: engine.elements.get(elementIds.SCANS),
        numbers: engine.elements.get(elementIds.TEXT),
        connections: engine.elements.get(elementIds.CONNECTIONS),
        particles: [
          useSceneManager().scene3D.value?.elements.get(elementIds.PARTICLES),
          useSceneManager().scene3D.value?.elements.get(elementIds.PARTICLES_2),
          useSceneManager().scene3D.value?.elements.get(elementIds.PARTICLES_3),
        ]
      };
      
      const points = {
        origins: getScreenSet(elementIds.SET_CENTERS),
        connections: getScreenSet(elementIds.SET_CONNECTIONS),
      }

      // Hide all elements when track ends
      if (ended) {
        elements.connections?.data.forEach(item => item.visibility = false);
        elements.numbers?.data.forEach(item => item.visibility = false);
        return;
      }

      // Audio channels
      
      // Constants
      const maxConnections = Math.floor(currentBar() / 2);
      const connectionSets = elements.particles.map((_, i) => getSceneData(i.toString())) 
      
      if (screenPositions.size === 0) return;
  

      // Computed audio values + MIDI
      
      // --- 2. SHAPE TRANSFORMATIONS ---

      // Note: The instance tracking logic is handled in /3d/scripts.ts      
      points.origins?.forEach((value, i) => {
        if (!elements.scans || !elements.numbers) return;
        const target = elements.scans.data[i];
        const number = elements.numbers.data[i];

        if (target) {
          target.position.x = value.x;
          target.position.y = value.y;
        }

        if (number) {
          // Each column displays relative instance ids with 6 digits
          number.contentOverride = connectionSets[i]?.map((id: number) => (
            '0'.repeat(6 - id.toString().length) + id.toString())
          );
        }
      })

      let poolIndex = 0;
      
      // Loop through connectionSets
      connectionSets.forEach((connectionSet, setIndex) => {
        connectionSet.forEach((connectionId: number, i: number) => {
          if (!elements.scans || !elements.connections || !points.connections || i > maxConnections / connectionSets.length) return;
          const point = points.connections.get(connectionId)

          if (!point) return;
          
          const connection = elements.connections.data[poolIndex];
          const center = points.origins?.get(setIndex);
  
          if (connection && center) {
            connection.position.x = center.x;
            connection.position.y = center.y;
            connection.size.x = point.x - connection.position.x;
            connection.size.y = point.y - connection.position.y;
          }
  
          poolIndex++;
        })
      })
    },
    dispose: () => {

    }
  },

  [Scenes.ZENO]: {
    init: (engine) => {
      _state = {
        visibilityIndices: [],
      }

      const elements = {
        numbers: engine.elements.get(elementIds.TEXT),
      }

      // Initially text is hidden, assign content override
      elements.numbers?.data.forEach((t) => {
        t.visibility = false;
        t.contentOverride = t.id.toString();
      })

      _state.visibilityIndices = Array(elements.numbers?.data.length).fill(null).map(_ => true);
    },
    update: (engine, time) => {
      // --- 1. DATA & INPUT ---
      const { ended } = useSceneState().value;
      const { getScreenSet } = useSceneBridge();
      const { smoothedAudio } = engine.audioManager;

      const elements = {
        grid: useSceneManager().scene3D.value?.elements.get(elementIds.GRID),
        connections: engine.elements.get(elementIds.CONNECTIONS),
        numbers: engine.elements.get(elementIds.TEXT),
      }

      const points = {
        front: getScreenSet(elementIds.SET_CONNECTIONS),
        back: getScreenSet(elementIds.SET_CONNECTIONS_2),
      }

      if (!elements.connections || !elements.numbers || !elements.grid || !points.front || !points.back) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;
      const drums = smoothedAudio[ChannelNames.PB_CH_1_DRUMS]!;

      _input = {
        visibilityFactor1: harmonies.loudness,
        visibilityFactor2: drums.loudness,
        visibilityChance: drums.onOff,
      }

      // Constants
      const VISIBILITY_THRESHOLD = 0.1;
      const TOGGLE_CHANCE = 0.2;

      const visibilityFactor = _input.visibilityFactor1 + _input.visibilityFactor2;
      const visibilityChance = _input.visibilityChance;
      const connectionsFront = Array.from(points.front);
      const connectionsBack = Array.from(points.back);
      const pointsCount = elements.grid.config.layout.dimensions?.x || 10;
      const vh = elements.numbers?.height || 800;

      // Computed audio values + MIDI

      // --- 2. SHAPE TRANSFORMATIONS ---
      elements.connections.data.forEach(line => { line.visibility = false })
      elements.numbers.data.forEach(number => { number.visibility = false })

      if (visibilityFactor < VISIBILITY_THRESHOLD || ended) return;

      // Update scan / tracking positions
      connectionsFront.forEach(([_, point], index) => {
        if (!elements.connections) return;
        const target = connectionsFront[index + 1];
        const line = elements.connections?.data[index];
        const endPoint = target?.[1];

        if (!line || !endPoint?.visible || !point.visible) return;

        line.visibility = _state.visibilityIndices[index];
        line.position.x = point.x;
        line.position.y = point.y;
        line.size.x = endPoint.x - point.x;
        line.size.y = endPoint.y - point.y;

        // Anchor text label to each point
        const textElement = elements.numbers?.data[index];
        if (!textElement) return;

        textElement.visibility = _state.visibilityIndices[index];
        textElement.position.x = line.position.x;
        textElement.position.y = line.position.y - 10 / vh; // offset by 10 so doesn't overlap the point
      })

      connectionsBack.forEach(([_, point], index) => {
        if (!elements.connections) return;
        const target = connectionsBack[index + 1];
        const line = elements.connections?.data[index + pointsCount];
        const endPoint = target?.[1];

        if (!line || !endPoint?.visible || !point.visible) return;

        line.visibility = _state.visibilityIndices[index];
        line.position.x = point.x;
        line.position.y = point.y;
        line.size.x = endPoint.x - point.x;
        line.size.y = endPoint.y - point.y;

        // Anchor text label to each point
        const textElement = elements.numbers?.data[index + pointsCount];
        if (!textElement) return;

        textElement.visibility = _state.visibilityIndices[index];
        textElement.position.x = line.position.x;
        textElement.position.y = (line.position.y * vh - 10) / vh; // offset by 10 so doesn't overlap the point

        // Draw connections between front and back
        const connectionTarget = connectionsFront[index];
        const connectionLine = elements.connections.data[index + pointsCount * 2];
        const connectionPoint = connectionTarget?.[1]

        if (!connectionPoint?.visible || !connectionLine) return;

        // Draw bridge connectionLine between grids
        connectionLine.visibility = _state.visibilityIndices[index]
        connectionLine.position.x = point.x;
        connectionLine.position.y = point.y;
        connectionLine.size.x = connectionPoint.x - point.x;
        connectionLine.size.y = connectionPoint.y - point.y;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
      if (visibilityChance) {
        _state.visibilityIndices.forEach((value: boolean, i: number) => {
          if (chance(TOGGLE_CHANCE)) _state.visibilityIndices[i] = !value;
        });
      }
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

      const elements = {
        orbits: useSceneManager().scene3D.value?.elements.get(elementIds.MAIN),
        scans: engine.elements.get(elementIds.SCANS),
        trails: engine.elements.get(elementIds.TRAILS),
      }

      const points = {
        scans: getScreenSet(elementIds.SET_SCANS),
        trails: getScreenSet(elementIds.SET_TRAILS),
      }

      // Prevent element freezing
      elements.scans?.data.forEach((item) => item.visibility = false )
      // elements.trails?.data.forEach((item) => item.visibility = false )

      if (!elements.scans || !elements.trails || !elements.orbits || !points.scans || points.scans.size === 0) return;

      // Audio channels
      const harmonies = smoothedAudio[ChannelNames.PB_CH_3_HARMONIES]!;

      _input = {
        trailLengthFactor: 1,
      }

      // Constants
      
      // Computed audio values + MIDI
      const orbitsCount = elements.orbits.data.length || 10;
      const tracksCount = elements.trails.data.length || 10;
      const trailLength = _input.trailLengthFactor * (tracksCount / orbitsCount) || 1; // Not implemented yet

      // --- 2. SHAPE TRANSFORMATIONS ---
      // Note: The instance tracking logic is handled in /3d/scripts.ts

      // Update scan positions
      let scanIndex = 0;
      points.scans.forEach(value => {
        if (!elements.scans) return;

        const item = elements.scans.data[scanIndex];

        if (!item || scanIndex >= elements.scans.data.length) return;
        item.visibility = true;
        item.position.x = value.x;
        item.position.y = value.y;

        scanIndex++;
      })

      // Update trail positions
      let poolIndex = 0;
      points.trails?.forEach((value, i) => {
        if (!elements.trails || !points.trails ) return;
        const item = elements.trails.data[poolIndex];

        if (!item || !value.distance || poolIndex >= elements.trails.data.length) return;

        item.visibility = !!points.scans?.get(value.params.trailId);
        item.position.x = value.x / elements.trails.width; // value.x is from 0 to vw, so needs to be normalised
        item.position.y = value.y / elements.trails.height; // value.y is from 0 to vh, so needs to be normalised

        poolIndex++;
      })

      // --- 3. MUSICAL EVENTS & TRIGGERS ---
    },
    dispose: () => {
      _state = {};
      _input = {};
    }
  }
}
