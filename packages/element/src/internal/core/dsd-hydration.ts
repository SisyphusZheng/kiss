/**
 * DSD Hydration contract — shared interface for all adapter packages.
 * ADR-0079: Extracted from adapter-lit/vanilla/react.
 */
export interface DsdHydration {
  _dsdHydrated: boolean;
  _hydrateEvents(): void;
}

export type Constructor<T = HTMLElement> = new (...args: unknown[]) => T;

import { bindHydrateEvents } from './dsd-hydration-events.ts';
import type { HydrateEventDescriptor } from '../protocol/framework.ts';

/**
 * Shared DSD createRenderRoot logic.
 *
 * Detects a pre-populated shadow root (from SSR DSD), marks the element as
 * hydrated, and returns the existing shadow root. Otherwise attaches a new
 * open shadow root.
 *
 * Accepts `HTMLElement` and internally casts to `DsdHydration` to set the
 * `_dsdHydrated` flag. This allows callers where `_dsdHydrated` is declared
 * as `protected` in their mixin class hierarchy.
 *
 * Extracted from adapter-lit / adapter-react / adapter-vanilla to avoid
 * triplicate identical implementations.
 */
export function createDsdRenderRoot(element: HTMLElement): ShadowRoot {
  if (element.shadowRoot && element.shadowRoot.childElementCount > 0) {
    return element.shadowRoot;
  }
  return element.attachShadow({ mode: 'open' });
}

/**
 * Shared _hydrateEvents logic.
 *
 * Reads `hydrateEvents` from the constructor, creates an AbortController,
 * and binds event listeners on the element's shadow root via bindHydrateEvents.
 *
 * Returns the AbortController so the caller can store it (e.g. in a private
 * `_hydrateAbortController` field) and abort listeners on disconnect.
 *
 * Accepts `HTMLElement` and internally casts to `DsdHydration` to avoid
 * accessibility conflicts with `protected` members in caller classes.
 *
 * Extracted from adapter-lit / adapter-react / adapter-vanilla to avoid
 * triplicate identical implementations.
 */
export function hydrateDsdEvents(
  element: HTMLElement,
  ctor: { hydrateEvents?: readonly HydrateEventDescriptor[] },
): AbortController | undefined {
  if (!element.shadowRoot) return undefined;

  const events = ctor.hydrateEvents || [];
  if (events.length === 0) return undefined;

  const controller = new AbortController();
  bindHydrateEvents(element.shadowRoot, element, events, controller.signal);
  return controller;
}
