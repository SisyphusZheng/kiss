export const PACKAGE_VERSION = '0.41.0-alpha.10';
export const PACKAGE_VERSION_TAG = `v${PACKAGE_VERSION}`;
export const ACTIVE_EXECUTION_VERSION = 'v0.41.0-alpha.7';
export const PACKAGE_COUNT = 5;

// The package line being replaced on the next release bump. This is the
// single source of truth for the "from" side of version-anchor replacements
// (see buildVersionAnchorReplacements in tools/autoflow/release.ts). It is
// kept in sync automatically by updateProjectConstants() during a bump.
export const PREVIOUS_PACKAGE_VERSION = '0.41.0-alpha.9';
export const PREVIOUS_PACKAGE_VERSION_TAG = `v${PREVIOUS_PACKAGE_VERSION}`;
