import { assert } from 'jsr:@std/assert@^1.0.0';

Deno.test('vendored @std packages include MIT LICENSE attribution', async () => {
  const vendorDir = new URL('../../../vendor/jsr.io/@std/', import.meta.url);
  const packages: string[] = [];

  for await (const entry of Deno.readDir(vendorDir)) {
    if (!entry.isDirectory || entry.name.startsWith('.')) continue;
    packages.push(entry.name);
    const licensePath = new URL(`${entry.name}/LICENSE`, vendorDir);
    const info = await Deno.stat(licensePath).catch(() => null);
    assert(
      info?.isFile,
      `Missing LICENSE file for vendor package @std/${entry.name}`,
    );
  }

  assert(
    packages.length > 0,
    `Expected at least one @std package in vendor dir, found ${packages.length}`,
  );
});
