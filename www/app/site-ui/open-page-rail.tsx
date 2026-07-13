/** @jsxImportSource @openelement/element */
/** Private WWW table of contents with progressive enhancement for active state. */
import { OpenElement, StyleSheet } from '@openelement/element';
import type { PageOutlineItem } from './page-contract.ts';

export const tagName = 'open-page-rail';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host{display:block}details{display:block}summary{display:none}.links{display:grid;gap:var(--size-1)}a{display:block;padding:var(--size-2) 0;color:var(--text-muted);font-family:var(--font-mono);font-size:var(--font-size-00);line-height:1.35;text-decoration:none;border-block-end:1px solid color-mix(in srgb,var(--border) 72%,transparent)}a[data-depth="3"]{padding-inline-start:var(--size-3);font-size:calc(var(--font-size-00) * .94)}a:hover,a:focus-visible,a[aria-current="location"]{color:var(--text-primary)}a[aria-current="location"]{padding-inline-start:var(--size-3);border-inline-start:2px solid var(--brand)}@media(max-width:900px){details{padding:var(--size-3);border:1px solid var(--border);border-radius:var(--radius-2);background:var(--bg-surface)}summary{display:block;cursor:pointer;color:var(--brand);font-size:var(--font-size-00);font-weight:var(--font-weight-8);text-transform:uppercase}details:not([open]) .links{display:none}.links{padding-block-start:var(--size-3)}}
`);
export default class OpenPageRail extends OpenElement {
  #observer: IntersectionObserver | null = null;
  #links: HTMLAnchorElement[] = [];
  static override styles = [sheet];
  override connectedCallback(): void {
    super.connectedCallback();
    requestAnimationFrame(() => {
      this.#buildAutomaticOutline();
      this.#activate();
    });
  }
  override disconnectedCallback(): void {
    this.#observer?.disconnect();
    super.disconnectedCallback();
  }
  #activate(): void {
    this.#links = [
      ...this.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
      ...(this.shadowRoot?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? []),
    ];
    const targets = this.#links.map((link) => document.getElementById(link.hash.slice(1))).filter((
      target,
    ): target is HTMLElement => Boolean(target));
    if (!targets.length || !('IntersectionObserver' in window)) return;
    this.#observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) =>
        entry.isIntersecting
      ).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible?.target.id) {
        return;
      }
      for (const link of this.#links) {
        link.toggleAttribute(
          'aria-current',
          link.hash === `#${visible.target.id}`,
        );
      }
    }, { rootMargin: '-18% 0px -70% 0px', threshold: 0 });
    for (const target of targets) this.#observer.observe(target);
  }
  #buildAutomaticOutline(): void {
    if (!this.hasAttribute('auto') || this.children.length) return;
    const shell = this.closest('open-reading-shell');
    const headings = [...(shell?.querySelectorAll<HTMLElement>('.main h2, .main h3') ?? [])];
    for (const [index, heading] of headings.entries()) {
      if (!heading.id) {
        heading.id = `section-${index + 1}-${
          heading.textContent?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(
            /(^-|-$)/g,
            '',
          ) || 'section'
        }`;
      }
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent?.trim() || `Section ${index + 1}`;
      if (heading.tagName === 'H3') link.setAttribute('data-depth', '3');
      this.append(link);
    }
  }
  #items(): readonly PageOutlineItem[] {
    // During SSR OpenElement supplies JSX props before it attaches attributes
    // to the host. The property path therefore produces the complete DSD
    // outline, while the attribute path covers browser-side upgrades.
    let raw = typeof (this as { items?: unknown }).items === 'string'
      ? (this as { items: string }).items
      : this.getAttribute('items');
    if (!raw) {
      try {
        const props = JSON.parse(this.getAttribute('data-ssr-props') ?? '{}') as {
          items?: unknown;
        };
        raw = typeof props.items === 'string' ? props.items : null;
      } catch {
        raw = null;
      }
    }
    if (!raw) return [];
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) return [];
      return value.filter((item): item is PageOutlineItem =>
        Boolean(
          item && typeof item === 'object' && typeof (item as PageOutlineItem).id === 'string' &&
            typeof (item as PageOutlineItem).label === 'string',
        )
      );
    } catch {
      return [];
    }
  }
  override render() {
    const items = this.#items();
    return (
      <details open>
        <summary>On this page</summary>
        <nav class='links' aria-label='On this page'>
          {items.length
            ? items.map((item) => (
              <a href={`#${item.id}`} data-depth={String(item.level ?? 2)}>{item.label}</a>
            ))
            : (
              <slot>
                <a href='#start'>Overview</a>
              </slot>
            )}
        </nav>
      </details>
    );
  }
}
customElements.define(tagName, OpenPageRail);
