# v0.44 version plan

OpenElement = Web Components-native fullstack application framework.

The published stable line remains `v0.43.3`. The active target is the internal,
unpublished Alpha.10 Truth Closure checkpoint tracked by umbrella issue #1155.

ADR-0147 defines the Alpha workspace train, which is complete through Alpha.9.
ADR-0151 retopologizes the release train and supersedes the ADR-0149 five-Beta
mapping; the remainder of ADR-0149 and ADR-0150 that is not about Beta topology
is unaffected. ADR-0146 remains the release-role authority and activates at
Beta.1.

- Repository package line: `v0.43.3`
- npm registry line: `v0.43.3`
- Current source package line: `v0.43.3`
- Current npm registry line: `v0.43.3`
- Latest landed train: `v0.43.3`
- Active internal target: Alpha.10 Truth Closure (internal, unpublished; umbrella #1155)
- Active release target: `v0.44.0-beta.1`
- Next planned public train: `v0.44.0-beta.1`
- Next public prerelease: `v0.44.0-beta.1`

The coherent five-package distribution contract follows
[PACKAGE_SURFACE.md](./PACKAGE_SURFACE.md) and ADR-0114. The supported server
integration remains `nitro-mount`.

- Browser matrix: Chromium, Firefox and WebKit.

## Alpha is an internal workspace train

`alpha.0` is the common foundation. `alpha.1` through `alpha.10` are internal work
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

Alpha.1 through Alpha.9 are complete. Alpha.10 is the active internal
checkpoint.

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
| alpha.9     | Semantic Convergence        | Alpha.9 umbrella and workstreams             | prove one semantic owner before Beta.1 admission                       |
| alpha.10    | Truth Closure               | #1209-#1220 under umbrella #1155             | close remaining truth drift; hard-block Beta.1 admission               |

The first seven workspaces begin from that exact base and run concurrently. A workspace
may use contract fixtures or mocks for another workspace, but may not introduce a
fallback architecture, private cross-package import, workspace alias, compatibility
shim, or unilateral shared-contract change.

Each workspace has one agent that owns implementation, focused RED/GREEN tests,
targeted gates, its commits and its branch. There is no thinker/implementer handoff
inside Alpha and no release verifier. Cross-workspace questions go to the frozen
contract; genuine contract changes are recorded once and broadcast to every affected
workspace.

## Alpha integration and semantic convergence

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

Alpha.9 continues in the same integration worktree, branch and PR after the explicit
Alpha.8 checkpoint. It closes the ADR-0150 semantic workstreams, records current
ownership, and produces the one final exact-head candidate. Workspace branches run
targeted gates. They do not each run the full repository matrix. Failed integration
or convergence creates another PR #1199 candidate SHA, not a release-verifier session.

Alpha.8 and Alpha.9 are complete: the integrated candidate landed on `dev` and the
ADR-0150 semantic workstreams closed with their recorded ownership evidence in
[SEMANTIC_OWNERSHIP.md](./SEMANTIC_OWNERSHIP.md).

## Alpha.10 truth closure

Alpha.10, the current internal checkpoint (ADR-0151), closes the remaining
release-truth drift left after Alpha.9 semantic convergence and is a hard blocker
for Beta.1 admission: Beta.1 may not begin until every Alpha.10 issue carries
exact closure evidence. Alpha.10 is governed by umbrella issue #1155 and the
"v0.44 Alpha.10 — internal (unpublished truth closure)" milestone; its work
issues are #1209 through #1220. It creates no tag, npm publication, GitHub
Release, dist-tag change or `main` promotion, and no Alpha.10 artifact is
published.

## Beta, RC and the Stable/1.0 decision

ADR-0151 defines the public train. Each phase answers one question:

| Phase       | Question                                            | Responsibility                                                                                  |
| ----------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Beta.1      | Is the framework itself trustworthy?                | Framework qualification and governance freeze; first public v0.44 prerelease; three-role loop on |
| Beta.2      | Can external users really use and maintain it?      | Productization and governance offload                                                            |
| Beta.3      | Can real workloads break the architecture?          | Final hardening, formal benchmark and real SaaS qualification                                    |
| RC1         | Did we misjudge the candidate?                      | Frozen candidate and soak                                                                        |
| Stable/1.0  | —                                                   | Decided on Beta.3 evidence only; never pre-declared                                              |

The RC1 version string is `v1.0.0-rc.1` when the Beta.3 v1-admission assessment
passes, otherwise `v0.44.0-rc.1`. An unproven surface is never relabeled as 1.0.

At Beta.1 and later public boundaries, the configured thinker, implementer and fresh
release verifier rules apply. PR CI remains the sole authoritative full matrix for an
exact SHA. `latest` remains on stable 0.43.x until an explicitly approved 0.44 Stable
release.

Beta.1 branch convergence is fail closed: every remote head is classified, every open
PR is resolved or explicitly carried forward, and only an explicit reviewed deletion
list may run. Unknown-owned branches and local user worktrees are never bulk deleted.

RC1 is the immutable frozen candidate. Any code, dependency, lockfile or artifact-byte
change after candidate freeze creates a new candidate and repeats qualification. RC
promotion does not rebuild the artifacts and requires explicit human GO.

`internal alpha.1-alpha.9 workspaces (complete) -> internal alpha.10 truth closure (current) -> beta.1 framework qualification + governance freeze -> beta.2 productization + governance offload -> beta.3 final hardening + formal benchmark + real SaaS qualification -> RC1 frozen candidate / soak -> Stable/1.0 decision on Beta.3 evidence`
