/** Shared route-entry expressions and document option emission. */
import type { ImportDecl, RendererDecl } from '../protocol/ssg.ts';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';

export function renderImport(imp: ImportDecl): string {
  const names = imp.alias ? `${imp.names[0]} as ${imp.alias}` : imp.names.join(', ');
  return `import { ${names} } from '${imp.from}'`;
}

export function routeTagNameExpr(varNameOrFallback: string, fallback?: string): string {
  const tagName = fallback ?? varNameOrFallback;
  return quoteGeneratedJavaScriptValue(tagName);
}

export function pageDefinitionExpr(varName: string): string {
  return `__pageDefinition(${varName})`;
}

export function routeMetaExpr(varName: string): string {
  return `__routeMeta(${varName})`;
}

/**
 * Renderer scope matching, case-sensitive (URL paths are case-sensitive and
 * Hono routes match case-sensitively). Used at codegen time by
 * renderRouteHandler; the runtime __matchingRenderers function emitted by
 * renderMatchingRenderersFn() must mirror these semantics exactly.
 */
export function rendererScopeMatches(routePath: string, scope: string): boolean {
  if (scope === '/') return true;
  return routePath === scope || routePath.startsWith(scope + '/');
}

/**
 * Emit the runtime __matchingRenderers(routePath) function for the SSG
 * renderRoute. Semantics mirror rendererScopeMatches() — keep them in sync.
 */
export function renderMatchingRenderersFn(lines: string[], renderers: RendererDecl[]): void {
  lines.push('function __matchingRenderers(routePath) {');
  lines.push('  const renderers = [];');
  for (const renderer of renderers) {
    if (renderer.scope === '/') {
      lines.push(`  renderers.push(${renderer.varName}.default);`);
    } else {
      lines.push(
        `  if (routePath === ${
          quoteGeneratedJavaScriptValue(renderer.scope)
        } || routePath.startsWith(${
          quoteGeneratedJavaScriptValue(renderer.scope + '/')
        })) renderers.push(${renderer.varName}.default);`,
      );
    }
  }
  lines.push('  return renderers;');
  lines.push('}');
}

/** wrapInDocument() options object shared by page handlers and the SSG renderRoute. */
export function documentWrapOptionsLines(options: {
  /** Expression yielding the page definition (head source), e.g. `__page`. */
  pageExpr: string;
  titleExpr: string;
  langExpr: string;
  headExtrasExpr: string;
  allowHeadExtrasScripts: boolean;
  /** Emit the per-request CSP nonce line (Hono handlers only). */
  cspNonce?: boolean;
}): string[] {
  const lines = [
    `title: ${options.titleExpr},`,
    `lang: ${options.langExpr},`,
    `meta: { description: ${options.pageExpr}.head?.description, tags: ${options.pageExpr}.head?.meta },`,
    `headExtras: ${options.headExtrasExpr},`,
    `dangerouslyHeadFragments: ${options.pageExpr}.head?.dangerouslyHeadFragments || [],`,
    `allowHeadExtrasScripts: ${JSON.stringify(options.allowHeadExtrasScripts)},`,
  ];
  if (options.cspNonce) lines.push(`cspNonce: c.get('cspNonce'),`);
  return lines;
}
