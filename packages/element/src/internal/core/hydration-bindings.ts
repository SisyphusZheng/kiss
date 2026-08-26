/**
 * Signal-marker binding collection for hydration activation roots.
 *
 * Extracted from hydration-scope.ts (#1148) to keep the scope module under
 * the render-responsibility size budget; behavior is unchanged.
 *
 * @module ./hydration-bindings.ts
 */

import type { Signal } from '../protocol/signal.ts';
import { isInsideNestedLightHost } from './event-hydration.ts';
import { bindAttr, bindClass, bindRender, bindText } from './binding-descriptor.ts';
import type { BindingDescriptor, BindingLifecycle } from './binding-descriptor.ts';
import {
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  DATA_SIGNAL_RENDER,
  parseSignalAttrSpec,
} from '../protocol/hydration-markers.ts';

/**
 * Collect binding descriptors from data-signal markers in an activation root.
 *
 * `scopeLightHost` (ADR-0142, #1148) is set only when the root is a
 * light-mode host: markers inside a nested `data-oe-light` subtree bind in
 * the nested host's own scope and are pruned from this walk.
 */
export function collectHydrationBindings(
  root: Element | ShadowRoot,
  signalRegistry: Map<string, Signal<unknown>>,
  lifecycle: BindingLifecycle,
  scopeLightHost = false,
): BindingDescriptor[] {
  const descriptors: BindingDescriptor[] = [];

  for (const el of root.querySelectorAll(`[${DATA_SIGNAL}]`)) {
    if (scopeLightHost && isInsideNestedLightHost(el, root)) continue;
    const name = el.getAttribute(DATA_SIGNAL);
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    const hasClass = el.hasAttribute(DATA_SIGNAL_CLASS);
    const hasAttr = el.hasAttribute(DATA_SIGNAL_ATTR);

    if (hasClass) {
      const className = el.getAttribute(DATA_SIGNAL_CLASS);
      if (className) {
        descriptors.push(bindClass(el, className, sig));
      }
    }

    if (hasAttr) {
      const attrSpec = el.getAttribute(DATA_SIGNAL_ATTR);
      if (attrSpec) {
        const attrNames = parseSignalAttrSpec(attrSpec);
        if (attrNames.length > 0) {
          descriptors.push(bindAttr(el, attrNames, sig));
        }
      }
    }

    if (!hasClass && !hasAttr) {
      descriptors.push(bindText(el, sig));
    }
  }

  for (const el of root.querySelectorAll(`[${DATA_SIGNAL_RENDER}]`)) {
    if (scopeLightHost && isInsideNestedLightHost(el, root)) continue;
    const name = el.getAttribute(DATA_SIGNAL_RENDER);
    if (!name) continue;
    const sig = signalRegistry.get(name);
    if (!sig) continue;

    descriptors.push(bindRender(el, sig, lifecycle));
  }

  return descriptors;
}
