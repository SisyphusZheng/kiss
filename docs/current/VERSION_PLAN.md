# v0.42.0 — WC Application Loop release plan

> Current source package line: `v0.41.2`\
> Current npm registry line: `v0.41.2`\
> Active release target: `v0.41.1`\
> Planning release target: `v0.42.0` (WC Application Loop)\
> Next release line: `v0.43.0` (Universal WC SSR)\
> Current maturity stage: stable (0.41.x line); 0.42.0 planned under ADR-0120

## Objective

`0.42.0` ships the WC Application Loop governed by
[`ADR-0120`](../adr/ADR-0120-0-42-0-wc-application-loop-scope.md): one
route-to-interaction loop — load, DSD render, progressive form, action,
error/redirect and revalidation — that works without JavaScript. It extends
the frozen static-first model to request time without touching the ADR-0119
freeze surface.

```text
OpenElement = Web Components-native fullstack application framework
0.42 scope = the route-to-interaction loop at request time
component contract = standard Custom Elements (unchanged)
official build path = Vite + Nitro (unchanged)
```

The protocol layer is evidence-backed by the six-framework study archived at
[`docs/audit/2026-07-27-application-loop-framework-research/`](../audit/2026-07-27-application-loop-framework-research/README.md):
standard form POST wire format, one POST/two responses, the 303/422 status
rule, the throw/return error dichotomy, and the after-action revalidation
invariant.

## Entry truth

- The `0.41.x` line is stable and frozen (ADR-0119); its plan is archived at
  [`docs/release/v0.41.0-plan.md`](../release/v0.41.0-plan.md). The
  five-package graph is unchanged by this plan, and alpha naming for the
  0.42 line remains governed by
  [`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md).
- The external adopter pilot #390 stays retired by ADR-0119; 0.42 builds
  adoption evidence through reproducible recipes and dogfooding instead of
  a pilot program.
- Request-time data, forms, sessions and cache are explicitly unfrozen;
  this plan covers data and forms only. Sessions and cache stay with
  `0.44.0`.
- ADR-0120 records the scope boundary (self-built loop semantics and
  continuity mechanism; third-party server layer and Web-standard context)
  and the action protocol. Changes to either require an ADR-0120 amendment.
- The line ships as four themed alphas plus the stable decision; the stable
  freeze scope for request-time semantics is decided by a separate ADR at
  the end of the line.

## Task packages

Each package lists its entry conditions (准入), execution steps, and exit
criteria (准出). A package starts only when every entry condition holds and
closes only when every exit criterion is evidenced in the repository.

### TP-0 — Release tooling self-repair (`0.41.2` patch line)

Goal: fix the two tooling defects that bit during the 0.41.1 release before
any 0.42 release runs on them.

- 准入: none; may start immediately and ship independently of TP-1..TP-6.
- 执行步骤:
  1. `tools/autoflow/release.ts`: a resumed patch release must not
     unconditionally apply `nextPatchVersion` — re-derive the target from
     the recorded evidence before bumping; add an orchestration test for the
     resume path.
  2. Version-anchor bump: add a gate that flags current-line prose left
     behind by the mechanical version-string replacement (the alpha.19 copy
     that survived into the `0.41.1` www timeline entry is the incident);
     the gate fails a release when a current-line entry still names the
     superseded theme.
  3. Any P0-watch finding on the `0.41.x` line joins this patch.
- 准出: both defects have failing-then-passing tests; `0.41.2` publishes
  through the full release path with post-publish consumer smoke; CHANGELOG
  and release note record the fixes.

### TP-1 — 0.42 governance landing (this plan)

Goal: land ADR-0120, the research archive, this plan and the pointer
updates as one docs-only PR.

- 准入: the six-framework research reports exist and are archived.
- 执行步骤: archive research under `docs/audit/`; accept ADR-0120; archive
  the 0.41.x plan to `docs/release/`; write this plan; update ROADMAP,
  STATUS, PROJECT_WORKFLOW and the ADR index.
- 准出: `docs:truth` and the full docs gate set green; no product-code
  change in the PR.

### TP-2 — `0.42.0-alpha.1` request-time rendering foundation

Goal: the same `definePage` model gains a request-time execution path.

- 准入: TP-0 shipped; ADR-0120 accepted; this plan active.
- 执行步骤:
  1. `app`: route-level server `loader({ request, params, url })` contract
     on Web-standard objects; types flow into the page element's DSD props.
  2. Route-level prerender option (page-option model) and the build
     manifest's static/request-time route partition; the manifest
     mechanically rejects prerendered pages that declare actions.
  3. `adapter-vite`: Nitro server handler generation through the existing
     `nitro-mount` seam; dev served by the hono dev server with identical
     semantics (contract test between the two).
  4. Per-request DSD rendering reuses the existing SSR renderer; BuildPlan
     evidence records which routes render at request time.
- 准出: three-engine e2e proves request-time pages hydrate islands
  identically to static pages; a pure-static project's build output is
  byte-identical to the `0.41.x` output (freeze regression proof);
  release-tier gates green; alpha.1 published with two-stage evidence.

### TP-3 — `0.42.0-alpha.2` form/action loop

Goal: progressive form → action → error/redirect, usable without
JavaScript, with the revalidation invariant built in.

- 准入: alpha.1 published; TP-2 exit evidence recorded.
- 执行步骤:
  1. `app`: route-level `action({ request, formData, params })` contract;
     named actions via `?/name` query convention and native `formaction`.
  2. Protocol enforcement: success → 303 with framework-built PRG;
     validation failure → 422 with the form re-rendered, echoing submitted
     values minus sensitive fields (`fail(status, data)` return channel);
     thrown values → nearest error boundary (`RenderError` alignment); a
     successful mutation never answers 200 with a rendered page.
  3. One POST/two responses: the framework request header selects the
     `ActionResult` discriminated union response for the JS path; the
     request body is identical on both paths.
  4. Revalidation invariant: after a successful action the route's loaders
     re-run and the page re-renders; no developer synchronization code.
  5. Client enhancement: a small form-enhancement layer (custom element)
     intercepts submits when JS is present; it must tolerate target islands
     not yet hydrated.
- 准出: Playwright with `javaScriptEnabled: false` completes the full form
  loop in three engines; the three-state status rule and PRG are covered by
  contract tests; JS-path `ActionResult` dispatch covered by e2e; alpha.2
  published.

### TP-4 — `0.42.0-alpha.3` revalidation continuity

Goal: the world after the action — morph-based continuity and mixed-mode
coexistence.

- 准入: alpha.2 published.
- 执行步骤:
  1. Named page-region replacement on action re-render (attribute protocol),
     with idiomorph-style DOM morphing and a preserve-attribute escape
     hatch.
  2. Island survival semantics: hydrated islands outside a replaced region
     keep state untouched; islands inside are matched by identity and
     preserved where possible — the full matrix documented and tested.
  3. Static/request-time mixed sites: navigation and hydration between the
     two route kinds do not interfere; i18n canonical-route gates extended
     to request-time routes.
  4. www dogfood: one real loop scenario (a site form) ships on the
     request-time path.
- 准出: the island-survival matrix passes in three engines; the mixed-mode
  site e2e is green; the www dogfood scenario is live and linked in the
  alpha.3 release note; alpha.3 published.

### TP-5 — `0.42.0-alpha.4` hardening, recipes and starter

Goal: prove someone else can use the loop.

- 准入: alpha.3 published.
- 执行步骤:
  1. Recipe docs: better-auth integration, Drizzle integration, zod/valibot
     validation — each reproducible by following the doc.
  2. `create`: a starter template exercising the loop (or an existing
     template extended).
  3. Truth/anchor/evidence gates extended to the request-time line; the
     `PACKAGE_SURFACE.md` additions marked unfrozen with their target
     versions.
  4. Performance baseline: cold/warm request-time render latency recorded
     as the 0.44 stream/abort/timeout baseline.
- 准出: two external recipes reproduced from scratch in CI or recorded
  evidence; starter consumer smoke passes; release-tier gates green;
  alpha.4 published.

### TP-6 — `0.42.0` stable decision

Goal: decide and ship the request-time freeze scope.

- 准入: alpha.4 evidence complete; the seven-day P0 watch on the last alpha
  shows no P0.
- 执行步骤:
  1. Stable-scope ADR: which request-time semantics freeze (expected: the
     loop contract and action protocol; expected unfrozen: streaming,
     performance behavior) and which defer to 0.43/0.44.
  2. Migration note: zero-cost upgrade proof for static-only users; prose
     for SPA users.
  3. Release through the full workflow; restart the seven-day P0 watch.
- 准出: npm, dist-tags, tag, GitHub release, docs and evidence agree on
  `0.42.0`; the freeze ADR is accepted; #37-style stable gate for 0.42
  opened fresh (not reused).

## Acceptance

- Every ADR-0120 protocol rule has a mechanical gate or contract test; none
  rests on prose alone.
- A pure-static `0.41.x` project upgrades to `0.42.0` with zero changes and
  byte-identical output.
- The no-JavaScript form loop is proven in three engines, not inferred.
- The WC + DSD + static-first loop is documented as the product
  differentiator in README/www after alpha.4.

## Non-goals

- No session or cache semantics (0.44); request-time routes ship a
  conservative no-cache default only.
- No auth, OAuth, ORM, database or storage features — recipes only.
- No new package; no change to `@openelement/element`; no change to the
  ADR-0119 frozen surface or the SPA client-side chain.
- No `shouldRevalidate`-style route opt-outs until a proven need exists.
- No streaming SSR; per-request render is buffered in 0.42 (streaming is a
  0.43/0.44 candidate).

## Test matrix

- Unit: loader/action contract shapes, result algebra, manifest partition
  and the action-page prerender rejection.
- Contract: dev (hono) vs build (Nitro) semantic parity; three-state status
  rule; PRG; `ActionResult` serialization.
- E2E: no-JS form loop, JS-path enhancement, island-survival matrix and
  mixed-mode navigation — Chromium, Firefox and WebKit.
- Consumers: starter template, packed artifact, Nitro Node and Workers
  proofs, third-party WC smoke.
- Governance: docs truth, version anchors, release evidence consistency.

## Release evidence requirements

- Every alpha ships through the same release-tier gates as the 0.41 line:
  full unit/coverage, three-engine e2e, consumers, third-party WC smoke,
  package artifacts, docs and governance gates, publish dry-run, two-stage
  evidence, post-publish npm consumer smoke.
- The byte-identical static-output regression proof (TP-2) is repeated at
  every subsequent alpha and at `0.42.0`.
- `1.0.0` remains the stable product target; 0.42.0 evidence joins the v1
  readiness record.

## Risks

1. Island state preservation across morph is the least proven piece; TP-4
   carries it deliberately, and a failing matrix holds the alpha.
2. Dev/build parity drift between hono and Nitro is contained by the TP-2
   contract test — the 0.41-era dev/SSR/SSG drift lesson.
3. Scope pull toward sessions/cache is blocked by ADR-0120; any temptation
   is an amendment, not an edit.
