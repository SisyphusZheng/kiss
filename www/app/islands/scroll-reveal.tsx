/**
 * ScrollReveal — Ocean component.
 *
 * Wraps slotted content with an IntersectionObserver-driven reveal
 * animation. Pure OpenElement + signals — zero manual DOM queries.
 *
 * v0.28: Signal-driven visibility via data-signal-class. querySelector +
 *   classList.add replaced with registerSignal + data-signal-class marker.
 */
import { defineCustomElement } from '@openelement/core';
import { OpenElement } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import { signal } from '@openelement/signal';
import { StyleSheet } from '@openelement/core/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui';

export const tagName = 'scroll-reveal';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const styles = new StyleSheet();
styles.replaceSync(`
  :host {
    display: block;
  }
  .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity var(--duration-4) var(--ease-3), transform var(--duration-4) var(--ease-3);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  @media (prefers-reduced-motion: reduce) {
    .reveal {
      opacity: 1;
      transform: none;
      transition: none;
    }
  }
`);

export default class ScrollReveal extends OpenElement {
  static override styles = [openPropsTokenSheet, styles];

  #visible = signal(false);
  #observer: IntersectionObserver | null = null;

  constructor() {
    super();
    this.registerSignal('visible', this.#visible);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.#visible.value = true;
            this.#observer?.unobserve(entry.target);
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    // Observe after shadow root is created — use firstElementChild
    // instead of querySelector for zero-query guarantee.
    requestAnimationFrame(() => {
      const target = this.shadowRoot?.firstElementChild;
      if (target && this.#observer) {
        this.#observer.observe(target);
      }
    });
  }

  override disconnectedCallback(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    super.disconnectedCallback();
  }

  override render() {
    return (
      <div
        class='reveal'
        data-signal='visible'
        data-signal-class='visible'
      >
        <slot></slot>
      </div>
    );
  }
}

defineCustomElement(tagName, ScrollReveal);
