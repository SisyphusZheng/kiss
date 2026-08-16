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
