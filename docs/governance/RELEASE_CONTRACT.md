# Release contract: exact-SHA binding and immutable evidence

> Status: Mandatory POLICY for the v0.44 train, binding from Beta.1 (Framework
> Qualification + Governance Freeze) onward. Adopted under ADR-0151 as the
> Beta.1 release-contract instrument. Part of #1187 (Beta.1 slice per the
> thinker's 2026-09-03 scope rulings; the 1.0 Alpha hardening remainder stays
> open). Refs stage #1150, umbrella #1155.

This contract specifies the release-binding rules that
`docs/governance/RELEASE_POLICY.md` requires: one exact candidate SHA for
qualification, closure and publication; immutable release evidence; a
unanimous three-role GO; prerelease dist-tag discipline; and fail-closed
NO-GO semantics. It extends `RELEASE_POLICY.md` and the governance
constitution (`GOVERNANCE_CONSTITUTION.md` §5); where this document and a
lower-layer document disagree, the repair happens in documentation first
(constitution preamble). It is policy only: it adds no feature, changes no
product code and migrates no tooling.

This contract authorizes nothing by itself. No tag, GitHub Release, npm
publication, dist-tag change or `main` promotion is authorized by this
document; release authority stays with `RELEASE_POLICY.md`, ADR-0151 and the
explicit human GO recorded per release.

## §1 Definitions

- **Candidate SHA**: the exact, full-length commit SHA of the release
  candidate under qualification.
- **Qualified artifact**: the packed per-package tarballs built from the
  candidate SHA and verified by release verification.
- **Release evidence**: the durable, append-only record of a release
  decision, kept in the repository evidence directory and in the stage-issue
  closure report (§3).
- **Closure report**: the stage-issue report that closes a release phase for
  one exact candidate SHA (§3.2).

## §2 Exact-SHA binding

§2.1. **One SHA binds the whole release.** Qualification, closure and
publication of a release all bind to one exact candidate SHA. Pull-request CI
on that SHA is the sole authoritative complete matrix
(`RELEASE_POLICY.md`); release verification consumes matching CI evidence for
that same SHA.

§2.2. **The published artifact is the qualified artifact.** The artifact
published to npm is byte-identical to the qualified artifact. A release is
never rebuilt, repacked or re-versioned after qualification; any code,
dependency, lockfile or artifact change creates a new candidate SHA and a new
qualification, invalidating the previous one (ADR-0149's
immutable-candidate mechanics, preserved by ADR-0151).

§2.3. **Identity is recorded durably.** The release evidence records the
exact candidate SHA and the per-package tarball integrity hashes (the
`integrity` / `shasum` of every packed tarball) so the published bytes can
later be proven identical to the qualified bytes. Temporary Actions artifacts
are not the sole future proof (`RELEASE_POLICY.md`).

## §3 Immutable evidence

§3.1. **Append-only and durable.** Release evidence is append-only: once
recorded, an entry is never edited, deleted or replaced. Corrections are new
entries that cite the entry they correct. Evidence lives durably in the
repository evidence directory and in the stage-issue report — never in chat
history, copied transcripts or ephemeral CI artifacts alone (constitution
§2).

§3.2. **Closure-report fields.** The closure report for a release phase must
carry, at minimum:

- the exact candidate SHA (full length);
- the authoritative CI workflow and run IDs for that SHA;
- the per-package tarball integrity hashes of the qualified artifacts;
- the fresh release-verifier verdict (PASS, FAIL or BLOCKED) with its own
  exact evidence;
- known exceptions, each with its accepted-ADR or issue reference (a gate
  waived without one is invalid, constitution §5.2);
- the explicit GO or NO-GO decision (§4, §6).

A closure report missing any field is malformed and fails closed (§4.2).

## §4 Unanimous three-role GO

§4.1. **Three explicit GOs, one SHA.** A release closes only on the explicit,
unanimous GO of all three roles (constitution §5.1), each bound to the same
exact candidate SHA:

- **Implementer** — GO that the packet scope is complete with its recorded
  evidence at the candidate SHA;
- **Fresh release verifier** — an independent GO from a session with no
  implementer conversation history, backed by its own derived closure test
  plan and rerun evidence at the candidate SHA;
- **Thinker** — GO that scope, diff and evidence verify, prepared from the
  durable records, at the candidate SHA.

§4.2. **Fail closed.** Absent, malformed, stale, mismatched, weakened or
non-unanimous evidence is rejected and the release does not close
(`RELEASE_POLICY.md`, constitution §5.2). Evidence is stale when it was
recorded against any SHA other than the candidate SHA; mismatched when its
recorded version, repository, workflow or run does not agree; weakened when a
gate, test or check was removed, skipped or relaxed relative to the policy
floor. Flaky or unavailable infrastructure is BLOCKED, never PASS.

§4.3. **Beta.1 enforcement is procedural.** At Beta.1 this contract is
enforced procedurally through the closure report on the stage issue: the
thinker verifies the three GOs and the §3.2 fields against durable records
before preparing closure. The machine-readable closure-evidence gate (the
PR #1191 lineage) is explicitly 1.0 Alpha scope: PR #1191 stays unmerged and is
carried to 1.0 Alpha unchanged per its own deferral condition and the thinker's
2026-09-03 amendment ruling on #1187. Nothing in this contract merges,
rebases or modifies that tooling.

## §5 Prerelease discipline

§5.1. `v0.44.0-beta.1` publishes under a prerelease dist-tag (for example
`beta`), never under `latest`. The `latest` dist-tag stays on the stable
0.43.x line until a Stable/1.0 decision is earned on 1.0 Alpha evidence
(ADR-0152).

§5.2. The git tag and the GitHub Release notes for every v0.44 prerelease
must state that the release is a prerelease published under a prerelease
dist-tag and that `latest` continues to point at stable 0.43.x.

§5.3. This contract authorizes no tag, release or publication. Each
publication requires the §4 unanimous GO recorded in the §3.2 closure report.

## §6 NO-GO semantics

§6.1. On NO-GO, nothing merges to `main` and nothing publishes — no tag, no
GitHub Release, no npm publication, no dist-tag change.

§6.2. The closure report records the NO-GO and why: which §3.2 field or §4.1
GO failed, with the exact evidence of the failure. A NO-GO report is itself
immutable evidence under §3.1 and is the input to the repair cycle; a later
GO is a new report bound to the (possibly new) candidate SHA, never an edit
of the NO-GO record.
