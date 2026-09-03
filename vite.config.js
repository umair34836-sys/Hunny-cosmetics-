import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves this project from a subpath
  // (https://umair34836-sys.github.io/Hunny-cosmetics-/), not the domain
  // root, so asset URLs need that prefix there — but Firebase Hosting
  // serves from the domain root, where the prefix would break asset URLs.
  // `npm run build:pages` (used by the GitHub Pages workflow) sets
  // GH_PAGES=true; the plain `npm run build` (Firebase Hosting/local)
  // keeps base at '/'.
  base: process.env.GH_PAGES ? '/Hunny-cosmetics-/' : '/',
  plugins: [react()],
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
