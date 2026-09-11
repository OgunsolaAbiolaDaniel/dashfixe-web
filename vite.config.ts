/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { handleApi } from './src/server/handlers'

/**
 * The pilot API inside `npm run dev`: the same shared handlers Vercel runs in
 * production (api/[...path].ts), mounted as middleware so the app is fully
 * functional locally with zero secrets. See docs/ARCHITECTURE.md §6.
 */
function pilotApi(): Plugin {
  return {
    name: 'dashfixe-pilot-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const raw = Buffer.concat(chunks).toString()
        let body: unknown = null
        if (raw) {
          try {
            body = JSON.parse(raw)
          } catch {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end('{"error":"bad_json"}')
            return
          }
        }
        const out = await handleApi({
          method: req.method ?? 'GET',
          path: req.url.split('?')[0]!,
          body,
          cookieHeader: req.headers.cookie,
        })
        if (out.setCookie) res.setHeader('set-cookie', out.setCookie)
        res.setHeader('content-type', 'application/json')
        res.statusCode = out.status
        res.end(JSON.stringify(out.body))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pilotApi()],
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
