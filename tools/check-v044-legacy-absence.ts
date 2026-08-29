#!/usr/bin/env -S deno run --allow-read --allow-env

/**
 * v0.44 distribution gate for the retired VNode/binding/hydration runtime.
 *
 * The checker intentionally scans emitted artifacts, not source comments or
 * documentation. It uses the TypeScript parser for code symbols and module
 * specifiers so explanatory strings and comments do not create false passes or
 * false failures. A missing artifact root is an error: an absence gate must
 * never pass by silently scanning zero files.
 */

import { walk } from '@std/fs/walk';
import ts from 'typescript';

export interface ArtifactSource {
  path: string;
  text: string;
}

export interface LegacyAbsenceViolation {
  path: string;
  line: number;
  rule: string;
  message: string;
}

export const DEFAULT_ARTIFACT_ROOTS = [
  'packages/element/dist',
  'packages/adapter-vite/dist',
  'packages/app/dist',
  'packages/ui/dist',
  'www/dist',
] as const;

const CODE_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.mjs', '.ts', '.tsx']);
const JSON_EXTENSIONS = new Set(['.json']);

const IDENTIFIER_RULES: Array<{ names: ReadonlySet<string>; rule: string; message: string }> = [
  {
    names: new Set(['VNode', 'isVNode', 'renderToDom', 'renderDsdTree']),
    rule: 'legacy-vnode',
    message: 'VNode renderer symbol is present in a v0.44 artifact',
  },
  {
    names: new Set([
      'BindingDescriptor',
      'applyBindingDescriptor',
      'commitBindings',
      'bindAttr',
      'bindClass',
      'bindConditional',
      'bindEvent',
      'bindHtml',
      'bindList',
      'bindRef',
      'bindRender',
      'bindText',
    ]),
    rule: 'legacy-binding',
    message: 'BindingDescriptor/activation symbol is present in a v0.44 artifact',
  },
  {
    names: new Set([
      'HydrationScope',
      'collectEventBindings',
      'collectHydrationBindings',
      'hydrateEventMarkers',
      'hydrateOpenElement',
      'disposeOpenElement',
    ]),
    rule: 'legacy-hydration',
    message: 'generic hydration symbol is present in a v0.44 artifact',
  },
  {
    names: new Set([
      'activationRegistry',
      'registerOpenElementScope',
      'registerSignal',
      'signalRegistry',
    ]),
    rule: 'legacy-activation',
    message: 'runtime activation registry symbol is present in a v0.44 artifact',
  },
  {
    names: new Set(['defineElement', 'defineCustomElement']),
    rule: 'legacy-registration',
    message: 'legacy registration helper is present in a v0.44 artifact',
  },
];

const PRIVATE_RUNTIME_IMPORT =
  /(?:^|\/)internal\/(?:claim|compiled|core|protocol|server|signal)(?:\/|$)/u;
const LEGACY_MODULE_RULES: Array<{ pattern: RegExp; rule: string; message: string }> = [
  {
    pattern: /(?:^|\/)(?:vnode|jsx-render-dom)(?:\.[a-z]+)?$/u,
    rule: 'legacy-vnode',
    message: 'legacy VNode module is present in a v0.44 artifact',
  },
  {
    pattern: /(?:^|\/)(?:binding-(?:activation|collections|descriptor|runtime))(?:\.[a-z]+)?$/u,
    rule: 'legacy-binding',
    message: 'legacy binding module is present in a v0.44 artifact',
  },
  {
    pattern:
      /(?:^|\/)(?:event-hydration|event-marker|hydration-bindings|hydration-scope)(?:\.[a-z]+)?$/u,
    rule: 'legacy-hydration',
    message: 'legacy generic-hydration module is present in a v0.44 artifact',
  },
  {
    pattern: /(?:^|\/)render-ir(?:-[a-z-]+)?(?:\.[a-z]+)?$/u,
    rule: 'legacy-vnode',
    message: 'legacy VNode render-IR module is present in a v0.44 artifact',
  },
];

const LEGACY_DEPENDENCY =
  /(?:^|[\/@._-])(?:binding-runtime|generic-hydration|legacy-renderer|legacy-runtime|vnode-renderer)(?:$|[\/@._-])/iu;
const LEGACY_DEPENDENCY_MESSAGE = 'legacy renderer dependency is present in a v0.44 artifact';

const LEGACY_MARKER = /^(?:data-(?:eid|signal)(?:-|$)|oe-(?:branch|for-item):)/u;
const LEGACY_METADATA =
  /\b(?:VNode|isVNode|renderToDom|renderDsdTree|BindingDescriptor|applyBindingDescriptor|commitBindings|bind(?:Attr|Class|Conditional|Event|Html|List|Ref|Render|Text)|HydrationScope|collect(?:Event|Hydration)Bindings|hydrate(?:EventMarkers|OpenElement)|disposeOpenElement|activationRegistry|register(?:OpenElementScope|Signal)|signalRegistry|define(?:Element|CustomElement))\b/u;

function extension(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot).toLowerCase();
}

function lineAt(text: string, position: number): number {
  let line = 1;
  for (let index = 0; index < position; index++) {
    if (text[index] === '\n') line++;
  }
  return line;
}

function addViolation(
  violations: LegacyAbsenceViolation[],
  file: ArtifactSource,
  position: number,
  rule: string,
  message: string,
): void {
  violations.push({ path: file.path, line: lineAt(file.text, position), rule, message });
}

function parsedSource(file: ArtifactSource): ts.SourceFile {
  const kind = file.path.endsWith('.tsx') || file.path.endsWith('.jsx')
    ? ts.ScriptKind.TSX
    : file.path.endsWith('.js') || file.path.endsWith('.mjs') || file.path.endsWith('.cjs')
    ? ts.ScriptKind.JS
    : ts.ScriptKind.TS;
  return ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true, kind);
}

function moduleSpecifier(node: ts.Node): ts.StringLiteralLike | undefined {
  if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
    const specifier = node.moduleSpecifier;
    return specifier && ts.isStringLiteralLike(specifier) ? specifier : undefined;
  }
  if (
    ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments.length > 0 && ts.isStringLiteralLike(node.arguments[0])
  ) {
    return node.arguments[0];
  }
  return undefined;
}

function scanModuleSpecifier(
  file: ArtifactSource,
  source: ts.SourceFile,
  node: ts.StringLiteralLike,
  violations: LegacyAbsenceViolation[],
): void {
  const value = node.text.replaceAll('\\', '/');
  if (PRIVATE_RUNTIME_IMPORT.test(value)) {
    addViolation(
      violations,
      file,
      node.getStart(source),
      'private-runtime-import',
      'app/island artifact imports a private Part/Region/Signal/claim runtime path',
    );
  }
  if (LEGACY_DEPENDENCY.test(value)) {
    addViolation(
      violations,
      file,
      node.getStart(source),
      'legacy-dependency',
      LEGACY_DEPENDENCY_MESSAGE,
    );
  }
  for (const rule of LEGACY_MODULE_RULES) {
    if (rule.pattern.test(value)) {
      addViolation(violations, file, node.getStart(source), rule.rule, rule.message);
    }
  }
}

function scanCode(file: ArtifactSource, violations: LegacyAbsenceViolation[]): void {
  const source = parsedSource(file);
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      for (const rule of IDENTIFIER_RULES) {
        if (rule.names.has(node.text)) {
          addViolation(violations, file, node.getStart(source), rule.rule, rule.message);
        }
      }
    }
    const module = moduleSpecifier(node);
    if (module) scanModuleSpecifier(file, source, module, violations);
    if (ts.isStringLiteralLike(node) && LEGACY_MARKER.test(node.text)) {
      addViolation(
        violations,
        file,
        node.getStart(source),
        'legacy-hydration',
        'legacy marker-based generic hydration data is present in a v0.44 artifact',
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

function scanJson(file: ArtifactSource, violations: LegacyAbsenceViolation[]): void {
  let value: unknown;
  try {
    value = JSON.parse(file.text);
  } catch {
    return;
  }
  const visit = (current: unknown, path: string): void => {
    if (typeof current === 'string') {
      const normalized = current.replaceAll('\\', '/');
      if (PRIVATE_RUNTIME_IMPORT.test(normalized)) {
        addViolation(
          violations,
          file,
          0,
          'private-runtime-import',
          `private runtime path appears in artifact metadata at ${path}`,
        );
      }
      if (LEGACY_DEPENDENCY.test(normalized)) {
        addViolation(
          violations,
          file,
          0,
          'legacy-dependency',
          `legacy renderer dependency metadata appears at ${path}`,
        );
      }
      if (LEGACY_MODULE_RULES.some((rule) => rule.pattern.test(normalized))) {
        addViolation(
          violations,
          file,
          0,
          'legacy-dependency',
          `legacy renderer module metadata appears at ${path}`,
        );
      }
      if (LEGACY_METADATA.test(current) || LEGACY_MARKER.test(current)) {
        addViolation(
          violations,
          file,
          0,
          'legacy-metadata',
          `legacy renderer metadata appears at ${path}`,
        );
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (current && typeof current === 'object') {
      for (const [key, item] of Object.entries(current)) {
        if (LEGACY_DEPENDENCY.test(key.replaceAll('\\', '/'))) {
          addViolation(
            violations,
            file,
            0,
            'legacy-dependency',
            `legacy renderer dependency metadata appears at ${path}.${key}`,
          );
        }
        visit(item, `${path}.${key}`);
      }
    }
  };
  visit(value, '$');
}

function scanFileName(file: ArtifactSource, violations: LegacyAbsenceViolation[]): void {
  const path = file.path.replaceAll('\\', '/');
  if (LEGACY_DEPENDENCY.test(path)) {
    addViolation(violations, file, 0, 'legacy-dependency', LEGACY_DEPENDENCY_MESSAGE);
  }
  for (const rule of LEGACY_MODULE_RULES) {
    if (rule.pattern.test(path)) {
      addViolation(violations, file, 0, rule.rule, rule.message);
    }
  }
}

/** Scan already-loaded artifacts. This pure entry point is used by fixtures. */
export function scanLegacyAbsence(files: ArtifactSource[]): LegacyAbsenceViolation[] {
  const violations: LegacyAbsenceViolation[] = [];
  for (const file of files) {
    scanFileName(file, violations);
    const suffix = extension(file.path);
    if (CODE_EXTENSIONS.has(suffix)) scanCode(file, violations);
    else if (JSON_EXTENSIONS.has(suffix)) scanJson(file, violations);
  }
  const unique = new Map<string, LegacyAbsenceViolation>();
  for (const violation of violations) {
    const key = `${violation.path}:${violation.line}:${violation.rule}:${violation.message}`;
    unique.set(key, violation);
  }
  return [...unique.values()].sort((left, right) =>
    left.path.localeCompare(right.path) || left.line - right.line ||
    left.rule.localeCompare(right.rule)
  );
}

async function readRoot(root: string): Promise<ArtifactSource[]> {
  const normalizedRoot = root.replaceAll('\\', '/');
  const info = await Deno.stat(normalizedRoot);
  if (info.isFile) {
    return [{ path: normalizedRoot, text: await Deno.readTextFile(normalizedRoot) }];
  }
  const files: ArtifactSource[] = [];
  for await (
    const entry of walk(normalizedRoot, {
      includeDirs: false,
      skip: [/(^|\/)node_modules(\/|$)/u],
    })
  ) {
    const suffix = extension(entry.path);
    if (!CODE_EXTENSIONS.has(suffix) && !JSON_EXTENSIONS.has(suffix)) continue;
    files.push({
      path: entry.path.replaceAll('\\', '/'),
      text: await Deno.readTextFile(entry.path),
    });
  }
  return files;
}

export async function collectArtifactSources(
  roots: readonly string[] = DEFAULT_ARTIFACT_ROOTS,
): Promise<{ files: ArtifactSource[]; missingRoots: string[] }> {
  const files: ArtifactSource[] = [];
  const missingRoots: string[] = [];
  for (const root of roots) {
    try {
      files.push(...await readRoot(root));
    } catch {
      missingRoots.push(root);
    }
  }
  files.sort((left, right) => left.path.localeCompare(right.path));
  return { files, missingRoots };
}

function usage(): void {
  console.log(
    'Usage: deno run --allow-read tools/check-v044-legacy-absence.ts [artifact-dir|artifact-file ...]',
  );
}

async function main(): Promise<void> {
  if (Deno.args.includes('--help')) {
    usage();
    return;
  }
  const roots = Deno.args.filter((arg) => !arg.startsWith('--'));
  const selectedRoots = roots.length > 0 ? roots : DEFAULT_ARTIFACT_ROOTS;
  const { files, missingRoots } = await collectArtifactSources(selectedRoots);
  if (files.length === 0) {
    console.error(
      `v0.44 legacy absence check failed: no artifact files found under ${
        selectedRoots.join(', ')
      }`,
    );
    if (missingRoots.length > 0) console.error(`missing roots: ${missingRoots.join(', ')}`);
    Deno.exit(1);
  }
  const violations = scanLegacyAbsence(files);
  if (violations.length > 0) {
    console.error(`v0.44 legacy absence check failed: ${violations.length} violation(s)`);
    for (const violation of violations) {
      console.error(
        `  ${violation.path}:${violation.line} [${violation.rule}] ${violation.message}`,
      );
    }
    Deno.exit(1);
  }
  console.log(`v0.44 legacy absence check passed (${files.length} artifact files).`);
}

if (import.meta.main) await main();
