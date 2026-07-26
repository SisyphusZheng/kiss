/** Verify release-critical workspace package configuration before packing. */

import { basename, dirname, join } from 'node:path';
import { readPackages } from './lib/package-graph.ts';
import { readJson } from './lib/fs.ts';

const requiredPublishedFiles = ['deno.json', 'README.md', 'LICENSE'];
const failures: string[] = [];
const packages = await readPackages();

for (const pkg of packages) {
  const configPath = join(pkg.dir, 'deno.json');
  const config = await readJson(configPath) as {
    name?: unknown;
    version?: unknown;
    exports?: unknown;
    publish?: { include?: unknown };
  };

  if (config.name !== pkg.name) failures.push(`${configPath}: name does not match package graph`);
  if (config.version !== pkg.version) {
    failures.push(`${configPath}: version does not match package graph`);
  }
  if (!config.exports) failures.push(`${configPath}: missing public exports`);

  const include = config.publish?.include;
  if (!Array.isArray(include)) {
    failures.push(`${configPath}: publish.include must be an array`);
  } else {
    for (const required of requiredPublishedFiles) {
      if (!include.includes(required)) {
        failures.push(`${configPath}: publish.include omits ${required}`);
      }
    }
  }

  for (const required of requiredPublishedFiles) {
    try {
      await Deno.stat(join(dirname(configPath), required));
    } catch {
      failures.push(`${pkg.name}: missing ${required}`);
    }
  }

  if (!pkg.name.startsWith('@openelement/')) {
    failures.push(`${basename(pkg.dir)}: package name must use @openelement scope`);
  }
}

if (failures.length > 0) {
  console.error('Package configuration verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  Deno.exit(1);
}

console.log(`Package configuration verification passed (${packages.length} packages).`);
