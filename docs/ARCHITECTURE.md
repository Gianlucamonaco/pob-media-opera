# Architecture Overview

This project is a real-time visual engine that orchestrates 3D graphics (Three.js), 2D overlays (Canvas API), and reactive audio data (WebSocket).

Unlike standard Three.js boilerplates, this engine is built on a **decoupled architecture** where "Layout" (Data) is separate from "Behavior" (Scripts).

## 1. The Core Loop (The Heartbeat)
The engine runs on a strict frame-by-frame execution order to ensure synchronization between audio, physics, and screen overlays.

The `Scene3D.update()` loop follows this specific sequence:

1. **Audio Interpolation:** Raw socket data is smoothed (LERP) to prevent visual jitter.

2. **Physics Update:** Elements move according to their persistent trajectory (e.g., a tunnel flowing forward).

  - *Self-Correction:* Wrapping logic keeps infinite grids within bounds.

  - *State Reset:* The "Render Position" is reset to the "Physics Position."

3. **Script Execution:** The active scene script runs.

  - *Deformation:* Audio data modifies the "Render Position" (transient).

  - *Logic:* Triggers events based on musical measures.

4. **The Bridge:** 3D positions are projected to 2D screen coordinates.

5. **Draw Calls:**

  - 3D Matrices are updated on the GPU.

  - 2D Canvas reads the Bridge data and draws HUD/UI overlays.

## 2. The "Physics" vs. "Render" State
A key concept in this engine is the separation of Permanent State and Visual State. This prevents audio reactivity from permanently distorting the geometry.

- `position` **(Physics)**: Where the object actually is in the world. This is persistent. If a grid moves z + 1 every frame, this value accumulates.

- `renderPosition` **(Visual)**: Where the object appears this frame. This is reset every frame to match position, then modified by audio scripts.

**Example:**
  If a bass drum hits, we might add `+10` to `renderPosition.y`. The object jumps visually. Next frame, `renderPosition` resets to `position`, so the object snaps back down automatically. The physics flow is never interrupted.

## 3. The Scene Bridge (3D to 2D)
To allow 2D text and UI elements to "follow" 3D objects, we use a **Spatial Bridge**.

1. Project: The 3D engine calculates the screen coordinates (`x, y`) and depth (`distance`) of specific instances using `vector.project(camera)`.

2. Publish: These coordinates are stored in a reactive store (`useSceneBridge`).

3. Subscribe: The 2D engine's `TRACK` layout reads these coordinates to position text or shapes.

## 4. The Data Model
Scenes are defined in two parts:

**A. Configuration** `(data/scene3DConfig.ts)`
Defines the **Static Truth** of the scene.

- Shape: What geometry to use (Rectangle, Circle, etc.).

- Layout: How to arrange it (Grid, Sphere, Spiral).

- Style: Colors, sizing, and material properties.

**B. Scripts** `(composables/scene/3d/scripts.ts)`
Defines the **Dynamic Behavior**.

**Update Loop:** Access elements by ID (app.getElement('grid')).

**Audio Reactivity:** Map `smoothedAudio` channels to visual parameters.

## 5. Audio System
The engine treats audio as a continuous stream rather than discrete events.

- **Smoothing:** Incoming data (every ~150ms) is interpolated toward a target value every frame (16ms).

- **Beat Detection:** The `audioManager` tracks musical time, allowing scripts to trigger events "every 2 measures" or "on the 3rd beat."
