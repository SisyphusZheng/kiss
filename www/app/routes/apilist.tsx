/** @openelement/docs - supported API reference */
import { OpenElement, StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/site-ui/open-page-hero.tsx';
import '@openelement/site-ui/open-reading-shell.tsx';
import '@openelement/site-ui/open-page-rail.tsx';
import '@openelement/site-ui/open-artifact-panel.tsx';
import '@openelement/site-ui/open-section-frame.tsx';
import { OPENELEMENT_VERSION } from '../data/version.ts';

export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host { display: block; color: var(--text-primary); }
  * { box-sizing: border-box; }
  .kicker, .section-kicker, .surface { color: var(--brand); font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-8); text-transform: uppercase; }
  h1 { max-width: 780px; margin: var(--size-4) 0; font-size: var(--font-size-7); line-height: .94; font-weight: var(--font-weight-9); }
  h2 { margin: 0; font-size: var(--font-size-4); }
  h3 { margin: var(--size-2) 0; font-size: var(--font-size-3); }
  .lede, p, li { color: var(--text-secondary); line-height: var(--font-lineheight-4); }
  .lede { max-width: 720px; font-size: var(--font-size-3); }
  .api-grid { display: grid; gap: var(--size-7); }
  .section-head { display: grid; grid-template-columns: minmax(0, .45fr) minmax(0, .55fr); gap: var(--size-6); }
  .package-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--size-4); }
  .package-card { min-height: 100%; }
  .card-top { display: flex; justify-content: space-between; gap: var(--size-3); }
  .sig { display: block; overflow-x: auto; padding: var(--size-2); color: var(--brand); background: var(--code-bg); font-family: var(--font-mono); font-size: var(--font-size-00); }
  ul { padding-inline-start: var(--size-4); }
  @media (max-width: 860px) { .section-head, .package-grid { grid-template-columns: 1fr; } }
`);

type ApiPackage = { id: string; title: string; copy: string; importPath: string; exports: string[]; notes: string[] };

const packages: ApiPackage[] = [
  {
    id: 'element', title: '@openelement/element',
    copy: 'The supported Custom Element authoring surface for JSX, DSD, hydration, signals and styles.',
    importPath: '@openelement/element', exports: ['root', 'jsx-runtime', 'jsx-dev-runtime'],
    notes: ['Start here for standalone element authoring.', 'Use `defineElement`, `OpenElement`, `StyleSheet` and signal helpers without importing renderer internals.'],
  },
  {
    id: 'app', title: '@openelement/app',
    copy: 'The application surface for pages, routes, islands and request/render semantics.',
    importPath: '@openelement/app', exports: ['root', 'documented app modes'],
    notes: ['Use `definePage`, `defineIsland` and `defineApp` for application authoring.', 'The router and request-driver implementation are internal product knowledge.'],
  },
  {
    id: 'adapter-vite', title: '@openelement/adapter-vite',
    copy: 'The official Vite, content, static-build and Nitro output adapter.',
    importPath: '@openelement/adapter-vite', exports: ['root', 'nitro-mount', 'cli/build'],
    notes: ['Use `buildApp()` or the generated build task.', 'Plugin ordering, manifests and content scans are adapter implementation details.'],
  },
  {
    id: 'create', title: '@openelement/create',
    copy: 'The installed starter and zero-context consumer entrypoint.',
    importPath: 'npm:@openelement/create', exports: ['CLI binary'],
    notes: ['Generated projects expose `dev`, `check`, `test`, `build` and `preview`.', 'The starter imports product packages only.'],
  },
  {
    id: 'ui', title: '@openelement/ui (optional)',
    copy: 'Optional primitives retained only when they have demonstrated reusable behavior.',
    importPath: '@openelement/ui', exports: ['root', 'retained primitive subpaths'],
    notes: ['UI is not required to use OpenElement.', 'Website-specific brand, hero, lab and layout artifacts are not UI package contracts.'],
  },
];

export class ApiCorePage extends OpenElement {
  static override styles = [routeSheet];
  override render() {
    return <main>
      <open-page-hero variant='technical'>
        <span slot='eyebrow'>Public contract</span><span slot='title'>API Reference</span><span slot='lede'>The {OPENELEMENT_VERSION} published line documents only the five consumer packages. Retired alpha packages and internal subpaths are not authoring surfaces.</span>
        <open-artifact-panel slot='artifact'><span slot='label'>five-package surface</span><span slot='meta'>{OPENELEMENT_VERSION}</span><p>Element, App and Build interfaces stay small so authors do not need renderer, protocol, router or build-phase internals.</p><open-button href='/guide/getting-started'>Start building</open-button></open-artifact-panel>
      </open-page-hero>
      <open-reading-shell rail>
        <open-page-rail slot='rail' items={JSON.stringify(packages.map((pkg) => ({ id: pkg.id, label: pkg.title })))}></open-page-rail>
        <div class='api-grid'>
          <open-section-frame><span slot='index'>01 / interface rule</span><span slot='title'>Authoring starts at product packages.</span><span slot='copy'>Current documentation, starters and dogfood use the five supported interfaces. Future load, action, form and revalidation capabilities are roadmap work, not current stable claims.</span></open-section-frame>
          <open-section-frame><span slot='index'>02 / supported surface</span><span slot='title'>Five products, one application path.</span><span slot='copy'>Each package owns a distinct consumer decision; absorbed implementation packages remain private.</span><div class='package-grid'>{packages.map((pkg) => <open-card class='package-card' id={pkg.id}><div class='card-top'><div><span class='surface'>Supported product</span><h3>{pkg.title}</h3></div><open-badge tone='brand'>{pkg.exports.length} entries</open-badge></div><p>{pkg.copy}</p><code class='sig'>{pkg.importPath}</code><ul><li>Supported entries: {pkg.exports.join(', ')}</li>{pkg.notes.map((note) => <li>{note}</li>)}</ul></open-card>)}</div></open-section-frame>
        </div>
      </open-reading-shell>
    </main>;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, ApiCorePage);
export default ApiCorePage;
