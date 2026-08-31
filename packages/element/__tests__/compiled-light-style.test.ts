import { assertEquals, assertStringIncludes } from '@std/assert';
import { scopeCompiledLightCss } from '../src/internal/compiled/style.ts';

Deno.test('compiled light CSS uses one native scope and projects shadow selectors', () => {
  const css = `
:host { display: block; }
:host([rail]) .shell, :host(:not([rail])) .main { color: red; }
.body ::slotted(p) { margin: 0; }
@media (max-width: 40rem) { .shell { display: grid; } }
`;

  assertEquals(
    scopeCompiledLightCss('open-reading-shell', css),
    `@scope (open-reading-shell) {\n
:scope { display: block; }
:scope:is([rail]) .shell, :scope:is(:not([rail])) .main { color: red; }
.body slot > :is(p) { margin: 0; }
@media (max-width: 40rem) { .shell { display: grid; } }
\n}`,
  );
});

Deno.test('compiled light CSS preserves selector-like text in strings and comments', () => {
  const scoped = scopeCompiledLightCss(
    'oe-card',
    `/* :host ::slotted(*) */ .card::before { content: ":host ::slotted(*)"; }`,
  );

  assertStringIncludes(scoped, '/* :host ::slotted(*) */');
  assertStringIncludes(scoped, 'content: ":host ::slotted(*)"');
});

Deno.test('compiled light CSS leaves empty styles empty', () => {
  assertEquals(scopeCompiledLightCss('oe-card', ''), '');
});
