# ADR-0138: Require Real Scanner Evidence for v0.43.1

- Status: Accepted
- Date: 2026-08-23
- Supersedes: ADR-0132 for the v0.43.1 release gate
- Related: #1070, #984, #997

## Context

ADR-0132 allowed v0.43.0 to ship with the attachment scanner unconfigured.
That preserved confidentiality but left the reference document workflow
functionally incomplete: no real engine had proven either the clean download
transition or the EICAR quarantine transition.

## Decision

The v0.43.1 release candidate requires a successful Tier 3 `provision` run
with a private scanner engine. The workflow must traverse the public upload
action, private Storage, Queue, scanner service binding, real engine, scan
state transition, and owner download listing.

The qualification creates an ephemeral owner and two bounded text fixtures:
a benign file and the standard EICAR test string. It requires `clean` plus a
working owner signed link for the benign file, and `quarantined` with no owner
download listing for EICAR. Its report contains only named pass/fail checks and
the candidate SHA. Fixture bytes, object keys, user ids, cookies, and secrets
are never archived. Cleanup removes private objects before the Auth user.

Missing engine configuration remains fail-closed at runtime, but it is no
longer release-green: a provision-mode evidence run records
`not-configured` and fails. Base mode remains available for pre-migration
diagnostics and is not release evidence.

## Consequences

- Scheduled evidence fails until the private engine is provisioned.
- A successful workflow is current-SHA proof of the positive and infected
  paths, not merely proof that a scanner Worker deployment exists.
- The MetaDefender Core adapter remains the maintained synchronous provider.
  A ClamAV container is viable only on a Workers Paid account and requires its
  own reviewed authenticated wrapper and qualification before replacing it.
