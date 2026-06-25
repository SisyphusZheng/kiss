#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net --allow-sys
/**
 * alpha.3 smoke: verify mature third-party Web Components can be consumed
 * directly inside an openElement app.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const PROJECT_NAME = 'third-party-wc-smoke-app';

const THIRD_PARTY_IMPORTS = {
  lit: 'npm:lit@3.3.3',
  '@shoelace-style/shoelace': 'npm:@shoelace-style/shoelace@2.20.1',
  '@shoelace-style/shoelace/': 'npm:@shoelace-style/shoelace@2.20.1/',
  '@material/web': 'npm:@material/web@2.4.1',
  '@material/web/': 'npm:@material/web@2.4.1/',
};

function fileUrl(path: string): string {
  return pathToFileURL(path).href;
}

function vitePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function packageExportEntries(pkgDir: string, packageName: string): Array<[string, string]> {
  const denoJson = JSON.parse(
    Deno.readTextFileSync(join(repoRoot, 'packages', pkgDir, 'deno.json')),
  );
  const exportsField = denoJson.exports;
  if (typeof exportsField === 'string') {
    return [[packageName, join(repoRoot, 'packages', pkgDir, exportsField)]];
  }
  return Object.entries(exportsField as Record<string, string>)
    .map(([subpath, target]) => {
      const specifier = subpath === '.' ? packageName : `${packageName}${subpath.slice(1)}`;
      return [specifier, join(repoRoot, 'packages', pkgDir, target)] as [string, string];
    })
    .sort((a, b) => b[0].length - a[0].length);
}

function allLocalPackageEntries(): Array<[string, string]> {
  return [
    ...packageExportEntries('adapter-vite', '@openelement/adapter-vite'),
    ...packageExportEntries('app', '@openelement/app'),
    ...packageExportEntries('content', '@openelement/content'),
    ...packageExportEntries('core', '@openelement/core'),
    ...packageExportEntries('element', '@openelement/element'),
    ...packageExportEntries('protocol', '@openelement/protocol'),
    ...packageExportEntries('router', '@openelement/router'),
    ...packageExportEntries('signal', '@openelement/signal'),
    ...packageExportEntries('ssg', '@openelement/ssg'),
    ...packageExportEntries('ui', '@openelement/ui'),
  ].sort((a, b) => b[0].length - a[0].length);
}

async function run(
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): Promise<void> {
  console.log(`$ deno ${args.join(' ')}  # cwd=${cwd}`);
  const output = await new Deno.Command(Deno.execPath(), {
    args,
    cwd,
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.success) return;

  const stdout = new TextDecoder().decode(output.stdout).trim();
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (stdout) console.error(stdout);
  if (stderr) console.error(stderr);
  throw new Error(`Command failed with exit code ${output.code}: deno ${args.join(' ')}`);
}

async function write(path: string, content: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, content);
}

async function patchDenoJson(appDir: string): Promise<void> {
  const denoJsonPath = join(appDir, 'deno.json');
  const denoJson = JSON.parse(await Deno.readTextFile(denoJsonPath));
  const imports = denoJson.imports as Record<string, string>;

  Object.assign(imports, THIRD_PARTY_IMPORTS);

  for (const [specifier, target] of allLocalPackageEntries()) {
    imports[specifier] = fileUrl(target);
  }
  imports['@openelement/ui/'] = fileUrl(join(repoRoot, 'packages', 'ui', 'src') + '/');

  imports['@openelement/app'] = fileUrl(join(repoRoot, 'packages', 'app', 'src', 'index.ts'));
  imports['@openelement/app/i18n'] = fileUrl(join(repoRoot, 'packages', 'app', 'src', 'i18n.ts'));
  imports['@openelement/app/i18n-plugin'] = fileUrl(
    join(repoRoot, 'packages', 'app', 'src', 'i18n-plugin.ts'),
  );
  imports['@openelement/adapter-vite'] = fileUrl(
    join(repoRoot, 'packages', 'adapter-vite', 'src', 'index.ts'),
  );
  imports['@openelement/adapter-vite/build-context'] = fileUrl(
    join(repoRoot, 'packages', 'adapter-vite', 'src', 'build-context.ts'),
  );
  imports['@openelement/core'] = fileUrl(join(repoRoot, 'packages', 'core', 'src', 'index.ts'));
  imports['@openelement/core/hydrate'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'hydrate.ts'),
  );
  imports['@openelement/core/static'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'static.ts'),
  );
  imports['@openelement/core/errors'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'errors.ts'),
  );
  imports['@openelement/core/logger'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'logger.ts'),
  );
  imports['@openelement/core/prop'] = fileUrl(join(repoRoot, 'packages', 'core', 'src', 'prop.ts'));
  imports['@openelement/core/render-ir'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'render-ir.ts'),
  );
  imports['@openelement/core/jsx-runtime'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'jsx-runtime.ts'),
  );
  imports['@openelement/core/jsx-dev-runtime'] = imports['@openelement/core/jsx-runtime'];
  imports['@openelement/core/runtime'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'runtime.ts'),
  );
  imports['@openelement/core/style-sheet'] = fileUrl(
    join(repoRoot, 'packages', 'core', 'src', 'style-sheet.ts'),
  );
  imports['@openelement/content'] = fileUrl(
    join(repoRoot, 'packages', 'content', 'src', 'index.ts'),
  );
  imports['@openelement/element'] = fileUrl(
    join(repoRoot, 'packages', 'element', 'src', 'index.ts'),
  );
  imports['@openelement/router'] = fileUrl(
    join(repoRoot, 'packages', 'router', 'src', 'data-context.ts'),
  );
  imports['@openelement/router/i18n'] = fileUrl(
    join(repoRoot, 'packages', 'router', 'src', 'i18n.ts'),
  );
  imports['@openelement/signal'] = fileUrl(
    join(repoRoot, 'packages', 'signal', 'src', 'index.ts'),
  );
  imports['@openelement/signal/framework'] = fileUrl(
    join(repoRoot, 'packages', 'signal', 'src', 'framework.ts'),
  );
  imports['@openelement/ssg'] = fileUrl(join(repoRoot, 'packages', 'ssg', 'src', 'index.ts'));
  imports['@openelement/ui'] = fileUrl(join(repoRoot, 'packages', 'ui', 'src', 'index.ts'));
  imports['@openelement/ui/'] = fileUrl(join(repoRoot, 'packages', 'ui', 'src') + '/');

  const protocolSrc = join(repoRoot, 'packages', 'protocol', 'src');
  imports['@openelement/protocol'] = fileUrl(join(protocolSrc, 'index.ts'));
  for (
    const subpath of [
      'hydration-markers',
      'signal',
      'vnode',
      'render',
      'manifest',
      'framework',
      'context',
      'runtime',
      'data',
      'isr',
      'ssg',
      'errors',
      'style-sheet',
      'island',
      'prop',
    ]
  ) {
    imports[`@openelement/protocol/${subpath}`] = fileUrl(join(protocolSrc, `${subpath}.ts`));
  }

  denoJson.tasks.build = `deno run --unstable-sloppy-imports --config deno.json -A ${
    join(repoRoot, 'packages', 'adapter-vite', 'src', 'cli', 'build.ts')
  }`;

  await Deno.writeTextFile(denoJsonPath, JSON.stringify(denoJson, null, 2) + '\n');
}

async function patchViteConfig(appDir: string): Promise<void> {
  const viteConfigPath = join(appDir, 'vite.config.ts');
  let text = await Deno.readTextFile(viteConfigPath);
  const aliases = [
    ...allLocalPackageEntries(),
    [
      '@openelement/protocol/hydration-markers',
      join(repoRoot, 'packages/protocol/src/hydration-markers.ts'),
    ],
    ['@openelement/protocol/signal', join(repoRoot, 'packages/protocol/src/signal.ts')],
    ['@openelement/protocol/vnode', join(repoRoot, 'packages/protocol/src/vnode.ts')],
    ['@openelement/protocol/render', join(repoRoot, 'packages/protocol/src/render.ts')],
    ['@openelement/protocol/manifest', join(repoRoot, 'packages/protocol/src/manifest.ts')],
    ['@openelement/protocol/framework', join(repoRoot, 'packages/protocol/src/framework.ts')],
    ['@openelement/protocol/context', join(repoRoot, 'packages/protocol/src/context.ts')],
    ['@openelement/protocol/runtime', join(repoRoot, 'packages/protocol/src/runtime.ts')],
    ['@openelement/protocol/data', join(repoRoot, 'packages/protocol/src/data.ts')],
    ['@openelement/protocol/isr', join(repoRoot, 'packages/protocol/src/isr.ts')],
    ['@openelement/protocol/ssg', join(repoRoot, 'packages/protocol/src/ssg.ts')],
    ['@openelement/protocol/errors', join(repoRoot, 'packages/protocol/src/errors.ts')],
    ['@openelement/protocol/style-sheet', join(repoRoot, 'packages/protocol/src/style-sheet.ts')],
    ['@openelement/protocol/island', join(repoRoot, 'packages/protocol/src/island.ts')],
    ['@openelement/protocol/prop', join(repoRoot, 'packages/protocol/src/prop.ts')],
    ['@openelement/protocol', join(repoRoot, 'packages/protocol/src/index.ts')],
    [
      '@openelement/adapter-vite/build-context',
      join(repoRoot, 'packages/adapter-vite/src/build-context.ts'),
    ],
    ['@openelement/adapter-vite', join(repoRoot, 'packages/adapter-vite/src/index.ts')],
    ['@openelement/core/jsx-runtime', join(repoRoot, 'packages/core/src/jsx-runtime.ts')],
    ['@openelement/core/jsx-dev-runtime', join(repoRoot, 'packages/core/src/jsx-runtime.ts')],
    ['@openelement/core/hydrate', join(repoRoot, 'packages/core/src/hydrate.ts')],
    ['@openelement/core/static', join(repoRoot, 'packages/core/src/static.ts')],
    ['@openelement/core/errors', join(repoRoot, 'packages/core/src/errors.ts')],
    ['@openelement/core/logger', join(repoRoot, 'packages/core/src/logger.ts')],
    ['@openelement/core/style-sheet', join(repoRoot, 'packages/core/src/style-sheet.ts')],
    ['@openelement/core', join(repoRoot, 'packages/core/src/index.ts')],
    ['@openelement/app/i18n-plugin', join(repoRoot, 'packages/app/src/i18n-plugin.ts')],
    ['@openelement/app/i18n', join(repoRoot, 'packages/app/src/i18n.ts')],
    ['@openelement/app', join(repoRoot, 'packages/app/src/index.ts')],
    ['@openelement/content', join(repoRoot, 'packages/content/src/index.ts')],
    ['@openelement/element', join(repoRoot, 'packages/element/src/index.ts')],
    ['@openelement/router/i18n', join(repoRoot, 'packages/router/src/i18n.ts')],
    ['@openelement/router', join(repoRoot, 'packages/router/src/data-context.ts')],
    ['@openelement/signal/framework', join(repoRoot, 'packages/signal/src/framework.ts')],
    ['@openelement/signal', join(repoRoot, 'packages/signal/src/index.ts')],
    ['@openelement/ssg', join(repoRoot, 'packages/ssg/src/index.ts')],
    ['@openelement/ui', join(repoRoot, 'packages/ui/src/index.ts')],
  ];
  const aliasText = aliases
    .map(([find, replacement]) => `{ find: '${find}', replacement: '${vitePath(replacement)}' }`)
    .join(',\n        ');
  text = text.replace(
    'export default defineConfig({',
    `export default defineConfig({\n  resolve: {\n    alias: [\n        ${aliasText}\n    ],\n  },`,
  );
  text = text.replace(
    "packageIslands: ['@openelement/ui'],",
    "packageIslands: ['@openelement/ui'],\n    island: { upgradeStrategy: 'load' },",
  );
  await Deno.writeTextFile(viteConfigPath, text);
}

const routeSource = `/** @jsxImportSource @openelement/core */
import { defineElement, definePage } from '@openelement/app';
import { StyleSheet } from '@openelement/element';

export const tagName = 'alpha3-wc-page';

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: block; max-width: 880px; margin: 2rem auto; padding: 0 1rem; }
  h1 { margin: 0 0 1rem; }
\`);

defineElement(tagName, {
  styles,
  render() {
    return (
      <>
        <h1>alpha3 Web Components interop</h1>
        <alpha3-wc-fixture></alpha3-wc-fixture>
      </>
    );
  },
});

export default definePage({
  route: { path: '/third-party-wc' },
  head: {
    title: 'alpha3 Web Components interop',
    description: 'Lit, Shoelace, and Material Web Components inside openElement',
  },
  renderIntent: { mode: 'static', streaming: 'auto', revalidate: false },
  render() {
    return <alpha3-wc-page />;
  },
});
`;

const islandSource = `/** @jsxImportSource @openelement/core */
import { defineElement, defineIsland, defineIslandConfig } from '@openelement/app';
import { signal, StyleSheet } from '@openelement/element';

export const tagName = 'alpha3-wc-fixture';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

if (typeof window !== 'undefined') {
  import('../client/alpha3-wc-client.ts');
}

defineElement('alpha3-open-child', {
  render() {
    return <span id="open-child-ready">openElement child inside Lit</span>;
  },
});

const styles = new StyleSheet();
styles.replaceSync(\`
  :host { display: grid; gap: 1rem; }
  section { display: grid; gap: 0.5rem; padding: 1rem; border: 1px solid #d0d7de; border-radius: 8px; }
  .row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; }
\`);

const eventCount = signal(0);
const bump = () => eventCount.value++;

export default defineIsland(tagName, {
  styles,
  render() {
    return (
      <>
        <p id="event-count">events:{eventCount.value}</p>
        <section id="lit-section">
          <h2>Lit</h2>
          <alpha3-lit-counter label="Lit counter" on-lit-count={bump}>
            <span slot="label">Lit slot label</span>
          </alpha3-lit-counter>
        </section>
        <section id="shoelace-section">
          <h2>Shoelace</h2>
          <div class="row">
            <sl-button id="sl-button" variant="primary" onClick={bump}>Shoelace Button</sl-button>
            <sl-switch id="sl-switch" on-sl-change={bump}>Shoelace Switch</sl-switch>
          </div>
          <sl-dialog id="sl-dialog" label="Shoelace Dialog">Dialog content</sl-dialog>
        </section>
        <section id="material-section">
          <h2>Material Web</h2>
          <div class="row">
            <md-filled-button id="md-button" onClick={bump}>Material Button</md-filled-button>
            <md-outlined-text-field id="md-field" label="Material Field" value="alpha3"></md-outlined-text-field>
            <md-switch id="md-switch" on-change={bump}></md-switch>
          </div>
        </section>
        <section id="interop-section">
          <h2>Bidirectional</h2>
          <alpha3-lit-host></alpha3-lit-host>
        </section>
      </>
    );
  },
}, openElement);
`;

const clientSource = `import { LitElement, css, html } from 'lit';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/switch/switch.js';

class Alpha3LitCounter extends LitElement {
  static properties = { count: { type: Number }, label: { type: String } };
  static styles = css\`:host{display:inline-flex;gap:.5rem;align-items:center}button{cursor:pointer}\`;
  count = 0;
  label = 'Lit counter';
  #increment() {
    this.count++;
    this.dispatchEvent(new CustomEvent('lit-count', {
      detail: { count: this.count },
      bubbles: true,
      composed: true,
    }));
  }
  render() {
    return html\`<slot name="label"></slot><button id="lit-button" @click=\${() => this.#increment()}>\${this.label}: \${this.count}</button>\`;
  }
}

class Alpha3LitHost extends LitElement {
  render() {
    return html\`<alpha3-open-child></alpha3-open-child>\`;
  }
}

customElements.define('alpha3-lit-counter', Alpha3LitCounter);
customElements.define('alpha3-lit-host', Alpha3LitHost);
`;

async function installFixture(appDir: string): Promise<void> {
  await write(join(appDir, 'app', 'routes', 'third-party-wc.tsx'), routeSource);
  await write(join(appDir, 'app', 'islands', 'alpha3-wc-fixture.tsx'), islandSource);
  await write(join(appDir, 'app', 'client', 'alpha3-wc-client.ts'), clientSource);
}

function contentType(path: string): string {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function serveDist(distDir: string): Deno.HttpServer {
  return Deno.serve({ port: 0, onListen: () => {} }, async (request) => {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    const candidates = pathname.endsWith('/')
      ? [join(distDir, pathname, 'index.html')]
      : [join(distDir, pathname), join(distDir, pathname, 'index.html')];

    for (const candidate of candidates) {
      try {
        const body = await Deno.readFile(candidate);
        return new Response(body, { headers: { 'content-type': contentType(candidate) } });
      } catch {
        // Try next candidate.
      }
    }
    return new Response('Not found', { status: 404 });
  });
}

async function verifyBrowser(distDir: string): Promise<void> {
  const { chromium } = await import('npm:playwright@1.59.1');
  const server = serveDist(distDir);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const addr = server.addr as Deno.NetAddr;
    await page.goto(`http://127.0.0.1:${addr.port}/third-party-wc/`);

    await page.waitForFunction(() =>
      customElements.get('alpha3-lit-counter') &&
      customElements.get('alpha3-lit-host') &&
      customElements.get('alpha3-wc-fixture') &&
      customElements.get('alpha3-open-child') &&
      customElements.get('sl-button') &&
      customElements.get('sl-switch') &&
      customElements.get('md-filled-button') &&
      customElements.get('md-outlined-text-field') &&
      customElements.get('md-switch')
    );

    const summary = await page.evaluate(async () => {
      const routePage = document.querySelector('alpha3-wc-page') as HTMLElement | null;
      const fixture = routePage?.shadowRoot?.querySelector('alpha3-wc-fixture') as
        | HTMLElement
        | null;
      const root = fixture?.shadowRoot;
      if (!fixture || !root) throw new Error('alpha3-wc-fixture shadow root missing');

      const lit = root.querySelector('alpha3-lit-counter') as HTMLElement & {
        shadowRoot: ShadowRoot;
      };
      const litButton = lit.shadowRoot.querySelector('#lit-button') as HTMLButtonElement;
      litButton.click();

      const slButton = root.querySelector('#sl-button') as HTMLElement;
      const slSwitch = root.querySelector('#sl-switch') as HTMLElement;
      const mdButton = root.querySelector('#md-button') as HTMLElement;
      slButton.click();
      slSwitch.click();
      mdButton.click();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const litHost = root.querySelector('alpha3-lit-host') as HTMLElement & {
        shadowRoot: ShadowRoot;
      };
      const openChild = litHost.shadowRoot.querySelector('alpha3-open-child') as HTMLElement & {
        shadowRoot: ShadowRoot;
      };
      const eventText = root.querySelector('#event-count')?.textContent ?? '';
      const eventCount = Number(eventText.replace(/\\D+/g, ''));

      return {
        eventCount,
        litSlot: lit.textContent?.includes('Lit slot label') ?? false,
        litHostContainsOpenElement: !!openChild &&
          openChild.shadowRoot?.textContent?.includes('openElement child inside Lit'),
        shoelaceReady: !!root.querySelector('sl-dialog'),
        materialReady: !!root.querySelector('md-filled-button') &&
          !!root.querySelector('md-outlined-text-field') &&
          !!root.querySelector('md-switch'),
      };
    });

    if (summary.eventCount < 3) {
      throw new Error(`Expected at least 3 openElement-handled events; got ${summary.eventCount}`);
    }
    if (!summary.litSlot) throw new Error('Lit slot content did not render');
    if (!summary.litHostContainsOpenElement) {
      throw new Error('Lit host did not contain openElement child');
    }
    if (!summary.shoelaceReady) throw new Error('Shoelace components were not present');
    if (!summary.materialReady) throw new Error('Material Web components were not present');
  } finally {
    await browser.close();
    await server.shutdown();
  }
}

async function verifySsrHtml(appDir: string): Promise<void> {
  const html = await Deno.readTextFile(join(appDir, 'dist', 'third-party-wc', 'index.html'));
  for (
    const expected of [
      '<alpha3-wc-fixture',
      '<alpha3-lit-counter',
      '<sl-button',
      '<sl-switch',
      '<sl-dialog',
      '<md-filled-button',
      '<md-outlined-text-field',
      '<md-switch',
      'slot="label"',
      'data-eid=',
    ]
  ) {
    if (!html.includes(expected)) {
      throw new Error(`SSR output missing ${expected}`);
    }
  }
}

async function main(): Promise<void> {
  const tmpRoot = await Deno.makeTempDir({ prefix: 'openelement-third-party-wc-' });
  const keep = Deno.env.get('OPEN_ELEMENT_KEEP_THIRD_PARTY_WC_SMOKE') === '1';
  try {
    await run(['run', '-A', join(repoRoot, 'packages', 'create', 'cli.ts'), PROJECT_NAME], tmpRoot);
    const appDir = join(tmpRoot, PROJECT_NAME);
    await patchDenoJson(appDir);
    await patchViteConfig(appDir);
    await installFixture(appDir);
    await run(['task', 'build'], appDir);
    await verifySsrHtml(appDir);
    await verifyBrowser(join(appDir, 'dist'));
    console.log('third-party Web Components smoke passed');
  } finally {
    if (keep) {
      console.log(`Keeping third-party WC smoke project at ${tmpRoot}`);
    } else {
      await Deno.remove(tmpRoot, { recursive: true });
    }
  }
}

if (import.meta.main) {
  await main();
}
