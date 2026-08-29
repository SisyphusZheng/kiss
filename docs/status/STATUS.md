# OpenElement status

Updated: 2026-08-29

- Repository package line: `v0.43.3`
- npm registry line: `v0.43.3` (dist-tag `latest`)
- Latest landed train: `v0.43.3`
- Active release target: `v0.44.0-alpha.0`
- Next planned train: `v0.44.0-alpha.1`
- Next public prerelease: `v0.44.0-beta.1`
- Published stable package line: `v0.43.3` on npm `latest`
- Current development mode: internal parallel Alpha workspaces
- Minimum branch rules: active on `dev` and `main` through ruleset `21775463`
- Alpha parallel start gate: the exact #1193 closure SHA is the common base
- Deferred hardening: #1192 Beta.3 with #1156 #1187 #1188 #1189
- Long-term `1.0.0` target: unscheduled

Contributor execution follows
[PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md). The authoritative active
contract is [VERSION_PLAN.md](../current/VERSION_PLAN.md).

## Current position

PR #1194 landed the earlier acceleration baseline at exact SHA
`e3e7b8ae5ddc7faddb8267c36494be73f18701e8` with 9/9 PR checks green. ADR-0147
supersedes that baseline's Alpha execution topology with the workspace train described
here.

PR #1195 landed the corrected workspace train at exact SHA
`cdfcb5433e58f9fde68377afc12643b045bfd385`. The exact #1193 closure SHA freezes the
collaboration contract and executable ownership map and is the alpha.1-alpha.7 common
base.

Alpha.1 through Alpha.7 will be separate worktrees, branches and agents running
concurrently from one frozen base. Alpha.8 will be the only integration workspace and
agent. The three-role release loop is not active during Alpha.

Alpha work is internal-only: no tag, npm publication, GitHub Release, dist-tag change,
`main` promotion or external release claim. Beta.1 is the first public prerelease and
the first phase that activates the thinker/implementer/fresh-verifier release loop.
