# Active decisions

Current product facts live in [docs/architecture](../architecture/README.md).
This directory is being reduced to decisions that remain active and cannot yet
graduate into current architecture.

ADR history is identified by original path plus Git blob SHA. Number collisions
are not renumbered. The deterministic migration manifest records whether each ADR
graduated, remains active, became historical/superseded, or was withdrawn, and its
canonical destination when applicable.

## When to write an ADR

Use an ADR only for a public API or package boundary, architecture topology,
security or trust boundary, compatibility or migration promise, or another
hard-to-reverse decision. Normal fixes, refactors, tests, documentation updates,
and tool configuration do not require an ADR.

## Current 0.44 decisions

- `ADR-0143-0-44-compiled-element-model-reentry.md`
- `ADR-0144-governance-offload.md`
- `ADR-0145-unified-content-graph.md` (scheduled for Alpha.7)
- `ADR-0146-three-role-agent-execution-control-plane.md`

The Alpha.0 ADR migration packet will replace this transitional list with the
final active-decision set and manifest. No new ADR is required for that governance
cleanup.
