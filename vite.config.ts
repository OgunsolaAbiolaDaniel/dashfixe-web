/// <reference types="vitest/config" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import { handleApi } from './src/server/handlers'
import { indexablePaths, pageMeta, renderHead, robotsTxt, sitemapXml } from './src/seo'

/**
 * The pilot API inside `npm run dev` AND `vite preview`: the same shared handlers
 * Vercel runs in production (api/router.ts), mounted as middleware so the app is
 * fully functional locally with zero secrets — and so the smoke tests can drive the
 * built app end to end. See docs/ARCHITECTURE.md §6.
 */
const apiMiddleware: Connect.NextHandleFunction = async (req, res, next) => {
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
}

function pilotApi(): Plugin {
  return {
    name: 'dashfixe-pilot-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware)
    },
  }
}

/**
 * SEO at build time (src/seo.ts): a static index.html per public route with its
 * own title/description/canonical/Open Graph tags, plus sitemap.xml and robots.txt.
 * Vercel serves a real file before the SPA rewrite, so /trade/plumbing ships its
 * own preview card to crawlers that never run JavaScript.
 */
function seoPages(siteUrl: string, launched: boolean): Plugin {
  let root = process.cwd()
  return {
    name: 'dashfixe-seo-pages',
    apply: 'build',
    configResolved(config) {
      root = config.root
    },
    // writeBundle, not closeBundle: MapLibre's worker is its own sub-build and
    // closes first, before the main bundle has written index.html. Only the
    // bundle that actually contains the page gets the heads.
    writeBundle(options, bundle) {
      if (!('index.html' in bundle)) return
      const outDir = resolve(root, options.dir ?? 'dist')
      const shell = readFileSync(join(outDir, 'index.html'), 'utf8')
      const paths = indexablePaths(launched)
      for (const path of paths) {
        // `/trade/plumbing` → trade/plumbing.html: Vercel's cleanUrls (vercel.json)
        // and Vite preview's HTML fallback both resolve that without a trailing slash;
        // a directory index would only match `/trade/plumbing/`.
        const file = path === '/' ? join(outDir, 'index.html') : join(outDir, `${path.slice(1)}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, renderHead(shell, pageMeta(path, 'EN'), siteUrl))
      }
      writeFileSync(join(outDir, 'sitemap.xml'), sitemapXml(siteUrl, paths, new Date().toISOString().slice(0, 10)))
      writeFileSync(join(outDir, 'robots.txt'), robotsTxt(siteUrl))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Absolute URLs for canonical/og tags: SITE_URL when the domain is set, else
  // Vercel's production hostname, else the local preview.
  const siteUrl = (
    env.SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4173')
  ).replace(/\/+$/, '')

  return {
    plugins: [react(), pilotApi(), seoPages(siteUrl, env.VITE_LAUNCHED === 'true')],
    // Listen on IPv4 and IPv6: Node 24 binds `localhost` to ::1 only, which Chrome
    // then refuses when it tries 127.0.0.1.
    server: { host: true },
    // MapLibre's tile worker is an ES module (see components/map/kit.ts). Keep the
    // package out of dep pre-bundling and emit workers as ES modules so
    // `?worker&url` resolves in both dev and the production build.
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
  }
})
