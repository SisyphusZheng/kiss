# ADR-0150: Insert internal Alpha.9 semantic convergence before Beta.1

- Status: ACCEPTED (2026-09-01, maintainer directive)
- Date: 2026-09-01
- Amends: ADR-0147 post-Alpha handoff and ADR-0149 Beta.1 admission
- Preserves: ADR-0148 in full, the ADR-0149 Beta.1 through Stable ladder,
  exact-SHA qualification, and Beta.1 as the first public v0.44 prerelease

## Context

Alpha.8 integrated the independent Alpha workspaces into PR #1199. Review of that
integration proved that package-level integration is not yet sufficient for Beta.1
admission: some admission-critical concepts still have more than one implementation
that can decide public behavior, and several cross-environment parity contracts are
not yet mechanically demonstrated.

Publishing Beta.1 directly from this state would freeze unresolved ownership in the
first public v0.44 artifacts. The correction belongs inside the existing Alpha
integration authority, before the three-role public release loop begins.

## Decision

### 1. Alpha.9 is an internal admission checkpoint

The authoritative sequence is:

```text
internal Alpha.8 integration
  -> internal Alpha.9 semantic convergence
  -> Beta.1 framework qualification and first public v0.44 prerelease
  -> Beta.2 governance and release foundations
  -> Beta.3 UI qualification
  -> Beta.4 website/content/API/Starter qualification
  -> Beta.5 final hardening and immutable SaaS qualification
  -> RC from identical Beta.5 SHA and bytes after explicit human GO
  -> Stable after explicit human approval
```

Alpha.9 is a scheduling, implementation and evidence identifier only. It is not an
npm version, tag, GitHub Release, dist-tag, public Alpha, `main` promotion,
release-verifier cycle or branch-convergence phase. No Alpha.9 artifact is published.

### 2. PR #1199 remains the single Alpha integration authority

PR #1199 owns both checkpoints:

1. Alpha.8 integration closure; and
2. Alpha.9 semantic convergence and final exact-head qualification.

No second integration PR or stale Alpha.9 branch is introduced. Intermediate SHAs
are evidence only. Only the final exact PR head that passes the complete authoritative
matrix may merge to `dev`.

### 3. Alpha.9 is a hard Beta.1 admission blocker

Beta.1 remains the first public v0.44 prerelease and retains the complete ADR-0149
Beta.1 through Stable ladder. Beta.1 may begin only after PR #1199 is merged at its
accepted exact SHA and every Alpha.9 blocker has exact closure evidence.

Alpha.9 enforces one canonical semantic owner for each admission-critical concept.
Environment-specific representations, adapters, executors, caches and conforming
polyfills remain valid when they are mechanically derived from one definition or
prove identical observable behavior for supported input. Compatibility bridges,
hidden fallbacks and independently defined duplicate semantics are prohibited.

### 4. ADR-0148 is preserved without weakening

Compiler language semantics remain in the bundler-neutral private semantic core.
Vite remains the supported build integration shell. Compiler and Element runtime meet
only through a deterministic, serializable, versioned Part Program artifact.

Alpha.9 does not create a public `@openelement/compiler` or
`@openelement/router`, permit private compiler/runtime imports, add Vite dependencies
to the semantic core, or introduce a speculative generic bundler abstraction.

The Part Program convergence mechanism must be artifact-level: a canonical schema,
generated representations and/or a deterministic conformance corpus. Runtime-private
IR may be wider only after canonical wire validation and explicit normalization.

### 5. Required semantic convergence

Alpha.9 must close or mechanically prove single ownership for:

- Part Program compiler/runtime wire grammar;
- Trusted HTML admission and sinks;
- Community Context Protocol discovery with lifecycle-preserving local reactivity;
- URLPattern route grammar and the internal App RouteTable;
- compiler metadata and Vite delivery boundaries;
- Element-owned SSR, composition, document and claim semantics;
- App-owned loader, action, route and HTTP outcome classification across executors;
- islands, client reachability, activation and SSR admission; and
- the cross-cutting semantic ownership and exact-head qualification record.

`docs/current/SEMANTIC_OWNERSHIP.md` records current ownership and links to the
mechanical evidence. It does not replace tests.

## Consequences

- Alpha.8 and Alpha.9 finish in one review and one exact-head CI authority.
- Beta.1 starts from a semantically converged `dev` SHA rather than publishing an
  unresolved architecture boundary.
- The first public v0.44 prerelease, branch convergence and three-role loop remain
  Beta.1 work.
- No Alpha publication, tagging, release, dist-tag change, `main` promotion or branch
  deletion occurs.

## Verification

Alpha.9 is complete only when all owning issues contain closure evidence, the local
qualification matrix passes, the exact final PR #1199 head passes authoritative CI,
that unchanged SHA merges to `dev`, and Beta.1 is explicitly recorded as unblocked.
