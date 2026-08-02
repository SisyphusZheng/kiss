import { MOJIBAKE_CHARS } from './lib/text.ts';

type Issue = {
  file: string;
  message: string;
};

const scanRoots = [
  'README.md',
  'README.zh.md',
  'deno.json',
  'docs/current/',
  'docs/roadmap/ROADMAP.md',
  'docs/status/STATUS.md',
  'docs/adr/ADR-0105-v040x-cleanup-train-exception.md',
  'packages/',
  'tools/',
  'www/app/routes/',
  'www/app/components/',
];

const ignoredPathParts = [
  '/__tests__/fixtures/',
  'www/app/data/_generated-blog-data.ts',
  'www/content/blog/',
];

const textExtensions = /\.(ts|tsx|md|json|yml|yaml)$/;
const mojibake = new RegExp(`[${MOJIBAKE_CHARS.join('')}]`);

const currentTruthForbidden = [
  {
    re:
      /20-package v0\.40 graph|is a 20-package|20-package layered|20 packages in packages\/|20 current packages/,
    message:
      'current truth must use the current five-package graph, not the retired 20-package graph',
  },
  {
    re: /standalone (runtime\/style-sheet\/ssg|`@openelement\/ssg`)/,
    message: 'current truth must not describe runtime/style-sheet/ssg as standalone packages',
  },
  {
    re: /default remains `alien-signals`|alien-signals remains the default/,
    message: 'current truth must state @preact/signals-core is the default signal engine',
  },
  {
    re: /runtime facade/,
    message: 'current truth must use element authoring facade, not runtime facade',
  },
];

const requiredTruth = [
  {
    file: 'docs/current/PACKAGE_SURFACE.md',
    includes: '@preact/signals-core',
    message: 'package surface must document @preact/signals-core as default signal engine',
  },
  {
    file: 'docs/current/PACKAGE_SURFACE.md',
    includes: '@openelement/adapter-vite',
    message: 'package surface must document the retained adapter-vite build surface',
  },
  {
    file: 'docs/adr/ADR-0105-v040x-cleanup-train-exception.md',
    includes: '@openelement/i18n',
    message: 'ADR-0105 must record standalone i18n removal',
  },
];

import { normalizeSlashes } from './lib/path.ts';
import { exists } from './lib/fs.ts';
import { gitTrackedFiles } from './lib/git.ts';

const issues: Issue[] = [];

function shouldScan(file: string): boolean {
  if (!textExtensions.test(file)) return false;
  if (ignoredPathParts.some((part) => file.includes(part))) return false;
  return scanRoots.some((root) => file === root || file.startsWith(root));
}

function isCurrentTruth(file: string): boolean {
  return file === 'README.md' ||
    file === 'README.zh.md' ||
    file.startsWith('docs/current/') ||
    file === 'docs/roadmap/ROADMAP.md' ||
    file === 'docs/status/STATUS.md' ||
    file === 'docs/adr/ADR-0105-v040x-cleanup-train-exception.md' ||
    file === 'www/app/routes/architecture/architecture.tsx' ||
    file === 'www/app/routes/guide/architecture.tsx';
}

const files = (await gitTrackedFiles()).map(normalizeSlashes).filter(shouldScan);

for (const file of files) {
  if (!(await exists(file))) continue;
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await Deno.readFile(file));
  } catch {
    issues.push({ file, message: 'is not strict UTF-8 text' });
    continue;
  }
  if (text.includes('\uFFFD')) {
    issues.push({ file, message: 'contains Unicode replacement character U+FFFD' });
  }
  if (mojibake.test(text)) {
    issues.push({ file, message: 'contains mojibake token' });
  }
  if (isCurrentTruth(file)) {
    for (const { re, message } of currentTruthForbidden) {
      if (re.test(text)) issues.push({ file, message });
    }
  }
}

for (const { file, includes, message } of requiredTruth) {
  if (!(await exists(file))) {
    issues.push({ file, message: 'required truth file is missing' });
    continue;
  }
  const text = await Deno.readTextFile(file);
  if (!text.includes(includes)) issues.push({ file, message });
}

if (issues.length > 0) {
  console.error('Text integrity check failed:');
  for (const issue of issues) console.error(`- ${issue.file}: ${issue.message}`);
  Deno.exit(1);
}

console.log('Text integrity check passed.');
