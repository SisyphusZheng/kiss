/**
 * Unified docs-truth checker (Phase 3, #870): the legacy checkers merged
 * into one registry of seven gates, each exposing
 * run(opts) -> { passed, failures }.
 *
 *   strategic  - current-version/product-position anchors + stale claims
 *   public     - public docs integrity (anchors, doctrine, mojibake, surface)
 *   current    - legacy API references in current docs
 *   www        - www routes/current-truth gate (+ --artifacts)
 *   text       - text integrity across tracked files
 *   evidence   - release evidence consistency + forward-tag assertion
 *   claims     - code/claim alignment (#893)
 *
 * CLI: `--check=<name>` runs one gate; no flag runs all. `--artifacts`
 * extends the www gate over www/dist. policy.ts keeps its per-gate trigger
 * granularity through the unchanged `docs:check-*`/`www:check-*`/text tasks.
 */

import { exists } from './lib/fs.ts';
import { gitTagExists, gitTrackedFiles, isAncestorCommit, runGit } from './lib/git.ts';
import { normalizeSlashes } from './lib/path.ts';
import { MOJIBAKE_CHARS, stripComments } from './lib/text.ts';
import {
  PACKAGE_VERSION,
  PACKAGE_VERSION_TAG,
  PREVIOUS_PACKAGE_VERSION,
  PREVIOUS_RELEASE_THEME,
  REMOVED_PACKAGE_NAMES,
} from './project-constants.ts';
import { formatError } from '@openelement/element';
import { compareVersions, roadmapEntryTheme } from './autoflow/release.ts';

type CheckResult = {
  passed: boolean;
  failures: { file: string; message: string }[];
};

type CheckContext = {
  artifacts?: boolean;
};

type DocsTruthCheck = {
  name: string;
  run: (opts: CheckContext) => Promise<CheckResult> | CheckResult;
};

// ─── strategic: anchors + stale claims ─────────────────────────────────────
import { findStrategicDocFailures } from './check-strategic-docs.ts';

const strategicCheck: DocsTruthCheck = {
  name: 'strategic',
  run: () => {
    const failures = findStrategicDocFailures((path) => Deno.readTextFileSync(path));
    return {
      passed: failures.length === 0,
      failures: failures.map((failure) => ({
        file: failure.file,
        message: `[${failure.check}] ${failure.message}`,
      })),
    };
  },
};

// ─── public: docs integrity ────────────────────────────────────────────────
import {
  currentContractDocs,
  currentPublicDocs,
  findIntegrationSpecifierFailures,
  integrationsDocsDir,
  mojibakePatterns,
  productDoctrinePatterns,
  readmeDocs,
  requiredCommunityFiles,
  staleCurrentClaims,
} from './check-public-docs-integrity.ts';

const publicCheck: DocsTruthCheck = {
  name: 'public',
  run: async () => {
    const failures: { file: string; message: string }[] = [];

    async function readOrFail(file: string) {
      try {
        return await Deno.readTextFile(file);
      } catch (error) {
        failures.push({
          file,
          message: `cannot read file: ${formatError(error)}`,
        });
        return '';
      }
    }

    for (const file of currentPublicDocs) {
      const text = await readOrFail(file);
      if (!text) continue;
      if (!text.includes(PACKAGE_VERSION_TAG)) {
        failures.push({ file, message: `missing package version tag ${PACKAGE_VERSION_TAG}` });
      }
      if (!text.includes(PACKAGE_VERSION)) {
        failures.push({ file, message: `missing package version ${PACKAGE_VERSION}` });
      }
      for (const pattern of staleCurrentClaims) {
        const match = text.match(pattern);
        if (match) {
          failures.push({ file, message: `stale current-line claim: ${match[0]}` });
        }
      }
    }

    for (const file of currentContractDocs) {
      const text = await readOrFail(file);
      if (!text) continue;
      const staleMaturity = text.match(/v0\.41 beta/i);
      if (staleMaturity) {
        failures.push({ file, message: `stale current maturity claim: ${staleMaturity[0]}` });
      }
    }

    for (const file of readmeDocs) {
      const text = await readOrFail(file);
      if (!text) continue;
      for (const doctrine of productDoctrinePatterns) {
        if (!text.includes(doctrine)) {
          failures.push({ file, message: `missing product doctrine formula: ${doctrine}` });
        }
      }
      for (const pattern of mojibakePatterns) {
        const match = text.match(pattern);
        if (match) {
          failures.push({ file, message: `mojibake/replacement text matched: ${match[0]}` });
        }
      }
    }

    for (const file of requiredCommunityFiles) {
      const text = await readOrFail(file);
      if (!text) continue;
      if (text.trim().length < 80) {
        failures.push({ file, message: 'public entry point is unexpectedly empty' });
      }
    }

    const contributing = await readOrFail('CONTRIBUTING.md');
    for (const file of requiredCommunityFiles) {
      if (!contributing.includes(file)) {
        failures.push({ file: 'CONTRIBUTING.md', message: `missing link to ${file}` });
      }
    }

    const integrationDocs: string[] = [];
    for await (const entry of Deno.readDir(integrationsDocsDir)) {
      if (entry.isFile && entry.name.endsWith('.md')) {
        integrationDocs.push(`${integrationsDocsDir}/${entry.name}`);
      }
    }
    failures.push(
      ...findIntegrationSpecifierFailures((path) => Deno.readTextFileSync(path), integrationDocs),
    );

    return { passed: failures.length === 0, failures };
  },
};

// ─── current: legacy API references ────────────────────────────────────────
import { walk } from '@std/fs/walk';

const LEGACY: Array<{ re: RegExp; name: string }> = [
  { re: /\bhtml\s*`(?=[^`]*\$\{)/u, name: 'html tagged template' },
  { re: /@prop\(/, name: '@prop()' },
  { re: /choose\(/, name: 'choose()' },
  { re: /unsafeHTML\(/, name: 'unsafeHTML()' },
  { re: /TemplateResult/, name: 'TemplateResult' },
  { re: /renderTemplateToString/, name: 'renderTemplateToString()' },
];

const CURRENT_DOC_ALLOWED = [
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

function legacyCss(line: string): boolean {
  return /grid-template|repeat\(.*,\s*\d/.test(line);
}

const currentCheck: DocsTruthCheck = {
  name: 'current',
  run: async () => {
    const issues: { file: string; line: number; text: string }[] = [];

    async function check(file: string): Promise<void> {
      if (!/\.(ts|tsx|md)$/.test(file) || CURRENT_DOC_ALLOWED.some((a) => file.includes(a))) {
        return;
      }
      const text = await Deno.readTextFile(file);
      for (const [index, line] of text.split('\n').entries()) {
        if (legacyCss(line)) continue;
        for (const { re, name } of LEGACY) {
          if (re.test(line)) issues.push({ file, line: index + 1, text: name });
        }
      }
    }

    for (const dir of ['www/app/routes', 'docs']) {
      for await (
        const { path: file } of walk(dir, {
          includeDirs: false,
          skip: [/(^|\/)node_modules(\/|$)/, /(^|\/)dist(\/|$)/, /(^|\/)\.git(\/|$)/],
        })
      ) {
        await check(file);
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

    return {
      passed: issues.length === 0,
      failures: issues.map((issue) => ({
        file: `${issue.file}:${issue.line}`,
        message: issue.text,
      })),
    };
  },
};

// ─── www: current truth in routes ──────────────────────────────────────────
const sourceRoots = ['www/app/routes', 'www/app/site-ui'];

const escapedCurrentVersion = PACKAGE_VERSION.replaceAll('.', '\\.');
const escapedRegistryVersion = PREVIOUS_PACKAGE_VERSION.replaceAll('.', '\\.');
const currentAlphaNumber = PACKAGE_VERSION.match(/-alpha\.(\d+)$/u)?.[1];
const registryAlphaNumber = PREVIOUS_PACKAGE_VERSION.match(/-alpha\.(\d+)$/u)?.[1];
const allowedAlphaNumbers = [currentAlphaNumber, registryAlphaNumber].filter(Boolean).join('|');
const retiredFullForm =
  `(?!v?${escapedCurrentVersion}(?!\\d))(?!v?${escapedRegistryVersion}(?!\\d))v?\\d+\\.\\d+\\.\\d+-(?:alpha|beta|rc)\\.\\d+(?!\\d)`;
const retiredShortForm = allowedAlphaNumbers
  ? `\\balpha\\.(?!(?:${allowedAlphaNumbers})(?!\\d))\\d+(?!\\d)`
  : `\\balpha\\.\\d+(?!\\d)`;
const activeRetiredPattern = new RegExp(`(?:${retiredFullForm}|${retiredShortForm})`, 'iu');

const removedPackageAlternation = REMOVED_PACKAGE_NAMES
  .map((name) => name.slice(name.lastIndexOf('/') + 1))
  .join('|');

const wwwForbidden: Array<{ name: string; re: RegExp }> = [
  { name: 'mojibake', re: new RegExp(`[${MOJIBAKE_CHARS.join('')}]`) },
  {
    name: 'retired product package',
    re: new RegExp(`@openelement/(?:${removedPackageAlternation})(?:[/'"\`\s]|$)`),
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
  { name: 'retired prerelease current claim', re: activeRetiredPattern },
];

async function wwwCheckFile(file: string, issues: { file: string; text: string }[]): Promise<void> {
  const text = await Deno.readTextFile(file);
  const isHistorySurface =
    /(?:routes\/guide\/migration\.tsx|content\/guide\/migration(?:\.zh)?\.md|CHANGELOG\.md)$/.test(
      file,
    );
  for (const { name, re } of wwwForbidden) {
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
  const isContentRoute = file.startsWith('www/app/routes/guide/') ||
    file.startsWith('www/app/routes/architecture/');
  if (isContentRoute && !/extends ArticlePage\b/.test(text)) {
    issues.push({ file, text: 'content route does not build on the shared article shell' });
  }
  if (isContentRoute && /const content\s*=\s*\{|Record<'en' \| 'zh'/.test(text)) {
    issues.push({
      file,
      text: 'content route carries content records; content lives in www/content/<collection>/',
    });
  }
  if (file === 'www/app/site-ui/article-page.tsx') {
    if (!/open-page-rail[^>]+items=/.test(text)) {
      issues.push({ file, text: 'guide shell lacks a declared SSR outline' });
    }
    if (!/<open-reading-shell\s+rail/.test(text)) {
      issues.push({ file, text: 'guide shell lacks the shared reading shell' });
    }
    if (!/<open-reading-shell[^>]+metadata=/.test(text)) {
      issues.push({ file, text: 'guide shell lacks structured reading metadata' });
    }
    if (!stripComments(text).includes("this._getLocale('en')")) {
      issues.push({
        file,
        text: 'guide shell does not select content by locale (zh must render zh)',
      });
    }
  }
  if (file.includes('www/app/routes/blog/[slug].tsx') && /open-page-rail[^>]+auto/.test(text)) {
    issues.push({ file, text: 'blog article relies on client-generated TOC' });
  }
}

const wwwCheck: DocsTruthCheck = {
  name: 'www',
  run: async (opts) => {
    const issues: { file: string; text: string }[] = [];

    for (const collection of ['guide', 'architecture'] as const) {
      if (!await exists(`www/content/${collection}`)) {
        issues.push({
          file: `www/content/${collection}`,
          text: `content source missing; articles live in www/content/${collection}/`,
        });
      }
    }

    for (const root of sourceRoots) {
      for await (
        const { path: file } of walk(root, {
          includeDirs: false,
          skip: [/(^|\/)dist(\/|$)/],
        })
      ) {
        if (/\.(?:ts|tsx|md)$/.test(file)) await wwwCheckFile(file, issues);
      }
    }
    if (await exists('www/vite.config.ts')) await wwwCheckFile('www/vite.config.ts', issues);

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

    if (opts.artifacts) {
      for await (
        const { path: file } of walk('www/dist', {
          includeDirs: false,
          skip: [/(^|\/)blog(\/|$)/],
        })
      ) {
        if (
          /(?:^|\/)(?:(?:blog|changelog)(?:\.html|\/index\.html)|guide\/migration\/index\.html)$/
            .test(file)
        ) {
          continue;
        }
        if (/\.html$/.test(file)) await wwwCheckFile(file, issues);
      }
    }

    return {
      passed: issues.length === 0,
      failures: issues.map((issue) => ({ file: issue.file, message: issue.text })),
    };
  },
};

// ─── text: integrity across tracked files ──────────────────────────────────
const textScanRoots = [
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
  'www/content/guide/',
  'www/content/architecture/',
];

const textIgnoredPathParts = [
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

function textShouldScan(file: string): boolean {
  if (!textExtensions.test(file)) return false;
  if (textIgnoredPathParts.some((part) => file.includes(part))) return false;
  return textScanRoots.some((root) => file === root || file.startsWith(root));
}

function isCurrentTruth(file: string): boolean {
  return file === 'README.md' ||
    file === 'README.zh.md' ||
    file.startsWith('docs/current/') ||
    file === 'docs/roadmap/ROADMAP.md' ||
    file === 'docs/status/STATUS.md' ||
    file === 'docs/adr/ADR-0105-v040x-cleanup-train-exception.md' ||
    file.startsWith('www/content/architecture/architecture.') ||
    file.startsWith('www/content/guide/architecture.');
}

const textCheck: DocsTruthCheck = {
  name: 'text',
  run: async () => {
    const issues: { file: string; message: string }[] = [];

    const files = (await gitTrackedFiles()).map(normalizeSlashes).filter(textShouldScan);
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

    return { passed: issues.length === 0, failures: issues };
  },
};

// ─── evidence: release evidence consistency + forward-tag assertion ────────
import {
  type ReleaseClosureRecord,
  type ReleaseEvidenceSnapshot,
  validateReleaseEvidenceClosure,
} from './lib/release-evidence-consistency.ts';
import { readJson } from './lib/fs.ts';

const EVIDENCE_DIR = 'docs/release/autoflow3';
const FIRST_TAGGED_VERSION = '0.41.0-alpha.14';

/**
 * Semver window for the forward-tag sweep: evidence records older than the
 * first tagged release predate the immutable-tag policy. This must be a
 * numeric semver compare — lexicographic order ranks '0.41.0-alpha.2' above
 * '0.41.0-alpha.14' and would sweep untagged history into the gate.
 */
export function isInEvidenceWindow(version: string): boolean {
  return compareVersions(version, FIRST_TAGGED_VERSION) >= 0;
}

const evidenceCheck: DocsTruthCheck = {
  name: 'evidence',
  run: async () => {
    const failures: { file: string; message: string }[] = [];

    for (const entry of Deno.readDirSync(EVIDENCE_DIR)) {
      if (!entry.isFile || !entry.name.endsWith('.json')) continue;
      if (entry.name.endsWith('-prepare.json')) continue;
      const tagName = entry.name.slice(0, -'.json'.length);
      const version = tagName.startsWith('v') ? tagName.slice(1) : tagName;
      if (!isInEvidenceWindow(version)) continue;
      const snapshot = await readJson(`${EVIDENCE_DIR}/${entry.name}`) as {
        status?: string;
      };
      if (snapshot.status !== 'completed') continue;
      if (!await gitTagExists(tagName)) {
        failures.push({
          file: `${EVIDENCE_DIR}/${entry.name}`,
          message: `completed release ${version} is missing its immutable tag ${tagName}`,
        });
      }
    }

    const tag = PACKAGE_VERSION_TAG;
    const evidencePath = `docs/release/autoflow3/${tag}.json`;
    const closurePath = `docs/release/${tag}-closure.json`;
    const releaseNotePath = `docs/release/${tag}.md`;
    const currentTagExists = await gitTagExists(tag);

    let closureRecord: ReleaseClosureRecord | undefined;
    try {
      closureRecord = await readJson(closurePath) as ReleaseClosureRecord;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      if (currentTagExists) {
        failures.push({
          file: closurePath,
          message: `published release tag ${tag} is missing its required closure record`,
        });
      }
      return { passed: failures.length === 0, failures };
    }

    try {
      const actualTagCommit = await runGit(['rev-parse', tag]);
      if (actualTagCommit !== closureRecord.tagCommit) {
        failures.push({
          file: closurePath,
          message:
            `release tag ${tag} moved: expected ${closureRecord.tagCommit}, got ${actualTagCommit}`,
        });
      }
      await runGit(['cat-file', '-e', `${closureRecord.finalEvidenceCommit}^{commit}`]);

      const tagEvidence = JSON.parse(
        await runGit(['show', `${closureRecord.tagCommit}:${evidencePath}`]),
      ) as ReleaseEvidenceSnapshot;
      const finalEvidence = JSON.parse(
        await runGit(['show', `${closureRecord.finalEvidenceCommit}:${evidencePath}`]),
      ) as ReleaseEvidenceSnapshot;
      const validationFailures = validateReleaseEvidenceClosure({
        version: PACKAGE_VERSION,
        record: closureRecord,
        tagIsAncestorOfFinal: await isAncestorCommit(
          closureRecord.tagCommit,
          closureRecord.finalEvidenceCommit,
        ),
        finalIsAncestorOfHead: await isAncestorCommit(closureRecord.finalEvidenceCommit, 'HEAD'),
        tagEvidence,
        finalEvidence,
        releaseNote: await Deno.readTextFile(releaseNotePath),
      });
      for (const failure of validationFailures) {
        failures.push({ file: closurePath, message: failure });
      }
    } catch (error) {
      // The release note read is the only NotFound source in this try; a
      // published tag without its note must fail closed (like the missing
      // closure record above), not silently skip the note checks.
      if (error instanceof Deno.errors.NotFound) {
        failures.push({
          file: releaseNotePath,
          message: `published release tag ${tag} is missing its release note`,
        });
      } else {
        failures.push({
          file: closurePath,
          message: `evidence check error: ${formatError(error)}`,
        });
      }
    }

    return { passed: failures.length === 0, failures };
  },
};

// ─── registry ──────────────────────────────────────────────────────────────
// ─── claims: code/claim alignment (#893) ──────────────────────────────────
import { checkClaim, CODE_CLAIMS } from './claims-registry.ts';

const claimsCheck: DocsTruthCheck = {
  name: 'claims',
  run: () => {
    const failures: { file: string; message: string }[] = [];
    for (const claim of CODE_CLAIMS) {
      const failure = checkClaim(claim);
      if (failure) failures.push({ file: claim.id, message: failure });
    }
    return { passed: failures.length === 0, failures };
  },
};

const docsTruthChecks: DocsTruthCheck[] = [
  strategicCheck,
  publicCheck,
  currentCheck,
  wwwCheck,
  textCheck,
  evidenceCheck,
  claimsCheck,
];

async function runDocsTruthChecks(
  checks: DocsTruthCheck[],
  opts: CheckContext = {},
): Promise<{ passed: boolean; failures: { file: string; message: string }[] }> {
  const failures: { file: string; message: string }[] = [];
  for (const check of checks) {
    const result = await check.run(opts);
    if (!result.passed) {
      for (const failure of result.failures) {
        failures.push({ file: failure.file, message: `[${check.name}] ${failure.message}` });
      }
    } else {
      console.log(`${check.name}: passed`);
    }
  }
  return { passed: failures.length === 0, failures };
}

function parseArgs(args: string[]): { name?: string; artifacts: boolean } {
  let name: string | undefined;
  let artifacts = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check' || args[i] === '--check=') {
      name = args[i + 1] ?? args[i].split('=')[1];
      i++;
    } else if (args[i].startsWith('--check=')) {
      name = args[i].split('=')[1];
    } else if (args[i] === '--artifacts') {
      artifacts = true;
    }
  }
  return { name, artifacts };
}

if (import.meta.main) {
  const { name, artifacts } = parseArgs(Deno.args);
  const checks = name ? docsTruthChecks.filter((check) => check.name === name) : docsTruthChecks;
  if (name && checks.length === 0) {
    console.error(`Unknown docs-truth check: ${name}`);
    Deno.exit(1);
  }
  const result = await runDocsTruthChecks(checks, { artifacts });
  if (!result.passed) {
    console.error('Docs truth check failed:');
    for (const failure of result.failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    Deno.exit(1);
  }
  const labels = checks.map((check) => check.name).join('+');
  console.log(`Docs truth check passed (${labels}).`);
}
