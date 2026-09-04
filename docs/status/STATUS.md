# OpenElement status

Updated: 2026-09-02

- Repository package line: `v0.44.0-beta.2`
- npm registry line: `v0.44.0-beta.2` (prerelease, dist-tag `beta`)
- Latest landed train: `v0.44.0-beta.2`
- Active release target: `v0.44.0-beta.2`
- Next planned train: `v0.44.0-beta.3`
- Next public prerelease: `v0.44.0-beta.3`
- Published stable package line: `v0.43.3` on npm `latest`
- Current development mode: public Beta train — Beta.1 published as a
  prerelease under dist-tag `beta`; Beta.2 in flight, next stage Beta.3
  (ADR-0151)
- Minimum branch rules: active on `dev` and `main` through ruleset `21775463`
- Deferred hardening: #1192 Beta.3 with #1156 #1187 #1188 #1189
- Long-term `1.0.0` target: unscheduled

Contributor execution follows
[PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md). The authoritative active
contract is [VERSION_PLAN.md](../current/VERSION_PLAN.md).

## Current position

PR #1194 landed the earlier acceleration baseline at exact SHA
`e3e7b8ae5ddc7faddb8267c36494be73f18701e8` with 9/9 PR checks green. ADR-0147
supersedes that baseline's Alpha execution topology with the workspace train.

PR #1195 landed the corrected workspace train at exact SHA
`cdfcb5433e58f9fde68377afc12643b045bfd385`. The exact #1193 closure SHA freezes the
collaboration contract and executable ownership map and is the alpha.1-alpha.7 common
base.

Alpha.1 through Alpha.10 are complete: the parallel workspaces, the Alpha.8
integration, the ADR-0150 Alpha.9 semantic convergence and the Alpha.10 Truth
Closure checkpoint (umbrella issue #1155, issue tree #1209 through #1220,
verifier PASS at #1150) all closed with their recorded evidence. Alpha
checkpoints were internal-only: no tag, npm publication, GitHub Release,
dist-tag change, `main` promotion or external release claim.

Beta.1 (`v0.44.0-beta.1`) is published as the first public v0.44 prerelease
under dist-tag `beta` — the first phase of the
thinker/implementer/fresh-verifier release loop. The npm `latest`
dist-tag stays stable at
`0.43.3` until an explicitly approved 0.44 Stable release.
