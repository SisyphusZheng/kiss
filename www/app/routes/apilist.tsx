/** @openelement/docs - supported API reference */
import { OpenElement, StyleSheet } from '@openelement/element';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/site-ui/open-lab-panel.tsx';
import { OPENELEMENT_VERSION } from '../data/version.ts';

export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host { display: block; color: var(--text-primary); }
  * { box-sizing: border-box; }
  .hero { display: grid; grid-template-columns: minmax(0, .68fr) minmax(320px, .32fr); min-height: 420px; border-block-end: var(--border-size-1) solid var(--border); background: linear-gradient(112deg, color-mix(in srgb, var(--brand-pale) 56%, transparent), transparent 44%), var(--bg-base); }
  .hero-copy, .hero-panel { display: grid; align-content: end; padding: var(--size-10); }
  .hero-copy { border-inline-end: var(--border-size-1) solid var(--border); }
  .kicker, .section-kicker, .surface { color: var(--brand); font-family: var(--font-mono); font-size: var(--font-size-00); font-weight: var(--font-weight-8); text-transform: uppercase; }
  h1 { max-width: 780px; margin: var(--size-4) 0; font-size: var(--font-size-7); line-height: .94; font-weight: var(--font-weight-9); }
  h2 { margin: 0; font-size: var(--font-size-4); }
  h3 { margin: var(--size-2) 0; font-size: var(--font-size-3); }
  .lede, p, li { color: var(--text-secondary); line-height: var(--font-lineheight-4); }
  .lede { max-width: 720px; font-size: var(--font-size-3); }
  .shell { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: var(--size-7); width: min(1180px, calc(100% - var(--size-10))); margin-inline: auto; padding: var(--size-10) 0; }
  .rail { position: sticky; top: calc(var(--nav-height) + var(--size-5)); align-self: start; display: grid; gap: var(--size-2); }
  .rail-link { display: block; padding: var(--size-3) 0; color: var(--text-muted); font-family: var(--font-mono); font-size: var(--font-size-00); text-decoration: none; border-block-end: var(--border-size-1) solid var(--border); }
  .api-grid { display: grid; gap: var(--size-7); }
  .section-head { display: grid; grid-template-columns: minmax(0, .45fr) minmax(0, .55fr); gap: var(--size-6); }
  .package-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--size-4); }
  .package-card { min-height: 100%; }
  .card-top { display: flex; justify-content: space-between; gap: var(--size-3); }
  .sig { display: block; overflow-x: auto; padding: var(--size-2); color: var(--brand); background: var(--code-bg); font-family: var(--font-mono); font-size: var(--font-size-00); }
  ul { padding-inline-start: var(--size-4); }
  @media (max-width: 860px) { .hero, .shell, .section-head, .package-grid { grid-template-columns: 1fr; } .hero-copy, .hero-panel { padding: var(--size-7) var(--size-4); } .rail { position: static; grid-template-columns: repeat(2, minmax(0, 1fr)); } }
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
      <section class='hero'>
        <div class='hero-copy'><p class='kicker'>Public contract</p><h1>API Reference</h1><p class='lede'>The {OPENELEMENT_VERSION} published line documents only the five consumer packages. Retired alpha packages and internal subpaths are not authoring surfaces.</p></div>
        <div class='hero-panel'><open-lab-panel label='five-package surface' meta={OPENELEMENT_VERSION}><p>OpenElement keeps Element, App and Build interfaces small so authors do not need to learn renderer, protocol, router or build-phase implementation.</p><open-button href='/guide/getting-started'>Start building</open-button></open-lab-panel></div>
      </section>
      <div class='shell'>
        <aside class='rail' aria-label='API packages'>{packages.map((pkg) => <a class='rail-link' href={`#${pkg.id}`}>{pkg.title}</a>)}</aside>
        <div class='api-grid'>
          <section><div class='section-head'><div><p class='section-kicker'>Surface rule</p><h2>Authoring starts at product packages.</h2></div><p>Current documentation, starters and dogfood use the five supported interfaces. Future load, action, form and revalidation capabilities are roadmap work, not current stable claims.</p></div></section>
          <div class='package-grid'>{packages.map((pkg) => <open-card class='package-card' id={pkg.id}><div class='card-top'><div><span class='surface'>Supported product</span><h3>{pkg.title}</h3></div><open-badge tone='brand'>{pkg.exports.length} entries</open-badge></div><p>{pkg.copy}</p><code class='sig'>{pkg.importPath}</code><ul><li>Supported entries: {pkg.exports.join(', ')}</li>{pkg.notes.map((note) => <li>{note}</li>)}</ul></open-card>)}</div>
        </div>
      </div>
    </main>;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) customElements.define(tagName, ApiCorePage);
export default ApiCorePage;
