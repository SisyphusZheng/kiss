/**
 * entry-generators.ts - Entry Generators
 *
 * v0.21.0: manifest-driven hydration strategies.
 * Zero DOM interaction - cannot interfere with DSD rendering.
 */

import type { HydrationStrategy } from '../protocol/framework.ts';
import type { ClientIslandEntry } from '../protocol/ssg.ts';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';
import { ACTION_FETCH_HEADER, HYDRATION_STRATEGIES, isValidTagName } from '@openelement/element';

// #868: the browser runtimes are real modules (island-scheduler.ts,
// enhance-client.ts) bundled via the virtual:open-client-runtime specifiers
// resolved by build-client.ts. The generated entry only wires them; no
// toString() serialization, no import-free constraint, no string copy.
export const VIRTUAL_RUNTIME_SPECIFIERS = {
  scheduler: 'virtual:open-client-runtime/scheduler',
  enhance: 'virtual:open-client-runtime/enhance',
} as const;

const URL_OR_SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const SAFE_RELATIVE_SPECIFIER_RE = /^\.{1,2}\/[A-Za-z0-9_./@-]+$/;
const SAFE_ROOT_SPECIFIER_RE = /^\/[A-Za-z0-9_./@-]+$/;
// Vite `/@fs/` absolute-path convention; the optional drive-letter segment
// (`C:/`) is how Windows absolute paths become valid specifiers (#460).
const SAFE_FS_SPECIFIER_RE = /^\/@fs\/(?:[A-Za-z]:\/)?[A-Za-z0-9_./@-]+$/;
const SAFE_BARE_SPECIFIER_RE =
  /^(?:@[a-z0-9_.-]+\/[a-z0-9_.-]+|[a-z0-9_.-]+)(?:\/[A-Za-z0-9_./@-]+)?$/;
const VALID_STRATEGIES = new Set<HydrationStrategy>(HYDRATION_STRATEGIES);

declare const admittedIslandModuleSpecifier: unique symbol;
type AdmittedIslandModuleSpecifier = string & {
  readonly [admittedIslandModuleSpecifier]: true;
};

interface AdmittedClientIslandEntry extends Omit<ClientIslandEntry, 'modulePath'> {
  modulePath: AdmittedIslandModuleSpecifier;
}

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function hasTraversalSegment(value: string): boolean {
  return value.split('/').includes('..');
}

export function validateIslandModuleSpecifier(modulePath: string): void {
  if (
    !modulePath ||
    hasControlCharacter(modulePath) ||
    URL_OR_SCHEME_RE.test(modulePath) ||
    modulePath.startsWith('//') ||
    hasTraversalSegment(modulePath)
  ) {
    throw new Error(`Invalid island modulePath: ${modulePath}`);
  }
  if (
    !SAFE_RELATIVE_SPECIFIER_RE.test(modulePath) &&
    !SAFE_ROOT_SPECIFIER_RE.test(modulePath) &&
    !SAFE_FS_SPECIFIER_RE.test(modulePath) &&
    !SAFE_BARE_SPECIFIER_RE.test(modulePath)
  ) {
    throw new Error(`Invalid island modulePath: ${modulePath}`);
  }
}

function admitIslandModuleSpecifier(modulePath: string): AdmittedIslandModuleSpecifier {
  validateIslandModuleSpecifier(modulePath);
  return modulePath as AdmittedIslandModuleSpecifier;
}

function islandImportFactory(
  modulePath: AdmittedIslandModuleSpecifier,
  tagName: string,
  exportName?: string,
): string {
  const nameLiteral = exportName ? quoteGeneratedJavaScriptValue(exportName) : 'undefined';
  return `() => import(${
    quoteGeneratedJavaScriptValue(modulePath)
  }).then(function(mod) { var _name = ${nameLiteral}; var Ctor = _name ? mod[_name] : mod.default; if (Ctor && !customElements.get(${
    quoteGeneratedJavaScriptValue(tagName)
  })) customElements.define(${quoteGeneratedJavaScriptValue(tagName)}, Ctor); return mod; })`;
}

export function validateClientIslandEntry(entry: ClientIslandEntry): AdmittedClientIslandEntry {
  if (!isValidTagName(entry.tagName)) {
    throw new Error(`Invalid island tagName: ${entry.tagName}`);
  }
  let modulePath: AdmittedIslandModuleSpecifier;
  try {
    modulePath = admitIslandModuleSpecifier(entry.modulePath);
  } catch (e) {
    throw new Error(`Invalid island modulePath for ${entry.tagName}: ${entry.modulePath}`, {
      cause: e,
    });
  }
  if (!VALID_STRATEGIES.has(entry.strategy)) {
    throw new Error(
      `Invalid island strategy for ${entry.tagName}: ${String(entry.strategy)}. ` +
        'Use one of: load, idle, visible, only.',
    );
  }
  return { ...entry, modulePath };
}

export interface GenerateClientEntryOptions {
  /**
   * True when any page route carries data-open-enhance (#569): emit the form
   * enhancement layer even with zero islands, so enhanced forms are not
   * silently left as plain no-JS posts.
   */
  enhancedForms?: boolean;
}

export function generateClientEntry(
  islands: ClientIslandEntry[],
  options: GenerateClientEntryOptions = {},
): string {
  const admittedIslands = islands.map(validateClientIslandEntry);

  if (admittedIslands.length === 0 && options.enhancedForms !== true) {
    return '// openElement Client Entry - No islands detected, zero client JS needed\n';
  }

  const islandMap = admittedIslands
    .map((i) =>
      `  ${quoteGeneratedJavaScriptValue(i.tagName)}: ${
        islandImportFactory(i.modulePath, i.tagName, i.exportName)
      }`
    )
    .join(',\n');

  const tags = admittedIslands.map((i) => quoteGeneratedJavaScriptValue(i.tagName)).join(
    ', ',
  );
  const loadTags = admittedIslands
    .filter((i) => i.strategy === 'load')
    .map((i) => quoteGeneratedJavaScriptValue(i.tagName))
    .join(', ');
  const visibleTags = admittedIslands
    .filter((i) => i.strategy === 'visible')
    .map((i) => quoteGeneratedJavaScriptValue(i.tagName))
    .join(', ');
  const idleTags = admittedIslands
    .filter((i) => i.strategy === 'idle')
    .map((i) => quoteGeneratedJavaScriptValue(i.tagName))
    .join(', ');
  const onlyTags = admittedIslands
    .filter((i) => i.strategy === 'only')
    .map((i) => quoteGeneratedJavaScriptValue(i.tagName))
    .join(', ');

  return `// openElement Client Entry (v0.21 - load/idle/visible/only)
// load islands import immediately.
// idle islands import during browser idle time.
// visible islands import when their host enters the viewport.
// only islands are client-only and import immediately (no DSD/SSR).
// Zero DOM interaction - safe with DSD rendering.
//
// #606: island-scheduler.ts is the single owner of strategy scheduling
// (defineIsland() registers on module evaluation). #868: both runtimes are
// real modules bundled via the virtual:open-client-runtime specifiers — the
// entry only wires them, there is no inline string copy.

import { createLogger } from '@openelement/element';
import { createIslandScheduler } from '${VIRTUAL_RUNTIME_SPECIFIERS.scheduler}';
${
    options.enhancedForms === true
      ? `import { createEnhanceClient } from '${VIRTUAL_RUNTIME_SPECIFIERS.enhance}';
`
      : ''
  }
var log = createLogger('openElement');

var __map = {
${islandMap}
};
var __tags = [${tags}];

var __scheduler = createIslandScheduler({
  log: log,
  win: window,
  doc: document,
  map: __map,
  strategies: {
    load: [${loadTags}],
    idle: [${idleTags}],
    visible: [${visibleTags}],
    only: [${onlyTags}],
  },
${
    options.enhancedForms === true
      ? `  // #584: late-hydrating islands create their shadow roots after the
  // ready-time scan; rescan so enhanced forms inside them are heard.
  onIslandLoaded: function () { __enhance.scanSubmitRoots(document); },`
      : '  // #597: no enhance layer — no submit-root rescan after island loads.\n  onIslandLoaded: null,'
  }
});

${
    options.enhancedForms === true
      ? `// Form enhancement (ADR-0120, hardened by ADR-0121 in 0.42.0-alpha.5):
// forms marked data-open-enhance submit via fetch and the returned document
// is morphed into the live tree — INSIDE the page element's shadow root,
// which is where page content lives under DSD. Without JavaScript the same
// form is a native POST (303/422 HTML), so behavior degrades to the browser
// by construction. Runtime: enhance-client.ts (bundled via #868).
var __enhance = createEnhanceClient({
  log: log,
  tags: __tags,
  actionHeader: ${quoteGeneratedJavaScriptValue(ACTION_FETCH_HEADER)},
  win: window,
  doc: document,
  observeVisible: __scheduler.observeVisible,
});
`
      : '// No data-open-enhance forms: the form enhancement layer is omitted (#569 complement),\n// keeping the client bundle free of morph and popstate code.'
  }
`;
}
