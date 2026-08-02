/**
 * E2E: Hydration behavior in a real browser.
 *
 * The element/ui unit suites run on a hand-written DOM shim whose semantics
 * diverge from a real browser (shim attachShadow throws, no closest()). This
 * suite guards the hydration contract in real Chromium against the built www
 * site:
 *
 *   1. data-signal text binding: a signal change patches the bound DOM text
 *      in place (no re-render).
 *   2. Event hydration: clicking a data-eid-hydrated button on a shipped
 *      island runs its handler, and the signal-driven class binding updates
 *      the existing DSD node.
 *   3. SSR/hydration mismatch: tampering with the DSD branch token or the
 *      data-eid marker count degrades the scope to a client-side re-render
 *      (with working event bindings) instead of mis-binding handlers.
 *   4. open-button form piercing: a click on the shadow-DOM <button> reaches
 *      the outer <form> as a composed submit event.
 *
 * Probe elements are defined inline from the OpenElement base class, walked
 * from an already-registered island component via the shared probe in
 * base-class-probe.ts. A DSD upgrade is simulated with
 * attachShadow() + innerHTML before connect — exactly the state the browser
 * produces when a <template shadowrootmode> element upgrades.
 */

import { expect, type Page, test } from '@playwright/test';
import { FIND_OPEN_ELEMENT_BASE_SOURCE, type FindOpenElementBase } from './base-class-probe.ts';

/** Structural view of the signal objects stored in an element's signalRegistry. */
interface WritableSignalLike {
  value: unknown;
  subscribe(fn: (value: unknown) => void): () => void;
}

/** OpenElement instance surface used by the probes. */
type RegistryHost = HTMLElement & {
  signalRegistry: Map<string, WritableSignalLike>;
};

/** Result shape returned by probe-based page evaluations. */
interface ProbeError {
  error: string;
}

function isProbeError(result: unknown): result is ProbeError {
  return typeof result === 'object' && result !== null && 'error' in result;
}

/**
 * Wait until the layout shell upgraded and the open-search island is hydrated.
 * open-search lives inside open-layout's shadow root; its DSD shadow DOM
 * carries data-eid markers once the browser attached it.
 */
async function waitForHydratedSearch(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    if (!customElements.get('open-search')) return false;
    const layout = document.querySelector('open-layout');
    const search = layout?.shadowRoot?.querySelector('open-search');
    return !!search?.shadowRoot?.querySelector('[data-eid]');
  });
}

test.describe('data-signal bindings', () => {
  test('text binding patches DOM text in place when the signal changes', async ({ page }) => {
    await waitForHydratedSearch(page);

    const result = await page.evaluate((probeSource) => {
      // Walk from the registered island component up to the direct HTMLElement
      // subclass — that is the OpenElement base class (shared probe).
      const findBase = new Function(`return (${probeSource})`)() as FindOpenElementBase;
      const found = findBase('open-search');
      if ('error' in found) return found;
      const base = found.base;

      // Borrow a real signal from a fresh, unconnected island instance. The
      // constructor registers its signals without touching the live page DOM.
      const donor = document.createElement('open-search') as unknown as RegistryHost;
      const sig = donor.signalRegistry.get('query');
      if (!sig) return { error: 'donor signal not registered' };

      class TextProbe extends base {
        override render(): unknown {
          return { tag: 'div', props: {}, children: [] };
        }
      }
      customElements.define('hydration-text-probe', TextProbe);

      const el = document.createElement('hydration-text-probe') as unknown as RegistryHost;
      el.signalRegistry.set('probeText', sig);
      // Match the signal value to the SSR text so hydration starts aligned.
      sig.value = 'ssr-text';
      el.attachShadow({ mode: 'open' });
      (el.shadowRoot as ShadowRoot).innerHTML = '<span data-signal="probeText">ssr-text</span>';
      document.body.appendChild(el);

      const span = (el.shadowRoot as ShadowRoot).querySelector('span');
      const boundNode = span;
      const initialText = span?.textContent ?? null;

      sig.value = 'client-update';
      const updatedText = span?.textContent ?? null;
      // Fine-grained binding patches the existing node instead of re-rendering.
      const sameNode = (el.shadowRoot as ShadowRoot).querySelector('span') === boundNode;

      el.remove();
      return { initialText, updatedText, sameNode };
    }, FIND_OPEN_ELEMENT_BASE_SOURCE);

    if (isProbeError(result)) throw new Error(result.error);

    // Hydration activated the binding against the SSR text...
    expect(result.initialText).toBe('ssr-text');
    // ...and a later signal change patched the same DOM node.
    expect(result.updatedText).toBe('client-update');
    expect(result.sameNode).toBe(true);
  });
});

test.describe('event hydration on shipped islands', () => {
  test('clicking a data-eid button runs its handler and drives the signal-attr binding', async ({ page }) => {
    await waitForHydratedSearch(page);

    // Playwright CSS pierces open shadow roots: open-layout -> open-search.
    const trigger = page.locator('open-search .search-trigger');
    const overlay = page.locator('open-search .overlay');

    // DSD DOM is the SSR product: markers survive hydration.
    await expect(trigger).toHaveAttribute('data-eid', 'e0');
    await expect(overlay).toHaveClass('overlay');

    // The trigger's click handler is bound exclusively via data-eid event
    // hydration; it flips the `open` signal...
    await trigger.click();

    // ...which the data-signal + data-signal-attr binding reflects as a class
    // change on the very same SSR node (no re-render: data-eid survives).
    await expect(overlay).toHaveClass('overlay open');
    await expect(overlay).toHaveAttribute('data-eid', 'e3');
    await expect(trigger).toHaveAttribute('data-eid', 'e0');
  });
});

test.describe('SSR/hydration mismatch degradation', () => {
  test('tampered branch token or eid count falls back to client render with working events', async ({ page }) => {
    const mismatchWarnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().includes('SSR/hydration mismatch')) {
        mismatchWarnings.push(msg.text());
      }
    });

    await waitForHydratedSearch(page);

    const result = await page.evaluate((probeSource) => {
      const findBase = new Function(`return (${probeSource})`)() as FindOpenElementBase;
      const found = findBase('open-search');
      if ('error' in found) return found;
      const base = found.base;

      interface ProbeOutcome {
        sentinelPresent: boolean | null;
        eidCount: number;
        buttonText: string | null;
        clicksAfterClick: number;
      }

      function upgradeProbe(
        tag: string,
        ctor: CustomElementConstructor,
        ssrInnerHtml: string,
      ): ProbeOutcome {
        customElements.define(tag, ctor);
        const el = document.createElement(tag) as HTMLElement & { clicks: number };
        el.attachShadow({ mode: 'open' });
        (el.shadowRoot as ShadowRoot).innerHTML = ssrInnerHtml;
        document.body.appendChild(el);

        const root = el.shadowRoot as ShadowRoot;
        const button = root.querySelector('button');
        button?.click();
        const outcome: ProbeOutcome = {
          sentinelPresent: root.querySelector('[data-ssr]') !== null,
          eidCount: root.querySelectorAll('[data-eid]').length,
          buttonText: button?.textContent ?? null,
          clicksAfterClick: el.clicks,
        };
        el.remove();
        return outcome;
      }

      function branchProbeClass(): CustomElementConstructor {
        return class BranchProbe extends base {
          clicks = 0;
          override render(): unknown {
            // Root-level <Show> on purpose: renderToDom now parks a root
            // control-flow anchor in a DocumentFragment before committing
            // bindings, so the degrade path renders the branch without a
            // wrapper element. (The wrapper previously worked around the
            // anchor having no parentNode at commit time, which silently
            // dropped the branch content.)
            return {
              tag: 'show',
              props: { when: true },
              children: [
                {
                  tag: 'button',
                  props: {
                    onClick: () => {
                      this.clicks++;
                    },
                  },
                  children: ['probe-live'],
                },
                null,
              ],
            };
          }
        };
      }

      // Case A: the SSR branch comment says show:0 but the VNode resolves
      // show:1 — token sequence divergence must trigger the degrade path.
      const tampered = upgradeProbe(
        'probe-branch-tampered',
        branchProbeClass(),
        '<!--oe-branch:show:0--><button data-eid="e0" data-ssr="1">stale-label</button>',
      );

      // Case B: the SSR DOM carries two data-eid markers while the VNode only
      // implies one binding — marker count drift must trigger the same path.
      const driftCtor = class EidDriftProbe extends base {
        clicks = 0;
        override render(): unknown {
          return {
            tag: 'button',
            props: {
              onClick: () => {
                this.clicks++;
              },
            },
            children: ['probe-live'],
          };
        }
      };
      const drift = upgradeProbe(
        'probe-eid-drift',
        driftCtor,
        '<button data-eid="e0" data-ssr="1">stale-a</button><button data-eid="e1">stale-b</button>',
      );

      // Control: branch token and eid count agree with the VNode — hydration
      // must bind onto the SSR DOM without replacing it.
      const matched = upgradeProbe(
        'probe-branch-matched',
        branchProbeClass(),
        '<!--oe-branch:show:1--><button data-eid="e0" data-ssr="1">ssr-label</button>',
      );

      return { tampered, drift, matched };
    }, FIND_OPEN_ELEMENT_BASE_SOURCE);

    if (isProbeError(result)) throw new Error(result.error);

    // Both tampered scopes degraded exactly once each; the aligned control
    // scope stayed on the marker-binding path.
    expect(mismatchWarnings).toHaveLength(2);

    // Degraded scopes re-rendered from the VNode: SSR sentinels and stale
    // markers are gone, the rendered label wins, and events work.
    expect(result.tampered.sentinelPresent).toBe(false);
    expect(result.tampered.eidCount).toBe(0);
    expect(result.tampered.buttonText).toBe('probe-live');
    expect(result.tampered.clicksAfterClick).toBe(1);

    expect(result.drift.sentinelPresent).toBe(false);
    expect(result.drift.eidCount).toBe(0);
    expect(result.drift.buttonText).toBe('probe-live');
    expect(result.drift.clicksAfterClick).toBe(1);

    // Aligned scope: SSR DOM preserved (sentinel + label intact), handler
    // bound through the data-eid marker.
    expect(result.matched.sentinelPresent).toBe(true);
    expect(result.matched.buttonText).toBe('ssr-label');
    expect(result.matched.clicksAfterClick).toBe(1);
  });
});

test.describe('open-button form piercing', () => {
  test('shadow-DOM submit click reaches the outer form as a composed submit event', async ({ page }) => {
    await waitForHydratedSearch(page);

    const result = await page.evaluate(async () => {
      // open-button is not used by the homepage, so load its island chunk
      // directly. The chunk URL hash is discovered from the island loader
      // source to survive rebuilds.
      const loaderSource = await (await fetch('/client/islands/client.js')).text();
      const chunkMatch = loaderSource.match(/(?:\.\/|islands\/)(open-button-[\w-]+\.js)/);
      if (!chunkMatch) return { error: 'open-button chunk URL not found in island loader' };

      const mod = await import(`/client/islands/${chunkMatch[1]}`) as Record<string, unknown>;
      // Island chunks wrapped by the runtime expose a `.t` namespace; plain
      // ui-package chunks (like open-button) export the class directly.
      const ns = mod.t as { default?: CustomElementConstructor } | undefined;
      // #638: package island chunks dropped `export default`; the constructor
      // is exported under the CEM class name `OpenButton`.
      const ButtonCtor = (mod as Record<string, CustomElementConstructor | undefined>).OpenButton ??
        ns?.default ?? (mod.default as CustomElementConstructor | undefined);
      if (!ButtonCtor) return { error: 'open-button chunk has no OpenButton export' };
      if (!customElements.get('open-button')) {
        customElements.define('open-button', ButtonCtor);
      }

      const form = document.createElement('form');
      const host = document.createElement('open-button') as HTMLElement & {
        _internals?: { form: HTMLFormElement | null };
      };
      host.setAttribute('type', 'submit');
      host.textContent = 'Go';
      form.appendChild(host);
      document.body.appendChild(form);

      let submitEvent: { composed: boolean; bubbles: boolean } | null = null;
      form.addEventListener('submit', (event) => {
        // Prevent the follow-up requestSubmit() navigation; the assertion is
        // about the composed event crossing the shadow boundary.
        event.preventDefault();
        submitEvent = { composed: event.composed, bubbles: event.bubbles };
      });
      let openClickSeen = false;
      host.addEventListener('open-click', () => {
        openClickSeen = true;
      });

      const inner = host.shadowRoot?.querySelector('button');
      if (!inner) return { error: 'open-button shadow button not rendered' };
      inner.click();

      const outcome = {
        submitEvent,
        openClickSeen,
        internalsFormIsOuterForm: host._internals?.form === form,
      };
      form.remove();
      return outcome;
    });

    if (isProbeError(result)) throw new Error(result.error);

    // The inner shadow button's native submit behavior cannot cross the
    // shadow boundary; _handleClick re-dispatches a composed submit event...
    expect(result.submitEvent).toEqual({ composed: true, bubbles: true });
    // ...and still fires the component's own open-click event.
    expect(result.openClickSeen).toBe(true);
    // In a real browser the form association comes from ElementInternals.
    expect(result.internalsFormIsOuterForm).toBe(true);
  });
});
