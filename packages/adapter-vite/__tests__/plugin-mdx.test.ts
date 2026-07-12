import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { mdxPlugin } from '../src/plugin-mdx.ts';

Deno.test('mdxPlugin exposes a pre-transform Vite plugin', () => {
  const plugin = mdxPlugin();
  assertEquals(plugin.name, 'open:mdx');
  assertEquals(plugin.enforce, 'pre');
});

Deno.test('mdxPlugin transforms MDX with openElement JSX runtime', async () => {
  const plugin = mdxPlugin();
  const transform = plugin.transform;
  if (typeof transform !== 'function') {
    throw new Error('MDX plugin did not expose transform hook');
  }
  const result = await transform.call(
    {} as never,
    '# Hello\n\n<open-counter client:idle />',
    '/content/example.mdx',
  );
  const code = String(typeof result === 'string' ? result : result?.code ?? '');
  assertStringIncludes(code, '@openelement/element');
  assertStringIncludes(code, 'open-counter');
});
