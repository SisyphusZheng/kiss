/** @jsxImportSource @openelement/element */
/** Private WWW long-form reading shell. */
import { OpenElement, StyleSheet } from '@openelement/element';
import type { ReadingMetadata, ReadingNavigation } from './page-contract.ts';
export const tagName = 'open-reading-shell';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host{display:block}.shell{width:min(1180px,calc(100% - 3rem));margin:auto;padding:clamp(3rem,8vh,7rem) 0 clamp(5rem,12vh,10rem);display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(2rem,7vw,7rem)}:host([rail]) .shell{grid-template-columns:minmax(0,1fr) 210px}.main{min-width:0;max-width:740px;line-height:1.7}:host(:not([rail])) .main{margin-inline:auto}.meta{display:none;margin-block-end:var(--size-8);padding-block-end:var(--size-5);border-block-end:1px solid var(--border)}:host([meta]) .meta,:host([metadata]) .meta{display:block}.breadcrumb{margin:0 0 var(--size-3);color:var(--brand);font-size:var(--font-size-00);font-weight:var(--font-weight-8);text-transform:uppercase}.meta h1{margin:0;line-height:1}.lede{color:var(--text-secondary)}.meta-row{display:flex;flex-wrap:wrap;gap:var(--size-2);color:var(--text-muted);font-size:var(--font-size-00)}.rail{display:none;position:sticky;top:calc(var(--nav-height) + var(--size-6));align-self:start;padding:var(--size-4);border:1px solid color-mix(in srgb,var(--border) 75%,var(--brand));border-radius:var(--radius-2);background:color-mix(in srgb,var(--bg-elevated) 72%,transparent);box-shadow:inset 0 1px 0 var(--edge-highlight)}:host([rail]) .rail{display:block}.rail-label{margin:0 0 var(--size-3);color:var(--brand);font-size:var(--font-size-00);font-weight:var(--font-weight-8);text-transform:uppercase}.footer{display:none;margin-block-start:var(--size-10);padding-block-start:var(--size-5);border-block-start:1px solid var(--border)}:host([footer]) .footer,:host([navigation]) .footer{display:block}.pager{display:flex;justify-content:space-between;gap:var(--size-4)}.pager a{color:var(--brand);font-size:var(--font-size-00);text-decoration:none}.pager a:last-child{text-align:end}@media(max-width:900px){.shell,:host([rail]) .shell{grid-template-columns:1fr;width:min(100% - 2rem,740px);padding-block:var(--size-9)}.main{max-width:none}.rail{position:static;order:-1;padding:0;border:0;background:transparent;box-shadow:none}.rail-label{display:none}}
`);
export default class OpenReadingShell extends OpenElement {
  static override styles = [sheet];
  #value(name: string): string | null {
    const property = (this as unknown as Record<string, unknown>)[name];
    return typeof property === 'string' ? property : this.getAttribute(name);
  }
  #json<T>(name: string): T | null {
    const raw = this.#value(name);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  override render() {
    const metadata = this.#json<ReadingMetadata>('metadata');
    const navigation = this.#json<ReadingNavigation>('navigation');
    const previous = navigation?.previous?.href ?? this.#value('previous');
    const next = navigation?.next?.href ?? this.#value('next');
    const previousLabel = navigation?.previous?.label ?? this.#value('previous-label') ??
      'Previous';
    const nextLabel = navigation?.next?.label ?? this.#value('next-label') ?? 'Next';
    return (
      <div class='shell'>
        <article class='main'>
          <span id='start' tabindex='-1'></span>
          <header class='meta'>
            <slot name='meta'>
              {metadata
                ? (
                  <>
                    <p class='breadcrumb'>{metadata.breadcrumb}</p>
                    <h1>{metadata.title}</h1>
                    {metadata.lede ? <p class='lede'>{metadata.lede}</p> : null}
                    {metadata.date || metadata.tags?.length
                      ? (
                        <p class='meta-row'>
                          {metadata.date ? <time>{metadata.date}</time> : null}
                          {metadata.tags?.map((tag) => <span key={tag}>{tag}</span>)}
                        </p>
                      )
                      : null}
                  </>
                )
                : null}
            </slot>
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
