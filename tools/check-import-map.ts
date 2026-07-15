/** Verify every bare import in a generated starter is declared in its import map. */

import { join, relative } from 'node:path';
import { walk } from './lib/fs.ts';
import { extractStaticModuleSpecifiers } from './lib/typescript-ast.ts';

interface UndeclaredImport {
  file: string;
  specifier: string;
}

function isBare(specifier: string): boolean {
  return /^[@#a-zA-Z]/.test(specifier) && !/^(?:node|npm|jsr|https?):/.test(specifier);
}

export function findBareImports(source: string, path = 'source.ts'): string[] {
  return extractStaticModuleSpecifiers(source, path)
    .map(({ value }) => value)
    .filter(isBare);
}

export function isImportDeclared(specifier: string, declared: Set<string>): boolean {
  if (declared.has(specifier)) return true;
  return [...declared].some((entry) => entry.endsWith('/') && specifier.startsWith(entry));
}

function fileUrlPath(url: URL): string {
  const path = url.pathname;
  return path.startsWith('/') && path.length > 2 && path.charAt(2) === ':' ? path.slice(1) : path;
}

async function main(): Promise<void> {
  const repoRootPath = fileUrlPath(new URL('../', import.meta.url));
  const tmpDir = Deno.makeTempDirSync({ prefix: 'openElement-import-check-' });
  const projectName = 'import-check-app';
  try {
    console.log(`Generating test project in ${tmpDir}...`);
    const createResult = await new Deno.Command(Deno.execPath(), {
      args: ['run', '-A', join(repoRootPath, 'packages', 'create', 'src', 'cli.ts'), projectName],
      cwd: tmpDir,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!createResult.success) {
      throw new Error(
        `Failed to generate test project:\n${new TextDecoder().decode(createResult.stderr)}`,
      );
    }

    const projectDir = join(tmpDir, projectName);
    const config = JSON.parse(await Deno.readTextFile(join(projectDir, 'deno.json'))) as {
      imports?: Record<string, string>;
    };
    const declared = new Set(Object.keys(config.imports ?? {}));
    const errors: UndeclaredImport[] = [];
    for await (const filePath of walk(projectDir, { skip: ['node_modules', 'dist', '.git'] })) {
      const relativePath = relative(projectDir, filePath).replace(/\\/g, '/');
      if (!/\.(?:ts|tsx|js|jsx)$/.test(relativePath)) continue;
      for (const specifier of findBareImports(await Deno.readTextFile(filePath), relativePath)) {
        if (!isImportDeclared(specifier, declared)) errors.push({ file: relativePath, specifier });
      }
    }
    if (errors.length > 0) {
      const details = errors.map((error) =>
        `  ${error.file}: "${error.specifier}" not in deno.json imports`
      ).join('\n');
      throw new Error(`Undeclared imports found in generated project:\n${details}`);
    }
    console.log('Import map check passed — all bare imports are declared in deno.json.');
  } finally {
    await Deno.remove(tmpDir, { recursive: true }).catch(() => undefined);
  }
}

if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
