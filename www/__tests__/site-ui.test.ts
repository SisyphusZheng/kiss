import { assertEquals, assertStringIncludes } from '@std/assert';
import { compileElementSpike } from '../../packages/adapter-vite/src/internal/compiler/semantic-core/compile.ts';

const siteModules = [
  ['open-lab-panel', '../app/site-ui/open-lab-panel.tsx'],
  ['open-lab-stage', '../app/site-ui/open-lab-stage.tsx'],
  ['open-standards-visual', '../app/site-ui/open-standards-visual.tsx'],
] as const;

for (const [tagName, path] of siteModules) {
  Deno.test(`site UI owns compiled ${tagName}`, async () => {
    const url = new URL(path, import.meta.url);
    const result = compileElementSpike(await Deno.readTextFile(url), url.pathname);
    assertEquals(result.program.tag, tagName);
  });
}

Deno.test('open-layout is an explicitly hydrated compiled app-shell island', async () => {
  const url = new URL('../app/islands/open-layout.tsx', import.meta.url);
  const source = await Deno.readTextFile(url);
  assertStringIncludes(
    source,
    "defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true })",
  );
  assertStringIncludes(source, "@element('open-layout')");
  assertStringIncludes(source, 'export default class OpenLayout extends OpenElement');
  const result = compileElementSpike(source, url.pathname);
  assertEquals(result.program.tag, 'open-layout');
  assertEquals(result.program.regions.length, 2);
  assertEquals(
    result.program.metadata.properties.map((property) => property.name),
    ['headerNav', 'footerText', 'siteName'],
  );
});
