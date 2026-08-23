/** Client island entry emission; browser runtime wiring only. */
import type { ClientIslandEntry } from '../protocol/ssg.ts';
import { ACTION_FETCH_HEADER } from '@openelement/element';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';
import { validateClientIslandEntry, VIRTUAL_RUNTIME_SPECIFIERS } from './entry-generators.ts';
import type { AdmittedIslandModuleSpecifier } from './entry-generators.ts';

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

interface GenerateClientEntryOptions {
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

import { createLogger, ensureDeepFragmentNavigation, ensurePreHydrationClickCapture } from '@openelement/element';
import { createIslandScheduler } from '${VIRTUAL_RUNTIME_SPECIFIERS.scheduler}';
${
    options.enhancedForms === true
      ? `import { createEnhanceClient } from '${VIRTUAL_RUNTIME_SPECIFIERS.enhance}';
`
      : ''
  }
var log = createLogger('openElement');

// #942: install the pre-hydration click capture before any island module
// loads — clicks landing in the hydration window are replayed after hydration.
ensurePreHydrationClickCapture();
ensureDeepFragmentNavigation();

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
