# Beta.2.1 qualification and url-pattern-list provenance

Two permanent mechanisms back the `0.44.0-beta.2.1` release qualification of
PR #1343. Both fail closed: an error, a skipped leg or a missing artifact is
never a pass.

## `url-pattern-list:provenance`

```
deno task url-pattern-list:provenance
```

`tools/check-url-pattern-list-release.ts` proves, against the **live** public
npm registry, that the `@openelement/url-pattern-list` package the Router
consumes is the intended OpenElement-maintained fork at the exact declared
pin:

1. the root `deno.json` and `packages/app/deno.json` import maps declare the
   same exact `npm:` pin (ranges, dist-tags, `workspace:`, `git:`, `file:` and
   unversioned specifiers are rejected);
2. `deno.lock` records the same exact specifier, resolves it to the same exact
   version and carries an integrity hash;
3. the registry document for the exact version reports the expected package
   name, license (`MIT`) and fork repository (`github.com/open-element/url-pattern-list`),
   and its `dist.tarball` / `dist.integrity` / `dist.shasum` are well formed;
4. the lockfile integrity equals the registry `dist.integrity`;
5. the downloaded tarball bytes hash to both digests, its `package.json`
   identity matches, every entry-point target exists, `LICENSE`/`README` ship,
   the file count matches the registry manifest, and the shipped code carries
   no `@openelement/*` reference — the fork stays generic and does not absorb
   Router semantics.

The expected version is derived from the workspace declaration, so future
releases reuse the gate by changing the pin. The task needs network access
scoped to `registry.npmjs.org` and therefore runs in authoritative CI (an
AutoFlow `ci`/`release` tier gate) and as a leg of the qualification lane —
not in offline developer loops. `--json` prints the machine-readable report
the lane consumes.

## `v044:beta21:qualification`

```
deno task v044:beta21:qualification           # full lane; writes the artifact
deno run -A tools/qualify-v044-beta21.ts --only router,versionSemantics
                                              # development subset; no artifact
```

`tools/qualify-v044-beta21.ts` executes the Beta.2.1 contract as one lane:
url-pattern-list registry provenance, checkpoint version-semantics acceptance
tables, Router unit semantics (URL winner before method dispatch, 405/`Allow`,
HEAD fallback, duplicate-identity and `pattern.pathname` rejection, no Hono
rematch), SSG canonical-authority tests plus the request-time fixture on
Chromium/Firefox/WebKit, the www navigation specs (link/direct navigation,
router guards on history traversal, SPA form actions) on all three engines,
the packed starter/UI consumers, and the standalone packed-Element proof
(authored TSX → packed `@openelement/element` → build-time-only adapter →
plain HTML consumer on all three engines, with the Router provably absent).
In CI the runtime floor legs (Node 20 fail-fast, Node 24, Bun, workerd) are
consumed from the trusted `needs` results of the same-SHA runtime jobs;
locally the lane runs the nitro Node/workerd proofs directly.

A leg is not "pass" because a command exited zero: test legs must cover every
`Deno.test` declared in their files, browser legs require per-engine pass
counts from the machine-readable Playwright report, and the packed-Element
leg requires the per-engine proof lines. Zero selected tests, an absent
browser project or a missing tarball fails the lane.

### Artifact

Only after every leg passes does the lane write
`v044-beta21-qualification.json` (schema version 1): the exact SHA (which must
equal the trusted `HEAD_SHA` workflow context in CI), the release under
qualification (derived mechanically as the admitted checkpoint successor of
the current package version), per-leg results with their evidence detail, and
the producing run identity. The `beta21-qualification` job in
`autoflow-ci.yml` runs the lane on the exact PR head SHA and uploads the
record as the `v044-beta21-qualification-<sha>` Actions artifact; the job is
a required `needs` leg of `pr-full-ci-evidence`, so the exact-SHA full-CI
record cannot exist without it.

### How release verification consumes it

A release verifier for `0.44.0-beta.2.1`:

1. downloads `v044-beta21-qualification-<candidate-sha>` from the PR's
   AutoFlow CI run and checks `sha`, `release`, `conclusion: pass` and every
   required leg (`urlPatternListRegistry`, `versionSemantics`, `router`,
   `ssg`, `navigation`, `packagedStarter`, `packagedUi`, `packagedElement`,
   `runtime`);
2. confirms the artifact's provenance by resolving the run through the
   GitHub API (the `pr-full-ci-evidence-<sha>` record already binds the run,
   the SHA and the required job set — including `beta21-qualification` — and
   the release lane verifies that record independently before publishing);
3. re-runs `deno task url-pattern-list:provenance` locally for live registry
   confirmation when it does not want to trust CI-fetched metadata.

The Beta.2.1 Router architecture is frozen for this checkpoint; the lane
proves the contract, it does not change it.
