import { assert, assertEquals } from '@std/assert';
import {
  findStrategicDocFailures,
  staleCurrencyClaimPatterns,
  strategicChecks,
} from './check-strategic-docs.ts';
import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_PACKAGE_VERSION_TAG,
} from './project-constants.ts';

Deno.test('strategic docs: real repo docs pass every check', () => {
  // main() runs this against disk; keeping it as a test makes the check
  // fixtures honest when docs are edited.
  assertEquals(findStrategicDocFailures((path) => Deno.readTextFileSync(path)), []);
});

Deno.test('stale currency claims: parameterized from project constants', () => {
  const patterns = staleCurrencyClaimPatterns();
  const staleClaims = [
    `The five-package convergence is published as \`${PREVIOUS_PACKAGE_VERSION}\`.`,
    `five-package convergence is published as ${PREVIOUS_PACKAGE_VERSION}`,
    `五包收敛已作为 \`${PREVIOUS_PACKAGE_VERSION}\` 发布。`,
    `completed implementation anchor \`${PREVIOUS_PACKAGE_VERSION_TAG}\``,
  ];
  for (const claim of staleClaims) {
    assert(
      patterns.some((pattern) => pattern.test(claim)),
      `stale claim must be forbidden: ${claim}`,
    );
  }
});

Deno.test('stale currency claims: the current line and history mentions pass', () => {
  const patterns = staleCurrencyClaimPatterns();
  const allowed = [
    // Current line in a currency claim.
    `The five-package convergence is published as \`${PACKAGE_VERSION}\`.`,
    `completed implementation anchor \`${PACKAGE_VERSION_TAG}\``,
    // Boundary: a stale short tag must not match inside the current longer one.
    `五包收敛已作为 \`${PACKAGE_VERSION}\` 发布。`,
    // Historical mention without a currency claim.
    `| \`${PREVIOUS_PACKAGE_VERSION}\` | Correctness reset |`,
    `Alpha.16 closed the previous audit round.`,
  ];
  for (const text of allowed) {
    assert(
      !patterns.some((pattern) => pattern.test(text)),
      `current or historical text must pass: ${text}`,
    );
  }
});

Deno.test('stale currency claims: body-drift heuristics catch stale "current line" sentences', () => {
  const patterns = staleCurrencyClaimPatterns();
  const previousAlpha = PREVIOUS_PACKAGE_VERSION.match(/-alpha\.(\d+)$/u)?.[1] ?? '0';
  const currentAlpha = PACKAGE_VERSION.match(/-alpha\.(\d+)$/u)?.[1];
  const staleClaims = [
    // The pre-fix STATUS.md:14 sentence shape (issue #482).
    `Alpha.${previousAlpha} is the current published and verified line.`,
    `The current verified baseline is \`${PREVIOUS_PACKAGE_VERSION}\`.`,
  ];
  for (const claim of staleClaims) {
    assert(
      patterns.some((pattern) => pattern.test(claim)),
      `stale body claim must be forbidden: ${claim}`,
    );
  }
  const allowed = currentAlpha
    ? [
      // The corrected STATUS.md:14 sentence shape names the current alpha.
      `Alpha.${currentAlpha} is the current published and verified line.`,
      `Alpha.${previousAlpha} remains the previous verified baseline.`,
    ]
    : [
      // On a stable line the current claim names the stable version itself.
      `${PACKAGE_VERSION} is the current published and verified line.`,
      `Alpha.${previousAlpha} remains the previous verified baseline.`,
    ];
  for (const text of allowed) {
    assert(
      !patterns.some((pattern) => pattern.test(text)),
      `corrected body text must pass: ${text}`,
    );
  }
});

Deno.test('stale currency claims: failures are reported through the check pipeline', () => {
  const check = strategicChecks().find((item) =>
    item.name === 'stale version and stale roadmap claims are absent'
  );
  assert(check !== undefined);
  const files: Record<string, string> = {};
  for (const file of check.files) files[file] = 'innocent content';
  files['docs/roadmap/ROADMAP.md'] =
    `The five-package convergence is published as \`${PREVIOUS_PACKAGE_VERSION}\`.`;
  const failures = findStrategicDocFailures((path) => {
    const text = files[path];
    if (text === undefined) throw new Deno.errors.NotFound(path);
    return text;
  }).filter((failure) => failure.check === check.name);
  assertEquals(failures.length, 1);
  assertEquals(failures[0].file, 'docs/roadmap/ROADMAP.md');
  assert(failures[0].message.includes('forbidden claim matched'));
});
