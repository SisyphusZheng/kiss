# ADR-0117: Second Audit Round and Alpha.18 Sweep

- Status: ACCEPTED
- Date: 2026-07-24

## Context

A second full-project audit on 2026-07-24 (after alpha.17 shipped) verified the
first round's remediation and found eleven high-severity issues, twelve
medium-severity issues, and a redundancy inventory. Three patterns stand out:

- Several alpha.16/17 fixes closed only one of several sibling paths: the
  missing-closure main-CI failure is fixed on the CI path but not on local
  `patch-release`; version-anchor gates assert new anchors exist but never
  reject stale ones; the entry-descriptor single-instantiation holds within a
  phase but CEM classifications are lost across phases.
- Publicly documented claims outrun evidence: WebKit is "verified" with no
  automation, `VERIFICATION.md` claims checks that fail, STATUS marked a
  package complete with two open items, and the `/@fs/` acceptance shipped
  unmet.
- A public feature (`reflect: true` static props) shipped without any test
  layer and is broken in all three engines (write-loop storms, SSR attribute
  overwrite at connect).

The redundancy audit additionally confirmed deletable dead code (unused
exports, three dead build-context fields, orphaned tools scripts), stale
exclude entries in `deno.json`/`.gitignore`, and one tracked stale file
(`REVIEW-REPORT.md`).

## Decision

- Cut `v0.41.0-alpha.18` as the second audit-driven sweep. It adds no new
  product surface and no new packages.
- Every fix package must include a "sibling paths enumerated" acceptance note
  so a fix cannot close one path while leaving its siblings broken — the
  half-fix pattern is the audit's meta-finding.
- Documentation claims that cannot be mechanically evidenced (browser matrix,
  verification checklists, completion states) are either wired to automation
  or reworded to what the evidence shows; evidence honesty outranks coverage
  breadth.
- The redundancy inventory is executed as governed deletion: dead code with
  zero consumers is removed, stale config entries converge to one source of
  truth, and `REVIEW-REPORT.md` is retired per the archive policy (git
  history preserves it).
- Previously planned items (root-level `<Show>`/`<For>` CSR edge, `/@fs/`
  Windows verification or documented limitation) are completed or explicitly
  deferred with evidence, closing the "planned but silently unmet" gap.

## Consequences

Positive: sibling-path fixes restore trust in the remediation process; doc
claims become mechanically checkable; the dead-code and config cleanup lowers
maintenance surface before the `0.41.0` freeze decision.

Negative: the alpha line lengthens again; some deletions are breaking surface
changes (export removals) requiring release-note migration notes.

Neutral: ADR-0116 remains the parent decision; this ADR records that the
second audit round is a continuation of the same doctrine, not a new one.
