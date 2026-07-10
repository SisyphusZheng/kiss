import { assertEquals } from '@std/assert';
import { isProductionPackageSource, parseLcov } from './coverage-summary.ts';

Deno.test('coverage scope includes package runtime source and excludes generated/apps/tests', () => {
  assertEquals(isProductionPackageSource('/repo/packages/core/src/csr.ts'), true);
  assertEquals(isProductionPackageSource('/repo/packages/core/src/__tests__/csr.test.ts'), false);
  assertEquals(isProductionPackageSource('/repo/www/dist/server/entry.js'), false);
  assertEquals(isProductionPackageSource('/repo/tools/check-coverage.ts'), false);
});

Deno.test('LCOV parser reports line, branch, and function coverage for production packages', () => {
  const summary = parseLcov(`SF:/repo/packages/core/src/csr.ts
FN:1,render
FNDA:1,render
FNF:1
FNH:1
BRDA:2,0,0,1
BRDA:2,0,1,0
BRF:2
BRH:1
DA:1,1
DA:2,0
LF:2
LH:1
end_of_record
SF:/repo/www/dist/server/entry.js
FNDA:0,generated
DA:1,0
end_of_record`);

  assertEquals(summary.lines, { covered: 1, total: 2, percentage: 50 });
  assertEquals(summary.branches, { covered: 1, total: 2, percentage: 50 });
  assertEquals(summary.functions, { covered: 1, total: 1, percentage: 100 });
});

Deno.test('LCOV parser unions duplicate records for the same source', () => {
  const summary = parseLcov(`SF:/repo/packages/core/src/csr.ts
FNDA:0,render
BRDA:2,0,0,0
DA:1,0
end_of_record
SF:/repo/packages/core/src/csr.ts
FNDA:1,render
BRDA:2,0,0,1
DA:1,1
end_of_record`);

  assertEquals(summary.lines.percentage, 100);
  assertEquals(summary.branches.percentage, 100);
  assertEquals(summary.functions.percentage, 100);
});
