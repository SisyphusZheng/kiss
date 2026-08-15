# v0.43.0 — Universal WC SSR release plan

> Current source package line: `v0.43.0-alpha.1`\
> Current npm registry line: `v0.43.0-alpha.1` (published 2026-08-15, dist-tag `alpha`)\
> In-flight work: the 0.43.0-alpha.1 foundation train on the `v0.43.0`
> line; TP-6 closed 2026-08-14 with ADR-0122 accepted (#962) and the WC
> light-fullstack stable cut shipped\
> Active release target: `v0.43.0-alpha.1`\
> Planning release target: `v0.43.0` (Universal WC SSR — this plan)\
> Next release line: `v0.44.0` (production runtime)\
> Current maturity stage: stable (the 0.42 line, WC light fullstack frozen
> under ADR-0122)

The 0.42.0 plan (WC Application Loop, TP-0…TP-6) shipped complete; its
task-package record lives in git history (03a6611d).

## Objective

`0.43.0` ships **Universal WC SSR**: third-party Web Components
(native/Lit/FAST/Stencil) become first-class in the SSR pipeline —
discovered, classified by machine-readable compatibility evidence, and
admitted to SSR per their proven form — plus the developer diagnostics and
production recipes the 0.42 freeze deferred. The frozen 0.42 contracts
(ADR-0119 static surface; ADR-0122 loop contract, action protocol, CSRF
default, first-mile start) stay untouched: any change to them requires an
amendment ADR.

```text
OpenElement = Web Components-native fullstack application framework
0.43 scope = foreign-tag discovery → CEM/admission classification →
  per-form SSR admission + hydration diagnostics + recipes
0.43 does NOT ship = framework session/flash, cache/ISR, performance SLOs,
  production runtime recovery, auth packages (all 0.44)
streaming SSR (#626) = candidate, mid/late line, only with its own design
OTel tracing (#625) = 0.44 (production runtime), not 0.43
```

## Train map

- **alpha.1 (this release) — foundation + post-freeze health check**:
  hydration-mismatch structured diagnostics (#631); honest cross-runtime
  dist/server floor with CI smoke (#969/#628 first slice); registration
  collision hard failure (#971, landed early from the alpha.2 schedule);
  third-party WC SSR corpus + machine-readable record (#979 groundwork);
  verified recipes (#627/#629/#630); governance debt (#965/#966/#967/#623/
  #968/#970/#964); freeze-guard verification.
- **alpha.2 — admission visibility (#979 anchor)**: the scan discovers
  JSX-consumed foreign tags, classifies them (CEM machinery activated for
  npm: packages; unknown tags recorded explicitly client-only), and the
  SSR admission plan honestly records every consumed tag. Classification
  and visibility only — no per-tag SSR behavior change yet. Carry-in
  candidates: #972 (amendment-ADR gate), #973/#974/#975, #976–#978
  hygiene, #907 remainder.
- **alpha.3+ — per-form SSR admission**: SSR strategies per compatibility
  tier on top of alpha.2's visibility; #613/#614/#615 mid-line; streaming
  SSR candidate review (#626); #620 MemoryDataAdapter paired with the #629
  recipe.

## Entry / exit

Entry (met at alpha.1): 0.42.0 published and green; freeze statement (no
ADR-0119/0122 semantics touched) verified per train.

Per-train exit: full release gate tier green; the corpus record current;
upgrade notes for any markup/behavior delta; docs truth green.

Line exit (0.43.0 stable): admission policy proven against the corpus;
diagnostics cover render + hydration + action error paths; recipes are
doc-verified; the decision ADR for the 0.43 freeze scope is written before
the stable cut (mirroring ADR-0122 for 0.42).
