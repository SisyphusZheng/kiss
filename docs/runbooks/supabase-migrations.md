# Supabase migration deployment and drift recovery

The reference project treats `supabase/migrations/` as the only schema source of truth. Do not make
production schema changes in the Dashboard SQL/Table editors: those changes bypass the migration
history and make source/provider drift invisible.

## Required GitHub Secrets

- `SUPABASE_ACCESS_TOKEN`: CLI access token used only by the migration workflow.
- `SUPABASE_DB_PASSWORD`: database password for the target project.
- `SUPABASE_PROJECT_ID`: exact project reference; kept out of reports to avoid unnecessary target
  disclosure.

These are deliberately separate from `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`. Runtime keys cannot execute or attest DDL migrations.

## Normal deployment

1. Add a new timestamped SQL file; never edit a migration already recorded in
   `migration-manifest.json`.
2. Update the manifest with the new file and SHA-256 digest.
3. Let `deno task fullstack:migrations-check` and PR AutoFlow validate ordering and immutability.
4. Run **Supabase project smoke (real project)** with `migration_mode=check` and inspect the dry run.
5. Run it again with `migration_mode=apply`. The workflow serializes production migrations, applies them in
   order, and requires the final dry run to report the remote database as current.
6. The same run immediately executes the Tier 2 browser qualification on that `main` SHA, so schema
   deployment and user-visible evidence cannot drift into separate trains.

## Existing-project bootstrap and drift

If `migration list` says the provider schema and `supabase_migrations.schema_migrations` disagree,
stop. Inspect the actual schema and each committed migration before repair. `supabase migration
repair` changes only migration history; it does not execute or revert SQL, so it must never run
automatically. Record the inspected migration ids and use a forward migration for any real schema
difference. Do not rewrite a published migration or use `--include-all` to force unknown history.

## Recovery ownership

- The release operator owns the migration run, evidence artifact, and forward-fix decision.
- Supabase owns platform availability; the application team owns schema correctness and tested
  restore procedures.
- Database backups do not include Storage objects. Restore/reconciliation of Storage is a separate
  operation and must be validated independently.
- A failed migration blocks provider qualification and release. An older green run never overrides
  a newer failure.

References: [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations),
[managing environments](https://supabase.com/docs/guides/deployment/managing-environments).
