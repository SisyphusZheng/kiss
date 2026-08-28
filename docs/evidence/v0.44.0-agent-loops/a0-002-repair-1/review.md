# Thinker review — a0-002 repair 1

## Decision

`NO-GO-REPAIR`

The implementation is in scope and its focused/local gates are green, but it does not
yet satisfy the bootstrap goal or packet. The following findings are deterministic and
must be repaired before PR admission.

## Findings

### R1 — Documentation prevention has an allowlist escape

`tools/config/v044-roles.json` exempts the executing repair dispatch, and the checker
reports one configured exemption. The user and parent packet require repository
documentation to contain no prohibited brand identifiers and forbid an allowlist escape.
The executing packet is documentation and must be migrated like historical evidence;
original bytes remain recoverable through Git history and the migration manifest.

Acceptance: the executable configuration exposes no documentation exemption facility,
the checker has no exemption branch/API/test, and the real corpus passes with zero
violations and zero exemptions.

### R2 — The configured prohibited set is knowingly incomplete

The implementer result calls the set intentionally narrow and explicitly permits host
product names in branch conventions. The user prohibits model, provider, and agent brand
identifiers including equivalents, not only the first five literals and two tokens. The
current configuration omits well-known equivalent model/provider/agent brands already
present in repository history and permits a brand-prefixed branch name in documentation.

Acceptance: executable configuration covers the complete repository-owned prohibited
brand family relevant to model/provider/agent identity; tests derive values from config;
all tracked documentation and paths pass. Branch examples and the execution-state branch
use a neutral repository convention. Executable configuration/profile filenames may
retain exact local identity outside documentation.

### R3 — Release tier still replays PR CI instead of complementing it

`loopEvidenceContract('release-closure')` selects the existing `release` tier, while
`selectGates('release', ...)` includes gates registered for both `ci` and `release`.
`releaseOnlyGateNames()` merely observes the difference; the actual release CLI paths
still call `runTier('release')`, which reruns the full CI matrix. Exact-SHA CI evidence is
validated only by an unused helper. This contradicts the claimed evidence split.

Acceptance: release execution requires successful exact-SHA PR CI evidence through an
integrated fail-closed input/loader, selects only complementary gates not already proven
by that evidence, and preserves every prior release-only gate. Tests prove absent,
failing, stale, mismatched, weakened/unsupported, and wrong-workflow evidence fail;
tests also prove a matching successful full-matrix record skips only equivalent CI gates
and retains all release-only gates. No workflow edit is needed.

### R4 — Authorized prerelease flow is still blocked by stale human-gate prose

The rewritten SOP, autonomous goal, execution plan, ADR, and bootstrap prompt still say
every alpha/beta promotion must stop for a new human message naming the exact SHA. This
bootstrap explicitly authorizes automatic dev/main integration, tag, npm publication,
dist-tag, GitHub Release, evidence, issue updates, and cursor advancement for alpha.1
through beta.2 after unanimous implementer/release-verifier/thinker GO and all gates.
Only #1178 must stop at the human RC architecture decision.

Acceptance: current documentation consistently records the authorized alpha.1–beta.2
automatic release flow and the human stop at #1178, while preserving human ownership of
architecture, public API/surface, security boundaries, exceptions, and RC admission.
Alpha.0 remains strictly unpublished.

### R5 — Implementer resume invocation is invalid for the installed CLI

`buildRoleInvocation` always adds model/profile flags, then adds `--session` for repair.
The installed CLI states that an agent/profile selection cannot be combined with session
resume. The repository-owned runner therefore cannot execute its documented repair path.

Acceptance: fresh sessions use configured model/profile; implementer repair resume uses
only the installed CLI's valid resume form plus prompt/output arguments, and release
verification rejects all resume forms. Tests assert the exact mutually exclusive flags.

### R6 — RED exit-code evidence is not exact

The recorded RED commands piped failing output through filters and then printed the
pipeline's final command status, which was `0`, while the result reports exit `1`.
The underlying missing-module failure is real, but the exact command/exit evidence is
unsupported.

Acceptance: add a fresh meaningful RED probe for each repaired behavior using commands
whose true exit status is captured without a masking pipeline. Record command, output
reason, and exact exit code. Do not rewrite the prior failed evidence; supersede it here.

## Scope review

- No product/package/example/website/workflow file changed.
- No architecture, public API, security boundary, package version, tag, publication, or
  external state changed.
- The migration manifest preserves before/after blob hashes, but it must be regenerated
  after repairing R1/R2 and must include the previously exempt packet.
- No PR should open until R1–R6 pass independent thinker replay.
