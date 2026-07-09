/**
 * @openelement/element - OpenElement base class.
 *
 * Zero-dependency Custom Element base class providing:
 *   - Declarative Shadow DOM (DSD) detection at upgrade time
 *   - Client-Side Rendering (CSR) fallback when no DSD content exists
 *   - StyleSheet (SSR-safe CSSStyleSheet) via adoptedStyleSheets
 *   - Declarative event binding via html template @click / @keydown etc.
 *   - Signal-driven fine-grained DOM patching via data-signal markers
 *   - AbortController cleanup on disconnect
 *   - formAssociated + delegatesFocus support
 *
 * OpenElement extends HTMLElement directly - ZERO Lit dependency.
 * Components return `render(): VNode | null`.
 *
 * Lifecycle:
 *   SSR: instantiate -> set props -> render() -> wrap in DSD template
 *   Client (DSD): browser attaches shadow root from DSD -> upgrade -> bind template events
 *   Client (CSR): connectedCallback -> createRenderRoot -> render into shadowRoot
 *
 * Usage (static DSD component):
 * ```ts
 * class MyCard extends OpenElement {
 *   static styles = myStyleSheet;
 *   render(): VNode {
 *     return <div class="card"><slot /></div>;
 *   }
 * }
 * customElements.define('my-card', MyCard);
 * ```
 *
 * Usage (reactive DSD component):
 * ```ts
 * class MyToggle extends OpenElement {
 *   #active = signal(false);
 *   render() {
 *     return (
 *       <button onClick={() => this.#active.value = !this.#active.value}>
 *         {this.#active.value ? 'ON' : 'OFF'}
 *       </button>
 *     );
 *   }
 * }
 * ```
 *
 * @module @openelement/element/open-element
 */

import { formatError } from '@openelement/core/errors';
import type { StyleSheetLike } from '@openelement/protocol/style-sheet';
import {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  syncStaticPropsFromAttributes,
} from '@openelement/core/prop';
import type { VNode } from '@openelement/protocol/vnode';
import type { Signal } from '@openelement/protocol/signal';
import { signal } from '@openelement/signal';
import { createLogger } from '@openelement/core/logger';
import { HydrationScope } from '@openelement/core/hydrate';
import {
  renderErrorFallback,
  renderIntoLightDom,
  renderIntoShadowRoot,
} from './open-element-render.ts';
import { hydrateExistingDom } from './open-element-hydration.ts';

// ─── Module-level global state ─────────────────────────
// v0.41.0 (ADR-0061): Global stylesheet registry + theme broadcast.
// Previously applications had to hand-roll MutationObservers to push a
// shared design system into every reader-* shadow root and to keep
// data-theme in sync across shadow boundaries. Both concerns now live
// in the framework.

/**
 * Stylesheets registered via `OpenElement.registerGlobalStyles()`.
 * Automatically merged into every OpenElement shadow root's
 * `adoptedStyleSheets`, ahead of any component-level `static styles`.
 *
 * Accepts both `StyleSheetLike` (openElement's SSR-safe abstraction) and
 * native `CSSStyleSheet` instances — the real ShadowRoot API eats both.
 */
const _globalStyleSheets: StyleSheetLike[] = [];

/**
 * Set of currently-connected OpenElement instances.
 * Used by the theme observer to broadcast `data-theme` changes.
 * Uses a WeakSet-like pattern but we need iteration, so a plain Set is fine —
 * entries are removed in `disconnectedCallback`.
 */
const _connectedInstances: Set<OpenElement> = new Set();

/** Whether the document-level theme observer has been installed. */
let _themeObserverInstalled = false;

/**
 * Install a one-shot MutationObserver on `document.documentElement` that
 * broadcasts `data-theme` changes to every connected OpenElement instance.
 *
 * Why this lives in the framework: shadow boundaries prevent
 * `:root[data-theme]` selectors from reaching shadow content. Each host
 * needs its own `data-theme` attribute for `:host([data-theme='dark'])`
 * rules to fire. Without this broadcast, theme switches only affect
 * newly-connected elements — already-mounted ones keep the stale theme.
 */
function _installThemeObserver(): void {
  if (_themeObserverInstalled) return;
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }
  _themeObserverInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'attributes' || m.attributeName !== 'data-theme') continue;
      const theme = document.documentElement?.dataset?.theme;
      for (const inst of _connectedInstances) {
        // Broadcast to every connected instance. We force-set even if the
        // instance already has a data-theme, because the whole point of the
        // observer is to propagate document-level theme switches. Apps that
        // need per-instance themes should set data-theme on the instance AND
        // avoid changing documentElement's data-theme.
        if (inst.isConnected) {
          if (theme) {
            inst.setAttribute('data-theme', theme);
          } else {
            inst.removeAttribute('data-theme');
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

/**
 * SSR-safe base class for OpenElement.
 *
 * In browser: extends HTMLElement directly.
 * In SSR/no-DOM runtimes: extends a minimal stub that satisfies the
 * HTMLElement contract without mutating globalThis.
 *
 * NOTE: we intentionally do NOT assign globalThis.HTMLElement in SSR.
 * Runtime-agnostic modules should not mutate the host global scope.
 */
const _Base = typeof HTMLElement !== 'undefined' ? HTMLElement : (class {
  hasAttribute(_name: string): boolean {
    return false;
  }
  getAttribute(_name: string): string | null {
    return null;
  }
  setAttribute(_name: string, _value: string): void {}
  removeAttribute(_name: string): void {}
  get tagName(): string {
    return '';
  }
  get isConnected(): boolean {
    return false;
  }
} as unknown as typeof HTMLElement);

/**
 * Zero-dependency Custom Element base class for DSD rendering.
 *
 * Provides DSD detection, CSR fallback, event hydration, and style management
 * without any framework dependency (no Lit, no reactive-element).
 *
 * Subclasses MUST override `render(): VNode | null`.
 */
export class OpenElement extends _Base {
  /** Component stylesheets (SSR-safe - StyleSheet delegates to native CSSStyleSheet in browser). */
  static styles?: StyleSheetLike | StyleSheetLike[];

  /**
   * Register a stylesheet (or array of stylesheets) to be applied to
   * **every** OpenElement shadow root, ahead of any component-level
   * `static styles`.
   *
   * v0.41.0 (ADR-0061): Replaces the application-level pattern of
   * hand-rolling a MutationObserver + `shadowRoot.adoptedStyleSheets`
   * injection. Intended for shared design systems that must penetrate
   * shadow boundaries (tokens, base typography, theme rules using
   * `:host([data-theme='...'])`).
   *
   * Accepts both `StyleSheetLike` (openElement's SSR-safe abstraction)
   * and native `CSSStyleSheet` instances — on real ShadowRoot, both
   * work identically as `adoptedStyleSheets` entries.
   *
   * Idempotent: registering the same sheet twice is a no-op.
   *
   * @example
   * ```ts
   * const designSystem = new CSSStyleSheet();
   * designSystem.replaceSync(`:host([data-theme='dark']) { --bg: #0b0b0b; }`);
   * OpenElement.registerGlobalStyles(designSystem);
   * ```
   */
  static registerGlobalStyles(
    sheets: unknown | unknown[],
  ): void {
    const arr = Array.isArray(sheets) ? sheets : [sheets];
    for (const s of arr) {
      if (!_globalStyleSheets.includes(s as StyleSheetLike)) {
        _globalStyleSheets.push(s as StyleSheetLike);
      }
    }
  }

  /**
   * Returns a snapshot of the globally-registered stylesheets.
   * Primarily for testing and debugging.
   */
  static getGlobalStyles(): StyleSheetLike[] {
    return [..._globalStyleSheets];
  }

  /**
   * Clear all globally-registered stylesheets.
   * Primarily for test isolation. Not intended for production use.
   */
  static _resetGlobalStyles(): void {
    _globalStyleSheets.length = 0;
  }

  /** Rendering mode. Defaults to shadow/DSD; light DOM is explicit opt-in. */
  static renderMode?: 'shadow' | 'light';

  /** v0.25.0: Page head metadata. SSG reads this to inject <title> and <meta> tags. */
  static head?: { title?: string; description?: string; ogImage?: string };

  /** @internal — use openPipeline({ island: { upgradeStrategy } }) instead */
  static client?: { strategy?: 'load' | 'idle' | 'visible' | 'only' };

  /**
   * Attributes that trigger attributeChangedCallback.
   * Subclasses override this to declare reactive attributes.
   */
  static observedAttributes?: string[];

  /**
   * Whether to delegate focus within the shadow root.
   * When true, attachShadow is called with `delegatesFocus: true`.
   */
  static delegatesFocus?: boolean;

  /**
   * Whether this element participates in form submission.
   * When true, ElementInternals are attached in connectedCallback.
   */
  static formAssociated?: boolean;

  /**
   * Signal registry for attribute-based hydration (ADR-0065).
   * Maps signal names → signal objects. Built by registerSignal()
   * in component constructors, consumed during hydration.
   *
   * Exposed internally for render helper modules.
   */
  signalRegistry: Map<string, Signal<unknown>> = new Map();

  /**
   * v0.41.0-alpha.2: Hydration lifecycle scope.
   *
   * Replaces the separate #effectDisposers, #eventCleanups, and #vnodeCache
   * fields. The scope is owned by the element and disposed on disconnect.
   * It is exposed to @openelement/core/hydrate so the same lifecycle model
   * can be reused by third-party framework runtimes later.
   *
   * Initialized after signalRegistry in the constructor to avoid field-order
   * dependency on class field initializer sequencing.
   */
  #hydrationScope!: HydrationScope;

  constructor() {
    super();
    this.#hydrationScope = new HydrationScope({
      signalRegistry: this.signalRegistry,
    });
  }

  /** AbortController tied to element lifecycle. Aborted in disconnectedCallback. */
  #lifecycleAbort?: AbortController;

  /**
   * Returns an AbortSignal that is aborted when the element is disconnected.
   * Useful for tying async work (fetch, event listeners) to element lifecycle.
   */
  protected _lifecycleSignal(): AbortSignal {
    if (!this.#lifecycleAbort) this.#lifecycleAbort = new AbortController();
    return this.#lifecycleAbort.signal;
  }

  /**
   * setTimeout wrapper that auto-clears when the element disconnects.
   */
  protected _setTimeout(handler: TimerHandler, timeout?: number): number {
    const id = globalThis.setTimeout(handler, timeout);
    this._lifecycleSignal().addEventListener('abort', () => globalThis.clearTimeout(id), {
      once: true,
    });
    return id;
  }

  /**
   * requestAnimationFrame wrapper that auto-cancels when the element disconnects.
   */
  protected _requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = globalThis.requestAnimationFrame(callback);
    this._lifecycleSignal().addEventListener('abort', () => globalThis.cancelAnimationFrame(id), {
      once: true,
    });
    return id;
  }

  /**
   * Register a signal for hydration by name.
   * Call in constructor: this.registerSignal('count', this.#count);
   */
  protected registerSignal(name: string, sig: Signal<unknown>): void {
    this.signalRegistry.set(name, sig);
  }

  /** Reactive route parameters Signal. Updates automatically on SPA navigation. */
  #params = signal<Record<string, string>>({});

  /** Reactive route parameters. Updates automatically on SPA navigation. */
  get params(): Record<string, string> {
    return this.#params.value;
  }

  set params(value: Record<string, string>) {
    this.#params.value = { ...value };
  }

  /** ElementInternals for form-associated custom elements */
  protected _internals?: ElementInternals;

  /**
   * Create or reuse the shadow root.
   *
   * DSD detection: if `this.shadowRoot` already exists and has nodes,
   * the browser pre-populated it from a <template shadowrootmode> tag.
   * In that case we mark `_dsdHydrated = true` and return the existing root.
   *
   * CSR fallback: if no shadow root exists, we call `attachShadow()`. If an
   * empty shadow root already exists, we reuse it and let connectedCallback()
   * populate it from render().
   *
   * @returns The existing or newly created ShadowRoot.
   */
  createRenderRoot(): ShadowRoot | this {
    const ctor = this.constructor as typeof OpenElement;
    if (ctor.renderMode === 'light') {
      return this;
    }

    // DSD pre-populated shadow root detection
    if (this.shadowRoot) {
      this._applyStyles(ctor, this.shadowRoot);
      return this.shadowRoot;
    }

    // CSR: create a new shadow root
    const delegatesFocus = ctor.delegatesFocus ?? false;
    const root = this.attachShadow({ mode: 'open', delegatesFocus });

    // Apply static styles via adoptedStyleSheets
    this._applyStyles(ctor, root);

    return root;
  }

  /**
   * Apply styles to the shadow root via adoptedStyleSheets.
   * Shared between CSR (createRenderRoot) and DSD (connectedCallback) paths.
   *
   * v0.41.0: Global stylesheets registered via `OpenElement.registerGlobalStyles()`
   * are merged in **first**, ahead of component-level `static styles`. This lets
   * a shared design system (tokens, theme rules) reach every shadow root without
   * each component re-declaring it.
   */
  private _applyStyles(ctor: typeof OpenElement, root?: ShadowRoot): void {
    const target = root ?? this.shadowRoot;
    if (!target) return;
    const ctorSheets = ctor.styles
      ? (Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles])
      : [];
    // Global sheets first, then component sheets (component wins on cascade order)
    const allSheets = [..._globalStyleSheets, ...ctorSheets];
    if (allSheets.length > 0) {
      // StyleSheet delegates to native CSSStyleSheet in browser
      // type-escape: adoptedStyleSheets may not be in the configured DOM lib
      (target as unknown as { adoptedStyleSheets: typeof allSheets }).adoptedStyleSheets =
        allSheets;
    }
  }

  /**
   * Lifecycle: called when the element is connected to the DOM.
   *
   * DSD path (_dsdHydrated = true):
   *   - Calls _hydrateEvents() to bind declarative events on existing DOM.
   *
   * CSR path (_dsdHydrated = false):
   *   - Calls createRenderRoot() if no shadow root exists.
   *   - Renders this.render() through the VNode DOM renderer.
   *
   * If formAssociated is true, ElementInternals are attached.
   */
  connectedCallback(): void {
    const ctor = this.constructor as typeof OpenElement;

    // v0.24.1 (ADR-0057): Initialize static props signals and accessors
    initializeStaticProps(this);
    syncStaticPropsFromAttributes(this);

    const isLightDom = ctor.renderMode === 'light';

    // Ensure render target exists and detect DSD pre-population
    if (!this.shadowRoot && !isLightDom) {
      this.createRenderRoot();
    } else if (this.shadowRoot) {
      // DSD path: shadow root already populated.
      this.style.display = 'block';
      this._applyStyles(ctor);
    }

    // Sync data-theme from document root (browser only)
    if (typeof document !== 'undefined') {
      const docTheme = document.documentElement?.dataset?.theme;
      if (docTheme && !this.hasAttribute('data-theme')) {
        this.setAttribute('data-theme', docTheme);
      }
    }

    // v0.41.0 (ADR-0061): Register this instance for theme broadcasts.
    // Also installs the document-level observer on first connect.
    _connectedInstances.add(this);
    _installThemeObserver();

    // TG-01: Read route params from attribute if present.
    // (SSR/SSG injects params as JS property via injectProps — setter handles it)
    const attrParams = this.getAttribute('params');
    if (attrParams) {
      try {
        this.#params.value = JSON.parse(attrParams);
      } catch (err) {
        createLogger('element').error(
          `Failed to parse params attribute on <${this.tagName.toLowerCase()}>: ${
            formatError(err)
          }`,
        );
      }
    }

    // v0.25.0 (SOP-012): Unified render path — DSD and CSR both go through
    // _renderOrHydrate(). The _dsdHydrated flag and _bindCurrentRenderTemplate()
    // are removed. DSD pre-populated DOM is preserved; only events and signal
    // subscriptions are added.
    this._renderOrHydrate();

    // v0.40.0: Client-side activation hook for framework hydration
    this.clientActivate();

    // Attach ElementInternals for form-associated custom elements
    if (ctor.formAssociated && typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /**
   * v0.25.0 (SOP-012): Unified render path.
   */
  private _renderOrHydrate(): void {
    try {
      const ctor = this.constructor as typeof OpenElement;
      if (ctor.renderMode === 'light') {
        this._renderIntoLightDom();
        this.onCsrRendered();
        return;
      }

      const isDsd = this.shadowRoot && this.shadowRoot.childNodes.length > 0;
      if (isDsd) {
        // DSD: DOM already correct — bind events via VNode walk
        this._hydrateExistingDom();
        this.onDsdHydrated();
      } else if (this.shadowRoot) {
        // CSR: full render from VNode
        this._renderIntoShadowRoot();
        this.onCsrRendered();
      }
    } catch (err) {
      this._renderErrorFallback(err);
    }
  }
  /**
   * Hydrate DSD DOM with signal and event bindings.
   *
   * v0.28 (ADR-0067): Replaces _walkAndBind position matching.
   *
   * Implementation lives in open-element-hydration.ts.
   */
  private _hydrateExistingDom(): void {
    hydrateExistingDom(this, this.#hydrationScope);
  }

  /**
   * v0.23.0: Hook called after DSD hydration completes.
   *
   * Subclasses override this instead of relying on fragile
   * `super.connectedCallback()` call order. At this point the
   * shadow DOM is populated from DSD and declarative events
   * (@click, @keydown) are bound.
   *
   * No-op by default.
   */
  protected onDsdHydrated(): void {}

  /**
   * v0.23.0: Hook called after CSR first render completes.
   *
   * Subclasses override this for post-render initialization
   * that depends on the shadow DOM being populated. At this
   * point render() has been called and declarative events
   * are bound.
   *
   * No-op by default.
   */
  protected onCsrRendered(): void {}

  /**
   * v0.40.0: Client-side activation hook.
   *
   * Called once after the element is connected, the shadow root
   * is ready, and any DSD hydration or CSR rendering has completed.
   * This is the right place for framework hydration (Preact, React,
   * Vue, Lit) to take over the shadow root.
   *
   * Default implementation is a no-op. Subclasses override this to
   * hydrate or render framework components into the shadow root.
   */
  protected clientActivate(): void {
    // default no-op
  }

  /**
   * Hook called when the unified client render/hydrate path throws.
   * Subclasses may return a VNode fallback.
   */
  protected onRenderError(error: unknown): VNode | null {
    createLogger('dsd').error(
      `<${this.tagName.toLowerCase()}> render/hydrate failed: ${formatError(error)}`,
    );
    return null;
  }

  private _renderErrorFallback(error: unknown): void {
    renderErrorFallback(
      this,
      error,
      this.#hydrationScope,
      (err) => this.onRenderError(err),
    );
  }

  /**
   * Lifecycle: called when the element is disconnected from the DOM.
   * Aborts all hydration event listeners for cleanup.
   */
  disconnectedCallback(): void {
    this.#hydrationScope.dispose();
    disposeStaticProps(this);
    this.#lifecycleAbort?.abort();
    this.#lifecycleAbort = undefined;
    // v0.41.0: Stop receiving theme broadcasts.
    _connectedInstances.delete(this);
  }

  // v0.28 (ADR-0067): Effect + event lifecycle managed by HydrationScope.
  // _walkAndBind DELETED — replaced by _hydrateExistingDom().

  /**
   * Lifecycle: called when an observed attribute changes.
   *
   * Base implementation is a no-op. Subclasses override this to react
   * to attribute changes, typically by calling `this.render()` to update
   * the shadow DOM.
   *
   * @param name - Attribute name (lowercase).
   * @param oldValue - Previous value, or null if the attribute was not set.
   * @param newValue - New value, or null if the attribute was removed.
   */
  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void {
    // v0.24.1 (ADR-0057): Route to static props handler
    handleStaticPropAttributeChange(
      this,
      _name,
      _oldValue,
      _newValue,
    );
    // Subclass override point - base implementation is intentionally empty.
  }

  /**
   * Re-render the shadow DOM from `render()` and re-bind declarative events.
   *
   * OpenElement intentionally does not include a reactive scheduler. Components
   * with local state can call this method after state changes instead of
   * duplicating renderToDom() and event hydration.
   */
  update(): void {
    const ctor = this.constructor as typeof OpenElement;
    if (ctor.renderMode === 'light') {
      this._renderIntoLightDom();
      return;
    }
    this._renderIntoShadowRoot();
  }

  /**
   * ReactiveController-compatible update hook.
   *
   * Async state controllers call this method when state changes. Keeping this
   * tiny alias lets OpenElement host controllers without inheriting Lit or a
   * scheduler.
   */
  requestUpdate(): void {
    this.update();
  }

  private _renderIntoLightDom(): void {
    renderIntoLightDom(this, this.#hydrationScope);
  }

  private _renderIntoShadowRoot(): void {
    renderIntoShadowRoot(this, this.#hydrationScope);
  }

  /**
   * Read locale from JS property (set by SSR injectProps) first,
   * then HTML attribute, then fallback to provided default.
   *
   * SSR injectProps() sets camelCase JS properties (e.g. this.locale = 'en')
   * but getAttribute() only reads HTML attributes, which remain null.
   * This method resolves the mismatch by checking JS property first.
   *
   * @param fallback - Default value when neither source has a value. Defaults to 'en'.
   */
  protected _getLocale(fallback = 'en'): string {
    const prop = (this as Record<string, unknown>).locale;
    if (typeof prop === 'string' && prop) return prop;
    return this.getAttribute('locale') || fallback;
  }

  /**
   * Return Shadow DOM content as a VNode.
   *
   * Subclasses MUST override this method. During SSR, rendered content is
   * wrapped in a <template shadowrootmode="open"> tag. During CSR, VNode values
   * are rendered via renderToDom() with event binding and signal tracking.
   *
   * @returns VNode for the shadow DOM content, or null for empty content.
   */
  render(): VNode | null {
    return null;
  }
}

/** OpenElement constructor with framework-convention static properties. */
export interface OpenElementComponentConstructor extends CustomElementConstructor {
  styles?:
    | StyleSheetLike
    | StyleSheetLike[];
  tagName?: string;
  renderMode?: 'shadow' | 'light';
  observedAttributes?: string[];
}
