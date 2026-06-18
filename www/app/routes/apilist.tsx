/**
 * @openelement/docs - API Reference
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
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
    grid-template-columns: minmax(220px, .24fr) minmax(0, .76fr);
    gap: var(--size-6);
    padding: var(--size-10);
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .signature-card {
    display: grid;
    gap: var(--size-3);
    min-height: 220px;
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
    copy: 'Rendering, DSD, JSX runtime, event hydration, and trust boundaries.',
    items: [
      ['renderDsd(Component, props)', 'Render a component into platform HTML with Declarative Shadow DOM.'],
      ['definePage(config)', 'Attach route metadata, loaders, actions, and document hints to a page module.'],
      ['trustRenderHtml(html)', 'Explicit trust boundary for prevalidated HTML entering the render path.'],
      ['createContext(key, value)', 'Provide typed context for framework and UI package surfaces.'],
    ],
  },
  {
    id: 'framework',
    label: 'Framework',
    title: '@openelement/app',
    copy: 'Application shell, content, i18n, routes, islands, and adapters.',
    items: [
      ['createApp(options)', 'Compose the route graph and runtime conventions for an app.'],
      ['createI18nPlugin(options)', 'Generate localized routes and data for static output.'],
      ['createContentPlugin(options)', 'Load blog, nav, sitemap, and search metadata.'],
      ['createHonoAdapter(options)', 'Bridge the app graph into a standards-friendly server boundary.'],
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
      ['<open-lab-panel>', 'Artifact, spec, and reference panel for documentation surfaces.'],
      ['openPropsTokenSheet', 'Semantic Open Props token sheet for light and dark parity.'],
    ],
  },
] as const;

export class ApiCorePage extends OpenElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (
      <main class='api-page'>
        <section class='hero'>
          <div class='hero-copy'>
            <p class='kicker'>Reference command center</p>
            <h1>API Reference</h1>
            <p class='lede'>
              Public APIs are organized by the same product surface users see in the site:
              core rendering, application framework, and UI primitives.
            </p>
          </div>
          <div class='hero-panel'>
            <open-lab-panel label='contract map' meta='v0.40.7'>
              <p class='panel-copy'>
                Start at the layer you own, then follow the signature panels to
                route metadata, DSD output, and package protocol boundaries.
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
                      <h3>{sig.split('(')[0].replace(/[<>\-]/g, ' ')}</h3>
                      <p>{copy}</p>
                    </open-card>
                  ))}
                </div>
              </section>
            ))}
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
