# npm Trusted Publishing registration (maintainer runbook)

#1187 (Beta.2 slice, B2.12): npm publication for the five `@openelement`
packages authenticates with npm Trusted Publishing/OIDC from GitHub Actions.
The long-lived npm token (`.npmrc` `_authToken` / `NPM_TOKEN` /
`NODE_AUTH_TOKEN`) is removed from the release path by design; there is no
token fallback.

The in-repo side (workflow + tooling) is complete. The steps below are the
**npm-side registration**, which only a maintainer with npm web access to the
`@openelement` scope can perform. **Until every package below is registered,
a real (non-dry-run) release publish fails at npm with an auth error.**

## What to register

For **each** of the five packages:

- `@openelement/element`
- `@openelement/app`
- `@openelement/adapter-vite`
- `@openelement/create`
- `@openelement/ui`

register this exact trusted publisher on npmjs.com:

| Field               | Value                                                     |
| ------------------- | --------------------------------------------------------- |
| Publisher type      | GitHub Actions                                            |
| Organization / user | `open-element`                                            |
| Repository          | `openelement`                                             |
| Workflow filename   | `autoflow-release.yml`                                    |
| Environment name    | _(leave blank — the workflow uses no GitHub environment)_ |

## Steps (per package)

1. Sign in to https://www.npmjs.com with an account that administers the
   `@openelement` scope.
2. Open the package page (e.g. `https://www.npmjs.com/package/@openelement/element`)
   → **Settings** → **Publishing access** → **Trusted publishers**.
3. Choose **GitHub Actions** and enter exactly:
   - Organization/user: `open-element`
   - Repository: `openelement`
   - Workflow filename: `autoflow-release.yml` (filename only, no path, no
     `.github/workflows/` prefix)
   - Environment: leave empty.
4. Save, then repeat for the remaining four packages.

## Verification

1. Confirm each package's Settings page lists the trusted publisher with the
   exact values above.
2. Dispatch a **dry-run** release first (`autoflow-release.yml` with
   `dry_run: true`) — the dry run exercises the full plan without contacting
   npm for publication.
3. The first real publish after registration must show the Trusted Publishing
   provenance attestation on each package page (npm links the Sigstore
   provenance bundle automatically for trusted publishes; the publish
   tooling also passes `--provenance` explicitly in the Actions lane).

## Operational notes

- The release job pins its own npm CLI floor (`npm install -g npm@^11.5.1`
  with a runtime `>=11.5.1` assertion) because Node 22's bundled npm predates
  native OIDC support; the floor is enforced mechanically in
  `tools/autoflow/__tests__/pr-ci-workflow.test.ts`.
- The `NPM_TOKEN` repository secret can be deleted from GitHub after the
  first successful trusted publish; nothing in the repo references it.
- Do not reintroduce `.npmrc` auth or token env vars into
  `autoflow-release.yml`; the workflow test above fails closed on any
  `NPM_TOKEN` / `NODE_AUTH_TOKEN` / `_authToken` reference.
