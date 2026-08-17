import { assertEquals, assertExists } from '@std/assert';

const siteModules = [
  ['open-lab-panel', '../app/site-ui/open-lab-panel.tsx'],
  ['open-lab-stage', '../app/site-ui/open-lab-stage.tsx'],
  ['open-standards-visual', '../app/site-ui/open-standards-visual.tsx'],
] as const;

for (const [tagName, path] of siteModules) {
  Deno.test(`site UI owns ${tagName}`, async () => {
    const mod = await import(path);
    assertEquals(mod.tagName, tagName);
    assertExists(mod.default ?? Object.values(mod).find((value) => typeof value === 'function'));
  });
}

Deno.test('open-layout is an explicitly hydrated app-shell island', async () => {
  const mod = await import('../app/islands/open-layout.tsx');
  assertEquals(mod.tagName, 'open-layout');
  assertEquals(mod.openElement, { hydrate: 'load', ssr: true, dsd: true });
  assertExists(mod.default);
});
