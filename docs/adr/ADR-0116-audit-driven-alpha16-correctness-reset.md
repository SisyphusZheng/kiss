# ADR-0116: Audit-Driven Alpha.16 Correctness Reset

- Status: ACCEPTED
- Date: 2026-07-23

## Context

A full-project audit on 2026-07-23 (code quality, architecture conformance,
test credibility, governance drift, external adoption) found defects on the
framework's core correctness promises that alpha.15's qualification gates did
not catch:

- SSR-to-hydration event markers (`data-eid`) rely on an implicit identical
  traversal order on both sides; function props on registered custom-element
  hosts and runtime-dependent `<Show>`/`<For>` branches can deterministically
  misalign handler binding, with no validation or fallback.
- Static props register `observedAttributes` inside `connectedCallback`, but
  browsers read `observedAttributes` once at `customElements.define()` time, so
  attribute-to-signal synchronization never fires in real browsers; the DOM
  shim in unit tests masked this.
- The island chunk filename matcher in SSG post-processing does not cover the
  base64url hash alphabet (`-`/`_`), silently dropping island chunks.
- The published npm `latest` dist-tag points at alpha.6 while the alpha line
  has reached alpha.15, and published-starter builds reject Windows drive
  paths (#460), so a first-time external adopter's experience fails on
  contact.
- Current-truth documents (STATUS, VERSION_PLAN, README, ROADMAP, ADR index)
  drifted one release behind because no gate asserts doc version anchors
  against `tools/project-constants.ts`.

Under the stable-decision rule in `docs/current/VERSION_PLAN.md`, evidence
selects a narrowly scoped next alpha instead of weakening the stable contract.

## Decision

- Cut `v0.41.0-alpha.16` as an audit-driven correctness reset. It adds no new
  product surface, package, or speculative abstraction.
- P0 correctness fixes (event-marker alignment, static-props attribute
  observation timing, island chunk matching, npm `latest` policy and the #460
  Windows path fix) are release-blocking and preconditions for any stable
  `0.41.0` decision.
- P1 test-credibility work (real-browser hydration coverage, SSR error-path
  tests, coverage denominator, critical-path gate honesty, cross-browser CI
  smoke), P2 convergence hygiene (deduplicated island declaration
  construction, dead-code removal, doc-version-anchor gate, export-surface
  slimming) and P3 strategic items (#390 pilot start, governance tooling
  evaluation, UI consumer deadline) are recorded as alpha.16 execution
  packages in the active version plan.
- The public-interface snapshot is re-recorded only after P0 fixes land, so
  the freeze rehearsal measures corrected behavior.
- Governance drift found by the audit is cleared in the same version, and the
  missing mechanical checks are scheduled as alpha.16 work rather than fixed
  ad hoc.

## Consequences

Positive: the stable freeze rehearsal measures a corrected renderer; external
adopters get a working first contact; the audit's findings become governed
tasks instead of chat history.

Negative: the `0.41.0` stable decision is deferred again; the alpha line
lengthens, which ADR-0114 already accepted as the honest maturity label.

Neutral: ADR-0106 remains the precedent for audit-driven cleanup, but this
ADR exists because alpha.16 changes correctness behavior of public rendering
contracts, not only hygiene.
