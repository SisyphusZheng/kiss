/**
 * Build npm tarballs with `deno pack` and optionally publish them to npm.
 *
 * Runs in dependency order (leaves first) so a package is packed/published
 * only after its workspace dependencies are already available as npm tarballs.
 */

import {
  extractOpenImports,
  type PackageInfo,
  readPackages,
  releasePublishOrder,
} from './lib/package-graph.ts';

const COMMANDS = new Set(['pack', 'pack:dry-run', 'publish:npm', 'publish:npm:dry-run']);

const REPOSITORY = {
  type: 'git',
  url: 'git+https://github.com/open-element/openelement.git',
};

const KEYWORDS = ['openelement', 'web-components', 'ssg', 'framework', 'deno'];

const CREATE_BIN = {
  'openelement-create': './cli.js',
  'create-openelement': './cli.js',
};

function npmTarballName(pkg: PackageInfo): string {
  return `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
}

function tarballPath(pkg: PackageInfo): string {
  return `${pkg.dir}/${npmTarballName(pkg)}`;
}

async function runCommand(
  command: string,
  args: string[],
  cwd?: string,
  env?: Record<string, string>,
): Promise<void> {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  # cwd=${cwd}` : ''}`);
  const proc = new Deno.Command(command, {
    args,
    cwd,
    env,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await proc.spawn().status;
  if (!status.success) {
    throw new Error(`Command failed with exit code ${status.code}: ${command} ${args.join(' ')}`);
  }
}

async function assertCleanWorktree(): Promise<void> {
  const command = new Deno.Command('git', {
    args: ['status', '--porcelain'],
    stdout: 'piped',
    stderr: 'inherit',
  });
  const output = await command.output();
  if (!output.success) {
    throw new Error(`git status failed with exit code ${output.code}`);
  }
  const status = new TextDecoder().decode(output.stdout).trim();
  if (status) {
    console.error(status);
    throw new Error('Refusing to publish from a dirty worktree.');
  }
}

function deriveDependencies(pkg: PackageInfo, allPackages: PackageInfo[]): Record<string, string> {
  const deps: Record<string, string> = {};
  const denoJson = JSON.parse(Deno.readTextFileSync(`${pkg.dir}/deno.json`));
  const imports = denoJson.imports ?? {};

  // External npm dependencies from deno.json imports.
  for (const value of Object.values(imports)) {
    if (typeof value !== 'string') continue;
    const match = value.match(/^npm:(@[^/]+\/[^@/]+|[^@/]+)(?:@(\^?[\d.]+(?:-[\w.]+)?))?/);
    if (!match) continue;
    const name = match[1];
    if (name.startsWith('@openelement/')) continue;
    const version = match[2]?.replace(/^\^/, '') ?? '0.0.0';
    deps[name] = `^${version}`;
  }

  // Internal workspace dependencies from source imports.
  const byName = new Map(allPackages.map((p) => [p.name, p]));
  function scanDir(dir: string): void {
    for (const entry of Deno.readDirSync(dir)) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        scanDir(path);
      } else if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const text = Deno.readTextFileSync(path);
        for (const specifier of extractOpenImports(text)) {
          const prefix = '@openelement/';
          if (!specifier.startsWith(prefix)) continue;
          const rest = specifier.slice(prefix.length);
          const slashIdx = rest.indexOf('/');
          const base = slashIdx === -1 ? specifier : prefix + rest.slice(0, slashIdx);
          if (base === pkg.name) continue;
          const depPkg = byName.get(base);
          if (depPkg) deps[base] = `^${depPkg.version}`;
        }
      }
    }
  }
  try {
    scanDir(`${pkg.dir}/src`);
  } catch {
    // no src dir
  }

  return deps;
}

function isPrerelease(version: string): boolean {
  return version.includes('-');
}

function applyPackageJsonOverrides(pkg: PackageInfo, pkgJson: Record<string, unknown>): void {
  pkgJson.repository = REPOSITORY;
  pkgJson.keywords = KEYWORDS;
  if (pkg.name === '@openelement/create') {
    pkgJson.bin = CREATE_BIN;
  }
}

async function packPackage(
  pkg: PackageInfo,
  dryRun: boolean,
  allPackages: PackageInfo[],
): Promise<string> {
  const filename = npmTarballName(pkg);
  const out = tarballPath(pkg);
  // Dry-run of the publish pipeline still produces a real tarball so we can
  // post-process package.json; --allow-dirty lets deno pack run on a dirty worktree.
  const args = dryRun
    ? ['pack', '--allow-dirty', '--output', filename]
    : ['pack', '--output', filename];
  await runCommand('deno', args, pkg.dir);

  const tmp = await Deno.makeTempDir({ prefix: 'pack-' });
  const tarEnv = { COPYFILE_DISABLE: '1' };
  try {
    await runCommand('tar', ['-xzf', out, '-C', tmp], undefined, tarEnv);
    const pkgJsonPath = `${tmp}/package/package.json`;
    const pkgJson = JSON.parse(Deno.readTextFileSync(pkgJsonPath));
    applyPackageJsonOverrides(pkg, pkgJson);
    pkgJson.dependencies = {
      ...deriveDependencies(pkg, allPackages),
      ...(pkgJson.dependencies ?? {}),
    };
    Deno.writeTextFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    await runCommand('tar', ['-czf', out, '-C', tmp, 'package'], undefined, tarEnv);
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }

  return out;
}

async function publishPackage(pkg: PackageInfo, dryRun: boolean): Promise<void> {
  const tar = tarballPath(pkg);
  const args = dryRun
    ? ['publish', tar, '--dry-run', '--access', 'public']
    : ['publish', tar, '--access', 'public', '--provenance'];
  if (isPrerelease(pkg.version)) {
    args.push('--tag', 'next');
  }
  await runCommand('npm', args);
}

function assertVersionConsistency(packages: PackageInfo[]): void {
  const versions = new Map<string, string[]>();
  for (const pkg of packages) {
    const list = versions.get(pkg.version) ?? [];
    list.push(pkg.name);
    versions.set(pkg.version, list);
  }
  if (versions.size <= 1) return;
  const lines = [...versions.entries()].map(([version, names]) =>
    `  ${version || '<missing>'}: ${names.join(', ')}`
  );
  throw new Error(`Package versions are not consistent:\n${lines.join('\n')}`);
}

function parseCommand(): { command: string; dryRun: boolean; publish: boolean } {
  const command = Deno.args[0];
  if (!COMMANDS.has(command)) {
    throw new Error(
      `Usage: deno run --allow-read --allow-run tools/publish-npm.ts ${[...COMMANDS].join('|')}`,
    );
  }
  const dryRun = command.endsWith(':dry-run');
  const publish = command.startsWith('publish:');
  return { command, dryRun, publish };
}

async function main(): Promise<void> {
  const { command, dryRun, publish } = parseCommand();
  const allPackages = await readPackages();
  const packages = releasePublishOrder(allPackages);
  if (packages.length === 0) throw new Error('No packages found under packages/.');

  assertVersionConsistency(packages);

  if (!dryRun) {
    await assertCleanWorktree();
  }

  console.log(
    `[npm] ${command}: ${packages.length} packages in dependency order: ` +
      packages.map((pkg) => pkg.name).join(' -> '),
  );

  const tarballs: string[] = [];
  for (const pkg of packages) {
    const tar = await packPackage(pkg, dryRun, packages);
    tarballs.push(tar);
  }

  if (publish) {
    for (const pkg of packages) {
      await publishPackage(pkg, dryRun);
    }
  }

  console.log(`[npm] ${command} complete. Tarballs:`);
  for (const tar of tarballs) console.log(`  ${tar}`);
}

await main();
