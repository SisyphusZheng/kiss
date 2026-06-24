/**
 * Run package-scoped release tasks in dependency order.
 *
 * This is intentionally small and graph-driven: root deno.json should not carry
 * a hand-maintained 19-package publish or typecheck chain.
 */

import { waitForJsrPackageMetadata } from './wait-jsr-release-metadata.ts';
import {
  type PackageInfo,
  readPackages,
  releasePublishOrder,
  sortPackages,
} from './lib/package-graph.ts';

const COMMANDS = new Set(['typecheck', 'publish', 'publish:dry-run']);
const JSR_PUBLISH_TIMEOUT_MS = 45 * 60 * 1000;
const JSR_PUBLISH_POLL_DELAY_MS = 30_000;
const JSR_PUBLISH_FORCE_KILL_DELAY_MS = 5_000;
const JSR_PROPAGATION_ATTEMPTS = 60;
const JSR_PROPAGATION_DELAY_MS = 5_000;
const JSR_METADATA_TIMEOUT_MS = 10_000;
const JSR_PACKAGE_METADATA_TIMEOUT_MS = 30 * 60 * 1000;
const JSR_PACKAGE_METADATA_INTERVAL_MS = 15_000;

function exportEntries(pkg: PackageInfo): string[] {
  if (typeof pkg.exports === 'string') return [pkg.exports];
  if (!pkg.exports || typeof pkg.exports !== 'object') return [];
  const entries = Object.values(pkg.exports as Record<string, unknown>)
    .filter((value): value is string => typeof value === 'string')
    .filter((value) => value.endsWith('.ts') || value.endsWith('.tsx'));
  return [...new Set(entries)];
}

async function runCommand(
  command: string,
  args: string[],
  cwd?: string,
): Promise<void> {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  # cwd=${cwd}` : ''}`);
  const proc = new Deno.Command(command, {
    args,
    cwd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await proc.spawn().status;
  if (!status.success) {
    throw new Error(`Command failed with exit code ${status.code}: ${command} ${args.join(' ')}`);
  }
}

async function runPublishCommand(
  pkg: PackageInfo,
  command: string,
  args: string[],
  cwd: string | undefined,
  timeoutMs: number,
): Promise<{
  success: boolean;
  code: number;
  timedOut: boolean;
  visibleOnJsr: boolean;
  stoppedAfterJsrVisible: boolean;
}> {
  console.log(`$ ${[command, ...args].join(' ')}${cwd ? `  # cwd=${cwd}` : ''}`);
  const controller = new AbortController();
  let timedOut = false;
  let visibleOnJsr = false;
  let stopped = false;
  let stopRequested = false;
  let child: Deno.ChildProcess | null = null;
  let forceKillTimeoutId: number | undefined;
  let stopWatcher!: () => void;
  const stopWatcherPromise = new Promise<void>((resolve) => {
    stopWatcher = resolve;
  });

  function sendSignal(signal: Deno.Signal): void {
    if (!child || stopped) return;
    try {
      child.kill(signal);
    } catch (err) {
      if (!stopped) {
        console.warn(
          `[publish] ${pkg.name}@${pkg.version}: unable to send ${signal} to ` +
            `deno publish: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  function stopPublishProcess(reason: string): void {
    if (stopRequested) return;
    stopRequested = true;
    controller.abort();
    sendSignal('SIGTERM');
    forceKillTimeoutId = setTimeout(() => {
      if (!stopped) {
        console.warn(
          `[publish] ${pkg.name}@${pkg.version}: deno publish did not stop after ` +
            `${JSR_PUBLISH_FORCE_KILL_DELAY_MS / 1000}s (${reason}); sending SIGKILL.`,
        );
        sendSignal('SIGKILL');
      }
    }, JSR_PUBLISH_FORCE_KILL_DELAY_MS);
  }

  async function sleepOrStop(ms: number): Promise<void> {
    await Promise.race([sleep(ms), stopWatcherPromise]);
  }

  const watcher = (async () => {
    let attempt = 1;
    while (!stopped && !timedOut && !visibleOnJsr) {
      await sleepOrStop(JSR_PUBLISH_POLL_DELAY_MS);
      if (stopped || timedOut || visibleOnJsr) break;

      try {
        if (await jsrVersionExists(pkg.name, pkg.version)) {
          visibleOnJsr = true;
          console.warn(
            `[publish] ${pkg.name}@${pkg.version}: version is visible on JSR while ` +
              'deno publish is still running; stopping the hung publish process.',
          );
          stopPublishProcess('JSR version metadata is visible');
          return;
        }
      } catch (err) {
        console.warn(
          `[publish] ${pkg.name}@${pkg.version}: live JSR metadata check ${attempt} failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }

      console.log(
        `[publish] ${pkg.name}@${pkg.version}: publish still running; ` +
          `JSR metadata not visible yet (${attempt}).`,
      );
      attempt++;
    }
  })();

  const timeoutId = setTimeout(() => {
    timedOut = true;
    stopPublishProcess(`timeout after ${timeoutMs / 60_000} minutes`);
  }, timeoutMs);

  try {
    const proc = new Deno.Command(command, {
      args,
      cwd,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      signal: controller.signal,
    });
    child = proc.spawn();
    const status = await child.status;
    return {
      success: status.success,
      code: status.code,
      timedOut,
      visibleOnJsr,
      stoppedAfterJsrVisible: false,
    };
  } catch (err) {
    if (timedOut && err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        code: 1,
        timedOut: true,
        visibleOnJsr,
        stoppedAfterJsrVisible: false,
      };
    }
    if (visibleOnJsr && err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        code: 1,
        timedOut: false,
        visibleOnJsr: true,
        stoppedAfterJsrVisible: true,
      };
    }
    throw err;
  } finally {
    stopped = true;
    stopWatcher();
    clearTimeout(timeoutId);
    if (forceKillTimeoutId !== undefined) clearTimeout(forceKillTimeoutId);
    await watcher;
  }
}

async function typecheckPackage(pkg: PackageInfo): Promise<void> {
  const entries = exportEntries(pkg);
  if (entries.length === 0) {
    console.log(`[typecheck] ${pkg.name}: skipped, no TS exports`);
    return;
  }
  const rootEntries = entries.map((entry) => `${pkg.dir}/${entry.replace(/^\.\//, '')}`);
  await runCommand('deno', ['check', ...rootEntries]);
}

async function jsrVersionExists(pkg: string, version: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JSR_METADATA_TIMEOUT_MS);
  try {
    const response = await fetch(`https://jsr.io/${pkg}/${version}_meta.json`, {
      signal: controller.signal,
    });
    if (response.status === 404) return false;
    if (!response.ok) {
      throw new Error(
        `JSR metadata check failed for ${pkg}@${version}: HTTP ${response.status}`,
      );
    }
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `JSR metadata check timed out for ${pkg}@${version} after ${
          JSR_METADATA_TIMEOUT_MS / 1000
        }s`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForJsrVersion(pkg: PackageInfo): Promise<boolean> {
  for (let attempt = 1; attempt <= JSR_PROPAGATION_ATTEMPTS; attempt++) {
    try {
      if (await jsrVersionExists(pkg.name, pkg.version)) return true;
    } catch (err) {
      console.warn(
        `[publish] ${pkg.name}@${pkg.version}: JSR metadata check attempt ${attempt} failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    if (attempt < JSR_PROPAGATION_ATTEMPTS) {
      console.log(
        `[publish] ${pkg.name}@${pkg.version}: waiting for JSR propagation ` +
          `(${attempt}/${JSR_PROPAGATION_ATTEMPTS})`,
      );
      await sleep(JSR_PROPAGATION_DELAY_MS);
    }
  }
  return false;
}

function isPrerelease(version: string): boolean {
  return version.includes('-');
}

async function waitForPackageLevelMetadata(pkg: PackageInfo): Promise<void> {
  await waitForJsrPackageMetadata({
    packageNames: [pkg.name],
    version: pkg.version,
    timeoutMs: JSR_PACKAGE_METADATA_TIMEOUT_MS,
    intervalMs: JSR_PACKAGE_METADATA_INTERVAL_MS,
    requireLatest: !isPrerelease(pkg.version),
    logPrefix: 'publish-meta',
    bypassCdnCache: true,
  });
}

async function waitForDependencyPackageMetadata(pkg: PackageInfo): Promise<void> {
  if (pkg.deps.length === 0) return;
  await waitForJsrPackageMetadata({
    packageNames: pkg.deps,
    version: pkg.version,
    timeoutMs: JSR_PACKAGE_METADATA_TIMEOUT_MS,
    intervalMs: JSR_PACKAGE_METADATA_INTERVAL_MS,
    requireLatest: false,
    logPrefix: 'publish-deps',
    bypassCdnCache: true,
  });
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

  const status = new TextDecoder().decode(output.stdout);
  // Release evidence files are generated by the release flow itself; any
  // changes under docs/release/ should not block publishing.
  const nonEvidenceDirty = status
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/^.{2} docs\/release\//.test(line))
    .join('\n');
  if (nonEvidenceDirty) {
    console.error(nonEvidenceDirty);
    throw new Error('Refusing to publish from a dirty worktree.');
  }
}

async function publishPackage(
  pkg: PackageInfo,
  dryRun: boolean,
): Promise<'dry-run' | 'skipped' | 'published' | 'recovered'> {
  const args = ['publish', '-c', 'deno.json', '--allow-slow-types', '--allow-dirty'];
  if (dryRun) {
    args.push('--dry-run');
    await runCommand('deno', args, pkg.dir);
    return 'dry-run';
  }

  await waitForDependencyPackageMetadata(pkg);

  if (await jsrVersionExists(pkg.name, pkg.version)) {
    console.log(`[publish] ${pkg.name}@${pkg.version}: already exists; skipping.`);
    await waitForPackageLevelMetadata(pkg);
    return 'skipped';
  }

  console.log(`[publish] ${pkg.name}@${pkg.version}: publishing.`);
  const status = await runPublishCommand(
    pkg,
    'deno',
    [...args, '--no-check'],
    pkg.dir,
    JSR_PUBLISH_TIMEOUT_MS,
  );

  if (status.success || status.visibleOnJsr) {
    if (!(await waitForJsrVersion(pkg))) {
      throw new Error(
        `${pkg.name}@${pkg.version} publish finished but JSR metadata never appeared.`,
      );
    }
    if (status.stoppedAfterJsrVisible) {
      console.warn(
        `[publish] ${pkg.name}@${pkg.version}: recovered after JSR became visible and ` +
          'the hung deno publish process was stopped.',
      );
      await waitForPackageLevelMetadata(pkg);
      return 'recovered';
    }
    console.log(`[publish] ${pkg.name}@${pkg.version}: published and visible on JSR.`);
    await waitForPackageLevelMetadata(pkg);
    return status.success ? 'published' : 'recovered';
  }

  const reason = status.timedOut
    ? `timed out after ${JSR_PUBLISH_TIMEOUT_MS / 60_000} minutes`
    : `failed with exit code ${status.code}`;
  console.warn(`[publish] ${pkg.name}@${pkg.version}: command ${reason}; checking JSR state.`);
  if (await waitForJsrVersion(pkg)) {
    console.warn(
      `[publish] ${pkg.name}@${pkg.version}: version exists on JSR after command ${reason}; continuing.`,
    );
    await waitForPackageLevelMetadata(pkg);
    return 'recovered';
  }

  throw new Error(
    `${pkg.name}@${pkg.version} publish ${reason}, and the version is not visible on JSR.`,
  );
}

function printJsrRecoveryPlan(packages: PackageInfo[]): void {
  console.log(
    '[publish] Live mode skips versions already visible on JSR and publishes ' +
      'the remaining packages sequentially.',
  );
  console.log(
    '[publish] If a publish command times out or exits non-zero after JSR accepts ' +
      'the immutable version, the script rechecks JSR metadata before failing.',
  );
  console.log(
    `[publish] Per-package publish timeout: ${JSR_PUBLISH_TIMEOUT_MS / 60_000} minutes. ` +
      'During the command, CI also polls JSR and kills a hung publish process as soon ' +
      'as the immutable version becomes visible.',
  );
  console.log(
    `[publish] Package-level metadata timeout: ${
      JSR_PACKAGE_METADATA_TIMEOUT_MS / 60_000
    } minutes. ` +
      'Each published package waits for cache-busted package-level JSR metadata ' +
      'before dependents publish; the post-publish consumer smoke gate still ' +
      'waits for the normal uncached consumer path.',
  );
  console.log(
    `[publish] Candidate order: ${
      packages.map((pkg) => `${pkg.name}@${pkg.version}`).join(' -> ')
    }`,
  );
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

function parseOnlyFilter(args: string[]): Set<string> | null {
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--only') {
      const value = args[++i];
      if (!value) throw new Error('--only requires a comma-separated package list.');
      values.push(value);
    } else if (arg.startsWith('--only=')) {
      values.push(arg.slice('--only='.length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  const names = values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
  return names.length > 0 ? new Set(names) : null;
}

function packageKeys(pkg: PackageInfo): string[] {
  return [pkg.name, pkg.name.replace('@openelement/', '')];
}

function filterPackagesWithDependencies(
  packages: PackageInfo[],
  only: Set<string> | null,
): PackageInfo[] {
  if (!only) return packages;

  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const selected = new Set<string>();
  const requested = packages.filter((pkg) => packageKeys(pkg).some((key) => only.has(key)));

  if (requested.length === 0) {
    throw new Error(`No packages match --only ${[...only].join(',')}`);
  }

  function visit(pkg: PackageInfo): void {
    if (selected.has(pkg.name)) return;
    for (const dep of pkg.deps) {
      const depPkg = byName.get(dep);
      if (depPkg) visit(depPkg);
    }
    selected.add(pkg.name);
  }

  for (const pkg of requested) visit(pkg);
  return packages.filter((pkg) => selected.has(pkg.name));
}

async function main(): Promise<void> {
  const [command, ...args] = Deno.args;
  if (!COMMANDS.has(command)) {
    throw new Error(
      `Usage: deno run --allow-read --allow-run tools/run-package-graph-task.ts ${
        [...COMMANDS].join('|')
      } [--only package-a,package-b]`,
    );
  }
  const only = parseOnlyFilter(args);

  const allPackages = await readPackages();
  const orderedPackages = command.startsWith('publish')
    ? releasePublishOrder(allPackages)
    : sortPackages(allPackages);
  const packages = filterPackagesWithDependencies(orderedPackages, only);
  if (packages.length === 0) throw new Error('No packages found under packages/.');
  console.log(
    `[graph-task] ${command}: ${packages.length} packages in dependency order: ${
      packages.map((pkg) => pkg.name).join(' -> ')
    }`,
  );

  if (command.startsWith('publish')) {
    assertVersionConsistency(packages);
  }
  if (command === 'publish') {
    await assertCleanWorktree();
    printJsrRecoveryPlan(packages);
  }

  const publishResults = new Map<string, number>();
  for (const pkg of packages) {
    if (command === 'typecheck') {
      await typecheckPackage(pkg);
    } else {
      const result = await publishPackage(pkg, command === 'publish:dry-run');
      publishResults.set(result, (publishResults.get(result) ?? 0) + 1);
    }
  }

  if (command.startsWith('publish')) {
    const summary = [...publishResults.entries()]
      .map(([result, count]) => `${result}: ${count}`)
      .join(', ');
    console.log(`[graph-task] ${command} summary: ${summary}`);
  }

  if (command === 'typecheck') {
    await runCommand('deno', ['check', 'www/vite.config.ts', 'www/e2e/playwright.config.ts']);
  }
}

await main();
