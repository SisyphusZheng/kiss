# ADR-0106: Audit-Driven Quality Cleanup for v0.40.6

Date: 2026-06-15

Status: Accepted

Relates to: ADR-0101, ADR-0105

## Context

ADR-0101 established AutoFlow3 as the workflow, gate, evidence, and release-state
control plane. ADR-0105 approved a manually-driven v0.40.x cleanup train to
collapse the workspace to an 11-package product line and remove historical
surfaces such as standalone runtime, style-sheet, and i18n packages.

The 2026-06-15 architecture audit (`docs/audit/2026-06-15-architecture-audit.md`)
found that the v0.40.4 product-line cleanup was successful, but that significant
internal quality gaps remain:

- `element` and `ui` packages are under-tested relative to their user-facing
  importance.
- Several source files exceed healthy size limits (`route-scanner.ts`,
  `open-element.ts`, `build-ssg.ts`).
- Error formatting, directory-traversal logging, and lifecycle cleanup patterns
  are duplicated across packages.
- Non-null assertions and type assertions are used heavily at SSR/DSD
  boundaries.
- Historical naming debt (`less`, `LessJS`, `less:`) still appears in internal
  identifiers and virtual module prefixes.
- `adapter-vite` carries more Vite/Rolldown-specific detail than is consistent
  with the adapter-agnostic SSG goal.

These findings are internal quality concerns. They do not require public API
changes, package additions or removals, default-runtime changes, or default
signal-engine changes. However, the scope is larger than a typical single-patch
mechanical fix and touches files that are central to the rendering and build
pipeline. It is therefore worth recording as an explicit architecture decision
and running under the v0.40.x cleanup-train authority rather than ordinary patch
automation.

## Decision

v0.40.6 is approved as an audit-driven quality cleanup release under the
v0.40.x cleanup train.

The approved work is limited to:

- Adding tests to `element` and `ui` until their test-to-source ratios meet the
  v0.40.6 targets.
- Splitting over-large source files into smaller internal modules without
  changing public exports.
- Extracting shared utilities for error formatting, safe file-system traversal,
  and lifecycle cleanup.
- Replacing unsafe non-null assertions with runtime guards or narrower type
  predicates.
- Unifying error handling to use framework error types instead of bare
  `throw new Error(...)`.
- Removing historical `less` / `LessJS` naming from internal identifiers,
  comments, and virtual module prefixes.
- Moving Vite-specific build details out of `adapter-vite` CLI entry points and
  into helper modules, without changing the public Vite plugin API.
- Replacing ad-hoc `console.*` usage with the shared logger where appropriate,
  or documenting intentional exceptions.

The following are explicitly out of scope:

- Public API changes.
- Package additions or removals.
- Default runtime, signal engine, or renderer changes.
- New product features such as forms, mutations, sessions, auth, or database
  recipes.

## AutoFlow Boundary

AutoFlow3 patch automation may execute the v0.40.6 release only when the release
state or command references the approved plan id:

```text
ADR-0105/v0.40.x-cleanup-train
```

or, for clarity, the combined id:

```text
ADR-0105+ADR-0106/v0.40.6-audit-cleanup
```

AutoFlow3 may run gates, produce evidence, classify changes, and execute an
approved release flow. It must refuse any change that adds or removes packages,
modifies public exports, changes default engines, or introduces new product
features under the v0.40.6 plan.

## Consequences

- The audit report becomes a persistent architecture artifact under
  `docs/audit/`.
- v0.40.6 closes the largest quality gaps identified by the audit without
  expanding the v0.40.x scope beyond internal cleanup.
- `package-surface:check` and `graph:check` must confirm that the public surface
  and package graph remain identical to v0.40.4.
- `element` and `ui` test counts are expected to increase substantially.
- File splits may temporarily complicate git blame; this is acceptable for
  long-term maintainability.
- Any finding that cannot be addressed without a public API change must be
  deferred to a future minor version with its own ADR and version plan.
