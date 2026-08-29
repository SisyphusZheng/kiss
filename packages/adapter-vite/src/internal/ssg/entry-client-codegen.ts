/** Client island entry emission; browser runtime wiring only. */
import { ACTION_FETCH_HEADER } from '@openelement/element';
import { quoteGeneratedJavaScriptValue } from './codegen-literals.ts';
import {
  type AdmittedClientIslandEntry,
  type AdmittedIslandModuleSpecifier,
  validateClientIslandEntry,
  VIRTUAL_RUNTIME_SPECIFIERS,
} from './entry-generators.ts';
import type { ClientIslandDeliveryEntry, ClientIslandDeliveryInput } from './delivery.ts';

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

interface NormalizedClientIsland extends AdmittedClientIslandEntry {
  tagName: string;
}

/** JavaScript single-quoted literal used in the media-query evidence. */
function quoteSingle(value: string): string {
  return `'${
    value
      .replaceAll('\\', '\\\\')
      .replaceAll("'", "\\'")
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r')
      .replaceAll('\u2028', '\\u2028')
      .replaceAll('\u2029', '\\u2029')
  }'`;
}

/** Expand one capability declaration into its one-to-many element names. */
function expandClientIslandEntries(
  entries: readonly ClientIslandDeliveryInput[],
): NormalizedClientIsland[] {
  const expanded: NormalizedClientIsland[] = [];
  const seen = new Map<string, NormalizedClientIsland>();

  for (const input of entries) {
    const admitted = validateClientIslandEntry(input);
    const delivery = admitted as AdmittedClientIslandEntry & ClientIslandDeliveryEntry;
    const tags = delivery.tags && delivery.tags.length > 0
      ? delivery.tags
      : delivery.tagNames && delivery.tagNames.length > 0
      ? delivery.tagNames
      : [admitted.tagName];

    for (const tagName of tags) {
      const item: NormalizedClientIsland = {
        ...admitted,
        tagName,
        ...(delivery.exportNames?.[tagName] ? { exportName: delivery.exportNames[tagName] } : {}),
      };
      const prior = seen.get(tagName);
      if (prior) {
        if (
          prior.modulePath !== item.modulePath || prior.strategy !== item.strategy ||
          prior.media !== item.media || prior.exportName !== item.exportName
        ) {
          throw new Error(`Conflicting island capability declarations for ${tagName}`);
        }
        continue;
      }
      seen.set(tagName, item);
      expanded.push(item);
    }
  }
  return expanded;
}

interface ActivationGroup {
  entries: NormalizedClientIsland[];
  modulePath: AdmittedIslandModuleSpecifier;
}

function activationGroupKey(entry: NormalizedClientIsland): string {
  return `${entry.modulePath}\u0000${entry.strategy}\u0000${entry.media ?? ''}`;
}

function sharedActivationFactory(group: ActivationGroup, index: number): string {
  const promise = `__activation${index}Promise`;
  const factory = `__activation${index}`;
  const lines = [
    `var ${promise};`,
    `var ${factory} = function() {`,
    `  if (!${promise}) ${promise} = import(${
      quoteGeneratedJavaScriptValue(group.modulePath)
    }).then(function(mod) {`,
  ];
  group.entries.forEach((entry, entryIndex) => {
    const ctor = `__Ctor${index}_${entryIndex}`;
    const value = entry.exportName
      ? `mod[${quoteGeneratedJavaScriptValue(entry.exportName)}]`
      : 'mod.default';
    lines.push(`    var ${ctor} = ${value};`);
    lines.push(
      `    if (typeof ${ctor} !== 'function') throw new Error('[openElement] Capability module ${group.modulePath} did not export a constructor for ${entry.tagName}');`,
    );
    lines.push(
      `    if (!customElements.get(${
        quoteGeneratedJavaScriptValue(entry.tagName)
      })) customElements.define(${quoteGeneratedJavaScriptValue(entry.tagName)}, ${ctor});`,
    );
  });
  lines.push('    return mod;');
  lines.push('  });');
  lines.push(`  return ${promise};`);
  lines.push('};');
  return lines.join('\n');
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
  islands: readonly ClientIslandDeliveryInput[],
  options: GenerateClientEntryOptions = {},
): string {
  const admittedIslands = expandClientIslandEntries(islands);

  if (admittedIslands.length === 0 && options.enhancedForms !== true) {
    return '// openElement Client Entry - No islands detected, zero client JS needed\n';
  }

  const groupsByKey = new Map<string, ActivationGroup>();
  for (const entry of admittedIslands) {
    const key = activationGroupKey(entry);
    const group = groupsByKey.get(key);
    if (group) group.entries.push(entry);
    else groupsByKey.set(key, { entries: [entry], modulePath: entry.modulePath });
  }
  const groups = [...groupsByKey.values()];
  const activationLines: string[] = [];
  const groupFactories = new Map<ActivationGroup, string>();
  groups.forEach((group, index) => {
    if (group.entries.length > 1) {
      activationLines.push(sharedActivationFactory(group, index));
      groupFactories.set(group, `__activation${index}`);
    }
  });
  const islandMap = admittedIslands.map((entry) => {
    const group = groups.find((candidate) => candidate.entries.includes(entry));
    const factory = group && groupFactories.get(group);
    return `  ${quoteGeneratedJavaScriptValue(entry.tagName)}: ${
      factory || islandImportFactory(entry.modulePath, entry.tagName, entry.exportName)
    }`;
  }).join(',\n');

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
  const mediaEntries = admittedIslands.filter((i) => i.strategy === 'media');
  const mediaTags = mediaEntries.map((i) => quoteSingle(i.tagName)).join(', ');
  const mediaQueries = mediaEntries.map((i) =>
    `    ${
      quoteGeneratedJavaScriptValue(i.tagName)
    }: typeof window.matchMedia === 'function' ? window.matchMedia(${quoteSingle(i.media!)}) : null`
  ).join(',\n');

  return `// openElement Client Entry (v0.44 - load/idle/visible/media/only)
// load islands import immediately.
// idle islands import during browser idle time.
// visible islands import when their host enters the viewport.
// media islands import when their declared media query matches.
// only islands are client-only and import immediately (no DSD/SSR).
// Zero DOM interaction - safe with DSD rendering.
//
// #606: island-scheduler.ts is the single owner of strategy scheduling
// (defineIsland() registers on module evaluation). #868: both runtimes are
// real modules bundled via the virtual:open-client-runtime specifiers — the
// entry only wires them, there is no inline string copy.

import { createLogger, ensureDeepFragmentNavigation, ensurePreHydrationClickCapture } from '@openelement/element';
import { createIslandScheduler as __schedule } from '${VIRTUAL_RUNTIME_SPECIFIERS.scheduler}';
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
${activationLines.length > 0 ? `\n${activationLines.join('\n\n')}\n` : ''}

var __scheduler = __schedule({
  log: log,
  win: window,
  doc: document,
  map: __map,
  strategies: {
    load: [${loadTags}],
    idle: [${idleTags}],
    visible: [${visibleTags}],
    media: [${mediaTags}],
    only: [${onlyTags}],
  },
${mediaEntries.length > 0 ? `  mediaQueries: {\n${mediaQueries}\n  },\n` : ''}
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
