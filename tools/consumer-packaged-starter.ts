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

  config.nodeModulesDir = 'manual';
  await Deno.writeTextFile(configPath, formatJson(config));
  await Deno.symlink(join(tmp, 'node_modules'), join(starter, 'node_modules'), { type: 'dir' });

  const check = await run(Deno.execPath(), ['task', 'check'], starter);
  if (!check.success) throw new Error(`Packed starter typecheck failed:\n${check.output}`);
  console.log(`Packed starter typecheck passed for ${PACKAGE_VERSION}.`);
} finally {
  await Deno.remove(tmp, { recursive: true }).catch(() => undefined);
}
