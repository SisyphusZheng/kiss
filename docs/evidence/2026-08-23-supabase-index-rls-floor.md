# Supabase index and RLS performance floor

This artifact records the bounded, provider-backed verification for #1113. It is
qualification evidence for the reference starter, not a general performance
claim.

## Environment

- Date: 2026-08-23
- Supabase project: `openelement` (`ap-northeast-1`, Postgres 17.6)
- Supabase CLI used to create the forward migration: 2.115.0
- Dataset: 10,000 transaction-local `notes` rows owned by the project's existing
  test account; user identifiers are intentionally omitted
- Cleanup: both probes used `BEGIN`/`ROLLBACK`; a post-probe count confirmed zero
  `__v0431_%` rows

## Migration and advisor delta

The live project was first verified to contain the same 13 immutable migrations
as the repository. `postgres_index_rls_performance_floor` was then applied as a
new migration. Catalog inspection confirmed all 12 declared indexes and four
replacement notes policies, including both `USING` and `WITH CHECK` on UPDATE.

Before the migration, Supabase Performance Advisors reported ten
`unindexed_foreign_keys` findings and four `auth_rls_initplan` findings on the
notes policies. After the migration, neither finding class remained. The only
notices for the new indexes were expected `unused_index` INFO entries before a
production workload had exercised them. No relevant RLS or missing-FK-index
warning remained.

## Representative plans

Both probes used `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` after `ANALYZE` inside
the rollback-only transaction.

| Operation | Rows | Intended plan | Execution | Buffers |
| --- | ---: | --- | ---: | --- |
| Owner list, newest 50 | 10,000 seeded / 50 returned | `Index Scan` on `notes_owner_created_id_idx` | 0.094 ms | 5 shared hits, 0 reads |
| Owner delete, oldest 1,000 | 10,000 seeded / 1,000 matched | `Index Scan` on `notes_owner_created_id_idx` | 7.861 ms | 1,027 shared hits, 0 reads |

The list plan used `user_id` as its index condition and satisfied
`created_at DESC, id DESC` directly. The delete plan used both `user_id` and the
`created_at` range as index conditions. Neither representative notes scan fell
back to a sequential scan.

## Reproduction and regression gates

- `deno run -A tools/check-supabase-migrations.ts` verifies ordered immutable
  hashes plus the required index and policy anchors.
- `deno test -A tools/check-supabase-migrations.test.ts` verifies manifest
  acceptance and mutation/filename failures.
- The existing browser/full-stack negative probes continue to own cross-user RLS
  verification; the milestone acceptance matrix records their final run.

## Final fresh/upgraded and cross-user matrix

GitHub Actions run
[`32618824103`](https://github.com/open-element/openelement/actions/runs/32618824103)
qualified commit `f85d9dcb` on 2026-08-23. Its credential-free project job built
the schema once from all 15 migrations and once by applying the two v0.43.1
forward migrations to the 13-migration baseline. The normalized `public` and
`storage` dumps were byte-identical at SHA-256
`d8855cb4df639ec951c57f76f4f61b7eb305a20b81a7eada06f39991990d16ee`.

The parallel real-project job passed all 26 redacted Auth, RLS, Storage,
Realtime, role-change, revocation and cross-user checks, then successfully
removed both throwaway users. Its migration-manifest SHA-256 was
`9527bb864d09cb8ec27b86836d3a65245dc133fe13bd70328c4cce205c896e56`.

Supabase advisor remediation reference:
[Database linter](https://supabase.com/docs/guides/database/database-linter).
