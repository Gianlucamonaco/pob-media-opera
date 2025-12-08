import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  css: ['~/assets/css/main.css'],
  plugins: ['~/plugins/ws.client.ts'],
  modules: ['@nuxtjs/google-fonts'],

  googleFonts: {
    families: { "Space Grotesk": [400], "Instrument Serif": [400] },
    display: 'swap',
  },

  devtools: { enabled: true },

  components: true,

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
})
