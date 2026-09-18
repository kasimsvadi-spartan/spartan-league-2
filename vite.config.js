import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Spartan League 2',
        short_name: 'Spartan League',
        description: '9-a-side underarm turf cricket league — points table, schedule, results, leaderboards and records.',
        theme_color: '#0B0B0C',
        background_color: '#0B0B0C',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Static assets (hashed JS/CSS/images): cache-first via Workbox precache — safe
        // because every deploy gives them a new filename, so there's nothing to go stale.
        globPatterns: ['**/*.{js,css,png,jpg,jpeg,webp,ico,svg,woff2}'],
        // The HTML shell is NOT hashed and is what names which JS/CSS files to load, so it
        // must never be served cache-first — that's what let an already-cached tab boot an
        // old bundle and 404 fetching a chunk the newest deploy no longer has. Disable the
        // default precached SPA fallback and let the navigate rule below own it instead.
        navigateFallback: null,
        runtimeCaching: [
          {
            // Navigations (the HTML shell): always prefer a fresh fetch so a reload always
            // gets the deploy that's actually live; fall back to the cached shell only if
            // offline or the network is slow.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-shell',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Season data + storage reads: always prefer a fresh network response so the
            // app never shows stale data when online; fall back to the last-known cached
            // response only if the network is slow or unavailable (offline resilience).
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
