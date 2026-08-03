/**
 * enhance-client.ts - data-open-enhance browser runtime (ADR-0120/0121).
 *
 * Single source of truth for the form-enhancement and morph client (#610):
 * the generated client entry imports this module through the
 * virtual:open-client-runtime specifier (resolved by build-client.ts) and the
 * bundler wires it in — there is no string copy to drift, and the logic
 * carries normal unit tests (__tests__/enhance-client.test.ts). The module
 * stays import-free and touches browser globals only through the injected
 * deps, so it bundles into any consumer build unchanged.
 *
 * Forms marked data-open-enhance submit via fetch and the returned document
 * is morphed into the live tree — INSIDE the page element's shadow root,
 * which is where page content lives under DSD. Two structural facts drive
 * this implementation:
 *   1. The submit event is not composed in every engine, so a document-level
 *      listener never sees forms inside page DSD — listeners attach to every
 *      shadow root instead (a composed submit still reaches the root listener
 *      first; the document listener only handles light-DOM forms).
 *   2. The page's real content is the page host's shadow tree; the incoming
 *      document carries it in the host's <template shadowrootmode> child, so
 *      the morph descends into shadow roots and treats DSD templates as the
 *      incoming shadow content.
 * Without JavaScript the same form is a native POST (303/422 HTML), so
 * behavior degrades to the browser by construction.
 *
 * The wire/attribute surface is documented in docs/current/MORPH_CONTRACT.md.
 *
 * ─── KNOWN-BROWSER-QUIRKS (anti-rot ledger; each entry names a removal
 * condition — delete the entry AND the workaround it documents when the
 * condition is met) ─────────────────────────────────────────────────────────
 * 1. DSD instantiation timing (#579): DSD is only instantiated by the HTML
 *    parser; DOMParser-parsed nodes keep an inert <template shadowrootmode>
 *    child, so instantiateDsd() must run before insertion.
 *    → Delete when all engines instantiate DSD for DOMParser-parsed trees.
 * 2. WebKit upgrade skip (#604): an element moved into a shadow root while
 *    its subtree still belonged to the parser-inert document is permanently
 *    skipped by WebKit's registry; repairShadowUpgrades() re-inserts it after
 *    adoption.
 *    → Delete when WebKit upgrades such elements on adoption.
 * 3. Non-composed submit (#610): the submit event is not composed in every
 *    engine, so a document-level listener never sees forms inside page DSD;
 *    attachSubmit() attaches to every shadow root.
 *    → Delete when submit is composed in every engine (or forms stop living
 *      in shadow roots).
 */

/** Minimal logger surface shared with the generated client entry. */
export interface EnhanceLogger {
  warn: (...args: unknown[]) => void;
}

export interface EnhanceClientDeps {
  log: EnhanceLogger;
  /** Island tag names (lowercase) — survival checks treat them specially. */
  tags: readonly string[];
  /** Header marking an enhanced submit (ACTION_FETCH_HEADER). */
  actionHeader: string;
  win: Window & typeof globalThis;
  doc: Document;
  /**
   * Island scheduler hook: re-observe client:visible islands after a morph
   * (a replaced island is a new element and gets a fresh observer, #562).
   */
  observeVisible: () => void;
}

export interface EnhanceClient {
  /**
   * Attach the submit interceptor to every current shadow root. Idempotent;
   * runs at ready time, after every morph (new hosts may appear), and after
   * late island hydration via the scheduler's onIslandLoaded hook (#584).
   */
  scanSubmitRoots: (root: Document | ShadowRoot) => void;
}

export function createEnhanceClient(deps: EnhanceClientDeps): EnhanceClient {
  const log = deps.log;
  const tags = deps.tags;
  const actionHeader = deps.actionHeader;
  const win = deps.win;
  const doc = deps.doc;

  // State-mirroring attributes (#567): user-toggled state (an open <details>,
  // a playing media element) wins over the incoming document.
  const STATE_ATTRS: Record<string, Record<string, 1>> = {
    DETAILS: { open: 1 },
    VIDEO: { src: 1 },
    AUDIO: { src: 1 },
  };
  // Form-control state attributes (#603): synced only while the control still
  // shows its last server/default state. Once the user (or page script)
  // touches the control, the live property wins and the attribute is left
  // alone — see controlDirty().
  const CONTROL_ATTRS: Record<string, Record<string, 1>> = {
    INPUT: { checked: 1, value: 1 },
    TEXTAREA: { value: 1 },
    OPTION: { selected: 1 },
  };

  function controlDirty(el: Element, name: string): boolean {
    // #603: a control counts as touched when its live property no longer
    // mirrors the attribute the server last rendered.
    if (name === 'value') {
      return (el as HTMLInputElement).value !== (el.getAttribute('value') ?? '');
    }
    // checked / selected: boolean properties mirror attribute presence until
    // the user (or page script) flips them.
    return Boolean((el as unknown as Record<string, unknown>)[name]) !== el.hasAttribute(name);
  }

  function syncAttrs(oldEl: Element, newEl: Element): void {
    const skip = STATE_ATTRS[oldEl.tagName];
    const control = CONTROL_ATTRS[oldEl.tagName];
    const skipAttr = (name: string): boolean =>
      (skip !== undefined && skip[name] === 1) ||
      (control !== undefined && control[name] === 1 && controlDirty(oldEl, name));
    for (let i = oldEl.attributes.length - 1; i >= 0; i--) {
      const name = oldEl.attributes[i].name;
      if (skipAttr(name)) continue;
      if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
    }
    for (let j = 0; j < newEl.attributes.length; j++) {
      const attr = newEl.attributes[j];
      if (skipAttr(attr.name)) continue;
      if (oldEl.getAttribute(attr.name) !== attr.value) {
        oldEl.setAttribute(attr.name, attr.value);
      }
    }
  }

  function shadowTemplate(el: Element): HTMLTemplateElement | null {
    for (let i = 0; i < el.childNodes.length; i++) {
      const n = el.childNodes[i] as Element;
      if (n.nodeType === 1 && n.tagName === 'TEMPLATE' && n.hasAttribute('shadowrootmode')) {
        return n as unknown as HTMLTemplateElement;
      }
    }
    return null;
  }

  function islandIntact(oldEl: Element, newEl: Element): boolean {
    // A hydrated island (live shadow root) survives when its light-DOM surface
    // serializes identically in the incoming document. The DSD template child
    // is skipped on both sides: the browser already consumed it into the live
    // shadow root, and DOMParser does not consume it here.
    if (!(oldEl as HTMLElement).shadowRoot) return false;
    if (oldEl.attributes.length !== newEl.attributes.length) return false;
    for (let i = 0; i < newEl.attributes.length; i++) {
      const attr = newEl.attributes[i];
      if (oldEl.getAttribute(attr.name) !== attr.value) return false;
    }
    const significantKids = (el: Node, skipTemplate: boolean): Node[] => {
      const out: Node[] = [];
      for (let k = 0; k < el.childNodes.length; k++) {
        const n = el.childNodes[k] as Element;
        if (
          skipTemplate && n.nodeType === 1 && n.tagName === 'TEMPLATE' &&
          n.hasAttribute('shadowrootmode')
        ) continue;
        // Whitespace-only text nodes carry no meaning: hydration normalizes the
        // live tree (merged text), the fresh parse keeps them split.
        if (n.nodeType === 3 && (n as unknown as Text).data.trim() === '') continue;
        out.push(n);
      }
      return out;
    };
    const kidsEqual = (o: Node, nn: Node): boolean => {
      // #582: nested DSD compares normalized on both sides — the live subtree
      // already consumed its template, the fresh parse still carries it, so a
      // raw outerHTML comparison would always judge the island 'changed'.
      if (o.nodeType !== nn.nodeType) return false;
      if (o.nodeType === 3) return (o as unknown as Text).data === (nn as unknown as Text).data;
      if (o.nodeType !== 1) return true;
      const oe = o as Element;
      const ne = nn as Element;
      if (oe.tagName !== ne.tagName) return false;
      if (oe.attributes.length !== ne.attributes.length) return false;
      for (let a = 0; a < ne.attributes.length; a++) {
        const attr = ne.attributes[a];
        if (oe.getAttribute(attr.name) !== attr.value) return false;
      }
      const oks = significantKids(oe, true);
      const nks = significantKids(ne, true);
      if (oks.length !== nks.length) return false;
      for (let i = 0; i < oks.length; i++) {
        if (!kidsEqual(oks[i], nks[i])) return false;
      }
      return true;
    };
    const newKids = significantKids(newEl, true);
    const oldKids = significantKids(oldEl, true);
    if (oldKids.length !== newKids.length) return false;
    for (let m = 0; m < newKids.length; m++) {
      if (!kidsEqual(oldKids[m], newKids[m])) return false;
    }
    return true;
  }

  function compatible(a: Node, b: Node): boolean {
    return a.nodeType === b.nodeType &&
      (a.nodeType !== 1 || (a as Element).tagName === (b as Element).tagName);
  }

  function instantiateDsd(node: Node, created?: ShadowRoot[]): void {
    // #579: DSD is only instantiated by the HTML parser; a DOMParser-parsed
    // node inserted into the live tree keeps an inert <template> child and
    // the island would render client-initial content instead of the server's.
    // Instantiate declarative shadow roots manually so upgrades hydrate the
    // server-rendered content. Called BEFORE insertion: upgrade reactions for
    // a defined custom element fire when the subtree is adopted into the
    // live document, and the hydration path must already find the
    // server-rendered shadow content.
    //
    // #604: recursion — a template nested inside another template's content
    // is invisible to querySelectorAll (template.content is a separate
    // tree), so each freshly attached shadow root is scanned again. Every
    // created root is collected for repairShadowUpgrades().
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    const templates = (node as ParentNode).querySelectorAll('template[shadowrootmode]');
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i] as HTMLTemplateElement;
      const host = template.parentNode as HTMLElement | null;
      if (!host || host.shadowRoot) continue;
      const root = host.attachShadow({
        mode: template.getAttribute('shadowrootmode') as ShadowRootMode,
      });
      root.appendChild(template.content);
      template.remove();
      if (created) created.push(root);
      instantiateDsd(root, created);
    }
  }

  function repairShadowUpgrades(roots: ShadowRoot[]): void {
    // #604 (WebKit): an element moved into a shadow root while the subtree
    // still belonged to the parser-inert document is permanently skipped by
    // WebKit's registry — it stays a plain HTMLElement and even
    // customElements.upgrade() cannot reach it. Runs AFTER insertion:
    // re-inserting such an element inside the live tree triggers the
    // natural upgrade path. Chromium/Firefox upgraded eagerly on adoption
    // and are filtered out by the instanceof check.
    for (let i = 0; i < roots.length; i++) {
      const all = roots[i].querySelectorAll('*');
      for (let j = 0; j < all.length; j++) {
        const el = all[j];
        const ctor = el.localName.indexOf('-') !== -1
          ? win.customElements.get(el.localName)
          : undefined;
        if (ctor && !(el instanceof ctor)) {
          const parent = el.parentNode;
          if (!parent) continue;
          const next = el.nextSibling;
          el.remove();
          parent.insertBefore(el, next);
        }
      }
    }
  }

  function morphChildren(oldParent: Node, newParent: Node): void {
    // ADR-0121 §9 (#554, rewritten for #580): an ordered walk. Old children
    // are indexed by id (id'd nodes are consumed ONLY by an id match); each
    // new child in order matches by id else structurally ahead of the
    // reference point; the match is morphed and MOVED into position (moves
    // preserve shadow roots and state); unmatched new nodes are inserted in
    // place (with DSD instantiation); only never-matched old nodes are
    // removed — there is no lookahead window, so deletion is exact.
    const oldKids = Array.prototype.slice.call(oldParent.childNodes) as Node[];
    const newKids = Array.prototype.slice.call(newParent.childNodes) as Node[];
    const oldById: Record<string, Node> = {};
    for (let i = 0; i < oldKids.length; i++) {
      const ok = oldKids[i] as HTMLElement;
      if (ok.nodeType === 1 && ok.id && !oldById[ok.id]) oldById[ok.id] = ok;
    }
    const usedOld: Node[] = [];
    let ref = oldParent.firstChild;
    for (let j = 0; j < newKids.length; j++) {
      const n = newKids[j] as HTMLElement;
      let o: Node | null = null;
      if (
        n.nodeType === 1 && n.id && oldById[n.id] && usedOld.indexOf(oldById[n.id]) === -1 &&
        compatible(oldById[n.id], n)
      ) {
        o = oldById[n.id];
      } else {
        let c = ref;
        while (c) {
          if (
            usedOld.indexOf(c) === -1 && compatible(c, n) &&
            !(
              c.nodeType === 1 && (c as HTMLElement).id &&
              oldById[(c as HTMLElement).id] === c
            )
          ) {
            o = c;
            break;
          }
          c = c.nextSibling;
        }
      }
      if (o) {
        usedOld.push(o);
        morphNode(o, n);
        if (o !== ref) oldParent.insertBefore(o, ref);
        ref = o.nextSibling;
      } else {
        // Instantiate BEFORE insertion: upgrade reactions for a defined custom
        // element fire synchronously with the DOM call, and the hydration path
        // must already find the server-rendered shadow content (#579); the
        // WebKit upgrade repair runs after insertion (#604).
        const created: ShadowRoot[] = [];
        instantiateDsd(n, created);
        oldParent.insertBefore(n, ref);
        repairShadowUpgrades(created);
      }
    }
    for (let k = 0; k < oldKids.length; k++) {
      if (usedOld.indexOf(oldKids[k]) === -1) {
        (oldKids[k] as unknown as { remove(): void }).remove();
      }
    }
  }

  function morphNode(oldEl: Node, newEl: Node): void {
    if (!compatible(oldEl, newEl)) {
      const created: ShadowRoot[] = [];
      instantiateDsd(newEl, created);
      (oldEl as Element).replaceWith(newEl);
      repairShadowUpgrades(created);
      return;
    }
    if (oldEl.nodeType === 3) {
      if ((oldEl as unknown as Text).data !== (newEl as unknown as Text).data) {
        (oldEl as unknown as Text).data = (newEl as unknown as Text).data;
      }
      return;
    }
    if (oldEl.nodeType !== 1) return;
    const oldElement = oldEl as Element;
    const newElement = newEl as Element;
    if (oldElement.tagName === 'SCRIPT') {
      // Keep the live script node (#563): replacing it would re-execute the
      // island client entry and double every listener; a changed src is left
      // stale by design (parsed scripts never execute anyway).
      return;
    }
    if (oldElement.hasAttribute('data-open-preserve')) return;
    const isIsland = tags.indexOf(oldElement.tagName.toLowerCase()) !== -1;
    if (isIsland) {
      if (islandIntact(oldElement, newElement)) return;
      if ((oldElement as HTMLElement).shadowRoot) {
        // Hydrated island whose surface changed: replace (state resets by
        // design); the replacement is DSD-instantiated BEFORE the swap so the
        // upgrade hydrates the server's render, not a client-initial one
        // (#579); the WebKit upgrade repair runs after the swap (#604).
        const created: ShadowRoot[] = [];
        instantiateDsd(newElement, created);
        oldElement.replaceWith(newElement);
        repairShadowUpgrades(created);
        return;
      }
      // Unhydrated island: morph it like any other element below.
    }
    syncAttrs(oldElement, newElement);
    if (!isIsland) {
      // Page-level DSD: the element's real content is its shadow tree; the
      // incoming document carries it in the <template shadowrootmode> child.
      const newTemplate = shadowTemplate(newElement);
      if ((oldElement as HTMLElement).shadowRoot && newTemplate) {
        morphChildren((oldElement as HTMLElement).shadowRoot as ShadowRoot, newTemplate.content);
        return;
      }
    }
    morphChildren(oldElement, newElement);
  }

  function findDeep(root: ParentNode, selector: string): Element | null {
    // Region lookup that descends into shadowrootmode templates (#553): the
    // incoming document's regions live inside the page host's template.
    const direct = root.querySelector(selector);
    if (direct) return direct;
    const templates = root.querySelectorAll('template[shadowrootmode]');
    for (let i = 0; i < templates.length; i++) {
      const found = findDeep((templates[i] as HTMLTemplateElement).content, selector);
      if (found) return found;
    }
    return null;
  }

  // --- #603: morph continuity (focus, scroll) -----------------------------

  interface FocusSnapshot {
    el: Element;
    id: string;
    selStart: number;
    selEnd: number;
  }

  function deepActiveElement(): Element | null {
    let active = doc.activeElement;
    while (active && (active as HTMLElement).shadowRoot) {
      const deeper = (active as HTMLElement).shadowRoot?.activeElement;
      if (!deeper) break;
      active = deeper;
    }
    return active;
  }

  function captureFocus(): FocusSnapshot | null {
    const active = deepActiveElement();
    if (!active || active === doc.body) return null;
    const snap: FocusSnapshot = {
      el: active,
      id: (active as HTMLElement).id || '',
      selStart: -1,
      selEnd: -1,
    };
    const input = active as HTMLInputElement;
    if (typeof input.selectionStart === 'number') {
      snap.selStart = input.selectionStart ?? -1;
      snap.selEnd = input.selectionEnd ?? -1;
    }
    return snap;
  }

  function findByIdDeep(root: ParentNode, id: string): Element | null {
    // Live-tree counterpart of findDeep: descends into attached shadow roots
    // (the incoming side descends into templates instead).
    const all = root.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    for (let j = 0; j < all.length; j++) {
      const shadow = (all[j] as HTMLElement).shadowRoot;
      if (shadow) {
        const found = findByIdDeep(shadow, id);
        if (found) return found;
      }
    }
    return null;
  }

  function restoreFocus(snap: FocusSnapshot | null): void {
    if (!snap) return;
    if (deepActiveElement() === snap.el) return; // the control survived the morph
    let target: Element | null = null;
    if (snap.el.isConnected) {
      // Still in the tree but focus was lost (e.g. it was moved).
      target = snap.el;
    } else if (snap.id) {
      // Replaced by the morph: refocus the same-id successor (#603).
      target = findByIdDeep(doc, snap.id);
    }
    if (!target) return;
    (target as HTMLElement).focus();
    if (
      snap.selStart >= 0 &&
      typeof (target as HTMLInputElement).setSelectionRange === 'function'
    ) {
      try {
        (target as HTMLInputElement).setSelectionRange(snap.selStart, snap.selEnd);
      } catch {
        // Input types without text selection (checkbox, number, ...) throw.
      }
    }
  }

  function applyMorph(
    incoming: Document,
    form: HTMLFormElement | null,
    regionName: string | null,
  ): boolean {
    // ADR-0121 §8 (#553): the form scopes the morph — data-open-region-target
    // (submitter wins over the form), else its nearest ancestor region, else
    // the whole body. A scope missing on either side is a full navigation,
    // never a silent full morph.
    if (form) {
      let name = regionName || form.getAttribute('data-open-region-target');
      if (!name) {
        const host = form.closest('[data-open-region]');
        if (host) name = host.getAttribute('data-open-region');
      }
      if (name) {
        const selector = '[data-open-region="' +
          (win.CSS && win.CSS.escape ? win.CSS.escape(name) : name) + '"]';
        const root = (form.getRootNode ? form.getRootNode() : doc) as ParentNode;
        const oldScope = root.querySelector ? root.querySelector(selector) : null;
        const newScope = findDeep(incoming.body, selector);
        if (oldScope && newScope) {
          morphNode(oldScope, newScope);
          return true;
        }
        // #589: a scoped morph that cannot find its region is a navigation,
        // and it should say so (silent navigations were the round-2 DX finding).
        log.warn(
          'data-open-region "' + name + '" missing on one side; navigating instead of morphing',
        );
        return false;
      }
    }
    morphNode(doc.body, incoming.body);
    return true;
  }

  function morphDocument(
    html: string,
    form: HTMLFormElement | null,
    regionName: string | null,
  ): boolean {
    const incoming = new win.DOMParser().parseFromString(html, 'text/html');
    if (incoming.title) doc.title = incoming.title;
    // #603: a morph is not a navigation — focus and viewport must not jump.
    const focus = captureFocus();
    const scrollX = win.pageXOffset;
    const scrollY = win.pageYOffset;
    const morphed = applyMorph(incoming, form, regionName);
    if (morphed) {
      restoreFocus(focus);
      win.scrollTo(scrollX, scrollY);
    }
    return morphed;
  }

  // --- Submit interception ------------------------------------------------

  const submitRoots: (Document | ShadowRoot)[] = [];
  function attachSubmit(root: Document | ShadowRoot): void {
    if (submitRoots.indexOf(root) !== -1) return;
    submitRoots.push(root);
    root.addEventListener('submit', onSubmit);
  }
  function scanSubmitRoots(root: Document | ShadowRoot): void {
    // The submit event is not reliably composed across engines, so enhanced
    // forms inside shadow roots are intercepted at the root. Idempotent; runs
    // at ready time and after every morph (new hosts may appear). Roots
    // detached by earlier morphs are pruned (#588).
    for (let i = submitRoots.length - 1; i >= 0; i--) {
      const r = submitRoots[i];
      if (r !== (doc as Document | ShadowRoot) && r.isConnected === false) submitRoots.splice(i, 1);
    }
    const all = root.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i] as HTMLElement;
      if (el.shadowRoot) {
        attachSubmit(el.shadowRoot);
        scanSubmitRoots(el.shadowRoot);
      }
    }
  }

  // #578: the marker lives in sessionStorage so it survives a page reload
  // (a memory variable resets, and Back after a reload would show stale
  // content for the restored URL — the exact thing §10 forbids).
  const NAV_KEY = 'openelement:enhanced-nav';
  function markEnhancedNav(): void {
    try {
      win.sessionStorage.setItem(NAV_KEY, '1');
    } catch { /* privacy modes */ }
  }
  function hasEnhancedNav(): boolean {
    try {
      return win.sessionStorage.getItem(NAV_KEY) === '1';
    } catch {
      return false;
    }
  }
  function onSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    if (!(form instanceof win.HTMLFormElement)) return;
    if (!form.hasAttribute('data-open-enhance')) return;
    const method = (form.getAttribute('method') || 'get').toUpperCase();
    if (method === 'GET') return;
    event.preventDefault();
    // #564: a second submit on the SAME form while one is in flight is ignored.
    // #599: sequence is per-form so a concurrent submit on another form cannot
    // silently drop this form's successful response (no global last-wins).
    const formState = form as unknown as {
      __openElementBusy?: boolean;
      __openElementSeq?: number;
    };
    if (formState.__openElementBusy) return;
    formState.__openElementBusy = true;
    formState.__openElementSeq = (formState.__openElementSeq || 0) + 1;
    const seq = formState.__openElementSeq;
    const submitter = (event as SubmitEvent).submitter as HTMLElement | null;
    // #576: formAction IDL is the document URL when formaction is absent.
    // #598: form.action IDL returns an <input name="action"> element when
    // present — always resolve the action attribute (or current URL).
    const submitterAction = submitter && submitter.hasAttribute('formaction')
      ? (submitter as HTMLButtonElement).formAction
      : '';
    const actionUrl: string = submitterAction ||
      (form.getAttribute('action')
        ? new URL(form.getAttribute('action') as string, win.location.href).href
        : win.location.href);
    // #544: the submitter's name/value is part of the body — the body never
    // differs between the two paths (ADR-0120 rule 2).
    const body = submitter
      ? new win.FormData(form, submitter as HTMLButtonElement)
      : new win.FormData(form);
    const regionName = (submitter && submitter.getAttribute('data-open-region-target')) ||
      form.getAttribute('data-open-region-target');
    const headers: Record<string, string> = {};
    headers[actionHeader] = 'enhance';
    win.fetch(actionUrl, {
      method: method,
      body: body,
      headers: headers,
    }).then((response) => {
      return response.text().then((html) => {
        return {
          html: html,
          url: response.url,
          status: response.status,
          type: response.headers.get('content-type') || '',
        };
      });
    }).then((result) => {
      formState.__openElementBusy = false;
      if (seq !== formState.__openElementSeq) return;
      const target = new URL(result.url, win.location.href);
      // #555: cross-origin targets are real navigations, never pushState.
      if (target.origin !== win.location.origin) {
        win.location.assign(target.href);
        return;
      }
      // #552: only 200/422 HTML responses morph; anything else (500, empty,
      // non-HTML) navigates so the real page shows instead of morphing an
      // error page into place.
      const morphable = (result.status === 200 || result.status === 422) &&
        result.type.indexOf('text/html') !== -1;
      if (morphable) {
        // ADR-0121 §11 (#546): cancelable failure hook before the default morph.
        if (result.status === 422) {
          const proceed = form.dispatchEvent(
            new win.CustomEvent('open:action-failure', {
              cancelable: true,
              detail: { status: result.status, form: form, response: result },
            }),
          );
          if (!proceed) return;
        }
        if (morphDocument(result.html, form, regionName)) {
          scanSubmitRoots(doc);
          deps.observeVisible();
          // #565: the fragment never travels over the wire; keep the local one
          // when the target is the same page.
          const samePage = target.pathname === win.location.pathname &&
            target.search === win.location.search;
          const finalUrl = target.href + (samePage && !target.hash ? win.location.hash : '');
          if (finalUrl !== win.location.href) {
            markEnhancedNav();
            win.history.pushState({}, '', finalUrl);
          }
          return;
        }
      }
      win.location.assign(target.href);
    }).catch((err: unknown) => {
      formState.__openElementBusy = false;
      // #585: give the app a hook before the reload fallback — a transient
      // failure must not silently discard in-flight input elsewhere on the
      // page. preventDefault() suppresses the reload.
      const proceed = form.dispatchEvent(
        new win.CustomEvent('open:action-error', {
          cancelable: true,
          detail: { error: err, form: form },
        }),
      );
      // #589: the fallback is invisible without a trace — say why.
      if (proceed) {
        log.warn('enhanced submit failed; reloading the page', err);
        win.location.reload();
      }
    });
  }

  attachSubmit(doc);
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', () => scanSubmitRoots(doc), { once: true });
  } else {
    scanSubmitRoots(doc);
  }

  // ADR-0121 §10 (#545): enhanced navigation is pushState-based; back/forward
  // reloads the restored URL so content never disagrees with the address bar.
  // The guard keeps the listener inert on pages that never enhanced-navigated
  // (e.g. sites running their own client-side routing on the same bundle);
  // the marker persists across reloads via sessionStorage (#578).
  win.addEventListener('popstate', () => {
    if (hasEnhancedNav()) win.location.reload();
  });
  // bfcache restores do not fire popstate (Firefox restores the morphed
  // document as-is); a persisted pageshow with the marker set is the same
  // situation and must also reload.
  win.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && hasEnhancedNav()) win.location.reload();
  });

  return { scanSubmitRoots: scanSubmitRoots };
}
