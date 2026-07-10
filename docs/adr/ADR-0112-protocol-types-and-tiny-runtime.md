# ADR-0112: Protocol Types and Tiny Runtime

- Status: ACCEPTED
- Date: 2026-07-10

## Context

`@openelement/protocol` was described as type-only, but its public interface
already includes small runtime values such as `ErrorCode`, `ERROR_PREFIX`, and
hydration-marker validation. These values are shared vocabulary, have no host
dependencies, and moving them into core would couple consumers to an
implementation package.

## Decision

Protocol is a contracts package with a tiny standards-only runtime. Runtime
exports must be deterministic, side-effect free, and use no DOM, Deno, Node,
network, filesystem, timer, or process APIs. Stateful implementations and
product behavior remain outside protocol.

## Consequences

- Documentation matches the shipped package.
- Shared constants and pure guards remain at the contract seam.
- Protocol is no longer described as type-only or runtime-free.
- Runtime additions require architecture review to keep the surface tiny.
