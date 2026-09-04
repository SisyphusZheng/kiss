/**
 * Website source-truth agreement gate (#1159, B2.4): the hand-maintained
 * surfaces that are NOT yet generated must mechanically agree with owned
 * truth, fail-closed:
 *
 *   nav     — committed _generated-nav.ts must be a byte-identical
 *             regeneration of route meta + the vite.config headerNav, and
 *             every internal headerNav href must resolve to a real route.
 *   locale  — no orphan zh content (zh without en), no missing zh
 *             translation for guide/architecture, and no byte-identical
 *             en/zh pair (a duplicated untranslated route).
 *   roadmap — the roadmap route's CURRENT-stamped entry must name the
 *             current package version tag from tools/project-constants.ts.
 *
 * Version constants (www/app/data/version.ts) are already pinned to
 * project-constants by docs:check-version-anchors; release-state agreement
 * is owned by release:truth:check. This gate composes, not duplicates.
 */

import { parseTypeScript } from './lib/typescript-ast.ts';
import { scanRoutes } from '../packages/adapter-vite/src/internal/ssg/route-scanner.ts';
import { scanNavData } from '../packages/adapter-vite/src/internal/content/nav/scanner.ts';
import { writeNavModule } from '../packages/adapter-vite/src/internal/content/nav/writer.ts';
import { PACKAGE_VERSION_TAG } from './project-constants.ts';
import ts from 'typescript';

const WWW_ROOT = 'www';
const GENERATED_NAV = `${WWW_ROOT}/app/data/_generated-nav.ts`;

export interface WwwTruthFailure {
  file: string;
  message: string;
}

// ─── nav truth ──────────────────────────────────────────────────────────────

interface HeaderNavLink {
  href: string;
  label: string;
}

/** Read the headerNav literal out of vite.config.ts through the TS AST. */
export function extractHeaderNav(source: string): HeaderNavLink[] {
  const file = parseTypeScript(source, 'vite.config.ts');
  const links: HeaderNavLink[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) && node.name.text === 'headerNav' &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        const record: Record<string, string> = {};
        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property)) continue;
          const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
            ? property.name.text
            : undefined;
          if (key && ts.isStringLiteralLike(property.initializer)) {
            record[key] = property.initializer.text;
          }
        }
        if (typeof record.href === 'string' && typeof record.label === 'string') {
          links.push({ href: record.href, label: record.label });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return links;
}

async function checkNav(failures: WwwTruthFailure[]): Promise<void> {
  const viteConfig = await Deno.readTextFile(`${WWW_ROOT}/vite.config.ts`);
  const headerNav = extractHeaderNav(viteConfig);
  if (headerNav.length === 0) {
    failures.push({ file: 'www/vite.config.ts', message: 'headerNav not found or empty' });
  }

  const scanned = await scanRoutes(`${WWW_ROOT}/app/routes`);
  const routes = new Set<string>(['/']);
  for (const entry of scanned) {
    if (entry.type === 'page' && !entry.path.includes(':')) {
      routes.add(entry.path === '' ? '/' : entry.path);
    }
  }
  for (const link of headerNav) {
    if (!link.href.startsWith('/')) continue; // external links are fine
    if (!routes.has(link.href.replace(/\/+$/, '') || '/')) {
      failures.push({
        file: 'www/vite.config.ts',
        message: `headerNav href '${link.href}' does not resolve to a scanned route`,
      });
    }
  }

  const navSections = await scanNavData({ routesDir: `${WWW_ROOT}/app/routes`, headerNav });
  const expected = writeNavModule({ headerNav, navSections });
  let committed: string;
  try {
    committed = await Deno.readTextFile(GENERATED_NAV);
  } catch {
    failures.push({ file: GENERATED_NAV, message: 'generated nav module is missing' });
    return;
  }
  if (committed !== expected) {
    failures.push({
      file: GENERATED_NAV,
      message:
        'generated nav is stale; it must be a byte-identical regeneration of route meta + headerNav',
    });
  }
}

// ─── locale availability ────────────────────────────────────────────────────

async function checkLocaleAvailability(failures: WwwTruthFailure[]): Promise<void> {
  for (const collection of ['guide', 'architecture'] as const) {
    const dir = `${WWW_ROOT}/content/${collection}`;
    const slugs = new Map<string, { en?: string; zh?: string }>();
    for await (const entry of Deno.readDir(dir)) {
      if (!entry.isFile || !entry.name.endsWith('.md')) continue;
      const localized = entry.name.match(/^(.*)\.zh\.md$/);
      const slug = localized ? localized[1] : entry.name.slice(0, -'.md'.length);
      const record = slugs.get(slug) ?? {};
      if (localized) record.zh = entry.name;
      else record.en = entry.name;
      slugs.set(slug, record);
    }
    for (const [slug, record] of [...slugs.entries()].sort()) {
      if (record.zh && !record.en) {
        failures.push({
          file: `${dir}/${record.zh}`,
          message: `orphan zh translation: ${collection}/${slug} has no English source`,
        });
      }
      if (record.en && !record.zh) {
        failures.push({
          file: `${dir}/${record.en}`,
          message:
            `missing zh translation: ${collection}/${slug} (a locale alternate would be false)`,
        });
      }
      if (record.en && record.zh) {
        const [en, zh] = await Promise.all([
          Deno.readTextFile(`${dir}/${record.en}`),
          Deno.readTextFile(`${dir}/${record.zh}`),
        ]);
        if (en === zh) {
          failures.push({
            file: `${dir}/${record.zh}`,
            message:
              `byte-identical en/zh pair: ${collection}/${slug} is a duplicated untranslated route`,
          });
        }
      }
    }
  }
}

// ─── roadmap version agreement ──────────────────────────────────────────────

/** Extract the CURRENT-stamped roadmap entry version through the TS AST. */
export function roadmapCurrentVersion(source: string): string | undefined {
  const file = parseTypeScript(source, 'roadmap.tsx');
  let version: string | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isObjectLiteralExpression(node)) {
      let stamp: string | undefined;
      let entryVersion: string | undefined;
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = ts.isIdentifier(property.name) ? property.name.text : undefined;
        if (!ts.isStringLiteralLike(property.initializer)) continue;
        if (key === 'stamp') stamp = property.initializer.text;
        if (key === 'version') entryVersion = property.initializer.text;
      }
      if (stamp === 'CURRENT' && entryVersion) version = entryVersion;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return version;
}

async function checkRoadmap(failures: WwwTruthFailure[]): Promise<void> {
  const path = `${WWW_ROOT}/app/routes/roadmap.tsx`;
  const source = await Deno.readTextFile(path);
  const current = roadmapCurrentVersion(source);
  if (current === undefined) {
    failures.push({ file: path, message: 'no CURRENT-stamped roadmap entry found' });
  } else if (current !== PACKAGE_VERSION_TAG) {
    failures.push({
      file: path,
      message:
        `CURRENT roadmap entry names '${current}', but the package line is '${PACKAGE_VERSION_TAG}'`,
    });
  }
}

export async function checkWwwTruth(): Promise<WwwTruthFailure[]> {
  const failures: WwwTruthFailure[] = [];
  await checkNav(failures);
  await checkLocaleAvailability(failures);
  await checkRoadmap(failures);
  return failures;
}

if (import.meta.main) {
  const failures = await checkWwwTruth();
  if (failures.length > 0) {
    console.error('www truth check failed:');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    Deno.exit(1);
  }
  console.log('www truth check passed (nav + locale availability + roadmap).');
}
