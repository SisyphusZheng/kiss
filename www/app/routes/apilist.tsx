/**
 * @openelement/docs - API Reference
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-button';
import '@openelement/ui/open-card';
import '@openelement/ui/open-lab-panel';

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
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, .68fr) minmax(360px, .32fr);
    min-height: 500px;
    overflow: hidden;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(112deg, color-mix(in srgb, var(--brand-pale) 72%, transparent), transparent 48%),
      radial-gradient(circle at 86% 42%, color-mix(in srgb, var(--brand-light) 20%, transparent), transparent 32%),
      var(--bg-base);
  }

  .hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(color-mix(in srgb, var(--brand) 12%, transparent) var(--border-size-1), transparent var(--border-size-1)),
      linear-gradient(90deg, color-mix(in srgb, var(--brand) 9%, transparent) var(--border-size-1), transparent var(--border-size-1));
    background-size: 210px 128px;
    mask-image: linear-gradient(90deg, transparent, black 12%, black 94%, transparent);
  }

  .hero-copy,
  .hero-panel {
    position: relative;
    z-index: 1;
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
  .sig {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1 {
    max-width: 760px;
    margin: var(--size-4) 0;
    font-size: var(--font-size-7);
    line-height: .9;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .lede {
    max-width: 700px;
    color: var(--text-secondary);
    font-size: var(--font-size-3);
    line-height: 1.22;
  }

  .shell {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr) 180px;
    gap: var(--size-6);
    width: min(1180px, calc(100% - var(--size-10)));
    margin-inline: auto;
    padding: var(--size-10) 0;
    border-block-end: var(--border-size-1) solid var(--border);
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

  .toc {
    position: sticky;
    top: calc(var(--nav-height) + var(--size-5));
    align-self: start;
    display: grid;
    gap: var(--size-2);
    padding-inline-start: var(--size-4);
    border-inline-start: var(--border-size-1) solid var(--border);
  }

  .api-grid {
    display: grid;
    gap: var(--size-6);
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
    max-width: 540px;
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .signature-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--size-4);
  }

  .signature-card {
    display: grid;
    gap: var(--size-3);
    min-height: 180px;
  }

  .sig {
    display: block;
    padding: var(--size-3);
    overflow-x: auto;
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-3);
    background: var(--bg-code);
    color: var(--code-text);
    text-transform: none;
    white-space: nowrap;
  }

  .signature-card h3 {
    margin: 0;
    font-size: var(--font-size-3);
  }

  .signature-card p,
  .panel-copy,
  .signature-card li {
    color: var(--text-secondary);
    line-height: 1.55;
  }

  .signature-card ul {
    display: grid;
    gap: var(--size-2);
    margin: 0;
    padding-inline-start: var(--size-5);
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

    .toc {
      display: none;
    }

    .signature-grid {
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

    .rail {
      grid-template-columns: 1fr;
    }

    .section-head {
      display: grid;
    }
  }
`);

const groups = [
  {
    id: 'core',
    label: 'Core',
    title: '@openelement/core',
    copy: 'Runtime utilities and trust-boundary helpers exported by the core package.',
    items: [
      ['OpenElement runtime contracts', 'Core exports are consumed by generated code, UI primitives, and route rendering.'],
      ['escapeAttr / escapeHtml boundary', 'Escaping helpers are used where user-provided strings enter generated HTML.'],
      ['trustRenderHtml(html)', 'Explicit trust boundary for prevalidated HTML entering the render path.'],
    ],
  },
  {
    id: 'app',
    label: 'App',
    title: '@openelement/app',
    copy: 'Application shell, content plugin, i18n data, routes, and island metadata.',
    items: [
      ['defineIslandConfig({ hydrate, ssr, dsd })', 'Island metadata used by interactive components such as home-console.'],
      ['Generated nav data', 'The docs sidebar and site navigation are generated from route metadata.'],
      ['Generated i18n data', 'Localized route output is produced by the app/content pipeline.'],
    ],
  },
  {
    id: 'ui',
    label: 'UI',
    title: '@openelement/ui',
    copy: 'Open Props primitives used by the site and exposed to consumers.',
    items: [
      ['<open-layout>', 'Navigation shell, docs sidebar, footer, theme, locale, and SPA transitions.'],
      ['<open-brand-mark>', 'Aperture O brand primitive shared by header and visual surfaces.'],
      ['<open-button> / <open-card> / <open-badge>', 'Reusable primitives backed by openPropsTokenSheet.'],
      ['<open-lab-panel>', 'Artifact, spec, and reference panel for documentation surfaces.'],
      ['openPropsTokenSheet', 'Semantic Open Props token sheet for light and dark parity.'],
    ],
  },
  {
    id: 'build',
    label: 'Build',
    title: '@openelement/adapter-vite + @openelement/ssg',
    copy: 'Build-time route scanning, static generation, client islands, sitemap, and PWA output.',
    items: [
      ['deno task build', 'Runs the adapter build and SSG pipeline for the www site.'],
      ['Route metadata', 'The build generates route types, nav data, search index, sitemap, and localized pages.'],
      ['Client islands', 'Interactive islands are emitted as separate client assets after static generation.'],
    ],
  },
] as const;

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
              Public surfaces are organized by actual package boundaries and
              generated website contracts. The left rail is the only category
              navigation; the right rail tracks the current reference sections.
            </p>
          </div>
          <div class='hero-panel'>
            <open-lab-panel label='contract map' meta='v0.40.8'>
              <p class='panel-copy'>
                Start at the package you own, then follow the section anchors to
                generated route metadata, UI primitives, and build output.
              </p>
              <open-button href='/guide/api'>Read API guide</open-button>
            </open-lab-panel>
          </div>
        </section>

        <div class='shell'>
          <aside class='rail' aria-label='API categories'>
            {groups.map((group) => <a class='rail-link' href={`#${group.id}`}>{group.label}</a>)}
          </aside>
          <div class='api-grid'>
            {groups.map((group) => (
              <section class='api-section' id={group.id}>
                <div class='section-head'>
                  <div>
                    <p class='section-kicker'>{group.label}</p>
                    <h2>{group.title}</h2>
                  </div>
                  <p>{group.copy}</p>
                </div>
                <div class='signature-grid'>
                  {group.items.map(([sig, copy]) => (
                    <open-card class='signature-card'>
                      <code class='sig'>{sig}</code>
                      <h3>{sig.replace(/[<>\-]/g, ' ')}</h3>
                      <p>{copy}</p>
                    </open-card>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <aside class='toc' aria-label='On this page'>
            <span class='section-kicker'>On this page</span>
            {groups.map((group) => <a class='rail-link' href={`#${group.id}`}>{group.title}</a>)}
          </aside>
        </div>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, ApiCorePage);
}

export default ApiCorePage;
