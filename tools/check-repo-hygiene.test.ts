import { assertEquals } from '@std/assert';
import {
  classifyTrackedBinary,
  credentialFileFailure,
  isActiveScanFile,
  isAllowedRemovedPackageMention,
  isAllowedTrackedIgnored,
  isForbiddenRootTracked,
  isForbiddenUntrackedResidue,
  LARGE_BINARY_LIMIT_BYTES,
} from './check-repo-hygiene.ts';

// M15 (#1230): the hygiene gate's allow/deny classification is decision logic
// that can turn a failure into a success (a too-broad template carve-out or
// allowlist silently greens a tracked credential or binary). Pin it.

Deno.test('hygiene: tracked credential files fail, placeholder templates pass', () => {
  // Real credentials are always failures.
  assertEquals(typeof credentialFileFailure('.env'), 'string');
  assertEquals(typeof credentialFileFailure('packages/app/.env'), 'string');
  assertEquals(typeof credentialFileFailure('.env.production'), 'string');
  assertEquals(typeof credentialFileFailure('certs/server.pem'), 'string');
  assertEquals(typeof credentialFileFailure('.ssh/id_rsa'), 'string');
  assertEquals(typeof credentialFileFailure('id_rsa.pub'), 'string');
  // The template carve-out is exact: only .env.example/.sample/.template.
  assertEquals(credentialFileFailure('.env.example'), undefined);
  assertEquals(credentialFileFailure('examples/x/.env.sample'), undefined);
  assertEquals(credentialFileFailure('.env.template'), undefined);
  // Non-credentials pass.
  assertEquals(credentialFileFailure('README.md'), undefined);
  assertEquals(credentialFileFailure('tools/environment.ts'), undefined);
});

Deno.test('hygiene: large tracked binaries fail outside the allowed asset dirs', () => {
  const over = LARGE_BINARY_LIMIT_BYTES + 1;
  // Over-limit binaries are failures outside the allowlist...
  assertEquals(typeof classifyTrackedBinary('packages/element/logo.png', over), 'string');
  // ...and allowed in the intentional asset directories.
  assertEquals(classifyTrackedBinary('www/design/mockups/home.png', over), undefined);
  assertEquals(
    classifyTrackedBinary('www/e2e/visual-baselines.spec.ts-snapshots/home.png', over),
    undefined,
  );
  assertEquals(classifyTrackedBinary('examples/x/fixtures/banner.mp4', over), undefined);
  assertEquals(classifyTrackedBinary('www/public/assets/dragon-hero.mp4', over), undefined);
  // Under the limit or non-binary extensions are not this check's concern.
  assertEquals(classifyTrackedBinary('packages/element/logo.png', 1024), undefined);
  assertEquals(classifyTrackedBinary('packages/element/big.ts', over), undefined);
});

Deno.test('hygiene: root generated artifacts are tracked-file failures, nested ones are not', () => {
  assertEquals(isForbiddenRootTracked('dist/server/index.js'), true);
  assertEquals(isForbiddenRootTracked('playwright-report/index.html'), true);
  assertEquals(isForbiddenRootTracked('debug.log'), true);
  // Anchored at the repo root: package-level build output is gitignored, not
  // this tripwire's concern.
  assertEquals(isForbiddenRootTracked('packages/element/dist/mod.js'), false);
  assertEquals(isForbiddenRootTracked('packages/element/src/mod.ts'), false);
});

Deno.test('hygiene: untracked workflow residue fails, other untracked files pass', () => {
  assertEquals(isForbiddenUntrackedResidue('.github/workflows/debug.yml'), true);
  assertEquals(isForbiddenUntrackedResidue('hub-submission.json'), true);
  assertEquals(isForbiddenUntrackedResidue('notes.md'), false);
});

Deno.test('hygiene: only vendored license attributions may be tracked-and-ignored', () => {
  assertEquals(isAllowedTrackedIgnored('vendor/jsr.io/@std/fs/LICENSE'), true);
  assertEquals(isAllowedTrackedIgnored('vendor/jsr.io/std/LICENSE'), true);
  assertEquals(isAllowedTrackedIgnored('vendor/jsr.io/@std/fs/mod.ts'), false);
});

Deno.test('hygiene: removed-package mention scan covers active roots only', () => {
  assertEquals(isActiveScanFile('deno.json'), true);
  assertEquals(isActiveScanFile('packages/element/src/mod.ts'), true);
  assertEquals(isActiveScanFile('tools/check-repo-hygiene.ts'), true);
  // docs/audit, docs/release and other historical trees are not scanned.
  assertEquals(isActiveScanFile('docs/audit/2026-01-01-x.md'), false);
  assertEquals(isActiveScanFile('packages/element/README.png'), false);
  // The allowlist is exact-path, not substring.
  assertEquals(isAllowedRemovedPackageMention('tools/check-repo-hygiene.ts'), true);
  assertEquals(isAllowedRemovedPackageMention('tools/check-repo-hygiene-extra.ts'), false);
});
