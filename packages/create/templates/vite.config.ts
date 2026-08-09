import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';

// Design tokens (from Open Props) plus the global baseline. `--brand` must
// stay aligned with the ui package tokens (`--violet-6` in
// packages/ui/src/open-props-tokens.css). Pages render inside declarative
// shadow DOM, so document-level class rules would not reach them — keep
// component styles in each page's StyleSheet; only tokens and the body
// baseline belong here (custom properties inherit through shadow roots).
const globalStyle =
  '<style>:root{--paper:#faf9f6;--ink:#1c1b17;--ink-2:#5b594f;--line:#e5e2d8;--gray-0:#f8f9fa;--gray-1:#f1f3f5;--gray-3:#dee2e6;--gray-5:#adb5bd;--gray-7:#495057;--gray-9:#212529;--brand:#8262db;--brand-2:#4f8ef7;--size-1:4px;--size-2:8px;--size-3:12px;--size-4:16px;--border-size-1:1px;--radius-2:8px;--radius-3:14px;--font-sans:system-ui,-apple-system,sans-serif;--font-serif:ui-serif,Georgia,"Times New Roman",serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,monospace;--font-size-0:0.875rem;--font-weight-5:500;--shadow-1:0 1px 3px 0 rgb(0 0 0 / 0.08);--shadow-2:0 10px 28px rgb(80 70 160 / 0.12)}' +
  'body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}' +
  '::selection{background:#8262db2e}' +
  '</style>';

export default defineConfig({
  plugins: [
    openElement({
      html: { title: 'My openElement App' },
      appShell: {
        tagName: 'app-shell',
        import: './app/components/app-shell.tsx',
        props: {
          siteName: 'My openElement App',
        },
      },
      inject: {
        headFragments: [
          globalStyle,
        ],
      },
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
    deno(),
  ],
});
