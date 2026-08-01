import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { formatJson } from './lib/format-json.ts';
import { PACKAGE_VERSION } from './project-constants.ts';
import { readJson } from './lib/fs.ts';

const repoRoot = resolve(import.meta.dirname, '..');
const packageNames = ['element', 'app', 'adapter-vite', 'ui', 'create'];

async function run(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ success: boolean; output: string }> {
  const result = await new Deno.Command(command, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    success: result.success,
    output: decoder.decode(result.stdout) + decoder.decode(result.stderr),
  };
}

const tmp = await Deno.makeTempDir({ prefix: 'openelement-packaged-starter-' });
try {
  const tarballs = packageNames.map((name) =>
    join(repoRoot, 'packages', name, `openelement-${name}-${PACKAGE_VERSION}.tgz`)
  );
  for (const tarball of tarballs) {
    if (!existsSync(tarball)) {
      throw new Error(`Missing packed release artifact: ${tarball}`);
    }
  }

  const install = await run(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs],
    tmp,
  );
  if (!install.success) throw new Error(`Packed package installation failed:\n${install.output}`);

  const createCli = join(tmp, 'node_modules', '@openelement', 'create', 'src', 'cli.js');
  const create = await run(Deno.execPath(), ['run', '-A', createCli, 'starter'], tmp);
  if (!create.success) throw new Error(`Packed starter generation failed:\n${create.output}`);

  const starter = join(tmp, 'starter');
  const configPath = join(starter, 'deno.json');
  const config = await readJson(configPath) as {
    imports: Record<string, string>;
    nodeModulesDir?: string;
  };
  const expectedImports: Record<string, string> = {
    '@openelement/app': `npm:@openelement/app@${PACKAGE_VERSION}`,
    '@openelement/adapter-vite': `npm:@openelement/adapter-vite@${PACKAGE_VERSION}`,
    '@openelement/element': `npm:@openelement/element@${PACKAGE_VERSION}`,
    '@openelement/element/jsx-runtime': `npm:@openelement/element@${PACKAGE_VERSION}/jsx-runtime`,
    '@openelement/element/jsx-dev-runtime':
      `npm:@openelement/element@${PACKAGE_VERSION}/jsx-dev-runtime`,
  };
  for (const [key, expected] of Object.entries(expectedImports)) {
    if (config.imports[key] !== expected) {
      throw new Error(`Packed starter import ${key}=${config.imports[key]}, expected=${expected}`);
    }
  }

  // The starter's external npm:/jsr: deps (vite, @deno/vite-plugin, hono and
  // its @jsr/* sub-dependencies) are NOT inside the local @openelement/*
  // tarballs, and plain `npm install` cannot fetch them because @jsr/* packages
  // are absent from the npm registry. Reuse the fully-resolved dependency tree
  // already present in the repo's node_modules (populated by setup-deno-workspace
  // and consistent with consumer-local.ts), linking any top-level entry that the
  // freshly-installed tarballs did not already provide. Symlinks keep the nested
  // .deno structure intact so @deno/vite-plugin can resolve @deno/loader.
  const repoNodeModules = join(repoRoot, 'node_modules');
  if (existsSync(repoNodeModules)) {
    for (const entry of Deno.readDirSync(repoNodeModules)) {
      const dest = join(tmp, 'node_modules', entry.name);
      if (existsSync(dest)) continue; // local tarballs win
      const src = join(repoNodeModules, entry.name);
      await Deno.symlink(src, dest, { type: entry.isDirectory ? 'dir' : 'file' })
        .catch(() => undefined);
    }
  }

  config.nodeModulesDir = 'manual';
  await Deno.writeTextFile(configPath, formatJson(config));
  await Deno.symlink(join(tmp, 'node_modules'), join(starter, 'node_modules'), { type: 'dir' });

  const check = await run(Deno.execPath(), ['task', 'check'], starter);
  if (!check.success) throw new Error(`Packed starter typecheck failed:\n${check.output}`);
  console.log(`Packed starter typecheck passed for ${PACKAGE_VERSION}.`);

  // Full-stack main path: packed adapter must run the real SSG build.
  const build = await run(Deno.execPath(), ['task', 'build'], starter);
  if (!build.success) throw new Error(`Packed starter SSG build failed:\n${build.output}`);
  console.log(`Packed starter SSG build passed for ${PACKAGE_VERSION}.`);
} finally {
  await Deno.remove(tmp, { recursive: true }).catch(() => undefined);
}
