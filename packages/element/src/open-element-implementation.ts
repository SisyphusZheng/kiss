/**
 * @openelement/element - OpenElement base class.
 *
 * Custom Element base class with zero framework dependency, providing:
 *   - Declarative Shadow DOM (DSD) detection at upgrade time
 *   - Client-Side Rendering (CSR) fallback when no DSD content exists
 *   - StyleSheet (SSR-safe CSSStyleSheet) via adoptedStyleSheets
 *   - Declarative event binding via JSX onClick / on-click props, matched to
 *     SSR-emitted data-eid markers at hydration time
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

import { formatError } from './internal/core/errors.ts';
import { handleStaticPropAttributeChange, initializeStaticProps } from './internal/core/prop.ts';
import type { VNode } from './internal/protocol/vnode.ts';
import type { Signal } from './internal/protocol/signal.ts';
import { createLogger } from './internal/core/logger.ts';
import { HydrationScope } from './internal/core/index.ts';
import { hydrateExistingDom } from './open-element-hydration.ts';
import { themeManager } from './open-element-styles.ts';
import { ElementParams } from './open-element-params.ts';
import { ElementLifecycle } from './open-element-lifecycle.ts';
import { OpenElementConfiguration } from './open-element-configuration.ts';
import {
  connectOpenElement,
  disconnectOpenElement,
  type OpenElementRuntimeHost,
  registerOpenElementScope,
  updateOpenElement,
} from './open-element-runtime.ts';

/**
 * Custom Element base class for DSD rendering with zero framework dependency.
 *
 * Provides DSD detection, CSR fallback, event hydration, and style management
 * without any framework dependency (no Lit, no reactive-element).
 *
 * Subclasses MUST override `render(): VNode | null`.
 */
export class OpenElement extends OpenElementConfiguration {
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
   * It is exposed to the hydration adapter so the same lifecycle model
   * can be reused by third-party framework runtimes later.
   *
   * Initialized after signalRegistry in the constructor to avoid field-order
   * dependency on class field initializer sequencing.
   */
  #hydrationScope!: HydrationScope;

  /**
   * v0.42.0-alpha.15 (#904): Abort lifecycle moved into ElementLifecycle
   * (open-element-lifecycle.ts); the class keeps the protected surface.
   */
  #lifecycle = new ElementLifecycle();

  /** v0.42.0-alpha.15 (#904): route params box (open-element-params.ts). */
  #params = new ElementParams();

  constructor() {
    super();
    this.#hydrationScope = new HydrationScope({
      signalRegistry: this.signalRegistry,
    });
    registerOpenElementScope(this._runtimeHost(), this.#hydrationScope);
    // Initialize static prop accessors during construction so SSR sees the
    // same engine-backed, registered signals as CSR/hydration. The initializer
    // is idempotent and reconnect only re-arms disposed reflection listeners.
    initializeStaticProps(this);
  }

  /**
   * Returns an AbortSignal that is aborted when the element is disconnected.
   * Useful for tying async work (fetch, event listeners) to element lifecycle.
   */
  protected _lifecycleSignal(): AbortSignal {
    return this.#lifecycle.signal;
  }

  /**
   * setTimeout wrapper that auto-clears when the element disconnects.
   */
  protected _setTimeout(handler: TimerHandler, timeout?: number): number {
    return this.#lifecycle.setTimeout(handler, timeout);
  }

  /**
   * requestAnimationFrame wrapper that auto-cancels when the element disconnects.
   */
  protected _requestAnimationFrame(callback: FrameRequestCallback): number {
    return this.#lifecycle.requestAnimationFrame(callback);
  }

  /**
   * Register a signal for hydration by name.
   * Call in constructor: this.registerSignal('count', this.#count);
   */
  protected registerSignal(name: string, sig: Signal<unknown>): void {
    this.signalRegistry.set(name, sig);
  }

  /** Cycle-free structural view used by the lifecycle runtime collaborator. */
  private _runtimeHost(): OpenElementRuntimeHost {
    return this as unknown as OpenElementRuntimeHost;
  }

  /** Reactive route parameters. Updates automatically on SPA navigation. */
  get params(): Record<string, string> {
    return this.#params.value;
  }

  set params(value: Record<string, string>) {
    this.#params.value = value;
  }

  /** ElementInternals for form-associated custom elements */
  protected _internals?: ElementInternals;

  /**
   * Create or reuse the shadow root.
   *
   * DSD detection: if `this.shadowRoot` already exists and has nodes,
   * the browser pre-populated it from a <template shadowrootmode> tag.
   * In that case we reuse the existing root; the DSD-vs-CSR decision itself
   * happens later in _renderOrHydrate() via hasPopulatedShadowRoot().
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
      themeManager.applyStyles(this.shadowRoot, ctor.styles);
      return this.shadowRoot;
    }

    // CSR: create a new shadow root
    const delegatesFocus = ctor.delegatesFocus ?? false;
    const root = this.attachShadow({ mode: 'open', delegatesFocus });

    // Apply static styles via adoptedStyleSheets
    themeManager.applyStyles(root, ctor.styles);

    return root;
  }

  /**
   * Lifecycle: called when the element is connected to the DOM.
   *
   * Ensures the render root exists, then delegates to _renderOrHydrate(),
   * which picks between DSD hydration (hasPopulatedShadowRoot() — bind events
   * and signals onto the existing DOM) and CSR rendering (render() into the
   * shadow root).
   *
   * If formAssociated is true, ElementInternals are attached.
   */
  connectedCallback(): void {
    connectOpenElement(this._runtimeHost(), this.#params);
  }

  /**
   * Hydrate DSD DOM with signal and event bindings.
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
   * shadow DOM is populated from DSD and declarative event props
   * (onClick / on-click) are bound to their data-eid markers.
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

  /**
   * Lifecycle: called when the element is disconnected from the DOM.
   * Aborts all hydration event listeners for cleanup.
   */
  disconnectedCallback(): void {
    disconnectOpenElement(
      this._runtimeHost(),
      this.#hydrationScope,
      this.#lifecycle,
    );
  }

  // Effect + event lifecycle managed by HydrationScope (ADR-0067).

  /**
   * Lifecycle: called when an observed attribute changes.
   *
   * The base implementation forwards the change to
   * handleStaticPropAttributeChange(), which parses the new attribute value
   * into the matching static-prop signal (restoring the declared default on
   * attribute removal). Subclasses that override this should call
   * `super.attributeChangedCallback(...)` to keep static props in sync.
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
    // Subclass override point — call super to keep static props in sync.
  }

  /**
   * Re-render the shadow DOM from `render()` and re-bind declarative events.
   *
   * OpenElement intentionally does not include a reactive scheduler. Components
   * with local state can call this method after state changes instead of
   * duplicating renderToDom() and event hydration.
   *
   * Render errors take the same `onRenderError()` fallback contract as the
   * initial render (_renderOrHydrate) — rethrowing here would leave callers
   * (e.g. ErrorBoundary.retry()) with an uncaught throw and the element stuck
   * on stale/partial DOM with no recovery path (#662).
   */
  update(): void {
    updateOpenElement(this._runtimeHost());
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
    const prop = this.locale;
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
