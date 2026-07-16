/** Generate/check the deterministic five-package public-interface baseline. */
import { createHash } from 'node:crypto';
import { readPackages, releasePublishOrder } from './lib/package-graph.ts';

const SNAPSHOT = 'docs/release/v0.41.0-interface-snapshot.json';
const write = Deno.args.includes('--write');
const packages = releasePublishOrder(await readPackages());
const snapshot = {
  schema: 1,
  packages: await Promise.all(packages.map(async (pkg) => {
    const exports = typeof pkg.exports === 'string' ? { '.': pkg.exports } : pkg.exports;
    const declarations = await Promise.all(
      Object.entries(exports ?? {}).map(async ([path, source]) => {
        const text = await Deno.readTextFile(`${pkg.dir}/${String(source).replace(/^\.\//, '')}`);
        const publicDeclarations = text.split('\n').filter((line) =>
          /^export (?:declare )?(?:abstract )?(?:class|function|interface|type|const)\b/.test(
            line.trim(),
          )
        ).map((line) => line.trim());
        return [path, {
          sha256: createHash('sha256').update(text).digest('hex'),
          publicDeclarations,
        }] as const;
      }),
    );
    return {
      name: pkg.name,
      exports: Object.fromEntries(Object.entries(exports ?? {}).sort()),
      declarations: Object.fromEntries(declarations.sort()),
    };
  })),
};
const text = `${JSON.stringify(snapshot, null, 2)}\n`;
if (write) await Deno.writeTextFile(SNAPSHOT, text);
else if (await Deno.readTextFile(SNAPSHOT) !== text) {
  throw new Error(`${SNAPSHOT} drifted; run deno task interface:snapshot:write`);
}
console.log(
  `Public interface snapshot ${write ? 'written' : 'matches'} (${packages.length} packages).`,
);
