#!/usr/bin/env -S deno run -A
/**
 * @openelement/create - Minimal project scaffold for openElement framework.
 *
 * Usage: deno run -A --minimum-dependency-age 0 npm:@openelement/create my-app
 *
 * openElement Architecture: Keep It Simple, Stupid.
 * One template, zero prompts, instant start.
 *
 * L9: every failure mode (invalid name, existing directory, permission or
 * write errors, unexpected defects) exits 1 with one actionable message —
 * never a runtime stack trace.
 */

import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { buildTemplates, resolveVersions, validateProjectName } from './template-builder.ts';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fail(message: string): never {
  console.error(`error: ${message}`);
  Deno.exit(1);
}

async function main(): Promise<void> {
  const name = Deno.args[0];
  if (!name || name === '--help' || name === '-h') {
    console.log(
      'Usage: deno run -A --minimum-dependency-age 0 npm:@openelement/create <project-name>',
    );
    Deno.exit(name ? 0 : 1);
  }

  // L11: npm-name + path-traversal validation before any filesystem work.
  const invalid = validateProjectName(name);
  if (invalid) fail(`Invalid project name "${name}". ${invalid}`);

  const cwd = Deno.cwd();
  const targetDir = resolve(cwd, name);
  const relativeTarget = relative(cwd, targetDir);

  // Defense in depth behind validateProjectName: even a name that passes the
  // character rules must resolve inside the current directory.
  if (
    !relativeTarget ||
    relativeTarget === '..' ||
    relativeTarget.startsWith(`..${sep}`) ||
    isAbsolute(relativeTarget)
  ) {
    fail(`Refusing to create project outside the current directory: ${name}`);
  }

  try {
    await Deno.stat(targetDir);
    fail(
      `Directory "${name}" already exists. Choose a different name or remove the existing directory.`,
    );
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw new Error(`Could not inspect target directory "${name}": ${errorMessage(error)}`);
    }
  }

  // Resolve package versions before generating templates
  const v = resolveVersions();

  try {
    await Deno.mkdir(targetDir, { recursive: true });
    const TPL = await buildTemplates(v);
    for (const [path, content] of Object.entries(TPL)) {
      const fullPath = join(targetDir, path);
      await Deno.mkdir(dirname(fullPath), { recursive: true });
      await Deno.writeTextFile(fullPath, content);
      console.info(`  created ${path}`);
    }
  } catch (error) {
    const detail = error instanceof Deno.errors.PermissionDenied
      ? `Permission denied. Check write permissions for ${targetDir}.`
      : errorMessage(error);
    throw new Error(
      `Failed to write project files in "${name}": ${detail} ` +
        'Remove the partially created directory before retrying.',
    );
  }

  console.info(`\nopenElement project created at ./${relativeTarget}/`);
  console.info(`\n  cd ${relativeTarget}`);
  console.info('  deno task dev');
  console.info('  See README.md for all tasks (check/build/start/preview)');
}

try {
  await main();
} catch (error) {
  fail(errorMessage(error));
}
