import { assert } from 'jsr:@std/assert@^1.0.0';

Deno.test('vendored @std packages include MIT LICENSE attribution', async () => {
  const vendorDir = new URL('../../../vendor/jsr.io/@std/', import.meta.url);

  for await (const entry of Deno.readDir(vendorDir)) {
    if (!entry.isDirectory || entry.name.startsWith('.')) continue;
    const licensePath = new URL(`${entry.name}/LICENSE`, vendorDir);
    const info = await Deno.stat(licensePath).catch(() => null);
    assert(
      info?.isFile,
      `Missing LICENSE file for vendor package @std/${entry.name}`,
    );
  }
});
