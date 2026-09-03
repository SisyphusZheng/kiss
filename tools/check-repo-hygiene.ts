import { exists } from './lib/fs.ts';
import { gitTrackedFiles, gitTrackedIgnoredFiles, gitUntrackedFiles } from './lib/git.ts';
import { REMOVED_PACKAGE_DIRECTORY_NAMES } from './project-constants.ts';

type Failure = {
  path: string;
  message: string;
};

const removedPackageNames = [...REMOVED_PACKAGE_DIRECTORY_NAMES];
const removedPackageDirs = removedPackageNames.map((name) =>
  `packages/${name.replace('@openelement/', '')}`
);

const removedAutoflow2Paths = [
  'tools/autoflow/mod.ts',
  'tools/autoflow/mod-check.ts',
  'tools/autoflow/mod-evolve.ts',
  'tools/autoflow/mod-health.ts',
  'tools/autoflow/fixtures',
  'tools/autoflow/readers',
  'tools/autoflow/prompts',
  'tools/autoflow/cells.ts',
  'tools/autoflow/state-machine.ts',
  'tools/autoflow/cell-state-machine.ts',
  'tools/autoflow/evidence-ledger.ts',
  'tools/autoflow/agent-code-generator.ts',
];

const forbiddenRootTracked = [
  /^bench\//,
  /^coverage\//,
  /^dist\//,
  /^custom-dist\//,
  /^dist-test-/,
  /^playwright-report\//,
  /^test-results\//,
  /^debug\.log$/,
  /^hub-submission\.json$/,
  /^hub-index\//,
];

const forbiddenUntrackedResidue = [
  /^\.github\/workflows\/[^/]+\.ya?ml$/,
  /^ocr\.exe$/,
  /^hub-submission\.json$/,
];

const activeScanExtensions = /\.(ts|tsx|js|jsx|json|md|yml|yaml)$/;
const activeScanRoots = [
  'deno.json',
  'README.md',
  'README.zh.md',
  '.githooks/',
  '.github/workflows/',
  'packages/',
  'tools/',
  'docs/current/',
  'docs/roadmap/',
  'docs/status/STATUS.md',
];

const allowedRemovedPackageMentions = [
  'tools/check-package-surface.ts',
  'tools/check-repo-hygiene.ts',
  'tools/project-constants.ts',
  'docs/current/PACKAGE_SURFACE.md',
  'docs/current/VERSION_PLAN.md',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'README.md',
  'README.zh.md',
];

// Vendored MIT LICENSE files are intentionally tracked despite the vendor/
// directory being gitignored. Force-adding them is required so that the
// attribution files are included in the repository while the rest of the
// vendored code remains ignored.
const allowedTrackedIgnoredPaths = [
  /^vendor\/jsr\.io\/(@[^/]+\/)?[^/]+\/LICENSE$/,
];

// Tracked credential files are always failures. The content-level secret
// scan is owned by gitleaks (#1156 B2.6, .gitleaks.toml); this file-name
// tripwire stays because gitleaks does not flag a tracked-but-empty
// credential file. Placeholder templates (.env.example/.env.sample/
// .env.template) are allowed by name.
const allowedCredentialTemplates = /(?:^|\/)\.env(?:\.example|\.sample|\.template)$/;
const forbiddenTrackedSecretFiles = [
  /(?:^|\/)\.env(?:\.[^/]+)?$/,
  /(?:^|\/)[^/]+\.pem$/,
  /(?:^|\/)id_rsa(?:\.pub)?$/,
];

// Large tracked binaries: intentional design/e2e/fixture assets are listed;
// anything else above 1 MiB should not enter the repository.
export const LARGE_BINARY_LIMIT_BYTES = 1024 * 1024;
const allowedLargeBinaryDirs = [
  /^www\/design\/mockups\//,
  /^www\/e2e\/visual-baselines\.spec\.ts-snapshots\//,
  /^examples\/[^/]+\/fixtures\//,
  // Homepage cinematic hero media (dragon video/stills): shipped site assets,
  // served from www/public — intentional design payload, not stray binaries.
  /^www\/public\/assets\/dragon-/,
];

export function isForbiddenRootTracked(path: string): boolean {
  return forbiddenRootTracked.some((pattern) => pattern.test(path));
}

export function isForbiddenUntrackedResidue(path: string): boolean {
  return forbiddenUntrackedResidue.some((pattern) => pattern.test(path));
}

export function isAllowedTrackedIgnored(path: string): boolean {
  return allowedTrackedIgnoredPaths.some((pattern) => pattern.test(path));
}

export function isAllowedRemovedPackageMention(path: string): boolean {
  return allowedRemovedPackageMentions.includes(path);
}

export function isActiveScanFile(path: string): boolean {
  if (!activeScanExtensions.test(path)) return false;
  return activeScanRoots.some((root) => path === root || path.startsWith(root));
}

/** Failure message when `path` is a tracked credential file, else undefined. */
export function credentialFileFailure(path: string): string | undefined {
  if (allowedCredentialTemplates.test(path)) return undefined;
  if (forbiddenTrackedSecretFiles.some((pattern) => pattern.test(path))) {
    return 'credential file is tracked';
  }
  return undefined;
}

/** Failure message when a tracked binary exceeds the size limit outside the allowed dirs. */
export function classifyTrackedBinary(path: string, size: number): string | undefined {
  if (allowedLargeBinaryDirs.some((pattern) => pattern.test(path))) return undefined;
  if (!/\.(?:png|jpe?g|gif|webp|pdf|zip|woff2?|mp4|mov|ico|icns)$/i.test(path)) return undefined;
  if (size <= LARGE_BINARY_LIMIT_BYTES) return undefined;
  return `tracked binary exceeds ${LARGE_BINARY_LIMIT_BYTES / 1024} KiB (${size} bytes)`;
}

async function main(): Promise<void> {
  const failures: Failure[] = [];

  for (const dir of removedPackageDirs) {
    if (await exists(dir)) {
      failures.push({ path: dir, message: 'removed package directory is still present' });
    }
  }

  for (const path of removedAutoflow2Paths) {
    if (await exists(path)) {
      failures.push({ path, message: 'AutoFlow2 remnant is still present' });
    }
  }

  const files = await gitTrackedFiles();
  for (const file of files) {
    if (!(await exists(file))) continue;
    if (isForbiddenRootTracked(file)) {
      failures.push({ path: file, message: 'generated or archived root artifact is tracked' });
    }
  }

  for (const file of await gitUntrackedFiles()) {
    if (isForbiddenUntrackedResidue(file)) {
      failures.push({ path: file, message: 'untracked workflow or root tool residue is present' });
    }
  }

  for (const file of await gitTrackedIgnoredFiles()) {
    if (isAllowedTrackedIgnored(file)) continue;
    failures.push({ path: file, message: 'tracked file is also ignored by .gitignore' });
  }

  for (const file of files.filter(isActiveScanFile)) {
    if (isAllowedRemovedPackageMention(file)) continue;
    let text = '';
    try {
      text = await Deno.readTextFile(file);
    } catch {
      continue;
    }
    for (const packageName of removedPackageNames) {
      if (text.includes(packageName)) {
        failures.push({
          path: file,
          message: `active file references removed package ${packageName}`,
        });
      }
    }
  }

  for (const file of files) {
    const credentialFailure = credentialFileFailure(file);
    if (credentialFailure) failures.push({ path: file, message: credentialFailure });
    try {
      const stat = await Deno.stat(file);
      const binaryFailure = classifyTrackedBinary(file, stat.size);
      if (binaryFailure) failures.push({ path: file, message: binaryFailure });
    } catch {
      continue;
    }
  }

  if (failures.length > 0) {
    console.error('Repo hygiene check failed:');
    for (const failure of failures) console.error(`- ${failure.path}: ${failure.message}`);
    Deno.exit(1);
  }

  console.log('Repo hygiene check passed.');
}

if (import.meta.main) await main();
