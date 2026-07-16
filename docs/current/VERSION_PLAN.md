# v0.41.0-alpha.15 — adoption qualification and stable-readiness plan

> Current source package line: `v0.41.0-alpha.14`\
> Current npm registry line: `v0.41.0-alpha.14`\
> Active release target: `v0.41.0-alpha.15`\
> Next stability candidate: `v0.41.0`\
> Current maturity stage: alpha

## Objective

Alpha.15 is the final planned qualification line before deciding whether the
five-package `0.41.0` interface is ready to freeze. It does not add a new
product area. It modernizes the CI runtime, removes remaining current-truth
drift, exercises the published product with external adopters and records a
mechanical public-interface baseline.

```text
OpenElement = Web Components-native fullstack application framework
current proven scope = static-first applications with fullstack output paths
component contract = standard Custom Elements
official build path = Vite + Nitro
```

The authoritative five-package contract remains
[`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md). Alpha naming remains governed by
[`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md)
until external evidence justifies a stability commitment.

## Entry truth

- `v0.41.0-alpha.14` is the current source and published npm package line.
- All five npm `alpha` dist-tags resolve to alpha.14 and its published consumer
  matrix is complete.
- Alpha.14's immutable tag and two-stage evidence must not be rewritten.
- The external adopter pilot #390 and stable gate #37 remain open.
- Dependabot PRs #391–#395 are stale direct-to-main proposals and must be
  superseded through the governed `feature -> dev -> main` flow.

## Alpha.15 execution packages

### A. CI runtime modernization

- Replace #391, #392, #394 and #395 with one coherent feature PR against
  `dev`, updating checkout, upload-artifact, setup-node and dependency-review
  to reviewed immutable SHAs.
- Update adjacent version comments and make the workflow checker validate that
  comments, action identities and pinned SHAs agree.
- Resolve #393 explicitly: make OpenCode review advisory and skip Dependabot
  actors, or remove the workflow if it cannot provide reliable value. External
  review balance, permission or provider failures must not block AutoFlow.
- Prove the Node 24 action runtime while retaining explicit Node 22 npm publish
  execution.
- Dispatch the nightly workflow and download both evidence artifacts; run the
  release workflow through a no-publish dry-run.

### B. Current-truth enforcement

- Align README, Chinese README, governance, roadmap, status, website and all
  current contracts on alpha.14 as the published line and alpha.15 as the
  active target.
- Remove current-document claims that alpha.10, alpha.7 or a beta line is the
  active implementation or maturity anchor.
- Extend `docs:truth` so old active versions, old implementation anchors and
  beta-current wording fail mechanically.
- Preserve historical beta artifacts, failed alpha.13 publication evidence and
  alpha.14 release evidence only in historical records.

### C. Adoption pilot infrastructure

- Publish a repeatable #390 pilot kit containing environment capture, exact
  starter commands, timing fields, failure taxonomy, consent/privacy guidance
  and an anonymized result template.
- Run the current exact-version npm starter on Linux, macOS and Windows across
  supported Deno and Node consumer paths.
- Provide one documented Node deployment and one Workers deployment path that
  a non-maintainer can execute without private instructions.
- Record actionable diagnostics for install, typecheck, build, preview and
  deployment failures.

### D. External adoption and interface freeze rehearsal

- Three to five non-maintainers execute the pilot without private maintainer
  guidance; at least one completes component authoring, SSR or SSG, an
  interactive island and deployment.
- Publish an anonymized pilot summary. Every P0/P1 finding becomes an issue;
  P0 findings must be fixed and P1 findings fixed or explicitly block stable
  readiness.
- Snapshot public exports, TypeScript declarations, defaults, error shapes and
  documented behavior for all five packages.
- Establish compatibility tests for `defineElement`, `definePage`, `defineApp`
  and `buildApp`, plus the documented package subpaths.
- Any pilot-driven breaking change requires an ADR, migration note and explicit
  alpha.15 acceptance evidence. No unproven abstraction or new package is
  introduced.

### E. Stable-readiness dossier

- Produce a `0.41.0` readiness report mapping every public interface to tests,
  docs, packed artifacts and adopter evidence.
- Decide the optional `@openelement/ui` commitment for `0.41.0`: explicitly
  included, or retained as alpha-quality optional surface with documented
  compatibility limits.
- Record browser/runtime support, upgrade policy, error compatibility and
  release rollback rules.
- Keep #37 open unless every stable gate is genuinely satisfied; alpha.15 may
  conclude that another alpha is necessary.

### F. Alpha.15 release closure

- Run release-prepare only after A–E pass, synchronizing all five manifests,
  Create CLI, starter mappings and current version anchors to
  `0.41.0-alpha.15`.
- Pass AutoFlow, CodeQL, dependency review, Pages, all-browser E2E, Nitro,
  packaged consumers, artifacts and npm publish dry-run on `dev` and `main`.
- Publish all five npm packages and the `alpha` dist-tag, then verify fresh
  Deno, Node ESM, starter, Nitro Node/Workers, third-party Web Component and CDN
  consumers.
- Create an immutable `v0.41.0-alpha.15` tag, GitHub prerelease and completed
  two-stage evidence record; finish with `origin/main` and `origin/dev` at the
  same SHA.

## Pull request order

1. Formal plan and current-truth baseline.
2. CI runtime modernization and OpenCode disposition.
3. Pilot kit, cross-platform consumers and deployment instructions.
4. Pilot findings, interface corrections and public-contract snapshot.
5. Stable-readiness dossier and alpha.15 release-prepare.
6. `dev -> main` release PR and post-publish evidence finalization.

Every implementation PR targets `dev`, identifies its plan package, and passes
AutoFlow before merge. `dev` is merged to `main` only after the complete
alpha.15 line is green.

## Acceptance

- No current public or governance document identifies alpha.10, alpha.7 or beta
  as the active line.
- Four supported GitHub Action upgrades are pinned, commented and exercised;
  OpenCode is demonstrably advisory or removed.
- Published consumers pass on Linux, macOS and Windows.
- #390 has real, publishable evidence from three to five non-maintainers.
- The five-package interface snapshot and compatibility suite pass against
  packed artifacts.
- There are no unresolved alpha.15 P0 findings; every P1 is resolved or an
  explicit release blocker.
- Chromium, Firefox and WebKit pass the functional matrix.
- Nitro Node and Workers pass through the supported `nitro-mount` seam.
- npm, dist-tags, exact-version starter, tag, GitHub prerelease, docs and final
  evidence all agree on `0.41.0-alpha.15`.
- Alpha.14 evidence remains unchanged.

## Non-goals

- Do not add packages, publish JSR artifacts or claim broad fullstack parity.
- Do not introduce speculative auth, database, session or cache products.
- Do not promise stable `0.41.0` merely because alpha.15 publishes.
- Do not fabricate, simulate or replace external adopter evidence with internal
  CI runs.

## Stable decision after alpha.15

`0.41.0` may be prepared only when the adopter pilot finds no unresolved
architecture-level break, the interface snapshot needs no further breaking
change, the optional UI commitment is explicit, and #37's applicable `0.41.0`
gates are evidenced. Otherwise the evidence selects a narrowly scoped next
alpha instead of weakening the stable contract.
