/**
 * @openelement/element - OpenElement base class (v0.44 compiled facade).
 *
 * The public OpenElement base class is a thin facade over the compiled Part
 * Program kernel (internal/compiled/runtime/kernel.ts). A 0.44 component is
 * authored in TSX and passed through the OpenElement compiler (the
 * @openelement/adapter-vite `open:compiled-element` transform), which emits a
 * decorator-free class carrying the compiled statics this facade consumes:
 *
 *   - `static __partProgram`        — the validated Part Program v1 artifact
 *   - `static __compiledProperties` — JSON property records
 *     ({ name, attribute, type, converter, reflect, default })
 *   - `static __elementMetadata`    — element metadata (tag, cem, ...)
 *   - `static observedAttributes`   — compiler-owned attribute list
 *
 * At construction the facade builds the kernel host: one engine-backed signal
 * per compiled property, the program-referenced handlers bound to instance
 * methods, and an empty refs record (internal/compiled/facade-host.ts owns
 * the property contract). Claim-vs-fresh activation is decided by the kernel
 * from the existing root content (`root.childNodes`).
 *
 * There is no fallback render path: an OpenElement subclass that reaches
 * `connectedCallback()` without a `__partProgram` fails closed with an
 * OpenElementError (code `OE_PROGRAM_MISSING`).
 *
 * Lifecycle:
 *   Server: renderDsd() -> serializeCompiledProgram() -> deterministic HTML
 *   Client (SSR DOM present): connectedCallback -> kernel.connect() claims
 *     the existing tree -> onDsdHydrated()
 *   Client (no SSR DOM): connectedCallback -> kernel.connect() creates fresh
 *     DOM -> onCsrRendered()
 *
 * @module @openelement/element/open-element
 */

import { OpenElementError } from './internal/core/errors.ts';
import {
  applyPendingOwnValues,
  bindProgramHandlers,
  classNameOf,
  type CompiledStatics,
  createFacadePropertyState,
  type FacadePropertyState,
  handleCompiledAttributeChange,
  installAccessors,
  reconcileOwnProperties,
  syncAttributesToSignals,
} from './internal/compiled/facade-host.ts';
import {
  capturePreUpgradeEvents,
  replayPreUpgradeEvents,
} from './internal/compiled/claim/index.ts';
import type { PreUpgradeEventCapture } from './internal/compiled/claim/index.ts';
import { CompiledErrorBoundary } from './internal/compiled/runtime/error-boundary.ts';
import {
  CompiledElementKernel,
  type CompiledRootMode,
} from './internal/compiled/runtime/kernel.ts';
import { ElementLifecycle } from './open-element-lifecycle.ts';
import { ElementParams } from './open-element-params.ts';
import { OpenElementConfiguration } from './open-element-configuration.ts';

/** Per-instance facade state, keyed off the element (constructor closures). */
const facadeStates = new WeakMap<OpenElement, FacadePropertyState>();

// ─── Pre-upgrade event capture (claim replay seam) ──────────────────

const preUpgradeCaptures = new Map<EventTarget, PreUpgradeEventCapture>();

/**
 * Install the bounded pre-upgrade interaction capture on an owning root
 * (default: the document). Generated client entries call this before any
 * compiled element upgrades; after a successful claim the element replays the
 * captured events whose targets live inside its root (compiled claim
 * capture/replay, internal/compiled/claim). Idempotent per root and a no-op
 * where no DOM exists (SSR).
 */
export function ensurePreHydrationClickCapture(root?: EventTarget): void {
  const target = root ??
    (typeof document !== 'undefined' ? (document as unknown as EventTarget) : undefined);
  if (!target || typeof target.addEventListener !== 'function') return;
  if (preUpgradeCaptures.has(target)) return;
  preUpgradeCaptures.set(target, capturePreUpgradeEvents(target));
}

/** Replay captured pre-upgrade events owned by a successfully claimed root. */
function replayPreUpgradeCaptures(root: Node): void {
  for (const capture of preUpgradeCaptures.values()) {
    replayPreUpgradeEvents(root, capture.events);
  }
}

function failMissingProgram(ctor: object): never {
  throw new OpenElementError(
    `[openElement] <${classNameOf(ctor)}> has no compiled Part Program. ` +
      'In 0.44 every OpenElement component must pass through the OpenElement ' +
      'compiler (the @openelement/adapter-vite open:compiled-element transform); ' +
      'the runtime JSX render path was removed.',
    { code: 'OE_PROGRAM_MISSING', phase: 'csr' },
  );
}

/**
 * Custom Element base class for the compiled Part Program architecture.
 *
 * Subclasses are produced by the 0.44 compiler; hand-written subclasses that
 * never pass through the compiler fail closed at connect time.
 */
export class OpenElement extends OpenElementConfiguration {
  /** v0.42.0-alpha.15 (#904): route params box (open-element-params.ts). */
  #params = new ElementParams();

  /**
   * Lifecycle fallback used only when no compiled kernel exists (an instance
   * without a program never connects; the kernel owns the connected lifecycle
   * otherwise).
   */
  #detachedLifecycle = new ElementLifecycle();

  /** Error state owner used before a kernel exists (never connected). */
  #detachedErrors = new CompiledErrorBoundary();

  /** Present only when the class carries a compiled Part Program. */
  #kernel?: CompiledElementKernel;

  constructor() {
    super();
    const ctor = this.constructor as CompiledStatics & { name?: string };
    const program = ctor.__partProgram;
    const properties = Array.isArray(ctor.__compiledProperties) ? ctor.__compiledProperties : [];

    // Signal-backed accessors live on the subclass prototype so generated
    // class field initializers can be reconciled at connect time.
    installAccessors(properties, Object.getPrototypeOf(this), facadeStates);

    const state = createFacadePropertyState(this, properties);
    facadeStates.set(this, state);

    if (!program) return;

    const rootMode: CompiledRootMode = program.root.kind === 'light'
      ? 'light'
      : program.root.kind === 'shadow-open'
      ? 'open'
      : 'closed';

    state.kernel = new CompiledElementKernel(this as unknown as HTMLElement, program, {
      signals: state.signals,
      handlers: bindProgramHandlers(this, ctor, program),
      refs: {},
      rootMode,
      delegatesFocus: ctor.delegatesFocus ?? false,
      styles: ctor.styles as never,
      formAssociated: ctor.formAssociated ?? false,
      errorBoundary: ctor.isErrorBoundary === true
        // The public ErrorBoundary owns the user-facing retry policy
        // (maxRetries field); the kernel service only tracks state, so its
        // own retry budget stays out of the way.
        ? { maxRetries: Number.MAX_SAFE_INTEGER }
        : undefined,
    });
    this.#kernel = state.kernel;
  }

  /**
   * The element-local error boundary service. Compiled instances delegate to
   * the kernel's service so connect-time capture and public ErrorBoundary
   * state agree; uncompiled instances (which never connect) get a detached
   * service so the protected surface stays usable pre-connect.
   */
  protected get _errors(): CompiledErrorBoundary {
    return this.#kernel?.errors ?? this.#detachedErrors;
  }

  /**
   * Returns an AbortSignal that is aborted when the element is disconnected.
   * Useful for tying async work (fetch, event listeners) to element lifecycle.
   */
  protected _lifecycleSignal(): AbortSignal {
    return this.#kernel?.lifecycle.signal ?? this.#detachedLifecycle.signal;
  }

  /**
   * setTimeout wrapper that auto-clears when the element disconnects.
   */
  protected _setTimeout(handler: TimerHandler, timeout?: number): number {
    return (this.#kernel?.lifecycle ?? this.#detachedLifecycle).setTimeout(handler, timeout);
  }

  /**
   * requestAnimationFrame wrapper that auto-cancels when the element disconnects.
   */
  protected _requestAnimationFrame(callback: FrameRequestCallback): number {
    return (this.#kernel?.lifecycle ?? this.#detachedLifecycle).requestAnimationFrame(callback);
  }

  /** Reactive route parameters. Updates automatically on SPA navigation. */
  get params(): Record<string, string> {
    return this.#params.value;
  }

  set params(value: Record<string, string>) {
    this.#params.value = value;
  }

  /** ElementInternals for form-associated custom elements. */
  protected get _internals(): ElementInternals | undefined {
    return this.#kernel?.form.internals;
  }

  /**
   * Lifecycle: called when the element is connected to the DOM.
   *
   * Fails closed (OE_PROGRAM_MISSING) when the class carries no compiled
   * Part Program. Otherwise syncs route params, reconciles property state
   * into the compiled signals (field initializers, then present attributes,
   * then pre-upgrade JS sets), and connects the kernel; the kernel claims
   * existing SSR DOM or creates fresh DOM from the program.
   */
  connectedCallback(): void {
    const kernel = this.#kernel;
    const state = facadeStates.get(this);
    if (!kernel || !state) failMissingProgram(this.constructor);
    this.#params.syncFromAttribute(this as unknown as HTMLElement);
    reconcileOwnProperties(this, state);
    syncAttributesToSignals(this, state);
    applyPendingOwnValues(state);

    const willClaim = this.#rootContent().childNodes.length > 0;
    kernel.connect();
    if (willClaim) {
      const root = kernel.root;
      if (root) replayPreUpgradeCaptures(root as unknown as Node);
      this.onDsdHydrated();
    } else {
      this.onCsrRendered();
    }
    this.clientActivate();
  }

  /** Root whose existing content decides claim-vs-fresh at connect time. */
  #rootContent(): { childNodes: ArrayLike<unknown> } {
    const kernel = this.#kernel;
    if (!kernel) return { childNodes: [] };
    const mode = kernel.program.root.kind;
    if (mode === 'light') return this as unknown as { childNodes: ArrayLike<unknown> };
    if (mode === 'shadow-open') {
      return (this.shadowRoot ?? { childNodes: [] }) as { childNodes: ArrayLike<unknown> };
    }
    return (kernel.root ?? { childNodes: [] }) as { childNodes: ArrayLike<unknown> };
  }

  /**
   * v0.23.0: Hook called after a successful claim of server-rendered DOM.
   *
   * Subclasses override this instead of relying on fragile
   * `super.connectedCallback()` call order. At this point the program's DOM
   * is claimed and Parts/Regions are live.
   *
   * No-op by default.
   */
  protected onDsdHydrated(): void {}

  /**
   * v0.23.0: Hook called after fresh client-side DOM creation completes.
   *
   * Subclasses override this for post-render initialization that depends on
   * the program's DOM being populated.
   *
   * No-op by default.
   */
  protected onCsrRendered(): void {}

  /**
   * v0.40.0: Client-side activation hook.
   *
   * Called once after the element is connected and the compiled program has
   * been claimed or created. This is the right place for framework hydration
   * (Preact, React, Vue, Lit) to take over from the compiled DOM.
   *
   * Default implementation is a no-op.
   */
  protected clientActivate(): void {
    // default no-op
  }

  /**
   * Lifecycle: called when the element is disconnected from the DOM.
   * Disposes the kernel activation (subscriptions, listeners, styles).
   */
  disconnectedCallback(): void {
    this.#kernel?.disconnect();
  }

  /** Lifecycle: called when the element is adopted into a new document. */
  adoptedCallback(): void {
    this.#kernel?.adopted();
  }

  /**
   * Lifecycle: called when an observed attribute changes.
   *
   * Routes the change into the compiled property contract (convert + write
   * through the accessor; removal restores the compiled default). Writes that
   * came from property reflection are ignored (loop guard).
   */
  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ): void {
    const state = facadeStates.get(this);
    if (!state || !this.#kernel) return;
    handleCompiledAttributeChange(this, state, name, newValue);
  }

  /** Platform form callback: the kernel owns ElementInternals. */
  formAssociatedCallback(_form: HTMLFormElement | null): void {
    // Subclass override point; kernel.form attached the internals at connect.
  }

  /** Platform form callback routed into the kernel form controller. */
  formResetCallback(): void {
    this.#kernel?.form.formResetCallback();
  }

  /** Platform form callback routed into the kernel form controller. */
  formStateRestoreCallback(state: File | string | FormData | null, mode: string): void {
    this.#kernel?.form.formStateRestoreCallback(state, mode);
  }

  /**
   * Read locale from JS property (set by SSR injection) first,
   * then HTML attribute, then fallback to provided default.
   *
   * @param fallback - Default value when neither source has a value. Defaults to 'en'.
   */
  protected _getLocale(fallback = 'en'): string {
    const prop = this.locale;
    if (typeof prop === 'string' && prop) return prop;
    return this.getAttribute('locale') || fallback;
  }
}
