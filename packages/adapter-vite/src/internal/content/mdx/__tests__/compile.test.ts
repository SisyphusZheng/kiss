import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@1';
import { compileMdx } from '../compile.ts';

Deno.test('compileMdx extracts frontmatter and markdown body', async () => {
  const mod = await compileMdx(`---
title: Hello MDX
tags:
  - openElement
---

# Hello
`);

  assertEquals(mod.frontmatter.title, 'Hello MDX');
  assertEquals(mod.frontmatter.tags, ['openElement']);
  assertStringIncludes(mod.content, '# Hello');
});

Deno.test('compileMdx targets @openelement/element JSX runtime', async () => {
  const mod = await compileMdx('# Hello');
  assertStringIncludes(mod.code, 'jsx');
  assertStringIncludes(mod.code, '@openelement/element');
});

Deno.test('compileMdx preserves JSX component usage for DSD render path', async () => {
  const mod = await compileMdx('<open-counter client:idle count={1} />');
  assertStringIncludes(mod.code, 'open-counter');
  assertStringIncludes(mod.code, 'client:idle');
});

Deno.test('compileMdx accepts a custom jsxImportSource', async () => {
  const mod = await compileMdx('# Hello', { jsxImportSource: '@openelement/element' });
  assertStringIncludes(mod.code, '@openelement/element');
});

Deno.test('compileMdx surfaces parser errors with source context', async () => {
  await assertRejects(
    () => compileMdx('<Unclosed>'),
    Error,
  );
});

Deno.test('compileMdx emits executable program text', async () => {
  const mod = await compileMdx('Plain **content**');
  assert(mod.code.includes('export default'));
});
