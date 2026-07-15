# ADR-0115: Single Element Authoring Helper

- Status: ACCEPTED
- Date: 2026-07-15

## Context

`defineLayout` was a shallow semantic alias that delegated directly to
`defineElement` without adding a layout contract, type, runtime behavior, or
tooling capability. Keeping both names expanded the alpha public surface and
made generated projects teach a distinction the runtime did not implement.

Static prop getters also intentionally return reactive `Signal` objects under
ADR-0057. That behavior is retained and documented rather than replaced with a
second value-only property model.

## Decision

Remove `defineLayout` from the Element and App root exports. Elements used as
layouts are declared with `defineElement(tagName, definition)`. Existing alpha
callers migrate by changing only the imported and invoked symbol; the arguments
and runtime behavior are unchanged.

Static prop getters continue to return `Signal` objects. Attribute removal
restores the declaration's normalized default value.

## Consequences

- Element authoring has one helper and one documented mental model.
- The starter, current guides, READMEs, package-surface inventory, and release
  notes use `defineElement` consistently.
- This is an intentional alpha breaking change and carries no stable-version
  compatibility promise.
