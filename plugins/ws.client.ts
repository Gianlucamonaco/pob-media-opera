import { reactive } from 'vue';
import { ChannelNames } from '~/data/constants';

export default defineNuxtPlugin((nuxtApp) => {
  // Create reactive store for 4 channels
  const channels = reactive({
    [ChannelNames.PB_CH_1_DRUMS]:     { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.PB_CH_2_BASS]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.PB_CH_3_HARMONIES]: { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.PB_CH_4_TEXTURE]:   { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.BRASS]:             { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.WOODWINDS]:         { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.BD]:                { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.SN]:                { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.OH]:                { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.DRUMS_MIDI]:        { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.BASS]:              { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.KEYS]:              { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.KEYS_MIDI]:         { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_FX]:           { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.MASTER_CTRL]:       { beat: 0, elapsedTime: 0, tempo: 120, scene: null },
  }) as any;

  // Only run WebSocket in the browser
  if (process.client) {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.channel) {
          channels[data.channel].pitch    = data.pitch
          channels[data.channel].loudness = data.loudness
          channels[data.channel].centroid = data.centroid
          channels[data.channel].flatness = data.flatness
          channels[data.channel].onset    = data.onset
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };
  }

  nuxtApp.provide("wsAudio", channels)
});
