# a0-002 repair 2 thinker review — NO-GO

Candidate base: `0f8d78991ab8d9840f3852fe1b9e7691f470f1ed`

The repair closes R1–R6 locally, but the accepted behavior is not yet usable end to end.
No commit, push, PR, merge, tag, publication, or release action is authorized from this
result.

## Findings

### R7 — authoritative PR CI produces no consumable evidence

The PR workflow runs the full matrix but does not create or upload the record required by
the new `--pr-ci` release argument. The publication workflow neither accepts a run/artifact
identifier nor downloads the record. A real release therefore cannot reach the new entry
point with workflow-owned evidence.

Acceptance: the PR workflow creates one deterministic exact-SHA evidence artifact only
after every required full-matrix job succeeds. The publication workflow requires the
source run identifier, downloads that exact artifact, and passes its explicit path to the
release CLI. Missing artifact, failed dependency, wrong event, or ambiguous artifact
selection fails closed. Pin every new action by immutable commit.

### R8 — the evidence is self-attested

The parser trusts caller-written fields such as `matrixComplete`, workflow name, SHA and
conclusion. Any local JSON file with those values passes. That does not prove a GitHub run,
its pull-request event, repository, run attempt, required jobs, or final conclusions.

Acceptance: the record contains stable run identity and required-job conclusions, and the
release entry point independently resolves the run through the GitHub API (with an
injectable deterministic test seam). It verifies repository, workflow path, pull-request
event, exact head SHA, completed/success state, run attempt, artifact identity, and the
complete required-job set. Unsupported, duplicate, skipped, cancelled, stale or absent
jobs fail. Tests cover every rejection without network access.

### R9 — release preparation validates and tests the wrong SHA

`release-prepare` validates PR evidence against current HEAD and then creates/amends the
version-bump commit. Its output SHA is therefore different from the SHA it accepted.
`createPreparePlan` also still invokes `autoflow:ci` locally, contradicting the sole PR
full-matrix authority.

Acceptance: preparation creates the reviewable version candidate without consuming prior
PR-CI evidence and runs only packet/fast preparation gates. The resulting bump SHA must
then pass the authoritative PR workflow. Publication consumes evidence for the exact
merged bump SHA and runs only complementary release gates. Remove every local
`autoflow:ci` invocation from preparation while preserving its gates in the PR tier.
Tests prove the sequence and refuse publication evidence for the pre-bump SHA.

### R10 — explicit prohibited short form remains in current documentation

The configured set covers one compound form but omits its short standalone form, which is
still present in the current autonomous-goal document. This contradicts the explicit user
example and demonstrates incomplete equivalent-family coverage.

Acceptance: add the short form to executable configuration without spelling it in test or
documentation fixtures, migrate all resulting documentation matches, regenerate the
manifest with before/after blob hashes, and finish at zero violations and zero exemptions.

## Scope and disposition

- Product/package/example/website code remains untouched.
- Workflow changes are now explicitly required to complete this CI slice.
- Existing full-matrix and release gates must remain; this repair changes ownership and
  evidence transport, not coverage.
- Resume the same implementer session. A release verifier is neither needed nor permitted
  for this internal baseline slice.
