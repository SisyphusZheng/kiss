# v0.43.1 — cumulative maintenance baseline

> Current source package line: `v0.43.0`\
> Current npm registry line: `v0.43.0` (published 2026-08-20, dist-tag `latest`)\
> Latest landed train: `v0.43.0`\
> Active release target: `v0.43.1`\
> Next planned train: `not scheduled (maintenance mode)`\
> Planning release target: `v0.43.1` (audit remediation and maintenance handoff)\
> Current maturity stage: stable (`0.43.x`, frozen by ADR-0119, ADR-0122,
> ADR-0135 and maintained under ADR-0140)

## Objective and scope

`v0.43.1` is a cumulative correctness and release-truth patch. It does not
open a new feature train. It must requalify every issue previously counted as
closed for the patch, remediate every confirmed post-merge finding, and pass an
independent closure audit on the exact release candidate.

- **Wave A — requalification:** all 33 issues originally closed through
  PR #1115, tracked by #1124. Each receives an evidence-backed verdict:
  `verified`, `partial`, `regressed`, `superseded`, or `unverifiable`.
- **Wave B — confirmed remediation:** fresh-project Data API privileges
  (#1125), nested SSR data context (#1126), atomic replay request auditing
  (#1127), recoverable attachment deletion (#1128), bounded Notes data and SSR
  output (#1129), and a truthful authenticated JWT boundary (#1130).
- **Wave C — independent closure:** #1131 repeats architecture, security,
  database, runtime, test and release audits after Waves A and B. It records a
  `GO` or `DO NOT RELEASE` verdict without inheriting earlier assumptions.
  Real-project qualification found Realtime reconnect/delivery gap #1134;
  Wave C includes its application-owned bounded reconciliation and recheck.
- **Governance:** #1132 records the post-release 0.43.x maintenance policy;
  #1133 is the umbrella release gate.

The cumulative audit record is
[`2026-08-23-v0.43.1-post-merge-full-repo-audit.md`](../audit/2026-08-23-v0.43.1-post-merge-full-repo-audit.md).

The patch preserves the existing product contract:

```text
OpenElement = Web Components-native fullstack application framework
product graph = five-package element/app/adapter-vite/create/ui boundary
official build path = Vite + Nitro through @openelement/adapter-vite/nitro-mount
```

Package responsibilities and exports remain governed by
[`PACKAGE_SURFACE.md`](./PACKAGE_SURFACE.md) and the convergence rule in
ADR-0114. This maintenance plan does not reopen either contract.

## Non-goals

- No new public package, provider-owned abstraction, framework auth/ORM, or CRM
  business primitive.
- No speculative framework session/cache/outbox API. A local recovery state
  required to correct the reference application may be implemented without
  claiming a new general-purpose framework capability.
- No `0.44.0` feature train, streaming SSR, OTel product surface, generic ISR
  semantics, or broad production-runtime expansion.
- No package version bump, tag, GitHub Release, npm publication, merge to
  `main`, or milestone closure merely because an issue exists or a unit test
  passes.
- No China-specific product work. The separate CRM product is global-first;
  framework changes are admitted only when the product exposes a reusable
  framework defect or a standards-level missing seam.

## Tasks

### TP-1 — establish auditable scope

- [x] Reopen milestone `v0.43.1`.
- [x] Create Wave A/B/C, governance and umbrella issues (#1124–#1133).
- [x] Preserve the post-merge audit as repository evidence.
- [x] Record ADR-0140 and align all current release anchors.

### TP-2 — Wave A requalification

- [x] Build a 33-row issue matrix for #615, #892, #1087, #1089–#1114 and
      #1116–#1123.
- [x] Link each verdict to implementation, tests and current-HEAD gate output.
- [x] Reopen or create a narrowly scoped follow-up for every non-`verified`
      verdict; do not silently relabel partial work as complete.

### TP-3 — Wave B remediation

- [ ] #1125: explicit least-privilege grants plus fresh-default integration
      evidence.
- [x] #1126: loader/action context survives complete nested SSR evaluation and
      concurrent renders cannot cross-contaminate.
- [ ] #1127: replay state transition and actor audit commit in one Postgres
      transaction.
- [x] #1128: delete converges after Storage failure, database failure, process
      interruption and duplicate requests.
- [ ] #1129: database length constraints, keyset pagination, page cap and SSR
      byte budget cover Notes.
- [x] #1130: the documented JWT boundary matches runtime behavior and the
      authenticated-render test proves the allowed location and cleanup.

### TP-4 — Wave C independent closure

- [x] Re-run the full architecture and package-boundary review.
- [x] Re-run threat modeling across browser, SSR, Postgres, Storage, Stripe,
      Queues and scanner boundaries.
- [ ] Re-run database privilege, RLS, constraint, index, pagination, atomicity
      and reconciliation qualification.
- [ ] Re-run runtime parity and release gates on the exact candidate SHA.
- [x] Record external-provider evidence as `verified`, `blocked`, or
      `not run`; local stubs and dry-runs must not be reported as production proof.
- [x] Publish the Wave C `GO`/`DO NOT RELEASE` report before any release action.
- [ ] #1134: Realtime subscribe/reconnect claims freshness only after bounded
      durable Notes reconciliation, and two real-project repetitions pass.

## Acceptance

The patch is release-ready only when all of the following are true:

1. #1124–#1132 and #1134 are closed with reproducible evidence and #1133
   contains the final candidate SHA.
2. Every Wave A issue has an explicit current-HEAD verdict; no unresolved
   `partial`, `regressed`, or `unverifiable` item is hidden.
3. All six Wave B findings have failure-injection or boundary-level regression
   coverage, not only happy-path unit tests.
4. Database qualification proves both privileges and RLS: `anon`,
   `authenticated` and `service_role` receive only their intended operations.
5. Node 20/24, Deno, workerd and all three supported browsers remain green for
   the surfaces they claim.
6. Wave C returns `GO`; docs, source, registry and release evidence agree.
7. The maintainer explicitly authorizes publication after reviewing the final
   evidence. Readiness never implies authorization.

## Test matrix

| Boundary            | Required evidence                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Framework packages  | fmt, lint, typecheck, unit tests, architecture graph, package surface, interface snapshot, exports                                 |
| SSR data context    | nested child/grandchild loader and action reads; two concurrent renders with distinct values; exception cleanup                    |
| Supabase schema     | immutable migration check; explicit grant inventory; RLS positive/negative matrix; constraints and indexes                         |
| Admin replay        | normal transaction plus injected audit failure proving rollback                                                                    |
| Attachment deletion | Storage failure, finalize failure, mid-flight interruption, retry and reconciler convergence                                       |
| Notes               | 10,001-row keyset fixture, oversized direct insert rejection, stable cursor, response-byte budget on Node and Workers              |
| JWT boundary        | authenticated request-time render, allowlisted token location, `no-store`, post-hydration attribute removal, static-output absence |
| Stripe              | deterministic API/webhook tests and official security posture; real-provider status reported separately                            |
| Consumers           | local, packed, starter, Nitro/Node and element ESM smoke                                                                           |
| Browsers            | Chromium, Firefox and WebKit critical paths; skips listed and justified                                                            |
| Release             | docs truth, workflow, evidence consistency, dry-run packaging, exact-SHA CI, post-publish smoke only after authorization           |

## Release evidence requirements

- Store the Wave A matrix and Wave C report under `docs/audit/`.
- Record exact commit, commands, counts, durations, skips and environment
  versions. Do not reuse PR #1115 counts as candidate evidence.
- Keep local qualification, provider sandbox evidence and production evidence
  distinct.
- Preserve failed release attempts and partial external verification honestly.
- Do not bump versions until implementation and local gates pass. Do not merge,
  tag or publish until the workflow order and explicit maintainer authorization
  are both satisfied.

## Post-v0.43.1 maintenance policy

After release, `0.43.x` remains the active maintenance line. Compatible bug,
security, dependency, runtime-compatibility, documentation and release-tooling
fixes may ship as patches. No next minor is scheduled. A future minor is opened
only by a maintainer-approved ADR and version plan demonstrating a concrete
cross-application requirement; the separate CRM is the primary proving ground,
not a source of framework-specific business abstractions. See ADR-0140.
