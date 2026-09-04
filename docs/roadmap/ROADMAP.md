# Roadmap

OpenElement = Web Components-native fullstack application framework.

Source package line: `v0.44.0-beta.2`.
npm registry line: `v0.44.0-beta.2` (prerelease, dist-tag `beta`).
The npm `latest` dist-tag remains on the published stable 0.43 line.
Active execution target: `v0.44.0-beta.2`.
Latest landed train: `v0.44.0-beta.2`.
Next planned train: `v0.44.0-beta.3`.
Next public prerelease: `v0.44.0-beta.3`.
Long-term stable product target: `1.0.0` (unscheduled).

Execution follows
[PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).

## Current: Beta.2 productization + governance offload

The internal Alpha workspace train is complete through Alpha.10. Alpha.0 supplied
the accepted compiler proof, exact-SHA CI foundation and minimum history safety;
alpha.1 through alpha.7 ran as independent parallel workspaces; Alpha.8 was the
sole aggregation workspace; Alpha.9 closed semantic convergence before Beta.1
admission; Alpha.10 (Truth Closure, umbrella issue #1155, work issues #1209
through #1220) closed with verifier PASS at #1150 and admitted Beta.1.

Alpha identifiers were internal work identifiers, not package releases, and the
three-role loop was off for all Alpha work.

Beta.1 (`v0.44.0-beta.1`) is published as the first public v0.44 prerelease
under dist-tag `beta`; npm `latest` stays on the stable 0.43 line. Beta.2
(`v0.44.0-beta.2`) is the active public prerelease line; the next stage is
Beta.3 (`v0.44.0-beta.3`).

## Release train

ADR-0151 defines the canonical train and supersedes the ADR-0149 five-Beta
mapping. Each phase answers one question:

1. Beta.1 — Framework Qualification + Governance Freeze: is the framework itself
   trustworthy? First public v0.44 prerelease (`v0.44.0-beta.1`), published
   under dist-tag `beta`; the three-role release loop activated here.
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
