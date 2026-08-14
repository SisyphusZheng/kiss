#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net --allow-sys
/**
 * Third-party WC smoke: verify mature third-party Web Components can be
 * consumed directly inside an openElement app.
 */

import { dirname, fromFileUrl, join } from '@std/path';

import type { Page } from 'npm:playwright@1.59.1';
import { formatJson } from '@openelement/element/build-utils';
import { allPackageAliases } from './lib/package-graph.ts';
import { readJson } from './lib/fs.ts';
import { normalizeSlashes } from './lib/path.ts';
import { serveStatic } from './lib/static-server.ts';

const repoRoot = dirname(dirname(fromFileUrl(import.meta.url)));
const PROJECT_NAME = 'third-party-wc-smoke-app';

const THIRD_PARTY_IMPORTS = {
  lit: 'npm:lit@3.3.3',
  '@shoelace-style/shoelace': 'npm:@shoelace-style/shoelace@2.20.1',
  '@shoelace-style/shoelace/': 'npm:@shoelace-style/shoelace@2.20.1/',
  '@material/web': 'npm:@material/web@2.4.1',
  '@material/web/': 'npm:@material/web@2.4.1/',
};

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

async function patchDenoJson(appDir: string): Promise<void> {
  const denoJsonPath = join(appDir, 'deno.json');
  const denoJson = await readJson<{
    imports: Record<string, string>;
    tasks: Record<string, string>;
  }>(denoJsonPath);
  const imports = denoJson.imports;

  Object.assign(imports, THIRD_PARTY_IMPORTS);

  for (const [specifier, url] of allPackageAliases(repoRoot)) {
    imports[specifier] = url;
  }

  denoJson.tasks.build = `deno run --unstable-sloppy-imports --config deno.json -A ${
    join(repoRoot, 'packages', 'adapter-vite', 'src', 'cli', 'build.ts')
  }`;

  await Deno.writeTextFile(denoJsonPath, formatJson(denoJson));
}

async function patchViteConfig(appDir: string): Promise<void> {
  const viteConfigPath = join(appDir, 'vite.config.ts');
  let text = await Deno.readTextFile(viteConfigPath);

  const aliasText = [...allPackageAliases(repoRoot)]
    .map(([find, url]) =>
      `{ find: '${find}', replacement: '${normalizeSlashes(fromFileUrl(url))}' }`
    )
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

async function readEventCount(page: Page): Promise<number> {
  return await page.evaluate(() => {
    // #960: the definePage route registers under the path-derived fallback
    // tag (third-party-wc); alpha3-wc-page is the content element inside
    // its DSD shadow root.
    const routePage = document
      .querySelector('third-party-wc')
      ?.shadowRoot?.querySelector('alpha3-wc-page') as HTMLElement | null;
    const fixture = routePage?.shadowRoot?.querySelector('alpha3-wc-fixture') as
      | HTMLElement
      | null;
    const root = fixture?.shadowRoot;
    const eventText = root?.querySelector('#event-count')?.textContent ?? '';
    return Number(eventText.replace(/\D+/g, ''));
  });
}

async function interactAndVerifyEventCount(page: Page, startCount: number): Promise<void> {
  const expectCount = async (expected: number, label: string): Promise<void> => {
    await page.waitForFunction((target) => {
      // #960: the definePage route registers under the path-derived fallback
      // tag (third-party-wc); alpha3-wc-page is the content element inside
      // its DSD shadow root.
      const routePage = document
        .querySelector('third-party-wc')
        ?.shadowRoot?.querySelector('alpha3-wc-page') as HTMLElement | null;
      const fixture = routePage?.shadowRoot?.querySelector('alpha3-wc-fixture') as
        | HTMLElement
        | null;
      const root = fixture?.shadowRoot;
      const eventText = root?.querySelector('#event-count')?.textContent ?? '';
      return Number(eventText.replace(/\D+/g, '')) >= target;
    }, expected);
    const actual = await readEventCount(page);
    if (actual < expected) {
      throw new Error(`${label}: expected event count >= ${expected}, got ${actual}`);
    }
  };

  // Lit counter click dispatches a composed CustomEvent('lit-count').
  await page.locator('alpha3-lit-counter').locator('#lit-button').click();
  await expectCount(startCount + 1, 'Lit counter click');

  // Shoelace button click.
  await page.locator('sl-button#sl-button').click();
  await expectCount(startCount + 2, 'Shoelace button click');

  // Shoelace switch change.
  await page.locator('sl-switch#sl-switch').click();
  await expectCount(startCount + 3, 'Shoelace switch change');

  // Material button click.
  await page.locator('md-filled-button#md-button').click();
  await expectCount(startCount + 4, 'Material button click');

  // Material switch change.
  await page.locator('md-switch#md-switch').click();
  await expectCount(startCount + 5, 'Material switch change');

  // Bare-native badge click.
  await page.locator('alpha3-native-badge#native-badge').click();
  await expectCount(startCount + 6, 'Native badge click');
}

async function verifyBrowser(distDir: string): Promise<void> {
  const { chromium } = await import('npm:playwright@1.59.1');
  const server = serveStatic(distDir);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${server.origin}/third-party-wc/`);

    await page.waitForFunction(() =>
      customElements.get('alpha3-lit-counter') &&
      customElements.get('alpha3-lit-host') &&
      customElements.get('alpha3-wc-fixture') &&
      customElements.get('alpha3-open-child') &&
      customElements.get('alpha3-native-badge') &&
      customElements.get('sl-button') &&
      customElements.get('sl-switch') &&
      customElements.get('md-filled-button') &&
      customElements.get('md-outlined-text-field') &&
      customElements.get('md-switch')
    );

    await page.waitForFunction(() => {
      // #960: the definePage route registers under the path-derived fallback
      // tag (third-party-wc); alpha3-wc-page is the content element inside
      // its DSD shadow root.
      const routePage = document
        .querySelector('third-party-wc')
        ?.shadowRoot?.querySelector('alpha3-wc-page') as HTMLElement | null;
      const fixture = routePage?.shadowRoot?.querySelector('alpha3-wc-fixture') as
        | HTMLElement
        | null;
      const lit = fixture?.shadowRoot?.querySelector('alpha3-lit-counter') as HTMLElement & {
        shadowRoot?: ShadowRoot;
      };
      const litHost = fixture?.shadowRoot?.querySelector('alpha3-lit-host') as HTMLElement & {
        shadowRoot?: ShadowRoot;
      };
      return !!lit?.shadowRoot?.querySelector('#lit-button') &&
        !!litHost?.shadowRoot?.querySelector('alpha3-open-child');
    });

    const summary = await page.evaluate(() => {
      // #960: the definePage route registers under the path-derived fallback
      // tag (third-party-wc); alpha3-wc-page is the content element inside
      // its DSD shadow root.
      const routePage = document
        .querySelector('third-party-wc')
        ?.shadowRoot?.querySelector('alpha3-wc-page') as HTMLElement | null;
      const fixture = routePage?.shadowRoot?.querySelector('alpha3-wc-fixture') as
        | HTMLElement
        | null;
      const root = fixture?.shadowRoot;
      if (!fixture || !root) throw new Error('alpha3-wc-fixture shadow root missing');
      const lit = root.querySelector('alpha3-lit-counter') as HTMLElement & {
        shadowRoot: ShadowRoot;
      };
      const litHost = root.querySelector('alpha3-lit-host') as HTMLElement & {
        shadowRoot: ShadowRoot;
      };
      const openChild = litHost.shadowRoot.querySelector('alpha3-open-child') as HTMLElement & {
        shadowRoot: ShadowRoot;
      };
      const eventText = root.querySelector('#event-count')?.textContent ?? '';
      const eventCount = Number(eventText.replace(/\D+/g, ''));

      return {
        eventCount,
        litSlot: lit.textContent?.includes('Lit slot label') ?? false,
        litHostContainsOpenElement: !!openChild &&
          openChild.shadowRoot?.textContent?.includes('openElement child inside Lit'),
        shoelaceReady: !!root.querySelector('sl-dialog'),
        materialReady: !!root.querySelector('md-filled-button') &&
          !!root.querySelector('md-outlined-text-field') &&
          !!root.querySelector('md-switch'),
        nativeBadgeShadow: !!(root.querySelector('alpha3-native-badge') as HTMLElement)
          ?.shadowRoot?.querySelector('slot'),
      };
    });

    if (!Number.isFinite(summary.eventCount)) throw new Error('Event counter did not render');
    if (!summary.litSlot) throw new Error('Lit slot content did not render');
    if (!summary.litHostContainsOpenElement) {
      throw new Error('Lit host did not contain openElement child');
    }
    if (!summary.shoelaceReady) throw new Error('Shoelace components were not present');
    if (!summary.materialReady) throw new Error('Material Web components were not present');
    if (!summary.nativeBadgeShadow) throw new Error('Native badge shadow root did not render');

    // Interaction event propagation checks for #221.
    await interactAndVerifyEventCount(page, summary.eventCount);
  } finally {
    await browser.close();
    await server.close();
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
      '<alpha3-native-badge',
      'Native badge light child',
      'slot="label"',
      'data-eid=',
    ]
  ) {
    if (!html.includes(expected)) {
      throw new Error(`SSR output missing ${expected}`);
    }
  }
}

/**
 * Create a temp app from packages/create, patch it to consume the third-party
 * WC fixture, copy the fixture sources in, and build it. Returns the app dir.
 * Shared by the smoke (browser + SSR checks) and the SSR corpus script.
 */
export async function prepareFixtureApp(tmpRoot: string): Promise<string> {
  await run(
    ['run', '-A', join(repoRoot, 'packages', 'create', 'src', 'cli.ts'), PROJECT_NAME],
    tmpRoot,
  );
  const appDir = join(tmpRoot, PROJECT_NAME);
  await patchDenoJson(appDir);
  await patchViteConfig(appDir);

  const fixtureDir = join(dirname(fromFileUrl(import.meta.url)), 'third-party-wc-smoke');
  for (
    const src of [
      'app/routes/third-party-wc.tsx',
      'app/islands/alpha3-wc-fixture.tsx',
      'app/client/alpha3-wc-client.ts',
    ]
  ) {
    Deno.mkdirSync(dirname(join(appDir, src)), { recursive: true });
    Deno.copyFileSync(join(fixtureDir, src), join(appDir, src));
  }

  await run(['task', 'build'], appDir);
  return appDir;
}

async function main(): Promise<void> {
  const tmpRoot = await Deno.makeTempDir({ prefix: 'openelement-third-party-wc-' });
  const keep = Deno.env.get('OPEN_ELEMENT_KEEP_THIRD_PARTY_WC_SMOKE') === '1';
  try {
    const appDir = await prepareFixtureApp(tmpRoot);
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
