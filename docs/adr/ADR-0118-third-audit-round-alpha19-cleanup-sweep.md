# ADR-0118: Third Audit Round and Alpha.19 Cleanup Sweep

- Status: ACCEPTED
- Date: 2026-07-25

## Context

A third full-repository audit on 2026-07-25 (after alpha.18 shipped) reviewed
architecture, redundancy and cleanliness across all five packages, the tooling
layer, the docs site and the governance documents. It produced 26 issues
(#481–#506), all accepted into milestone `v0.41.0-alpha.19`: three
high-severity, twenty medium/low-severity findings grouped around correctness
residuals, surface drift, gate blind spots and hygiene.

The audit's meta-finding is an evolution of the alpha.17/18 sibling-path
pattern: several alpha.18 fixes are correct on every path they touched but
break on **combinations** of inputs — for example the reflect short-circuit
misbehaves only when `removeAttribute` meets a default value, and the `For`
drift token breaks only when content collides with the separator. Where the
second round taught us to enumerate sibling paths, the third round teaches
that acceptance for state-dependent fixes must enumerate input combinations,
not just code paths.

## Decision

- Cut `v0.41.0-alpha.19` as a pure cleanup sweep governed by issues
  #481–#506. It adds no new product surface and no new packages.
- Every state-dependent fix ships with a "input combinations enumerated"
  acceptance note, extending the sibling-path doctrine from ADR-0117.
- Gate blind spots found by the audit (www bare version mentions, governance
  doc bodies, export-star seams, assertion style) are mechanized so the same
  class of drift cannot return silently.
- Confirmed dead code, dead config entries and stale comments are deleted
  with zero-consumer evidence recorded in each issue.

## Consequences

Positive: the audit's combination-path meta-finding becomes an enforceable
acceptance rule; governance and surface drift gains mechanical coverage; the
cleanup lowers maintenance surface before the `0.41.0` freeze decision.

Negative: the alpha line lengthens once more; some deletions remain breaking
surface changes requiring release-note migration notes.

Neutral: ADR-0116 and ADR-0117 remain the parent decisions; this ADR records
the third audit round as a continuation of the same doctrine.
