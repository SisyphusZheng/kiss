#!/usr/bin/env -S deno run -A
/**
 * @openelement/create - Minimal project scaffold for openElement framework.
 *
 * Usage: deno run -A npm:@openelement/create my-app
 *
 * openElement Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 */

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal local logger so the CLI has zero runtime dependency on
// @openelement/core when executed from the npm registry.
const log = {
  error: (message: string) => console.error(message),
};

// Package version resolution
// ADR 0016: Handle both local (workspace file://) and remote (npm registry) execution.
//
// - Local:  read version from workspace deno.json (single source of truth)
// - Remote: query npm Registry API for latest version (zero hardcoding)

const NPM_SCOPE = '@openelement';
const PKG_DIR_MAP: Record<string, string> = {
  core: 'core',
  adapterVite: 'adapter-vite',
  app: 'app',
  content: 'content',
  ui: 'ui',
  signal: 'signal',
  element: 'element',
};

function loadWorkspaceVersion(pkg: string): string {
  const metaUrl = import.meta.url;
  const selfPath = fileURLToPath(new URL('.', metaUrl));
  const dir = PKG_DIR_MAP[pkg] || pkg;
  const wsPath = resolve(selfPath, '..', '..', 'packages', dir, 'deno.json');
  try {
    const version = JSON.parse(Deno.readTextFileSync(wsPath)).version;
    if (!version) throw new Error(`No version found in ${wsPath}`);
    return version;
  } catch (e) {
    throw new Error(
      `Failed to read version for @openelement/${dir} from ${wsPath}. ` +
        `Run this script from the openElement workspace or ensure deno.json is accessible.\n` +
        `Original error: ${e}`,
    );
  }
}

/** Detect whether cli.ts is being run from the openElement workspace. */
function isWorkspace(): boolean {
  try {
    const selfPath = fileURLToPath(new URL('.', import.meta.url));
    Deno.readTextFileSync(resolve(selfPath, '..', '..', 'packages', 'core', 'deno.json'));
    return true;
  } catch {
    return false;
  }
}

/** Fetch the latest version of an npm package from the Registry API. */
async function fetchNpmVersion(pkg: string): Promise<string> {
  const resp = await fetch(`https://registry.npmjs.org/${NPM_SCOPE}/${pkg}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch version for ${NPM_SCOPE}/${pkg} from npm registry (HTTP ${resp.status})`,
    );
  }
  const meta = await resp.json();
  // npm registry response has dist-tags.latest
  const version = meta?.['dist-tags']?.latest;
  if (!version) {
    throw new Error(
      `No version found for ${NPM_SCOPE}/${pkg} in npm registry response`,
    );
  }
  return version;
}

/** Resolve all package versions: local from workspace, remote from npm registry. */
async function resolveVersions(): Promise<Record<string, string>> {
  const keys = Object.keys(PKG_DIR_MAP);
  if (isWorkspace()) {
    // Local: synchronous read from workspace
    const v: Record<string, string> = {};
    for (const k of keys) v[k] = loadWorkspaceVersion(k);
    return v;
  }

  // Remote: fetch all versions from npm in parallel
  console.info('Resolving package versions from npm...');
  const entries = await Promise.all(
    keys.map(async (k) => [k, await fetchNpmVersion(PKG_DIR_MAP[k])]),
  );
  return Object.fromEntries(entries);
}

/** Build the template map with resolved version numbers. */
function buildTemplates(v: Record<string, string>): Record<string, string> {
  return {
    '.gitignore': `dist/
node_modules/
`,
    'public/openelement-mark.svg':
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="openElement mark">
  <rect width="96" height="96" rx="18" fill="#212529"/>
  <path d="M26 58V38l22-13 22 13v20L48 71 26 58Z" fill="none" stroke="#f8f9fa" stroke-width="6" stroke-linejoin="round"/>
  <path d="M36 48h24" stroke="#7cc7ff" stroke-width="6" stroke-linecap="round"/>
</svg>
`,
    'content/blog/welcome.md': `---
title: Welcome
date: 2026-01-01
---

# Welcome

This starter keeps the blog content directory present so the default content
plugin configuration can build immediately.
`,
    'deno.json': `{
  "imports": {
    "@preact/signals-core": "npm:@preact/signals-core@^1.12.1",
    "@deno/vite-plugin": "npm:@deno/vite-plugin",
    "hono": "npm:hono@4.12.23",
    "hono/cors": "npm:hono@4.12.23/cors",
    "hono/logger": "npm:hono@4.12.23/logger",
    "hono/request-id": "npm:hono@4.12.23/request-id",
    "hono/secure-headers": "npm:hono@4.12.23/secure-headers",
    "marked": "npm:marked@15.0.12",
    "@openelement/app": "npm:@openelement/app@^${v.app}",
    "@openelement/adapter-vite": "npm:@openelement/adapter-vite@^${v.adapterVite}",
    "@openelement/core": "npm:@openelement/core@^${v.core}",
    "@openelement/core/jsx-runtime": "npm:@openelement/core@^${v.core}/jsx-runtime",
    "@openelement/element": "npm:@openelement/element@^${v.element}",
    "@openelement/ui": "npm:@openelement/ui@^${v.ui}",
    "vite": "npm:vite@8.0.10"
  },
  "nodeModulesDir": "auto",
  "tasks": {
    "dev": "deno run --config deno.json -A npm:vite",
    "build": "deno run --config deno.json -A npm:@openelement/adapter-vite@^${v.adapterVite}/cli/build",
    "build:ssr": "deno run --config deno.json -A npm:vite build",
    "build:client": "deno run --config deno.json -A npm:@openelement/adapter-vite@^${v.adapterVite}/cli/build-client",
    "build:ssg": "deno run --config deno.json -A npm:@openelement/adapter-vite@^${v.adapterVite}/cli/build-ssg",
    "preview": "deno run --config deno.json -A npm:vite preview"
  },
  "compilerOptions": { "lib": ["ES2022", "DOM", "DOM.Iterable"], "jsx": "react-jsx", "jsxImportSource": "@openelement/core" }
}
`,
    'vite.config.ts': `import { openElement } from '@openelement/adapter-vite';
import { defineConfig } from 'vite';
import deno from '@deno/vite-plugin';

// Design tokens (from Open Props)
const colorTokensStyle =
  '<style>' +
  '--gray-0:#f8f9fa;--gray-1:#f1f3f5;--gray-3:#dee2e6;--gray-5:#adb5bd;--gray-7:#495057;--gray-9:#212529;' +
  '--brand:#534ab7;--size-1:4px;--size-2:8px;--size-3:12px;--size-4:16px;--border-size-1:1px;--radius-2:8px;' +
  '--font-sans:system-ui,-apple-system,sans-serif;--font-size-0:0.875rem;--font-weight-5:500;' +
  '--shadow-1:0 1px 3px 0 rgb(0 0 0 / 0.1);' +
  'body{margin:0;background:var(--gray-1);color:var(--gray-9);font-family:var(--font-sans);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>';

export default defineConfig({
  plugins: [
    // SOP-015: Virtual module passthrough — @deno/vite-plugin doesn't
    // support the "virtual:" scheme. This resolve hook intercepts virtual
    // module IDs before @deno/vite-plugin, letting the openElement plugin handle them.
    { name: 'virtual-passthrough', resolveId(id) { if (id.startsWith('virtual:')) return '\0' + id; }, enforce: 'pre' },
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
  })],
});
`,
    'app/components/app-shell.tsx': `/** @jsxImportSource @openelement/core */
import { defineLayout } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'app-shell';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: block; min-height: 100vh; background: var(--gray-1); }
  header, main, footer { max-width: 860px; margin: 0 auto; padding: 1rem; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-3); }
  footer { color: var(--gray-7); font-size: 0.875rem; border-top: 1px solid var(--gray-3); }
  a { color: var(--brand); text-decoration: none; font-weight: 600; }
\`);

export default defineLayout(tagName, {
  styles,
  render(props: { siteName?: string }) {
    return (
      <>
        <header data-open-layout="app-shell">
          <a href="/">{props.siteName ?? 'openElement'}</a>
          <nav>
            <a href="/freshness">Freshness</a>
            <a href="/api/health">API health</a>
          </nav>
        </header>
        <main>
          <slot></slot>
        </main>
        <footer>Generated by @openelement/create.</footer>
      </>
    );
  },
});
`,
    'app/routes/index.tsx': `/** @jsxImportSource @openelement/core */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'home-page';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
  p { color: var(--text-secondary, #666); }
  img { width: 64px; height: 64px; }
\`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>Hello from openElement!</h1>
        <p>
          Your openElement app is running. Edit <code>app/routes/index.tsx</code> to
          get started.
        </p>
        <img src="/openelement-mark.svg" alt="openElement mark" />
        <my-counter></my-counter>
      </>
    );
  },
});

export default definePage({
  route: { path: '/' },
  head: {
    title: 'My openElement App',
    description: 'Generated openElement starter app',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: false,
  },
  render() {
    return <home-page />;
  },
});
`,
    'app/routes/freshness.tsx': `/** @jsxImportSource @openelement/core */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'freshness-page';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: block; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  p { color: var(--text-secondary, #666); }
\`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>Freshness proof</h1>
        <p>This page records ISR/cache intent with a 300 second revalidate window.</p>
      </>
    );
  },
});

export default definePage({
  route: { path: '/freshness' },
  head: {
    title: 'Freshness proof',
    description: 'Generated openElement ISR intent route',
  },
  renderIntent: {
    mode: 'static',
    streaming: 'auto',
    revalidate: 300,
  },
  render() {
    return <freshness-page />;
  },
});
`,
    'app/routes/api/health.ts': `export default function health() {
  return Response.json({
    ok: true,
    framework: 'openElement',
    route: '/api/health',
  });
}
`,
    'app/islands/my-counter.tsx': `/** @jsxImportSource @openelement/core */
import { defineIsland, defineIslandConfig } from '@openelement/app';
import { signal, StyleSheet } from '@openelement/element';

export const tagName = 'my-counter';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
  button { padding: 0.25rem 0.75rem; cursor: pointer; }
\`);

const count = signal(0);

export default defineIsland(tagName, {
  styles,
  render() {
    return (
      <>
        <button onClick={() => count.value--}>-</button>
        <span>{count.value}</span>
        <button onClick={() => count.value++}>+</button>
      </>
    );
  },
}, { hydrate: openElement.hydrate, dsd: openElement.dsd, ssr: openElement.ssr });
`,
  };
}

async function main() {
  const name = Deno.args[0];
  if (!name || name === '--help' || name === '-h') {
    console.log('Usage: deno run -A npm:@openelement/create <project-name>');
    Deno.exit(name ? 0 : 1);
  }

  // H-14 fix: Validate project name format to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    log.error(
      `Invalid project name: "${name}". Project name must only contain letters, numbers, underscores, and hyphens.`,
    );
    Deno.exit(1);
  }

  const cwd = Deno.cwd();
  const targetDir = resolve(cwd, name);
  const relativeTarget = relative(cwd, targetDir);

  if (
    !relativeTarget ||
    relativeTarget === '..' ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    log.error(
      `Refusing to create project outside the current directory: ${name}`,
    );
    Deno.exit(1);
  }

  try {
    await Deno.stat(targetDir);
    log.error(`Directory "${name}" already exists.`);
    Deno.exit(1);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      log.error(`Failed to inspect target directory "${name}": ${e}`);
      Deno.exit(1);
    }
  }

  // Resolve package versions before generating templates
  const v = await resolveVersions();

  try {
    await Deno.mkdir(targetDir, { recursive: true });
  } catch (e) {
    log.error(`Failed to create directory "${name}": ${e}`);
    Deno.exit(1);
  }

  const TPL = buildTemplates(v);
  for (const [path, content] of Object.entries(TPL)) {
    const fullPath = join(targetDir, path);
    await Deno.mkdir(dirname(fullPath), { recursive: true });
    await Deno.writeTextFile(fullPath, content);
    console.info(`  created ${path}`);
  }

  console.info(`\nopenElement project created at ./${relativeTarget}/`);
  console.info(`\n  cd ${relativeTarget}`);
  console.info('  deno task dev');
}

main();
