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
import { runCommand } from './lib/process.ts';
import { assertCleanWorktree } from './lib/git-cleanliness.ts';
import { formatJson } from './lib/format-json.ts';
import { extractStaticModuleSpecifiers } from './lib/typescript-ast.ts';

const COMMANDS = new Set(['pack', 'pack:dry-run', 'publish:npm', 'publish:npm:dry-run']);

const REPOSITORY = {
  type: 'git',
  url: 'git+https://github.com/open-element/openelement.git',
};

const KEYWORDS = ['openelement', 'web-components', 'ssg', 'framework', 'deno'];
const HOMEPAGE = 'https://openelement.org';
const BUGS = 'https://github.com/open-element/openelement/issues';
const PACKAGE_DESCRIPTIONS: Record<string, string> = {
  '@openelement/adapter-vite': 'Vite build adapter for the OpenElement Web Components framework.',
  '@openelement/app': 'Application authoring APIs for the OpenElement Web Components framework.',
  '@openelement/create': 'Project generator for the OpenElement Web Components framework.',
  '@openelement/element': 'Custom element base class and authoring APIs for OpenElement.',
  '@openelement/ui': 'Reference Web Components and UI primitives for OpenElement.',
};

const CREATE_BIN = {
  'openelement-create': './src/cli.js',
  'create-openelement': './src/cli.js',
};

function npmTarballName(pkg: PackageInfo): string {
  return `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
}

function tarballPath(pkg: PackageInfo): string {
  return `${pkg.dir}/${npmTarballName(pkg)}`;
}

function cleanStaleTarballs(packages: PackageInfo[]): void {
  for (const pkg of packages) {
    for (const entry of Deno.readDirSync(pkg.dir)) {
      if (entry.isFile && entry.name.endsWith('.tgz')) {
        Deno.removeSync(`${pkg.dir}/${entry.name}`);
      }
    }
  }
}

export interface DeriveDepsIo {
  readPkgJson: (dir: string) => { imports?: Record<string, string> };
  readRootJson: () => { imports?: Record<string, string> };
  readSrcFiles: (dir: string) => string[];
}

const defaultDeriveDepsIo: DeriveDepsIo = {
  readPkgJson: (dir) => JSON.parse(Deno.readTextFileSync(`${dir}/deno.json`)),
  readRootJson: () => JSON.parse(Deno.readTextFileSync('deno.json')),
  readSrcFiles: (dir) => {
    const files: string[] = [];
    const scan = (d: string): void => {
      for (const entry of Deno.readDirSync(d)) {
        const path = `${d}/${entry.name}`;
        if (entry.isDirectory) {
          if (entry.name === 'node_modules' || entry.name === 'dist') continue;
          scan(path);
        } else if (entry.isFile && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(Deno.readTextFileSync(path));
        }
      }
    };
    try {
      scan(`${dir}/src`);
    } catch {
      // no src dir
    }
    return files;
  },
};

function parseNpmSpec(value: string, label: string): { name: string; version: string } | null {
  const match = value.match(/^npm:(@[^/]+\/[^@/]+|[^@/]+)(?:@(\^?[\d.]+(?:-[\w.]+)?))?/);
  if (!match) return null;
  const name = match[1];
  if (name.startsWith('@openelement/')) return null;
  const version = match[2]?.replace(/^\^/, '');
  if (!version) {
    throw new Error(`npm dependency '${name}' (${label}) has no version; add an explicit version.`);
  }
  return { name, version };
}

export function deriveDependencies(
  pkg: PackageInfo,
  allPackages: PackageInfo[],
  io: DeriveDepsIo = defaultDeriveDepsIo,
  rootImports: Record<string, string> = io.readRootJson().imports ?? {},
): Record<string, string> {
  const deps: Record<string, string> = {};
  const denoJson = io.readPkgJson(pkg.dir);
  const imports = denoJson.imports ?? {};
  const sourceSpecifiers = new Set<string>();

  // External npm dependencies from deno.json imports.
  for (const value of Object.values(imports)) {
    if (typeof value !== 'string') continue;
    const spec = parseNpmSpec(value, `${pkg.name} deno.json`);
    if (spec) deps[spec.name] = `^${spec.version}`;
  }

  // Internal workspace dependencies from source imports.
  const byName = new Map(allPackages.map((p) => [p.name, p]));
  for (const text of io.readSrcFiles(pkg.dir)) {
    for (const { value } of extractStaticModuleSpecifiers(text)) sourceSpecifiers.add(value);
    for (const specifier of extractOpenImports(text)) {
      const prefix = '@openelement/';
      if (!specifier.startsWith(prefix)) continue;
      const rest = specifier.slice(prefix.length);
      const slashIdx = rest.indexOf('/');
      const base = slashIdx === -1 ? specifier : prefix + rest.slice(0, slashIdx);
      if (base === pkg.name) continue;
      const depPkg = byName.get(base);
      if (depPkg) deps[base] = depPkg.version;
    }
  }

  // Workspace packages inherit the root import map. npm package.json files do
  // not, so every root-mapped bare specifier used by package source must be
  // materialized as a dependency in the packed artifact.
  for (const specifier of sourceSpecifiers) {
    const value = rootImports[specifier];
    if (typeof value !== 'string') continue;
    const spec = parseNpmSpec(value, `${pkg.name} root import`);
    if (spec) deps[spec.name] = `^${spec.version}`;
  }

  return deps;
}

export function deriveAllDependencies(
  packages: PackageInfo[],
  io: DeriveDepsIo = defaultDeriveDepsIo,
): Map<string, Record<string, string>> {
  const rootImports = io.readRootJson().imports ?? {};
  return new Map(
    packages.map((pkg) => [pkg.name, deriveDependencies(pkg, packages, io, rootImports)]),
  );
}

function isPrerelease(version: string): boolean {
  return version.includes('-');
}

function applyPackageJsonOverrides(pkg: PackageInfo, pkgJson: Record<string, unknown>): void {
  pkgJson.type = 'module';
  pkgJson.repository = REPOSITORY;
  pkgJson.homepage = HOMEPAGE;
  pkgJson.bugs = BUGS;
  pkgJson.license = 'MIT';
  pkgJson.description = PACKAGE_DESCRIPTIONS[pkg.name];
  pkgJson.keywords = KEYWORDS;
  if (pkg.name === '@openelement/create') {
    pkgJson.bin = CREATE_BIN;
  }
}

async function packPackage(
  pkg: PackageInfo,
  dependencies: Record<string, string>,
  _dryRun: boolean,
): Promise<string> {
  const filename = npmTarballName(pkg);
  const out = tarballPath(pkg);
  // The explicit release cleanliness check runs before this loop and rejects
  // every change except deterministic gate output. Deno itself cannot express
  // that allowlist, so packing must allow those known generated files in both
  // dry-run and publish mode.
  const args = ['pack', '--output', filename, '--allow-dirty'];
  await runCommand('deno', args, { cwd: pkg.dir });

  const tmp = await Deno.makeTempDir({ prefix: 'pack-' });
  const tarEnv = { COPYFILE_DISABLE: '1' };
  try {
    await runCommand('tar', ['-xzf', out, '-C', tmp], { env: tarEnv });
    const pkgJsonPath = `${tmp}/package/package.json`;
    const pkgJson = JSON.parse(Deno.readTextFileSync(pkgJsonPath));
    applyPackageJsonOverrides(pkg, pkgJson);
    pkgJson.dependencies = {
      ...dependencies,
      ...(pkgJson.dependencies ?? {}),
    };
    Deno.writeTextFileSync(pkgJsonPath, formatJson(pkgJson));
    await runCommand('tar', ['-czf', out, '-C', tmp, 'package'], { env: tarEnv });
  } finally {
    await Deno.remove(tmp, { recursive: true });
  }

  return out;
}

async function npmPackageVersionExists(name: string, version: string): Promise<boolean> {
  const command = new Deno.Command('npm', {
    args: ['view', `${name}@${version}`, 'version'],
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  return output.success && new TextDecoder().decode(output.stdout).trim() === version;
}

export interface PublishPackageIo {
  versionExists: (name: string, version: string) => Promise<boolean>;
  publish: (args: string[]) => Promise<void>;
  log: (message: string) => void;
}

const defaultPublishPackageIo: PublishPackageIo = {
  versionExists: npmPackageVersionExists,
  publish: (args) => runCommand('npm', args),
  log: console.log,
};

export async function publishPackage(
  pkg: PackageInfo,
  dryRun: boolean,
  io: PublishPackageIo = defaultPublishPackageIo,
): Promise<void> {
  const tar = tarballPath(pkg);
  if (!dryRun && await io.versionExists(pkg.name, pkg.version)) {
    io.log(`[npm] ${pkg.name}@${pkg.version} already published; skipping.`);
    return;
  }
  const args = dryRun
    ? ['publish', tar, '--dry-run', '--access', 'public']
    : ['publish', tar, '--access', 'public'];
  // Provenance requires GitHub Actions OIDC; skip locally and on other CI providers.
  if (!dryRun && Deno.env.get('GITHUB_ACTIONS') === 'true') {
    args.push('--provenance');
  }
  if (isPrerelease(pkg.version)) {
    args.push('--tag', npmPublishTag(pkg.version));
  }
  try {
    await io.publish(args);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('E403') || msg.includes('previously published versions')) {
      io.log(`[npm] ${pkg.name}@${pkg.version} already published; skipping.`);
      return;
    }
    throw error;
  }
  // latest dist-tag policy (alpha line): every prerelease publish also points
  // `latest` at the just-published version, so `latest` never lags the active
  // prerelease line. tools/verify-npm-release.ts enforces the invariant by
  // asserting dist-tags.latest === <published version>. Stable publishes need
  // no explicit tag: npm defaults them to `latest`.
  if (!dryRun && isPrerelease(pkg.version)) {
    await io.publish(['dist-tag', 'add', `${pkg.name}@${pkg.version}`, 'latest']);
    io.log(`[npm] ${pkg.name}@${pkg.version}: latest dist-tag updated.`);
  }
}

export function npmPublishTag(version: string): string {
  if (version.includes('-alpha')) return 'alpha';
  if (version.includes('-beta')) return 'beta';
  if (version.includes('-rc')) return 'rc';
  return 'next';
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
  const dependencyMap = deriveAllDependencies(packages);
  if (packages.length === 0) throw new Error('No packages found under packages/.');

  assertVersionConsistency(packages);

  if (!dryRun) {
    await assertCleanWorktree('Refusing to publish from a dirty worktree');
  }

  console.log(
    `[npm] ${command}: ${packages.length} packages in dependency order: ` +
      packages.map((pkg) => pkg.name).join(' -> '),
  );

  // Remove stale tarballs from previous pack runs so the working tree does not
  // accumulate `.tgz` artifacts.
  cleanStaleTarballs(packages);

  const tarballs: string[] = [];
  for (const pkg of packages) {
    const tar = await packPackage(pkg, dependencyMap.get(pkg.name) ?? {}, dryRun);
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

if (import.meta.main) {
  await main();
}
