# Audio Reactive System

The visual engine is driven by real-time audio analysis data streamed from **Ableton Live**.
This document outlines the data pipeline, the message protocol, and how the frontend handles synchronization.

## 📡 The Pipeline

Data travels from the DAW to the browser in three steps:

1.  **Source (Ableton Live):** The [SP-tools](https://github.com/rconstanzo/SP-tools) Max for Live devices analyze audio features on individual tracks.
2.  **Transport (UDP):** Analysis data is broadcast via UDP on port **8001**.
3.  **Bridge (Node.js):** The `server/bridge.js` script receives UDP packets and forwards them to the frontend via WebSocket.
4.  **Client (Nuxt):** The `useAudioManager` composable receives, parses, and interpolates the data.

## 🎛️ Setup & Requirements

1.  **Ableton Live 12**  
2.  **SP-tools:** Install the Max for Live devices from [rconstanzo/SP-tools](https://github.com/rconstanzo/SP-tools).
3.  **Configuration:**
    - Place `SP-Send` devices on the tracks you wish to visualize.
    - Ensure the UDP output is set to **port 8001**.
    - **Rate:** Data is sent approximately every **250ms** (only if values change).

## 📊 Data Protocol

The system expects a JSON array of channel objects.

### Channel Mapping
- **Channels 1–15:** Individual Audio Tracks.
- **Channel 16 (Master):** Global transport and timing data.

### 1. Track Data (Channels 1–15)
Each track sends spectral analysis data normalized between `0.0` and `1.0`.

```json
{
  "loudness": 0.85,  // Amplitude / Volume
  "pitch": 0.42,     // Dominant pitch
  "flatness": 0.12,  // Noisiness vs. Tonality
  "centroid": 0.65,  // Spectral Brightness
  "onOff": 1         // Gate / Trigger state
}
```

### 2. Master Data (Channel 16)
Used for synchronization and scene switching.

```json
{
  "scene": 2,          // Current Ableton Scene index (triggers visual scene change)
  "tempo": 120.0,      // Current BPM
  "beat": 1.0,         // Current beat position (1, 2, 3, 4...)
  "elapsedTime": 4500  // Ms since playback start
}
```

### 🔄 Interpolation & Timing
Since data arrives at a low refresh rate (~4Hz / 250ms) but the visual engine runs at 60Hz (16ms), direct mapping would cause "steppy" or jerky visuals.

**The Smoothing Algorithm**
The `useAudioManager` composable applies Linear Interpolation (LERP) to bridge the gap.

- **Raw Data**: Stored in `$wsAudio` (Updates sparsely).

- **Smoothed Data**: Stored in `smoothedAudio` (Updates every frame).

**Factor Control**: The interpolation speed (smoothFactor) determines the "responsiveness":

- 0.1 = Slow, fluid movement (organic).

- 0.5 = Snappy, tight movement (rhythmic).

**Beat Detection & Triggers**
Because the beat value is continuous (e.g., 1.0, 1.25, 1.99), we implement a state watcher to trigger events exactly once per musical beat.

**Usage in Scripts:**

```ts
// Example: Trigger an event every 2 beats with an offset of 1
engine.audioManager.repeatEvery({ beats: 2, offset: 1 }, () => {
  // This runs exactly once when the condition is met
  updateVisibility();
});
```