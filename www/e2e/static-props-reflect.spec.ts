/**
 * E2E: reflect: true static props (R2-H1)
 *
 * Verifies in a real browser that a `reflect: true` static prop keeps the
 * signal, the mirrored attribute, and the rendered DOM consistent without a
 * write loop:
 *
 *   1. SSR-delivered attributes survive connect byte-for-byte. Pre-fix the
 *      reflect subscription fired synchronously with the default value during
 *      initializeStaticProps and overwrote every reflected attribute before
 *      syncStaticPropsFromAttributes ran (<x count="5"> became count="0").
 *   2. One logical write produces exactly one attributeChangedCallback. Pre-fix
 *      the signal→attribute→signal round trip had no equality short-circuit
 *      and looped (measured per engine: 43/476/2491 redundant runs until the
 *      stack blew).
 *   3. Round trip holds in both directions (signal→attribute→signal).
 *
 * Sibling paths covered: attribute removal restores the default (the mirror
 * writes the restored default back) and Boolean presence semantics.
 *
 * Probe technique identical to static-props-observed.spec.ts: no shipped www
 * component uses reflect props, so the spec extends the OpenElement base
 * class walked from an already-registered island component.
 */

import { expect, test } from '@playwright/test';

const ISLAND_CANDIDATES = ['open-theme-toggle', 'open-card', 'open-button', 'open-search'];

test.describe('reflect: true static props', () => {
  test('reflected SSR attributes survive connect, logical writes do not loop, round trip stays consistent', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for any shipped OpenElement island component to be registered.
    const hostTag = await page.waitForFunction((candidates) => {
      for (const tag of candidates) {
        if (customElements.get(tag)) return tag;
      }
      return null;
    }, ISLAND_CANDIDATES).then((handle) => handle.jsonValue() as Promise<string>);

    const result = await page.evaluate((tag) => {
      // Walk from a registered component up to the direct HTMLElement
      // subclass — that is the OpenElement base class.
      let base = customElements.get(tag) as CustomElementConstructor;
      for (let i = 0; i < 10 && Object.getPrototypeOf(base) !== HTMLElement; i++) {
        base = Object.getPrototypeOf(base) as CustomElementConstructor;
      }
      if (Object.getPrototypeOf(base) !== HTMLElement) {
        return { error: 'OpenElement base class not found' } as const;
      }

      interface SignalLike {
        value: unknown;
        subscribe(fn: (v: unknown) => void): () => void;
      }

      const changes: string[] = [];
      class ReflectProbe extends base {
        static props = {
          count: { type: Number, default: 0, reflect: true },
          label: { type: String, default: 'init', reflect: true },
          active: { type: Boolean, default: false, reflect: true },
        };

        // Type-only declarations; initializeStaticProps installs the real
        // accessors on each instance at connect time.
        declare count: SignalLike;
        declare label: SignalLike;
        declare active: SignalLike;

        override attributeChangedCallback(
          name: string,
          oldValue: string | null,
          newValue: string | null,
        ): void {
          // Record on entry: a reflected mirror write re-enters this callback
          // synchronously from inside the super call, so pushing after super
          // would list the nested write before its cause.
          changes.push(`${name}:${newValue}`);
          super.attributeChangedCallback(name, oldValue, newValue);
        }

        override connectedCallback(): void {
          super.connectedCallback();
          this.count.subscribe(() => this.update());
          this.label.subscribe(() => this.update());
        }

        override render(): unknown {
          return { tag: 'span', props: {}, children: [`${this.label.value}:${this.count.value}`] };
        }
      }
      customElements.define('reflect-probe', ReflectProbe);

      // Simulate SSR delivery: parser-created markup carrying reflected
      // attributes, inserted into the connected document.
      const host = document.createElement('div');
      document.body.appendChild(host);
      changes.length = 0;
      host.innerHTML = '<reflect-probe count="5" label="ssr" active></reflect-probe>';
      const el = host.querySelector('reflect-probe') as InstanceType<typeof ReflectProbe>;

      const probeText = () => el.shadowRoot?.querySelector('span')?.textContent ?? null;

      const afterConnect = {
        countAttr: el.getAttribute('count'),
        labelAttr: el.getAttribute('label'),
        activePresent: el.hasAttribute('active'),
        countValue: el.count.value,
        labelValue: el.label.value,
        activeValue: el.active.value,
        text: probeText(),
        changesDuringConnect: [...changes],
      };

      // signal -> attribute: one logical write.
      changes.length = 0;
      el.count.value = 7;
      const afterSignalWrite = {
        attr: el.getAttribute('count'),
        value: el.count.value,
        text: probeText(),
        changes: [...changes],
      };

      // attribute -> signal: no mirror echo back into the attribute.
      changes.length = 0;
      el.setAttribute('count', '9');
      const afterAttrWrite = {
        attr: el.getAttribute('count'),
        value: el.count.value,
        text: probeText(),
        changes: [...changes],
      };

      // Removal restores the declared default; the mirror writes the restored
      // default back, then the round trip stops.
      changes.length = 0;
      el.removeAttribute('count');
      const afterRemove = {
        attr: el.getAttribute('count'),
        value: el.count.value,
        text: probeText(),
        changes: [...changes],
      };

      // Boolean mirror: value maps to attribute presence in both directions.
      changes.length = 0;
      el.active.value = false;
      const boolOff = { present: el.hasAttribute('active'), changes: [...changes] };
      changes.length = 0;
      el.active.value = true;
      const boolOn = { present: el.hasAttribute('active'), changes: [...changes] };

      el.remove();
      host.remove();
      return {
        afterConnect,
        afterSignalWrite,
        afterAttrWrite,
        afterRemove,
        boolOff,
        boolOn,
      } as const;
    }, hostTag);

    if ('error' in result) throw new Error(result.error);

    // SSR attributes survive connect byte-for-byte (pre-fix: clobbered to the
    // defaults), and they drive the signals and the rendered DOM.
    expect(result.afterConnect.countAttr).toBe('5');
    expect(result.afterConnect.labelAttr).toBe('ssr');
    expect(result.afterConnect.activePresent).toBe(true);
    expect(result.afterConnect.countValue).toBe(5);
    expect(result.afterConnect.labelValue).toBe('ssr');
    expect(result.afterConnect.activeValue).toBe(true);
    expect(result.afterConnect.text).toBe('ssr:5');
    // Connect fires exactly the parser's own notifications — no reflect write
    // of the defaults (no count:0 clobber, no churn).
    expect(result.afterConnect.changesDuringConnect).toEqual([
      'count:5',
      'label:ssr',
      'active:',
    ]);

    // signal -> attribute -> DOM: exactly one attribute change, zero redundant.
    expect(result.afterSignalWrite.attr).toBe('7');
    expect(result.afterSignalWrite.value).toBe(7);
    expect(result.afterSignalWrite.text).toBe('ssr:7');
    expect(result.afterSignalWrite.changes).toEqual(['count:7']);

    // attribute -> signal: the reflect subscriber sees the attribute already
    // holds the value and does not write it back.
    expect(result.afterAttrWrite.attr).toBe('9');
    expect(result.afterAttrWrite.value).toBe(9);
    expect(result.afterAttrWrite.text).toBe('ssr:9');
    expect(result.afterAttrWrite.changes).toEqual(['count:9']);

    // Removal restores the default in the signal and mirrors it back:
    // removal notification + exactly one mirror write, then the loop stops.
    expect(result.afterRemove.value).toBe(0);
    expect(result.afterRemove.attr).toBe('0');
    expect(result.afterRemove.text).toBe('ssr:0');
    expect(result.afterRemove.changes).toEqual(['count:null', 'count:0']);

    // Boolean: false removes the attribute, true restores it, one change each.
    expect(result.boolOff.present).toBe(false);
    expect(result.boolOff.changes).toEqual(['active:null']);
    expect(result.boolOn.present).toBe(true);
    expect(result.boolOn.changes).toEqual(['active:']);
  });
});
