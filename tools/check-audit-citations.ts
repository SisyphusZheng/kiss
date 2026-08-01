/**
 * check-audit-citations.ts — audit citation freshness guard (🟡-G / issue #722).
 *
 * Audit reports embed `path:LINE` (and `path:START-END`) citations. After a
 * refactor those line numbers drift, so a reader following the citation lands
 * on the wrong code — silently. This tool re-verifies every citation in an
 * audit report against the current working tree (default) or an arbitrary
 * historical commit (--sha), and reports drift.
 *
 * Citations are matched against the source tree even when the report uses an
 * abbreviated path (e.g. `ssg-render.ts:343` instead of the full
 * `packages/adapter-vite/src/internal/ssg/ssg-render.ts`). Ambiguous
 * basenames (e.g. `index.ts`) are flagged rather than guessed.
 *
 * Usage:
 *   deno run -A tools/check-audit-citations.ts [files...] [--sha=<commit>]
 *   deno run -A tools/check-audit-citations.ts --write   # append a verification appendix
 *
 * With no file arguments the tool scans docs/audit/ for reports archived under
 * the YYYY-MM-DD-* naming convention.
 *
 * Exit code is non-zero when any citation has drifted (so it can gate CI).
 * The --write flag instead appends a "Citation verification" appendix to each
 * report and always exits 0.
 */

import { walk } from '@std/fs/walk';

import { exists } from './lib/fs.ts';

interface Citation {
  file: string;
  start: number;
  end?: number;
  /** Character offset of the match inside the markdown source. */
  at: number;
}

const CITATION_RE = /(?<![:/\w])([A-Za-z0-9_./-]+\.(?:ts|tsx|js|jsx|mjs|cjs|md)):(\d+)(?:-(\d+))?/g;

interface Drift {
  citation: Citation;
  reason: string;
}

interface ResolvedLine {
  citation: Citation;
  snippet: string;
}

type ResolveResult = { path: string } | { ambiguous: string[] } | { missing: true };

const SOURCE_ROOTS = ['packages', 'www', 'tools', 'examples', 'docs'];
const SKIP_RE =
  /[/\\](node_modules|dist|vendor|\.nitro|www\/public|www\/content\/blog|playwright-report|test-results)[/\\]/;

const resolveCache = new Map<string, ResolveResult>();
const readCache = new Map<string, string | null>();

async function resolveFile(cited: string): Promise<ResolveResult> {
  const cached = resolveCache.get(cited);
  if (cached) return cached;

  // 1. As-is relative to repo root.
  if (await exists(cited)) {
    const r: ResolveResult = { path: cited };
    resolveCache.set(cited, r);
    return r;
  }

  // 2. Recursive match across curated source roots.
  const basename = cited.split('/').pop()!;
  const candidates: string[] = [];
  for (const root of SOURCE_ROOTS) {
    if (!(await exists(root))) continue;
    for await (const e of walk(root, { includeDirs: false, skip: [SKIP_RE] })) {
      if (e.path.endsWith(cited) || e.name === basename) candidates.push(e.path);
    }
  }
  const uniq = [...new Set(candidates)];
  if (uniq.length === 0) {
    const r: ResolveResult = { missing: true };
    resolveCache.set(cited, r);
    return r;
  }
  const exact = uniq.filter((p) => p.endsWith(cited));
  const pool = exact.length ? exact : uniq;
  if (pool.length === 1) {
    const r: ResolveResult = { path: pool[0] };
    resolveCache.set(cited, r);
    return r;
  }
  const r: ResolveResult = { ambiguous: pool };
  resolveCache.set(cited, r);
  return r;
}

async function readFileAt(path: string, sha?: string): Promise<string | null> {
  const key = `${sha ?? 'wt'}:${path}`;
  const cached = readCache.get(key);
  if (cached !== undefined) return cached;
  let content: string | null;
  if (sha) {
    const cmd = new Deno.Command('git', {
      args: ['show', `${sha}:${path}`],
      stdout: 'piped',
      stderr: 'null',
    });
    const { success, stdout } = await cmd.output();
    content = success ? new TextDecoder().decode(stdout) : null;
  } else {
    try {
      content = await Deno.readTextFile(path);
    } catch {
      content = null;
    }
  }
  readCache.set(key, content);
  return content;
}

function extractCitations(md: string): Citation[] {
  const out: Citation[] = [];
  CITATION_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CITATION_RE.exec(md)) !== null) {
    const file = m[1];
    if (file.includes('://')) continue;
    if (/^\d/.test(file)) continue;
    out.push({
      file,
      start: Number(m[2]),
      end: m[3] ? Number(m[3]) : undefined,
      at: m.index,
    });
  }
  const seen = new Set<string>();
  return out.filter((c) => {
    const key = `${c.file}:${c.start}${c.end ? `-${c.end}` : ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

interface Report {
  file: string;
  citations: Citation[];
  drifts: Drift[];
  resolved: ResolvedLine[];
}

async function checkReport(path: string, sha?: string): Promise<Report> {
  const md = await Deno.readTextFile(path);
  const citations = extractCitations(md);
  const drifts: Drift[] = [];
  const resolved: ResolvedLine[] = [];

  for (const c of citations) {
    const result = await resolveFile(c.file);
    if ('missing' in result) {
      drifts.push({
        citation: c,
        reason: 'file not found (moved, deleted, or abbreviated path unresolved)',
      });
      continue;
    }
    if ('ambiguous' in result) {
      drifts.push({
        citation: c,
        reason: `ambiguous path (${result.ambiguous.length} candidates: ${
          result.ambiguous.join(', ')
        })`,
      });
      continue;
    }
    const content = await readFileAt(result.path, sha);
    if (content === null) {
      drifts.push({ citation: c, reason: 'file not found at resolved path' });
      continue;
    }
    const lines = content.split('\n');
    const lastLine = c.end ?? c.start;
    if (c.start < 1 || lastLine > lines.length) {
      drifts.push({
        citation: c,
        reason: `line out of range (file now has ${lines.length} lines)`,
      });
      continue;
    }
    const cited = lines.slice(c.start - 1, lastLine).join(' ').trim();
    resolved.push({ citation: c, snippet: cited.slice(0, 120) });
  }

  return { file: path, citations, drifts, resolved };
}

function proseContext(md: string, at: number): string {
  const start = Math.max(0, at - 60);
  const end = Math.min(md.length, at + 60);
  return md.slice(start, end).replace(/\n/g, ' ').trim();
}

function renderAppendix(report: Report, sha?: string): string {
  const lines: string[] = ['', '---', '', '## 引用时效复核（自动生成）', ''];
  lines.push(
    `> 本附录由 \`tools/check-audit-citations.ts\` 生成。基线：${
      sha ? `commit ${sha}` : '当前工作树'
    }。`,
  );
  lines.push(`> 引用总数：${report.citations.length}；漂移：${report.drifts.length}。`);
  lines.push('');
  if (report.drifts.length > 0) {
    lines.push('### 漂移 / 无法核验的引用');
    lines.push('');
    for (const d of report.drifts) {
      const c = d.citation;
      lines.push(`- \`${c.file}:${c.start}${c.end ? `-${c.end}` : ''}\` — ${d.reason}`);
    }
    lines.push('');
  } else {
    lines.push('全部引用均能在基线中解析，无行号漂移。');
    lines.push('');
  }
  return lines.join('\n');
}

async function main() {
  const args = Deno.args;
  const writeMode = args.includes('--write');
  const shaArg = args.find((a) => a.startsWith('--sha='))?.slice('--sha='.length);
  const files = args.filter((a) => !a.startsWith('--'));

  let targets: string[];
  if (files.length > 0) {
    targets = files;
  } else {
    // Audit reports are archived under docs/audit/ with a YYYY-MM-DD-* name.
    const found: string[] = [];
    for await (const entry of Deno.readDir('docs/audit')) {
      if (entry.isFile && /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(entry.name)) {
        found.push(`docs/audit/${entry.name}`);
      }
    }
    targets = found.sort();
  }

  if (targets.length === 0) {
    console.error('No audit report files found.');
    Deno.exit(1);
  }

  const reports = await Promise.all(targets.map((t) => checkReport(t, shaArg)));
  let totalDrift = 0;

  for (const r of reports) {
    totalDrift += r.drifts.length;
    console.log(
      `${r.file}: ${r.citations.length} citations, ${r.drifts.length} drift` +
        (r.drifts.length ? ' — see below' : ''),
    );
    if (r.drifts.length) {
      const md = await Deno.readTextFile(r.file);
      for (const d of r.drifts) {
        const c = d.citation;
        console.log(`  ⚠ ${c.file}:${c.start}${c.end ? `-${c.end}` : ''} — ${d.reason}`);
        console.log(`     …${proseContext(md, c.at)}…`);
      }
    }
    if (writeMode) {
      const appendix = renderAppendix(r, shaArg);
      const existing = await Deno.readTextFile(r.file);
      if (!existing.includes('## 引用时效复核（自动生成）')) {
        await Deno.writeTextFile(r.file, existing.replace(/\n+$/, '') + '\n' + appendix + '\n');
        console.log(`  ✓ wrote citation appendix to ${r.file}`);
      } else {
        console.log(`  · ${r.file} already has a citation appendix; skipped`);
      }
    }
  }

  if (writeMode) {
    console.log('\nCitation appendix written. (--write mode always exits 0)');
    Deno.exit(0);
  }

  if (totalDrift > 0) {
    console.error(`\n${totalDrift} citation(s) have drifted. Re-verify or update the report.`);
    Deno.exit(1);
  }
  console.log('\nAll audit citations resolve cleanly.');
}

await main();
