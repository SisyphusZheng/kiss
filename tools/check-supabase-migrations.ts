const ROOT = new URL('../examples/supabase-cloudflare-starter/supabase/', import.meta.url);
const WORKFLOW = new URL('../.github/workflows/supabase-project-smoke.yml', import.meta.url);

interface Entry {
  file: string;
  sha256: string;
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function checkSupabaseMigrations(
  root = ROOT,
  workflowUrl = WORKFLOW,
  enforcePerformanceFloor = root.href === ROOT.href,
): Promise<number> {
  const migrations = new URL('migrations/', root);
  const names: string[] = [];
  for await (const entry of Deno.readDir(migrations)) {
    if (entry.isFile && entry.name.endsWith('.sql')) names.push(entry.name);
  }
  names.sort();
  if (names.length === 0) throw new Error('no migration files found');

  let previous = '';
  for (const name of names) {
    const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(name);
    if (!match) throw new Error(`${name} must use a 14-digit UTC timestamp and snake_case name`);
    if (match[1] <= previous) throw new Error(`${name} is not strictly ordered after ${previous}`);
    previous = match[1];
  }

  const parsed = JSON.parse(await Deno.readTextFile(new URL('migration-manifest.json', root))) as {
    version?: number;
    migrations?: Entry[];
  };
  if (parsed.version !== 1 || !Array.isArray(parsed.migrations)) {
    throw new Error('migration-manifest.json must use version 1 with a migrations array');
  }
  if (JSON.stringify(parsed.migrations.map((entry) => entry.file)) !== JSON.stringify(names)) {
    throw new Error('manifest file list/order does not match migrations/');
  }
  for (const entry of parsed.migrations) {
    const actual = await sha256(await Deno.readTextFile(new URL(`migrations/${entry.file}`, root)));
    if (entry.sha256 !== actual) {
      throw new Error(
        `${entry.file} changed after being recorded; add a forward migration instead`,
      );
    }
  }

  if (enforcePerformanceFloor) {
    const performanceFloorName = names.find((name) =>
      name.endsWith('_postgres_index_rls_performance_floor.sql')
    );
    if (!performanceFloorName) {
      throw new Error('missing forward-only Postgres index/RLS performance migration');
    }
    const performanceFloor = await Deno.readTextFile(
      new URL(`migrations/${performanceFloorName}`, root),
    );
    for (
      const anchor of [
        'notes_owner_created_id_idx',
        'admin_audit_actor_created_id_idx',
        'attachment_reservations_owner_state_created_id_idx',
        'attachment_scan_dead_letters_owner_failed_id_idx',
        'attachment_scan_dead_letters_replay_actor_idx',
        'storage_audit_owner_created_id_idx',
        'orders_owner_created_id_idx',
        'orders_product_code_idx',
        'stripe_events_order_created_id_idx',
        'stripe_events_replay_actor_idx',
        'stripe_events_processing_queue_idx',
        'create policy "notes: owners or admins read rows"',
        'using ((select auth.uid()) = user_id)',
        'with check ((select auth.uid()) = user_id)',
      ]
    ) {
      if (!performanceFloor.includes(anchor)) {
        throw new Error(`${performanceFloorName} is missing ${anchor}`);
      }
    }
    if (/\bauth\.(?:uid|jwt)\(\)(?!\s*\))/i.test(performanceFloor)) {
      throw new Error(`${performanceFloorName} must wrap policy auth helpers in scalar subselects`);
    }

    const replayAtomicityName = names.find((name) => name.endsWith('_replay_audit_atomicity.sql'));
    if (!replayAtomicityName) throw new Error('missing atomic replay audit migration');
    const replayAtomicity = await Deno.readTextFile(
      new URL(`migrations/${replayAtomicityName}`, root),
    );
    for (
      const anchor of [
        'create or replace function public.mark_attachment_scan_replayed',
        'create or replace function public.mark_payment_event_replay_enqueued',
        'insert into public.admin_audit',
        'attachment_scan_replay_enqueued',
        'payment_event_replay_enqueued',
      ]
    ) {
      if (!replayAtomicity.includes(anchor)) {
        throw new Error(`${replayAtomicityName} is missing ${anchor}`);
      }
    }

    const reconciliationIndexName = names.find((name) =>
      name.endsWith('_stripe_reconciliation_index.sql')
    );
    if (!reconciliationIndexName) throw new Error('missing Stripe reconciliation index fix');
    const reconciliationIndex = await Deno.readTextFile(
      new URL(`migrations/${reconciliationIndexName}`, root),
    );
    for (
      const anchor of [
        'drop index if exists public.stripe_events_processing_queue_idx',
        'create index stripe_events_processing_queue_idx',
        "where processing_state in ('received', 'replay_requested')",
      ]
    ) {
      if (!reconciliationIndex.includes(anchor)) {
        throw new Error(`${reconciliationIndexName} is missing ${anchor}`);
      }
    }

    const workspaceName = names.find((name) => name.endsWith('_workspace_rls_qualification.sql'));
    if (!workspaceName) throw new Error('missing workspace RLS qualification migration');
    const workspace = await Deno.readTextFile(new URL(`migrations/${workspaceName}`, root));
    for (
      const anchor of [
        'alter table public.workspaces enable row level security',
        'alter table public.workspace_members enable row level security',
        'alter table public.workspace_records enable row level security',
        'workspace_members_user_workspace_idx',
        'workspace_records_workspace_created_id_idx',
        'workspace_records_workspace_status_created_id_idx',
        'workspace_records_workspace_title_prefix_idx',
        'create policy "workspace records: members read"',
        'create policy "workspace records: members create"',
        'create policy "workspace records: creators or admins update"',
        'with check (',
        'revoke all on public.workspaces, public.workspace_members, public.workspace_records from anon',
      ]
    ) {
      if (!workspace.includes(anchor)) throw new Error(`${workspaceName} is missing ${anchor}`);
    }

    const privilegeName = names.find((name) => name.endsWith('_explicit_data_api_privileges.sql'));
    if (!privilegeName) throw new Error('missing explicit Data API privilege migration');
    const privileges = await Deno.readTextFile(new URL(`migrations/${privilegeName}`, root));
    for (
      const anchor of [
        'from anon, authenticated, service_role',
        'grant select, insert, update, delete on table public.notes to authenticated',
        'grant select on table public.orders to authenticated',
        'grant select on table public.attachment_reservations to authenticated',
        'grant select, insert, update, delete on table public.workspace_records to authenticated',
        'grant select, insert on table public.notes to service_role',
        'grant select, delete on table public.attachment_reservations to service_role',
        'grant select on table public.attachment_scan_dead_letters to service_role',
        'from information_schema.table_privileges',
        'pg_catalog.has_sequence_privilege',
        'pg_catalog.has_function_privilege',
        "raise exception 'unexpected public table privilege matrix'",
      ]
    ) {
      if (!privileges.includes(anchor)) throw new Error(`${privilegeName} is missing ${anchor}`);
    }
    if (/^\s*grant\s+all\b/imu.test(privileges)) {
      throw new Error(`${privilegeName} must not use GRANT ALL`);
    }

    const requestAuditName = names.find((name) =>
      name.endsWith('_replay_request_audit_atomicity.sql')
    );
    if (!requestAuditName) throw new Error('missing replay request audit atomicity migration');
    const requestAudit = await Deno.readTextFile(new URL(`migrations/${requestAuditName}`, root));
    for (
      const anchor of [
        'create or replace function public.request_payment_event_replay',
        'create or replace function public.request_attachment_scan_replay',
        "'payment_event_replay_requested'",
        "'attachment_scan_replay_requested'",
        'insert into public.admin_audit',
        'audit_actor uuid := (select auth.uid())',
      ]
    ) {
      if (!requestAudit.includes(anchor)) {
        throw new Error(`${requestAuditName} is missing ${anchor}`);
      }
    }

    const deleteRecoveryName = names.find((name) =>
      name.endsWith('_attachment_delete_reconciliation.sql')
    );
    if (!deleteRecoveryName) throw new Error('missing attachment delete reconciliation migration');
    const deleteRecovery = await Deno.readTextFile(
      new URL(`migrations/${deleteRecoveryName}`, root),
    );
    for (
      const anchor of [
        "'deleting'",
        'request_attachment_delete',
        'complete_attachment_delete',
        'list_pending_attachment_deletions',
        'complete_pending_attachment_delete',
        'attachment_reservations_deleting_idx',
      ]
    ) {
      if (!deleteRecovery.includes(anchor)) {
        throw new Error(`${deleteRecoveryName} is missing ${anchor}`);
      }
    }

    const notesBoundsName = names.find((name) => name.endsWith('_notes_bounds.sql'));
    if (!notesBoundsName) throw new Error('missing Notes database bounds migration');
    const notesBounds = await Deno.readTextFile(new URL(`migrations/${notesBoundsName}`, root));
    for (const anchor of ['notes_title_length_check', 'notes_body_length_check', '<= 10000']) {
      if (!notesBounds.includes(anchor)) throw new Error(`${notesBoundsName} is missing ${anchor}`);
    }
  }

  const config = await Deno.readTextFile(new URL('config.toml', root));
  for (
    const anchor of [
      'project_id = "openelement-supabase-cloudflare-starter"',
      '[db.migrations]',
      'enabled = true',
      '[db.seed]',
      'enabled = false',
    ]
  ) {
    if (!config.includes(anchor)) throw new Error(`config.toml is missing ${anchor}`);
  }

  const workflow = await Deno.readTextFile(workflowUrl);
  for (
    const anchor of [
      'supabase/setup-cli@ab058987d8d6c725971f6cf9d0b5c98467e30bd1',
      'version: 2.114.0',
      'SUPABASE_ACCESS_TOKEN:',
      'SUPABASE_DB_PASSWORD:',
      'SUPABASE_PROJECT_ID:',
      'migration_mode:',
      'supabase db push --linked --dry-run',
      'tools/qualify-supabase-schema-parity.sh',
      'fresh and upgraded projects converge',
    ]
  ) {
    if (!workflow.includes(anchor)) throw new Error(`migration workflow is missing ${anchor}`);
  }
  return names.length;
}

if (import.meta.main) {
  try {
    const count = await checkSupabaseMigrations();
    console.log(`Supabase migration check passed (${count} immutable, ordered migrations).`);
  } catch (error) {
    console.error(`Supabase migration check failed: ${(error as Error).message}`);
    Deno.exit(1);
  }
}
