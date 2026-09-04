/**
 * Content example type-check gate (#1159, B2.4): TypeScript/TSX fenced code
 * blocks in the authored bilingual guides that import `@openelement/*` must
 * type-check against the real v0.44 framework sources. zh duplicates of an
 * en block are deduped by content. Fails closed with compiler diagnostics.
 *
 * Elision convention: guide snippets are written as consumer-project modules
 * and legitimately omit application context. The harness therefore suppresses
 * only the diagnostics that express that elision — unresolved non-framework
 * module specifiers (TS2307 outside `@openelement/*`; the virtual
 * `@openelement/generated/*` namespace is adapter-generated consumer code),
 * undefined names from elided app code (TS2304), implicit-any (TS7006) and
 * property access on the uninferred loader-data generic (TS2339 on `{}`).
 * Everything on the framework surface — unknown `@openelement` modules or
 * exports, argument/assignability errors against real APIs, syntax and JSX
 * errors — fails the gate.
 */
import ts from 'typescript';
import { walk } from '@std/fs/walk';
import { readPackages } from './lib/package-graph.ts';

export interface ExampleFailure {
  file: string;
  message: string;
}

export interface ContentExample {
  /** First source document the block was found in. */
  file: string;
  index: number;
  lang: string;
  code: string;
}

const FENCE_PATTERN = /```(ts|tsx)\n([\s\S]*?)```/g;

/** Extract unique ts/tsx fenced blocks that import @openelement packages. */
export function extractExamples(file: string, markdown: string): ContentExample[] {
  const examples: ContentExample[] = [];
  for (const match of markdown.matchAll(FENCE_PATTERN)) {
    const code = match[2];
    if (!code.includes('@openelement/')) continue;
    examples.push({ file, index: examples.length, lang: match[1], code });
  }
  return examples;
}

/** Build a paths map resolving workspace @openelement/* specifiers to files. */
export async function workspacePaths(): Promise<Record<string, string[]>> {
  const paths: Record<string, string[]> = {};
  for (const pkg of await readPackages()) {
    const entries = typeof pkg.exports === 'string'
      ? { '.': pkg.exports }
      : (pkg.exports ?? {}) as Record<string, string>;
    for (const [key, target] of Object.entries(entries)) {
      if (typeof target !== 'string') continue;
      const specifier = key === '.' ? pkg.name : `${pkg.name}/${key.replace(/^\.\//, '')}`;
      paths[specifier] = [`${pkg.dir}/${target.replace(/^\.\//, '')}`];
    }
  }
  return paths;
}

/**
 * Type-check the given example blocks against the real framework. Each block
 * is compiled as its own module in one shared program so diagnostics carry
 * the example's virtual file name.
 */
export async function typeCheckExamples(examples: ContentExample[]): Promise<ExampleFailure[]> {
  if (examples.length === 0) return [];
  // The temp dir must live inside the workspace so node_modules resolution
  // (vite, preact, ...) walks up to the repo's dependencies; `.tmp` is
  // gitignored, so create it first (clean CI checkouts do not carry it).
  await Deno.mkdir('.tmp', { recursive: true });
  const dir = await Deno.makeTempDir({ dir: '.tmp', prefix: 'content-examples-' });
  try {
    const files: string[] = [];
    for (const [index, example] of examples.entries()) {
      const name = `example-${index}.${example.lang}`;
      await Deno.writeTextFile(`${dir}/${name}`, example.code);
      files.push(`${dir}/${name}`);
    }
    const paths = await workspacePaths();
    const options: ts.CompilerOptions = {
      allowImportingTsExtensions: true,
      experimentalDecorators: true,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: '@openelement/element',
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ESNext,
      baseUrl: Deno.cwd(),
      paths,
      // Doc snippets are teaching material, not shippable modules: unused
      // locals and missing return-type annotations are not defects there.
      noUnusedLocals: false,
      noUnusedParameters: false,
    };
    const program = ts.createProgram(files, options);
    const failures: ExampleFailure[] = [];
    for (const [index, file] of files.entries()) {
      const source = program.getSourceFile(file);
      if (!source) {
        failures.push({ file: examples[index].file, message: 'example failed to parse' });
        continue;
      }
      const diagnostics = [
        ...program.getSyntacticDiagnostics(source),
        ...program.getSemanticDiagnostics(source),
      ];
      for (const diagnostic of diagnostics) {
        if (suppressElidedDiagnostic(diagnostic)) continue;
        const position = diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
        failures.push({
          file: `${examples[index].file} (block ${examples[index].index + 1})`,
          message: `TS${diagnostic.code} at line ${(position?.line ?? 0) + 1}: ${
            ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
          }`,
        });
      }
    }
    return failures;
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/**
 * Elided-context suppression (see the module header): returns true only for
 * diagnostics that express documented snippet elision, never framework-surface
 * errors.
 */
export function suppressElidedDiagnostic(diagnostic: ts.Diagnostic): boolean {
  const text = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
  if (diagnostic.code === 2307) {
    // Unresolved module: only framework modules are harness truth. The
    // `@openelement/generated/*` namespace is adapter-emitted consumer code.
    if (/Cannot find module '@openelement\/(?!generated\/)/.test(text)) return false;
    return true;
  }
  // Undefined names from elided application code.
  if (diagnostic.code === 2304) return true;
  // Implicit-any in teaching snippets.
  if (diagnostic.code === 7006) return true;
  // Property access on the uninferred loader-data generic (`{}`).
  if (diagnostic.code === 2339 && text.includes(`on type '{}'`)) return true;
  return false;
}

export async function checkContentExamples(): Promise<ExampleFailure[]> {
  const seen = new Set<string>();
  const examples: ContentExample[] = [];
  for (const dir of ['www/content/guide', 'www/content/architecture']) {
    for await (const entry of walk(dir, { includeDirs: false, exts: ['.md'] })) {
      const markdown = await Deno.readTextFile(entry.path);
      for (const example of extractExamples(entry.path, markdown)) {
        // en/zh translations carry identical code — check each block once.
        if (seen.has(example.code)) continue;
        seen.add(example.code);
        examples.push(example);
      }
    }
  }
  return await typeCheckExamples(examples);
}

if (import.meta.main) {
  const failures = await checkContentExamples();
  if (failures.length > 0) {
    console.error('Content example type-check failed:');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    Deno.exit(1);
  }
  console.log('Content example type-check passed.');
}
