# ADR-0144: Offload Generic Repository Governance

- Status: ACCEPTED (2026-08-27, implementation tracked by the v0.44 plan)
- Date: 2026-08-27
- Amends: ADR-0088, ADR-0101 and the governance-toolchain evaluation

## Context

The repository currently carries more than five thousand lines in AutoFlow and more
than sixteen thousand lines of top-level tooling. Some of that code protects genuine
OpenElement semantics; much of it reimplements mature dependency, Markdown, link,
workflow, security and release-note tooling. Every generic rule implemented here is
another local product to maintain.

## Decision

The repository keeps policy, not generic machinery. Adoption happens incrementally
and a custom gate is removed only after its replacement proves equivalent on the
default branch.

| Concern                                | Selected owner                                        | Repository responsibility                  |
| -------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| TypeScript format/lint/type graph      | Deno fmt, lint and check                              | Configuration and OE boundary tests        |
| Dependency updates                     | Renovate Deno manager                                 | Grouping, stability delay and merge policy |
| Markdown structure                     | markdownlint-cli2                                     | Small project configuration                |
| Built-site/internal and external links | lychee                                                | Exclusion and retry policy only            |
| GitHub workflow correctness            | actionlint                                            | Workflow-specific shell checks only        |
| GitHub workflow security               | zizmor + pinned action SHAs                           | Explicit suppressions with reasons         |
| Repository security posture            | CodeQL + OpenSSF Scorecard                            | Fix findings; no duplicate scanners        |
| npm package quality                    | publint + Are The Types Wrong                         | OE export-policy and packed-consumer tests |
| API/JSDoc extraction                   | `deno doc --json --lint`                              | Normalize only supported OE exports        |
| Custom Element metadata                | Custom Elements Manifest format                       | OE compiler emits exact metadata           |
| Ownership and contribution intake      | GitHub CODEOWNERS, issue forms, PR template, rulesets | Architectural decisions and review         |
| Release notes                          | GitHub generated notes from categorized PRs           | OE version/evidence and npm publishing     |

Vale is intentionally deferred until a project vocabulary and false-positive budget
are demonstrated. Changesets and release-please are not adopted for 0.44: neither is
allowed to become a second authority over the five-package lockstep, prerelease
dist-tags and two-phase evidence model. This decision can be revisited after the
release executor is reduced to the irreducible OE-specific core.

## AutoFlow boundary

AutoFlow remains temporarily as a thin tier runner and release evidence coordinator.
It may own only:

- changed-path selection for OE-specific conformance suites;
- five-package lockstep versioning and artifact fingerprints;
- dev-to-main/tag/npm ordering and resumable evidence;
- OpenElement architecture, compiler, SSR/claim and consumer gates.

It must stop owning generic dependency discovery, Markdown rules, link crawling,
workflow linting, action-security heuristics, release-note prose and duplicated
version statements. Generated metadata replaces regex synchronization where possible.

## Admission rule for third-party tooling

A tool is admitted only when it is actively maintained, deterministic, locally
runnable or reproducibly pinned in CI, and replaces more local policy code than its
configuration introduces. Actions are pinned by full commit SHA. Network-sensitive
checks run separately from deterministic local gates.

## Verification

The 0.44 governance issue records, for every retired script, its replacement command,
equivalence evidence and deleted line count. RC entry requires zero generic check with
an unowned replacement plan and no duplicate tool producing the same authority.
