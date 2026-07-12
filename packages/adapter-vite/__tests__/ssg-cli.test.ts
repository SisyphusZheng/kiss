/**
 * @openelement/adapter-vite - ssg.ts CLI tests
 *
 * Tests the standalone SSG CLI module imports and type exports.
 * Full SSG pipeline tests are in ssg-render.test.ts.
 */

Deno.test('ssg CLI - module can be imported', async () => {
  const mod = await import('../src/internal/ssg/index.ts');
  _assert(mod !== null && typeof mod === 'object');
});

Deno.test('ssg CLI - ssgRender is exported from ssg-render', async () => {
  const mod = await import('../src/internal/ssg/index.ts');
  _assert(typeof mod.ssgRender === 'function');
});

function _assert(condition: boolean): void {
  if (!condition) throw new Error('Assertion failed');
}
