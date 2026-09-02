# Roadmap

OpenElement = Web Components-native fullstack application framework.

Source package line: `v0.43.3`.
npm registry line: `v0.43.3` (dist-tag `latest`).
`0.43.3` is both the current source package line and the npm `latest` line.
Active execution target: `v0.44.0-beta.1`.
Latest landed train: `v0.43.3`.
Next planned train: `v0.44.0-beta.2`.
Next public prerelease: `v0.44.0-beta.1`.
Long-term stable product target: `1.0.0` (unscheduled).

Execution follows
[PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).

## Current: internal Alpha.10 truth closure

The internal Alpha workspace train is complete through Alpha.9. Alpha.0 supplied
the accepted compiler proof, exact-SHA CI foundation and minimum history safety;
alpha.1 through alpha.7 ran as independent parallel workspaces; Alpha.8 was the
sole aggregation workspace; Alpha.9 closed semantic convergence before Beta.1
admission.

The current internal checkpoint is Alpha.10 (Truth Closure), tracked by umbrella
issue #1155 with work issues #1209 through #1220. Alpha.10 is a hard blocker for
Beta.1 and publishes nothing: no tag, npm publication, GitHub Release, dist-tag
change or `main` promotion.

Alpha identifiers are internal work identifiers, not package releases. The
three-role loop is off for all Alpha work.

## Release train

ADR-0151 defines the canonical train and supersedes the ADR-0149 five-Beta
mapping. Each phase answers one question:

1. Beta.1 — Framework Qualification + Governance Freeze: is the framework itself
   trustworthy? First intended public v0.44 prerelease (`v0.44.0-beta.1`); the
   three-role release loop activates here.
2. Beta.2 — Productization + Governance Offload: can external users really use
   and maintain it?
3. Beta.3 — Final Hardening + Formal Benchmark + Real SaaS Qualification: can
   real workloads break the architecture?
4. RC1 — Frozen Candidate / Soak: did we misjudge the candidate? The RC1 version
   string is `v1.0.0-rc.1` if the Beta.3 v1-admission assessment passes,
   otherwise `v0.44.0-rc.1`.
5. Stable/1.0 is decided on Beta.3 evidence only and is never pre-declared; an
   unproven surface is never relabeled as 1.0.

The detailed mapping lives in `docs/roadmap/v0.44.0-ISSUES.md`.
