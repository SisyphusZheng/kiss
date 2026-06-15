# v0.40.7 Version Plan - Release Readiness & CI Hardening

```text
openElement = Elements + UI + Framework + Protocols
```

## Objective

Harden the v0.40.6 release infrastructure so that the v0.40.x cleanup train can
be published reliably from both local dev machines and GitHub Actions. This
release introduces no public API or package topology changes.

## Context

v0.40.4 established the current product line: `Package Graph Collapse` to the
11-package graph documented in `docs/current/PACKAGE_SURFACE.md`, the Preact
island proof, the `SignalEngine` default switch under ADR-0104, and release
hardening. v0.40.6 completed the audit-driven quality cleanup scoped in
ADR-0106. The subsequent release attempts exposed mismatches between the local
environment (where credentials and browsers may be absent) and CI (where
browsers are not pre-installed). v0.40.7 closes those gaps.

The full verification matrix includes `nitro:proof:node` and
`nitro:proof:workers` as well as the `Test Matrix` listed below.

## Scope

- Replace the Python `http.server` E2E fixture with a Deno static server that
  supports directory indexes, HTML pretty URLs, and SPA fallback.
- Add an `OPEN_ELEMENT_E2E_OFFLINE=1` escape hatch for local E2E runs.
- Relax local-only E2E timeouts to accommodate slower Windows dev boxes.
- Gate JSR publish, wait-metadata, post-publish smoke, and GitHub release steps
  on the presence of required credentials.
- Install Playwright browsers explicitly in GitHub Actions workflows.
- Grant `--allow-env` to AutoFlow3 task invocations so environment checks work.
- Repair workspace mappings used by `consumer-local.ts` for the new
  `@openelement/core/prop` export and `@openelement/router`.
- Skip `smoke-deploy` when Cloudflare credentials are absent.

## Non-Goals

- No public API changes.
- No package additions or removals.
- No new product features.
- No git history rewrite.

## Governance Rules

- ADR-0101 is the product-line reset and AutoFlow3 authority boundary.
- ADR-0105 approves the v0.40.x breaking cleanup train.
- ADR-0106 approves the audit-driven quality cleanup scope for v0.40.6.
- v0.40.7 is a release-readiness patch under the same v0.40.x cleanup-train
  authority.

## Acceptance

- `deno task fmt:check`, `deno task lint`, `deno task typecheck`, and
  `deno task test` pass.
- `deno task graph:check` and `deno task package-surface:check` confirm no
  package or public surface changes.
- `deno task workflow:check` and `deno task workflow:check-slimming` pass.
- `deno task docs:check-public`, `deno task docs:check-current`, and
  `deno task docs:check-strategy` pass.
- `deno task autoflow:push` passes locally.
- GitHub Actions `AutoFlow CI` passes on `dev`.

## Verification

- `docs/release/v0.40.7.md` summarizing release-readiness changes.
- Updated `docs/status/STATUS.md` active line section.
- CI run evidence showing `test:e2e` passes after browser installation.
