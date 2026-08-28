# Thinker review — a0-001 repair 1

```yaml
reviewer: thinker/low-effort
candidate: 0.44.0-alpha.0
issue: 1160
loopId: a0-001-repair-1
baseSha: e31ab34eb8cea52fe07d6d138d0b0cfbba9d0f17
implementerSession: session_5998df53-7c93-43ef-a13c-424763ba16cd
implementerExitCode: 0
decision: GO
reviewedAt: 2026-08-27T12:23:48Z
```

## Repair findings

- **R1 closed:** `subscribeWrites()` now snapshots before subscription and suppresses only
  a synchronous, snapshot-equal echo. A protocol-only lazy-delivery Signal test proves its
  first real write updates the subscribed Part and does not touch an unrelated sink. The
  original Preact immediate-delivery and successful-claim live-value assertions remain.
- **R2 closed:** the compiler emits deterministic, internal `__compiledProperties` metadata
  preserving `count.reflect=true` and `label/items.reflect=false`. The actual Vite transform
  output is parsed and asserted. No runtime reflection, public export or schema freeze was
  introduced.
- **R3 closed:** the adapter opt-in assertion executes before the compiler-module import.
  The thinker independently created an immutable `e31ab34e` worktree and ran the assertion
  probe;
  it exited 1 with `Actual false / Expected true`, proving absent behavior rather than a
  module, dependency or harness failure. The temporary worktree was removed.
- **R4 closed:** the original result corrects the lazy-engine claim and updates generated
  bytes to 3404.

## Scope and architecture

- Product edits remain within the original packet paths. No package entry point, package
  configuration, version or public API was changed. `compiledSpike` exists only on the
  documented internal plugin factory and is not present in the package entry configuration.
- No workspace alias or private cross-package import was added.
- Searches found no VNode, BindingDescriptor, HydrationScope, generic discovery walker,
  compatibility renderer or interpreter in the production implementation. Matching words
  occur only in explanatory comments and negative assertions.
- The 0.43 renderer and all forbidden paths remain untouched by the implementer.
  Thinker-owned execution
  state and evidence are the only control-plane changes.

## Independent verification

The thinker reran the following on the repaired worktree:

- adapter spike test: exit 0, 4 tests / 13 steps;
- element spike test: exit 0, 2 tests / 10 steps;
- adapter and element typechecks: exit 0;
- packet lint and format check: exit 0;
- architecture check and `git diff --check`: exit 0;
- existing plugin regression: exit 0, 43 tests;
- full adapter suite: exit 0, 638 tests / 71 steps;
- full element suite: exit 0, 294 tests / 10 steps;
- repository `deno task test`: exit 0, including the independent starter package tests;
- immutable base-SHA behavior RED probe: expected exit 1 with assertion `false != true`.

## Decision

The one-component TSX-to-Part Program spike satisfies the a0-001 dispatch and #1160
acceptance slice. The result is an internal alpha.0 proof, not a frozen schema, decorator
contract, browser matrix or general performance claim. Those explicitly remain with
#1161/#1162/#1163 and later runtime/claim issues.

Thinker decision: **GO** for committing the #1160 slice and entering PR/CI review against `dev`.
This is not the alpha.0 version-closure GO; the remaining alpha.0 issues must still land and
a fresh release verifier is required at the scheduled version boundary.
