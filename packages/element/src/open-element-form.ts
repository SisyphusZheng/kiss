/**
 * Attach ElementInternals for form-associated custom elements.
 *
 * Extracted from the base class (#904, concern: formAssociated +
 * delegatesFocus). Returns internals only when the component opted in via
 * `static formAssociated` and the runtime provides attachInternals
 * (non-browser test doubles may not).
 */
export function attachFormInternals(
  element: {
    attachInternals?: () => ElementInternals;
  },
  ctor: { formAssociated?: boolean },
): ElementInternals | undefined {
  if (ctor.formAssociated && typeof element.attachInternals === 'function') {
    return element.attachInternals();
  }
  return undefined;
}
