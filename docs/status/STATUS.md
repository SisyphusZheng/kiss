# OpenElement status

Updated: 2026-08-28

- Published stable package line: `v0.43.3` on npm `latest`
- Repository development target: unpublished `0.44.0-alpha.0` internal closure
- Accepted Alpha.0 foundations: #1160 and #1182
- Open Alpha.0 work: #1156, #1187, #1188, and #1189
- Next cursor after closure: Alpha.1 planning; no Alpha.1 implementation has begun
- Long-term `1.0.0` target: unscheduled

## Current position

The five public packages remain `element`, `app`, `adapter-vite`, `create`, and
`ui`. The 0.43.3 line is the current user-facing baseline. Alpha.0 is reducing
generic repository machinery, enforcing exact-SHA release authorization,
converging current architecture and evidence, and reducing source-tree media.

Alpha.0 exists only on `dev`. It must not receive a tag, npm publication,
GitHub Release, dist-tag, `main` promotion, or public release representation.

## Authority

GitHub Issues and milestones hold scope and blockers; pull requests and reviews
hold discussion and repair history; Actions holds commands and temporary
artifacts; checks bind results to exact SHAs; Rulesets enforce branch authority;
and npm provenance will identify future published package origins.

See [VERSION_PLAN.md](../current/VERSION_PLAN.md) and the
[v0.44 issue graph](../roadmap/v0.44.0-ISSUES.md).
