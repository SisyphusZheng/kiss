/**
 * @openelement/docs - API Reference
 *
 * Editorial reference command center for public APIs.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';
import '@openelement/ui/open-badge';
import '@openelement/ui/open-lab-panel';

export const tagName = 'api-core-page';
export const meta = { section: 'Reference', label: 'API Reference', order: 5 };

const routeSheet = new StyleSheet();
routeSheet.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
  }

  * {
    box-sizing: border-box;
  }

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
    grid-template-columns: minmax(0, .74fr) minmax(340px, .36fr);
    min-height: 430px;
    overflow: hidden;
    border-block-end: var(--border-size-1) solid var(--border);
    background:
      linear-gradient(112deg, var(--violet-2), transparent 48%),
      radial-gradient(circle at 84% 42%, color-mix(in srgb, var(--brand-light) 22%, transparent), transparent 34%),
      var(--bg-base);
  }

  .hero::after {
    content: "";
    position: absolute;
    inset-inline-end: var(--size-10);
    inset-block-start: 50%;
    width: 360px;
    aspect-ratio: 1;
    transform: translateY(-50%);
    border: var(--size-6) solid color-mix(in srgb, var(--brand) 20%, transparent);
    border-radius: var(--radius-round);
    pointer-events: none;
  }

  .hero-copy,
  .hero-card {
    position: relative;
    z-index: 1;
    padding: var(--size-10);
  }

  .hero-copy {
    display: grid;
    align-content: end;
    border-inline-end: var(--border-size-1) solid var(--border);
  }

  .kicker,
  .rail-title,
  .category-kicker,
  .api-sig {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    text-transform: uppercase;
  }

  .kicker {
    margin-block-end: var(--size-4);
  }

  h1 {
    margin: 0;
    max-width: 780px;
    font-size: var(--font-size-7);
    line-height: .9;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .lede {
    max-width: 740px;
    margin-block: var(--size-5) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-2);
    line-height: 1.28;
  }

  .hero-card open-lab-panel {
    height: 100%;
  }

  .quick-list {
    display: grid;
    gap: var(--size-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .quick-list li {
    display: flex;
    justify-content: space-between;
    gap: var(--size-4);
    padding-block: var(--size-3);
    border-block-end: var(--border-size-1) solid var(--border);
    color: var(--text-secondary);
    font-size: var(--font-size-0);
  }

  .quick-list li:last-child {
    border-block-end: 0;
  }

  .quick-list strong {
    color: var(--text-primary);
    font-weight: var(--font-weight-8);
  }

  .content {
    display: grid;
    grid-template-columns: minmax(220px, .24fr) minmax(0, 1fr);
    gap: var(--size-5);
    padding: var(--size-5);
  }

  .rail {
    align-self: start;
    position: sticky;
    top: calc(var(--nav-height) + var(--size-5));
    display: grid;
    gap: var(--size-4);
    padding: var(--size-5);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-3);
    background: color-mix(in srgb, var(--bg-card) 78%, transparent);
  }

  .rail a {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-7);
    text-decoration: none;
  }

  .rail a:hover {
    color: var(--brand);
  }

  .api-sections {
    display: grid;
    gap: var(--size-5);
  }

  .category {
    display: grid;
    gap: var(--size-4);
    padding: var(--size-6);
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-3);
    background: color-mix(in srgb, var(--bg-card) 72%, transparent);
  }

  .category-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--size-4);
    align-items: end;
    padding-block-end: var(--size-4);
    border-block-end: var(--border-size-1) solid var(--border);
  }

  .category h2 {
    margin: 0;
    font-size: var(--font-size-4);
    line-height: 1;
    font-weight: var(--font-weight-9);
    letter-spacing: 0;
  }

  .category p {
    margin-block: var(--size-2) 0;
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .entry-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--size-4);
  }

  .api-entry {
    min-height: 184px;
  }

  .api-sig {
    display: block;
    margin-block-end: var(--size-4);
    color: var(--text-primary);
    text-transform: none;
    overflow-wrap: anywhere;
  }

  .api-desc {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  @media (max-width: 1120px) {
    .hero,
    .content,
    .entry-grid {
      grid-template-columns: 1fr;
    }

    .hero-copy {
      border-inline-end: 0;
      border-block-end: var(--border-size-1) solid var(--border);
    }

    .rail {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .hero-copy,
    .hero-card,
    .category {
      padding: var(--size-5) var(--size-4);
    }

    .content {
      padding: var(--size-4);
    }

    h1 {
      font-size: var(--font-size-6);
      line-height: .94;
    }

    .lede {
      font-size: var(--font-size-1);
    }
  }
`);

const categories = [
  {
    id: 'application',
    kicker: 'Application',
    title: 'Application API',
    intro: 'Route descriptors, lifecycle controls, and island metadata for app authors.',
    entries: [
      ['definePage({ route, head, renderIntent, render, error })', 'Defines a file-route page through the canonical object descriptor.'],
      ['redirect(location, status?): never', 'Throws typed redirect control consumed by request-time and SSG rendering.'],
      ['notFound(message?): never', 'Throws typed not-found control consumed by the framework boundary.'],
      ['defineIslandConfig({ ssr, dsd, hydrate })', 'Defines static island metadata for adapter scanning.'],
      ['defineIsland(tagName, render, { hydrate, dsd, ssr })', 'Defines browser-upgraded UI with JSX handlers and hydration strategy.'],
    ],
  },
  {
    id: 'components',
    kicker: 'Elements',
    title: 'Components',
    intro: 'The custom element contract used by DSD components and client islands.',
    entries: [
      ['class OpenElement extends HTMLElement', 'Base class for DSD components returning JSX VNodes.'],
      ['override render(): VNode | null', 'The component render contract. JSX escapes text and preserves native event handlers.'],
      ['static props: Record<string, typeof String | Number | Boolean>', 'Declares typed properties, observed attributes, and kebab-case mapping.'],
    ],
  },
  {
    id: 'rendering',
    kicker: 'Render',
    title: 'Rendering',
    intro: 'Server and DOM render entrypoints for platform HTML output.',
    entries: [
      ['renderDsd(vnode, options): Promise<RenderOutput>', 'The single DSD rendering entry. Props, sourceInfo, options, and hooks pass through options.'],
      ['renderDsdStream(components, options): ReadableStream<Uint8Array>', 'Streams document shell and DSD component chunks through Web Streams.'],
      ['renderToDom(node, host?, disposers?): Node', 'Converts a VNode tree to DOM with native listeners and fine-grained signal props.'],
      ['renderDsdTree(node): Promise<string>', 'Converts a VNode tree to SSR or SSG HTML with explicit trusted HTML boundaries.'],
    ],
  },
  {
    id: 'islands',
    kicker: 'Hydrate',
    title: 'Islands',
    intro: 'Hydration metadata and SSR prop restoration for interactive surfaces.',
    entries: [
      ['defineIsland(tagName, componentClass, options)', 'Declares island metadata and upgrade strategy: load, idle, visible, or only.'],
      ['bindSsrProps(element: HTMLElement): void', 'Restores only data-ssr-props from SSR. Events come from JSX markers and handlers.'],
    ],
  },
  {
    id: 'signals-build',
    kicker: 'Runtime',
    title: 'Signals & Build',
    intro: 'Reactive primitives and the Vite plugin pipeline that assembles routes and islands.',
    entries: [
      ['signal<T>(initial: T): Signal<T>', 'Creates a reactive value. JSX props automatically subscribe when a signal is passed.'],
      ['computed<T>(fn: () => T): Signal<T>', 'Creates a memoized read-only signal derived from other signals.'],
      ['effect(fn: () => void): () => void', 'Runs when tracked signals change and returns a disposer.'],
      ['openPipeline(options, ctx): Plugin[]', 'Creates the Vite plugin pipeline for routes, entries, manifests, SSR, and SSG.'],
    ],
  },
] as const;

export default class ApiCorePage extends OpenElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (
      <main class='api-page'>
        <section class='hero'>
          <div class='hero-copy'>
            <p class='kicker'>Reference command center</p>
            <h1>API Reference</h1>
            <p class='lede'>
              Public APIs grouped by the way engineers use openElement: author a route,
              render platform HTML, hydrate islands, and inspect package boundaries.
            </p>
          </div>
          <div class='hero-card'>
            <open-lab-panel label='public surface' meta='current line'>
              <ul class='quick-list'>
                <li><strong>Application</strong><span>route contract</span></li>
                <li><strong>Elements</strong><span>custom elements</span></li>
                <li><strong>Rendering</strong><span>DSD output</span></li>
                <li><strong>Islands</strong><span>hydration metadata</span></li>
                <li><strong>Build</strong><span>plugin pipeline</span></li>
              </ul>
            </open-lab-panel>
          </div>
        </section>

        <section class='content'>
          <nav class='rail' aria-label='API categories'>
            <span class='rail-title'>Categories</span>
            {categories.map((category) => <a href={`#${category.id}`}>{category.title}</a>)}
          </nav>

          <div class='api-sections'>
            {categories.map((category) => (
              <section class='category' id={category.id}>
                <div class='category-head'>
                  <div>
                    <span class='category-kicker'>{category.kicker}</span>
                    <h2>{category.title}</h2>
                    <p>{category.intro}</p>
                  </div>
                  <open-badge tone='brand'>{String(category.entries.length).padStart(2, '0')}</open-badge>
                </div>
                <div class='entry-grid'>
                  {category.entries.map(([signature, description]) => (
                    <open-lab-panel class='api-entry' label='contract' meta='typed'>
                      <code class='api-sig'>{signature}</code>
                      <p class='api-desc'>{description}</p>
                    </open-lab-panel>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    );
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, ApiCorePage);
}
