# Release policy

Pull-request CI is the sole authoritative complete matrix for an exact candidate SHA.
Release verification consumes matching CI evidence and runs only missing,
adversarial, release-only, packed-artifact, browser/runtime, documentation, security,
provenance, and version-exit checks.

A release requires machine-readable evidence bound to the version, repository,
candidate SHA, authoritative workflow and run, and explicit implementer,
release-verifier, and thinker GO. Invalid, stale, mismatched, weakened, or
non-unanimous evidence fails closed.

Published packages use npm Trusted Publishing/OIDC and provenance. Protected branches
and GitHub Rulesets hold merge authority. Tags, Releases, assets, attestations, and npm
provenance are durable published-version proof; temporary Actions artifacts are not
the sole future proof.

Alpha.0 is an internal exception only in that it is never published: it receives no
tag, npm publication, GitHub Release, dist-tag, `main` promotion, or Alpha.1 feature
work.
