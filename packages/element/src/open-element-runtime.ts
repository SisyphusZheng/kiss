import {
  flushPendingClicks,
  type HydrationScope,
  markSelfHydrated,
} from './internal/core/index.ts';
import { hasPopulatedShadowRoot } from './internal/core/dsd-shadow-root.ts';
import { formatError } from './internal/core/errors.ts';
import { createLogger } from './internal/core/logger.ts';
import {
  disposeStaticProps,
  initializeStaticProps,
  syncStaticPropsFromAttributes,
} from './internal/core/prop.ts';
import type { Signal } from './internal/protocol/signal.ts';
import type { StyleSheetLike } from './internal/protocol/style-sheet.ts';
import type { VNode } from './internal/protocol/vnode.ts';
import { attachFormInternals } from './open-element-form.ts';
import type { ElementLifecycle } from './open-element-lifecycle.ts';
import type { ElementParams } from './open-element-params.ts';
import {
  findErrorBoundaryHost,
  renderErrorFallback,
  renderIntoLightDom,
  renderIntoShadowRoot,
} from './open-element-render.ts';
import { themeManager } from './open-element-styles.ts';

export interface OpenElementRuntimeHost extends HTMLElement {
  render(): VNode | null;
  createRenderRoot(): ShadowRoot | HTMLElement;
  signalRegistry: Map<string, Signal<unknown>>;
  clientActivate(): void;
  onCsrRendered(): void;
  onDsdHydrated(): void;
  onRenderError(error: unknown): VNode | null;
  _hydrateExistingDom(): void;
  _internals?: ElementInternals;
}

interface RuntimeConstructor {
  renderMode?: 'shadow' | 'light';
  styles?: StyleSheetLike | StyleSheetLike[];
  formAssociated?: boolean;
}

export function connectOpenElement(
  host: OpenElementRuntimeHost,
  params: ElementParams,
): void {
  const ctor = host.constructor as RuntimeConstructor;
  initializeStaticProps(host);
  syncStaticPropsFromAttributes(host);

  const lightDom = ctor.renderMode === 'light';
  if (!host.shadowRoot && !lightDom) host.createRenderRoot();
  else if (host.shadowRoot) themeManager.applyStyles(host.shadowRoot, ctor.styles);

  themeManager.connect(host);
  params.syncFromAttribute(host);
  renderOrHydrateOpenElement(host);
  host.clientActivate();
  host._internals = attachFormInternals(host, ctor);
}

export function renderOrHydrateOpenElement(host: OpenElementRuntimeHost): void {
  try {
    const ctor = host.constructor as RuntimeConstructor;
    if (ctor.renderMode === 'light') {
      renderIntoLightDom(host, hostScope(host));
      markHydrated(host);
      host.onCsrRendered();
      return;
    }

    if (hasPopulatedShadowRoot(host)) {
      host._hydrateExistingDom();
      markHydrated(host);
      host.onDsdHydrated();
    } else if (host.shadowRoot) {
      renderIntoShadowRoot(host, hostScope(host));
      markHydrated(host);
      host.onCsrRendered();
    }
  } catch (error) {
    renderOpenElementError(host, error);
  }
}

function markHydrated(host: OpenElementRuntimeHost): void {
  markSelfHydrated(host);
  flushPendingClicks(host);
}

export function renderOpenElementError(host: OpenElementRuntimeHost, error: unknown): void {
  const boundary = findErrorBoundaryHost(host);
  if (boundary) {
    createLogger('dsd').error(
      `<${host.tagName.toLowerCase()}> render/hydrate failed: ${formatError(error)} ` +
        '— captured by nearest error boundary',
    );
    boundary.catchError(error instanceof Error ? error : new Error(formatError(error)), host);
    return;
  }
  renderErrorFallback(host, error, hostScope(host), (caught) => host.onRenderError(caught));
}

export function updateOpenElement(host: OpenElementRuntimeHost): void {
  try {
    const ctor = host.constructor as RuntimeConstructor;
    if (ctor.renderMode === 'light') renderIntoLightDom(host, hostScope(host));
    else renderIntoShadowRoot(host, hostScope(host));
  } catch (error) {
    renderOpenElementError(host, error);
  }
}

export function disconnectOpenElement(
  host: OpenElementRuntimeHost,
  scope: HydrationScope,
  lifecycle: ElementLifecycle,
): void {
  scope.dispose();
  disposeStaticProps(host);
  lifecycle.dispose();
  themeManager.disconnect(host);
}

// The scope stays privately owned by OpenElement; this symbol-backed bridge
// lets the runtime collaborator use it without widening the public API.
const scopeByHost = new WeakMap<OpenElementRuntimeHost, HydrationScope>();

export function registerOpenElementScope(
  host: OpenElementRuntimeHost,
  scope: HydrationScope,
): void {
  scopeByHost.set(host, scope);
}

function hostScope(host: OpenElementRuntimeHost): HydrationScope {
  const scope = scopeByHost.get(host);
  if (!scope) throw new Error('OpenElement hydration scope is not initialized');
  return scope;
}
