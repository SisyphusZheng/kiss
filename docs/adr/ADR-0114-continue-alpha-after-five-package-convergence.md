# ADR-0114: Continue alpha after five-package convergence

## Status

Accepted — 2026-07-13.

## Context

The five-package convergence originally used `0.41.0-beta.4` as its planning
name because npm beta.1 through beta.3 were incomplete artifacts. The product
surface is now coherent, but external adopter pilot #390 and later application
interfaces may still justify breaking architecture or authoring changes.

Calling the next release beta would imply a stronger stability signal than the
project is ready to make. The withdrawn npm beta artifacts cannot be deleted,
but they do not require the active roadmap to keep beta naming.

## Decision

- Publish the completed convergence as `0.41.0-alpha.9` under npm's `alpha`
  dist-tag.
- Retire `0.41.0-beta.4` as an active candidate name.
- Keep beta.1 through beta.3 only as immutable historical artifacts and mark
  them withdrawn wherever release history discusses them.
- Continue `0.41.0-alpha.x` releases while breaking changes remain plausible.
- Cut stable `0.41.0` only after external adoption and release evidence show
  that the five-package interfaces no longer need architecture-level change.

## Consequences

The package, Git tag, GitHub Release, docs and website use alpha.9 consistently.
The project gains an honest maturity label at the cost of a longer alpha line.
ADR-0113 remains historical evidence for the five-package boundary, but this
ADR supersedes its beta.4 naming decision.
