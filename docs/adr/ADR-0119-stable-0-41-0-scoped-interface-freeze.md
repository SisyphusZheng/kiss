# ADR-0119: Stable 0.41.0 With Scoped Interface Freeze and Recorded Pilot Exception

- Status: ACCEPTED
- Date: 2026-07-25

## Context

Three audit rounds (ADR-0116, ADR-0117, ADR-0118) are closed: alpha.16/17
reset correctness, alpha.18 closed sibling paths and evidence honesty, and
alpha.19 cleared the third round's 26 issues with the edge findings
mechanized into gates. The four core authoring APIs (`defineElement`,
`definePage`, `defineApp`, `buildApp`) show zero changes in the interface
snapshot across alpha.16 → alpha.19, and the export-star seams that kept
internal types reachable were closed in alpha.19. The static-first scope is
proven by the www dogfood (138 SSG pages), two desktop examples, the
packaged-starter and Nitro Node/Workers consumer matrix, third-party Web
Component smoke, and a three-engine browser gate.

The stable-decision clause in previous version plans required that "the
adopter pilot finds no unresolved architecture-level break". The #390
external adopter pilot, launched at alpha.16, recruited zero participants
across three release cycles. There is no pilot evidence of architecture
breaks — and no positive adoption evidence either. The maintainer has
decided not to wait for the pilot any longer.

## Decision

- Cut `0.41.0` as the stable five-package release with a **scoped
  interface freeze**:
  - Frozen: `defineElement`, `definePage`, `buildApp`; the static and SPA
    semantics of `defineApp` as shipped in alpha.19 (routes, islands, DSD
    output, SPA-mode loader/action chain); the five-package graph and the
    supported subpaths of `docs/current/PACKAGE_SURFACE.md`.
  - Explicitly **not** frozen: request-time data, forms, sessions and
    cache semantics (0.42/0.44 scope); adapter-vite internal subpaths
    (prune-or-retain decision executed in the stable plan); the
    `@openelement/ui` stable scope (decided at v0.46 per the roadmap).
- The #390 pilot requirement is **retired by maintainer decision**. Zero
  recruitment means no pilot evidence will exist on the current horizon;
  the stable cut proceeds on internal evidence (three audit rounds, the
  consumer matrix, dogfood) with this exception recorded here, in the
  stable version plan, and in the release evidence. Issue #390 is closed
  with a reference to this ADR. This is an explicit human exception, not
  fabricated evidence.
- Issue #37's gate text is refreshed inside the stable plan (current task
  names, the 0.41-applicable subset, and a replacement for the RC-soak
  gate: a seven-day P0 watch on the 0.41.x patch line after the stable
  tag).
- Stable `0.41.0` does **not** claim fullstack parity. The freeze covers
  the static-first contract and the SPA interaction chain as shipped.

## Consequences

Positive: the version label finally matches the evidence; the freeze scope
matches what is actually proven; governance credit is preserved by
recording the pilot exception instead of fabricating adoption evidence.

Negative: there is no external production validation before stable; a
post-stable architecture break inside the frozen scope would cost a major
version. This risk is accepted by the maintainer with the freeze scope
deliberately narrowed to the proven surface.

Neutral: the 0.42+ roadmap (WC Application Loop, Universal WC SSR,
Production Runtime) is unchanged; those versions extend the unfrozen
semantics without breaking the 0.41.0 contract.
