import { openElement } from '@openelement/adapter-vite';
import { openPropsTokenSheet, registerOpenUi } from '@openelement/ui';
import { defineConfig } from 'vite';

// www/ is an npm-first consumer; local workspace resolution during dev, npm
// tarballs in production. No resolve.alias needed.

// Make token variables available to document-level elements while shadow trees
// continue to inherit them from the document root.
const _rawCSS = [...openPropsTokenSheet.cssRules].map((r) => r.cssText).join('\n');
const rootCSS = _rawCSS
  .replace(/:host\s*\{/g, ':root, :host {')
  .replace(
    /:host\(\[data-theme=["']dark["']\]\),\s*:host-context\(\[data-theme=["']dark["']\]\)\s*\{/g,
    'html[data-theme="dark"], :root[data-theme="dark"], :host([data-theme="dark"]), :host-context([data-theme="dark"]) {',
  )
  .replace(
    /:host\(\[data-theme=["']dark["']\]\)\s*\{/g,
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
  --edge-highlight: color-mix(in srgb, var(--text-primary) 10%, transparent);
  --color-edge-highlight: var(--edge-highlight);
  --color-overlay: var(--overlay);
  --shadow-elevated: var(--shadow-1);
  --border-strong: var(--color-border-strong);
  --nav-bg: var(--bg-base);
  --nav-height: var(--size-16);
  --nav-link-color: var(--text-primary);
  --nav-link-hover: var(--brand-deep);
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
  --edge-highlight: color-mix(in srgb, var(--text-primary) 14%, transparent);
  --color-edge-highlight: var(--edge-highlight);
  --color-overlay: var(--overlay);
  --border-strong: var(--color-border-strong);
  --nav-bg: var(--bg-base);
  --nav-height: var(--size-16);
}
body {
  margin: 0;
  background:
    radial-gradient(circle at 50% -12%, color-mix(in srgb, var(--violet-5) 24%, transparent), transparent 42%),
    linear-gradient(115deg, color-mix(in srgb, var(--violet-1) 38%, transparent), transparent 46%),
    linear-gradient(color-mix(in srgb, var(--border) 34%, transparent) var(--border-size-1), transparent var(--border-size-1)),
    linear-gradient(90deg, color-mix(in srgb, var(--border) 30%, transparent) var(--border-size-1), transparent var(--border-size-1)),
    var(--bg-canvas);
  background-size: auto, auto, 220px 128px, 220px 128px, auto;
  color: var(--text-primary);
  font-family: var(--font-mono);
  line-height: 1.7;
}
::view-transition-old(open-brand-mark),
::view-transition-new(open-brand-mark) { animation-duration: 320ms; animation-timing-function: var(--motion-standard); }
::selection {
  background: var(--brand-subtle);
  color: var(--text-primary);
}`;
const colorTokensStyle =
  `<style>@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:100 800;font-display:swap;src:url('/assets/fonts/jetbrains-mono-latin-variable.woff2') format('woff2')}${rootCSS}body{font-family:'JetBrains Mono',monospace;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}${siteCSS}</style>`;

export default defineConfig({
  resolve: {
    alias: {
      '@openelement/site-ui': new URL('./app/site-ui', import.meta.url).pathname,
    },
  },
  base: '/',
  build: {
    chunkSizeWarningLimit: 600,
  },
  // Keep Vite's automatic JSX transform aligned with the workspace compiler.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@openelement/element',
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
        import: new URL('./app/site-ui/open-layout.tsx', import.meta.url).pathname,
        props: {
          footerText: 'Built with OpenElement — Web Components-native application framework',
          githubUrl: 'https://github.com/open-element/openelement',
        },
      },
      packageIslands: ['@openelement/ui'],
      ssr: {
        noExternal: ['@openelement/ui'],
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
          { src: '/logo-home.js', defer: true },
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
          '<meta property="og:site_name" content="OpenElement">',
          '<meta property="og:type" content="website">',
          '<meta property="og:title" content="OpenElement - The Web, composed.">',
          '<meta property="og:description" content="A Web Components-native, static-first application framework built on Custom Elements, Declarative Shadow DOM and selective islands.">',
          '<meta property="og:url" content="https://openelement.org">',
          '<meta property="og:image" content="https://openelement.org/assets/og-image.svg">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="description" content="OpenElement is a Web Components-native, static-first application framework built on Custom Elements, Declarative Shadow DOM and selective islands.">',
          '<style>html{visibility:visible!important;}body{background:var(--bg-base);color:var(--text-primary);}</style>',
          '<link rel="icon" type="image/svg+xml" href="/assets/open-favicon.svg" />',
          '<link rel="apple-touch-icon" href="/assets/open-avatar.svg" />',
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
            { href: '/docs', label: 'Docs' },
            { href: '/apilist', label: 'API' },
            { href: '/roadmap', label: 'Roadmap' },
            { href: '/blog', label: 'Blog' },
            { href: 'https://github.com/open-element/openelement', label: 'GitHub' },
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
registerOpenUi();
