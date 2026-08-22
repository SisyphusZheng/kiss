/** @jsxImportSource @openelement/element */
/**
 * Hero-only polish layer for the home page — three restrained touches,
 * all driven from one rAF loop and all writing CSS variables / transforms
 * directly (no re-renders, no layout reads in the hot path):
 *
 * 1. Custom cursor (fine pointers only): a gold dot that tracks instantly
 *    plus a lagging ring; the ring blooms over links/buttons. Scoped to
 *    `.hero-main` — the rest of the page keeps the native cursor.
 * 2. Magnetic CTAs: the hero actions lean a few px toward the pointer and
 *    ease back on leave. Lerped, never snappy.
 * 3. Cinematic scroll-out: scrolling past the hero writes `--hero-exit`
 *    (0..1); the route stylesheet parallaxes copy up and sinks the stage
 *    into the dark with it.
 *
 * Reduced motion → the layer stays inert. Coarse pointers → no cursor, no
 * magnetism (scroll-out still runs; it is scroll-driven, not animation).
 */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'open-hero-polish';
export const openElement = defineIslandConfig({ hydrate: 'idle', ssr: true, dsd: true });

const sheet = new StyleSheet();
sheet.replaceSync(
  `:host{position:absolute;width:1px;height:1px;overflow:hidden;pointer-events:none}`,
);

const CURSOR_CSS = `
  .hero-main, .hero-main * { cursor: none !important; }
  .hero-cursor { position: fixed; inset: 0 auto auto 0; z-index: 60; pointer-events: none; opacity: 0; transition: opacity .25s ease; }
  .hero-cursor.on { opacity: 1; }
  .hero-cursor i { position: fixed; top: 0; left: 0; border-radius: 50%; pointer-events: none; }
  .hero-cursor .dot { width: 6px; height: 6px; background: #e3cf9f; transform: translate3d(var(--dx, -100px), var(--dy, -100px), 0) translate(-50%, -50%); }
  .hero-cursor .ring { width: 34px; height: 34px; border: 1px solid rgba(227, 207, 159, .55); transform: translate3d(var(--rx, -100px), var(--ry, -100px), 0) translate(-50%, -50%) scale(var(--ring, 1)); transition: border-color .3s ease; }
  .hero-cursor.hover .ring { --ring: 1.7; border-color: rgba(227, 207, 159, .95); }
`;

export default class HeroPolish extends OpenElement {
  static override styles = [sheet];
  #raf = 0;
  #cleanup: (() => void) | undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    const root = this.getRootNode();
    if (!(root instanceof ShadowRoot)) return;
    const hero = root.querySelector<HTMLElement>('.hero-main');
    if (!hero) return;
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const fine = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;

    const cleanups: Array<() => void> = [];

    // ── scroll-out: one passive listener, one var ──
    if (!reduced) {
      let scheduled = false;
      const update = (): void => {
        scheduled = false;
        const rect = hero.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -rect.top / (rect.height * 0.85)));
        hero.style.setProperty('--hero-exit', p.toFixed(4));
      };
      const schedule = (): void => {
        if (!scheduled) {
          scheduled = true;
          this.#raf = requestAnimationFrame(update);
        }
      };
      globalThis.addEventListener('scroll', schedule, { passive: true });
      globalThis.addEventListener('resize', schedule, { passive: true });
      update();
      cleanups.push(() => {
        globalThis.removeEventListener('scroll', schedule);
        globalThis.removeEventListener('resize', schedule);
      });
    }

    // ── cursor + magnetism: fine pointers, full motion only ──
    if (!reduced && fine) {
      const styleEl = document.createElement('style');
      styleEl.textContent = CURSOR_CSS;
      root.appendChild(styleEl);
      const cursor = document.createElement('div');
      cursor.className = 'hero-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      cursor.innerHTML = '<i class="dot"></i><i class="ring"></i>';
      root.appendChild(cursor);

      let tx = -100;
      let ty = -100;
      let rx = -100;
      let ry = -100;
      let inside = false;
      let cursorRaf = 0;

      // Magnetic state lives per-CTA: current offset chases target offset.
      const magnets: Array<{ el: HTMLElement; cx: number; cy: number; tx: number; ty: number }> =
        [];
      for (const el of hero.querySelectorAll<HTMLElement>('.hero-foot .action')) {
        magnets.push({ el, cx: 0, cy: 0, tx: 0, ty: 0 });
      }

      const frame = (): void => {
        cursorRaf = 0;
        rx += (tx - rx) * 0.18;
        ry += (ty - ry) * 0.18;
        cursor.style.setProperty('--dx', `${tx}px`);
        cursor.style.setProperty('--dy', `${ty}px`);
        cursor.style.setProperty('--rx', `${rx.toFixed(1)}px`);
        cursor.style.setProperty('--ry', `${ry.toFixed(1)}px`);
        let magnetsAwake = false;
        for (const m of magnets) {
          m.cx += (m.tx - m.cx) * 0.2;
          m.cy += (m.ty - m.cy) * 0.2;
          if (Math.abs(m.cx) > 0.05 || Math.abs(m.cy) > 0.05 || m.tx !== 0 || m.ty !== 0) {
            magnetsAwake = true;
            m.el.style.transform = `translate3d(${m.cx.toFixed(1)}px, ${m.cy.toFixed(1)}px, 0)`;
          }
        }
        const ringSettled = Math.abs(rx - tx) < 0.3 && Math.abs(ry - ty) < 0.3;
        if (inside || !ringSettled || magnetsAwake) {
          cursorRaf = requestAnimationFrame(frame);
        }
      };
      const kick = (): void => {
        if (!cursorRaf) cursorRaf = requestAnimationFrame(frame);
      };

      const onMove = (event: PointerEvent): void => {
        if (event.pointerType !== 'mouse') return;
        tx = event.clientX;
        ty = event.clientY;
        const rect = hero.getBoundingClientRect();
        const nowInside = tx >= rect.left && tx <= rect.right && ty >= rect.top &&
          ty <= rect.bottom;
        if (nowInside !== inside) {
          inside = nowInside;
          cursor.classList.toggle('on', inside);
        }
        if (inside) {
          // window-level listeners see retargeted targets for shadow-DOM
          // hits — walk the composed path to find the real one.
          const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
          const real = path.find((n): n is Element => n instanceof Element) ?? null;
          cursor.classList.toggle('hover', Boolean(real?.closest('a, button')));
          for (const m of magnets) {
            const r = m.el.getBoundingClientRect();
            const dx = tx - (r.left + r.width / 2);
            const dy = ty - (r.top + r.height / 2);
            const near = Math.abs(dx) < r.width && Math.abs(dy) < r.height * 2.2;
            m.tx = near ? Math.max(-8, Math.min(8, dx * 0.18)) : 0;
            m.ty = near ? Math.max(-6, Math.min(6, dy * 0.22)) : 0;
          }
        } else {
          for (const m of magnets) {
            m.tx = 0;
            m.ty = 0;
          }
        }
        kick();
      };
      const onLeave = (): void => {
        inside = false;
        cursor.classList.remove('on');
        for (const m of magnets) {
          m.tx = 0;
          m.ty = 0;
        }
        kick();
      };
      globalThis.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave, { passive: true });
      cleanups.push(() => {
        globalThis.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        cancelAnimationFrame(cursorRaf);
        for (const m of magnets) m.el.style.transform = '';
        cursor.remove();
        styleEl.remove();
      });
    }

    this.#cleanup = () => {
      for (const fn of cleanups) fn();
      cancelAnimationFrame(this.#raf);
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
defineCustomElement(tagName, HeroPolish);
