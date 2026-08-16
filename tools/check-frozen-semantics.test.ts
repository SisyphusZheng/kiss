import { assert, assertEquals } from '@std/assert';
import {
  evaluate,
  failureMessage,
  findFrozenChanges,
  hasAmendmentReference,
} from './check-frozen-semantics.ts';

Deno.test('freeze: findFrozenChanges flags each ADR-0122 frozen path', () => {
  const hits = findFrozenChanges([
    'packages/app/src/authoring.ts',
    'packages/adapter-vite/src/internal/ssg/entry-codegen.ts',
    'packages/adapter-vite/src/internal/ssg/form-enhance.ts',
    'packages/adapter-vite/src/internal/ssg/morph-align.ts',
    'packages/adapter-vite/src/internal/ssg/morph-focus-restore.ts',
    'packages/element/src/internal/protocol/data.ts',
    'packages/adapter-vite/src/cli/start.ts',
    'packages/adapter-vite/src/cli/build.ts',
  ]);
  assertEquals(hits.length, 8);
  assert(hits.every((h) => h.citation.startsWith('ADR-0122')));
});

Deno.test('freeze: findFrozenChanges ignores non-frozen paths', () => {
  const hits = findFrozenChanges([
    'packages/element/src/index.ts', // exports: gated by interface:snapshot, not here
    'packages/adapter-vite/src/internal/ssg/ssg-render.ts',
    'packages/adapter-vite/src/cli/build-client.ts',
    'packages/app/src/model.ts',
    'docs/current/VERSION_PLAN.md',
  ]);
  assertEquals(hits, []);
});

Deno.test('freeze: docs/adr change is itself an amendment reference', () => {
  assert(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts', 'docs/adr/ADR-0130-x.md'],
    }),
  );
});

Deno.test('freeze: ADR token in commit message satisfies the rule', () => {
  assert(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts'],
      commitMessage: 'fix(app): relax loader error encoding per ADR-0131',
    }),
  );
});

Deno.test('freeze: ADR token in PR body satisfies the rule', () => {
  assert(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts'],
      commitMessage: 'fix(app): adjust loader',
      prBody: 'Amends the loop contract; see ADR-0131.',
    }),
  );
});

Deno.test('freeze: citing the frozen baseline ADR-0122 alone is not compliance', () => {
  assertEquals(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts'],
      commitMessage: 'fix(app): adjust loader per ADR-0122',
    }),
    false,
  );
});

Deno.test('freeze: citing the frozen baseline ADR-0119 alone is not compliance', () => {
  assertEquals(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts'],
      prBody: 'Frozen since ADR-0119.',
    }),
    false,
  );
});

Deno.test('freeze: baseline citation plus an amendment ADR passes', () => {
  assert(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts'],
      commitMessage: 'fix(app): amend ADR-0122 loop contract per ADR-0129',
    }),
  );
});

Deno.test('freeze: citing ADR-0129 alone passes', () => {
  assert(
    hasAmendmentReference({
      changedPaths: ['packages/app/src/authoring.ts'],
      commitMessage: 'fix(app): adjust loader per ADR-0129',
    }),
  );
});

Deno.test('freeze: plain docs change without frozen paths passes', () => {
  const result = evaluate({
    changedPaths: ['docs/current/STATUS.md'],
    commitMessage: 'docs: status',
  });
  assertEquals(result.ok, true);
  assertEquals(result.frozenChanges, []);
});

Deno.test('freeze: frozen path without any reference fails', () => {
  const result = evaluate({
    changedPaths: ['packages/adapter-vite/src/internal/ssg/entry-codegen.ts'],
    commitMessage: 'refactor(adapter): tidy codegen',
    prBody: 'cleanup',
  });
  assertEquals(result.ok, false);
  const msg = failureMessage(result);
  assert(msg.includes('ADR-0122'));
  assert(msg.includes('docs/adr/'));
  assert(msg.includes('ADR-NNNN'));
  assert(msg.includes('frozen baseline'));
});

Deno.test('freeze: frozen path plus docs/adr change passes', () => {
  const result = evaluate({
    changedPaths: ['packages/element/src/internal/protocol/data.ts', 'docs/adr/ADR-0129-y.md'],
  });
  assertEquals(result.ok, true);
  assertEquals(result.frozenChanges.length, 1);
});
