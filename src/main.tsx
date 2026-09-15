import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { preloadRoute } from './routePages'

// The first page's chunk before the first render (its pre-rendered HTML already
// modulepreloads it), so it paints straight away instead of through a Suspense
// fallback. A failed fetch still renders: the page retries, or the error screen shows.
void preloadRoute(window.location.pathname)
  .catch(() => {})
  .then(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
