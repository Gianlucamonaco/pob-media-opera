import { reactive } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
  // Create reactive store for 4 channels
  const channels = reactive({
    1: 0,
    2: 0,
    3: 0,
    4: 0
  }) as any;

  // Only run WebSocket in the browser
  if (process.client) {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.channel && typeof data.value === "number") {
          channels[data.channel] = data.value;
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };
  }

  nuxtApp.provide("wsAudio", channels)
});
