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
import { CREATE_VERSION } from './version.ts';
type ProductVersions = {
  app: string;
  adapterVite: string;
  element: string;
};

function resolveVersions(): ProductVersions {
  return {
    app: CREATE_VERSION,
    adapterVite: CREATE_VERSION,
    element: CREATE_VERSION,
  };
}

/** Build the template map with resolved version numbers. */
// [sourceTemplate, targetRelativePath] pairs. The starter manifest is stored
// as deno.json.tmpl so deno does not treat the templates/ directory as a
// nested workspace config; it is renamed to deno.json when written.
const TEMPLATE_FILES: [string, string][] = [
  // npm tarballs omit dotfiles even when a directory is included. Keep the
  // template non-hidden and write the expected dotfile into generated apps.
  ['gitignore.tmpl', '.gitignore'],
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
function versionTokens(v: ProductVersions): Record<string, string> {
  return {
    '${v.app}': v.app,
    '${v.adapterVite}': v.adapterVite,
    '${v.element}': v.element,
  };
}

/** Build the template map with resolved version numbers. */
function buildTemplates(v: ProductVersions): Record<string, string> {
  const templatesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
  const tokens = versionTokens(v);
  const out: Record<string, string> = {};
  for (const [source, target] of TEMPLATE_FILES) {
    let content = Deno.readTextFileSync(join(templatesDir, source));
    for (const [token, value] of Object.entries(tokens)) {
      if (content.includes(token)) content = content.split(token).join(value);
    }
    if (content.includes('${v.')) {
      throw new Error(`Unresolved package-version token in starter template: ${source}`);
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
