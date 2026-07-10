import { assertEquals, assertLess } from 'jsr:@std/assert@1';
import { OpenElementThemeManager } from '../src/open-element-theme.ts';

Deno.test('OpenElement public module stays a small stable seam', async () => {
  const source = await Deno.readTextFile(new URL('../src/open-element.ts', import.meta.url));
  assertLess(source.split('\n').length, 400);
});

Deno.test('OpenElementThemeManager registers styles idempotently and resets', () => {
  const manager = new OpenElementThemeManager();
  const first = {};
  const second = {};

  manager.registerStyles([first, first, second]);
  assertEquals(manager.getStyles(), [first, second]);

  manager.resetStyles();
  assertEquals(manager.getStyles(), []);
});
