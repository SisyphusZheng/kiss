import { assertEquals } from '@std/assert';
import {
  findRecipeParityIssues,
  isSafeRecipeSourcePath,
  parseRecipeSnippets,
} from './check-supabase-recipe-parity.ts';

const SOURCE = `export function secure(request: Request) {
  return new URL(request.url).protocol === 'https:';
}
`;

function recipe(body: string, header = '// lib/security.ts'): string {
  return `# Recipe

\`\`\`ts
${header}
${body}
\`\`\`
`;
}

Deno.test('Supabase recipe parity accepts an exact source excerpt', () => {
  const snippets = parseRecipeSnippets(recipe(SOURCE.trim()));
  assertEquals(
    findRecipeParityIssues(snippets, new Map([['lib/security.ts', SOURCE]])),
    [],
  );
});

Deno.test('Supabase recipe parity rejects an intentionally stale security snippet', () => {
  const stale = `export function secure(request: Request) {
  return request.url.startsWith('https://');
}`;
  const issues = findRecipeParityIssues(
    parseRecipeSnippets(recipe(stale)),
    new Map([['lib/security.ts', SOURCE]]),
  );
  assertEquals(issues.map((issue) => issue.message), [
    'recipe excerpt drifted from the maintained reference source',
  ]);
});

Deno.test('Supabase recipe parity requires a safe source-path header', () => {
  const missing = findRecipeParityIssues(
    parseRecipeSnippets(recipe('const x = 1;', 'const x = 1;')),
    new Map(),
  );
  assertEquals(missing[0]?.message, 'recipe fence must start with a // or -- source-path comment');
  assertEquals(isSafeRecipeSourcePath('../secret.ts'), false);
  assertEquals(isSafeRecipeSourcePath('/tmp/secret.ts'), false);
  assertEquals(isSafeRecipeSourcePath('app/routes/login.tsx'), true);
});
