import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { join } from 'node:path';
import { OpenElementBuildContext } from '../src/build-context.ts';
import { collectBuildArtifacts, createProductionBuildPlan } from '../src/build-plan.ts';

Deno.test('production BuildPlan reuses Phase 1 discoveries and collects emitted artifacts', async () => {
  const root = await Deno.makeTempDir({ prefix: 'oe-build-plan-' });
  try {
    const ctx = new OpenElementBuildContext({ mode: 'ssg' });
    ctx.phase3.root = root;
    ctx.phase3.outDir = 'dist';
    ctx.phase3.islandsDir = 'app/islands';
    ctx.phase1.cachedRoutes = [{
      path: '/',
      filePath: 'app/routes/index.tsx',
      type: 'page',
      varName: 'Page0',
      tagName: 'home-page',
    }];
    ctx.phase1.islandTagNames = ['counter-island'];
    ctx.phase1.islandFiles = ['counter.ts'];
    ctx.phase1.islandMeta = { 'counter-island': { hydrate: 'idle', ssr: true } };

    const plan = createProductionBuildPlan(ctx);
    await Deno.mkdir(join(root, 'dist', 'client'), { recursive: true });
    await Deno.writeTextFile(join(root, 'dist', 'index.html'), '<html>ok</html>');
    await Deno.writeTextFile(join(root, 'dist', 'client', 'entry.js'), 'export {};');

    const result = collectBuildArtifacts(plan);
    assertEquals(result.success, true);
    assertEquals(result.manifest.routes[0].path, '/');
    assertEquals(result.manifest.islands[0].tagName, 'counter-island');
    assertEquals(result.pages.length, 1);
    assertEquals(result.clientAssets[0].sizeBytes > 0, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('production BuildPlan returns typed failure evidence for a missing output', () => {
  const ctx = new OpenElementBuildContext({ mode: 'ssg' });
  ctx.phase3.root = '/definitely/missing/openelement-build';
  const result = collectBuildArtifacts(createProductionBuildPlan(ctx));
  assertEquals(result.success, false);
  assertEquals(result.errors.length, 1);
  assertStringIncludes(result.errors[0], 'no such file or directory');
});
