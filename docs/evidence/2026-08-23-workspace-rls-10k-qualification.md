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

The same production build was exercised 30 times per runtime at the bounded
`/workspace-records` SSR route. This local run tests runtime equivalence and
render bounds; database latency is reported separately above.

| Runtime | Status | Cache-Control | HTML | p50 | p95 | Runtime RSS |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| Node standalone server | 200 | `private, no-cache` | 1,337 B | 2.113 ms | 3.232 ms | 67,504 KiB |
| Wrangler/workerd | 200 | `private, no-cache` | 1,337 B | 5.070 ms | 12.822 ms | 52,064 KiB main workerd process |

Both returned the same content type and byte-identical HTML after the Workers
mount was routed through the generated request-time server module. The explicit
HTML budget is 98,304 bytes, leaving headroom while preventing an unbounded SSR
table render. Wrangler also ran a separate inspector workerd process (79,760
KiB); it is tooling overhead and is recorded here rather than attributed to the
application isolate.

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
