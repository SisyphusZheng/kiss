# 2026-07-30 packages/ Code Review (verified)

> Scope: `packages/element`, `packages/app`, `packages/adapter-vite`,
> `packages/create`, `packages/ui` — source line `v0.42.0-alpha.8`, `main`.\
> Method: external review report, then every finding re-verified against
> source (files, line numbers, and claims read directly).\
> Disposition: all 11 findings filed as issues #632–#642, milestone
> `v0.42.0-alpha.9`. Plan: `docs/release/v0.42.0-alpha.9-plan.md`.

## Overall verdict

**Quality grade: B+ (good).** Clear layering across the five packages:
`element` = zero-dep runtime core, `app` = authoring API, `adapter-vite` =
build orchestration, `create` = scaffolding, `ui` = component library.
Verified: no `as any` and no TODO/FIXME anywhere in `packages/*/src`;
strong security posture (prototype-pollution guards, CSP nonce validation,
HTML escaping); ADR-referenced comments throughout.

## Findings (verified)

| ID | Sev (final) | Finding | Location | Issue |
|---|---|---|---|---|
| H-1 | **Medium** (downgraded, see below) | Module-level `dataStack` render context | `app/src/internal/router/data-context-store.ts` | [#632](https://github.com/open-element/openelement/issues/632) |
| H-2 | High | `escapeHtml` (map single-pass) vs `escapeAttr` (5 chained replaces) dual implementation | `element/src/internal/core/html-escape.ts:32-45` | [#633](https://github.com/open-element/openelement/issues/633) |
| M-1 | Medium | 1-line re-export layer `internal/router/internal/data-context.ts` | `app/src/internal/router/internal/data-context.ts` | [#634](https://github.com/open-element/openelement/issues/634) |
| M-2 | Medium | Per-package task matrix inconsistent (only `element` complete) | `packages/*/deno.json` | [#635](https://github.com/open-element/openelement/issues/635) |
| M-3 | Medium | Raw `console.error` in client-router/spa instead of `createLogger` | `app/src/internal/router/client-router.ts:377,380,487`; `app/src/spa.ts:64,204,211` | [#636](https://github.com/open-element/openelement/issues/636) |
| M-4 | Medium | `OpenButton._handleClick` ~50 lines, multiple responsibilities | `ui/src/open-button.tsx:232-281` | [#637](https://github.com/open-element/openelement/issues/637) |
| M-5 | Medium | Unused `export default` on all 10 UI components | `ui/src/*.tsx` | [#638](https://github.com/open-element/openelement/issues/638) |
| L-1 | Low | `_getLocale` reads `locale` via `as Record<string, unknown>` cast | `element/src/open-element-implementation.ts:599` | [#639](https://github.com/open-element/openelement/issues/639) |
| L-2 | Low | Redundant Fragment string-compare branch — at **3 sites**, not 1 | `render-ir.ts:216`, `jsx-render-dom.ts:328`, `event-hydration.ts:86` | [#640](https://github.com/open-element/openelement/issues/640) |
| L-3 | Low | `create` has `__tests__/cli.test.ts` but no `test` task | `packages/create/deno.json` | [#641](https://github.com/open-element/openelement/issues/641) |
| L-4 | Low | Unknown `tagName` in SPA `renderComponent` fails silently (blank page) | `app/src/spa.ts:70-92` | [#642](https://github.com/open-element/openelement/issues/642) |

## Verification corrections to the original report

1. **H-1 downgraded High → Medium.** The claimed "concurrent SSR stack-frame
   corruption" path does not exist: `authoring.ts:296-321` wraps
   push → `definition.render()` → pop in a **synchronous try/finally window**
   (`render()` is not async), so single-threaded JS cannot interleave two
   requests inside it. Residual (real) risk is narrower: hooks called by
   function components evaluated later in the async `renderToNode` phase may
   read an empty/foreign frame. `AsyncLocalStorage` remains the right
   long-term direction, as an architecture evolution item.
2. **M-2 risk wording softened.** Root `deno.json` `test` is a bare recursive
   `deno test`, so `app`/`ui`/`create` tests DO run via the root task. The
   gap is per-package DX and explicit CI invocation — not silent test loss.
3. **L-2 undercounted.** The redundant Fragment detection appears at 3 sites,
   not 1. `Fragment = Symbol.for('openelement.fragment')` uses the global
   symbol registry, so the string-compare branch is redundant absent a
   cross-realm scenario.

## Cross-cutting patterns

| Pattern | Sites | Governance |
|---|---|---|
| Non-unified logging | app (console) vs element/adapter-vite (createLogger) | #636 |
| Dual escape implementations | escapeHtml / escapeAttr | #633 |
| UI default exports | 10 component files | #638 |
| Package task drift | 5 packages, 5 shapes | #635 (+#641) |

## Dimensions not judged (missing evidence)

- Actual per-package CI gate coverage (workflows drive tests via autoflow
  tooling, not direct `deno task test` calls).
- npm publish consumer resolution of all subpath exports.
- Whether adapter-vite SSG rendering serializes requests (relevant to the
  residual H-1 risk only).
