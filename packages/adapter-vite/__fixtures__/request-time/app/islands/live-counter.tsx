/**
 * live-counter — minimal signal counter island.
 *
 * Hydrates on load; clicking the button increments the count. Used on the
 * request-time /live page to prove hydration is identical to static pages.
 */
import { defineCustomElement, OpenElement, signal } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'live-counter';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

export default class LiveCounter extends OpenElement {
  #count = signal(0);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
  }

  override render() {
    return (
      <div class='counter-row'>
        <button id='increment' type='button' onClick={() => this.#count.value++}>+</button>
        <span id='count' data-signal='count'></span>
      </div>
    );
  }
}

defineCustomElement(tagName, LiveCounter);
