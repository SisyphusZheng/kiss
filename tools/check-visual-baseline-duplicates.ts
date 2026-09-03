#!/usr/bin/env -S deno run --allow-read

import { basename, dirname, fromFileUrl, join } from '@std/path';

const repoRoot = dirname(dirname(fromFileUrl(import.meta.url)));
const baselineDir = join(repoRoot, 'www', 'e2e', 'visual-baselines.spec.ts-snapshots');

export interface Baseline {
  name: string;
  bytes: number;
  hash: string;
}

/**
 * The gate's decision logic (#1230 M15): group baselines by content hash and
 * return the groups holding more than one file. Sorted by name so the verdict
 * is independent of directory iteration order.
 */
export function findDuplicateGroups(baselines: Baseline[]): Baseline[][] {
  const sorted = [...baselines].sort((left, right) => left.name.localeCompare(right.name));
  const byHash = Map.groupBy(sorted, (baseline) => baseline.hash);
  return [...byHash.values()].filter((group) => group.length > 1);
}

async function digest(path: string): Promise<string> {
  const bytes = await Deno.readFile(path);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function main(): Promise<void> {
  const baselines: Baseline[] = [];
  for await (const entry of Deno.readDir(baselineDir)) {
    if (!entry.isFile || !entry.name.endsWith('.png')) continue;
    const path = join(baselineDir, entry.name);
    const stat = await Deno.stat(path);
    baselines.push({ name: basename(path), bytes: stat.size, hash: await digest(path) });
  }

  const unique = new Set(baselines.map((baseline) => baseline.hash)).size;
  const duplicateGroups = findDuplicateGroups(baselines);
  const duplicateBytes = duplicateGroups.reduce(
    (total, group) => total + group.slice(1).reduce((sum, baseline) => sum + baseline.bytes, 0),
    0,
  );

  console.log(
    `Visual baselines: count=${baselines.length} unique=${unique} ` +
      `duplicateGroups=${duplicateGroups.length} duplicateBytes=${duplicateBytes}`,
  );

  if (duplicateGroups.length > 0) {
    const details = duplicateGroups
      .map((group) => `  ${group.map((baseline) => baseline.name).join(', ')}`)
      .join('\n');
    throw new Error(`Unexplained exact-duplicate visual baselines:\n${details}`);
  }
}

if (import.meta.main) await main();
