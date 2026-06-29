# ADR-0101: Product-Line Reset and AutoFlow3 Governance Boundary

- Status: Accepted
- Date: 2026-06-13
- Target: v0.40.0
- Supersedes: ADR-0099 heavy-framework island scope
- Depends on: ADR-0096, ADR-0099, ADR-0100
- Distribution channel superseded by: ADR-0108 for v0.41.0 (npm replaces JSR as
  the release exit gate)

## Context

v0.39.0 proved the Framework RC and restored JSR publish as a release exit
gate. The repository now has enough evidence to move the active development
line toward the v1 product shape, but the project carries two kinds of debt:

- product surface debt from keeping old, advanced, archived, and first-run
  surfaces equally visible;
- governance debt from duplicated SOP, NextVersion, hook, CI, and AutoFlow
  gate paths.

The project also needs a clearer automation boundary. AutoFlow should remove
mechanical process work, but it must not become the product owner or architecture
authority for minor, major, or v1 decisions.

## Decision

The current `dev` branch becomes the new product-line development branch. The
old v0.39 architecture state is frozen on `arch/v0.39-line`.

The active product line remains:

```text
openElement = Elements + UI + Framework + Protocols
```

The v0.40 line productizes this direction by focusing on `OpenElement`, the
future `@openelement/element` surface, Preact island proof, and signal-engine
conformance. ADR-0099's earlier Vue adapter proof language is superseded for
the pre-1.0 path. Vue, React, Svelte, and broad heavy-framework island expansion
remain frozen unless a later ADR reopens them.

Docs are simplified into four active classes:

| Class            | Role                                                         |
| ---------------- | ------------------------------------------------------------ |
| Current truth    | Status, roadmap, and the active version plan                 |
| ADR              | Architecture and product decisions                           |
| Release evidence | Gate, CI, publish, smoke, changelog, and release-note record |
| Archive          | Historical SOP, NextVersion, conversation, review, and drift |

New active version work should use one version plan instead of separate SOP and
NextVersion packages. Historical SOP and NextVersion files remain evidence until
they are moved into archive by a dedicated cleanup.

AutoFlow3 becomes the single workflow, gate, and evidence control plane:

- hooks call AutoFlow3 commands;
- CI calls AutoFlow3 commands;
- release evidence is recorded through AutoFlow3;
- gate definitions live in one policy registry.

AutoFlow3 may automate patch-level mechanical work only when policy checks prove
the change has no public API, package topology, release-policy, runtime-default,
security, auth, database, or minor/major roadmap impact.

AutoFlow3 must require human evidence for:

- minor version scope;
- major or v1 freeze scope;
- new public API;
- package addition, removal, or topology changes;
- default runtime, signal engine, cache, storage, database, auth, or security
  ownership changes;
- release-policy changes.

Minor and major release execution requires ADR plus approved version-plan
evidence. AutoFlow may generate drafts and execute approved plans, but it must
not decide those plans.

## Consequences

### Positive

- Product work can proceed from a smaller public surface without deleting
  historical evidence.
- AutoFlow becomes the single source for gate orchestration instead of another
  layer beside hooks and CI.
- Patch releases can become mechanical while minor and major decisions remain
  human-governed.
- Docs checks can focus on active truth instead of re-validating every
  historical planning artifact.

### Neutral

- Existing SOP and NextVersion files remain in place during the transition.
  Their active role is superseded, but their evidence value is preserved.
- CI still keeps specialized non-gate workflows such as security scanning,
  JSR publish, and monitors where needed.

### Negative

- AutoFlow3 becomes a critical path and needs policy tests before it can safely
  replace older gate entry points.
- The first cleanup is structural and governance-heavy before it produces new
  user-facing API.
- Release automation needs conservative guard rails to avoid turning process
  automation into architecture decision-making.

## Non-Goals

- Do not physically delete packages in this ADR.
- Do not move all historical docs in this ADR.
- Do not allow AutoFlow to choose minor or major scope.
- Do not make Preact the identity of openElement.
- Do not change the default signal engine without a later ADR and conformance
  evidence.
- Do not remove JSR publish as a v0.39+ release exit gate.

## Related

- `docs/current/VERSION_PLAN.md`
- ADR-0096: Protocol-First Vite + Nitro Runtime Architecture.
- ADR-0099: Four-Product Matrix and Elements Reset.
- ADR-0100: JSR Publish Exit Gate Restored.
- ADR-0108: npm Distribution via `deno pack` (Deno Development Toolchain).
