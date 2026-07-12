/**
 * @openelement/docs - API Reference
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/site-ui/open-lab-panel.tsx';
import { OPENELEMENT_VERSION } from '../data/version.ts';

export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * { box-sizing: border-box; }

  h1,
  h2,
  h3,
  p {
    margin-block-start: 0;
  }

  .api-page {
    display: grid;
    background: var(--bg-base);
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, .68fr) minmax(320px, .32fr);
    min-height: 460px;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(112deg, color-mix(in srgb, var(--brand-pale) 56%, transparent), transparent 44%),
      var(--bg-base);
  }

  .hero-copy,
  .hero-panel {
    display: grid;
    align-content: end;
    padding: var(--size-10);
  }

  .hero-copy {
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .kicker,
  .section-kicker,
  .rail-link,
  .sig,
  .surface {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    max-width: 780px;
    margin: var(--size-4) 0;
    font-size: var(--font-size-7);
    line-height: .94;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .lede {
    max-width: 720px;
    color: var(--text-secondary);
    font-size: var(--font-size-3);
    line-height: 1.24;
  }

  .shell {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: var(--size-7);
    width: min(1180px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding: var(--size-10) 0;
  }

  .rail {
    position: sticky;
    top: calc(var(--nav-height) + var(--size-5));
    align-self: start;
    display: grid;
    gap: var(--size-2);
  }

  .rail-link {
    display: block;
    padding: var(--size-3) 0;
    color: var(--text-muted);
    text-decoration: none;
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .rail-link:hover {
    color: var(--brand);
  }

  .api-grid {
    display: grid;
    gap: var(--size-8);
  }

  .api-section {
    display: grid;
    gap: var(--size-4);
    padding-block-end: var(--size-8);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: var(--size-5);
  }

  .section-head h2 {
    margin: var(--size-2) 0 0;
    font-size: var(--font-size-5);
    line-height: 1;
  }

  .section-head p {
    max-width: 560px;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .package-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .package-card {
    display: grid;
    align-content: start;
    gap: var(--size-3);
    min-height: 280px;
  }

  .card-top {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: var(--size-3);
  }

  .package-card h3 {
    margin: 0;
    font-size: var(--font-size-3);
  }

  .package-card p,
  .panel-copy,
  .package-card li {
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .sig {
    display: block;
    padding: var(--size-3);
    overflow-x: auto;
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--bg-code);
    color: var(--code-text);
    text-transform: none;
    white-space: nowrap;
  }

  .package-card ul {
    display: grid;
    gap: var(--size-2);
    margin: 0;
    padding-inline-start: var(--size-5);
  }

  .surface {
    color: var(--text-muted);
  }

  @media (max-width: 980px) {
    .hero,
    .shell {
      grid-template-columns: 1fr;
      width: min(100% - var(--size-8), 1180px);
    }

    .hero-copy {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }

    .hero-copy,
    .hero-panel,
    .shell {
      padding: var(--size-8) var(--size-5);
    }

    .rail {
      position: static;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .package-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    h1 {
      font-size: var(--font-size-6);
    }

    .lede {
      font-size: var(--font-size-2);
    }

    .rail,
    .section-head {
      display: grid;
      grid-template-columns: 1fr;
    }

    .hero-copy,
    .hero-panel,
    .shell {
      padding-inline: var(--size-4);
    }
  }
`);

type ApiPackage = {
  id: string;
  surface: string;
  title: string;
  copy: string;
  importPath: string;
  exports: string[];
  notes: string[];
};

const packages: ApiPackage[] = [
  {
    id: 'app',
    surface: 'Product',
    title: '@openelement/app',
    copy: 'JSX-first framework API for pages, layouts, islands, SPA bootstrap, i18n, and the Vite facade.',
    importPath: "@openelement/app, @openelement/app/spa, @openelement/app/preact",
    exports: ['.', './spa', './i18n', './i18n-plugin', './preact'],
    notes: [
      'Use `definePage`, `defineIsland`, `defineElement`, and `defineLayout` for app authoring.',
      'Alpha.5 adds first-class `defineApp({ mode: "spa" })` client bootstrap.',
      'Use `@openelement/adapter-vite/app-vite` or generated create tasks from Vite config.',
    ],
  },
  {
    id: 'router',
    surface: 'Supporting',
    title: '@openelement/app',
    copy: 'Runtime-free route support behind the framework, including data context and client routing.',
    importPath: '@openelement/router/client-router',
    exports: ['.', './data-context', './i18n', './client-router'],
    notes: [
      'Alpha.5 exposes the client router used by SPA mode.',
      'Route params are protected against prototype poisoning and guard redirects are cycle-limited.',
      'Most app authors reach this package through `@openelement/app`.',
    ],
  },
  {
    id: 'element',
    surface: 'Product',
    title: '@openelement/element',
    copy: 'Canonical component authoring facade for OpenElement, StyleSheet, signals, islands, JSX, and VNode types.',
    importPath: '@openelement/element',
    exports: ['.', './open-element-render', './open-element-hydration'],
    notes: [
      'Start here for product-facing native Web Component authoring.',
      'Shadow/DSD is the default render mode; light DOM remains explicit opt-in.',
      'Re-exports low-level primitives so app code does not import kernel internals first.',
    ],
  },
  {
    id: 'ui',
    surface: 'Supporting',
    title: '@openelement/ui',
    copy: 'First-party `open-*` Web Components and Open Props token foundation used by the docs site.',
    importPath: '@openelement/site-ui/open-layout.tsx',
    exports: [
      '.',
      './open-button',
      './open-card',
      './open-input',
      './open-brand-mark',
      './open-layout',
      './open-theme-toggle',
      './open-dropdown',
      './open-modal',
      './open-tabs',
      './open-props-tokens',
    ],
    notes: [
      '`open-brand-mark` is the current `<open/>` brand primitive.',
      'The UI package exports a CEM-compatible manifest for package island scanning.',
      'Alpha.5 keeps tokens aligned to Open Props plus semantic aliases.',
    ],
  },
  {
    id: 'core',
    surface: 'Supporting',
    title: '@openelement/element',
    copy: 'Low-level runtime kernel for JSX, VNode rendering, DSD, hydration, StyleSheet, errors, and trust boundaries.',
    importPath: '@openelement/core/static, @openelement/element',
    exports: [
      '.',
      './static',
      './hydrate',
      './csr',
      './prop',
      './errors',
      './context',
      './logger',
      './style-sheet',
      './html-escape',
      './jsx-runtime',
      './dsd-hydration',
    ],
    notes: [
      'Runtime-free public code: no `Deno.*` or `node:*` APIs in the public package surface.',
      'Use `@openelement/element` first for component authoring.',
      'Core owns the escaping and explicit trusted HTML boundary.',
    ],
  },
  {
    id: 'protocol',
    surface: 'Supporting',
    title: '@openelement/protocol',
    copy: 'Shared type contracts for render, hydration, manifest, data, runtime, errors, prop, island, and SSG shapes.',
    importPath: '@openelement/protocol/ssg',
    exports: [
      '.',
      './signal',
      './vnode',
      './render',
      './manifest',
      './framework',
      './data',
      './ssg',
      './errors',
      './island',
      './prop',
    ],
    notes: [
      'Alpha.5 defines BuildPlan, BuildArtifacts, and resolver contract shapes here.',
      'This package stays runtime-free and exists to keep package boundaries explicit.',
      'Deep imports are alpha-line contracts and should stay synchronized with package surface docs.',
    ],
  },
  {
    id: 'signal',
    surface: 'Supporting',
    title: '@openelement/element',
    copy: 'Reactive primitive layer built on `@preact/signals-core` with framework integration hooks.',
    importPath: '@openelement/element',
    exports: ['.', './framework', './preact-engine'],
    notes: [
      'Exports signal, computed, and effect primitives at the package root.',
      'Framework integration is isolated under `./framework`.',
      'Preact engine wiring stays optional and explicit.',
    ],
  },
  {
    id: 'content',
    surface: 'Supporting',
    title: '@openelement/content',
    copy: 'Build-time Markdown, MDX, blog data, navigation metadata, sitemap, and robots support.',
    importPath: '@openelement/content/mdx',
    exports: ['.', './blog-data', './mdx', './nav', './sitemap', './write-json'],
    notes: [
      'Normal apps configure content through `openElement()` rather than runtime imports.',
      'MDX compiles into the same JSX/DSD path as application code.',
      'Build/server glue may use Deno or Node APIs.',
    ],
  },
  {
    id: 'ssg',
    surface: 'Supporting',
    title: '@openelement/ssg',
    copy: 'Adapter-agnostic static site generation engine for route scanning, entry generation, rendering, and postprocess.',
    importPath: '@openelement/ssg',
    exports: ['.'],
    notes: [
      'Alpha.5 owns `build(plan) -> artifacts` and `prepareBuildPlan()` policy orchestration.',
      'It depends on core/router/content concepts, never on Vite.',
      'Adapters delegate framework build policy to this engine.',
    ],
  },
  {
    id: 'adapter-vite',
    surface: 'Supporting',
    title: '@openelement/adapter-vite',
    copy: 'Vite/Nitro bridge that scans projects, prepares build plans, emits client assets, and delegates SSG work.',
    importPath: '@openelement/adapter-vite/plugin',
    exports: [
      '.',
      './plugin',
      './route-manifest',
      './generated-data-resolver',
      './subpath-resolver',
      './cli/build',
      './cli/build-client',
      './cli/build-ssg',
    ],
    notes: [
      'Alpha.5 keeps this package thin: Vite glue here, framework policy in `@openelement/ssg`.',
      'Resolver helpers cover workspace aliases, package subpaths, and npm/jsr export maps.',
      'Public helpers prefer Node APIs where npm consumers invoke builds directly.',
    ],
  },
  {
    id: 'create',
    surface: 'Product',
    title: '@openelement/create',
    copy: 'Starter generator and consumer entry for creating new openElement projects.',
    importPath: 'npm:@openelement/create',
    exports: ['CLI binary', './cli.ts'],
    notes: [
      'Use it for first-run project scaffolding.',
      'Generated projects should consume the framework facade rather than adapter internals.',
      'Starter output is part of the beta.1 adoption freeze path.',
    ],
  },
];

export class ApiCorePage extends OpenElement {
  static override styles = [routeSheet];

  override render() {
    return (
      <main class='api-page'>
        <section class='hero'>
          <div class='hero-copy'>
            <p class='kicker'>Reference command center</p>
            <h1>API Reference</h1>
            <p class='lede'>
              Public surfaces are organized by the actual {OPENELEMENT_VERSION} package graph.
              Every package below is backed by current workspace exports, package contracts,
              and alpha.6/alpha.7/beta.1 release planning. Product packages define the
              user-facing story; supporting packages, adapters, dogfood, and infrastructure
              stay labeled so they do not expand product scope.
            </p>
          </div>
          <div class='hero-panel'>
            <open-lab-panel label='contract map' meta={OPENELEMENT_VERSION}>
              <p class='panel-copy'>
                The current product line is Web Components Fullstack Framework +
                Basic Element: a WC-native app framework plus a JSX-first
                Basic Element authoring layer.
              </p>
              <open-button href='/guide/api'>Read API routes guide</open-button>
            </open-lab-panel>
          </div>
        </section>

        <div class='shell'>
          <aside class='rail' aria-label='API packages'>
            {packages.map((pkg) => <a class='rail-link' href={`#${pkg.id}`}>{pkg.title}</a>)}
          </aside>
          <div class='api-grid'>
            <section class='api-section' id='overview'>
              <div class='section-head'>
                <div>
                  <p class='section-kicker'>Surface rule</p>
                  <h2>Authoring starts at product packages.</h2>
                </div>
                <p>
                  Application code should prefer `@openelement/app`,
                  `@openelement/create`, and `@openelement/element`.
                  Supporting packages remain documented because their contracts
                  are public, tested, and versioned. Dogfood apps and release
                  gates are evidence, not import surfaces.
                </p>
              </div>
            </section>

            <div class='package-grid'>
              {packages.map((pkg) => (
                <open-card class='package-card' id={pkg.id}>
                  <div class='card-top'>
                    <div>
                      <span class='surface'>{pkg.surface}</span>
                      <h3>{pkg.title}</h3>
                    </div>
                    <open-badge tone={pkg.surface === 'Product' ? 'brand' : 'neutral'}>
                      {pkg.exports.length} exports
                    </open-badge>
                  </div>
                  <p>{pkg.copy}</p>
                  <code class='sig'>{pkg.importPath}</code>
                  <ul>
                    <li>Exports: {pkg.exports.join(', ')}</li>
                    {pkg.notes.map((note) => <li>{note}</li>)}
                  </ul>
                </open-card>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, ApiCorePage);
}

export default ApiCorePage;
