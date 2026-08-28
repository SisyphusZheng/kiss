# Thinker review — a0-001 initial implementation

```yaml
reviewer: thinker/low-effort
candidate: 0.44.0-alpha.0
issue: 1160
loopId: a0-001
baseSha: e31ab34eb8cea52fe07d6d138d0b0cfbba9d0f17
implementerSession: session_5998df53-7c93-43ef-a13c-424763ba16cd
implementerExitCode: 0
decision: NO-GO-REPAIR
reviewedAt: 2026-08-27T11:58:57Z
```

## Accepted evidence

- The implementation stayed inside packet-owned product paths. The existing
  `docs/current/v0.44.0-EXECUTION-STATE.json` change and dispatch packet are thinker-owned.
- The compiler uses the TypeScript AST, fails closed for tested unsupported syntax and
  emits deterministic program data without a VNode, BindingDescriptor, hydration walker
  or fallback interpreter.
- The same frozen program artifact is structurally pinned by the adapter test and consumed
  by the element runtime test for server serialization, fresh DOM and claim.
- The implementer reported all eight packet gates with exit code 0. The thinker independently
  reran all eight; every command also exited 0. The thinker additionally confirmed the
  package entry point does not
  expose `compiledSpike`; `createOpenPlugin` is the documented internal factory.
- Full regressions passed: adapter-vite 638 tests and element 294 tests.

## Rejected findings

### R1 — SignalEngine-dependent first-write loss

`subscribeWrites()` unconditionally drops the first callback. That preserves live claim
values for the current Preact engine because its subscription immediately delivers the
current value, but the public Signal protocol does not require immediate delivery. A
conforming lazy-delivery engine would lose its first real update. This contradicts the
ADR-0143 replaceable-engine boundary and the implementer result incorrectly calls the
case harmless.

Required correction: suppress only a synchronous initial delivery matching the value
observed immediately before subscribing. A callback delivered after subscription returns
must be treated as a real update. Add a protocol-only lazy-delivery Signal test proving its
first write updates the subscribed Part and does not touch an unrelated sink.

### R2 — reflected-property lowering is parsed but discarded

The fixture contains `@property({ reflect: true }) count`, and the compiler records the
boolean in `SpikeField`, but generated output and assertions do not preserve or expose it.
The evidence therefore proves decorator syntax acceptance, not compilation of the reflected
property requested by #1160.

Required correction: emit deterministic internal compiled-property metadata on the
generated class (or another equally bounded, non-public generated artifact) that preserves
`count: { reflect: true }` and `label/items: { reflect: false }`. Assert the metadata in the
actual Vite transform output. Do not add reflection runtime semantics, public exports or a
new Part Program grammar commitment; #1161/#1162 own those later contracts.

### R3 — RED evidence needs a behavior-first adapter assertion

The recorded harness checks passed, but the adapter RED ultimately failed when the new
compiler module was absent. Strengthen the final test ordering so the opt-in pipeline
assertion checks `createOpenPlugin({ compiledSpike: true })` before importing the new module.
Document a reproducible base-SHA RED command using an isolated temporary worktree or
equivalent immutable checkout: the assertion must fail because the opt-in pipeline lacks the
compiled plugin, not because a module cannot be resolved. Do not rewrite the original RED
record; add the stronger supplemental evidence.

## Independent commands

All exited 0 on the initial implementer result:

- `deno test -A packages/adapter-vite/__tests__/compiled-element-spike.test.ts`
- `deno test -A packages/element/__tests__/compiled-part-program-spike.test.ts`
- `deno task --cwd packages/adapter-vite typecheck`
- `deno task --cwd packages/element typecheck`
- packet-scoped `deno lint`
- packet-scoped `deno fmt --check`
- `deno task arch:check`
- `git diff --check`

Passing gates do not override R1–R3. The candidate remains NO-GO until the repair packet is
implemented and independently re-reviewed.
