/**
 * Reference fullstack starter (#983): OpenElement app shell + DSD-first SSR,
 * deployed through the Nitro cloudflare_module output. The notes route
 * renders at request time (session-aware); the home page is prerendered.
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
      appShell: {
        tagName: 'ref-layout',
        import: new URL('./app/shell.tsx', import.meta.url).pathname,
      },
      html: {
        title: 'OpenElement × Supabase × Cloudflare reference',
      },
    }),
  ],
});
