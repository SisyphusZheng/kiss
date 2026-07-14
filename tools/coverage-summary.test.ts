import { assertEquals } from '@std/assert';
import {
  isPackageSource,
  isProductionPackageSource,
  isToolsLibSource,
  parseLcov,
} from './coverage-summary.ts';

const SAMPLE = [
  'SF:/packages/element/src/foo.ts',
  'DA:1,1',
  'DA:2,0',
  'end_of_record',
  'SF:/tools/lib/bar.ts',
  'DA:1,1',
  'end_of_record',
  'SF:/packages/element/src/__tests__/foo.test.ts',
  'DA:1,1',
  'end_of_record',
].join('\n');

Deno.test('scope predicates classify package and tools/lib sources', () => {
  assertEquals(isPackageSource('/packages/element/src/foo.ts'), true);
  assertEquals(isPackageSource('/tools/lib/bar.ts'), false);
  assertEquals(isToolsLibSource('/tools/lib/bar.ts'), true);
  assertEquals(isToolsLibSource('/packages/element/src/foo.ts'), false);
  assertEquals(isProductionPackageSource('/packages/element/src/foo.ts'), true);
  assertEquals(isProductionPackageSource('/tools/lib/bar.ts'), true);
});

Deno.test('parseLcov scopes packages and tools/lib separately', () => {
  const packages = parseLcov(SAMPLE, isPackageSource);
  assertEquals(packages.lines, { covered: 1, total: 2, percentage: 50 });

  const tools = parseLcov(SAMPLE, isToolsLibSource);
  assertEquals(tools.lines, { covered: 1, total: 1, percentage: 100 });
});

Deno.test('parseLcov excludes __tests__ files from the default scope', () => {
  const summary = parseLcov(SAMPLE);
  assertEquals(summary.lines, { covered: 2, total: 3, percentage: (2 / 3) * 100 });
});
