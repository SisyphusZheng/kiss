/**
 * @kissjs/core - build-context.ts tests (Deno)
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import { KissBuildContext } from '../src/build-context.ts';

Deno.test('KissBuildContext creates instance without error', () => {
  const ctx = new KissBuildContext({});
  assertExists(ctx);
});

Deno.test('KissBuildContext has empty default mutable state', () => {
  const ctx = new KissBuildContext({});

  // Empty state
  assertEquals(ctx.honoEntryCode, '');
  assertEquals(ctx.islandTagNames.length, 0);
  assertEquals(ctx.packageIslands.length, 0);
  assertEquals(ctx.buildCompleted, false);
  assertEquals(ctx.resolvedConfig, null);
  assertEquals(ctx.userResolveAlias, null);
});

Deno.test('KissBuildContext reset clears all mutable state', () => {
  const ctx = new KissBuildContext({});

  // Mutate
  ctx.honoEntryCode = 'test code';
  ctx.islandTagNames = ['a', 'b'];
  ctx.packageIslands = [{ tagName: 'x', modulePath: './x', strategy: 'lazy' }];
  ctx.buildCompleted = true;
  ctx.resolvedConfig = {} as unknown as NonNullable<typeof ctx.resolvedConfig>;
  ctx.userResolveAlias = { '@kissjs/ui': './ui' };

  ctx.reset();

  assertEquals(ctx.honoEntryCode, '');
  assertEquals(ctx.islandTagNames.length, 0);
  assertEquals(ctx.packageIslands.length, 0);
  assertEquals(ctx.buildCompleted, false);
  assertEquals(ctx.resolvedConfig, null);
  assertEquals(ctx.userResolveAlias, null);
});
