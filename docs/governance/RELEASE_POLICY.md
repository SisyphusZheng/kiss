# Release policy

Pull-request CI is the sole authoritative complete matrix for an exact candidate SHA.
Release verification consumes matching CI evidence and runs only missing,
adversarial, release-only, packed-artifact, browser/runtime, documentation, security,
provenance, and version-exit checks.

A release requires machine-readable evidence bound to the version, repository,
candidate SHA, authoritative workflow and run, and explicit implementer,
release-verifier, and thinker GO. Invalid, stale, mismatched, weakened, or
non-unanimous evidence fails closed. The exact-SHA binding, immutable-evidence
fields, three-role GO and NO-GO semantics behind this paragraph are specified
in `docs/governance/RELEASE_CONTRACT.md`.

Published packages use npm Trusted Publishing/OIDC and provenance. Protected branches
and GitHub Rulesets hold merge authority. Tags, Releases, assets, attestations, and npm
provenance are durable published-version proof; temporary Actions artifacts are not
the sole future proof.

All Alpha identifiers are internal and unpublished: they receive no tag, npm
publication, GitHub Release, dist-tag or `main` promotion. ADR-0149 makes Beta.1 the
first public v0.44 framework qualification and assigns Beta.2 the final Trusted
Publishing, provenance and release-protection foundation.

Beta.5 is the immutable RC candidate. Independent SaaS qualification binds to its
exact commit SHA, package bytes, integrity records and provenance. RC may admit only
those identical artifacts after explicit human GO. Any code, dependency, lockfile or
artifact change creates a new Beta.5 candidate and invalidates the previous SaaS
qualification for promotion.
