export const PACKAGE_VERSION = '0.41.2';
export const PACKAGE_VERSION_TAG = `v${PACKAGE_VERSION}`;
export const ACTIVE_EXECUTION_VERSION = 'v0.41.2';
export const RETAINED_PACKAGE_NAMES = Object.freeze([
  '@openelement/adapter-vite',
  '@openelement/app',
  '@openelement/create',
  '@openelement/element',
  '@openelement/ui',
]);
export const REMOVED_PACKAGE_NAMES = Object.freeze([
  '@openelement/adapter-lit',
  '@openelement/adapter-react',
  '@openelement/adapter-vanilla',
  '@openelement/cem',
  '@openelement/compat-check',
  '@openelement/content',
  '@openelement/core',
  '@openelement/elements',
  '@openelement/hub',
  '@openelement/protocol',
  '@openelement/protocols',
  '@openelement/router',
  '@openelement/rpc',
  '@openelement/runtime',
  '@openelement/signal',
  '@openelement/signals',
  '@openelement/ssg',
  '@openelement/style-sheet',
]);
export const REMOVED_PACKAGE_DIRECTORY_NAMES = Object.freeze([
  '@openelement/adapter-lit',
  '@openelement/adapter-react',
  '@openelement/adapter-vanilla',
  '@openelement/cem',
  '@openelement/compat-check',
  '@openelement/elements',
  '@openelement/hub',
  '@openelement/protocols',
  '@openelement/rpc',
  '@openelement/runtime',
  '@openelement/signals',
  '@openelement/style-sheet',
]);
export const PACKAGE_COUNT = RETAINED_PACKAGE_NAMES.length;
export const NITRO_COMPATIBILITY_DATE = '2026-06-12';

// The package line being replaced on the next release bump. This is the
// single source of truth for the "from" side of version-anchor replacements
// (see buildVersionAnchorReplacements in tools/autoflow/release.ts). It is
// kept in sync automatically by updateProjectConstants() during a bump.
export const PREVIOUS_PACKAGE_VERSION = '0.41.1';
export const PREVIOUS_PACKAGE_VERSION_TAG = `v${PREVIOUS_PACKAGE_VERSION}`;

/**
 * Version strings that must never reappear in the head anchor zone of the
 * governed docs (check-version-anchors.ts) or in "published as"-style
 * currency claims (check-strategic-docs.ts). Derived from
 * PREVIOUS_PACKAGE_VERSION plus the enumerable pre-release line before it, so
 * the set stays honest across bumps without a hand-maintained list. A stable
 * (non-prerelease) previous line enumerates no earlier history: its
 * predecessors are not mechanically derivable.
 */
export function stalePackageVersionClaims(): string[] {
  const claims = [PREVIOUS_PACKAGE_VERSION, PREVIOUS_PACKAGE_VERSION_TAG];
  const match = PREVIOUS_PACKAGE_VERSION.match(/^(\d+\.\d+\.\d+)-([a-zA-Z]+)\.(\d+)$/u);
  if (match) {
    const [, base, preName, preNum] = match;
    for (let n = Number(preNum) - 1; n >= 1; n--) {
      claims.push(`${base}-${preName}.${n}`, `v${base}-${preName}.${n}`);
    }
  }
  return claims;
}
