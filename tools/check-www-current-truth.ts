import { exists, walk } from './lib/fs.ts';
import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_RELEASE_THEME,
} from './project-constants.ts';
import { roadmapEntryTheme } from './autoflow/release.ts';

type Issue = { file: string; text: string };

const sourceRoots = [
  'www/app/routes',
  'www/app/site-ui',
];

const [versionBase, prerelease = ''] = PACKAGE_VERSION.split('-');
// After a stable bump the current version carries no prerelease suffix, but
// the previous prerelease line is exactly what must stay retired: build the
// pattern from PREVIOUS_PACKAGE_VERSION in that case.
const [retiredBase, retiredLine = ''] = prerelease
  ? [versionBase, prerelease]
  : PREVIOUS_PACKAGE_VERSION.split('-');
const prereleaseMatch = retiredLine.match(/^(alpha|beta|rc)\.(\d+)$/u);
// On a stable line where the previous version is also stable (e.g. 0.41.1
// after 0.41.0), every prerelease of the same base version is retired.
const stableLineAlphaPattern = !prereleaseMatch
  ? new RegExp(`(?:v?${versionBase.replaceAll('.', '\\.')}-alpha|\\balpha)\\.\\d+(?!\\d)`, 'iu')
  : null;
// Retired prerelease claims are flagged with or without the `v` prefix and in
// the short `alpha.N` form; only numbers below the current line match, so the
// current version itself never trips the gate.
const earlierPrereleasePattern = prereleaseMatch && Number(prereleaseMatch[2]) > 0
  ? new RegExp(
    `(?:v?${retiredBase.replaceAll('.', '\\.')}-${prereleaseMatch[1]}|\\b${
      prereleaseMatch[1]
    })\\.(?:${
      Array.from({ length: Number(prereleaseMatch[2]) }, (_, index) => index).join('|')
    })(?!\\d)`,
    'iu',
  )
  : null;
const activeRetiredPattern = earlierPrereleasePattern ?? stableLineAlphaPattern;

const forbidden: Array<{ name: string; re: RegExp }> = [
  { name: 'mojibake', re: /(?:鏂|鈫|鍗|杩|鏈)/ },
  {
    name: 'retired product package',
    re: /@openelement\/(?:core|signal|router|protocol|content|ssg)(?:[/'"`\s]|$)/,
  },
  {
    name: 'retired two-product doctrine',
    re: /Web Components Fullstack Framework \+ Basic Element|supporting packages = Protocols/i,
  },
  { name: 'eleven-package claim', re: /\b11[- ]package|\b11 packages\b/i },
  { name: 'retired app vite subpath', re: /@openelement\/app\/vite|\/vite subpath/i },
  { name: 'internal build contract', re: /\bBuildPlan\b|\bAppShell protocol\b/ },
  { name: 'beta.4 published claim', re: /beta\.4 (?:is |was )?(?:released|published)/i },
  { name: 'externally hosted site font', re: /fonts\.(?:googleapis|gstatic)\.com/i },
  {
    name: 'retired generic fullstack SEO claim',
    re: /openElement (?:is a |[-–—] )?Web Components Fullstack Framework/i,
  },
  {
    name: 'retired UI surface',
    re: /@openelement\/ui\/(?:daisy-classes|open-modal|open-step-card)|<open-(?:modal|step-card)\b/,
  },
];
if (activeRetiredPattern) {
  forbidden.push({ name: 'retired prerelease current claim', re: activeRetiredPattern });
}

const issues: Issue[] = [];

// The guide tsx routes under www/app/routes/guide/ are the single source of
// truth for guide pages in every locale. A second guide content tree must not
// reappear: it rendered zh pages in English and drifted from the tsx copy.
if (await exists('www/content/guide')) {
  issues.push({
    file: 'www/content/guide',
    text: 'second guide source of truth; guide content lives only in www/app/routes/guide/',
  });
}

async function checkFile(file: string): Promise<void> {
  const text = await Deno.readTextFile(file);
  // Version-dense history surfaces (the migration guide, changelog) may name
  // retired prereleases without it being a stale current claim.
  const isHistorySurface = /(?:routes\/guide\/migration\.tsx|CHANGELOG\.md)$/.test(file);
  for (const { name, re } of forbidden) {
    if (isHistorySurface && name === 'retired prerelease current claim') continue;
    if (re.test(text)) issues.push({ file, text: name });
  }
  if (
    file.startsWith('www/app/routes/') && file !== 'www/app/routes/index/index.tsx' &&
    /<(?:section|div)\s+class=['"]hero['"]/.test(text)
  ) {
    issues.push({ file, text: 'legacy per-page hero markup' });
  }
  if (
    file.startsWith('www/app/routes/') && file !== 'www/app/routes/index/index.tsx' &&
    /(?:^|[\s,{])\.(?:hero|hero-copy|hero-panel|hero-artifact|shell|rail|rail-link|panel)(?:[\s:{,.>#]|$)/m
      .test(text)
  ) {
    issues.push({ file, text: 'legacy per-page structural CSS' });
  }
  if (file.startsWith('www/app/routes/guide/') && !/open-page-rail[^>]+items=/.test(text)) {
    issues.push({ file, text: 'guide route lacks a declared SSR outline' });
  }
  if (file.startsWith('www/app/routes/guide/') && !/<open-reading-shell\s+rail/.test(text)) {
    issues.push({ file, text: 'guide route lacks the shared reading shell' });
  }
  if (file.startsWith('www/app/routes/guide/') && !/<open-reading-shell[^>]+metadata=/.test(text)) {
    issues.push({ file, text: 'guide route lacks structured reading metadata' });
  }
  if (file.startsWith('www/app/routes/guide/')) {
    // Strip comments before asserting the locale literal so a commented-out
    // line cannot satisfy (or trip) the check.
    const uncommented = text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    if (!uncommented.includes("this._getLocale('en')")) {
      issues.push({
        file,
        text: 'guide route does not select content by locale (zh must render zh)',
      });
    }
  }
  if (file.includes('www/app/routes/blog/[slug].tsx') && /open-page-rail[^>]+auto/.test(text)) {
    issues.push({ file, text: 'blog article relies on client-generated TOC' });
  }
}

for (const root of sourceRoots) {
  const skip = ['dist', '_generated-*'];
  for await (const file of walk(root, { skip })) {
    if (/\.(?:ts|tsx|md)$/.test(file)) await checkFile(file);
  }
}
await checkFile('www/vite.config.ts');

// Release line-prose gate: the mechanical version bump rewrites the roadmap
// current-line entry's version string but cannot write the new release's
// theme — that is human release prose. Fail while the entry still names the
// superseded theme recorded at bump time (the 0.41.1 incident shipped
// alpha.19's 'third audit cleanup sweep' under the v0.41.1 entry). The
// exists guard keeps the fixture-driven tests (no roadmap fixture) on the
// pattern-check path only.
if (await exists('www/app/routes/roadmap.tsx')) {
  const roadmapText = await Deno.readTextFile('www/app/routes/roadmap.tsx');
  const currentTheme = roadmapEntryTheme(roadmapText, PACKAGE_VERSION_TAG);
  if (currentTheme !== undefined && currentTheme === PREVIOUS_RELEASE_THEME) {
    issues.push({
      file: 'www/app/routes/roadmap.tsx',
      text:
        `current-line timeline entry still names the superseded theme '${PREVIOUS_RELEASE_THEME}'; ` +
        'write the new release theme (and copy) before releasing',
    });
  }
}

if (Deno.args.includes('--artifacts')) {
  for await (const file of walk('www/dist', { skip: ['blog'] })) {
    // The root-level history indexes (blog.html, changelog.html or their
    // /blog//changelog route index.html) and the version-dense migration
    // guide hold historical copy that is intentionally outside the
    // current-surface rule.
    if (
      /(?:^|\/)(?:(?:blog|changelog)(?:\.html|\/index\.html)|guide\/migration\/index\.html)$/.test(
        file,
      )
    ) {
      continue;
    }
    if (/\.html$/.test(file)) await checkFile(file);
  }
}

if (issues.length > 0) {
  console.error('Current www truth check failed:');
  for (const issue of issues) console.error(`- ${issue.file}: ${issue.text}`);
  Deno.exit(1);
}

console.log(
  `Current www truth check passed${
    Deno.args.includes('--artifacts') ? ' (including artifacts)' : ''
  }.`,
);
