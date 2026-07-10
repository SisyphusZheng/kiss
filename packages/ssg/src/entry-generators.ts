/**
 * @openelement/ssg - Entry Generators
 *
 * v0.21.0: manifest-driven hydration strategies.
 * Zero DOM interaction - cannot interfere with DSD rendering.
 */

import type { HydrationStrategy } from '@openelement/protocol/framework';
import type { ClientIslandEntry } from '@openelement/protocol/ssg';
import { quoteGeneratedJavaScriptStringLiteral } from './codegen-literals.ts';
import { isValidTagName } from '@openelement/core';

const URL_OR_SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]*:/;
const SAFE_RELATIVE_SPECIFIER_RE = /^\.{1,2}\/[A-Za-z0-9_./@-]+$/;
const SAFE_ROOT_SPECIFIER_RE = /^\/[A-Za-z0-9_./@-]+$/;
const SAFE_BARE_SPECIFIER_RE =
  /^(?:@[a-z0-9_.-]+\/[a-z0-9_.-]+|[a-z0-9_.-]+)(?:\/[A-Za-z0-9_./@-]+)?$/;
const VALID_STRATEGIES = new Set<HydrationStrategy>(['load', 'idle', 'visible', 'only']);

declare const admittedIslandModuleSpecifier: unique symbol;
export type AdmittedIslandModuleSpecifier = string & {
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

/**
 * Zero-dependency shared logger micro-implementation for the generated
 * client entry. Keeps the browser bundle free of external logger imports
 * while still prefixing messages with `[openElement]`.
 */
function renderClientLogger(tag = 'openElement'): string {
  const prefix = quoteGeneratedJavaScriptStringLiteral(`[${tag}]`);
  return `var log = {
  warn: function() { var a = [${prefix}]; a.push.apply(a, arguments); console.warn.apply(console, a); },
  error: function() { var a = [${prefix}]; a.push.apply(a, arguments); console.error.apply(console, a); },
};`;
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
    !SAFE_BARE_SPECIFIER_RE.test(modulePath)
  ) {
    throw new Error(`Invalid island modulePath: ${modulePath}`);
  }
}

export function admitIslandModuleSpecifier(modulePath: string): AdmittedIslandModuleSpecifier {
  validateIslandModuleSpecifier(modulePath);
  return modulePath as AdmittedIslandModuleSpecifier;
}

function islandImportFactory(
  modulePath: AdmittedIslandModuleSpecifier,
  tagName: string,
): string {
  return `() => import(${
    quoteGeneratedJavaScriptStringLiteral(modulePath)
  }).then(function(mod) { if (mod.default && !customElements.get(${
    quoteGeneratedJavaScriptStringLiteral(tagName)
  })) customElements.define(${
    quoteGeneratedJavaScriptStringLiteral(tagName)
  }, mod.default); return mod; })`;
}

export function validateClientIslandEntry(entry: ClientIslandEntry): AdmittedClientIslandEntry {
  if (!isValidTagName(entry.tagName)) {
    throw new Error(`Invalid island tagName: ${entry.tagName}`);
  }
  let modulePath: AdmittedIslandModuleSpecifier;
  try {
    modulePath = admitIslandModuleSpecifier(entry.modulePath);
  } catch {
    throw new Error(`Invalid island modulePath for ${entry.tagName}: ${entry.modulePath}`);
  }
  if (!VALID_STRATEGIES.has(entry.strategy)) {
    throw new Error(
      `Invalid island strategy for ${entry.tagName}: ${String(entry.strategy)}. ` +
        'Use one of: load, idle, visible, only.',
    );
  }
  return { ...entry, modulePath };
}

export function generateClientEntry(
  islands: ClientIslandEntry[],
): string {
  const admittedIslands = islands.map(validateClientIslandEntry);

  if (admittedIslands.length === 0) {
    return '// openElement Client Entry - No islands detected, zero client JS needed\n';
  }

  const islandMap = admittedIslands
    .map((i) =>
      `  ${quoteGeneratedJavaScriptStringLiteral(i.tagName)}: ${
        islandImportFactory(i.modulePath, i.tagName)
      }`
    )
    .join(',\n');

  const tags = admittedIslands.map((i) => quoteGeneratedJavaScriptStringLiteral(i.tagName)).join(
    ', ',
  );
  const loadTags = admittedIslands
    .filter((i) => i.strategy === 'load')
    .map((i) => quoteGeneratedJavaScriptStringLiteral(i.tagName))
    .join(', ');
  const visibleTags = admittedIslands
    .filter((i) => i.strategy === 'visible')
    .map((i) => quoteGeneratedJavaScriptStringLiteral(i.tagName))
    .join(', ');
  const idleTags = admittedIslands
    .filter((i) => i.strategy === 'idle')
    .map((i) => quoteGeneratedJavaScriptStringLiteral(i.tagName))
    .join(', ');
  const onlyTags = admittedIslands
    .filter((i) => i.strategy === 'only')
    .map((i) => quoteGeneratedJavaScriptStringLiteral(i.tagName))
    .join(', ');

  return `// openElement Client Entry (v0.21 - load/idle/visible/only)
// load islands import immediately.
// idle islands import during browser idle time.
// visible islands import when their host enters the viewport.
// only islands are client-only and import immediately (no DSD/SSR).
// Zero DOM interaction - safe with DSD rendering.

${renderClientLogger()}

var __map = {
${islandMap}
};
var __tags = [${tags}];

function __load(tag) {
  if (__map[tag]) {
    __map[tag]().catch(function(e) { log.warn(tag, e); });
    __map[tag] = null;
  }
}

function __onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

function __dispatchReady(strategy, tags) {
  document.dispatchEvent(new CustomEvent('open:ready', {
    detail: { strategy: strategy, islands: tags }
  }));
}

// client:load islands - import immediately
[${loadTags || ''}].filter(Boolean).forEach(__load);

// client:only islands - import immediately, no DSD/SSR expected
${
    onlyTags
      ? `var __onlyTags = [${onlyTags || ''}];\n__onlyTags.forEach(__load);\n`
      : '// No client:only islands\n'
  }
// client:visible islands - load when their element enters viewport
${
    visibleTags
      ? `var __visibleTags = [${visibleTags || ''}];
var __observedTags = [];
function __observeVisible() {
  if (!('IntersectionObserver' in window)) {
    __visibleTags.forEach(__load);
    __dispatchReady('visible', __visibleTags);
    return;
  }
  __visibleTags.forEach(function(tag) {
    var els = document.querySelectorAll(tag);
    if (els.length > 0 && __observedTags.indexOf(tag) === -1) {
      __observedTags.push(tag);
      els.forEach(function(el) {
        var obs = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              __load(tag);
              __dispatchReady('visible', [tag]);
              obs.disconnect();
            }
          });
        }, { rootMargin: '200px' });
        obs.observe(el);
      });
    }
  });
}
__onReady(__observeVisible);`
      : '// No client:visible islands'
  }

// client:idle islands - defer to browser idle
${
    idleTags
      ? `var __idleTags = [${idleTags || ''}];
var __deferred = function() {
  __idleTags.forEach(__load);
  __dispatchReady('idle', __idleTags);
};
var __schedule = window.requestIdleCallback || window.requestAnimationFrame || function(fn) { setTimeout(fn, 50); };
__schedule(__deferred);`
      : '// No client:idle islands'
  }
`;
}
