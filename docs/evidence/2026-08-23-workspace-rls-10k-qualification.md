# Workspace RLS and 10k qualification

This is bounded qualification evidence for #1114, not a cross-framework
benchmark or a product performance SLO.

## Environment

- Date: 2026-08-23
- Host: Apple arm64, 8 logical CPUs, macOS
- Database: Supabase Postgres 17.6 in `ap-northeast-1`
- Node: 24.18.0
- Workers emulator: Wrangler 4.123.0 / workerd 1.20260811.1
- Dataset: two transaction-local users and workspaces; 10,000 deterministic
  workspace-A rows and one workspace-B sentinel row
- Cleanup: every database qualification ran inside `BEGIN`/`ROLLBACK`

Provider credentials, JWTs, email addresses and generated user/workspace IDs are
excluded from this artifact.

## Isolation result

The live-project SQL probe switched to the `authenticated` and `anon` database
roles with transaction-local claims. For user A:

- workspace B SELECT returned zero rows;
- workspace B INSERT raised insufficient privilege;
- workspace B UPDATE and DELETE affected zero rows;
- deleting workspace-A membership made all workspace-A records immediately
  invisible on the next database statement;
- the anonymous role had no table privilege and failed closed;
- all 10,001 fixture rows and both fixture users/workspaces rolled back.

The membership functions read server-controlled membership rows on every
statement, so removal does not wait for JWT refresh. Applications should still
refresh their UI/session at the next request boundary to discard stale client
state.

## Pagination and query plan

The qualification captured the first page cursor, inserted one newer row, then
read page two with the `(created_at, id)` keyset. Page two remained exactly 50
rows without admitting the concurrent row or duplicating page one.

A filtered page-two query (workspace, active status, title prefix, stable
descending cursor) used `workspace_records_workspace_created_id_idx`; the
`workspace_records` access was an index scan, returned 50 rows, and completed in
1.832 ms with 189 shared hits and zero reads. The only sequential scans in the
plan were the one-row transaction-local ID/cursor fixtures, not the 10k table.

The request loader always requests at most 51 rows, returns 50, and emits a
cursor from the final returned `(created_at, id)` pair. Unit tests cover cursor
round-trip, fail-closed workspace parsing, stable ordering, filtering, and the
hard query limit.

## SSR/runtime result

The reproduction gate now starts the generated Node standalone server and the
generated Nitro Workers artifact under Wrangler/workerd. A deterministic local
Supabase protocol fixture supplies an encoded authenticated SSR session and
10,001 rows; this fixture proves production-client composition, the exact
workspace filter, the 51-row query cap, and cursor rendering without requiring
provider credentials. It does not replace the live-project RLS proof recorded
above.

The gate fetched two consecutive 50-row pages ten times from each runtime. The
first and second pages were byte-identical across Node and workerd, the second
page neither duplicated nor skipped its boundary row, and every Data API call
carried the expected workspace filter.

| Runtime                | Status | Cache-Control       | Page 1 HTML | Page 2 HTML | two-page p50 | two-page p95 |
| ---------------------- | -----: | ------------------- | ----------: | ----------: | -----------: | -----------: |
| Node standalone server |    200 | `private, no-cache` |    22,471 B |    22,461 B |    10.445 ms |    50.852 ms |
| Wrangler/workerd       |    200 | `private, no-cache` |    22,471 B |    22,461 B |    10.803 ms |    35.356 ms |

Both pages remained below the explicit 98,304-byte HTML budget. Runtime
qualification is local and deterministic; provider latency and database query
plans remain the separate live-project measurements above.

Reproduction gates:

- `deno task fullstack:workspace-qualification`
- `deno test --allow-env examples/supabase-cloudflare-starter/app/__tests__/workspace-records.test.ts`
- `deno task fullstack:migrations-check`

## Final provider matrix

GitHub Actions run
[`32618824103`](https://github.com/open-element/openelement/actions/runs/32618824103)
qualified commit `f85d9dcb`. The real-project job passed all 26 redacted Auth,
RLS, Storage, Realtime, role-change, revocation and cross-user checks with
successful throwaway-user cleanup. In parallel, a fresh 15-migration project
and an upgraded 13-plus-2-migration project produced byte-identical normalized
`public` and `storage` schema dumps (SHA-256
`d8855cb4df639ec951c57f76f4f61b7eb305a20b81a7eada06f39991990d16ee`).
