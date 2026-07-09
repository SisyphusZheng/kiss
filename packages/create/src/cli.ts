#!/usr/bin/env -S deno run -A
/**
 * @openelement/create - Minimal project scaffold for openElement framework.
 *
 * Usage: deno run -A npm:@openelement/create my-app
 *
 * openElement Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 */

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@openelement/core/logger';

// Package versions: resolved per ADR 0016 (local workspace vs remote npm registry).
// ADR 0016: Handle both local (workspace file://) and remote (npm registry) execution.
//
// - Local:  read version from workspace deno.json (single source of truth)
// - Remote: query npm Registry API for latest version (zero hardcoding)

const NPM_SCOPE = '@openelement';
const log = createLogger('create');
const PKG_DIR_MAP: Record<string, string> = {
  core: 'core',
  adapterVite: 'adapter-vite',
  app: 'app',
  content: 'content',
  ui: 'ui',
  signal: 'signal',
  element: 'element',
};

function loadWorkspaceVersion(pkg: string): string {
  const metaUrl = import.meta.url;
  const selfPath = fileURLToPath(new URL('.', metaUrl));
  const dir = PKG_DIR_MAP[pkg] || pkg;
  const wsPath = resolve(selfPath, '..', '..', 'packages', dir, 'deno.json');
  try {
    const version = JSON.parse(Deno.readTextFileSync(wsPath)).version;
    if (!version) throw new Error(`No version found in ${wsPath}`);
    return version;
  } catch (e) {
    throw new Error(
      `Failed to read version for @openelement/${dir} from ${wsPath}. ` +
        `Run this script from the openElement workspace or ensure deno.json is accessible.\n` +
        `Original error: ${e}`,
    );
  }
}

/** Detect whether cli.ts is being run from the openElement workspace. */
function isWorkspace(): boolean {
  try {
    const selfPath = fileURLToPath(new URL('.', import.meta.url));
    Deno.readTextFileSync(resolve(selfPath, '..', '..', 'packages', 'core', 'deno.json'));
    return true;
  } catch {
    return false;
  }
}

/** Fetch the latest version of an npm package from the Registry API. */
async function fetchNpmVersion(pkg: string): Promise<string> {
  const resp = await fetch(`https://registry.npmjs.org/${NPM_SCOPE}/${pkg}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch version for ${NPM_SCOPE}/${pkg} from npm registry (HTTP ${resp.status})`,
    );
  }
  const meta = await resp.json();
  // npm registry response has dist-tags.latest
  const version = meta?.['dist-tags']?.latest;
  if (!version) {
    throw new Error(
      `No version found for ${NPM_SCOPE}/${pkg} in npm registry response`,
    );
  }
  return version;
}

/** Resolve all package versions: local from workspace, remote from npm registry. */
async function resolveVersions(): Promise<Record<string, string>> {
  const keys = Object.keys(PKG_DIR_MAP);
  if (isWorkspace()) {
    // Local: synchronous read from workspace
    const v: Record<string, string> = {};
    for (const k of keys) v[k] = loadWorkspaceVersion(k);
    return v;
  }

  // Remote: fetch all versions from npm in parallel
  console.info('Resolving package versions from npm...');
  const entries = await Promise.all(
    keys.map(async (k) => [k, await fetchNpmVersion(PKG_DIR_MAP[k])]),
  );
  return Object.fromEntries(entries);
}

/** Build the template map with resolved version numbers. */
// [sourceTemplate, targetRelativePath] pairs. The starter manifest is stored
// as deno.json.tmpl so deno does not treat the templates/ directory as a
// nested workspace config; it is renamed to deno.json when written.
const TEMPLATE_FILES: [string, string][] = [
  ['.gitignore', '.gitignore'],
  ['public/openelement-mark.svg', 'public/openelement-mark.svg'],
  ['content/blog/welcome.md', 'content/blog/welcome.md'],
  ['deno.json.tmpl', 'deno.json'],
  ['vite.config.ts', 'vite.config.ts'],
  ['app/components/app-shell.tsx', 'app/components/app-shell.tsx'],
  ['app/routes/index.tsx', 'app/routes/index.tsx'],
  ['app/routes/freshness.tsx', 'app/routes/freshness.tsx'],
  ['app/routes/api/health.ts', 'app/routes/api/health.ts'],
  ['app/islands/my-counter.tsx', 'app/islands/my-counter.tsx'],
];

/** Map of `${v.X}` placeholder tokens to resolved version values. */
function versionTokens(v: Record<string, string>): Record<string, string> {
  return {
    '${v.app}': v.app,
    '${v.adapterVite}': v.adapterVite,
    '${v.core}': v.core,
    '${v.element}': v.element,
    '${v.ui}': v.ui,
  };
}

/** Build the template map with resolved version numbers. */
function buildTemplates(v: Record<string, string>): Record<string, string> {
  const templatesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
  const tokens = versionTokens(v);
  const out: Record<string, string> = {};
  for (const [source, target] of TEMPLATE_FILES) {
    let content = Deno.readTextFileSync(join(templatesDir, source));
    for (const [token, value] of Object.entries(tokens)) {
      if (content.includes(token)) content = content.split(token).join(value);
    }
    out[target] = content;
  }
  return out;
}

async function main() {
  const name = Deno.args[0];
  if (!name || name === '--help' || name === '-h') {
    console.log('Usage: deno run -A npm:@openelement/create <project-name>');
    Deno.exit(name ? 0 : 1);
  }

  // H-14 fix: Validate project name format to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    log.error(
      `Invalid project name: "${name}". Project name must only contain letters, numbers, underscores, and hyphens.`,
    );
    Deno.exit(1);
  }

  const cwd = Deno.cwd();
  const targetDir = resolve(cwd, name);
  const relativeTarget = relative(cwd, targetDir);

  if (
    !relativeTarget ||
    relativeTarget === '..' ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    log.error(
      `Refusing to create project outside the current directory: ${name}`,
    );
    Deno.exit(1);
  }

  try {
    await Deno.stat(targetDir);
    log.error(`Directory "${name}" already exists.`);
    Deno.exit(1);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      log.error(`Failed to inspect target directory "${name}": ${e}`);
      Deno.exit(1);
    }
  }

  // Resolve package versions before generating templates
  const v = await resolveVersions();

  try {
    await Deno.mkdir(targetDir, { recursive: true });
  } catch (e) {
    log.error(`Failed to create directory "${name}": ${e}`);
    Deno.exit(1);
  }

  const TPL = buildTemplates(v);
  for (const [path, content] of Object.entries(TPL)) {
    const fullPath = join(targetDir, path);
    await Deno.mkdir(dirname(fullPath), { recursive: true });
    await Deno.writeTextFile(fullPath, content);
    console.info(`  created ${path}`);
  }

  console.info(`\nopenElement project created at ./${relativeTarget}/`);
  console.info(`\n  cd ${relativeTarget}`);
  console.info('  deno task dev');
}

main();
