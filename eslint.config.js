import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // The map code-split (docs/ARCHITECTURE.md §7): one direct import of a map module
  // anywhere drags ~800 kB of MapLibre back into the entry chunk. Go through
  // components/map/lazy.tsx instead.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/map/**', 'src/components/explore/LiveMap.tsx', 'src/components/job/TrackMap.tsx', 'src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'maplibre-gl', message: 'Map code is lazy — use components/map/lazy.tsx.' }],
          patterns: [
            {
              group: ['**/explore/LiveMap', '**/job/TrackMap', '**/map/kit'],
              message: 'Map code is lazy — import { LiveMap, TrackMap } from components/map/lazy.tsx.',
            },
          ],
        },
      ],
    },
  },
])
