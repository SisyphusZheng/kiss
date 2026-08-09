# v0.42.0 — WC Application Loop (light fullstack) release plan

> Current source package line: `v0.42.0-alpha.15`\
> Current npm registry line: `v0.42.0-alpha.15` (published 2026-08-02, dist-tag `alpha`)\
> In-flight work: TP-5.9 (TP-6 stable freeze preparation + ADR-0123
> standards-as-seams train) on the `v0.42.0-alpha.13` line\
> Active release target: `v0.42.0-alpha.15`\
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
0.42 does NOT ship = framework session/flash, cache/ISR, streaming SSR,
  performance SLOs, third-party WC SSR corpus (0.43), production runtime
  recovery (0.44), auth packages (ADR-0122 §5)
login apps = supported via recipes (better-auth) on Web-standard Request
component contract = standard Custom Elements (unchanged)
official build path = Vite + Nitro (unchanged)
```

**Light fullstack means (0.42 exit):** dynamic `loader`/`action` routes;
no-JS and enhanced form loops; honest npm tags; runnable server artifact;
fail-closed static prerender; default CSRF same-origin on generated POST;
documented login via third-party session on `Request` headers.

**Light fullstack does not mean (the ADR-0122 §5 non-goals):** framework-owned
session store, flash across redirects, OAuth/auth packages, production
cache/ISR, streaming SSR, performance SLOs, the third-party WC SSR corpus
(`0.43.0`), or production runtime recovery — those remain `0.44.0` (or stay
recipes forever if a library already owns them).

> **ISR status (0.42):** `cache/ISR` is explicitly out of scope for the 0.42 line
> (it is a 0.44 topic). The `revalidate` page option and the build-time
> `isr-manifest.json` are emitted for forward-compatibility only; **no ISR
> caching is wired into the 0.42 request-time server entry**, so `revalidate: N`
> currently behaves like a plain dynamic route. The ISR runtime
> (`renderIsrResponse` / `MemoryIsrCache`) is marked `@experimental` and targets
> 0.44 with a KV-backed cache adapter. Do not rely on ISR in production on 0.42.
> Multi-instance/edge ISR requires a self-built KV adapter (contract + Deno KV
> reference): `docs/current/ISR_KV_ADAPTER.md`.

## Entry truth

- The `0.41.x` line is stable and frozen (ADR-0119); its plan is archived at
  [`docs/release/v0.41.0-plan.md`](../release/v0.41.0-plan.md). The
  five-package graph is unchanged by this plan, and alpha naming for the
  0.42 line remains governed by
  [`ADR-0114`](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md).
  The supported package contract (root, `nitro-mount`, `cli/build`,
  `cli/start` and `sitemap` exports) is
  [`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md).
- Request-time **data and forms** are the 0.42 unfrozen surface this plan
  freezes at TP-6. **Framework session and cache semantics** stay with
  `0.44.0`. **Login is not blocked on 0.44**: apps attach better-auth (or
  any cookie session library) via `loader`/`action` + `Request` headers per
  `docs/integrations/better-auth.md`; the framework does not own the
  session blob.
- ADR-0120 records the scope boundary (self-built loop semantics and
  continuity mechanism; third-party server layer and Web-standard context)
  and the action protocol. Changes to either require an ADR-0120 amendment.
- CSRF: ADR-0121 accepted a documentation recipe. This plan promotes a
  default same-origin check on generated action POST into the 0.42 light
  fullstack floor (#611); full session-aware CSRF tokens remain 0.44-optional.
- Surgical `@openelement/element` security fixes that do not change the
  ADR-0119 authoring surface are allowed in remediation alphas (e.g. #602
  attr-name allowlist). Broader element API work is still a stop-and-recheck
  signal.

## Task packages

Each package lists its entry conditions (准入), execution steps, and exit
criteria (准出). A package starts only when every entry condition holds and
closes only when every exit criterion is evidenced in the repository.

Milestones TP-0–TP-5.9 are shipped; their plans are archived in git history.
Only the open milestone TP-6 keeps its full plan below.

### Shipped milestones (archive)

| Milestone                                                   | Release                                             | Status    |
| ----------------------------------------------------------- | --------------------------------------------------- | --------- |
| TP-0 — Release tooling self-repair                          | `0.41.2` patch line                                 | shipped   |
| TP-1 — 0.42 governance landing                              | —                                                   | shipped   |
| TP-2 — request-time rendering foundation                    | `0.42.0-alpha.1`                                    | shipped   |
| TP-3 — form/action loop                                     | `0.42.0-alpha.2`                                    | shipped   |
| TP-4 — revalidation continuity                              | `0.42.0-alpha.3`                                    | shipped   |
| TP-5 — hardening, recipes and starter                       | `0.42.0-alpha.4`                                    | shipped   |
| TP-5.5 — audit round 1 remediation                          | `0.42.0-alpha.5`                                    | shipped   |
| TP-5.6 — audit round 2 remediation (morph client)           | `0.42.0-alpha.6`                                    | shipped   |
| TP-5.7 — light-fullstack floor + audit round 3              | `0.42.0-alpha.9` (alpha.8 skipped, never published) | shipped   |
| TP-5.8 — code hygiene train                                 | commit `1041431f` (#619–#623)                       | shipped   |
| TP-5.9 — TP-6 freeze preparation + standards-as-seams train | `0.42.0-alpha.13`                                   | in flight |

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
     with the non-goals above; no "full production runtime" claim.
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
  Signing users in on 0.42 is a recipe problem, not a "wait for 0.44" gate.
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
- Static-output determinism is a continuous gate, not a per-alpha baseline
  ritual: CI runs the `check:static-output-freeze --self-check` determinism
  assertion on every relevant change (missing-page/determinism failures are
  CI hard fails, #600), which keeps the frozen static surface
  behavior-equivalent build over build.
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
   encouraged and must not be misread as "framework session shipped."
4. Over-claiming "fullstack" without first-mile/CSRF/honest tags burns
   trust faster than missing features — TP-5.7 ship gate exists to prevent
   that.
