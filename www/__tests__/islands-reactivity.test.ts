import { assertFalse } from 'jsr:@std/assert@^1.0.0';

const CASES: Array<[string, string, string[]]> = [
  // counter-island.tsx deleted in v0.27.0
];

for (const [path, exportName, props] of CASES) {
  Deno.test(`docs island ${path}: reactive properties are not shadowed`, async () => {
    const mod = await import(`../app/islands/${path as string}`);
    const Cls = mod[exportName as string] as { new (): object };
    const instance = new Cls() as Record<string, unknown>;

    for (const prop of props as string[]) {
      assertFalse(
        Object.prototype.hasOwnProperty.call(instance, prop),
        `${path}.${prop} must use Lit's generated accessor, not an own class field`,
      );
    }
  });
}
