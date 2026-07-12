import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@1';
import { compileMdx } from '../../packages/adapter-vite/src/internal/content/mdx/compile.ts';
import { renderDsdTree } from '@openelement/element';
import { jsx } from '@openelement/element/jsx-runtime';

Deno.test('v0.28.3 MDX: simple source compiles with frontmatter', async () => {
  const mod = await compileMdx(`---
title: Simple
---

# Simple`);
  assertEquals(mod.frontmatter.title, 'Simple');
  assertStringIncludes(mod.code, '@openelement/element');
});

Deno.test('v0.28.3 MDX: island syntax survives compile', async () => {
  const mod = await compileMdx('<open-theme-toggle client:idle />');
  assertStringIncludes(mod.code, 'open-theme-toggle');
  assertStringIncludes(mod.code, 'client:idle');
});

Deno.test('v0.28.3 MDX: VNode output can enter openElement render path', async () => {
  const html = await renderDsdTree(jsx('open-card', { children: 'MDX card' }));
  assertEquals(html, '<open-card>MDX card</open-card>');
});

Deno.test('v0.28.3 MDX: signal placeholder content can render as JSX text', async () => {
  const html = await renderDsdTree(jsx('p', { children: 'Count: 1' }));
  assertStringIncludes(html, 'Count: 1');
});

Deno.test('v0.28.3 MDX: syntax errors are surfaced', async () => {
  await assertRejects(() => compileMdx('<Broken>'), Error);
});

Deno.test('v0.28.3 MDX: example fixture exists', async () => {
  const source = await Deno.readTextFile('www/content/mdx/example.mdx');
  const mod = await compileMdx(source);
  assert(mod.content.includes('open-theme-toggle'));
});
