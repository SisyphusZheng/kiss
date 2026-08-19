# ADR-0131: 2026-08-19 P3 Batch Touches to Frozen Paths Preserve ADR-0122 Contracts

- Status: Accepted
- Date: 2026-08-19
- Amends: ADR-0122 §1/§2/§4
- Related: #1067, #1069

## Context

The #1067 audit P3 batch touched three files on the ADR-0122 frozen-semantics
list. Per the ADR-0122 Consequences rule (enforced by
`tools/check-frozen-semantics.ts`), this amendment records why each touch
leaves the frozen contracts intact.

## Decision

Accept the following three maintenance changes as contract-preserving:

1. **`packages/app/src/authoring.ts` (§1 loop contract).** The data-context
   `__enterDataContext`/`pushLoaderData` calls moved inside the render
   `try/finally`, and the exit runs only when the enter succeeded, so a
   throwing push can no longer strand a bridge frame. This is internal
   exception-safety only: loader/action signatures, `fail()`/`redirect()`
   algebra, PRG/revalidation semantics and the public data-context behavior
   are unchanged. The production depth guard in `data-context-store.ts` is
   kept with a comment documenting that it is reachable only from unit tests.

2. **`packages/adapter-vite/src/internal/ssg/entry-codegen.ts` (§2/§3 action
   protocol / CSRF default).** Dev-mode 404/error HTML responses now pass
   through `__withDevClientScript` like the success path, closing a dev/prod
   hydration divergence for islands on those pages. Generated action
   dispatch, header contracts, negotiation, morph output and the CSRF
   fail-closed matrix are untouched; the change is additive response
   post-processing in dev only (prod already injected on all HTML paths).

3. **`packages/adapter-vite/src/cli/start.ts` (§4 first-mile start).**
   `OPEN_ELEMENT_PORT` is validated as an integer in 1–65535 with a friendly
   error instead of crashing with `ERR_SOCKET_BAD_PORT`, mirroring the
   generated `serve.mjs`. The build→start contract, serve modes and request
   handling are unchanged; this is diagnostics only.

## Consequences

- Future P3-class maintenance on frozen paths must follow the same pattern:
  cite or author an amendment ADR that argues contract preservation per file.
- The frozen-semantics gate passes on this change set via this amendment
  (option 1 in `tools/check-frozen-semantics.ts`).
- Interface snapshot regenerated (`./cli/start`, `./open-code-block`,
  `./open-input` sha-only changes; no public declaration changes).
