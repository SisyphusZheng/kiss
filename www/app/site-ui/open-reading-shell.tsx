/** @jsxImportSource @openelement/element */
/** Private WWW long-form reading shell. */
import { OpenElement, StyleSheet } from '@openelement/element';
export const tagName = 'open-reading-shell';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host{display:block}.shell{width:min(1180px,calc(100% - 3rem));margin:auto;padding:clamp(3rem,8vh,7rem) 0 clamp(5rem,12vh,10rem);display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(2rem,7vw,7rem)}:host([rail]) .shell{grid-template-columns:minmax(0,1fr) 210px}.main{min-width:0;max-width:740px}:host(:not([rail])) .main{margin-inline:auto}.meta{display:none;margin-block-end:var(--size-8);padding-block-end:var(--size-5);border-block-end:1px solid var(--border)}:host([meta]) .meta{display:block}.rail{display:none;position:sticky;top:calc(var(--nav-height) + var(--size-6));align-self:start;padding:var(--size-4);border:1px solid color-mix(in srgb,var(--border) 75%,var(--brand));border-radius:var(--radius-2);background:color-mix(in srgb,var(--bg-elevated) 72%,transparent);box-shadow:inset 0 1px 0 var(--edge-highlight)}:host([rail]) .rail{display:block}.rail-label{margin:0 0 var(--size-3);color:var(--brand);font-size:var(--font-size-00);font-weight:var(--font-weight-8);text-transform:uppercase}.footer{display:none;margin-block-start:var(--size-10);padding-block-start:var(--size-5);border-block-start:1px solid var(--border)}:host([footer]) .footer{display:block}.pager{display:flex;justify-content:space-between;gap:var(--size-4)}.pager a{color:var(--brand);font-size:var(--font-size-00);text-decoration:none}.pager a:last-child{text-align:end}@media(max-width:900px){.shell,:host([rail]) .shell{grid-template-columns:1fr;width:min(100% - 2rem,740px);padding-block:var(--size-9)}.main{max-width:none}.rail{position:static;order:-1}}
`);
export default class OpenReadingShell extends OpenElement {
  static override styles = [sheet];
  override render() {
    const previous = this.getAttribute('previous');
    const next = this.getAttribute('next');
    const previousLabel = this.getAttribute('previous-label') ?? 'Previous';
    const nextLabel = this.getAttribute('next-label') ?? 'Next';
    return (
      <div class='shell'>
        <article class='main'>
          <span id='start' tabindex='-1'></span>
          <header class='meta'>
            <slot name='meta'></slot>
          </header>
          <slot></slot>
          <footer class='footer'>
            <slot name='footer'>
              <nav class='pager' aria-label='Page navigation'>
                {previous ? <a href={previous}>← {previousLabel}</a> : <span></span>}
                {next ? <a href={next}>{nextLabel} →</a> : <span></span>}
              </nav>
            </slot>
          </footer>
        </article>
        <aside class='rail' aria-label='On this page'>
          <p class='rail-label'>On this page</p>
          <slot name='rail'></slot>
        </aside>
      </div>
    );
  }
}
customElements.define(tagName, OpenReadingShell);
