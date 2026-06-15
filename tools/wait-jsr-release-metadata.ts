/**
 * Wait until JSR package-level metadata exposes the current release version.
 *
 * Deno's fresh JSR resolver reads `https://jsr.io/<pkg>/meta.json` before it
 * can resolve an exact version. JSR may expose `<version>_meta.json` before
 * package-level `meta.json` is updated, so post-publish consumer smoke must
 * wait for the package-level metadata rather than sleeping for a fixed delay.
 */

import { readPackages, sortPackages } from './lib/package-graph.ts';

interface Options {
  version: string;
  timeoutMs: number;
  intervalMs: number;
  bypassCdnCache: boolean;
}

export interface PackageMetadataState {
  name: string;
  versionVisible: boolean;
  latestMatches: boolean;
  latest: string | null;
  status: number | null;
  error?: string;
}

export interface WaitForJsrPackageMetadataOptions {
  packageNames: string[];
  version: string;
  timeoutMs: number;
  intervalMs: number;
  requireLatest?: boolean;
  logPrefix?: string;
  bypassCdnCache?: boolean;
}

const DEFAULT_TIMEOUT_MS = 120 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 15_000;
const METADATA_REQUEST_TIMEOUT_MS = 10_000;

function parseArgs(args: string[]): Partial<Options> {
  const options: Partial<Options> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--version') {
      options.version = args[++i];
    } else if (arg.startsWith('--version=')) {
      options.version = arg.slice('--version='.length);
    } else if (arg === '--timeout-minutes') {
      options.timeoutMs = Number(args[++i]) * 60 * 1000;
    } else if (arg.startsWith('--timeout-minutes=')) {
      options.timeoutMs = Number(arg.slice('--timeout-minutes='.length)) * 60 * 1000;
    } else if (arg === '--interval-seconds') {
      options.intervalMs = Number(args[++i]) * 1000;
    } else if (arg.startsWith('--interval-seconds=')) {
      options.intervalMs = Number(arg.slice('--interval-seconds='.length)) * 1000;
    } else if (arg === '--bypass-cdn-cache') {
      options.bypassCdnCache = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

async function readWorkspaceVersion(): Promise<string> {
  const text = await Deno.readTextFile('packages/create/deno.json');
  const json = JSON.parse(text);
  if (!json.version || typeof json.version !== 'string') {
    throw new Error('packages/create/deno.json does not contain a string version.');
  }
  return json.version;
}

function assertPositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
}

async function buildOptions(): Promise<Options> {
  const parsed = parseArgs(Deno.args);
  const timeoutMs = parsed.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = parsed.intervalMs ?? DEFAULT_INTERVAL_MS;
  assertPositiveNumber(timeoutMs, '--timeout-minutes');
  assertPositiveNumber(intervalMs, '--interval-seconds');
  return {
    version: parsed.version ?? await readWorkspaceVersion(),
    timeoutMs,
    intervalMs,
    bypassCdnCache: parsed.bypassCdnCache ?? false,
  };
}

export async function fetchPackageMetadataState(
  name: string,
  version: string,
  bypassCdnCache = false,
): Promise<PackageMetadataState> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), METADATA_REQUEST_TIMEOUT_MS);
  try {
    const cacheBuster = bypassCdnCache
      ? `?releaseProbe=${encodeURIComponent(version)}-${Date.now()}`
      : '';
    const response = await fetch(`https://jsr.io/${name}/meta.json${cacheBuster}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        name,
        versionVisible: false,
        latestMatches: false,
        latest: null,
        status: response.status,
      };
    }
    const metadata = await response.json();
    const versionVisible = Boolean(metadata?.versions?.[version]);
    const latest = typeof metadata?.latest === 'string' ? metadata.latest : null;
    return {
      name,
      versionVisible,
      latestMatches: latest === version,
      latest,
      status: response.status,
    };
  } catch (error) {
    return {
      name,
      versionVisible: false,
      latestMatches: false,
      latest: null,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function summarizeMissing(
  states: PackageMetadataState[],
  requireLatest: boolean,
): string {
  return states
    .filter((state) => !state.versionVisible || (requireLatest && !state.latestMatches))
    .map((state) => {
      const details = [
        state.versionVisible ? 'version=ok' : 'version=missing',
        requireLatest
          ? state.latestMatches ? 'latest=ok' : `latest=${state.latest ?? 'missing'}`
          : `latest=${state.latest ?? 'missing'}`,
        state.status === null ? 'status=error' : `status=${state.status}`,
      ];
      if (state.error) details.push(`error=${state.error}`);
      return `${state.name} (${details.join(', ')})`;
    })
    .join('; ');
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForJsrPackageMetadata(
  options: WaitForJsrPackageMetadataOptions,
): Promise<void> {
  const deadline = Date.now() + options.timeoutMs;
  let attempt = 1;
  const requireLatest = options.requireLatest ?? true;
  const prefix = options.logPrefix ?? 'jsr-meta';

  console.log(
    `[${prefix}] Waiting for ${options.packageNames.length} packages to expose ` +
      `${options.version} in package-level JSR metadata` +
      `${requireLatest ? ' and report it as latest' : ''}` +
      `${options.bypassCdnCache ? ' using cache-busted metadata probes' : ''}.`,
  );

  while (true) {
    const states = await Promise.all(
      options.packageNames.map((name) =>
        fetchPackageMetadataState(name, options.version, options.bypassCdnCache ?? false)
      ),
    );
    const ready = states.every((state) =>
      state.versionVisible && (!requireLatest || state.latestMatches)
    );
    if (ready) {
      console.log(
        `[${prefix}] Ready: all ${options.packageNames.length} packages expose ` +
          `${options.version} in package-level JSR metadata` +
          `${requireLatest ? ' and report it as latest' : ''}` +
          `${options.bypassCdnCache ? ' using cache-busted metadata probes' : ''}.`,
      );
      return;
    }

    const missing = summarizeMissing(states, requireLatest);
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new Error(
        `[${prefix}] Timed out waiting for package metadata after ${
          options.timeoutMs / 60_000
        } minutes. Missing: ${missing}`,
      );
    }

    console.log(
      `[${prefix}] Attempt ${attempt}: metadata not ready. Missing: ${missing}`,
    );
    await sleep(Math.min(options.intervalMs, remainingMs));
    attempt++;
  }
}

async function main(): Promise<void> {
  const options = await buildOptions();
  const packages = sortPackages(await readPackages());
  await waitForJsrPackageMetadata({
    packageNames: packages.map((pkg) => pkg.name),
    version: options.version,
    timeoutMs: options.timeoutMs,
    intervalMs: options.intervalMs,
    requireLatest: true,
    bypassCdnCache: options.bypassCdnCache,
  });
}

if (import.meta.main) {
  await main();
}
