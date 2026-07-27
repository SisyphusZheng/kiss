/**
 * Minimal openElement app proving request-time rendering (0.42.0-alpha.1):
 * routes with renderIntent: { mode: 'dynamic' } are excluded from prerendering
 * and served per-request through dist/server/index.js.
 *
 * No client-script workaround: the generated request-time server entry injects
 * the island client entry into request-time HTML itself (framework fix), so
 * islands hydrate here exactly like on prerendered pages.
 */
import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@openelement/element',
  },
  plugins: [
    ...openElement({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      // No app shell: the fixture stays minimal and does not pull @openelement/ui.
      appShell: false,
      html: {
        title: 'request-time fixture',
      },
    }),
  ],
});
