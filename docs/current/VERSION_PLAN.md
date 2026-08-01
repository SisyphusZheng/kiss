# v0.42.0 — WC Application Loop (light fullstack) release plan

> Current source package line: `v0.42.0-alpha.10`\
> Current npm registry line: `v0.42.0-alpha.9` (alpha.10 is the in-flight source line, unpublished)\
> Next alpha train: `v0.42.0-alpha.10` (post-TP-5.7 remediation)\
> Active release target: `v0.42.0-alpha.10`\
> Planning release target: `v0.42.0` (WC light fullstack / Application Loop)\
> Next release line: `v0.43.0` (Universal WC SSR)\
> Current maturity stage: stable (0.41.x line); 0.42.0 planned under ADR-0120
> Plan amendment: 2026-07-28 — light-fullstack product promise, CSRF floor
> in alpha.7 ship gate, login-via-recipe clarified (no 0.44 wait)

## Objective

`0.42.0` ships **WC light fullstack**: the Application Loop governed by
[`ADR-0120`](../adr/ADR-0120-0-42-0-wc-application-loop-scope.md) — one
route-to-interaction loop (load, DSD render, progressive form, action,
error/redirect, revalidation) that works without JavaScript — plus the
minimum operational floor so a stranger can `build → start` a dynamic
route, trust static prerender failures, and post forms under a default
same-origin CSRF check. It extends the frozen static-first model to
request time without touching the ADR-0119 freeze surface.

```text
OpenElement = Web Components-native fullstack application framework
0.42 product promise = WC light fullstack
0.42 scope = request-time application loop + first-mile + CSRF floor
0.42 does NOT ship = framework session/flash, cache/ISR, auth packages
login apps = supported via recipes (better-auth) on Web-standard Request
component contract = standard Custom Elements (unchanged)
official build path = Vite + Nitro (unchanged)
```

**Light fullstack means (0.42 exit):** dynamic `loader`/`action` routes;
no-JS and enhanced form loops; honest npm tags; runnable server artifact;
fail-closed static prerender; default CSRF same-origin on generated POST;
documented login via third-party session on `Request` headers.

**Light fullstack does not mean:** framework-owned session store, flash
across redirects, OAuth package, or production cache/ISR — those remain
`0.44.0` (or stay recipes forever if a library already owns them).

> **ISR status (0.42):** `cache/ISR` is explicitly out of scope for the 0.42 line
> (it is a 0.44 topic). The `revalidate` page option and the build-time
> `isr-manifest.json` are emitted for forward-compatibility only; **no ISR
> caching is wired into the 0.42 request-time server entry**, so `revalidate: N`
> currently behaves like a plain dynamic route. The ISR runtime
> (`renderIsrResponse` / `MemoryIsrCache`) is marked `@experimental` and targets
> 0.44 with a KV-backed cache adapter. Do not rely on ISR in production on 0.42.
> Multi-instance/edge ISR requires a self-built KV adapter (contract + Deno KV
> reference): `docs/current/ISR_KV_ADAPTER.md`.

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
- Request-time **data and forms** are the 0.42 unfrozen surface this plan
  freezes at TP-6. **Framework session and cache semantics** stay with
  `0.44.0`. **Login is not blocked on 0.44**: apps attach better-auth (or
  any cookie session library) via `loader`/`action` + `Request` headers per
  `docs/integrations/better-auth.md`; the framework does not own the
  session blob.
- ADR-0120 records the scope boundary (self-built loop semantics and
  continuity mechanism; third-party server layer and Web-standard context)
  and the action protocol. Changes to either require an ADR-0120 amendment.
- CSRF: ADR-0121 accepted a documentation recipe. This plan **promotes a
  default same-origin check on generated action POST** into the 0.42 light
  fullstack floor (#611); the #611 PR lands the ADR-0121 amendment text
  with the code (fail-closed default, documented opt-out for non-browser
  clients). Full session-aware CSRF tokens remain 0.44-optional.
- Surgical `@openelement/element` security fixes that do not change the
  ADR-0119 authoring surface are allowed in remediation alphas (e.g. #602
  attr-name allowlist). Broader element API work is still a stop-and-recheck
  signal.
- The line shipped themed alphas plus remediation alphas (TP-5.5–TP-5.7);
  the stable freeze scope for request-time semantics is decided by a
  separate ADR at TP-6.

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
  4. Mixed-mode dogfood: the request-time fixture ships a page combining a
     dynamic form route, a static route and a hydrated island. (Amended
     2026-07-27 from "www dogfood": www deploys to Cloudflare Pages as a
     pure-static site and doubles as the byte-identical regression vehicle;
     adding a dynamic route there would destroy both. The i18n gate
     extension of step 3 defers to the first site that combines i18n with
     request-time routes — none exists yet.)
- 准出: the island-survival matrix passes in three engines; the mixed-mode
  site e2e is green; the dogfood fixture is green in CI and linked in the
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

### TP-5.5 — `0.42.0-alpha.5` audit round 1 remediation (protocol hardening + evidence sweep)

Goal: close the 35 issues filed from the first implementation audit round
(issues #539–#573, label `0.42.0-alpha.5`, milestone `v0.42.0-alpha.5`) —
the protocol holes, morph-continuity gaps, security hygiene defects and
evidence-honesty failures — without expanding the 0.42 scope. No new
semantics beyond what the ADR-0120 amendment in step 1 records.

- 准入: the audit round 1 report is filed as issues #539–#573 (done
  2026-07-27); alpha.4 published (done).
- 执行步骤:
  1. **ADR-0120 amendment (one batch, before code moves).** Record every
     protocol-visible decision in a single amendment: unified
     request-header negotiation (#540), the Response-return policy for
     actions (#541), redirect coercion for 301/307/308 plus `redirect()`
     status validation (#547), default-PRG query stripping (#548),
     fetch-channel 404/error JSON symmetry (#549), `data-open-region`
     semantics (#553), morph identity semantics (#554), the popstate
     policy (#545), and the CSRF threat-model decision (#559). ADR-0120
     requires an amendment for protocol changes; batching keeps the
     protocol document coherent.
  2. **Protocol correctness fixes** (highest ROI first): #539 `hasAction`
     covers named `actions` + a rejection test through real routeInfo
     generation; #542 own-key check on named-action dispatch +
     prototype-key e2e; #549 restructure the 404 block (fetch callers get
     ActionResult JSON, HTML second, dead branch deleted); #544
     `new FormData(form, submitter)` + a named-button fixture form +
     two-path body-identity e2e; #548 strip `/`-prefixed query keys from
     the default PRG target; #547 `redirect()` 3xx validation + POST
     coercion of all 3xx to 303; #541 route user-returned Responses
     through the same status algebra (or forbid them); #540 implement the
     unified header + `Vary`, update the codegen string test and the
     mislabeled e2e; #551 POST error-boundary parity with GET + guide
     prose for the committed-mutation/loader-failure 500 window.
  3. **Morph continuity fixes**: #552 status/content-type gate before
     morphing (non-OK or non-HTML falls back to navigation); #545 popstate
     handling per the amendment; #553 region semantics per the amendment
     (form→region association, missing-region fallback); #554 identity
     matching per the amendment (id-keyed, or honest ADR text); #555
     cross-origin redirect detection → `location.assign`; #561 three-engine
     DOMParser DSD verification + old-side template filter; #562
     re-observe `client:visible` islands after morph; #563 script
     src/content comparison, no executable insertion of parsed scripts;
     #564 double-submit guard; #565 preserve the URL fragment on same-URL
     morphs; #566 `CSS.escape` the region name; #567 state-mirroring
     attribute policy (skip list or honest docs).
  4. **Security hygiene**: #550 `no-store` on every request-time response
     kind + `Vary` on the POST endpoint; #558 PROD guard on both JSON
     error channels; #568 default body limit on action routes; #559 CSRF
     threat-model doc + Fetch-Metadata/Origin recipe; #573 XSS payload
     e2e for the 422 echo.
  5. **Evidence and gates**: #543 wire `fixture:request-time:build` +
     `fixture:request-time:e2e:browsers` into the AutoFlow3 gate tiers and
     CI (three-engine browser installs), correct the alpha.3/alpha.4
     counts as errata, reword `validation.md` to name the gate; #560
     byte-identical static-output proof tool + release-tier gate; #557
     survival-matrix cells + the hono-dev vs Nitro-build parity contract
     test; #571 PACKAGE_SURFACE completion + section nesting + starter
     `contact.tsx` in the check task and a serve-and-POST smoke + the
     alpha.4 API-name erratum; #546 `open:action-failure` restored or
     removed per the amendment; perf baseline gains machine/runtime
     environment fields and is re-recorded after the no-cache change.
  6. **Manifest consumer contract** (#556): ship a path-pattern matcher
     for hosts (fixture server + documented Nitro recipe) or reject
     `mode: 'dynamic'` on parameterized routes at build time; fix
     `[...path]` handling.
  7. **Surface polish**: #569 client entry emitted when enhanced forms
     exist (or a build-time warning); #570 SPA vs server loader/action
     type split + guide section; #572 405 + `Allow` for non-GET/POST and
     runtime validation of `renderIntent.mode`.
- 准出: every issue #539–#573 is closed with a code + test/gate proof
  linked in the issue; the ADR-0120 amendment is accepted and every
  protocol-visible change cites it; the request-time fixture suite runs in
  CI on three engines and the release note's count is mechanically
  reproducible from the tag; the byte-identical static-output gate is
  green; release-tier gates green; alpha.5 published with two-stage
  evidence.

### TP-5.6 — `0.42.0-alpha.6` audit round 2 remediation (morph client correctness)

Goal: close the second, independent review round (issues #576–#593,
`docs/audit/2026-07-28-alpha5-round2-review.md`) — five high-severity
morph/enhancement defects and the protocol/test/evidence tail — without
expanding the 0.42 scope.

- 准入: TP-5.5 closed (alpha.5 published); the round-2 review report is
  archived and its claims verified (done 2026-07-28).
- 执行步骤:
  1. Morph client correctness: form-action URL resolution (#576),
     sessionStorage popstate guard + bfcache pageshow (#578), manual DSD
     instantiation before morph insertions (#579), ordered-walk
     `__morphChildren` with exact deletion and relocation (#580),
     recursive normalized island comparison (#582), late-hydration submit
     rescan (#584), `open:action-error` hook (#585), diagnostics (#589),
     submit-root pruning (#588).
  2. Detection: import-following `hasEnhancedForms` scan (#577).
  3. Protocol tail: 400 for malformed bodies (#581), redirect duck-type
     whitelist + constructor tests (#583, #586), 405 no-store/Vary (#586).
  4. Evidence: parity matrix extension (#587), local retries zeroed
     (#590), alpha.2 enhancement-inert erratum (#591).
- 准出: every issue #576–#593 is closed with a code + test/gate proof;
  the fixture suite passes on three engines with the new round-2 specs
  included; release-tier gates green; alpha.6 published with two-stage
  evidence; #592/#593 stay open as the TP-6 agenda they record.

### TP-5.7 — `0.42.0-alpha.8` light-fullstack floor + audit round 3

> **Version hole — `0.42.0-alpha.8` is skipped / npm-unpublished.** The alpha.8
> cut failed at the npm publish step (git tag + GitHub release were created, but
> the packages were never published to the registry). The TP-5.7 work actually
> shipped as **`0.42.0-alpha.9`** (milestone #16, issues #632–#644). Treat
> alpha.8 as a skipped prerelease — it is not a usable release. See
> `docs/release/v0.42.0-alpha.8.md`.

Goal: close the third review round (issues #597–#616, milestone
`v0.42.0-alpha.8`, source `docs/audit/2026-07-28-alpha6-production-review.md`
plus the 2026-07-28 orchestrator review) **and** land the light-fullstack
operational floor (runnable server, fail-closed SSG, CSRF default, honest
tags/claims) without expanding into framework session/cache (0.44).

- 准入: TP-5.6 closed (alpha.6 published); round-3 findings filed as
  #597–#616 (done 2026-07-28); this plan amendment (light fullstack + CSRF
  ship-gate promotion) accepted in-repo (2026-07-28).
- 执行步骤:
  1. **Ship gate (must)** — Meta checklist #616:
     - Morph residual: #597 H1 `__scanSubmitRoots`, #598 H2 `form.action`
       IDL / `name=action`, #599 H3 multi-form last-wins
     - Build/ops floor: #600 H4 SSG non-200 fail-closed + freeze hard-fail;
       #601 H5 request-time `start`/import-map/preview first mile
     - Security floor: #602 M1 `serializeAttrs` attr-name allowlist;
       **#611 CSRF same-origin default on generated action POST** (promoted
       from capacity → must; lands ADR-0121 amendment with the PR)
     - Honesty floor: #607 M6 npm `latest`→stable; #608 M7 zero-JS /
       client.js / STATUS claim precision
  2. **In-train if capacity** (not required to publish alpha.7): #603 M2
     morph focus/scroll/controls, #604 M3 nested DSD, #605 M4 `open:ready`,
     #606 M5 single island scheduler, #609 L1 PageRenderingMode collapse,
     #610 L2 extract morph module.
  3. **Login path (docs, not framework session):** keep better-auth recipe
     accurate against the alpha.7 loop; README/STATUS one-liner: “login via
     recipe on 0.42; framework session is 0.44”. Optional: one CI or
     recorded dogfood that boots the recipe shape (not a new package).
  4. **Explicit non-blockers:** framework session/auth primitives #612 →
     0.44; loader head/SEO #613; sourcemaps #614; SPA/server loader typing
     #615; freeze-gate shape #592 and freeze baseline policy #593 → TP-6.
- 准出: every ship-gate issue closed with code + test/gate proof; fixture
  suite three engines green including multi-form / island-only paths
  touched by H1–H3; CSRF default covered by unit or e2e deny/allow;
  `deno task start` (or documented equivalent) hits a dynamic route in CI
  or release smoke; release-tier gates green; alpha.7 published with
  two-stage evidence; `npm view` dist-tags honest (`latest` stable, `alpha`
  current); deferred issues stay open with `deferred` label.

### TP-5.8 — `0.42.0-alpha.8` code hygiene train (#619–#623)

Goal: land the code-hygiene remediation filed alongside the alpha.8 cut —
route-scanner correctness, ADR-0095 DataAdapter drift, `collectPublicProps`
dedup, the `start` CLI runtime and logger tags — without expanding the 0.42
scope. Landed 2026-07-30 as commit `1041431f`
(`fix(0.42): alpha.8 code hygiene (TP-5.8)`), which closes #619–#623.

- 准入: TP-5.7 in flight; hygiene issues #619–#623 filed from the alpha.8
  audit trail (done).
- 执行步骤:
  1. `route-scanner-fs` distinguishes ENOENT from I/O errors (#619).
  2. `MemoryDataAdapter` implemented per ADR-0095 (#620).
  3. `collectPublicProps` unified to a single `Reflect.get` implementation
     (#621).
  4. `start` CLI serves via `node:http` for cross-runtime Node 18+/Deno/Bun
     (#622).
  5. Logger tags differentiated across eight modules (#623).
- 准出: every issue #619–#623 closed with code + test proof in `1041431f`
  (done 2026-07-30); no frozen-surface change. Note the numbering split:
  #619–#623 is this TP-5.8 train; #632–#644 is the separate alpha.9 cleanup
  train shipped under TP-5.7's version-hole replacement release.

### TP-6 — `0.42.0` stable decision (freeze light fullstack)

Goal: freeze and ship the **WC light fullstack** request-time surface.

- 准入: TP-5.7 closed (alpha.7 published); the seven-day P0 watch on the
  last alpha shows no P0.
- 执行步骤:
  1. Stable-scope ADR: freeze the loop contract, action protocol, CSRF
     default, and first-mile start semantics. Explicitly **unfrozen /
     out of 0.42 claim**: framework session/flash, cache/ISR, streaming,
     performance SLOs, third-party WC SSR corpus (0.43), production
     runtime recovery (0.44). Record that login apps use recipes.
  2. Product wording: README/www/STATUS say `0.42 = WC light fullstack`
     with the non-goals above; no “full production runtime” claim.
  3. Migration note: zero-cost upgrade proof for static-only `0.41.x`
     users; prose for SPA users; note for apps adding better-auth.
  4. Release through the full workflow; restart the seven-day P0 watch.
- 准出: npm, dist-tags, tag, GitHub release, docs and evidence agree on
  `0.42.0`; the freeze ADR is accepted; #37-style stable gate for 0.42
  opened fresh (not reused); light-fullstack acceptance bullets below
  are all green.

## Acceptance

- Every ADR-0120 protocol rule has a mechanical gate or contract test; none
  rests on prose alone.
- A pure-static `0.41.x` project upgrades to `0.42.0` with zero changes and
  byte-identical output.
- The no-JavaScript form loop is proven in three engines, not inferred.
- Enhanced multi-form and island-only client paths do not throw or silently
  drop successful actions (TP-5.7 ship gate).
- A project with request-time routes can `build` then `start` (documented
  one-command path) and complete a GET loader + POST action without tribal
  knowledge.
- Unexpected static non-200 prerenders fail the build; freeze/missing-page
  assertion is a CI hard fail.
- Generated action POST rejects cross-site browser requests by default;
  opt-out is documented.
- npm `latest` points at the last stable line; `alpha` at the active alpha.
- Login-via-recipe is documented as supported on 0.42; framework session is
  explicitly a 0.44 topic — not a prerequisite for signed-in apps.
- The WC + DSD + static-first loop is documented as the product
  differentiator in README/www.

## Non-goals

- **No framework session or cache semantics** (0.44). Request-time routes
  keep a conservative no-cache default only. Cookie sessions owned by
  better-auth (or equivalent) are in-bounds via recipes.
- **No auth, OAuth, ORM, database or storage packages** — recipes only.
  Signing users in on 0.42 is a recipe problem, not a “wait for 0.44” gate.
- No new package; no change to the ADR-0119 frozen authoring surface or the
  SPA client-side chain. Surgical element security fixes only (see Entry
  truth).
- No `shouldRevalidate`-style route opt-outs until a proven need exists.
- No streaming SSR; per-request render is buffered in 0.42 (streaming is a
  0.43/0.44 candidate).
- No pulling 0.43 third-party WC SSR corpus or 0.44 production-runtime
  platform into this line.

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
   carried it, TP-5.6–5.7 harden residuals; a failing matrix still holds
   the alpha.
2. Dev/build parity drift between hono and Nitro is contained by the TP-2
   contract test — the 0.41-era dev/SSR/SSG drift lesson.
3. Scope pull toward **framework** sessions/cache is blocked by ADR-0120;
   any temptation is an amendment, not an edit. Recipe-based login is
   encouraged and must not be misread as “framework session shipped.”
4. Over-claiming “fullstack” without first-mile/CSRF/honest tags burns
   trust faster than missing features — TP-5.7 ship gate exists to prevent
   that.
