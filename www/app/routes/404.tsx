/**
 * 404 Not Found Page - v4 recovery scene: outlined giant code with one solid
 * digit, serif accent line, square actions, and a standards marquee.
 */
import { OpenElement } from '@openelement/element';
import { StyleSheet } from '@openelement/element';
import '@openelement/ui/open-button';

const marqueeText =
  'CUSTOM ELEMENTS ✳ SHADOW DOM ✳ DECLARATIVE SHADOW DOM ✳ ES MODULES ✳ SIGNALS ✳ HTML FIRST ✳ 404 ✳ ';

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
    color: var(--text-primary);
    background: var(--bg-base);
  }

  * {
    box-sizing: border-box;
  }

  h1,
  p {
    margin: 0;
  }

  .stage {
    position: relative;
    isolation: isolate;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: var(--size-5);
    min-height: calc(100svh - var(--nav-height) - var(--size-12));
    padding: clamp(3rem, 8vh, 6rem) var(--size-6);
    text-align: center;
    background:
      radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--violet-5) 18%, transparent), transparent 55%),
      var(--bg-base);
  }

  .stage::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image:
      linear-gradient(color-mix(in srgb, var(--violet-6) 7%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--violet-6) 7%, transparent) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(circle at 50% 45%, black, transparent 75%);
  }

  .code {
    display: flex;
    font-family: var(--font-mono);
    font-size: clamp(9rem, 26vw, 24rem);
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -0.06em;
    color: transparent;
    -webkit-text-stroke: 1.5px color-mix(in srgb, var(--violet-5) 55%, transparent);
    user-select: none;
  }

  .code .solid {
    color: var(--text-primary);
    -webkit-text-stroke: 0;
  }

  .serif-line {
    font-family: var(--font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: clamp(2rem, 5vw, 4rem);
    letter-spacing: -0.01em;
    color: var(--violet-8);
  }

  .lede {
    max-width: 34rem;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    line-height: 1.75;
  }

  .requested {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
  }

  .requested code {
    padding: 0.125rem 0.375rem;
    border: 0.5px solid var(--border);
    border-radius: var(--radius-1);
    background: var(--bg-surface);
    color: var(--text-secondary);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--size-3);
    margin-block-start: var(--size-3);
  }

  .marquee {
    overflow: hidden;
    white-space: nowrap;
    border-block: 1px solid var(--border);
    background: var(--surface-1);
  }

  .marquee span {
    display: inline-block;
    padding: var(--size-3) 0;
    color: var(--brand);
    font-family: var(--font-mono);
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    letter-spacing: 0.12em;
    animation: marquee 36s linear infinite;
  }

  @keyframes marquee {
    to {
      transform: translateX(-50%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .marquee span {
      animation: none;
    }
  }
`);

export default class Page404 extends OpenElement {
  static override styles = [styles];
  override render() {
    const locale = this._getLocale('en');
    const homeHref = locale === 'en' ? '/' : '/zh/';
    const docsHref = locale === 'en' ? '/docs' : '/zh/docs';
    const requestedPath = typeof globalThis.location === 'undefined'
      ? '/404'
      : globalThis.location.pathname;
    return (
      <main class='notfound'>
        <section class='stage'>
          <h1 class='code' aria-label='404'>
            <span aria-hidden='true'>4</span>
            <span class='solid' aria-hidden='true'>0</span>
            <span aria-hidden='true'>4</span>
          </h1>
          <p class='serif-line'>Lost in the shadow DOM.</p>
          <p class='lede'>
            This route never mounted. The page you want is probably one declarative template away.
          </p>
          <p class='requested'>
            Requested path: <code>{requestedPath}</code>
          </p>
          <div class='actions'>
            <open-button variant='primary' href={homeHref}>
              Back home
            </open-button>
            <open-button href={docsHref}>
              Read the docs
            </open-button>
          </div>
        </section>
        <div class='marquee' aria-hidden='true'>
          <span>{marqueeText + marqueeText}</span>
        </div>
      </main>
    );
  }
}

customElements.define('page-404', Page404);
export const tagName = 'page-404';
