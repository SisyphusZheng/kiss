import { assertEquals } from 'jsr:@std/assert@^1.0.0';

Deno.test('SSG bridge: adapter-vite compatibility exports delegate to internal SSG helpers', async () => {
  const adapter = await import('../src/cli/ssg-render.ts');
  const ssg = await import('../src/internal/ssg/index.ts');

  assertEquals(adapter.resolveDynamicRoutePath, ssg.resolveDynamicRoutePath);
  assertEquals(typeof adapter.ssgRender, 'function');
  assertEquals(typeof adapter.createSsgRenderEvidence, 'function');
});
