/**
 * Canonical prerelease/version truth (#1231 M16; umbrella #1155).
 *
 * This module is the ONE implementation of the release line-version contract
 * `x.y.z` or `x.y.z-<label>.<n>` (semver without build metadata, `v` prefixes
 * or multi-part prereleases). Every consumer — bump-version, the release
 * autoflow, the npm release verifier and the docs/version gates — imports from
 * here instead of re-rolling its own parse/compare regex.
 *
 * Import-free on purpose: tools/project-constants.ts imports this module and
 * is itself loaded by Nitro/jiti under Node
 * (packages/adapter-vite/__fixtures__/nitro-proof/nitro.config.ts), so nothing
 * here may pull jsr:/npm: specifiers (no @std/semver). The hand-rolled grammar
 * below is exactly the strict domain every consumer already enforced on top of
 * @std/semver.
 */

/**
 * First release line covered by the immutable-tag policy (2.4, #855): every
 * release from 0.41.0-alpha.14 must carry its tag. Single copy — previously
 * hard-coded in both tools/autoflow/release.ts and tools/check-docs-truth.ts.
 */
export const FIRST_TAGGED_VERSION = '0.41.0-alpha.14';

export interface LineVersion {
  major: number;
  minor: number;
  patch: number;
  /** Prerelease label (`alpha`, `beta`, `rc`, …); absent for stable lines. */
  prerelease?: string;
  /** Prerelease sequence number; 0 for stable lines. */
  prereleaseNumber: number;
}

// Strict x.y.z(-label.n): numeric identifiers carry no leading zeros (semver
// rule), the label is alphabetic, and there is no build metadata or prefix.
const LINE_VERSION_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([A-Za-z]+)\.(0|[1-9]\d*))?$/u;

/** Strict parse; throws on anything outside the line-version contract. */
export function parseLineVersion(version: string): LineVersion {
  const match = version.match(LINE_VERSION_RE);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }
  const [, major, minor, patch, label, num] = match;
  const parsed: LineVersion = {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prereleaseNumber: num === undefined ? 0 : Number(num),
  };
  if (label !== undefined) parsed.prerelease = label;
  return parsed;
}

/** Non-throwing variant for gates that probe arbitrary strings. */
export function tryParseLineVersion(version: string): LineVersion | undefined {
  try {
    return parseLineVersion(version);
  } catch {
    return undefined;
  }
}

/** Base/label/sequence of a prerelease line version; undefined for stable or invalid input. */
export function prereleaseParts(
  version: string,
): { base: string; name: string; num: number } | undefined {
  const parsed = tryParseLineVersion(version);
  if (parsed?.prerelease === undefined) return undefined;
  return {
    base: `${parsed.major}.${parsed.minor}.${parsed.patch}`,
    name: parsed.prerelease,
    num: parsed.prereleaseNumber,
  };
}

/**
 * The prerelease sequence number when the version's label equals `name`
 * (e.g. the `alpha` number of `0.41.0-alpha.7`); undefined otherwise. The
 * string form is what the stale-claim regexes interpolate.
 */
export function prereleaseSequence(version: string, name: string): string | undefined {
  const parts = prereleaseParts(version);
  return parts?.name === name ? String(parts.num) : undefined;
}

/** The npm dist-tag channels the release line publishes prereleases under (#607). */
export const PRERELEASE_CHANNELS = ['alpha', 'beta', 'rc'] as const;
export type PrereleaseChannel = typeof PRERELEASE_CHANNELS[number];

/**
 * The prerelease channel of a line version when its label is a publishable
 * channel; undefined for stable lines, invalid input, or non-channel labels.
 */
export function prereleaseChannel(version: string): PrereleaseChannel | undefined {
  const name = prereleaseParts(version)?.name;
  if (name === 'alpha' || name === 'beta' || name === 'rc') return name;
  return undefined;
}

/** Numeric compare over the line-version domain; prerelease < stable at equal base. */
export function compareVersions(a: string, b: string): number {
  const pa = parseLineVersion(a);
  const pb = parseLineVersion(b);
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (pa[key] !== pb[key]) return pa[key] < pb[key] ? -1 : 1;
  }
  if (pa.prerelease === undefined && pb.prerelease === undefined) return 0;
  if (pa.prerelease === undefined) return 1;
  if (pb.prerelease === undefined) return -1;
  if (pa.prerelease !== pb.prerelease) return pa.prerelease < pb.prerelease ? -1 : 1;
  if (pa.prereleaseNumber !== pb.prereleaseNumber) {
    return pa.prereleaseNumber < pb.prereleaseNumber ? -1 : 1;
  }
  return 0;
}

/**
 * Next patch target: a prerelease line advances its prerelease counter
 * (0.44.0-beta.1 → 0.44.0-beta.2), a stable line its patch (0.43.3 → 0.43.4).
 */
export function nextPatchVersion(version: string): string {
  const parsed = parseLineVersion(version);
  if (parsed.prerelease !== undefined) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}-${parsed.prerelease}.${
      parsed.prereleaseNumber + 1
    }`;
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

/** Accepts the operator shorthand `x.y.z-alphaN` and normalizes to `x.y.z-alpha.N`. */
export function normalizeReleaseVersion(version: string): string {
  return version.replace(/-(alpha|beta|rc)(\d+)$/u, '-$1.$2');
}
