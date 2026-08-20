# ADR-0135: 0.43.0 Stable Scope Freeze — Universal WC SSR + Supabase × Cloudflare Delivery Path

- Status: ACCEPTED (2026-08-20, #1002 Phase F RC evaluation — maintainer
  directive; acceptance record below)
- Date: 2026-08-20
- Builds on: ADR-0122 (0.42.0 stable scope freeze — the model this ADR
  mirrors), ADR-0129 (response-header channel amendment to ADR-0122 §1),
  ADR-0132 (scan-engine evidence deferral), ADR-0134 (evidence-freshness
  evaluation amendment)

## Acceptance record (#1002 Phase F, 2026-08-20)

#1002's RC / stable claim gate, item by item:

1. **Gate 0, #998, #1000, #1001 and #997 are closed** — Gate 0
   (#999/#990/#987/#988/#994) cleared 2026-08-17; #998/#1000/#1001 closed
   via #1045–#1048; #997 closed via #1049 (Tier 2/Tier 3 evidence
   automation plus the release freshness gate). #996 closed via #1020.
2. **#996 meets the 0.43 Universal WC exit condition** — FAST and Stencil
   joined the corpus; every discovered custom element carries a
   deterministic admission path/reason; the machine-readable matrix
   (`docs/evidence/third-party-wc-ssr-corpus.json`) is deterministic and
   diff-reviewable; browser evidence covers SSR form, upgrade,
   attributes/properties, events, slots and hydration; public claims
   separate proven interoperability from roadmap intent.
3. **No open P0/P1 contradicts the claim** — zero open P0 issues; the only
   open P1 is #1002 itself, which this acceptance closes. Open deferred
   issues keep explicit target lines (#1070 → v0.44 per ADR-0132;
   #612/#613/#614/#615/#620/#624/#625/#626/#628 and the recorded
   tooling/internal items keep their previously accepted dispositions).
4. **The frozen application-loop semantics have an explicit 0.43
   freeze-scope ADR** — this document.
5. **Delayed items have owner, reason, risk and target version** — #1070
   (real scan-engine evidence → v0.44, ADR-0132; the fail-closed default is
   documented and Tier-2-proven). #980 (examples polish) and #1083
   (release-pipeline self-blockers) were registered as deferrals during the
   alpha.2 cut but landed before the stable cut (#1084, #1085) and are
   CLOSED; #1070 is the only deferral carried into v0.44.
6. **Provider/deployment evidence is current and green** — Tier 2
   (supabase-project-smoke) run 32285716457 and Tier 3
   (fullstack-deploy-smoke) run 32286072210 are green on the release line's
   final SHA; the freshness gate
   (`deno task fullstack:evidence-freshness`) passes at acceptance time
   under ADR-0134 evaluation. The 2026-08-17 (Tier 2) and 2026-08-18
   (Tier 3) scheduled reds predate the #1071/#1072 evidence-train fixes and
   are superseded by the newer manual greens per ADR-0134's newest-wins
   rule; main autoflow-ci is green at the decision commit.
7. **Rollback and incident response have been rehearsed** — the runbooks
   (`docs/runbooks/deploy-rollback.md`, `incident-response.md`, among
   others) shipped with #1048, and the line rehearsed both paths for real:
   the 2026-08-19 remote migration-drift incident was resolved per the
   forward-only principle (Management API convergence; migration history
   13/13; freeze-check 2026-08-19 补记 2), and the 0.43.0-alpha.2 publish
   exercised the release-recovery path (failed first attempt recorded as
   immutable evidence, state-machine deadlock fixed in #1082, the
   publish-existing re-run completed in run 32309769215). Worker version
   rollback is state-safe by construction — runtime invariants live in
   Postgres (monotonic order-state ranks, provider-event-id dedup, atomic
   reservations) — and is covered by the runbook; no separate live Worker
   rollback drill is claimed.

## Context

The 0.43 line shipped two things. First, **Universal WC SSR**: the build
discovers every consumed foreign tag, classifies it through the CEM
machinery where metadata exists, and records a deterministic admission
decision — render path plus reason — in the machine-readable SSR admission
plan (#979); the admission evidence corpus covers native, Lit, FAST,
Stencil, Shoelace and Material Web forms (#996/#1020); hydration mismatches
carry structured developer diagnostics (#631). Second, the **OpenElement ×
Supabase × Cloudflare delivery path** (epic #981) as a composition: no
provider packages and no framework-owned auth/database abstractions —
recipes, the `examples/supabase-cloudflare-starter` reference application,
and three-tier qualification evidence (#997) proven against the real
providers.

TP-6 for 0.42 established the rule (VERSION_PLAN line exit): a stable cut
requires an explicit, reviewed statement of what freezes and what is
deliberately left out of the claim. This ADR is that statement for 0.43.0.

## Decision

1. **The 0.41.x/0.42 freezes carry forward untouched.** ADR-0119 (static
   surface), ADR-0120/ADR-0121 (loop scope and protocol hardening) and
   ADR-0122 §1–§7 remain in force exactly as written, including their
   recorded amendments: ADR-0129 (the additive response-header channel
   folds into the frozen loop contract), ADR-0131 and ADR-0133
   (contract-preserving maintenance records). Breaking changes to any of
   these still require an amendment ADR.
2. **Frozen at 0.43.0 — the Universal WC admission contract.** Every
   custom-element tag consumed by a build receives a deterministic
   admission decision (`renderPath` + `reason`) recorded in the
   machine-readable admission plan
   (`packages/adapter-vite/src/internal/protocol/ssg.ts`). Tags without a
   proven SSR form classify as client-only with an explicit reason; no
   foreign tag is silently DSD-rendered. Changing the meaning of an
   admission outcome, or weakening the unknown-means-client-only honesty
   rule, requires an amendment ADR.
3. **Frozen at 0.43.0 — diagnostics and claim honesty.** Hydration-mismatch
   structured diagnostics (#631) keep their shape, and public claims must
   continue to separate evidence-proven interoperability from roadmap
   intent (the #996 honesty rule). The corpus record stays deterministic
   and diff-reviewable; it is pinned mechanically by
   `tools/third-party-wc-corpus.ts` and the three-browser fixture gates.
4. **Composition, not framework abstraction.** The Supabase × Cloudflare
   path is recipes + reference application + evidence, frozen as a
   _process_ contract: the #997 tier rules (run-id-scoped data, always-run
   cleanup, redacted artifacts, provider outage means blocked/unverified,
   newest-wins, two-consecutive-scheduled-failures block, 14-day staleness,
   fail-closed on absence) as amended by ADR-0134 govern every later
   release on this line. No provider packages and no framework-owned
   auth/database/payment abstractions are added by this freeze.
5. **Frozen posture — attachment scanning stays fail-closed.** Per
   ADR-0132: with no scan engine configured, attachments remain
   `pending_scan` and undownloadable by everyone; no code path may
   auto-`clean`. The positive `clean → downloadable` path is #1070 (v0.44)
   and must not be claimed for 0.43.
6. **Explicitly unfrozen / out of the 0.43 claim.** Framework session and
   flash primitives; cache/ISR semantics; streaming SSR (#626); performance
   SLOs; production runtime recovery; auth packages (all 0.44).
   `validateAction` (#624), cross-runtime start breadth (#628),
   MemoryDataAdapter (#620), loader-driven head meta (#613) and the other
   recorded deferrals keep their target lines. Per-form SSR _rendering_ of
   foreign components beyond the admission-classification contract is
   future design work, not a 0.43 capability. None of these may be marketed
   as 0.43 capabilities.

## Consequences

- The ADR-0122 amendment gate (`tools/check-frozen-semantics.ts`) continues
  unchanged for the 0.42 semantics files; the 0.43 admission contract is
  pinned mechanically by the corpus gate, the third-party WC smoke and the
  interface snapshot, and by the prose amendment rule for
  `packages/adapter-vite/src/internal/protocol/ssg.ts`'s decision contract.
- Deferred-scope issues stay open with explicit target lines instead of
  pressuring 0.43 scope; #1070 is the sole 0.43→v0.44 deferral.
- Documentation must keep the honest wording: `0.43 = Universal WC SSR
  admission + the Supabase × Cloudflare delivery path (composition)`, with
  §5's fail-closed scanning posture and §6's non-goals stated wherever the
  line is introduced; no "production runtime" claims (0.44 scope).
- v0.44 opens with #1070 (scan engine), the production-runtime set (#612,
  #625, #626, cache/ISR) and the carried deferrals; framework work pauses
  on this line after the 0.43.0 stable cut per maintainer directive.
