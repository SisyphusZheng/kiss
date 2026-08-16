/**
 * Mechanical source-of-truth gate for docs/integrations/supabase.md (#988).
 *
 * Every TypeScript, TSX, and SQL fence must start with a source-path comment:
 *
 *   // app/routes/login.tsx
 *   -- supabase/migrations/20260816000000_notes.sql
 *
 * The remaining fence body must be an exact contiguous excerpt of that file
 * in examples/supabase-cloudflare-starter. This keeps the readable recipe
 * hand-curated while making implementation drift a hard CI failure.
 */

import { isAbsolute, join, normalize } from '@std/path';

export interface RecipeSnippet {
  language: 'ts' | 'tsx' | 'sql';
  sourcePath?: string;
  body: string;
  line: number;
}

export interface RecipeParityIssue {
  line: number;
  sourcePath?: string;
  message: string;
}

const RECIPE_FENCE = /```(ts|tsx|sql)\n([\s\S]*?)\n```/g;
const SOURCE_HEADER = /^(?:\/\/|--)\s+([^\s]+)\s*$/;

export function parseRecipeSnippets(markdown: string): RecipeSnippet[] {
  return [...markdown.matchAll(RECIPE_FENCE)].map((match) => {
    const content = match[2];
    const lines = content.split('\n');
    const header = lines.shift() ?? '';
    return {
      language: match[1] as RecipeSnippet['language'],
      sourcePath: header.match(SOURCE_HEADER)?.[1],
      body: lines.join('\n'),
      line: markdown.slice(0, match.index).split('\n').length,
    };
  });
}

export function isSafeRecipeSourcePath(path: string): boolean {
  if (isAbsolute(path) || path.includes('\\')) return false;
  const normalized = normalize(path);
  return normalized !== '..' && !normalized.startsWith('../') && normalized === path;
}

export function findRecipeParityIssues(
  snippets: RecipeSnippet[],
  sources: ReadonlyMap<string, string>,
): RecipeParityIssue[] {
  const issues: RecipeParityIssue[] = [];
  for (const snippet of snippets) {
    if (!snippet.sourcePath) {
      issues.push({
        line: snippet.line,
        message: 'recipe fence must start with a // or -- source-path comment',
      });
      continue;
    }
    if (!isSafeRecipeSourcePath(snippet.sourcePath)) {
      issues.push({
        line: snippet.line,
        sourcePath: snippet.sourcePath,
        message: 'recipe source path must be a normalized relative path inside the starter',
      });
      continue;
    }
    if (!snippet.body.trim()) {
      issues.push({
        line: snippet.line,
        sourcePath: snippet.sourcePath,
        message: 'recipe excerpt is empty',
      });
      continue;
    }
    const source = sources.get(snippet.sourcePath);
    if (source === undefined) {
      issues.push({
        line: snippet.line,
        sourcePath: snippet.sourcePath,
        message: 'recipe source file does not exist',
      });
      continue;
    }
    if (!source.includes(snippet.body)) {
      issues.push({
        line: snippet.line,
        sourcePath: snippet.sourcePath,
        message: 'recipe excerpt drifted from the maintained reference source',
      });
    }
  }
  return issues;
}

async function main(): Promise<void> {
  const root = join(import.meta.dirname!, '..');
  const docPath = join(root, 'docs/integrations/supabase.md');
  const starterRoot = join(root, 'examples/supabase-cloudflare-starter');
  const markdown = await Deno.readTextFile(docPath);
  const snippets = parseRecipeSnippets(markdown);
  const sources = new Map<string, string>();

  for (const path of new Set(snippets.flatMap((snippet) => snippet.sourcePath ?? []))) {
    if (!isSafeRecipeSourcePath(path)) continue;
    try {
      sources.set(path, await Deno.readTextFile(join(starterRoot, path)));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }

  const issues = findRecipeParityIssues(snippets, sources);
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(
        `docs/integrations/supabase.md:${issue.line}: ${issue.message}${
          issue.sourcePath ? ` (${issue.sourcePath})` : ''
        }`,
      );
    }
    Deno.exit(1);
  }

  console.log(`Supabase recipe parity passed (${snippets.length} source-backed snippets).`);
}

if (import.meta.main) await main();
