/**
 * E2E: static props observedAttributes registration (defect B2)
 *
 * Verifies in a real browser that a component declaring `static props` gets
 * attribute→signal synchronization without hand-writing `observedAttributes`.
 * Browsers read `observedAttributes` exactly once at customElements.define(),
 * so merging must happen no later than class definition time.
 *
 * No shipped www component uses `static props`, so the spec defines a probe
 * element inline: it extends the OpenElement base class walked from an
 * already-registered island component via the shared probe in
 * base-class-probe.ts (open-theme-toggle and friends are defined lazily by
 * the island loader). Pre-fix, the browser observes nothing (base declared no
 * list) and the attribute set below never fires attributeChangedCallback.
 */

import { expect, test } from '@playwright/test';
import {
  FIND_OPEN_ELEMENT_BASE_SOURCE,
  type FindOpenElementBase,
  ISLAND_CANDIDATES,
} from './base-class-probe.ts';

test.describe('static props attribute observation', () => {
  test('attribute changes drive signal-backed DOM updates without hand-written observedAttributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for any shipped OpenElement island component to be registered.
    const hostTag = await page.waitForFunction((candidates) => {
      for (const tag of candidates) {
        if (customElements.get(tag)) return tag;
      }
      return null;
    }, ISLAND_CANDIDATES).then((handle) => handle.jsonValue() as Promise<string>);

    const result = await page.evaluate(([tag, probeSource]) => {
      // Walk from a registered component up to the direct HTMLElement
      // subclass — that is the OpenElement base class (shared probe).
      const findBase = new Function(`return (${probeSource})`)() as FindOpenElementBase;
      const found = findBase(tag);
      if ('error' in found) return found;
      const base = found.base;

      class StaticPropsProbe extends base {
        static props = {
          label: { type: String, default: 'init' },
        };

        // Type-only declaration; initializeStaticProps installs the real
        // accessor on each instance at connect time.
        declare label: { value: unknown; subscribe(fn: (v: unknown) => void): () => void };

        override connectedCallback(): void {
          super.connectedCallback();
          // Static prop getters return a Signal (read/write through .value);
          // subscribe to re-render when the attribute-driven value changes.
          this.label.subscribe(() => this.update());
        }

        override render(): unknown {
          return { tag: 'span', props: {}, children: [String(this.label.value)] };
        }
      }

      const observedBeforeDefine = (StaticPropsProbe as unknown as {
        observedAttributes?: string[];
      }).observedAttributes;

      customElements.define('static-props-probe', StaticPropsProbe);

      const el = document.createElement('static-props-probe') as InstanceType<
        typeof StaticPropsProbe
      >;
      document.body.appendChild(el);

      const initialText = el.shadowRoot?.querySelector('span')?.textContent ?? null;

      el.setAttribute('label', 'from-attr');
      const afterSet = el.shadowRoot?.querySelector('span')?.textContent ?? null;
      const signalValue = el.label.value;

      el.removeAttribute('label');
      const afterRemove = el.shadowRoot?.querySelector('span')?.textContent ?? null;

      el.remove();
      return { observedBeforeDefine, initialText, afterSet, signalValue, afterRemove } as const;
    }, [hostTag, FIND_OPEN_ELEMENT_BASE_SOURCE]);

    if ('error' in result) throw new Error(result.error);

    // The define-time read must already include the static props attribute.
    expect(result.observedBeforeDefine).toEqual(['label']);
    // SSR-free CSR render shows the declared default first.
    expect(result.initialText).toBe('init');
    // Attribute change fires attributeChangedCallback -> signal -> DOM patch.
    expect(result.signalValue).toBe('from-attr');
    expect(result.afterSet).toBe('from-attr');
    // Removing the attribute restores the declared default.
    expect(result.afterRemove).toBe('init');
  });
});
