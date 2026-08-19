/** Shared helpers and visual recipes for the public UI primitives. */
import { OpenElement, StyleSheet, type StyleSheetLike } from '@openelement/element';

/** Shared render() return type for the UI primitives. */
export type RenderResult = ReturnType<typeof OpenElement.prototype.render>;

// Instance-unique ids so multiple instances of one component on a page never
// collide on id/htmlFor/aria-*. Uniqueness holds within one realm only: SSG
// renders every page in a single process (the count accumulates across
// pages) and island hydration does not upgrade components in document order,
// so the server and client counters can assign different ids to the same
// instance. Pairs that must match across realms therefore have to be
// re-synced on the client — open-dropdown rewrites both anchor halves in
// connectedCallback, open-tabs re-decorates its light-DOM ids on every
// render. References that stay inside a single shadow render (open-input)
// need no repair.
let instanceCount = 0;

/** Return the next realm-unique instance id suffix. */
export function nextInstanceId(): number {
  return instanceCount++;
}

/**
 * Build a StyleSheetLike from a CSS string. Shared by the component-local
 * sheets so components do not repeat new StyleSheet()+replaceSync boilerplate.
 */
export function recipe(css: string): StyleSheetLike {
  const sheet = new StyleSheet();
  sheet.replaceSync(css);
  return sheet;
}

/**
 * Reflect the `disabled` attribute into ElementInternals custom states
 * (:state(disabled)/:state(enabled)). Shared by the form-associated
 * primitives (open-button, open-input).
 */
export function syncDisabledState(
  internals: ElementInternals | undefined,
  disabled: boolean,
): void {
  if (!internals?.states) return;
  if (disabled) {
    internals.states.delete('enabled');
    internals.states.add('disabled');
  } else {
    internals.states.delete('disabled');
    internals.states.add('enabled');
  }
}

export const controlRecipe: StyleSheetLike = recipe(`
  .control {
    font: inherit;
    color: var(--ui-control-text);
    background: var(--ui-control-bg);
    border: var(--border-size-1) solid var(--ui-control-border);
    border-radius: var(--ui-control-radius);
    box-shadow: var(--ui-control-highlight);
    transition: border-color var(--motion-fast) var(--motion-standard),
      background var(--motion-fast) var(--motion-standard),
      box-shadow var(--motion-fast) var(--motion-standard),
      transform var(--motion-fast) var(--motion-standard);
  }
  .control:hover { border-color: var(--ui-control-border-hover); }
  .control:focus-visible {
    outline: var(--focus-size) solid var(--focus-ring);
    outline-offset: var(--focus-offset);
  }
  .control:disabled, .control[aria-disabled="true"] { opacity: .48; cursor: not-allowed; }
`);

export const surfaceRecipe: StyleSheetLike = recipe(`
  .surface {
    color: var(--text-primary);
    background: var(--surface-glass);
    border: var(--border-size-1) solid var(--surface-border);
    border-radius: var(--surface-radius);
    box-shadow: var(--surface-highlight), var(--surface-shadow);
  }
`);

export const overlayRecipe: StyleSheetLike = recipe(`
  .overlay {
    color: var(--text-primary);
    background: var(--surface-overlay);
    border: var(--border-size-1) solid var(--surface-border-strong);
    border-radius: var(--overlay-radius);
    box-shadow: var(--surface-highlight), var(--overlay-shadow);
  }
`);
