# ADR-0140: 0.43.x Maintenance Mode and CRM-Driven Evolution

- Status: SUPERSEDED FOR FORWARD SEQUENCING by ADR-0143 (2026-08-27); its
  0.43.x maintenance and provider-boundary rules remain accepted
- Date: 2026-08-23
- Amends: ADR-0135 forward-train sequencing only
- Preserves: ADR-0119, ADR-0122 and ADR-0135 frozen contracts

## Context

The roadmap previously treated `v0.44.0-alpha.1` as the automatic next train
and grouped a broad “Production Runtime” backlog under it. The maintainer's
actual strategy is different:

1. make `v0.43.1` a cumulative, evidence-backed maintenance baseline;
2. pause minor feature-train development after that release while continuing
   compatible patches;
3. build a separate, global-first, all-edge-runtime serverless CRM SaaS as an
   open-source subscription product, portfolio proof and employment artifact;
4. use real product pressure to discover missing general framework seams;
5. consider China-market requirements only after the global version and the
   reusable framework/product boundaries are proven.

“Freeze” here does not mean abandoning the repository or promising that no
future minor can exist. It means there is no scheduled next minor. In SemVer,
`0.44.0` would be a minor release, although it may contain architecture-scale
work. Such work must earn a new plan instead of existing by roadmap inertia.

## Decision

1. **`0.43.x` is the active maintenance line after `v0.43.1`.** Compatible bug,
   security, dependency, runtime-compatibility, documentation, test and release
   tooling fixes continue as patches.
2. **No next minor is scheduled.** Current release truth records
   `not scheduled (maintenance mode)`, not `v0.44.0-alpha.1`.
3. **The former 0.44 backlog is parked, not silently completed or deleted.**
   Its issues retain history and must be removed from an active execution
   milestone. They become candidates for a later ADR-backed train only when
   product evidence justifies them.
4. **A future minor needs an explicit re-entry decision.** The maintainer must
   approve an ADR and version plan stating the user problem, alternatives,
   public-contract delta, compatibility impact, test matrix, migration path and
   evidence supplied by at least one real application. Architecture-scale or
   breaking changes receive the SemVer version their compatibility impact
   requires; they are not smuggled into a patch.
5. **The CRM is a separate product and proving ground.** Its contacts, accounts,
   leads, pipelines, subscriptions, tenant policy, localization and China-market
   integrations remain outside framework packages. The framework may accept a
   change only when the need is provider-neutral, reusable beyond CRM, belongs
   to an existing package responsibility and has a standards-oriented contract.
6. **Composition remains the default.** Supabase, Stripe, Cloudflare, auth,
   email, storage, queues and scanners remain recipes/reference-application
   integrations unless independent evidence proves a framework-owned seam is
   necessary.
7. **Local reliability mechanisms are allowed in examples.** A transactional
   RPC, tombstone, reconciliation job or bounded query needed to fix a concrete
   starter defect does not create a generic framework outbox, transaction or
   recovery API. Generalization requires the future-minor re-entry gate.

## Change classification

| Class                                                            | 0.43.x disposition                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Correctness/security fix preserving frozen behavior              | Patch candidate                                                |
| Dependency/runtime support update without public semantic change | Patch candidate with compatibility evidence                    |
| Documentation, examples, tests and release tooling truth fix     | Patch candidate                                                |
| Additive public API or new runtime semantic                      | Not a patch; ADR-backed future minor candidate                 |
| Breaking API, default or frozen-contract change                  | Explicit compatibility decision and appropriate SemVer release |
| CRM-specific domain/provider behavior                            | CRM repository, not framework                                  |

## Consequences

- ADR-0135's statement that “v0.44 opens” is superseded only as a sequencing
  claim. Its 0.43 freeze and explicit non-goals remain authoritative.
- Deferring the generic Production Runtime roadmap is an honest scope choice,
  not a claim that recovery, observability or cache concerns are solved.
- Product work can reveal missing capabilities without forcing speculative
  abstraction. The framework evolves from repeated evidence rather than a
  feature checklist.
- Maintenance has no artificial end date. A future roadmap begins only after
  its re-entry ADR is accepted.

## Verification

- `tools/project-constants.ts`, `docs/release/release-state.json`, STATUS,
  ROADMAP and VERSION_PLAN agree that no next minor is scheduled.
- The former v0.44 milestone is not an active execution queue.
- `v0.43.1` remains blocked by #1133 until Waves A, B and C are complete.
