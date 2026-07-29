export const DEFAULT_REGISTRY_DELAYS_MS = [0, 1_000, 2_000, 4_000, 8_000, 15_000] as const;

export class NpmViewError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = 'NpmViewError';
  }
}

export type NpmReleaseQuery = (specifier: string, field: string) => Promise<string>;

export interface VerifyNpmReleaseOptions {
  version: string;
  packages: string[];
  query: NpmReleaseQuery;
  sleep?: (ms: number) => Promise<void>;
  delaysMs?: readonly number[];
  log?: (message: string) => void;
}

export function prereleaseTag(version: string): 'alpha' | 'beta' | 'rc' | null {
  const match = version.match(/^\d+\.\d+\.\d+-(alpha|beta|rc)\.\d+$/u);
  if (match) return match[1] as 'alpha' | 'beta' | 'rc';
  if (/^\d+\.\d+\.\d+$/u.test(version)) return null;
  throw new Error(`Expected version x.y.z or x.y.z-alpha|beta|rc.n, got: ${version}`);
}

async function verifyField(
  label: string,
  specifier: string,
  field: string,
  expected: string,
  options: Required<Pick<VerifyNpmReleaseOptions, 'query' | 'sleep' | 'delaysMs'>>,
): Promise<void> {
  let lastObserved = '<not queried>';
  let lastDiagnostic = '';

  for (let attempt = 0; attempt < options.delaysMs.length; attempt++) {
    const delay = options.delaysMs[attempt];
    if (delay > 0) await options.sleep(delay);
    try {
      const observed = await options.query(specifier, field);
      lastObserved = observed;
      lastDiagnostic = '';
      if (observed === expected) return;
    } catch (error) {
      if (!(error instanceof NpmViewError) || !error.retryable) throw error;
      lastDiagnostic = error.message;
      lastObserved = '<query failed>';
    }
  }

  const detail = lastDiagnostic ? `; final diagnostic: ${lastDiagnostic}` : '';
  throw new Error(
    `${label} verification failed after ${options.delaysMs.length} attempts: ` +
      `expected=${expected}, observed=${lastObserved}${detail}`,
  );
}

export async function verifyNpmRelease(options: VerifyNpmReleaseOptions): Promise<void> {
  const tag = prereleaseTag(options.version);
  const runtime = {
    query: options.query,
    sleep: options.sleep ??
      ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))),
    delaysMs: options.delaysMs ?? DEFAULT_REGISTRY_DELAYS_MS,
  };
  if (runtime.delaysMs.length === 0 || runtime.delaysMs[0] !== 0) {
    throw new Error('Registry retry schedule must start with an immediate attempt.');
  }

  for (const name of options.packages) {
    const packageName = `@openelement/${name}`;
    await verifyField(
      `${packageName} version`,
      `${packageName}@${options.version}`,
      'version',
      options.version,
      runtime,
    );
    if (tag) {
      // #607: prerelease only requires its line tag (alpha/beta/rc). Do not
      // require latest === prerelease — latest must remain on stable.
      await verifyField(
        `${packageName} dist-tags.${tag}`,
        packageName,
        `dist-tags.${tag}`,
        options.version,
        runtime,
      );
      options.log?.(
        `${packageName}@${options.version}: ${tag} dist-tag verified (latest left on stable)`,
      );
    } else {
      await verifyField(
        `${packageName} dist-tags.latest`,
        packageName,
        'dist-tags.latest',
        options.version,
        runtime,
      );
      options.log?.(
        `${packageName}@${options.version}: latest dist-tag verified (stable)`,
      );
    }
  }
}
