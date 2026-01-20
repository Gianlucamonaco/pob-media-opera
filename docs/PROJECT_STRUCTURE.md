
## Project structure

```
assets/
|– css/
|   |– main.css

components/
|– canvas/
|   |– scene2D.vue 
|   |– scene3D.vue
|
|– debug/
|   |– Camera.vue
|   |– Channel.vue
|   |– Channels.vue
|   |– Controls.vue
|   |– Master.vue
|   |– Metadata.vue
|   |– Scenes.vue
|
|– ui/
|   |– Box.vue

composables/
|– audio/
|   |– manager.ts          // Processes audio signal received via WebSocket
|
|– controls/
|   |– keyboard.ts         // Handles keyboard events
|   |– MIDI.ts             // Handles MIDI controller events
|   |– manager.ts          // Coordinates all hardware inputs
|
|– scene/
|   |– 2d/
|   |   |– index.ts        // The Canvas API overlay core
|   |   |– scripts.ts      // Defines the 2D dynamic behavior of each scen
|   |– 3d/
|   |   |– index.ts        // The Three.js engine core
|   |   |– scripts.ts      // Defines the 3D dynamic behavior of each scene
|   |– camera/
|   |   |– controller.ts   // Controls camera events
|   |– bridge.ts           // Controls camera events 
|   |– manager.ts          // Coordinates the active 2D and 3D scenes
|
|– shapes/
|   |– 2d/
|   |   |– element.ts      // Initialises and renders 2D shapes
|   |   |– layout.ts       // Generates and transforms 2D layouts as pure data
|   |– 3d/
|   |   |– shaders/
|   |   |   |– circles.glsl.ts
|   |   |– element.ts      // Initialises and renders 3D instances
|   |   |– layout.ts       // Generates and transforms 3D layouts as pure data
|
|– utils/
|   |– array.ts
|   |– canvas.ts
|   |– math.ts
|   |– string.ts
|   |– three.ts
|
|– state.ts

data/
|– constants.ts
|– scene2DConfig.ts        // Defines the 3D static layout of each scene
|– scene3DConfig.ts        // Defines the 2D static layout of each scene 
|– sceneList.ts            // Defines the order of the scenes
|– strings.ts
|– types.ts

pages/
|– index.vue

public/
|– robots.txt

server/
|– bridge.js               // Connects Ableton (UDP) to the Client via WebSocket

app.vue
nuxt.config.ts
package.json
README.md

```