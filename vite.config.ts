import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// Studio builds (vividledger.art/studio) are not installable apps: drop the
// manifest link and Apple home-screen tags that would advertise one. The title
// goes too — inside VividLedger this is their Studio, not a second brand.
function studioIndexHtml(): Plugin {
  return {
    name: 'studio-index-html',
    transformIndexHtml(html) {
      if (process.env.STUDIO !== '1') return html
      return html
        .split('\n')
        .filter(l => !/rel="manifest"|apple-mobile-web-app|apple-touch-icon/.test(l))
        .join('\n')
        .replace(/<title>.*<\/title>/, '<title>Studio — VividLedger</title>')
    },
  }
}

// Native (Capacitor) builds load their assets off the local filesystem, so the
// base has to be relative. Studio passes its own --base on the CLI.
const native = process.env.NATIVE === '1'

export default defineConfig({
  base: native ? '' : '/study-assist/',
  define: {
    // The paid Play Store build skips brand/feature gating. Defined in every
    // build so the check constant-folds and the dead branch is tree-shaken.
    'import.meta.env.VITE_PAID_BUILD': JSON.stringify(native ? 'true' : 'false'),
  },
  plugins: [
    react(),
    studioIndexHtml(),
    VitePWA({
      // The /studio deployment on vividledger.art is a feature of that site,
      // not a second installable app — no service worker or manifest there.
      // Native builds already bundle their assets; a service worker there
      // would only ever check an origin that never has an update.
      disable: process.env.STUDIO === '1' || native,
      registerType: 'prompt',
      manifest: false, // we maintain our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'], // webp: the sample reference photo
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
