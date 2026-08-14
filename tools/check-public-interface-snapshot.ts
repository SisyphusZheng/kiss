/** Generate/check the deterministic five-package public-interface baseline. */
import { formatJson } from '@openelement/element/build-utils';
import { readPackages, releasePublishOrder } from './lib/package-graph.ts';

const SNAPSHOT = 'docs/release/public-interface-snapshot.json';

/**
 * Named re-exports (`export { A, B as C } from '…'`, possibly multi-line)
 * are the dominant export form of the entry files but were invisible to the
 * snapshot as names — per-name add/remove drift only moved the sha256,
 * unreadably (#592). Capture the exported names (the alias after `as`, when
 * present) sorted, so the freeze guard is mechanical for re-exports too.
 */
function reExportedNames(text: string): string[] {
  const names: string[] = [];
  for (const match of text.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]/gs)) {
    for (const part of match[1].split(',')) {
      const cleaned = part.trim().replace(/^type\s+/, '');
      if (!cleaned) continue;
      names.push((cleaned.split(/\s+as\s+/).pop() ?? cleaned).trim());
    }
  }
  return names.sort();
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return new Uint8Array(digest).toHex();
}
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
          sha256: await sha256Hex(text),
          publicDeclarations,
          reExportedNames: reExportedNames(text),
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
const text = formatJson(snapshot);
if (write) await Deno.writeTextFile(SNAPSHOT, text);
else if (await Deno.readTextFile(SNAPSHOT) !== text) {
  throw new Error(`${SNAPSHOT} drifted; run deno task interface:snapshot:write`);
}
console.log(
  `Public interface snapshot ${write ? 'written' : 'matches'} (${packages.length} packages).`,
);
