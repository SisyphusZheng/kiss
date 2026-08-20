# v0.43.0 — Universal WC SSR release plan

> Current source package line: `v0.43.0`\
> Current npm registry line: `v0.43.0` (published 2026-08-20, dist-tag `latest`)\
> Latest landed train: `v0.43.0` (admission visibility, on main)\
> Active release target: `v0.43.0`\
> Next planned train: `v0.44.0-alpha.1`\
> In-flight work: close the alpha.2 Gate 0 correctness set and release
> evidence while the fullstack production plan proceeds under #1002\
> Planning release target: `v0.43.0` (Universal WC SSR — this plan)\
> Next release line: `v0.44.0` (production runtime)\
> Current maturity stage: stable (the 0.43 line, Universal WC SSR frozen
> under ADR-0135 on top of ADR-0122)

The 0.42.0 plan (WC Application Loop, TP-0…TP-6) shipped complete; its
task-package record lives in git history (03a6611d).

## Objective

`0.43.0` ships **Universal WC SSR**: third-party Web Components
(native/Lit/FAST/Stencil) become first-class in the SSR pipeline —
discovered, classified by machine-readable compatibility evidence, and
admitted to SSR per their proven form — plus the developer diagnostics and
production recipes the 0.42 freeze deferred. It also qualifies the
**OpenElement × Supabase × Cloudflare** fullstack delivery path (epic
#981) as a composition: no provider packages, no framework-owned
auth/database abstractions — recipes, a reference application, and
qualification evidence. The frozen 0.42 contracts
(ADR-0119 static surface; ADR-0122 loop contract, action protocol, CSRF
default, first-mile start) stay untouched: any change to them requires an
amendment ADR.

```text
OpenElement = Web Components-native fullstack application framework
0.43 scope = foreign-tag discovery → CEM/admission classification →
  per-form SSR admission + hydration diagnostics + recipes
  + the OpenElement × Supabase × Cloudflare delivery path (epic #981:
  composition only — no provider packages, no framework-owned
  auth/database abstractions; recipes + reference app + qualification
  evidence)
0.43 does NOT ship = framework session/flash, cache/ISR, performance SLOs,
  production runtime recovery, auth packages (all 0.44)
streaming SSR (#626) = candidate, mid/late line, only with its own design
OTel tracing (#625) = 0.44 (production runtime), not 0.43
```

## Train map

Two interleaved tracks: the Universal WC SSR track (admission) and the
Supabase × Cloudflare fullstack delivery path (epic #981, composition
only). The fullstack spike jumps the queue because it is the epic's only
go/no-go point.

- **alpha.1 (shipped) — foundation + post-freeze health check**:
  hydration-mismatch structured diagnostics (#631); honest cross-runtime
  dist/server floor with CI smoke (#969/#628 first slice); registration
  collision hard failure (#971, landed early from the alpha.2 schedule);
  third-party WC SSR corpus + machine-readable record (#979 groundwork);
  verified recipes (#627/#629/#630); governance debt (#965/#966/#967/#623/
  #968/#970/#964); freeze-guard verification.
- **alpha.2 (on main) — admission visibility (#979 anchor)**: the scan
  discovers JSX-consumed foreign tags, classifies them (CEM machinery
  activated for npm: packages; unknown tags recorded explicitly
  client-only), and the SSR admission plan honestly records every consumed
  tag. Classification and visibility only — no per-tag SSR behavior
  change. Carry-ins landed: #972 (amendment-ADR gate), #975 (depth-limit
  paths), #973/#974 (422-morph note + empty-body guard), #976–#978
  hygiene, #907 first extraction.
- **alpha.3 — fullstack-path risk spike (#981 first slice)**: the one
  go/no-go seam — cookie session write-back (Set-Cookie from an action)
  through the Nitro `cloudflare_module` bridge plus the CSRF floor's
  `c.env` read on the Workers runtime, proven on a real worker runtime;
  the Supabase local emulator joins CI (supabase CLI + Docker on ubuntu
  runners). If the seam fails, the epic re-scopes before any recipe work.
- **alpha.4 — reference-app skeleton (#983 first)**: sign-in/sign-out/
  callback, one RLS-protected resource, a no-JS + enhanced form — green
  against the local emulator. The recipe is extracted from the working
  app, not written in the abstract.
- **alpha.5 — recipe + PR-safe qualification gates (#982, #984 tier 1)**:
  the Supabase recipe under docs/integrations/; fixture-level gates for
  the secret boundary (no service-role material in browser bundles),
  protected-route SSR + progressive action behavior, and generated-Worker
  cache-policy assertions; Realtime island + Storage authorization join
  the skeleton. Admission track resumes here: per-form SSR admission
  design on top of alpha.2's visibility.
- **alpha.6 — emulator matrix + positioning (#984 tier 2, #985)**: the
  full emulator evidence matrix; only then the positioning copy, which
  must cite the evidence that exists. #985 stays honest about what tier-3
  (real deployment smoke) did or did not run.
- **Consolidation note (2026-08-20)**: the alpha.2–alpha.6 train contents
  interleaved on main during the #1002 production-closure push and ship
  as the single `0.43.0-alpha.2` cut (release plan
  `docs/release/v0.43.0-alpha.2-plan.md`); the per-train labels above stay
  as the scope map, not as separately published versions.
- **#984 tier 3 (real Cloudflare deploy smoke)** requires maintainer-
  provided credentials/accounts; without them it ships as a documented
  runbook, honestly labeled, and does not block the line.
- **Later in the line**: #613/#614/#615 mid-line; streaming SSR candidate
  review (#626) only with its own design; #620 MemoryDataAdapter paired
  with the #629 recipe; #907 remaining extraction axes. (#980 examples
  polish landed ahead of the stable cut, #1084.)

## References and gates

- Current package surface: [`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md) —
  the five-package graph (element, app, adapter-vite, ui, create).
- The line continues the five-package convergence per
  [ADR-0114](../adr/ADR-0114-continue-alpha-after-five-package-convergence.md);
  the Nitro mount path stays `@openelement/adapter-vite/nitro-mount`.
- Release evidence requires the three-browser fixture gates (Chromium, Firefox and WebKit) per train.

## Entry / exit

Entry (met at alpha.1): 0.42.0 published and green; freeze statement (no
ADR-0119/0122 semantics touched) verified per train.

Per-train exit: full release gate tier green; the corpus record current;
upgrade notes for any markup/behavior delta; docs truth green.

Line exit (0.43.0 stable): admission policy proven against the corpus;
diagnostics cover render + hydration + action error paths; recipes are
doc-verified; the decision ADR for the 0.43 freeze scope is written before
the stable cut (mirroring ADR-0122 for 0.42).
