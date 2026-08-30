# v0.44 version plan

OpenElement = Web Components-native fullstack application framework.

The published stable line remains `v0.43.3`. The active target is the internal,
unpublished `v0.44.0-alpha.0` workspace baseline on `dev`.

ADR-0147 defines Alpha execution. ADR-0146 remains the release-role authority and
activates at Beta.1. ADR-0149 defines the post-Alpha qualification ladder.

- Repository package line: `v0.43.3`
- npm registry line: `v0.43.3`
- Current source package line: `v0.43.3`
- Current npm registry line: `v0.43.3`
- Latest landed train: `v0.43.3`
- Active release target: `v0.44.0-alpha.0`
- Next planned train: `v0.44.0-alpha.1`
- Next public prerelease: `v0.44.0-beta.1`

The coherent five-package distribution contract follows
[PACKAGE_SURFACE.md](./PACKAGE_SURFACE.md) and ADR-0114. The supported server
integration remains `nitro-mount`.

- Browser matrix: Chromium, Firefox and WebKit.

## Alpha is an internal workspace train

`alpha.0` is the common foundation. `alpha.1` through `alpha.8` are internal work
identifiers, not npm versions and not release candidates. No Alpha work package
creates a tag, npm publication, GitHub Release, dist-tag change, `main` promotion,
fresh release-verifier run, or unanimous three-role release GO.

The three-role release loop is disabled throughout Alpha. It begins at Beta.1, after
the Alpha integration workspace has produced one coherent framework SHA.

## Start condition

Before cloning implementation workspaces:

1. #1193 minimum `dev`/`main` history safety is active.
2. `v0.44.0-ALPHA-CONTRACT.md` freezes the minimum semantic seams already accepted
   by ADR-0143 and proved by #1160.
3. `tools/config/v044-alpha-workspaces.json` records disjoint write ownership.
4. #1193 closure evidence records the exact fast-forwarded common base SHA.

This is a short shared freeze, not a governance wave.

## Internal Alpha workspaces

| Internal ID | Workspace                   | Issues                                       | Agent ownership                                                        |
| ----------- | --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| alpha.1     | Compiler / Part Program     | #1161 #1162 #1163 compiler slice             | code, tests, fixtures and branch end-to-end                            |
| alpha.2     | Element Runtime / Signals   | #1164 #1165 #1166 #723 #1167                 | code, tests, fixtures and branch end-to-end                            |
| alpha.3     | SSR / DOM Claim             | #1168 #1169 #1170                            | code, tests, fixtures and branch end-to-end                            |
| alpha.4     | App / Islands / Delivery    | #1088 #1171 #1172 #1173 #1163 delivery slice | code, tests, fixtures and branch end-to-end                            |
| alpha.5     | Replacement / Migration     | #1174                                        | legacy-absence inventory, migration and removal changes                |
| alpha.6     | Interoperability            | #1175                                        | external-component corpus and fixes                                    |
| alpha.7     | Performance / Qualification | #1176                                        | budgets, benchmarks, browser/runtime and packed-consumer qualification |
| alpha.8     | Final Integration           | #1181                                        | absorb all accepted workspace SHAs and produce one coherent candidate  |

The first seven workspaces begin from that exact base and run concurrently. A workspace
may use contract fixtures or mocks for another workspace, but may not introduce a
fallback architecture, private cross-package import, workspace alias, compatibility
shim, or unilateral shared-contract change.

Each workspace has one agent that owns implementation, focused RED/GREEN tests,
targeted gates, its commits and its branch. There is no thinker/implementer handoff
inside Alpha and no release verifier. Cross-workspace questions go to the frozen
contract; genuine contract changes are recorded once and broadcast to every affected
workspace.

## Alpha integration

The alpha.8 integration workspace is the only Alpha workspace that aggregates other
branches. Its agent:

1. consumes the exact accepted source head SHA from alpha.1 through alpha.7;
2. integrates their reviewed commit series in dependency order through linear
   cherry-picks and records the source-to-integrated SHA mapping;
3. resolves interface and integration failures in the integration workspace;
4. proves compiler -> Part Program -> SSR/fresh DOM/existing-DOM claim -> signals ->
   islands -> Vite -> Nitro/server -> real application;
5. opens the single integration pull request to `dev`; and
6. accepts only the exact-SHA PR full CI result.

Workspace branches run targeted gates. They do not each run the full repository
matrix. Failed integration creates another alpha.8 candidate SHA, not a new release
verifier session.

## Beta and release governance

| Phase  | Responsibility                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Beta.1 | Qualify and publish the integrated framework, activate the three-role loop, then converge remote branches to the `dev`/`main` long-lived pair |
| Beta.2 | #1156 and #1187 establish release/governance foundations, Trusted Publishing, provenance, rulesets and mature pinned tools                    |
| Beta.3 | #1150 qualifies the integrated UI system                                                                                                      |
| Beta.4 | #1157 #1158 #1159 #1177 qualify content, API metadata, the real website and Starter                                                           |
| Beta.5 | #1192 #1188 #1189 complete final evidence/document/media hardening and independent SaaS qualification of immutable artifacts                  |
| RC     | #1178 admits the identical Beta.5 SHA and artifacts after the human architecture decision                                                     |
| Stable | Explicit approval after the full product ladder and remaining soak                                                                            |

At Beta.1 and later public boundaries, the configured thinker, implementer and fresh
release verifier rules apply. PR CI remains the sole authoritative full matrix for an
exact SHA. `latest` remains on stable 0.43.x until an explicitly approved 0.44 Stable
release.

Beta.1 branch convergence is fail closed: every remote head is classified, every open
PR is resolved or explicitly carried forward, and only an explicit reviewed deletion
list may run. Unknown-owned branches and local user worktrees are never bulk deleted.

Beta.5 is the immutable RC candidate. Any code, dependency, lockfile or artifact-byte
change creates a new Beta.5 candidate and repeats SaaS qualification. RC promotion
does not rebuild the artifacts and requires explicit human GO.

`internal alpha.8 -> beta.1 framework -> beta.2 release foundations -> beta.3 UI -> beta.4 website -> beta.5 immutable real-product candidate -> RC -> Stable`
