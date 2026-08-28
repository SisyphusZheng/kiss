# Security policy

Report suspected vulnerabilities through
[GitHub private vulnerability reporting](https://github.com/open-element/openelement/security/advisories/new),
not a public issue or discussion. Include the affected package and version,
reproduction steps, impact, and any proposed mitigation.

Maintainers aim to acknowledge reports within five business days and provide a
status update within ten business days. Advisories are published when users
need to act, with reporter credit when requested.

The latest stable release is supported. Prerelease code may change before
stable, and security fixes are applied to the active supported line when
practical.

## Repository controls

- Renovate proposes supported dependency updates, including Deno and GitHub
  Actions inputs.
- Dependency review, CodeQL, Gitleaks, actionlint, zizmor, and OpenSSF Scorecard
  provide complementary automated checks.
- GitHub Secret Scanning and Push Protection are enabled where repository
  entitlement permits.
- Publication uses npm Trusted Publishing/OIDC; long-lived npm publication
  tokens are not an authorized release path.
- Protected `dev` and `main` branches require reviewed pull requests and
  exact-SHA checks.

Tool configuration never replaces review of OpenElement-specific public
boundaries, provenance, server rendering, claim, packed consumers, or release
ordering.
