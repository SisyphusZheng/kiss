# Roadmap

OpenElement = Web Components-native fullstack application framework.

Source package line: `v0.44.0-beta.2`.
npm registry line: `v0.44.0-beta.2` (prerelease, dist-tag `beta`).
The npm `latest` dist-tag remains on the published stable 0.43 line.
Active execution target: `v0.44.0-beta.2.1`.
Latest landed train: `v0.44.0-beta.2`.
Next planned train: `v0.44.0-beta.2.1`.
Stable `1.0.0` remains unscheduled.

Execution follows [PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).

OpenElement's core products are **Element / Router**; UI is dogfood and a reference implementation. See the
[product model](../architecture/product-model.md) and accepted
[ADR-0152](../adr/ADR-0152-product-router-and-alpha-convergence.md).

## Active direction

The published Beta.2 baseline is followed by three convergence checkpoints:

1. **Beta.2.1:** independently maintained URLPatternList fork, one Router resolution,
   SSG/navigation repairs, standalone Element delivery and prerelease tooling.
2. **Beta.2.2:** first-class Native/Lit Framework Mode target: shared application
   flow, renderer-specific SSR/client continuation, Document and public metadata.
3. **Beta.2.3:** dual-mode hardening, independent packed consumers, runtime matrices,
   documentation, remaining cleanup and Alpha admission.
4. **Public 1.0 Alpha:** real application feedback may revise APIs/architecture;
   qualify independent consumers, Native/Lit matrices, performance and fork maintenance
   against identified artifact rounds.
5. **1.0 RC / Stable:** freeze admitted contracts/dependencies, reuse the real product
   for at least fourteen days of RC soak, verify install/upgrade/security and obtain
   human GO; separately evidence-gated and unscheduled.

Acceptance checkpoints replace the former three-day schedule. Lit is planned support,
not an already-qualified feature. No automatic Beta.2.4 or deadline waiver.
The [active plan](../current/VERSION_PLAN.md) owns scope and acceptance;
[the issue map](./v0.44.0-ISSUES.md) links execution work. Every replacement includes
removing displaced code, callers, obsolete checks and duplicated current facts.

## Tracking and state

- [Train root #1155](https://github.com/open-element/openelement/issues/1155)
- [Approved plan #1341](https://github.com/open-element/openelement/issues/1341)
- [Execution Project](https://github.com/orgs/open-element/projects/3)
- [Release state](../release/release-state.json): actual versions and planned target
- [Release policy](../governance/RELEASE_POLICY.md): publication evidence

The old Beta.3 lane is superseded; its open qualification work moves to 1.0 Alpha.
Historical internal v0.44 Alpha workspaces remain unpublished historical work IDs.
Upcoming 1.0 Alpha is public and uses npm `alpha`; `latest` remains the admitted
stable line. Changing this roadmap does not publish a version or complete a task.

Alpha product validation (#1179) precedes RC admission (#1243) and freeze (#1178).
RC soak (#1244) reuses that application; it does not postpone first product use until
RC. The [active plan](../current/VERSION_PLAN.md) defines artifact-round and migration
requirements. Historical 0.44 RC and 0.41 Stable exceptions are not current gates.
