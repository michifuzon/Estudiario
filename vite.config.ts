import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-16x16.png', 'icons/favicon-32x32.png'],
      manifest: {
        id: '/',
        name: 'Estudiario',
        short_name: 'Estudiario',
        description:
          'Organizador académico personal: materias, calendario, apuntes y plan de estudio.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f5f2ec',
        theme_color: '#355c7d',
        lang: 'es-AR',
        icons: [
          { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/icons/'),
            handler: 'CacheFirst',
            options: { cacheName: 'estudiario-icons' },
          },
        ],
      },
      devOptions: {
        // El service worker queda desactivado en `npm run dev`: mientras
        // iteramos íconos/estilos no queremos ninguna capa de cache
        // (CacheFirst por pathname ignora query strings de cache-busting).
        // Se activa solo en el build de producción, que es donde importa
        // el uso offline real. Para probar offline localmente: `npm run build && npm run preview`.
        enabled: false,
        type: 'module',
      },
    }),
  ],
})
