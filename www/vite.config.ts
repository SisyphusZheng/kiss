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
    /:host\(\[data-theme="dark"\]\)\s*\{/g,
    'html[data-theme="dark"], :host([data-theme="dark"]) {',
  );
const darkCSS = `
:root,
html[data-theme="dark"],
:host([data-theme="dark"]),
:root[data-theme="dark"] {
  --bg-canvas: #08080a;
  --surface-1: #0d0f12;
  --surface-2: #16191d;
  --surface-3: #212529;
  --text-primary: #e9ecef;
  --text-secondary: #adb5bd;
  --text-muted: #868e96;
  --color-brand: #4263eb;
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.10);
  --edge-highlight: rgba(255, 255, 255, 0.08);
  --shadow-1: none;
}
body {
  background: var(--bg-canvas, #08080a);
  color: var(--text-primary, #e9ecef);
}

/* Light mode override -- theme toggle adds [data-theme="light"] to html */
[data-theme="light"] {
  --bg-canvas: #f8f9fa;
  --surface-1: #ffffff;
  --surface-2: #f1f3f5;
  --surface-3: #e9ecef;
  --text-primary: #12131a;
  --text-secondary: #626676;
  --text-muted: #8e92a2;
  --color-brand: #4263eb;
  --border: rgba(18, 19, 26, 0.08);
  --border-hover: rgba(18, 19, 26, 0.12);
  --edge-highlight: rgba(255, 255, 255, 0.5);
}
[data-theme="light"] body {
  background: var(--bg-canvas, #f8f9fa);
}
[data-theme="light"] .app-header {
  background: rgba(255,255,255,0.88);
}
[data-theme="light"] .app-footer {
  border-top-color: rgba(18,19,26,0.12);
}
[data-theme="light"] .docs-sidebar {
  border-right-color: rgba(18,19,26,0.12);
}
[data-theme="light"] .header-nav a {
  color: #626676;
}
[data-theme="light"] .header-nav a:hover {
  color: #12131a;
}
::selection {
  background: rgba(66,99,235,0.3);
  color: #FFFFFF;
}`;
const colorTokensStyle =
  `<style>${rootCSS}body{margin:0;background:var(--bg-canvas, #08080a);color:var(--text-primary, #e9ecef);font-family:'Inter',-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}${darkCSS}</style>`;

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
        themeColor: '#040508',
        backgroundColor: '#040508',
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
          '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />',
          '<meta property="og:site_name" content="openElement">',
          '<meta property="og:type" content="website">',
          '<meta property="og:title" content="openElement - The Open Element">',
          '<meta property="og:description" content="DSD-first Web Standards framework. Zero-runtime core, SSG + Island architecture, microsecond Signal reactivity.">',
          '<meta property="og:url" content="https://openelement.org">',
          '<meta property="og:image" content="https://openelement.org/assets/og-image.svg">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="description" content="openElement - The Open Element. DSD-first Web Standards framework with SSG, islands, and Web Components.">',
          '<style>html{visibility:visible!important;}body{background:#040508;color:#fff;}</style>',
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
            { href: '/registry', label: 'Hub' },
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
