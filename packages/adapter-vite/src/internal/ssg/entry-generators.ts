/**
 * ./index.ts - Entry Generators
 *
 * v0.21.0: manifest-driven hydration strategies.
 * Zero DOM interaction - cannot interfere with DSD rendering.
 */

import type { HydrationStrategy } from '../protocol/framework.ts';
import type { ClientIslandEntry } from '../protocol/ssg.ts';
import { quoteGeneratedJavaScriptStringLiteral } from './codegen-literals.ts';
import { HYDRATION_STRATEGIES, isValidTagName } from '@openelement/element';

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
    !SAFE_FS_SPECIFIER_RE.test(modulePath) &&
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

// Form enhancement (ADR-0120, 0.42.0-alpha.2/alpha.3): forms marked
// data-open-enhance submit via fetch and the returned document is morphed
// into place — no full reload, and untouched subtrees (including hydrated
// islands whose light DOM did not change) keep their state. Without
// JavaScript the same form is a native POST (303/422 HTML), so behavior
// degrades to the browser by construction.
function __syncAttrs(oldEl, newEl) {
  for (var i = oldEl.attributes.length - 1; i >= 0; i--) {
    var name = oldEl.attributes[i].name;
    if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
  }
  for (var j = 0; j < newEl.attributes.length; j++) {
    var attr = newEl.attributes[j];
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  }
}

function __islandIntact(oldEl, newEl) {
  // A hydrated island (live shadow root) survives when its light-DOM
  // surface serializes identically in the incoming document. The incoming
  // <template shadowrootmode> child is skipped in the comparison: the
  // browser already consumed it into the live shadow root. Replacing an
  // intact island would reset its state.
  if (!oldEl.shadowRoot) return false;
  if (oldEl.attributes.length !== newEl.attributes.length) return false;
  for (var i = 0; i < newEl.attributes.length; i++) {
    var attr = newEl.attributes[i];
    if (oldEl.getAttribute(attr.name) !== attr.value) return false;
  }
  var newKids = [];
  for (var k = 0; k < newEl.childNodes.length; k++) {
    var n = newEl.childNodes[k];
    if (n.nodeType === 1 && n.tagName === 'TEMPLATE' && n.hasAttribute('shadowrootmode')) continue;
    // Whitespace-only text nodes carry no meaning: hydration normalizes the
    // live tree (merged text), the fresh parse keeps them split.
    if (n.nodeType === 3 && n.data.trim() === '') continue;
    newKids.push(n);
  }
  var oldKids = [];
  for (var k0 = 0; k0 < oldEl.childNodes.length; k0++) {
    var o0 = oldEl.childNodes[k0];
    if (o0.nodeType === 3 && o0.data.trim() === '') continue;
    oldKids.push(o0);
  }
  if (oldKids.length !== newKids.length) return false;
  for (var m = 0; m < newKids.length; m++) {
    var o = oldKids[m];
    var nn = newKids[m];
    if (o.nodeType !== nn.nodeType) return false;
    if (o.nodeType === 3 && o.data !== nn.data) return false;
    if (o.nodeType === 1 && o.outerHTML !== nn.outerHTML) return false;
  }
  return true;
}

function __morphNode(oldEl, newEl) {
  if (oldEl.nodeType !== newEl.nodeType || oldEl.tagName !== newEl.tagName) {
    oldEl.replaceWith(newEl);
    return;
  }
  if (oldEl.nodeType === 3) {
    if (oldEl.data !== newEl.data) oldEl.data = newEl.data;
    return;
  }
  if (oldEl.nodeType !== 1) return;
  if (oldEl.tagName === 'SCRIPT') {
    // Keep the live script node: replacing it would re-execute the island
    // client entry and double every listener.
    return;
  }
  if (oldEl.hasAttribute('data-open-preserve')) return;
  if (__islandIntact(oldEl, newEl)) return;
  if (oldEl.shadowRoot) {
    // Hydrated island whose surface changed: replace (state resets by design).
    oldEl.replaceWith(newEl);
    return;
  }
  __syncAttrs(oldEl, newEl);
  var oldChildren = Array.from(oldEl.childNodes);
  var newChildren = Array.from(newEl.childNodes);
  var shared = Math.max(oldChildren.length, newChildren.length);
  for (var i = 0; i < shared; i++) {
    var o = oldChildren[i];
    var n = newChildren[i];
    if (o && n) __morphNode(o, n);
    else if (n) oldEl.appendChild(n);
    else if (o) o.remove();
  }
}

function __morphDocument(html) {
  var doc = new DOMParser().parseFromString(html, 'text/html');
  document.title = doc.title;
  var region = document.querySelector('[data-open-region]');
  if (region) {
    var next = doc.querySelector('[data-open-region="' + region.getAttribute('data-open-region') + '"]');
    if (next) {
      __morphNode(region, next);
      return;
    }
  }
  __morphNode(document.body, doc.body);
}

document.addEventListener('submit', function (event) {
  var form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.hasAttribute('data-open-enhance')) return;
  var method = (form.getAttribute('method') || 'get').toUpperCase();
  if (method === 'GET') return;
  event.preventDefault();
  var submitter = event.submitter;
  var actionUrl = (submitter && submitter.formAction) || form.action || window.location.href;
  fetch(actionUrl, {
    method: method,
    body: new FormData(form),
    headers: { 'x-openelement-enhance': 'true' },
  }).then(function (response) {
    return response.text().then(function (html) {
      return { html: html, url: response.url };
    });
  }).then(function (result) {
    __morphDocument(result.html);
    if (result.url && result.url !== window.location.href) {
      history.pushState({}, '', result.url);
    }
  }).catch(function () {
    window.location.reload();
  });
});
`;
}
