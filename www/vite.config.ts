import { openElement } from '@openelement/app/vite';
import { openPropsTokenSheet } from '@openelement/ui';
import { defineConfig } from 'vite';

// www/ is a pure JSR consumer - no resolve.alias needed.
// The root deno.json workspace mapping resolves jsr:@openelement/* -> local
// packages/ during dev, and JSR tarballs in production.

// v0.20.0: migrated from lessRootColorCSS (deleted) to openPropsTokenSheet.
// v0.23.0: :host rules don't apply in global CSS context. Replace :host with
//   :root so CSS custom properties (--gray-*, --text-*, --bg-*, etc.) are
//   available to regular DOM elements outside shadow trees. Shadow DOM still
//   inherits these from :root per CSS spec.
const _rawCSS = [...openPropsTokenSheet.cssRules].map((r) => r.cssText).join('\n');
const rootCSS = _rawCSS
  .replace(/:host\s*\{/g, ':root, :host {')
  .replace(
    /:host\(\[data-theme="dark"\]\),\s*:host-context\(\[data-theme="dark"\]\)\s*\{/g,
    'html[data-theme="dark"], :root[data-theme="dark"], :host([data-theme="dark"]), :host-context([data-theme="dark"]) {',
  )
  .replace(
    /:host\(\[data-theme="dark"\]\)\s*\{/g,
    'html[data-theme="dark"], :root[data-theme="dark"], :host([data-theme="dark"]) {',
  );
const siteCSS = `
:root,
html[data-theme="light"],
:host([data-theme="light"]),
:root[data-theme="light"] {
  --bg-canvas: var(--bg-base);
  --surface-1: var(--bg-elevated);
  --surface-2: var(--bg-surface);
  --surface-3: var(--bg-hover);
  --surface-code: var(--bg-code);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-light: var(--brand-light);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-info: var(--info);
  --color-border: var(--border);
  --color-border-hover: var(--border-hover);
  --color-border-strong: color-mix(in srgb, var(--border) 68%, var(--text-primary));
  --edge-highlight: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
  --color-edge-highlight: var(--edge-highlight);
  --color-overlay: var(--overlay);
  --shadow-elevated: var(--shadow-1);
  --border-strong: var(--color-border-strong);
  --nav-bg: color-mix(in srgb, var(--bg-base) 88%, transparent);
  --nav-height: var(--size-16);
  --nav-link-color: var(--text-secondary);
  --nav-link-hover: var(--text-primary);
  --font-size-button: var(--font-size-0);
  --font-size-body-sm: var(--font-size-0);
  --font-size-caption: var(--font-size-00);
  --font-weight-medium: var(--font-weight-5);
  --font-weight-semibold: var(--font-weight-7);
}
html[data-theme="dark"],
:host([data-theme="dark"]),
:root[data-theme="dark"] {
  --bg-canvas: var(--bg-base);
  --surface-1: var(--bg-elevated);
  --surface-2: var(--bg-surface);
  --surface-3: var(--bg-hover);
  --surface-code: var(--bg-code);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-light: var(--brand-light);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-error: var(--error);
  --color-info: var(--info);
  --color-border: var(--border);
  --color-border-hover: var(--border-hover);
  --color-border-strong: color-mix(in srgb, var(--border) 72%, var(--text-primary));
  --edge-highlight: color-mix(in srgb, var(--bg-elevated) 18%, transparent);
  --color-edge-highlight: var(--edge-highlight);
  --color-overlay: var(--overlay);
  --border-strong: var(--color-border-strong);
  --nav-bg: color-mix(in srgb, var(--bg-base) 88%, transparent);
  --nav-height: var(--size-16);
}
body {
  margin: 0;
  background:
    linear-gradient(color-mix(in srgb, var(--border) 36%, transparent) var(--border-size-1), transparent var(--border-size-1)),
    linear-gradient(90deg, color-mix(in srgb, var(--border) 36%, transparent) var(--border-size-1), transparent var(--border-size-1)),
    var(--bg-canvas);
  background-size: var(--size-8) var(--size-8), var(--size-8) var(--size-8), auto;
  color: var(--text-primary);
}
::selection {
  background: var(--brand-subtle);
  color: var(--text-primary);
}`;
const colorTokensStyle =
  `<style>${rootCSS}body{font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}${siteCSS}</style>`;

export default defineConfig({
  base: '/',
  build: {
    chunkSizeWarningLimit: 600,
  },
  // v0.24.1 (ADR-0057): Configure esbuild JSX transform to use openElement automatic runtime.
  // Must match root deno.json compilerOptions.jsx / jsxImportSource.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@openelement/core',
  },
  plugins: [
    openElement({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      html: {
        title: 'openElement',
      },
      appShell: {
        tagName: 'open-layout',
        import: '@openelement/ui/open-layout',
        props: {
          logoText: 'openElement',
          footerText: 'Built with openElement Framework - The Open Element for Web Components',
          githubUrl: 'https://github.com/open-element/openelement',
        },
      },
      packageIslands: ['@openelement/ui'],
      ssr: {
        noExternal: ['@openelement/ui'],
      },
      pwa: {
        name: 'openElement Framework',
        shortName: 'openElement',
        themeColor: '#f6f8fb',
        backgroundColor: '#f6f8fb',
      },
      viewTransition: true,
      speculation: true,
      inject: {
        // H-05 fix: Use structured stylesheets with SRI for CDN CSS
        stylesheets: [
          {
            href: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css',
            integrity: 'sha384-rCCjoCPCsizaAAYVoz1Q0CmCTvnctK0JkfCSjx7IIxexTBg+uCKtFYycedUjMyA2',
          },
        ],
        // H-04 fix: All CDN scripts now have SRI integrity hashes
        scripts: [
          { src: '/theme-init.js' },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
            defer: true,
            integrity: 'sha384-06z5D//U/xpvxZHuUz92xBvq3DqBBFi7Up53HRrbV7Jlv7Yvh/MZ7oenfUe9iCEt',
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js',
            defer: true,
            integrity: 'sha384-D44bgYYKvaiDh4cOGlj1dbSDpSctn2FSUj118HZGmZEShZcO2v//Q5vvhNy206pp',
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js',
            defer: true,
            integrity: 'sha384-PeOqKNW/piETaCg8rqKFy+Pm6KEk7e36/5YZE5XO/OaFdO+/Aw3O8qZ9qDPKVUgx',
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js',
            defer: true,
            integrity: 'sha384-RhrmFFMb0ZCHImjFMpR/UE3VEtIVTCtNrtKQqXCzqXZNJala02N3UbVhi+qzw3CY',
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js',
            defer: true,
            integrity: 'sha384-9WmlN8ABpoFSSHvBGGjhvB3E/D8UkNB9HpLJjBQFC2VSQsM1odiQDv4NbEo+7l15',
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js',
            defer: true,
            integrity: 'sha384-0mV13Neu0xhJFylI+HV43C+XiR13bGSeL7D0/7e6hK7sJgvyvK6HVjeQwmvXTstY',
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js',
            defer: true,
            integrity: 'sha384-HkMr0bZB9kBW4iVtXn6nd35kO/L/dQtkkUBkL9swzTEDMdIe5ExJChVDSnC79aNA',
          },
          { src: '/prism-init.js', defer: true },
          {
            src: 'https://gc.zgo.at/count.js',
            async: true,
            integrity: 'sha384-2UjvVpptg4JlEVgJI2PdscrjOjPcil/4F1ZvIMJ81CShQnEDSlPI+l4PfogvTLYi',
            attrs: { 'data-goatcounter': 'https://openelement.goatcounter.com/count' },
          },
        ],
        headFragments: [
          '<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />',
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
          '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />',
          '<meta property="og:site_name" content="openElement">',
          '<meta property="og:type" content="website">',
          '<meta property="og:title" content="openElement - The Open Element">',
          '<meta property="og:description" content="DSD-first Web Standards framework. Zero-runtime core, SSG + Island architecture, microsecond Signal reactivity.">',
          '<meta property="og:url" content="https://openelement.org">',
          '<meta property="og:image" content="https://openelement.org/assets/og-image.svg">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="description" content="openElement - The Open Element. DSD-first Web Standards framework with SSG, islands, and Web Components.">',
          '<style>html{visibility:visible!important;}body{background:var(--bg-base);color:var(--text-primary);}</style>',
          '<link rel="icon" type="image/svg+xml" href="/assets/open-favicon.svg" />',
          '<link rel="apple-touch-icon" href="/assets/open-logo.svg" />',
          colorTokensStyle,
        ],
      },
      content: {
        blog: {
          contentDir: 'content/blog',
          basePath: '/blog',
        },
        nav: {
          routesDir: 'app/routes',
          // Minimal headerNav; open-layout auto-filters sidebar.
          // v0.31 UI-shell debt: derive this from route meta scanning.
          headerNav: [
            { href: '/guide/getting-started', label: 'Guide' },
            { href: '/apilist', label: 'API' },
            { href: '/architecture/architecture', label: 'Architecture' },
            { href: '/blog', label: 'Blog' },
            { href: '/roadmap', label: 'Roadmap' },
          ],
        },
        sitemap: {
          hostname: 'https://openelement.org',
        },
      },
      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },
    }),
  ],
});
