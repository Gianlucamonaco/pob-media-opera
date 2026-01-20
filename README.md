# Physics of Beauty - Media Opera

A modular, audio-reactive visual engine built on **Nuxt 3** and **Three.js**.  
Designed for Physics of Beauty live performances.

## ✨ Features

- **Hybrid Rendering:** Parallel Three.js (3D) and Canvas (2D) layers.
- **Scene Bridge:** 3D-to-2D projection allows 2D UI to "track" 3D objects in real-time.
- **Audio Engine:** WebSocket-based audio analysis with built-in smoothing and beat detection.
- **Modular Architecture:** Decoupled *Layouts* (Geometry) from *Scripts* (Animation).
- **Control Systems:** MIDI and Keyboard mapping support.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- An audio source (Ableton Live / Microphone) bridging to the WebSocket server.

Note: In the live performance, Ableton sends data via UDP on port `8001` using specific plugins.
Running the app without the specific file will 

Please check `docs/AUDIO.md` for details on audio management. (COMING SOON)

### Installation

1. **Clone the repository**
```bash
git clone [https://github.com/yourname/project.git](https://github.com/yourname/project.git)
cd project
```

2. Make sure to install dependencies:

```bash
# yarn
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# start frontend only
yarn run dev

# start frontend and node.js server for websocket
yarn run start-all
```

## Debugging

The app has a debug version for

Append `?debug=true` to show UI for debugging.



## 📂 Project Structure
`composables/scene`: The core engine logic.

- `3d/`: Three.js scene management and render loops.

- `2d/`: Canvas 2D overlay management.

- `bridge.ts`: The communication layer between 3D space and 2D screenspace.

`composables/audio`: Interpolation and beat detection logic.

`data/`: Configuration files.

- `scene3DConfig.ts`: Defines shapes, layouts, and materials for each scene.

- `sceneList.ts`: Defines acts and scene order.


## 🎨 Creating a New Scene
1. **Define the Layout**: Add a new entry to `data/scene3DConfig.ts`.

```ts
[Scenes.NEW_SCENE]: {
  camera: { x: 0, y: 0, z: 100 },
  elements: [
    { 
      id: 'my-grid',
      shape: ShapeType.RECTANGLES,
      layout: { type: LayoutType.GRID, dimensions: { x: 10, y: 10, z: 1 } }
    }
  ]
}
```

2. **Add Logic**: Create a script in `composables/scene/3d/scripts.ts` to animate it.

```ts
[Scenes.NEW_SCENE]: {
  update: (engine, time) => {
    const grid = engine.getElement('grid-01');
    // Animate based on audio...
  }
}
```

## 🤝 Contributing
Pull requests are welcome! Please check `docs/ARCHITECTURE.md` for details on the render pipeline.

## 📄 License
MIT

