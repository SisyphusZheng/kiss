/**
 * #984 tier 1: PR-safe fullstack boundary gate for the Supabase × Cloudflare
 * reference starter (examples/supabase-cloudflare-starter). Runs on the BUILT
 * output, so it needs no Supabase/Cloudflare credentials and is safe on PRs;
 * the real-project evidence lives in tier-2 (supabase-project-smoke.yml) and
 * tier-3 (fullstack-deploy-smoke.yml).
 *
 * Three assertions:
 *
 * 1. Secret boundary — the browser-reachable build output (dist/index.html,
 *    dist/assets/**, dist/client/** when present; never dist/server/**)
 *    contains no service-role assignments, no `sb_secret_` key material, and no
 *    build-time JWT-shaped constants (`eyJ…`). Authenticated request HTML is a
 *    separate dynamic contract: the user's short-lived token appears once on
 *    the Realtime island, is `no-store`, and the island removes that attribute
 *    immediately after `setAuth` (#1130).
 * 2. Cache boundary — in the generated server entry (dist/server/entry.js),
 *    every request-time route registered in dist/server/index.js's route
 *    table emits the ADR-0121 `Cache-Control: no-store` baseline, and no
 *    handler ever emits a publicly cacheable Cache-Control value (the #943
 *    relaxation is `private, no-cache` — still not shared-cacheable). Static
 *    reading of the generated handler code is the honest, cheap option:
 *    booting the server would need real Supabase credentials for the loaders
 *    to answer.
 * 3. Env example — .env.example exists and carries placeholders only (no
 *    JWT-shaped tokens, no `sb_secret_` key material).
 *
 * dist/ is gitignored, so on a fresh checkout the gate builds the starter
 * itself (`deno task build` in the example directory).
 */

import { walk } from '@std/fs/walk';
import { join } from '@std/path';

import { exists } from './lib/fs.ts';

export interface BoundaryIssue {
  check:
    | 'secret-leak'
    | 'cache-boundary'
    | 'env-example'
    | 'deploy-bundle'
    | 'storage-policy';
  file: string;
  line?: number;
  message: string;
}

export interface TextFile {
  path: string;
  text: string;
}

const STARTER_DIR = 'examples/supabase-cloudflare-starter';

/**
 * Browser-output extensions worth scanning; binary assets (fonts, images)
 * are skipped — a token is ASCII text and cannot hide in a valid woff2/png
 * payload without also appearing in a text asset that references it.
 */
const SCANNABLE_EXTENSIONS = ['.html', '.js', '.mjs', '.css', '.json', '.map', '.svg', '.txt'];

const SECRET_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  // Value shapes, not names: the words `service_role` / `sb_secret_` appear
  // in supabase-js itself, so matching the bare term false-positives on the
  // library. A real secret has a long material tail.
  { name: 'Supabase secret key material', pattern: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: 'JWT-shaped token', pattern: /eyJ[A-Za-z0-9_-]{20,}/ },
  // A service-role env binding embedded as a bundle assignment (name + value
  // shape), e.g. SERVICE_ROLE_KEY: "…" — the identifier alone is fine in
  // library code; the assignment is not.
  { name: 'service-role assignment in bundle', pattern: /SERVICE_ROLE_KEY\s*[:=]\s*['"]\S+['"]/ },
];

/** Assertion 1: flag secret material in browser-reachable files. */
export function findSecretLeaks(files: TextFile[]): BoundaryIssue[] {
  const issues: BoundaryIssue[] = [];
  for (const file of files) {
    const lines = file.text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      for (const { name, pattern } of SECRET_PATTERNS) {
        if (pattern.test(lines[index])) {
          issues.push({
            check: 'secret-leak',
            file: file.path,
            line: index + 1,
            message: `${name} must never reach the browser bundle`,
          });
        }
      }
    }
  }
  return issues;
}

export interface RouteHandlerSlice {
  method: 'get' | 'post';
  path: string;
  line: number;
  body: string;
}

// The generated entry (dist/server/entry.js) dispatches through one unified
// `app.all('*', …)`: per-route handlers live in the generated `__pageHandlers`
// method table, keyed by a double-quoted path literal. The reserved identifier
// and assignment shape survive bundling; doc-comment mentions lack `= [`.
const ROUTE_REGISTRATION = /__pageHandlers\["((?:[^"\\]|\\.)*)"\]\.(GET|POST)\s*=\s*\[/g;

/** Slice the generated entry into per-route handler bodies. */
export function sliceRouteHandlers(entrySource: string): RouteHandlerSlice[] {
  const matches = [...entrySource.matchAll(ROUTE_REGISTRATION)];
  const handlers: RouteHandlerSlice[] = [];
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index];
    const start = match.index!;
    const end = index + 1 < matches.length ? matches[index + 1].index! : entrySource.length;
    handlers.push({
      method: match[2].toLowerCase() as 'get' | 'post',
      path: JSON.parse(`"${match[1]}"`) as string,
      line: entrySource.slice(0, start).split('\n').length,
      body: entrySource.slice(start, end),
    });
  }
  return handlers;
}

/** Request-time route paths out of the generated dist/server/index.js table. */
export function parseRequestTimeRoutePaths(indexSource: string): string[] {
  // A10.7 (#1215): the generated server module carries a derived admission
  // predicate only — `const requestTimePatterns = [new URLPattern({ pathname:
  // "/…" }), …]` — not a route table with params/precedence. Parse the
  // URLPattern pathname literals; JSON.parse decodes escapes faithfully.
  return [...indexSource.matchAll(/new URLPattern\(\{ pathname: ("(?:[^"\\]|\\.)*") \}\)/g)].map(
    (match) => JSON.parse(match[1]) as string,
  );
}

const CACHE_CONTROL_EMISSION = /header\("Cache-Control",\s*"([^"]+)"\)/g;

/**
 * Assertion 2: every request-time route handler must emit the no-store
 * baseline, and no emission may be publicly cacheable (`private, no-cache`
 * is the only permitted relaxation, #943).
 */
export function findCacheBoundaryIssues(
  entrySource: string,
  requestTimePaths: string[],
  file = 'dist/server/entry.js',
): BoundaryIssue[] {
  const issues: BoundaryIssue[] = [];
  const handlers = sliceRouteHandlers(entrySource);
  for (const path of requestTimePaths) {
    const slices = handlers.filter((handler) => handler.path === path);
    if (!slices.some((handler) => handler.method === 'get')) {
      issues.push({
        check: 'cache-boundary',
        file,
        message:
          `request-time route ${path} has no generated GET handler — the cache assertion would be vacuous`,
      });
      continue;
    }
    for (const handler of slices) {
      const emissions = [...handler.body.matchAll(CACHE_CONTROL_EMISSION)].map((match) => match[1]);
      if (!emissions.some((value) => value.includes('no-store'))) {
        issues.push({
          check: 'cache-boundary',
          file,
          line: handler.line,
          message:
            `${handler.method.toUpperCase()} ${path} never emits the ADR-0121 Cache-Control: no-store baseline`,
        });
      }
      for (const value of emissions) {
        if (!value.includes('no-store') && !value.includes('private')) {
          issues.push({
            check: 'cache-boundary',
            file,
            line: handler.line,
            message:
              `${handler.method.toUpperCase()} ${path} emits publicly cacheable Cache-Control: ${value}`,
          });
        }
      }
    }
  }
  return issues;
}

const ENV_PLACEHOLDER_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'JWT-shaped token', pattern: /eyJ[A-Za-z0-9_-]{20,}/ },
  { name: 'Supabase secret key material', pattern: /sb_secret_[A-Za-z0-9_-]{10,}/ },
];

/** Assertion 3: .env.example must carry placeholders, not real credentials. */
export function findEnvExampleLeaks(text: string, file = '.env.example'): BoundaryIssue[] {
  const issues: BoundaryIssue[] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    for (const { name, pattern } of ENV_PLACEHOLDER_PATTERNS) {
      if (pattern.test(lines[index])) {
        issues.push({
          check: 'env-example',
          file,
          line: index + 1,
          message: `${name} in .env.example — placeholders only`,
        });
      }
    }
  }
  return issues;
}

const REQUIRED_STORAGE_OPERATIONS = ['delete', 'insert', 'select'] as const;

/**
 * Assertion 4: the starter deliberately exposes create/read/delete only.
 * An UPDATE policy would turn a collision-safe immutable object key into an
 * overwrite surface and must be reviewed as a product/API change.
 *
 * The caller aggregates every migration file (the schema is the union of all
 * of them, #1059), so operations are deduplicated before comparing against
 * the required set: a policy restated in a later migration is fine, an
 * added UPDATE surface or a missing required operation is not.
 */
export function findStoragePolicyIssues(
  sql: string,
  file = 'supabase/migrations/*.sql',
): BoundaryIssue[] {
  const operations = [
    ...new Set(
      [...sql.matchAll(/on\s+storage\.objects\s+for\s+(select|insert|update|delete)/giu)]
        .map((match) => match[1].toLowerCase()),
    ),
  ].sort();
  if (JSON.stringify(operations) === JSON.stringify(REQUIRED_STORAGE_OPERATIONS)) return [];
  return [{
    check: 'storage-policy',
    file,
    message: `storage.objects policies must be exactly SELECT, INSERT, DELETE; found ${
      operations.join(', ') || 'none'
    }`,
  }];
}

async function ensureStarterBuild(): Promise<void> {
  if (await exists(join(STARTER_DIR, 'dist', 'server', 'entry.js'))) return;
  console.log(
    '[fullstack-boundary] starter dist/ is missing — running `deno task build` in ' + STARTER_DIR,
  );
  const command = new Deno.Command('deno', {
    args: ['task', 'build'],
    cwd: STARTER_DIR,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const { code } = await command.output();
  if (code !== 0) {
    console.error('[fullstack-boundary] reference starter build failed');
    Deno.exit(1);
  }
}

/** Browser-reachable build output: everything under dist/ except dist/server/. */
async function collectBrowserBundleFiles(distDir: string): Promise<TextFile[]> {
  const files: TextFile[] = [];
  for await (const entry of walk(distDir, { includeDirs: false })) {
    const relative = entry.path.slice(distDir.length + 1);
    if (relative === 'server' || relative.startsWith(`server/`)) continue;
    if (!SCANNABLE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) continue;
    files.push({ path: entry.path, text: await Deno.readTextFile(entry.path) });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function main(): Promise<void> {
  await ensureStarterBuild();
  const issues: BoundaryIssue[] = [];

  const distDir = join(STARTER_DIR, 'dist');
  issues.push(...findSecretLeaks(await collectBrowserBundleFiles(distDir)));

  const entryFile = join(distDir, 'server', 'entry.js');
  const indexFile = join(distDir, 'server', 'index.js');
  const requestTimePaths = parseRequestTimeRoutePaths(await Deno.readTextFile(indexFile));
  // The reference starter's credential-bearing paths: /notes is the
  // RLS-protected resource, /login the auth action/callback. If either is
  // missing from the route table the boundary assertions above are vacuous.
  for (const required of ['/notes', '/login']) {
    if (!requestTimePaths.includes(required)) {
      issues.push({
        check: 'cache-boundary',
        file: indexFile,
        message: `${required} must be a request-time route in the generated server output`,
      });
    }
  }
  issues.push(
    ...findCacheBoundaryIssues(await Deno.readTextFile(entryFile), requestTimePaths, entryFile),
  );

  const envExampleFile = join(STARTER_DIR, '.env.example');
  if (!(await exists(envExampleFile))) {
    issues.push({
      check: 'env-example',
      file: envExampleFile,
      message: '.env.example must exist with placeholder values',
    });
  } else {
    issues.push(...findEnvExampleLeaks(await Deno.readTextFile(envExampleFile), envExampleFile));
  }

  // Storage-policy invariant is schema-level: aggregate every migration
  // file, not just the one that first created the policies (#1059).
  const migrationsDir = join(STARTER_DIR, 'supabase', 'migrations');
  const migrationFiles: string[] = [];
  for await (const entry of Deno.readDir(migrationsDir)) {
    if (entry.isFile && entry.name.endsWith('.sql')) migrationFiles.push(entry.name);
  }
  migrationFiles.sort();
  const aggregatedMigrationSql = (
    await Promise.all(
      migrationFiles.map((name) => Deno.readTextFile(join(migrationsDir, name))),
    )
  ).join('\n');
  issues.push(...findStoragePolicyIssues(aggregatedMigrationSql));

  // Deployable-bundle boundary: when the Nitro workers output exists, its
  // public/ dir is what actually ships to the CDN. Scan it for secrets too,
  // and require the server implementation was stripped from it (the starter's
  // nitro:build chain removes .output-workers/public/server — the deploy
  // would otherwise serve dist/server/entry.js publicly).
  const workersPublicDir = join(STARTER_DIR, '.output-workers', 'public');
  if (await exists(workersPublicDir)) {
    issues.push(...findSecretLeaks(await collectBrowserBundleFiles(workersPublicDir)));
    if (await exists(join(workersPublicDir, 'server'))) {
      issues.push({
        check: 'deploy-bundle',
        file: join(workersPublicDir, 'server'),
        message:
          'server implementation must not be under the Nitro public assets dir (strip .output-workers/public/server before deploy)',
      });
    }
  }

  if (issues.length > 0) {
    console.error('Fullstack boundary check failed:');
    for (const issue of issues) {
      const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      console.error(`- [${issue.check}] ${location}: ${issue.message}`);
    }
    Deno.exit(1);
  }
  console.log('Fullstack boundary check passed.');
}

if (import.meta.main) await main();
