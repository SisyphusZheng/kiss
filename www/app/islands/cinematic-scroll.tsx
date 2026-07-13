/** @jsxImportSource @openelement/element */
/** One passive coordinator for the Cinematic V2 native scroll timeline. */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'open-cinematic-scroll';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });
const sheet = new StyleSheet();
sheet.replaceSync(
  `:host{position:absolute;width:1px;height:1px;overflow:hidden;pointer-events:none}`,
);

export default class CinematicScroll extends OpenElement {
  static override styles = [sheet];
  #frame = 0;
  #cleanup: (() => void) | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    const root = this.getRootNode();
    if (!(root instanceof ShadowRoot)) return;
    const film = root.querySelector<HTMLElement>('.cinematic-v2');
    if (!film) return;
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const update = () => {
      this.#frame = 0;
      const rect = film.getBoundingClientRect();
      const distance = Math.max(1, film.offsetHeight - innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      film.style.setProperty('--film-progress', String(reduced ? 1 : progress));
      film.style.setProperty('--scene-progress', String(Math.min(6, progress * 6)));
    };
    const schedule = () => this.#frame || (this.#frame = requestAnimationFrame(update));
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || innerWidth < 800) return;
      film.style.setProperty('--pointer-x', String((event.clientX / innerWidth - .5) * 2));
      film.style.setProperty('--pointer-y', String((event.clientY / innerHeight - .5) * 2));
    };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    addEventListener('pointermove', pointer, { passive: true });
    update();
    this.#cleanup = () => {
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      removeEventListener('pointermove', pointer);
      cancelAnimationFrame(this.#frame);
    };
  }

  override disconnectedCallback(): void {
    this.#cleanup?.();
    this.#cleanup = undefined;
    super.disconnectedCallback();
  }

  override render() {
    return <span aria-hidden='true'></span>;
  }
}
defineCustomElement(tagName, CinematicScroll);
