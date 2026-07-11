# ADR-0104: Signal Engine Default Policy

- Status: Superseded by alpha.7 fixed-engine policy (Updated 2026-07-11)
- Date: 2026-06-13
- Target: v0.40.x
- Depends on: ADR-0096, ADR-0101

## Context

v0.40 evaluates `@preact/signals-core` because Preact is the priority
heavy-framework island proof. However, a default signal-engine change affects
runtime behavior and is explicitly protected by ADR-0101.

The current signal package uses an existing default engine behind
`@openelement/signal`. Protocols already define `SignalEngine` and conformance
tests.

## Decision (Updated 2026-06-14)

Switch the default signal engine from `alien-signals` to `@preact/signals-core`.

The switch is safe because:

- The `SignalEngine` protocol boundary fully abstracts engine details.
- Both engines pass the same conformance test suite.
- `@preact/signals-core` is already a declared dependency of `@openelement/signal`
  (added in v0.40.0 as a candidate).
- `@preact/signals-core` is the fixed private implementation. The protocol
  `SignalEngine` type remains useful for conformance tests, but runtime engine
  replacement is not a supported application feature.
- `@openelement/core` and `@openelement/element` do not import
  `@preact/signals-core` directly — they depend on `@openelement/signal` which
  bundles the dependency.

### Runtime switching

Runtime switching was removed in alpha.7 because a process-global mutable
engine made SSR, tests, and effect cleanup dependent on execution order.

## Non-Goals

- Do not make Preact the identity of openElement.
- Do not add Preact or `@preact/signals-core` as a required dependency of
  `@openelement/core` or `@openelement/element`.
- Do not change signal scheduling or host update semantics without tests.

## Consequences

### Positive

- `@preact/signals-core` is a smaller, well-maintained engine with broad ecosystem
  compatibility.
- A single fixed engine keeps SSR, CSR, test, and cleanup behavior deterministic.

### Negative

- Consumers must use the documented portable signal API; engine-specific
  behavior is not part of the OpenElement contract.

## Acceptance

- Existing signal tests remain green after the switch.
- Preact Signals passes `runSignalEngineConformance`.
- `@openelement/core` and `@openelement/element` do not require Preact signal
  packages.
- `effectScope` is not in the main `@openelement/signal` export.
