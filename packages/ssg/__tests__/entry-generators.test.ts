import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { quoteGeneratedJavaScriptStringLiteral } from '../src/codegen-literals.ts';

Deno.test('generated client entry string literals escape JavaScript code boundaries', () => {
  assertEquals(
    quoteGeneratedJavaScriptStringLiteral('</script>\u2028\u2029'),
    '"\\u003C/script\\u003E\\u2028\\u2029"',
  );
});
