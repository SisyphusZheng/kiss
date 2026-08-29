# Roadmap

OpenElement = Web Components-native fullstack application framework.

Source package line: `v0.43.3`.
npm registry line: `v0.43.3` (dist-tag `latest`).
Active execution target: `v0.44.0-alpha.0`.
Latest landed train: `v0.43.3`.
Next public prerelease: the first coherent compiled-framework alpha.

OpenElement `v0.43.3` is the published stable maintenance line. The active 0.44
train rebuilds the element model around a compiler-owned Part Program.

## Current: minimal Alpha.0 foundation

- #1160 compiler vertical proof — accepted
- #1182 / PR #1186 exact-SHA execution baseline — accepted
- PR #1190 current-truth reframe — accepted
- #1193 minimum server-side branch and integration safety — pending

Alpha.0 is unpublished and dev-only. Governance migration, publication hardening,
ADR/evidence convergence and media cleanup no longer block architecture work.

## Accelerated train

1. Parallel Compiler, Runtime and SSR/Claim lanes begin from one exact base SHA.
2. Integration I proves compiler -> Part Program -> server/create/claim -> exact
   reactive update.
3. App/Islands/Delivery broad implementation begins after Integration I while the
   first three lanes continue their second wave.
4. Integration II proves the real application/Vite/Nitro path.
5. Final Alpha removes replaced architecture and qualifies the framework.
6. Beta.1 qualifies UI.
7. Beta.2 qualifies website, content and generated API truth.
8. Beta.3 (#1192) completes repository, governance, asset and release hardening.
9. RC qualifies the exact public candidate through a real product.
10. Stable requires explicit final approval.

Internal Alpha work packages are not required to produce npm releases. Full CI runs
at integration-to-`dev` checkpoints rather than on every lane iteration.

The `1.0.0` target remains unscheduled.

Detailed live state belongs to GitHub issue #1155 and the
[v0.44 issue graph](./v0.44.0-ISSUES.md).
Execution follows [PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).
