/**
 * @openelement/element - DOM utilities shared across the runtime (#902).
 *
 * @internal
 */

/**
 * Remove all child nodes of a parent node.
 *
 * `el.replaceChildren()` clears + batches DOM mutations in one call, which
 * is faster than a while-removeChild loop for large trees and equivalent
 * for pure clearing. Only use where the loop's children are discarded —
 * loops that move children elsewhere keep their move semantics.
 */
export function clearChildren(el: ParentNode): void {
  el.replaceChildren();
}
