/**
 * WWW light-mode probe island (#1148 / ADR-0142 acceptance fixture).
 *
 * Exercises the real SSR -> delayed-upgrade path of a `renderMode = 'light'`
 * island in a browser: the server-rendered host carries the internal
 * `data-oe-light` provenance marker plus the hydration marker set
 * (data-eid / data-signal), and the client upgrade must activate the
 * surviving DOM in place — node identity, focus, selection, live form values,
 * and a pre-upgrade click all preserved.
 *
 * Driven by www/e2e/light-mode-activation.spec.ts on Chromium, Firefox, and
 * WebKit; rendered by the /probe-light route (www/app/routes/probe-light.tsx).
 *
 * Island config: `ssr: true` admits the host to the SSR renderable set;
 * `dsd` is deliberately omitted — light mode renders into the host and emits
 * no `<template shadowrootmode>`. `hydrate: 'load'` makes the client entry
 * import this island's chunk immediately at evaluation, which is what lets
 * the spec delay the upgrade by holding that chunk's response.
 */

import { defineCustomElement } from '@openelement/element';
import { OpenElement } from '@openelement/element';
import { signal } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';

export const tagName = 'open-light-probe';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true });

export default class OpenLightProbe extends OpenElement {
  static override renderMode = 'light' as const;

  #count = signal(0);

  constructor() {
    super();
    this.registerSignal('count', this.#count);
  }

  override render() {
    // The input is a static control: no markers, no bindings. Its typed
    // value, selection, and focus must survive in-place activation.
    // The span is signal-bound text: SSR renders
    // <span data-signal="count">0</span>; activation binds the surviving
    // node, proving live reactivity.
    return (
      <div class='light-probe'>
        <input type='text' class='probe-input' aria-label='Light probe input' />
        <button
          type='button'
          class='probe-button'
          onClick={() => {
            this.#count.value += 1;
          }}
        >
          increment
        </button>
        <span class='probe-count' data-signal='count'>{this.#count.value}</span>
      </div>
    );
  }
}

defineCustomElement(tagName, OpenLightProbe);
