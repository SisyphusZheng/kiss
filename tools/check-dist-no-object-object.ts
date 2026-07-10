/**
 * check-dist-no-object-object.ts
 *
 * v0.24.3: Prevents runtime [object Object] pollution in www/dist.
 * Scans built HTML files for the literal string "[object Object]"
 * and reports matches that indicate renderer bugs.
 *
 * Usage: deno run --allow-read tools/check-dist-no-object-object.ts
 */

import { walk } from './lib/fs.ts';

interface Match {
  file: string;
  line: number;
  context: string;
}

// Allowed: documentation text that legitimately contains "[object Object]"
const ALLOWED_IN_FILES = [
  'migration',
  'changelog',
  'release/',
  'guide/',
];

const matches: Match[] = [];

for await (const entry of walk('www/dist')) {
  if (!entry.endsWith('.html')) continue;

  const isAllowed = ALLOWED_IN_FILES.some((p) => entry.includes(p));
  const content = await Deno.readTextFile(entry);
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[object Object]')) {
      if (isAllowed) continue; // documentation text is ok
      matches.push({
        file: entry,
        line: i + 1,
        context: line.trim().slice(0, 100),
      });
    }
  }
}

if (matches.length > 0) {
  console.error(`❌ Found ${matches.length} [object Object] occurrence(s) in built output:\n`);
  for (const m of matches) {
    console.error(`  ${m.file}:${m.line}`);
    console.error(`    ${m.context}\n`);
  }
  Deno.exit(1);
}

console.log('✅ No [object Object] found in built output.');
