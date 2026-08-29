# ADR-0147: Internal Alpha workspace train

- Status: Accepted
- Date: 2026-08-29
- Supersedes: ADR-0146 only for v0.44 Alpha execution

## Context

Applying the three-role release loop to every Alpha slice serialized implementation,
repeated verification work, and treated internal architecture packages like public
releases. That made the 0.44 architecture train unnecessarily slow.

## Decision

Alpha.0 through Alpha.8 are internal scheduling identifiers. Alpha.1 through Alpha.7
run as independent workspaces with one end-to-end agent each. Alpha.8 is the sole final
integration workspace with one integration agent.

The three-role loop, fresh release verifier and unanimous release GO are disabled for
the complete Alpha train. ADR-0146 becomes active at Beta.1 and later public release
boundaries.

PR CI remains authoritative for exact SHAs, but the full matrix runs only for the
alpha.8 integration PR to `dev`. Workspace agents run targeted gates.

## Consequences

- Architecture work proceeds concurrently instead of through one central dispatch and
  review queue.
- Alpha numbers do not create tags or publications.
- Integration risk is concentrated and made explicit in alpha.8.
- Beta retains independent release verification and publication protection.
