import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages serves this project from a subpath
  // (https://umair34836-sys.github.io/Hunny-cosmetics-/), not the domain
  // root, so asset URLs need that prefix there — but Firebase Hosting
  // serves from the domain root, where the prefix would break asset URLs.
  // `npm run build:pages` (used by the GitHub Pages workflow) sets
  // GH_PAGES=true; the plain `npm run build` (Firebase Hosting/local)
  // keeps base at '/'.
  base: process.env.GH_PAGES ? '/Hunny-cosmetics-/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Hunny Cosmetics — Inventory & Billing',
        short_name: 'Hunny Cosmetics',
        description: 'Inventory, billing, and sales for Hunny Cosmetics.',
        theme_color: '#DB2777',
        background_color: '#FDF2F8',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell only — Firestore's own SDK (with
        // persistent local cache, see src/firebase.js) handles offline
        // data, so API calls are deliberately left out of this cache.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
