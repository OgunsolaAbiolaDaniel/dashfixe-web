/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Listen on IPv4 and IPv6: Node 24 binds `localhost` to ::1 only, which Chrome
  // then refuses when it tries 127.0.0.1.
  server: { host: true },
  // MapLibre's tile worker is an ES module (see LiveMap.tsx). Keep the package out of
  // dep pre-bundling and emit workers as ES modules so `?worker&url` resolves in both
  // dev and the production build.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { reporter: ['text', 'html'], include: ['src/**/*.{ts,tsx}'] },
  },
})
