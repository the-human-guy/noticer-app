// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/ionic'],
  ssr: false,
  ionic: {
    css: {
      utilities: true,
    },
    config: {},
  },
  runtimeConfig: {
    notesDir: process.env.NOTES_DIR || './data-notes',
    public: {
      notesDir: process.env.NOTES_DIR || './data-notes',
    },
  },
})
