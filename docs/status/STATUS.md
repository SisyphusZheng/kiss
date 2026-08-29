# OpenElement status

Updated: 2026-08-29

- Repository package line: `v0.43.3`
- npm registry line: `v0.43.3` (dist-tag `latest`)
- Latest landed train: `v0.43.3`
- Active release target: `v0.44.0-alpha.0`
- Next planned train: `v0.44.0-alpha.1`
- Published stable package line: `v0.43.3` on npm `latest`
- Repository development target: minimal Alpha.0 safety followed by parallel Alpha architecture
- Accepted Alpha.0 foundations: #1160, #1182 / PR #1186, and PR #1190
- Remaining Alpha.0 work: #1193 minimum branch/integration safety
- Deferred hardening: #1192 Beta.3 with #1156, #1187, #1188 and #1189
- Long-term `1.0.0` target: unscheduled

## Current position

The five public packages remain `element`, `app`, `adapter-vite`, `create`, and
`ui`. The 0.43.3 line is the current user-facing baseline. The 0.44 train no longer
places repository-wide governance, historical documentation, publication machinery
or media cleanup in front of compiled-framework implementation.

After #1193 establishes minimum server-side safety, one exact `dev` SHA becomes the
common Alpha integration base. Compiler, Runtime and SSR/Claim lanes begin in separate
worktrees after their shared contract and path ownership are frozen. App/Delivery broad
implementation begins after Integration I. Integration checkpoint pull requests, not
lane iterations, run authoritative exact-SHA full CI.

Alpha.0 exists only on `dev`. It must not receive a tag, npm publication, GitHub
Release, dist-tag, `main` promotion or external release representation.

## Authority

GitHub Issues and milestones hold scope and blockers; pull requests and reviews hold
discussion and repair history; Actions holds commands and temporary artifacts; checks
bind results to exact SHAs; and Rulesets enforce branch authority.

See [VERSION_PLAN.md](../current/VERSION_PLAN.md) and the
[v0.44 issue graph](../roadmap/v0.44.0-ISSUES.md).
Contributor execution follows [PROJECT_WORKFLOW.md](../governance/PROJECT_WORKFLOW.md).
