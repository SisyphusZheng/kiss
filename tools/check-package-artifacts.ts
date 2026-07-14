#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-net --allow-env
/**
 * Release gate: verify packed npm artifacts stay ESM-only and keep host APIs out
 * of runtime-free/browser-facing package surfaces.
 */

import { walkSync } from '@std/fs/walk';
import { dirname } from 'node:path';
import { stripComments } from './lib/text.ts';
import { runCommand } from './lib/process.ts';
import { type PackageInfo, readPackages, releasePublishOrder } from './lib/package-graph.ts';

const PUBLINT_VERSION = '0.3.21';
const ATTW_VERSION = '0.18.4';

const RUNTIME_FREE_PACKAGES = new Set([
  '@openelement/element',
  '@openelement/ui',
  '@openelement/app',
]);

const RUNTIME_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const CJS_PATTERNS: Array<[RegExp, string]> = [
  [/\brequire\s*\(/, 'CommonJS require()'],
  [/\bmodule\.exports\b/, 'CommonJS module.exports'],
  [/\bexports\./, 'CommonJS exports.*'],
  [/\b__dirname\b/, 'CommonJS __dirname'],
  [/\b__filename\b/, 'CommonJS __filename'],
];

const HOST_PATTERNS: Array<[RegExp, string]> = [
  [/(?:^|['"])node:[^'"]+/, 'node:* import'],
  [/\bDeno\.[A-Za-z_]/, 'Deno API'],
  [/\bprocess\b/, 'Node process global'],
  [/\bBuffer\b/, 'Node Buffer global'],
  [/\bsetImmediate\b/, 'Node setImmediate global'],
  [/\bclearImmediate\b/, 'Node clearImmediate global'],
];

export interface ArtifactViolation {
  path: string;
  message: string;
  line?: number;
}

export interface PackageScanResult {
  packageName: string;
  violations: ArtifactViolation[];
}

function tarballName(pkg: PackageInfo): string {
  return `${pkg.name.replace('@', '').replace('/', '-')}-${pkg.version}.tgz`;
}

function tarballPath(pkg: PackageInfo): string {
  return `${pkg.dir}/${tarballName(pkg)}`;
}

function extension(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx === -1 ? '' : path.slice(idx);
}

function pushPackageJsonViolations(
  packageName: string,
  packageJsonPath: string,
  violations: ArtifactViolation[],
): void {
  const packageJson = JSON.parse(Deno.readTextFileSync(packageJsonPath));
  if (packageJson.type !== 'module') {
    violations.push({
      path: `${packageName}/package.json`,
      message: 'package.json must declare "type": "module"',
    });
  }

  if (typeof packageJson.main === 'string' && packageJson.main.endsWith('.cjs')) {
    violations.push({
      path: `${packageName}/package.json`,
      message: 'package.json main must not point at a CommonJS entry',
    });
  }

  if (!packageJson.exports) {
    violations.push({
      path: `${packageName}/package.json`,
      message: 'package.json must expose an exports map',
    });
  }
}

function scanRuntimeFile(
  root: string,
  path: string,
  packageName: string,
  runtimeFree: boolean,
): ArtifactViolation[] {
  const violations: ArtifactViolation[] = [];
  const relative = path.slice(root.length + 1);

  if (extension(relative) === '.cjs') {
    violations.push({
      path: `${packageName}/${relative}`,
      message: 'CommonJS .cjs artifact is not allowed',
    });
  }

  const text = Deno.readTextFileSync(path);
  const firstCodeLine = text.split('\n').find((l) => l.trim() !== '') ?? '';
  const hostScanAllowed = !firstCodeLine.trim().startsWith('// deno-api-free:ignore');
  const lines = stripComments(text).split('\n');

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    for (const [pattern, message] of CJS_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          path: `${packageName}/${relative}`,
          message,
          line: index + 1,
        });
      }
    }

    if (runtimeFree && hostScanAllowed) {
      for (const [pattern, message] of HOST_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            path: `${packageName}/${relative}`,
            message,
            line: index + 1,
          });
        }
      }
    }
  }

  return violations;
}

export function scanExtractedPackage(packageName: string, packageRoot: string): PackageScanResult {
  const violations: ArtifactViolation[] = [];
  pushPackageJsonViolations(packageName, `${packageRoot}/package.json`, violations);

  const runtimeFree = RUNTIME_FREE_PACKAGES.has(packageName);
  const files = new Set<string>();
  for (
    const entry of walkSync(packageRoot, {
      includeDirs: false,
      skip: [/^node_modules$/],
    })
  ) {
    const relative = entry.path.slice(packageRoot.length + 1);
    files.add(relative);
    if (
      packageName === '@openelement/adapter-vite' &&
      relative.split('/').some((segment) =>
        segment === '__tests__' || segment === '__fixtures__' || segment === 'fixtures'
      )
    ) {
      violations.push({
        path: `${packageName}/${relative}`,
        message: 'internal test and fixture files must not be published',
      });
    }
    if (!RUNTIME_EXTENSIONS.has(extension(entry.path))) continue;
    violations.push(...scanRuntimeFile(packageRoot, entry.path, packageName, runtimeFree));
  }

  if (packageName === '@openelement/adapter-vite') {
    for (const required of ['package.json', 'README.md', 'LICENSE']) {
      if (!files.has(required)) {
        violations.push({
          path: `${packageName}/${required}`,
          message: 'required package metadata is missing',
        });
      }
    }
  }

  return { packageName, violations };
}

async function extractTarball(tarball: string): Promise<string> {
  const tmp = await Deno.makeTempDir({ prefix: 'openelement-artifact-' });
  await runCommand('tar', ['-xzf', tarball, '-C', tmp], undefined);
  return `${tmp}/package`;
}

async function verifyTarball(pkg: PackageInfo): Promise<PackageScanResult> {
  const tarball = tarballPath(pkg);
  await Deno.stat(tarball);

  await runCommand(Deno.execPath(), [
    'run',
    '-A',
    `npm:publint@${PUBLINT_VERSION}`,
    'run',
    tarball,
    '--strict',
  ]);
  await runCommand(Deno.execPath(), [
    'run',
    '-A',
    `npm:@arethetypeswrong/cli@${ATTW_VERSION}`,
    '--profile',
    'esm-only',
    tarball,
  ]);

  const packageRoot = await extractTarball(tarball);
  try {
    let unpackedBytes = 0;
    for (const entry of walkSync(packageRoot, { includeDirs: false })) {
      unpackedBytes += Deno.statSync(entry.path).size;
    }
    const packedBytes = (await Deno.stat(tarball)).size;
    console.log(`[artifact-size] ${pkg.name}: packed=${packedBytes}B unpacked=${unpackedBytes}B`);
    return scanExtractedPackage(pkg.name, packageRoot);
  } finally {
    await Deno.remove(dirname(packageRoot), {
      recursive: true,
    });
  }
}

async function main(): Promise<void> {
  const skipPack = Deno.args.includes('--skip-pack');
  if (!skipPack) {
    await runCommand(Deno.execPath(), ['task', 'pack:dry-run']);
  }

  const packages = releasePublishOrder(await readPackages());
  const results: PackageScanResult[] = [];
  for (const pkg of packages) {
    console.log(`\n[artifact] ${pkg.name}`);
    results.push(await verifyTarball(pkg));
  }

  const violations = results.flatMap((result) => result.violations);
  if (violations.length > 0) {
    console.error('\nPackage artifact violations detected:');
    for (const violation of violations) {
      const line = violation.line ? `:${violation.line}` : '';
      console.error(`  ${violation.path}${line}: ${violation.message}`);
    }
    Deno.exit(1);
  }

  console.log(`\nPackage artifact checks passed for ${packages.length} packages.`);
}

if (import.meta.main) {
  await main();
}
