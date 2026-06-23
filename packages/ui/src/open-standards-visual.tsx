/** @jsxImportSource @openelement/core */
/**
 * @openelement/ui - open-standards-visual
 *
 * Product-art diagrams for the openElement standards lab website.
 */

import { OpenElement } from '@openelement/element';
import { StyleSheet, type StyleSheetLike } from '@openelement/core/style-sheet';

export const tagName = 'open-standards-visual';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }

  * {
    box-sizing: border-box;
  }

  .visual {
    display: grid;
    gap: var(--size-4);
    color: var(--text-primary);
  }

  .visual--high {
    gap: var(--size-5);
  }

  .hero {
    display: grid;
    gap: var(--size-4);
  }

  .hero__top {
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(0, .88fr);
    gap: var(--size-4);
  }

  .code {
    margin: 0;
    overflow: auto;
    color: var(--code-text);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: var(--font-lineheight-4);
    white-space: pre-wrap;
  }

  .mark {
    color: var(--brand-light);
  }

  .spec {
    display: grid;
    gap: var(--size-3);
  }

  .spec__row,
  .route,
  .package,
  .token,
  .stage {
    position: relative;
    display: grid;
    gap: var(--size-1);
    padding: var(--size-3);
    overflow: hidden;
    border: var(--border-size-1) solid var(--border);
    border-radius: var(--radius-2);
    background: var(--bg-card);
  }

  .route::before,
  .package::before,
  .token::before,
  .stage::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: var(--size-1);
    background: var(--brand);
    opacity: .72;
  }

  .spec__key,
  .route__path,
  .package__name,
  .token__name,
  .stage__num {
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-8);
    letter-spacing: 0;
  }

  .spec__value,
  .route__desc,
  .package__desc,
  .token__desc,
  .stage__copy {
    color: var(--text-secondary);
    font-size: var(--font-size-0);
    line-height: var(--font-lineheight-3);
  }

  .pipeline {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--size-2);
  }

  .stage {
    min-height: var(--size-16);
    background: color-mix(in srgb, var(--bg-card) 82%, var(--brand-subtle));
  }

  .visual--high .stage,
  .visual--high .route,
  .visual--high .package,
  .visual--high .token {
    background:
      linear-gradient(135deg, color-mix(in srgb, var(--brand-subtle) 64%, transparent), transparent),
      var(--bg-card);
  }

  .stage--success .stage__num,
  .package--success .package__name {
    color: var(--success);
  }

  .stage--success::before,
  .package--success::before {
    background: var(--success);
  }

  .stage--warning .stage__num,
  .package--warning .package__name {
    color: var(--warning);
  }

  .stage--warning::before,
  .package--warning::before {
    background: var(--warning);
  }

  .routes,
  .packages,
  .tokens {
    display: grid;
    gap: var(--size-3);
  }

  .route {
    grid-template-columns: minmax(0, .44fr) minmax(0, 1fr);
    align-items: start;
  }

  .package {
    grid-template-columns: minmax(0, .36fr) minmax(0, 1fr);
    align-items: start;
  }

  .tokens {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .token__swatch {
    width: var(--size-8);
    height: var(--size-5);
    border-radius: var(--radius-1);
    border: var(--border-size-1) solid var(--border);
    background: var(--bg-card);
  }

  .token--brand .token__swatch { background: var(--brand); }
  .token--success .token__swatch { background: var(--success); }
  .token--warning .token__swatch { background: var(--warning); }
  .token--info .token__swatch { background: var(--info); }
  .token--surface .token__swatch { background: var(--bg-elevated); }
  .token--code .token__swatch { background: var(--bg-code, var(--gray-11)); }

  .matrix {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--size-3);
  }

  .visual--motion .stage,
  .visual--motion .route,
  .visual--motion .package,
  .visual--motion .token {
    animation: visual-lift 7s var(--ease-2) infinite alternate;
  }

  .visual--motion .stage:nth-child(2),
  .visual--motion .route:nth-child(2),
  .visual--motion .package:nth-child(2),
  .visual--motion .token:nth-child(2) {
    animation-delay: 600ms;
  }

  .visual--motion .stage:nth-child(3),
  .visual--motion .route:nth-child(3),
  .visual--motion .package:nth-child(3),
  .visual--motion .token:nth-child(3) {
    animation-delay: 1200ms;
  }

  .visual--motion .code {
    animation: visual-code 8s var(--ease-1) infinite alternate;
  }

  @keyframes visual-lift {
    from {
      filter: brightness(1);
    }
    to {
      filter: brightness(1.12);
    }
  }

  @keyframes visual-code {
    from {
      color: var(--code-text);
    }
    to {
      color: var(--brand-light);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .visual--motion .stage,
    .visual--motion .route,
    .visual--motion .package,
    .visual--motion .token,
    .visual--motion .code {
      animation: none;
    }
  }

  @media (max-width: 760px) {
    .hero__top,
    .pipeline,
    .route,
    .package,
    .tokens,
    .matrix {
      grid-template-columns: 1fr;
    }
  }
`);

export class OpenStandardsVisual extends OpenElement {
  static override styles = [sheet];
  static override observedAttributes = ['variant', 'motion', 'emphasis'];

  override render(): ReturnType<typeof OpenElement.prototype.render> {
    const variant = this._getStr('variant', 'hero');
    const visualClass = this._visualClass();
    if (variant === 'routes') return this._routes(visualClass);
    if (variant === 'packages') return this._packages(visualClass);
    if (variant === 'tokens') return this._tokens(visualClass);
    return this._hero(visualClass);
  }

  private _getStr(attr: string, def: string): string {
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel] ??
      (this as Record<string, unknown>)[attr];
    if (prop !== undefined && prop !== null) return String(prop);
    return this.getAttribute(attr) || def;
  }

  private _visualClass(): string {
    const motion = this._getStr('motion', 'auto') === 'off' ? 'still' : 'motion';
    const emphasis = this._getStr('emphasis', 'normal') === 'high' ? 'high' : 'normal';
    return `visual visual--${emphasis} visual--${motion}`;
  }

  private _hero(visualClass: string): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <div className={`${visualClass} hero`}>
        <div className='hero__top'>
          <pre className='code'><code>{`export default app({
  routes: './app/routes',
  render: 'declarative-shadow-dom',
  islands: 'interaction-only',
  adapter: 'vite'
})`}</code></pre>
          <div className='spec' aria-label='Standards sheet'>
            <div className='spec__row'>
              <span className='spec__key'>HTML</span>
              <span className='spec__value'>
                Declarative Shadow DOM as the first rendering target
              </span>
            </div>
            <div className='spec__row'>
              <span className='spec__key'>WC</span>
              <span className='spec__value'>
                Custom elements own behavior and progressive hydration
              </span>
            </div>
            <div className='spec__row'>
              <span className='spec__key'>API</span>
              <span className='spec__value'>
                Hono endpoints sit beside pages and content routes
              </span>
            </div>
          </div>
        </div>
        <div className='pipeline' aria-label='Render pipeline'>
          <div className='stage'>
            <span className='stage__num'>01</span>
            <span className='stage__copy'>Route</span>
          </div>
          <div className='stage stage--success'>
            <span className='stage__num'>02</span>
            <span className='stage__copy'>Render DSD</span>
          </div>
          <div className='stage'>
            <span className='stage__num'>03</span>
            <span className='stage__copy'>Ship HTML</span>
          </div>
          <div className='stage stage--warning'>
            <span className='stage__num'>04</span>
            <span className='stage__copy'>Hydrate island</span>
          </div>
          <div className='stage'>
            <span className='stage__num'>05</span>
            <span className='stage__copy'>Verify</span>
          </div>
        </div>
      </div>
    );
  }

  private _routes(visualClass: string): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <div className={`${visualClass} routes`} aria-label='Route graph'>
        <div className='route'>
          <span className='route__path'>/</span>
          <span className='route__desc'>homepage lab artifact and product paths</span>
        </div>
        <div className='route'>
          <span className='route__path'>/guide/*</span>
          <span className='route__desc'>
            build path, configuration, deployment, and production flow
          </span>
        </div>
        <div className='route'>
          <span className='route__path'>/architecture/*</span>
          <span className='route__desc'>package graph, DSD, islands, and standards registry</span>
        </div>
        <div className='route'>
          <span className='route__path'>/api</span>
          <span className='route__desc'>public contract index across the product graph</span>
        </div>
      </div>
    );
  }

  private _packages(visualClass: string): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <div className={`${visualClass} packages`} aria-label='Package graph'>
        <div className='package package--success'>
          <span className='package__name'>Elements</span>
          <span className='package__desc'>
            custom elements, DSD rendering, and component contracts
          </span>
        </div>
        <div className='package'>
          <span className='package__name'>UI</span>
          <span className='package__desc'>
            Open Props primitives used by this website and consumers
          </span>
        </div>
        <div className='package package--warning'>
          <span className='package__name'>Framework</span>
          <span className='package__desc'>
            routes, layouts, content, islands, i18n, and adapter-vite
          </span>
        </div>
        <div className='package'>
          <span className='package__name'>Protocols</span>
          <span className='package__desc'>
            public boundary declarations and package compatibility language
          </span>
        </div>
      </div>
    );
  }

  private _tokens(visualClass: string): ReturnType<typeof OpenElement.prototype.render> {
    return (
      <div className={`${visualClass} tokens`} aria-label='Token board'>
        <div className='token token--surface'>
          <span className='token__swatch'></span>
          <span className='token__name'>--bg-card</span>
          <span className='token__desc'>reading surfaces</span>
        </div>
        <div className='token token--brand'>
          <span className='token__swatch'></span>
          <span className='token__name'>--brand</span>
          <span className='token__desc'>links and primary action</span>
        </div>
        <div className='token token--success'>
          <span className='token__swatch'></span>
          <span className='token__name'>--success</span>
          <span className='token__desc'>standards and shipped state</span>
        </div>
        <div className='token token--warning'>
          <span className='token__swatch'></span>
          <span className='token__name'>--warning</span>
          <span className='token__desc'>planned or directional state</span>
        </div>
        <div className='token token--info'>
          <span className='token__swatch'></span>
          <span className='token__name'>--info</span>
          <span className='token__desc'>reference and API state</span>
        </div>
        <div className='token token--code'>
          <span className='token__swatch'></span>
          <span className='token__name'>--bg-code</span>
          <span className='token__desc'>code and artifact panels</span>
        </div>
      </div>
    );
  }
}

export default OpenStandardsVisual;

if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, OpenStandardsVisual);
}
