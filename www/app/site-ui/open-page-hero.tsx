/** @jsxImportSource @openelement/element */
/** Private WWW hero: a short technical, editorial, timeline, or error scene. */
import { OpenElement, StyleSheet } from '@openelement/element';

export const tagName = 'open-page-hero';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host{display:block;position:relative;overflow:hidden;color:var(--text-primary)}
  .hero{position:relative;display:grid;grid-template-columns:minmax(0,.58fr) minmax(300px,.42fr);gap:clamp(2rem,7vw,8rem);align-items:end;min-height:min(580px,calc(100svh - var(--nav-height)));padding:clamp(5rem,11vh,9rem) clamp(1.5rem,7vw,9rem);border-block-end:1px solid var(--border);background:radial-gradient(circle at 78% 35%,color-mix(in srgb,var(--brand) 25%,transparent),transparent 30%),linear-gradient(125deg,color-mix(in srgb,var(--violet-2) 52%,transparent),transparent 57%),var(--bg-base);isolation:isolate}
  .hero::before{content:"";position:absolute;inset:0;z-index:-1;opacity:.7;background:linear-gradient(color-mix(in srgb,var(--brand) 12%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--brand) 10%,transparent) 1px,transparent 1px);background-size:220px 132px;mask-image:linear-gradient(90deg,transparent,black 14%,black 88%,transparent)}
  .hero--editorial{background:radial-gradient(circle at 72% 25%,color-mix(in srgb,var(--violet-6) 26%,transparent),transparent 34%),linear-gradient(180deg,color-mix(in srgb,var(--violet-1) 28%,transparent),var(--bg-base))}
  .hero--timeline{background:linear-gradient(90deg,color-mix(in srgb,var(--violet-2) 50%,transparent),transparent 58%),var(--bg-base)}
  .hero--error{grid-template-columns:1fr;justify-items:center;text-align:center;min-height:min(620px,calc(100svh - var(--nav-height)))}
  .copy{display:grid;align-content:end}.eyebrow{margin:0 0 var(--size-5);color:var(--brand);font-family:var(--font-mono);font-size:var(--font-size-00);font-weight:var(--font-weight-8);letter-spacing:.08em;text-transform:uppercase}.title{max-width:850px;margin:0;font-size:clamp(3rem,7vw,7.5rem);line-height:.88;letter-spacing:-.07em}.lede{max-width:720px;margin:var(--size-6) 0 0;color:var(--text-secondary);font-size:clamp(1rem,1.5vw,1.25rem);line-height:1.6}.artifact{min-width:0;align-self:center}.hero--error .artifact{display:none}@media(max-width:760px){.hero{grid-template-columns:1fr;min-height:auto;padding:var(--size-11) var(--size-4)}.artifact{width:100%}.title{font-size:clamp(2.6rem,13vw,4.8rem)}}
`);

export default class OpenPageHero extends OpenElement {
  static override styles = [sheet];
  override render() {
    const variant = this.getAttribute('variant') || 'technical';
    return (
      <section class={`hero hero--${variant}`} part='hero'>
        <div class='copy'>
          <p class='eyebrow'>
            <slot name='eyebrow'></slot>
          </p>
          <h1 class='title'>
            <slot name='title'></slot>
          </h1>
          <div class='lede'>
            <slot name='lede'></slot>
          </div>
        </div>
        <div class='artifact'>
          <slot name='artifact'></slot>
        </div>
      </section>
    );
  }
}
customElements.define(tagName, OpenPageHero);
