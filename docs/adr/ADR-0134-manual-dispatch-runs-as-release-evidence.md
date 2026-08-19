# ADR-0134: Manual workflow_dispatch Greens Count as Release Evidence — Freshness Gate Evaluation Fix

- Status: Accepted
- Date: 2026-08-20
- Amends: #997 evidence-freshness contract (docs/runbooks/evidence-freshness.md)
- Related: #997, #1002, ADR-0132

## Context

The #997 release-level freshness gate
(`tools/check-evidence-freshness.ts`) originally read only `event=schedule`
run history of the tier-2/tier-3 provider smoke workflows. Ahead of
0.43.0-alpha.2 both workflows showed pre-fix red as their newest scheduled
runs, while maintainer-triggered `workflow_dispatch` runs on the release SHA
were already green (tier 2 run 32285716457; tier 3 dispatched on the same
SHA). Waiting for the next weekly slot would have delayed the release by
days without producing stronger evidence: a manual green executed on the
release SHA is a strictly newer, same-or-deeper probe of the same providers.

The scheduled-only reading also misapplied the gate's own newest-wins
doctrine. The contract exists to stop "old green masks newer red"; a manual
green that is _newer_ than the scheduled reds is not a mask — it is the
newest result, and excluding it made the gate argue from stale evidence.

## Decision

The gate evaluates scheduled and `workflow_dispatch` runs together, with
every rule keyed on the newest completed evidence:

1. **Newest completed run of any trigger failing blocks release.** "A newer
   failure is never masked by older green runs" is unchanged and now applies
   across triggers in both directions: a manual red also blocks a green
   scheduled history, and any scheduled red after an admitted manual green
   blocks release again.
2. **Two consecutive scheduled failures block release unless a newer
   successful run (any trigger) supersedes them.** The consecutive-failure
   signal is still computed on scheduled runs only (manual cadence is
   maintainer-chosen, so consecutive manual reds carry no regression
   signal), but a newer manual green clears it because the newest evidence
   is green.
3. **The newest success of any trigger older than 14 days is stale.** The
   freshness clock keys on the newest success however it was produced.
4. **No completed runs at all fails closed**, as before; missing token and
   unreachable API still fail closed, as before.

`fetchEvidenceRuns` drops the `event=schedule` filter; `EvidenceRunSummary`
carries the trigger `event`; failure messages name the trigger.

## Consequences

- Positive: the gate now argues from the newest real provider evidence.
  0.43.0-alpha.2 can ship on the manual greens executed on the release SHA
  without waiting for the weekly slot, and no rule was relaxed to allow it.
- Positive: the evaluation is strictly more conservative along the failure
  axis — a manual red now blocks release where the old gate never saw it.
- Negative: the run-list API does not expose workflow inputs, so a tier-3
  `base`-mode manual green would count as evidence. Convention (recorded in
  `docs/runbooks/evidence-freshness.md` and `fullstack-deploy-smoke.yml`):
  manual runs intended as release evidence must select `provision` mode.
  This is a maintainer discipline, not a new code path, and the weekly
  scheduled run remains the always-provision baseline.
- Neutral: this is an evaluation-scope correction, not a weakening — every
  #997 rule (newest-wins, two-consecutive, 14-day staleness, fail-closed on
  absence/unverifiability) survives with its intent intact, pinned by the
  updated `tools/check-evidence-freshness.test.ts` cases (scheduled
  double-red + newer manual green passes; scheduled red after a manual
  green blocks).
