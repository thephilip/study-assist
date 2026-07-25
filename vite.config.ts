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

export default defineConfig({
  base: '/study-assist/',
  plugins: [
    react(),
    studioIndexHtml(),
    VitePWA({
      // The /studio deployment on vividledger.art is a feature of that site,
      // not a second installable app — no service worker or manifest there.
      disable: process.env.STUDIO === '1',
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
