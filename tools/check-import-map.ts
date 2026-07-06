/**
 * Direct Import Map Checker — verifies that every bare import in a generated
 * openElement project is declared in the project's deno.json imports map.
 *
 * Usage: deno run --allow-read --allow-write --allow-run --allow-env tools/check-import-map.ts
 *
 * Steps:
 *   1. Run @openelement/create (local workspace) to generate a test project
 *   2. Parse all .ts files and vite.config.ts for bare imports
 *   3. Check each bare import exists in the generated deno.json imports
 *   4. Fail with non-zero exit code if any undeclared imports are found
 */

import { join, relative } from 'node:path';
import { walk } from './lib/fs.ts';

const repoRoot = new URL('../', import.meta.url);
const repoRootPath = fileURLToPath(repoRoot);

function fileURLToPath(url: URL): string {
  // Deno on Windows returns file:///C:/... — strip the leading slash
  const p = url.pathname;
  if (p.startsWith('/') && p.length > 2 && p.charAt(2) === ':') {
    return p.slice(1);
  }
  return p;
}

// ---------------------------------------------------------------------------
// 1. Generate a test project using local workspace create package
// ---------------------------------------------------------------------------

const tmpDir = Deno.makeTempDirSync({ prefix: 'openElement-import-check-' });
const projectName = 'import-check-app';

console.log(`Generating test project in ${tmpDir}...`);

const createResult = await new Deno.Command(Deno.execPath(), {
  args: ['run', '-A', join(repoRootPath, 'packages', 'create', 'cli.ts'), projectName],
  cwd: tmpDir,
  stdout: 'piped',
  stderr: 'piped',
}).output();

if (createResult.code !== 0) {
  console.error('Failed to generate test project:');
  console.error(new TextDecoder().decode(createResult.stderr));
  Deno.exit(1);
}

const projectDir = join(tmpDir, projectName);
console.log(`Project generated at ${projectDir}`);

// ---------------------------------------------------------------------------
// 2. Read the generated deno.json imports map
// ---------------------------------------------------------------------------

const denoJsonPath = join(projectDir, 'deno.json');
const denoJsonText = await Deno.readTextFile(denoJsonPath);
const denoJson = JSON.parse(denoJsonText) as {
  imports?: Record<string, string>;
};

const declaredImports = new Set(Object.keys(denoJson.imports ?? {}));
console.log(`Declared imports in deno.json: ${Array.from(declaredImports).join(', ')}`);

// ---------------------------------------------------------------------------
// 3. Walk all .ts files and find bare imports
// ---------------------------------------------------------------------------

// Bare import regex — matches `from 'xxx'`, `from "xxx"`, `import('xxx')`
// A "bare import" starts with a letter, @, or # (not ., /, or protocol)
const bareImportRegex =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([@a-zA-Z][^'"]+)['"]|import\s*\(\s*['"]([@a-zA-Z][^'"]+)['"]\s*\)/g;

interface UndeclaredImport {
  file: string;
  specifier: string;
}

const errors: UndeclaredImport[] = [];

function isSourceOrConfig(relativePath: string): boolean {
  return relativePath.endsWith('.ts') || relativePath.endsWith('.js') ||
    relativePath === 'vite.config.ts';
}

/**
 * Check if a specifier is covered by a declared import.
 * Handles both exact matches and trailing-slash prefix matches:
 *   - `@openelement/core` is covered by `@openelement/core`
 *   - `@openelement/core/logger` is covered by `@openelement/core/` (trailing-slash entry)
 *   - `@openelement/core/logger` is NOT covered by `@openelement/core` (exact entry)
 */
function isImportDeclared(specifier: string, declared: Set<string>): boolean {
  if (declared.has(specifier)) return true;
  // Check trailing-slash prefix: `@openelement/core/logger` → `@openelement/core/`
  const slashIdx = specifier.lastIndexOf('/');
  if (slashIdx > 0) {
    const prefix = specifier.substring(0, slashIdx + 1);
    if (declared.has(prefix)) return true;
  }
  return false;
}

for await (const filePath of walk(projectDir, { skip: ['node_modules', 'dist', '.git'] })) {
  const relativePath = relative(projectDir, filePath).replace(/\\/g, '/');
  if (!isSourceOrConfig(relativePath)) continue;

  const text = await Deno.readTextFile(filePath);
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and strings
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith("'") ||
      trimmed.startsWith('"') ||
      trimmed.startsWith('`')
    ) {
      continue;
    }
    // Only process lines with import/export
    if (
      !trimmed.startsWith('import ') &&
      !trimmed.startsWith('export ') &&
      !/\bimport\s*\(\s*['"][@a-zA-Z]/.test(trimmed)
    ) {
      continue;
    }

    for (const match of line.matchAll(bareImportRegex)) {
      const specifier = match[1] ?? match[2];
      if (!specifier) continue;

      // Normalize: strip subpath after the package scope if it's a deep import
      // But keep the full specifier for the declared check — we need exact or prefix match
      if (!isImportDeclared(specifier, declaredImports)) {
        errors.push({
          file: relativePath,
          specifier,
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Report results
// ---------------------------------------------------------------------------

// Clean up temp directory
try {
  await Deno.remove(tmpDir, { recursive: true });
} catch {
  // Best effort cleanup
}

if (errors.length > 0) {
  console.error('\nUndeclared imports found in generated project:');
  for (const err of errors) {
    console.error(`  ${err.file}: "${err.specifier}" not in deno.json imports`);
  }
  console.error(
    `\nTotal: ${errors.length} undeclared import(s). Add them to the deno.json template in packages/create/cli.ts.`,
  );
  Deno.exit(1);
}

console.log('\nImport map check passed — all bare imports are declared in deno.json.');
