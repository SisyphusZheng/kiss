import { assertEquals, assertExists } from '@std/assert';

const siteModules = [
  ['open-brand-mark', '../app/site-ui/open-brand-mark.tsx'],
  ['open-lab-panel', '../app/site-ui/open-lab-panel.tsx'],
  ['open-lab-stage', '../app/site-ui/open-lab-stage.tsx'],
  ['open-standards-visual', '../app/site-ui/open-standards-visual.tsx'],
  ['open-hero-ping', '../app/site-ui/open-hero-ping.tsx'],
  ['open-layout', '../app/site-ui/open-layout.tsx'],
] as const;

for (const [tagName, path] of siteModules) {
  Deno.test(`site UI owns ${tagName}`, async () => {
    const mod = await import(path);
    assertEquals(mod.tagName, tagName);
    assertExists(mod.default ?? Object.values(mod).find((value) => typeof value === 'function'));
  });
}
