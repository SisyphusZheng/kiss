#!/usr/bin/env -S deno run --allow-read

import { basename, dirname, fromFileUrl, join } from '@std/path';

const repoRoot = dirname(dirname(fromFileUrl(import.meta.url)));
const baselineDir = join(repoRoot, 'www', 'e2e', 'visual-baselines.spec.ts-snapshots');

interface Baseline {
  name: string;
  bytes: number;
  hash: string;
}

async function digest(path: string): Promise<string> {
  const bytes = await Deno.readFile(path);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const baselines: Baseline[] = [];
for await (const entry of Deno.readDir(baselineDir)) {
  if (!entry.isFile || !entry.name.endsWith('.png')) continue;
  const path = join(baselineDir, entry.name);
  const stat = await Deno.stat(path);
  baselines.push({ name: basename(path), bytes: stat.size, hash: await digest(path) });
}

baselines.sort((left, right) => left.name.localeCompare(right.name));
const byHash = Map.groupBy(baselines, (baseline) => baseline.hash);
const duplicateGroups = [...byHash.values()].filter((group) => group.length > 1);
const duplicateBytes = duplicateGroups.reduce(
  (total, group) => total + group.slice(1).reduce((sum, baseline) => sum + baseline.bytes, 0),
  0,
);

console.log(
  `Visual baselines: count=${baselines.length} unique=${byHash.size} ` +
    `duplicateGroups=${duplicateGroups.length} duplicateBytes=${duplicateBytes}`,
);

if (duplicateGroups.length > 0) {
  const details = duplicateGroups
    .map((group) => `  ${group.map((baseline) => baseline.name).join(', ')}`)
    .join('\n');
  throw new Error(`Unexplained exact-duplicate visual baselines:\n${details}`);
}
