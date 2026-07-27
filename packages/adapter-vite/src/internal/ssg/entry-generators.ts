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
var __observedEls = [];
function __queryAllDeep(root, tag, out) {
  // Islands live inside page-element shadow roots; a plain
  // document.querySelectorAll never sees them (#562).
  var found = root.querySelectorAll(tag);
  for (var i = 0; i < found.length; i++) out.push(found[i]);
  var all = root.querySelectorAll('*');
  for (var j = 0; j < all.length; j++) {
    if (all[j].shadowRoot) __queryAllDeep(all[j].shadowRoot, tag, out);
  }
}
function __observeVisible() {
  if (!('IntersectionObserver' in window)) {
    __visibleTags.forEach(__load);
    __dispatchReady('visible', __visibleTags);
    return;
  }
  __visibleTags.forEach(function(tag) {
    if (!__map[tag]) return;
    var els = [];
    __queryAllDeep(document, tag, els);
    els.forEach(function(el) {
      // Re-observable after a morph: a replaced island is a new element and
      // gets a fresh observer (#562).
      if (__observedEls.indexOf(el) !== -1) return;
      __observedEls.push(el);
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

${
    options.enhancedForms === true
      ? `// Form enhancement (ADR-0120, hardened by ADR-0121 in 0.42.0-alpha.5):
// forms marked data-open-enhance submit via fetch and the returned document
// is morphed into the live tree — INSIDE the page element's shadow root,
// which is where page content lives under DSD. Two structural facts drive
// this implementation:
//   1. The submit event is not composed in every engine, so a document-level
//      listener never sees forms inside page DSD — listeners attach to every
//      shadow root instead (a composed submit still reaches the root listener
//      first; the document listener only handles light-DOM forms).
//   2. The page's real content is the page host's shadow tree; the incoming
//      document carries it in the host's <template shadowrootmode> child, so
//      the morph descends into shadow roots and treats DSD templates as the
//      incoming shadow content.
// Without JavaScript the same form is a native POST (303/422 HTML), so
// behavior degrades to the browser by construction.
var __STATE_ATTRS = { DETAILS: { open: 1 }, VIDEO: { src: 1 }, AUDIO: { src: 1 } };

function __syncAttrs(oldEl, newEl) {
  // State-mirroring attributes (#567): user-toggled state (an open <details>,
  // a playing media element) wins over the incoming document.
  var skip = __STATE_ATTRS[oldEl.tagName];
  for (var i = oldEl.attributes.length - 1; i >= 0; i--) {
    var name = oldEl.attributes[i].name;
    if (skip && skip[name]) continue;
    if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
  }
  for (var j = 0; j < newEl.attributes.length; j++) {
    var attr = newEl.attributes[j];
    if (skip && skip[attr.name]) continue;
    if (oldEl.getAttribute(attr.name) !== attr.value) {
      oldEl.setAttribute(attr.name, attr.value);
    }
  }
}

function __shadowTemplate(el) {
  for (var i = 0; i < el.childNodes.length; i++) {
    var n = el.childNodes[i];
    if (n.nodeType === 1 && n.tagName === 'TEMPLATE' && n.hasAttribute('shadowrootmode')) return n;
  }
  return null;
}

function __islandIntact(oldEl, newEl) {
  // A hydrated island (live shadow root) survives when its light-DOM surface
  // serializes identically in the incoming document. The DSD template child
  // is skipped on both sides: the browser already consumed it into the live
  // shadow root, and DOMParser does not consume it here.
  if (!oldEl.shadowRoot) return false;
  if (oldEl.attributes.length !== newEl.attributes.length) return false;
  for (var i = 0; i < newEl.attributes.length; i++) {
    var attr = newEl.attributes[i];
    if (oldEl.getAttribute(attr.name) !== attr.value) return false;
  }
  function significantKids(el, skipTemplate) {
    var out = [];
    for (var k = 0; k < el.childNodes.length; k++) {
      var n = el.childNodes[k];
      if (skipTemplate && n.nodeType === 1 && n.tagName === 'TEMPLATE' && n.hasAttribute('shadowrootmode')) continue;
      // Whitespace-only text nodes carry no meaning: hydration normalizes the
      // live tree (merged text), the fresh parse keeps them split.
      if (n.nodeType === 3 && n.data.trim() === '') continue;
      out.push(n);
    }
    return out;
  }
  var newKids = significantKids(newEl, true);
  var oldKids = significantKids(oldEl, true);
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

function __compatible(a, b) {
  return a.nodeType === b.nodeType && (a.nodeType !== 1 || a.tagName === b.tagName);
}

function __morphChildren(oldParent, newParent) {
  // ADR-0121 §9 (#554): id-keyed matching first, then a structural walk with
  // bounded lookahead — insertions and removals between compatible anchors
  // are preserved instead of cascading into wholesale replacement.
  var oldKids = Array.prototype.slice.call(oldParent.childNodes);
  var newKids = Array.prototype.slice.call(newParent.childNodes);
  var byId = {};
  for (var j = 0; j < newKids.length; j++) {
    var cand = newKids[j];
    if (cand.nodeType === 1 && cand.id && !byId[cand.id]) byId[cand.id] = cand;
  }
  var usedNew = [];
  var pairs = [];
  for (var i = 0; i < oldKids.length; i++) {
    var o = oldKids[i];
    var match = null;
    if (o.nodeType === 1 && o.id && byId[o.id] && usedNew.indexOf(byId[o.id]) === -1 &&
        __compatible(o, byId[o.id])) {
      match = byId[o.id];
      usedNew.push(match);
    }
    pairs.push([o, match]);
  }
  var remainingNew = [];
  for (var r = 0; r < newKids.length; r++) {
    if (usedNew.indexOf(newKids[r]) === -1) remainingNew.push(newKids[r]);
  }
  var ni = 0;
  for (var p = 0; p < pairs.length; p++) {
    var oldEl = pairs[p][0];
    var paired = pairs[p][1];
    if (paired) {
      __morphNode(oldEl, paired);
      continue;
    }
    var found = -1;
    for (var w = ni; w < Math.min(ni + 4, remainingNew.length); w++) {
      if (__compatible(oldEl, remainingNew[w])) { found = w; break; }
    }
    if (found !== -1) {
      for (var ins = ni; ins < found; ins++) oldParent.insertBefore(remainingNew[ins], oldEl);
      __morphNode(oldEl, remainingNew[found]);
      ni = found + 1;
    } else {
      oldEl.remove();
    }
  }
  for (var tail = ni; tail < remainingNew.length; tail++) oldParent.appendChild(remainingNew[tail]);
}

function __morphNode(oldEl, newEl) {
  if (!__compatible(oldEl, newEl)) {
    oldEl.replaceWith(newEl);
    return;
  }
  if (oldEl.nodeType === 3) {
    if (oldEl.data !== newEl.data) oldEl.data = newEl.data;
    return;
  }
  if (oldEl.nodeType !== 1) return;
  if (oldEl.tagName === 'SCRIPT') {
    // Keep the live script node (#563): replacing it would re-execute the
    // island client entry and double every listener; a changed src is left
    // stale by design (parsed scripts never execute anyway).
    return;
  }
  if (oldEl.hasAttribute('data-open-preserve')) return;
  var isIsland = __tags.indexOf(oldEl.tagName.toLowerCase()) !== -1;
  if (isIsland) {
    if (__islandIntact(oldEl, newEl)) return;
    if (oldEl.shadowRoot) {
      // Hydrated island whose surface changed: replace (state resets by design).
      oldEl.replaceWith(newEl);
      return;
    }
    // Unhydrated island: morph it like any other element below.
  }
  __syncAttrs(oldEl, newEl);
  if (!isIsland) {
    // Page-level DSD: the element's real content is its shadow tree; the
    // incoming document carries it in the <template shadowrootmode> child.
    var newTemplate = __shadowTemplate(newEl);
    if (oldEl.shadowRoot && newTemplate) {
      __morphChildren(oldEl.shadowRoot, newTemplate.content);
      return;
    }
  }
  __morphChildren(oldEl, newEl);
}

function __findDeep(root, selector) {
  // Region lookup that descends into shadowrootmode templates (#553): the
  // incoming document's regions live inside the page host's template.
  var direct = root.querySelector(selector);
  if (direct) return direct;
  var templates = root.querySelectorAll('template[shadowrootmode]');
  for (var i = 0; i < templates.length; i++) {
    var found = __findDeep(templates[i].content, selector);
    if (found) return found;
  }
  return null;
}

function __morphDocument(html, form, regionName) {
  var doc = new DOMParser().parseFromString(html, 'text/html');
  if (doc.title) document.title = doc.title;
  // ADR-0121 §8 (#553): the form scopes the morph — data-open-region-target
  // (submitter wins over the form), else its nearest ancestor region, else
  // the whole body. A scope missing on either side is a full navigation,
  // never a silent full morph.
  if (form) {
    var name = regionName || form.getAttribute('data-open-region-target');
    if (!name) {
      var host = form.closest('[data-open-region]');
      if (host) name = host.getAttribute('data-open-region');
    }
    if (name) {
      var selector = '[data-open-region="' + (window.CSS && CSS.escape ? CSS.escape(name) : name) + '"]';
      var root = form.getRootNode ? form.getRootNode() : document;
      var oldScope = root.querySelector ? root.querySelector(selector) : null;
      var newScope = __findDeep(doc.body, selector);
      if (oldScope && newScope) {
        __morphNode(oldScope, newScope);
        return true;
      }
      return false;
    }
  }
  __morphNode(document.body, doc.body);
  return true;
}

var __submitRoots = [];
function __attachSubmit(root) {
  if (__submitRoots.indexOf(root) !== -1) return;
  __submitRoots.push(root);
  root.addEventListener('submit', __onSubmit);
}
function __scanSubmitRoots(root) {
  // The submit event is not reliably composed across engines, so enhanced
  // forms inside shadow roots are intercepted at the root. Idempotent; runs
  // at ready time and after every morph (new hosts may appear).
  var all = root.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (el.shadowRoot) {
      __attachSubmit(el.shadowRoot);
      __scanSubmitRoots(el.shadowRoot);
    }
  }
}

var __submitSeq = 0;
var __enhancedNav = false;
function __onSubmit(event) {
  var form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (!form.hasAttribute('data-open-enhance')) return;
  var method = (form.getAttribute('method') || 'get').toUpperCase();
  if (method === 'GET') return;
  event.preventDefault();
  // #564: a second submit while one is in flight is ignored; cross-form
  // responses are ordered by the sequence check below.
  if (form.__openElementBusy) return;
  form.__openElementBusy = true;
  var seq = ++__submitSeq;
  var submitter = event.submitter;
  var actionUrl = (submitter && submitter.formAction) || form.action || window.location.href;
  // #544: the submitter's name/value is part of the body — the body never
  // differs between the two paths (ADR-0120 rule 2).
  var body = submitter ? new FormData(form, submitter) : new FormData(form);
  var regionName = (submitter && submitter.getAttribute('data-open-region-target')) ||
    form.getAttribute('data-open-region-target');
  fetch(actionUrl, {
    method: method,
    body: body,
    headers: { 'x-openelement-action': 'enhance' },
  }).then(function (response) {
    return response.text().then(function (html) {
      return {
        html: html,
        url: response.url,
        status: response.status,
        type: response.headers.get('content-type') || '',
      };
    });
  }).then(function (result) {
    form.__openElementBusy = false;
    if (seq !== __submitSeq) return;
    var target = new URL(result.url, window.location.href);
    // #555: cross-origin targets are real navigations, never pushState.
    if (target.origin !== window.location.origin) {
      window.location.assign(target.href);
      return;
    }
    // #552: only 200/422 HTML responses morph; anything else (500, empty,
    // non-HTML) navigates so the real page shows instead of morphing an
    // error page into place.
    var morphable = (result.status === 200 || result.status === 422) &&
      result.type.indexOf('text/html') !== -1;
    if (morphable) {
      // ADR-0121 §11 (#546): cancelable failure hook before the default morph.
      if (result.status === 422) {
        var proceed = form.dispatchEvent(new CustomEvent('open:action-failure', {
          cancelable: true,
          detail: { status: result.status, form: form, response: result },
        }));
        if (!proceed) return;
      }
      if (__morphDocument(result.html, form, regionName)) {
        __scanSubmitRoots(document);
        if (typeof __observeVisible === 'function') __observeVisible();
        // #565: the fragment never travels over the wire; keep the local one
        // when the target is the same page.
        var samePage = target.pathname === window.location.pathname &&
          target.search === window.location.search;
        var finalUrl = target.href + (samePage && !target.hash ? window.location.hash : '');
        if (finalUrl !== window.location.href) {
          __enhancedNav = true;
          history.pushState({}, '', finalUrl);
        }
        return;
      }
    }
    window.location.assign(target.href);
  }).catch(function () {
    form.__openElementBusy = false;
    window.location.reload();
  });
}

__attachSubmit(document);
__onReady(function () { __scanSubmitRoots(document); });

// ADR-0121 §10 (#545): enhanced navigation is pushState-based; back/forward
// reloads the restored URL so content never disagrees with the address bar.
// The guard keeps the listener inert on pages that never enhanced-navigated
// (e.g. sites running their own client-side routing on the same bundle).
window.addEventListener('popstate', function () {
  if (__enhancedNav) window.location.reload();
});
`
      : '// No data-open-enhance forms: the form enhancement layer is omitted (#569 complement),\n// keeping the client bundle free of morph and popstate code.'
  }

`;
}
