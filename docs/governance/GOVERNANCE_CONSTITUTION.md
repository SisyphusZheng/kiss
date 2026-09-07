# Governance constitution

> Status: Mandatory POLICY for the v0.44 train, binding from Beta.1 (Framework
> Qualification + Governance Freeze) onward. Adopted under ADR-0151 as the
> Beta.1 governance-freeze instrument. Part of #1188 (Beta.1 slice).

This constitution states the rules that every contribution, review, audit and
release decision in this repository must satisfy. It is policy only: it adds no
feature, changes no product code and migrates no tooling. Where this document
and a lower-layer document disagree, repair the lower layer before changing
product code; where it and an accepted ADR disagree, the ADR wins until amended.

Authority chain, highest first:

1. accepted current ADRs (ADR-0146 three-role control plane, ADR-0148 compiler
   boundary, ADR-0152 release-train topology, and their predecessors);
2. this constitution;
3. `docs/current/VERSION_PLAN.md` and the governance SOPs
   (`PROJECT_WORKFLOW.md`, `RELEASE_POLICY.md`, `V044_ISSUE_SOP.md`,
   `V044_AGENT_LOOP_SOP.md`);
4. issue acceptance criteria, then issue comments.

## §1 Purpose and scope

The active train is governed by ADR-0152: Beta.2.1 converges Router/core,
Beta.2.2 converges Framework/Document, and Beta.2.3 closes remaining cleanup and
Alpha admission. Cleanup starts with each replacement. Public 1.0 Alpha owns
extended real-application qualification; RC/Stable remain evidence-gated.

This document governs process and semantics. It authorizes no tag, release,
package publication, dist-tag change or `main` promotion; release authority
stays with `RELEASE_POLICY.md` and ADR-0151.

## §2 Definitions

- **Semantic surface**: a concept with externally observable meaning — a
  grammar, protocol, classification, identity rule or lifecycle contract —
  that more than one component could plausibly implement.
- **Canonical owner**: the single component, artifact or platform standard
  recorded as owning a semantic surface's meaning.
- **Executor / adapter / conforming polyfill / derived index**: an
  implementation that consumes, transports, optimizes or projects the
  canonical meaning without redefining it.
- **Duplicate-looking implementation**: any code path, parser, classifier,
  validator or serializer whose observable behavior overlaps a semantic
  surface that already has a canonical owner, whatever the author's intent.
- **Evidence**: machine-rerunnable proof — exact commands, exit codes, test
  names and an exact commit SHA — recorded durably in the repository or in
  pull-request CI, never in chat history or copied transcripts.

## §3 Semantic ownership rules

§3.1. **One surface, one owner.** Each semantic surface has exactly one
canonical owner. The registry of record is
`docs/current/SEMANTIC_OWNERSHIP.md`; this constitution adopts that table and
its boundary rules without modification. Where the registry names a platform
standard (for example `URLPattern`, the Context Protocol event, or the Web
`Request`/`Response` model) as owner, the platform standard is the owner and
every project implementation is an executor of it.

§3.2. **Executors may optimize, never redefine.** An executor, adapter,
conforming polyfill or derived index may change how the canonical meaning is
delivered — caching, indexing, chunking, transport encoding — but its
observable behavior must remain identical to the canonical owner's semantics
under the parity evidence the registry row cites.

§3.3. **New surfaces are registered before they ship.** A change that
introduces a new semantic surface, or moves ownership of an existing one, must
update the registry row (or add one) in the same pull request, with its parity
evidence and its forbidden-duplicate clause. An unregistered surface is a
defect, not a gray zone.

§3.4. **Registry disputes stop the work.** If two documents or two
implementations disagree about who owns a surface, the disagreement is repaired
in documentation first. Product code does not change against a disputed
registry.

## §4 Duplicate implementations

§4.1. Duplicates are presumed defects. The default remedy for a
duplicate-looking implementation is removal or convergence onto the canonical
owner, not the addition of a compatibility shim.

§4.2. A duplicate-looking implementation may survive only as an executor,
adapter, conforming polyfill or derived index under §3.2, and only while its
justification under §4.3 remains current.

§4.3. **Duplicate-implementation justification rule.** Every
duplicate-looking implementation must carry an explicit, durable justification
with all three of the following elements. The justification lives in the pull
request that introduces or retains the implementation and, for surviving
duplicates, in the registry row's parity-evidence column:

- **Canonical owner** — the single owner of the semantic surface as recorded
  in the §3 registry, named precisely enough to locate the owning code or
  standard (package, module, or platform specification).
- **Reason** — why a second implementation exists at all: which executor,
  adapter, polyfill or derived-index role it fills, and why the canonical
  owner cannot serve that role directly.
- **Parity proof** — the exact, rerunnable evidence (gate command, test or
  corpus name, and the commit SHA at which it passed) that binds the
  duplicate's observable behavior to the canonical owner's semantics.

A duplicate-looking implementation missing any element fails the audit: it is
either removed or tracked as a blocking issue before the phase that contains
it may close. "It has always been there", "it is faster", and "the tests
pass" are not justifications; parity proof requires evidence against the
canonical owner's semantics, not merely the duplicate's own green tests. This
is the rule the Beta.1 hostile audit (#1222) cites when adjudicating every
duplicate it finds.

§4.4. A justification decays. When the canonical owner's semantics change,
every surviving duplicate of that surface must re-prove parity in the same
pull request, or the duplicate is removed.

## §5 Contribution governance

§5.1. **Roles.** Contribution authority follows the three-role control plane
of ADR-0146, active from Beta.1 under ADR-0151:

- **Thinker** — owns planning, topological scheduling, dispatch packets,
  architectural review, independent gate reruns, issue and evidence records,
  and GO/NO-GO preparation. The thinker does not implement product code while
  the configured executor is available.
- **Implementer** — owns exactly one bounded dispatch packet: tests before or
  with implementation, edits only to packet-owned paths, and a structured
  result. The implementer does not choose issues, change scope, edit
  control-plane files or promotion rules, close issues, tag or publish.
  Commit, push and pull-request writes happen only when the dispatch packet
  or bootstrap authorization explicitly grants them (ADR-0146 §5).
- **Release verifier** — a fresh session with no implementer conversation
  history, owning independent candidate closure: it derives its own closure
  test plan, attacks missing coverage, runs the version matrix and returns
  PASS, FAIL or BLOCKED with exact evidence. It never edits production code.

One role may not silently assume another role's authority. A packet accepted
on implementer self-certification alone is invalid; acceptance requires
thinker scope-and-diff verification plus green deterministic gates (ADR-0146
§3).

§5.2. **Evidence requirements.** Every claim of completion is backed by
evidence per §2: exact commands, exit codes and the exact SHA they ran
against. Invalid, stale, mismatched, weakened or non-unanimous evidence fails
closed (`RELEASE_POLICY.md`). Flaky or unavailable infrastructure is BLOCKED,
never PASS. No model or maintainer may waive a failing gate without an
accepted ADR recording the exception.

§5.3. **Pull-request contract.** Every pull request body carries these
sections, in this order:

- **Problem** — the defect, gap or policy requirement being addressed, with
  its issue link.
- **Owner** — the role and dispatch packet (or human decision) under which the
  change is made.
- **Before** — observable behavior or repository state before the change.
- **After** — observable behavior or repository state after the change.
- **Why-not-second-owner** — for any change that adds or retains a
  duplicate-looking implementation: the §4.3 justification (canonical owner /
  reason / parity proof). For changes that add none, the literal statement
  that the change introduces no duplicate-looking implementation.
- **Evidence** — the exact gate commands and exit codes run, and the SHA they
  ran against.
- **Scope** — the files owned by the change and confirmation that nothing
  outside the packet was edited.
- **Risk** — residual risks, deferred items and stop conditions hit, or an
  explicit none.

A pull request missing a section is incomplete; a reviewer may not waive a
section, only record why it is empty.

§5.4. **Frozen-semantics rule.** ADR-0122 froze the 0.42 public surface (the
request-time page loop, the action protocol, the CSRF default, first-mile
start semantics) under an amendment-ADR gate. Any commit touching those
frozen paths must cite ADR-0151 or a newer amendment ADR **in the commit
message**; the pull-request body alone is not sufficient. A commit that
touches frozen semantics without the citation is rejected at review
regardless of gate results. Changes that do not touch frozen paths need no
citation.

§5.5. **Review floor.** The author of a pull request may not be its only
approving reviewer (`MAINTAINERS.md`). Changes with architecture, public API,
security, release or dependency-policy impact require maintainer approval;
ordinary documentation and mechanical fixes follow the normal review path.

## §6 Amendment and enforcement

§6.1. This constitution changes only through an accepted ADR that amends
ADR-0151's governance-freeze terms or supersedes them. Editorial fixes that
change no rule are ordinary pull requests.

§6.2. Enforcement is deterministic first: repository gates
(`deno task workflow:check`, the `docs:*` truth checks, and the CI matrix) are
the primary enforcers, and audit issues such as #1222 apply this text to the
exact candidate SHA. A phase that closes with an unresolved §4.3 failure or a
§5.4 violation has not closed.

§6.3. Beta.1 freezes this text. Beta.2.x and public 1.0 Alpha may amend it only through
the §6.1 path; the full #1188 consolidation (ADR classification, contributor
information architecture, path migration) is continuous Beta.2.x cleanup scope and does not
relax any rule here in the meantime.
