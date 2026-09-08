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

Historic v0.44 alpha.0-alpha.10 identifiers were internal/unpublished and retain
that status. Under [ADR-0152](../adr/ADR-0152-product-router-and-alpha-convergence.md),
Beta.2.1/2.2/2.3 convergence is followed by public `1.0.0-alpha.1`, using npm
`alpha`. The `latest` dist-tag remains on the last admitted stable release.
Release automation must implement this distinction before publication (#1323/#1334).

The three-working-day implementation target is not a release waiver. A blocked
candidate stays unpublished with explicit remaining issues. Public Beta checkpoints
and public 1.0 Alpha retain the existing exact-SHA and release GO requirements.

RC admission follows sufficient 1.0 Alpha evidence (#1243), with no fixed date.
Independent application qualification binds to the candidate's exact SHA, package
bytes, integrity records and provenance. Any candidate-byte change invalidates its
qualification for promotion and requires a new qualified candidate. Stable admission
requires the separate human GO and final gate #37; Alpha is not a stability claim.

Version parsing and comparison live in `tools/lib/version.ts`. It accepts
SemVer prerelease identifiers in sequence (numeric identifiers compare
numerically); build metadata and v-prefixed input remain unsupported and core
numbers must be safe integers. Formatting retains every identifier. Checkpoint
succession stops at beta.2.3; the separate admitted product-stage successor is
1.0.0-alpha.1. Planning this successor never executes a bump or publication.
Historical 0.44.0-alpha.0 through alpha.10 remain unpublishable; public 1.0 Alpha
still requires all standing exact-SHA release gates.
