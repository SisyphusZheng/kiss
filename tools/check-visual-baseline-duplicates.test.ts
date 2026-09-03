import { assertEquals } from '@std/assert';
import { findDuplicateGroups } from './check-visual-baseline-duplicates.ts';

// M15 (#1230): duplicate grouping is the pass/fail decision of the
// check:visual-baselines gate — a grouping bug would turn a real duplicate
// (failure) into a pass.

Deno.test('visual baselines: exact-hash duplicates group, distinct content does not', () => {
  const groups = findDuplicateGroups([
    { name: 'b.png', bytes: 10, hash: 'aaa' },
    { name: 'a.png', bytes: 20, hash: 'aaa' },
    { name: 'c.png', bytes: 30, hash: 'bbb' },
  ]);
  assertEquals(groups.length, 1);
  // Sorted by name inside the group, independent of input order.
  assertEquals(groups[0].map((baseline) => baseline.name), ['a.png', 'b.png']);
});

Deno.test('visual baselines: same byte length with different hashes is not a duplicate', () => {
  assertEquals(
    findDuplicateGroups([
      { name: 'a.png', bytes: 10, hash: 'aaa' },
      { name: 'b.png', bytes: 10, hash: 'bbb' },
    ]),
    [],
  );
});

Deno.test('visual baselines: empty and singleton inputs pass', () => {
  assertEquals(findDuplicateGroups([]), []);
  assertEquals(findDuplicateGroups([{ name: 'a.png', bytes: 1, hash: 'x' }]), []);
});
