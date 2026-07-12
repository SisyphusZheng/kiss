/**
 * check-current-docs-no-legacy.ts - current docs staleness gate.
 */
const LEGACY: Array<{ re: RegExp; name: string }> = [
  { re: /(?<!`)html`/, name: 'html template' },
  { re: /@prop\(/, name: '@prop()' },
  { re: /choose\(/, name: 'choose()' },
  { re: /unsafeHTML\(/, name: 'unsafeHTML()' },
  { re: /TemplateResult/, name: 'TemplateResult' },
  { re: /renderTemplateToString/, name: 'renderTemplateToString()' },
];

const ALLOWED = [
  'migration',
  'changelog',
  'release/',
  'legacy',
  'archive',
  'sop/',
  'adr/',
  'conversation/',
  'benchmark/',
  'status/reviews/',
  'design/',
  'reference/',
  'zh/guide/',
  'guide/migration',
  'guide/static-props',
  'jsx-component-model',
  'signal-vnode-effect',
  'guide/jsx-components',
  'registry/_hub-data',
  'docs/arch/',
  'docs/guide/',
  'docs/roadmap/',
  'docs/status/',
];

import { walk } from './lib/fs.ts';

const issues: Array<{ f: string; l: number; t: string }> = [];
const retiredProductImport =
  /@openelement\/(?:core|signal|router|protocol|content|ssg)(?:\/|`|'|")/;

function css(line: string): boolean {
  return /grid-template|repeat\(.*,\s*\d/.test(line);
}

async function check(file: string): Promise<void> {
  if (!/\.(ts|tsx|md)$/.test(file) || ALLOWED.some((allowed) => file.includes(allowed))) {
    return;
  }

  const text = await Deno.readTextFile(file);
  for (const [index, line] of text.split('\n').entries()) {
    if (css(line)) continue;
    for (const { re, name } of LEGACY) {
      if (re.test(line)) issues.push({ f: file, l: index + 1, t: name });
    }
  }
}

async function checkProductImports(file: string): Promise<void> {
  if (!/\.(?:md|ts|tsx)$/.test(file)) return;
  const text = await Deno.readTextFile(file);
  for (const [index, line] of text.split('\n').entries()) {
    if (/^\s*(?:import|export)|@jsxImportSource/.test(line) && retiredProductImport.test(line)) {
      issues.push({ f: file, l: index + 1, t: 'retired package import' });
    }
  }
}

for (const dir of ['www/app/routes', 'docs']) {
  for await (const file of walk(dir, { skip: ['node_modules', 'dist', '.git'] })) {
    await check(file);
  }
}

for (const dir of ['www/content/guide/en', 'www/content/guide/zh']) {
  for await (const file of walk(dir, { skip: ['node_modules', 'dist', '.git'] })) {
    await checkProductImports(file);
  }
}

for (
  const file of [
    'packages/element/README.md',
    'packages/app/README.md',
    'packages/adapter-vite/README.md',
    'packages/create/README.md',
    'packages/ui/README.md',
    'README.md',
    'README.zh.md',
  ]
) {
  await check(file);
}

if (issues.length) {
  console.error(`${issues.length} legacy API refs:\n`);
  for (const issue of issues) console.error(`  ${issue.f}:${issue.l} - ${issue.t}`);
  Deno.exit(1);
}

console.log('No legacy API references in current docs.');
