import { reactive } from 'vue';
import { ChannelNames } from '~/data/constants';

export default defineNuxtPlugin((nuxtApp) => {
  // Create reactive store for 4 channels
  const channels = reactive({
    [ChannelNames.CH_1_DRUMS]:     { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.CH_2_BASS]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.CH_3_HARMONIES]: { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.CH_4_TEXTURE]:   { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_TRP]:       { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_TRP2]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_HORN]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_TRB]:       { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_TRB2]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_AS_FLUTE]:  { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_TS_CL]:     { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_BS_BCL]:    { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_BASS]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_KEYS]:      { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_BD]:        { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_SN]:        { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
    [ChannelNames.LIVE_OH]:        { pitch: 0, loudness: 0, centroid: 0, flatness: 0, onset: 0, midi: 0 },
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
