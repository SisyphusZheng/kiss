/** DSD error classification, telemetry, and component construction. */
import type {
  DsdComponent,
  RenderError,
  RenderErrorCode,
  RenderHooks,
  RenderPhase,
} from '../protocol/render.ts';
import { createLogger } from './logger.ts';
import { formatError, RenderError as RenderErrorClass, reportError } from './errors.ts';

const log = createLogger('render-dsd');

export function classifyError(
  phase: RenderPhase,
  tagName: string,
  err: unknown,
  recoverable = false,
): RenderError {
  const message = formatError(err);
  return {
    code: codeForRenderError(phase, message),
    severity: recoverable ? 'warning' : 'error',
    phase,
    tagName,
    message,
    recoverable,
  };
}

// #922: OpenElementRedirect / OpenElementNotFound (app package) are protocol
// control flow, not render failures — a notFound() thrown from a page
// element's render() must reach the request-time handler so it can answer
// 404. Duck-typed here (same contract as app's isOpenElementRedirect /
// isOpenElementNotFound) to avoid an element → app dependency.
// Lookup table replaces a multi-branch error-code chain.
const ERROR_CODES: Record<string, RenderErrorCode> = {
  instantiate: 'OPEN_ELEMENT_RENDER_INSTANTIATE_FAILED',
  nested: 'OPEN_ELEMENT_RENDER_NESTED_FAILED',
  style: 'OPEN_ELEMENT_RENDER_STYLE_FAILED',
  serialize: 'OPEN_ELEMENT_RENDER_SERIALIZE_FAILED',
};

function codeForRenderError(phase: RenderPhase, message: string): RenderErrorCode {
  if (message.includes('Components must return a VNode')) {
    return 'OPEN_ELEMENT_RENDER_INVALID_OUTPUT';
  }
  return ERROR_CODES[phase] ?? 'OPEN_ELEMENT_RENDER_RENDER_FAILED';
}

/**
 * Route a classified render error to the onError hook (guarded like
 * beforeRender/afterRender) and to the error telemetry chain (#780), so
 * SSR render failures reach a configured setErrorTelemetryHook handler.
 */
export function dispatchRenderError(err: RenderError, hooks?: RenderHooks): void {
  if (hooks?.onError) {
    try {
      hooks.onError(err);
    } catch (e) {
      log.debug(`onError hook threw: ${formatError(e)}`);
    }
  }
  reportError(new RenderErrorClass(err.tagName, err.message, err.code, err.tagName));
}

// ─── Component Instantiation ───────────────────────────────────

export function instantiateComponent(
  tagName: string,
  componentClass: CustomElementConstructor,
): DsdComponent | null {
  try {
    const instance = new componentClass();
    if (!isDsdComponent(instance)) {
      log.error(`<${tagName}> does not implement render(): VNode | null.`);
      return null;
    }
    return instance;
  } catch (err) {
    const errMsg = formatError(err);
    log.error(`Failed to instantiate <${tagName}>: ${errMsg}`);
    return null;
  }
}

function isDsdComponent(value: unknown): value is DsdComponent {
  if (value === null || typeof value !== 'object') return false;
  return typeof Reflect.get(value, 'render') === 'function';
}

// ─── DSD Template Attributes ───────────────────────────────────
