/** @jsxImportSource @openelement/element */
/** Compiler-owned WWW table of contents. */
import { OpenElement } from '@openelement/element';
import { compiledStyle } from './compiled-style.ts';

interface RailItem {
  id: string;
  href: string;
  label: string;
  depth: string;
}

declare function element(tag: string): ClassDecorator;
declare function property(
  options: { reflect: boolean; attribute?: false },
): (target: undefined, context: ClassFieldDecoratorContext) => void;

@element('open-page-rail')
export default class OpenPageRail extends OpenElement {
  static override styles = [compiledStyle(`
  :host{display:block}details{display:block}summary{display:none}.links{display:grid;gap:var(--size-1);counter-reset:rail-item}a{display:block;padding:var(--size-1) 0 var(--size-1) var(--size-3);color:var(--text-muted);font-family:var(--font-mono);font-size:var(--font-size-00);line-height:1.45;text-decoration:none;border-inline-start:var(--border-size-2) solid transparent}a::before{counter-increment:rail-item;content:"§" counter(rail-item) "  ";color:color-mix(in srgb,var(--text-muted) 70%,transparent)}a[data-depth="3"]{padding-inline-start:var(--size-5);font-size:calc(var(--font-size-00) * .94)}a:hover,a:focus-visible{color:var(--text-primary)}a[aria-current="location"]{color:var(--text-primary);font-weight:var(--font-weight-8);border-inline-start-color:var(--brand)}a[aria-current="location"]::before{color:var(--brand)}@media(max-width:900px){details{padding:var(--size-3);border:1px solid var(--border);border-radius:var(--radius-2);background:var(--bg-surface)}summary{display:block;cursor:pointer;color:var(--text-primary);font-family:var(--font-mono);font-size:var(--font-size-00);font-weight:var(--font-weight-8);letter-spacing:.12em;text-transform:uppercase}details:not([open]) .links{display:none}.links{padding-block-start:var(--size-3)}}
`)];

  @property({ reflect: false })
  items: RailItem[] = [];

  render() {
    return (
      <details open>
        <summary>On this page</summary>
        <nav class='links' aria-label='On this page'>
          <a href='#start'>Overview</a>
          {this.items.map((item) => (
            <a key={item.id} href={item.href} data-depth={item.depth}>{item.label}</a>
          ))}
        </nav>
      </details>
    );
  }
}
