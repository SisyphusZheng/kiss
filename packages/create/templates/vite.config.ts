import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';

// Design tokens (from Open Props)
const colorTokensStyle =
  '<style>--gray-0:#f8f9fa;--gray-1:#f1f3f5;--gray-3:#dee2e6;--gray-5:#adb5bd;--gray-7:#495057;--gray-9:#212529;--brand:#534ab7;--size-1:4px;--size-2:8px;--size-3:12px;--size-4:16px;--border-size-1:1px;--radius-2:8px;--font-sans:system-ui,-apple-system,sans-serif;--font-size-0:0.875rem;--font-weight-5:500;--shadow-1:0 1px 3px 0 rgb(0 0 0 / 0.1);body{margin:0;background:var(--gray-1);color:var(--gray-9);font-family:var(--font-sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>';

export default defineConfig({
  plugins: [
    // SOP-015: Virtual module passthrough — @deno/vite-plugin doesn't
    // support the "virtual:" scheme. This resolve hook intercepts virtual
    // module IDs before @deno/vite-plugin, letting the openElement plugin handle them.
    {
      name: 'virtual-passthrough',
      resolveId(id) {
        if (id.startsWith('virtual:')) return '\0' + id;
      },
      enforce: 'pre',
    },
    deno(),
    openElement({
      html: { title: 'My openElement App' },
      appShell: {
        tagName: 'app-shell',
        import: './app/components/app-shell.tsx',
        props: {
          siteName: 'My openElement App',
        },
      },
      // Use pre-built UI components from @openelement/ui
      // (npm distributes compiled JS - no decorator errors)
      packageIslands: ['@openelement/ui'],
      // SSR must bundle @openelement/ui (decorators need compilation)
      ssr: {
        noExternal: ['@openelement/ui'],
      },
      inject: {
        headFragments: [
          // Design tokens - DRY: values from @openelement/ui/open-props-tokens.ts
          colorTokensStyle,
        ],
      },
      // Blog + Navigation + Sitemap (from @openelement/content)
      content: {
        blog: {
          contentDir: 'content/blog',
          basePath: '/blog',
        },
        nav: {
          routesDir: 'app/routes',
          headerNav: [
            { href: '/', label: 'Home' },
            { href: '/blog', label: 'Blog' },
          ],
        },
      },
    }),
  ],
});
