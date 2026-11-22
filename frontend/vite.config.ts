/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev-only: Laravel API origin for the proxy (override with API_PROXY_TARGET in .env.local).
  const backend = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET || 'http://127.0.0.1:8080'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // changeOrigin: false keeps Origin/Host as localhost:5173 so Sanctum treats
        // requests as stateful (SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173).
        '/api': { target: backend, changeOrigin: false },
        '/sanctum': { target: backend, changeOrigin: false },
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Long-lived vendor chunks: app deploys don't invalidate framework caches.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/, priority: 40 },
              { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/, priority: 30 },
              { name: 'ui', test: /node_modules[\\/](radix-ui|@radix-ui|cmdk|sonner|lucide-react)[\\/]/, priority: 20 },
              { name: 'forms', test: /node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/, priority: 20 },
              { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      restoreMocks: true,
      clearMocks: true,
    },
  }
})
