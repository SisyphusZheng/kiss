/**
 * Generates packages/adapter-vite/src/generated-export-files.ts from the
 * "exports" maps declared in each package deno.json.
 *
 * OPENELEMENT_EXPORT_FILES in ssg-package-resolver.ts used to be a
 * hand-maintained copy of those export maps, which drifted (e.g. content's
 * nav-data was renamed to write-json in its deno.json but never updated in
 * the resolver). This script makes deno.json the single source of truth.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run tools/generate-openelement-export-files.ts
 *     -> (re)write the generated file and format it.
 *   deno run --allow-read --allow-write --allow-run tools/generate-openelement-export-files.ts --check
 *     -> regenerate, format, and fail (exit 1) if the committed file is stale.
 */

interface PackageExports {
  [subpath: string]: string;
}

const REPO_ROOT = new URL('../', import.meta.url).pathname;
const TARGET = `${REPO_ROOT}packages/adapter-vite/src/generated-export-files.ts`;

// Packages that participate in the JSR SSG package resolver export map.
// `protocol` is intentionally excluded: it is a runtime-free shared contract
// resolved by a different path and is not part of the resolver lookup table.
const RESOLVER_PACKAGES = [
  'adapter-vite',
  'app',
  'content',
  'core',
  'create',
  'element',
  'router',
  'signal',
  'ssg',
  'ui',
];

function stripLeadingSlash(value: string): string {
  return value.replace(/^\.\//, '');
}

async function readPackageExports(pkg: string): Promise<PackageExports> {
  const path = `${REPO_ROOT}packages/${pkg}/deno.json`;
  const raw = JSON.parse(await Deno.readTextFile(path));
  const exportsField = raw.exports;

  const result: PackageExports = {};
  if (typeof exportsField === 'string') {
    result['.'] = stripLeadingSlash(exportsField);
    return result;
  }
  if (exportsField && typeof exportsField === 'object') {
    for (const [key, value] of Object.entries(exportsField)) {
      result[stripLeadingSlash(key)] = stripLeadingSlash(String(value));
    }
  }
  return result;
}

async function buildExportFiles(): Promise<Record<string, PackageExports>> {
  const map: Record<string, PackageExports> = {};
  for (const pkg of RESOLVER_PACKAGES) {
    map[pkg] = await readPackageExports(pkg);
  }
  return map;
}

function render(map: Record<string, PackageExports>): string {
  const packages = Object.keys(map).sort();
  const lines: string[] = [];
  lines.push('// GENERATED FILE — do not edit by hand.');
  lines.push('// Regenerate with: deno task export-files:generate');
  lines.push('// Source of truth: the "exports" field of each packages/*/deno.json.');
  lines.push(
    'export const OPENELEMENT_EXPORT_FILES: Record<string, Record<string, string>> = {',
  );
  for (const pkg of packages) {
    lines.push(`  ${JSON.stringify(pkg)}: {`);
    const subpaths = Object.keys(map[pkg]).sort();
    for (const sub of subpaths) {
      lines.push(`    ${JSON.stringify(sub)}: ${JSON.stringify(map[pkg][sub])},`);
    }
    lines.push('  },');
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

async function runFormatter(target: string): Promise<void> {
  const cmd = new Deno.Command('deno', { args: ['fmt', target] });
  const status = await cmd.output();
  if (!status.success) {
    throw new Error(`deno fmt failed on ${target}`);
  }
}

async function gitDiffIsEmpty(target: string): Promise<boolean> {
  const cmd = new Deno.Command('git', { args: ['diff', '--quiet', '--', target] });
  const status = await cmd.output();
  return status.code === 0;
}

async function main(args: string[]): Promise<void> {
  const checkOnly = args.includes('--check');
  const map = await buildExportFiles();
  const source = render(map);

  await Deno.writeTextFile(TARGET, source);
  await runFormatter(TARGET);

  if (checkOnly) {
    const clean = await gitDiffIsEmpty(TARGET);
    if (!clean) {
      const diff = new Deno.Command('git', {
        args: ['--no-pager', 'diff', '--', TARGET],
      });
      const out = await diff.output();
      console.error('export-files sync check failed: generated file is stale.');
      console.error(new TextDecoder().decode(out.stdout));
      Deno.exit(1);
    }
    console.log('export-files sync check passed (generated file matches deno.json exports).');
    return;
  }

  console.log(`Wrote ${TARGET}`);
}

if (import.meta.main) {
  await main(Deno.args);
}
