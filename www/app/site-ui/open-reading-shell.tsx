/** @jsxImportSource @openelement/element */
/** Private WWW long-form reading shell. */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { getJson, getStr } from './get-str.ts';
import type { ReadingMetadata, ReadingNavigation } from './page-contract.ts';

/** Optional v4 editorial accent rendered in Instrument Serif after the title. */
type ReadingMetadataV4 = ReadingMetadata & { accent?: string };

export const tagName = 'open-reading-shell';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host{display:block}
  .shell{width:min(1180px,calc(100% - 3rem));margin:auto;padding:clamp(2rem,5vh,4rem) 0 clamp(4rem,9vh,7rem);display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(2rem,6vw,6rem)}
  :host([rail]) .shell{grid-template-columns:minmax(0,1fr) 220px}
  .main{min-width:0;max-width:760px;line-height:1.7}
  :host(:not([rail])) .main{margin-inline:auto}
  .meta{display:none;margin-block-end:var(--size-7);padding-block-end:var(--size-5);border-block-end:1px solid var(--border)}
  :host([meta]) .meta,:host([metadata]) .meta{display:block}
  .breadcrumb{display:flex;flex-wrap:wrap;align-items:baseline;gap:var(--size-2);margin:0 0 var(--size-4);color:var(--text-muted);font-family:var(--font-mono);font-size:var(--font-size-00);font-weight:var(--font-weight-8);letter-spacing:.1em;text-transform:uppercase}
  .breadcrumb .crumb-sep{color:color-mix(in srgb,var(--text-muted) 55%,transparent)}
  .breadcrumb .crumb-current{color:var(--violet-8)}
  .title{margin:0;color:var(--text-primary);font-family:var(--font-mono);font-size:clamp(2.1rem,4.6vw,3.4rem);font-weight:var(--font-weight-8);letter-spacing:-.03em;line-height:1.05;overflow-wrap:break-word}
  .title-accent{display:block;color:var(--violet-8);font-family:var(--font-serif);font-style:italic;font-weight:400;font-size:calc(1em * 1.08);letter-spacing:-.01em}
  .lede{max-width:640px;margin:var(--size-4) 0 0;color:var(--text-secondary);font-size:clamp(var(--font-size-1),1.4vw,var(--font-size-2));line-height:1.65}
  .meta-row{display:flex;flex-wrap:wrap;gap:var(--size-2);margin:var(--size-4) 0 0;color:var(--text-muted);font-family:var(--font-mono);font-size:var(--font-size-00)}
  .meta-row span{padding:var(--size-1) var(--size-2);border:1px solid var(--border);border-radius:var(--radius-1)}
  .rail{display:none;position:sticky;top:calc(var(--nav-height) + var(--size-6));align-self:start}
  :host([rail]) .rail{display:block}
  .rail-label{margin:0 0 var(--size-3);color:var(--text-muted);font-family:var(--font-mono);font-size:var(--font-size-00);font-weight:var(--font-weight-8);letter-spacing:.14em;text-transform:uppercase}
  .footer{display:none;margin-block-start:var(--size-10);padding-block-start:var(--size-5);border-block-start:1px solid var(--border)}
  :host([footer]) .footer,:host([navigation]) .footer{display:block}
  .pager{display:flex;justify-content:space-between;gap:var(--size-4)}
  .pager a{color:var(--text-muted);font-family:var(--font-mono);font-size:var(--font-size-00);letter-spacing:.04em;text-decoration:none}
  .pager a:hover{color:var(--brand)}
  .pager a:last-child{color:var(--brand);font-weight:var(--font-weight-8);text-align:end}
  @media(max-width:900px){
    .shell,:host([rail]) .shell{grid-template-columns:1fr;width:min(100% - 2rem,760px);padding-block:var(--size-8)}
    .main{max-width:none}
    .title{font-size:clamp(1.8rem,8vw,2.4rem)}
    .rail{position:static;order:-1}
    .rail-label{display:none}
  }
`);
export default class OpenReadingShell extends OpenElement {
  static override styles = [sheet];
  override render() {
    const metadata = getJson<ReadingMetadataV4>(this, 'metadata');
    const navigation = getJson<ReadingNavigation>(this, 'navigation');
    const previous = navigation?.previous?.href ?? getStr(this, 'previous', '');
    const next = navigation?.next?.href ?? getStr(this, 'next', '');
    const previousLabel = navigation?.previous?.label ?? getStr(this, 'previous-label', 'Previous');
    const nextLabel = navigation?.next?.label ?? getStr(this, 'next-label', 'Next');
    return (
      <div class='shell'>
        <article class='main'>
          <span id='start' tabindex='-1'></span>
          <header class='meta'>
            <slot name='meta'>
              {metadata
                ? (
                  <>
                    <p class='breadcrumb'>
                      <span>{metadata.breadcrumb}</span>
                      <span class='crumb-sep'>/</span>
                      <span class='crumb-current'>{metadata.title}</span>
                    </p>
                    <h1 class='title'>
                      {metadata.title}
                      {metadata.accent ? <span class='title-accent'>{metadata.accent}</span> : null}
                    </h1>
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
defineCustomElement(tagName, OpenReadingShell);
