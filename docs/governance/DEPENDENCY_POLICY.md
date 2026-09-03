# Dependency policy

> Status: Mandatory POLICY from v0.44 Beta.2 (#1233, audit L10). This document
> is the single record of the dependency pin policy and the validation-library
> decision. It changes through ordinary pull requests; changes with
> dependency-policy impact require maintainer approval
> (`GOVERNANCE_CONSTITUTION.md` §5.5).

## §1 Enforcement inventory — one mechanism per layer

Every mechanism that asserts dependency policy, and its single owner. The
Beta.2 audit found no layer with two mechanisms asserting the same policy, so
nothing was consolidated; adding a second assertion for any row is a defect.

| Layer                       | Rule                                                                | Owner                                                            | Gate                                                            |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------- |
| GitHub Actions              | full commit SHA + `# vX.Y.Z` comment from the approved registry     | `tools/check-action-pins.ts`                                     | AutoFlow gate `actions:check-pins` (ci/release tiers)           |
| CI-downloaded binaries      | version + SHA-256 inline in the workflow step                       | `.github/workflows/autoflow-ci.yml` (actionlint, gitleaks steps) | the CI step itself (`sha256sum -c` fails the job)               |
| JSR/npm resolved versions   | committed `deno.lock` + committed `vendor/` are the pin             | `.github/actions/setup-deno-workspace` (`deno install --frozen`) | every CI job: `git diff --exit-code -- deno.lock` after install |
| Update proposals            | Dependabot, `github-actions` ecosystem only, weekly, 7-day cooldown | `.github/dependabot.yml`                                         | proposals only; never an assertion                              |
| Vulnerability review        | fail PRs on high-severity dependency findings                       | `actions/dependency-review-action` in `autoflow-ci.yml`          | required CI job on pull requests                                |
| Validation-library boundary | published package source imports no schema-validation library       | `tools/check-validation-boundary.ts`                             | AutoFlow gate `validation:boundary-check` (ci/release tiers)    |

npm/JSR dependency updates are deliberately not automated: Dependabot covers
GitHub Actions only. A dependency update is a pull request that changes the
specifier and the lockfile together, reviewed under the constitution §5.5
dependency-policy clause.

## §2 Pin policy for `deno.json` specifiers

Because §1 pins every resolved version through the committed lockfile and
vendor tree, the specifier style in a `deno.json` import map records **update
intent**, never reproducibility. Two styles are in force:

- **Exact pin** where silent drift must become a deliberate diff:
  repo-internal build/test/e2e tooling whose drift breaks pipeline
  determinism (`vite`, `@playwright/test`, `nitro`, `pagefind`,
  `@rollup/plugin-terser`, `@deno/vite-plugin`), third-party widget and
  runtime libraries pinned for e2e and visual-baseline stability
  (`@zag-js/*`, `@lit/context`), and `urlpattern-polyfill`, whose exact
  version guards the router's semantic parity with the platform-standard
  `URLPattern` owner (`docs/current/SEMANTIC_OWNERSHIP.md`).
- **Caret range** for shared platform libraries (`@std/*`, `hono`, `preact`,
  `@preact/signals*`, `typescript`, `yaml`, `marked`, `gray-matter`,
  `@mdx-js/*`, `jsonc-parser`, `preact-render-to-string`) and for fixture
  recipe libraries (`zod`, `valibot`): minor/patch drift is accepted between
  deliberate updates, and the lockfile still pins every CI run.

Published-package dependencies — `packages/*/deno.json` imports plus the
root-map specifiers their source imports — flow verbatim into the npm
tarballs' `package.json` (`tools/publish-npm.ts`). They therefore prefer
caret ranges: an exact pin in a library forces diamond duplication onto every
consumer. An exact pin there needs a recorded support-contract reason;
`urlpattern-polyfill` above is the standing example.

## §3 Validation-library decision: explicit dual, justified

The framework is deliberately validation-agnostic: the ADR-0120 action
protocol receives `FormData` and any schema library runs inside the action
(`docs/integrations/validation.md`). zod and valibot are both present, and
the duality is intentional:

- Each library appears exactly once, in the request-time interop fixture —
  `/register` uses zod, `/subscribe` uses valibot
  (`packages/adapter-vite/__fixtures__/request-time/`). Two structurally
  different schema APIs (fluent vs pipe) are the executable proof that the
  application loop is library-agnostic, gated in three browser engines by
  `fixture:request-time:gate`. Removing either library would delete the
  discriminating power of that proof.
- Neither library is imported by any published package source
  (`packages/*/src`), so neither ships to consumers. Both are root import-map
  caret entries used only by the fixture; convergence would change nothing a
  consumer can observe and would weaken the interop evidence. That is the
  §4.3-style justification for retaining both: canonical owner is the
  ADR-0120 action protocol, the second library fills the interop-proof role,
  and the parity proof is the three-engine fixture gate.

**Boundary rule.** Published package source must not import zod, valibot or
any other schema-validation library — validation stays userland. The rule is
enforced mechanically by `deno task validation:boundary-check`
(`tools/check-validation-boundary.ts`, ci/release tiers). Examples, fixtures
and docs recipes may use either library.

**Duplicated generic validation.** None found. No repository code
re-implements schema validation; the only validators in the action loop are
the two fixture recipes above, and they exist to exercise two different
libraries against one protocol, not to duplicate each other.
