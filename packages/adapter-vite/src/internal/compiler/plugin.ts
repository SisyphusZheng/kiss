/**
 * @openelement/adapter-vite — open:compiled-element spike plugin (#1160).
 *
 * Vite integration boundary for the alpha.0 TSX-to-Part Program compiler.
 * The hook activates only for .tsx modules that opt into the compiled model
 * with a real `@element(...)` decorator application on a class declaration;
 * everything else passes through untouched. Admission is two-staged: a cheap
 * `@element(` substring prefilter keeps plain modules off the AST path, then
 * an AST check (the compiler's own decorator detection) confirms the
 * application before compilation commits — a module that merely mentions the
 * marker inside a string literal or comment is not compiled. Unsupported
 * grammar in a genuinely decorated module still fails the build through
 * this.error() with a source-located OEC9xx diagnostic — there is no runtime
 * fallback.
 *
 * Internal alpha.0 spike only: not part of the public adapter API.
 */

import ts from 'typescript';
import type { Plugin } from 'vite';
import { CompiledSpikeError, compileElementSpike, type CompileSpikeResult } from './compile.ts';

export const COMPILED_ELEMENT_MARKER = '@element(';

interface CompiledElementSourceMap {
  version: 3;
  file: string;
  sources: string[];
  sourcesContent: string[];
  names: string[];
  mappings: string;
  /** Compiler-owned Part Program source records carried through Vite. */
  x_openElement?: unknown;
}

/** Cheap first stage: the marker substring must appear in a .tsx module. */
export function isCompiledElementModule(code: string, id: string): boolean {
  return /\.tsx(?:\?|$)/.test(id) && code.includes(COMPILED_ELEMENT_MARKER);
}

/**
 * Precise second stage behind the substring prefilter, mirroring the
 * compiler's own decorator detection in compile.ts: a real `@element(...)`
 * decorator application on a class declaration. Modules that only mention
 * the marker in a string literal or comment do not reach the compiler.
 */
export function hasElementDecoratorApplication(code: string, id: string): boolean {
  const sf = ts.createSourceFile(id, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
  return sf.statements.some((statement) =>
    ts.isClassDeclaration(statement) &&
    (ts.getDecorators(statement) ?? []).some((decorator) => {
      const expr = decorator.expression;
      return ts.isCallExpression(expr) && expr.expression.getText(sf) === 'element';
    })
  );
}

/**
 * Compile one opted-in module without binding the caller to Vite. The core
 * adapter hook and the inline SSR/client builds all use this same function,
 * which prevents duplicate compiler implementations from drifting. Returns
 * null for modules without a real @element decorator application, so
 * marker-mentioning modules pass through untouched.
 */
export function compileElementModule(code: string, id: string): CompileSpikeResult | null {
  if (!isCompiledElementModule(code, id)) return null;
  if (!hasElementDecoratorApplication(code, id)) return null;
  return compileElementSpike(code, id);
}

function encodeVlq(value: number): string {
  const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let current = value < 0 ? ((-value) << 1) | 1 : value << 1;
  let encoded = '';
  do {
    let digit = current & 31;
    current >>>= 5;
    if (current > 0) digit |= 32;
    encoded += base64[digit];
  } while (current > 0);
  return encoded;
}

/**
 * Emit a small source map for generated compiler modules. Generated program
 * data has no source position of its own, while copied fields/methods can be
 * mapped back to their source line. Unmapped scaffolding points at line 1 so
 * Vite and stack consumers still have a valid, named source rather than an
 * absent map.
 */
export function createCompiledElementSourceMap(
  source: string,
  generated: string,
  id: string,
  program?: unknown,
): CompiledElementSourceMap {
  const sourceLines = source.split(/\r?\n/);
  let previousOriginalLine = 0;
  const mappings = generated.split('\n').map((line) => {
    const text = line.trim();
    const match = text.length > 0
      ? sourceLines.findIndex((sourceLine) => sourceLine.trim() === text)
      : -1;
    const originalLine = match >= 0 ? match : 0;
    const mapping = `AA${encodeVlq(originalLine - previousOriginalLine)}A`;
    previousOriginalLine = originalLine;
    return mapping;
  }).join(';');
  const artifactSourceMap = program && typeof program === 'object'
    ? (program as { sourceMap?: unknown }).sourceMap
    : undefined;
  return {
    version: 3,
    file: id,
    sources: [id],
    sourcesContent: [source],
    names: [],
    mappings,
    ...(artifactSourceMap === undefined ? {} : { x_openElement: artifactSourceMap }),
  };
}

export function compiledElementPlugin(): Plugin {
  return {
    name: 'open:compiled-element',

    transform(code, id) {
      try {
        return compileElementModule(code, id)?.code ?? null;
      } catch (error) {
        if (error instanceof CompiledSpikeError) {
          this.error(error.message);
        }
        throw error;
      }
    },
  };
}
