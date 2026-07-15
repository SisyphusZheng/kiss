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
import { buildTemplates, resolveVersions } from './template-builder.ts';

async function main() {
  const name = Deno.args[0];
  if (!name || name === '--help' || name === '-h') {
    console.log('Usage: deno run -A npm:@openelement/create <project-name>');
    Deno.exit(name ? 0 : 1);
  }

  // H-14 fix: Validate project name format to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    console.error(
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
    console.error(
      `Refusing to create project outside the current directory: ${name}`,
    );
    Deno.exit(1);
  }

  try {
    await Deno.stat(targetDir);
    console.error(`Directory "${name}" already exists.`);
    Deno.exit(1);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      console.error(`Failed to inspect target directory "${name}": ${e}`);
      Deno.exit(1);
    }
  }

  // Resolve package versions before generating templates
  const v = resolveVersions();

  try {
    await Deno.mkdir(targetDir, { recursive: true });
  } catch (e) {
    console.error(`Failed to create directory "${name}": ${e}`);
    Deno.exit(1);
  }

  const TPL = await buildTemplates(v);
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
