# Roadmap

OpenElement = Web Components-native fullstack application framework.

Source package line: `v0.43.3`.
npm registry line: `v0.43.3` (dist-tag `latest`).
Active execution target: `v0.44.0-alpha.0`.
Latest landed train: `v0.43.3`.
Next planned train: `v0.44.0-alpha.1`.
Next public prerelease: `v0.44.0-beta.1`.
Long-term stable product target: `1.0.0` (unscheduled).

Execution follows
[PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).

## Current: internal Alpha workspace train

Alpha.0 supplies the accepted compiler proof, exact-SHA CI foundation and minimum
history safety. After a short contract/path freeze, alpha.1 through alpha.7 run as
independent parallel workspaces. Alpha.8 is the sole aggregation workspace.

- alpha.1 — Compiler / Part Program
- alpha.2 — Runtime / Signals
- alpha.3 — SSR / DOM Claim
- alpha.4 — App / Islands / Delivery
- alpha.5 — Replacement / Migration
- alpha.6 — Interoperability
- alpha.7 — Performance / Qualification
- alpha.8 — Final Integration

These are internal work identifiers, not package releases. The three-role loop is off
for all Alpha work. Each workspace has one end-to-end agent; alpha.8 has the one final
integration agent.

The alpha.8 PR to `dev` owns the authoritative full matrix. All other workspaces run
targeted gates. Alpha never tags, publishes, changes a dist-tag or promotes `main`.

## Product ladder

1. Beta.1 qualifies the UI system and activates three-role release governance.
2. Beta.2 qualifies content, API metadata and the real website.
3. Beta.3 migrates governance to mature tools, converges current ADR/docs, externalizes
   immutable media, and hardens publication/provenance.
4. RC performs exact-SHA real-product admission at #1178.
5. Stable requires explicit approval.

The detailed mapping lives in `docs/roadmap/v0.44.0-ISSUES.md`.
