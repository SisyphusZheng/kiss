/** WWW supported API reference page. */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import '@openelement/site-ui/open-section-frame.tsx';
import { OPENELEMENT_VERSION } from '../data/version.ts';

export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host { display: block; color: var(--text-primary); }
  * { box-sizing: border-box; }
  p { margin: 0; }

  /* registry table: hairline rows, display-grade package names */
  .registry { border-block-start: var(--border-size-1) solid var(--border); }
  .registry-head, .pkg-row {
    display: grid;
    grid-template-columns: minmax(0, .9fr) minmax(0, 1fr) auto;
    gap: clamp(1rem, 4vw, 3rem);
    align-items: start;
  }
  .registry-head {
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
    color: var(--text-muted);
    font-size: var(--font-size-micro);
    font-weight: var(--font-weight-7);
    letter-spacing: .18em;
    text-transform: uppercase;
  }
  .pkg-row { padding-block: var(--size-6); border-block-end: var(--border-size-1) solid var(--border); }
  .pkg-name {
    display: block;
    color: var(--violet-8);
    font-size: clamp(1.7rem, 2.8vw, 2.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -.03em;
  }
  .pkg-row[data-kind='optional'] .pkg-name { color: var(--text-secondary); }
  .pkg-path { display: block; margin-block-start: var(--size-2); color: var(--text-muted); font-size: var(--font-size-00); }
  .pkg-copy { margin-block-start: var(--size-3); color: var(--text-secondary); font-size: var(--font-size-0); line-height: var(--font-lineheight-3); }
  .pkg-note { display: block; margin-block-start: var(--size-2); color: var(--text-muted); font-size: var(--font-size-00); line-height: var(--font-lineheight-3); }
  .pkg-chips { display: flex; flex-wrap: wrap; gap: var(--size-2); }
  .chip {
    padding: var(--size-1) var(--size-2);
    border-radius: var(--radius-1);
    background: var(--violet-2);
    color: var(--violet-8);
    font-size: var(--font-size-00);
  }
  .kind {
    padding: var(--size-1) var(--size-3);
    border-radius: var(--radius-1);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .kind-core { background: var(--brand); color: var(--on-brand); }
  .kind-build {
    background: var(--violet-2);
    color: var(--violet-8);
    box-shadow: inset 0 0 0 var(--border-size-1) color-mix(in srgb, var(--violet-5) 55%, transparent);
  }
  .kind-optional {
    border: var(--border-size-1) dashed color-mix(in srgb, var(--violet-5) 65%, transparent);
    color: var(--text-secondary);
  }
  .footnote { padding-block-start: var(--size-6); color: var(--text-muted); font-size: var(--font-size-00); line-height: var(--font-lineheight-3); }
  .footnote p + p { margin-block-start: var(--size-3); }
  .footnote code { color: var(--violet-8); }

  @media (max-width: 860px) {
    .registry-head { display: none; }
    .pkg-row { grid-template-columns: 1fr; gap: var(--size-3); }
    .kind { justify-self: start; }
  }
`);

type ApiPackage = {
  id: string;
  name: string;
  copy: string;
  importPath: string;
  exports: string[];
  notes: string[];
  kind: 'core' | 'build' | 'optional';
};

const kindLabels = { core: 'CORE', build: 'BUILD', optional: 'OPTIONAL' } as const;

const packages: ApiPackage[] = [
  {
    id: 'element',
    name: 'element',
    copy:
      'The supported Custom Element authoring surface for JSX, DSD, hydration, signals and styles.',
    importPath: '@openelement/element',
    exports: ['root', 'jsx-runtime', 'jsx-dev-runtime', 'build-utils'],
    notes: [
      'Start here for standalone element authoring.',
      'Use `defineElement`, `OpenElement`, `StyleSheet` and signal helpers without importing renderer internals.',
    ],
    kind: 'core',
  },
  {
    id: 'app',
    name: 'app',
    copy: 'The application surface for pages, routes, islands and request/render semantics.',
    importPath: '@openelement/app',
    exports: ['root', 'model', 'spa', 'i18n', 'preact'],
    notes: [
      'Use `definePage`, `defineIsland` and `defineApp` for application authoring.',
      'The router and request-driver implementation are internal product knowledge.',
    ],
    kind: 'core',
  },
  {
    id: 'adapter-vite',
    name: 'adapter-vite',
    copy: 'The official Vite, content, static-build and Nitro output adapter.',
    importPath: '@openelement/adapter-vite',
    exports: ['root', 'nitro-mount', 'cli/build', 'cli/start', 'cli/preview', 'sitemap'],
    notes: [
      'Use `buildApp()` or the generated build task.',
      'Plugin ordering, manifests and content scans are adapter implementation details.',
    ],
    kind: 'build',
  },
  {
    id: 'create',
    name: 'create',
    copy: 'The installed starter and zero-context consumer entrypoint.',
    importPath: 'npm:@openelement/create',
    exports: ['root', 'CLI only'],
    notes: [
      'Generated projects expose `dev`, `check`, `test`, `build` and `preview`.',
      'The starter imports product packages only.',
    ],
    kind: 'build',
  },
  {
    id: 'ui',
    name: 'ui',
    copy: 'Optional primitives retained only when they have demonstrated reusable behavior.',
    importPath: '@openelement/ui',
    exports: ['root', 'retained primitive subpaths'],
    notes: [
      'UI is not required to use OpenElement.',
      'Website-specific brand, hero, lab and layout artifacts are not UI package contracts.',
    ],
    kind: 'optional',
  },
];

export class ApiCorePage extends OpenElement {
  static override styles = [routeSheet];
  override render() {
    return (
      <main>
        <open-page-hero variant='technical'>
          <span slot='eyebrow'>API Reference — surface registry</span>
          <span slot='title'>FIVE-PACKAGE</span>
          <span slot='title-accent'>surface.</span>
          <span slot='lede'>
            The {OPENELEMENT_VERSION}{' '}
            current line documents only the five consumer packages. Retired alpha packages and
            internal subpaths are not authoring surfaces.
          </span>
          <open-artifact-panel slot='artifact'>
            <span slot='label'>five-package surface</span>
            <span slot='meta'>{OPENELEMENT_VERSION}</span>
            <p>
              Element, App and Build interfaces stay small so authors do not need renderer,
              protocol, router or build-phase internals.
            </p>
            <open-button href='/guide/getting-started'>Start building</open-button>
          </open-artifact-panel>
        </open-page-hero>
        <open-section-frame>
          <span slot='index'>01 / interface rule</span>
          <span slot='title'>Authoring starts at product packages.</span>
          <span slot='copy'>
            Current documentation, starters and dogfood use the five supported interfaces. Future
            load, action, form and revalidation capabilities are roadmap work, not current stable
            claims.
          </span>
        </open-section-frame>
        <open-section-frame>
          <span slot='index'>02 / supported surface</span>
          <span slot='title'>Five products, one application path.</span>
          <span slot='copy'>
            Each package owns a distinct consumer decision; absorbed implementation packages remain
            private.
          </span>
          <div class='registry'>
            <div class='registry-head' aria-hidden='true'>
              <span>Package</span>
              <span>Supported subpaths</span>
              <span>Kind</span>
            </div>
            {packages.map((pkg) => (
              <div class='pkg-row' id={pkg.id} data-kind={pkg.kind}>
                <div>
                  <span class='pkg-name'>{pkg.name}</span>
                  <span class='pkg-path'>{pkg.importPath}</span>
                  <p class='pkg-copy'>{pkg.copy}</p>
                  {pkg.notes.map((note) => <span class='pkg-note' key={note}>{note}</span>)}
                </div>
                <div class='pkg-chips'>
                  {pkg.exports.map((entry) => <span class='chip' key={entry}>{entry}</span>)}
                </div>
                <span class={`kind kind-${pkg.kind}`}>{kindLabels[pkg.kind]}</span>
              </div>
            ))}
            <footer class='footnote'>
              <p>
                ※ Internal subpaths (adapter-vite build pipeline, element hydration modules) stay
                importable for tooling but carry no compatibility promise. The public type surface
                is explicit — no export-star seams on the {OPENELEMENT_VERSION} line.
              </p>
              <p>
                Machine-checked against each package's exports map by{' '}
                <code>deno task package-surface:check</code>.
              </p>
            </footer>
          </div>
        </open-section-frame>
      </main>
    );
  }
}

defineCustomElement(tagName, ApiCorePage);
export default ApiCorePage;
