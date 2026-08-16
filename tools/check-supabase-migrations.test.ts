import { assertEquals, assertRejects } from '@std/assert';
import { checkSupabaseMigrations } from './check-supabase-migrations.ts';

const WORKFLOW = `
supabase/setup-cli@ab058987d8d6c725971f6cf9d0b5c98467e30bd1
version: 2.114.0
SUPABASE_ACCESS_TOKEN:
SUPABASE_DB_PASSWORD:
SUPABASE_PROJECT_ID:
migration_mode:
supabase db push --linked --dry-run
`;
const CONFIG = `
project_id = "openelement-supabase-cloudflare-starter"
[db.migrations]
enabled = true
[db.seed]
enabled = false
`;

async function digest(text: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
  );
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fixture(name = '20260817000000_clean.sql', sql = 'select 1;') {
  const directory = await Deno.makeTempDir();
  const root = new URL(`file://${directory}/`);
  await Deno.mkdir(new URL('migrations/', root));
  await Deno.writeTextFile(new URL(`migrations/${name}`, root), sql);
  await Deno.writeTextFile(new URL('config.toml', root), CONFIG);
  await Deno.writeTextFile(
    new URL('migration-manifest.json', root),
    JSON.stringify({ version: 1, migrations: [{ file: name, sha256: await digest(sql) }] }),
  );
  const workflow = new URL('workflow.yml', root);
  await Deno.writeTextFile(workflow, WORKFLOW);
  return { root, workflow };
}

Deno.test('Supabase migrations accept an ordered immutable manifest', async () => {
  const { root, workflow } = await fixture();
  assertEquals(await checkSupabaseMigrations(root, workflow), 1);
});

Deno.test('Supabase migrations reject edits to a recorded migration', async () => {
  const { root, workflow } = await fixture();
  await Deno.writeTextFile(new URL('migrations/20260817000000_clean.sql', root), 'select 2;');
  await assertRejects(
    () => checkSupabaseMigrations(root, workflow),
    Error,
    'changed after being recorded',
  );
});

Deno.test('Supabase migrations reject noncanonical filenames', async () => {
  const { root, workflow } = await fixture('migration.sql');
  await assertRejects(
    () => checkSupabaseMigrations(root, workflow),
    Error,
    '14-digit UTC timestamp',
  );
});
