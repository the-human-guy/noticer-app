// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxtjs/ionic', '@nuxt/scripts'],
  ssr: false,
  css: [
    '~/assets/css/froala-editor@4.5.2.min.css',
    // 'https://cdn.jsdelivr.net/npm/froala-editor@4.5.2/css/froala_editor.pkgd.min.css',
  ],
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
  scripts: {
    defaultScriptOptions: {
      bundle: true,
      trigger: 'onNuxtReady',
    },
    globals: {
      froala: {
        src: 'https://cdn.jsdelivr.net/npm/froala-editor@4.5.2/js/froala_editor.pkgd.min.js',
      },
    },
  },
  vite: {
    server: {
      watch: {
        ignored: ['./data-notes/*'],
      },
    },
  },
})
