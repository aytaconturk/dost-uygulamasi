import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DOST Okuma Asistanı',
        short_name: 'DOST',
        description: 'Okuma Asistanı Uygulaması',
        theme_color: '#512DA8',
        background_color: '#f8f8ff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
