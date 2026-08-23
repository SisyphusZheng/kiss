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
