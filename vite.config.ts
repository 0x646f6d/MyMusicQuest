/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app under /MyMusicQuest/
const base = '/MyMusicQuest/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MyMusicQuest',
        short_name: 'MusicQuest',
        description: 'Musik-Rate-Spiel für zwei Teams – ordne Lieder nach Jahr ein.',
        lang: 'de',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'landscape',
        background_color: '#14121f',
        theme_color: '#14121f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // never cache Spotify API / auth calls
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
