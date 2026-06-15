/**
 * @openelement/element — Reactive property runtime.
 *
 * Re-exports the prop utilities from `@openelement/core/prop` to avoid
 * maintaining a second copy of the runtime in the element package.
 *
 * ADR-0052 / SOP-010 / ADR-0057: static props + Signal model.
 */

export * from '@openelement/core/prop';
