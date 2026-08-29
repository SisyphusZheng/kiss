/**
 * Deliberate root-facade implementation boundary. Not a package subpath.
 *
 * v0.44: this facade re-exports only modules that survived the compiled
 * Part Program reentry. The legacy VNode renderer, runtime JSX factories,
 * hydration-scope runtime, island registration and client-runtime helpers
 * were removed; the server-render entry (`renderDsd`) and the pre-upgrade
 * capture bootstrap are reimplemented over the compiled serializer and the
 * compiled claim capture/replay seam.
 */
import { serializeCompiledProgram } from './internal/compiled/server/index.ts';
import type {
  CompiledElementMetadata,
  CompiledPropertyMetadata,
  PartProgram,
} from './internal/compiled/program.ts';
import { OpenElementError } from './internal/core/errors.ts';
import { signal } from './internal/signal/index.ts';
import type { CompiledProgramHost } from './internal/compiled/server/index.ts';
import type { RenderOutput } from './internal/protocol/render.ts';

export { collectPublicProps } from './internal/core/props-utils.ts';
export type { RenderOutput, SsrAdmissionDecision } from './internal/protocol/render.ts';
export { consumeContext, createContext, provideContext } from './internal/core/index.ts';
export type { Context, RenderError } from './internal/core/index.ts';
export { assertValidTagName, isValidTagName } from './internal/core/tag-utils.ts';
export { ERROR_PREFIX } from './internal/protocol/errors.ts';
export {
  formatError,
  OpenElementError,
  reportError,
  setErrorTelemetryHook,
} from './internal/core/errors.ts';
export type { ErrorTelemetryHook } from './internal/protocol/errors.ts';
export { computed, effect, signal } from './internal/signal/index.ts';
export type { Signal } from './internal/protocol/signal.ts';
export { isSafeAttributeName } from './internal/core/security.ts';
export { escapeAttr, escapeHtml } from './internal/core/html-escape.ts';
export type { IslandOptions } from './internal/protocol/island.ts';
export { DATA_SSR_PROPS } from './internal/protocol/hydration-markers.ts';
export { StyleSheet } from './internal/core/style-sheet.ts';
export { createLogger } from './internal/core/logger.ts';
export type { StyleSheetLike } from './internal/protocol/style-sheet.ts';
export { deepGetElementById, ensureDeepFragmentNavigation } from './internal/core/deep-fragment.ts';
export { ensurePreHydrationClickCapture } from './open-element-implementation.ts';

// ─── Server-render entry (compiled serializer) ─────────────────────

/** Compiled class statics consumed by the server-render entry. */
interface CompiledComponentConstructor extends CustomElementConstructor {
  __partProgram?: PartProgram;
  __compiledProperties?: CompiledPropertyMetadata[];
  __elementMetadata?: CompiledElementMetadata;
}

export interface RenderDsdOptions {
  componentClass?: CustomElementConstructor;
  props?: Record<string, unknown>;
  sourceInfo?: { route?: string; source?: string };
}

function classNameOf(ctor: object): string {
  return (ctor as { name?: string }).name ?? 'anonymous';
}

function failUncompiled(ctor: object, tag: string): never {
  throw new OpenElementError(
    `[openElement] <${tag}> (${classNameOf(ctor)}) has no compiled Part Program. ` +
      'renderDsd only serializes classes produced by the 0.44 compiler ' +
      '(@openelement/adapter-vite open:compiled-element transform).',
    { code: 'OE_PROGRAM_MISSING', phase: 'ssr' },
  );
}

/** Serialize one compiled property value for a host attribute. */
function serializePropertyValue(record: CompiledPropertyMetadata, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (record.type === 'boolean') return value ? '' : null;
  if (record.type === 'array' || record.type === 'object') return JSON.stringify(value);
  return String(value);
}

/** Coerce a JS-side prop value per the compiled converter record. */
function coerceServerProp(record: CompiledPropertyMetadata, value: unknown): unknown {
  if (value === null || value === undefined) return record.default;
  switch (record.converter) {
    case 'boolean':
      return Boolean(value);
    case 'number': {
      if (typeof value === 'number') return value;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    case 'array':
      if (Array.isArray(value)) return value;
      return parseJsonProp(record, String(value));
    case 'object':
      if (typeof value === 'object') return value;
      return parseJsonProp(record, String(value));
    default:
      return typeof value === 'string' ? value : String(value);
  }
}

function parseJsonProp(record: CompiledPropertyMetadata, raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return record.default;
  }
}

/**
 * Server-render one compiled element to deterministic HTML.
 *
 * Generated server entries call this with the tag and its compiled class; the
 * class's `__partProgram`/metadata statics drive the serializer. Initial
 * signal values come from `props` (coerced per the compiled converters),
 * falling back to the compiled defaults. Attribute-backed properties whose
 * serialized value differs from the compiled default are emitted as host
 * attributes so the client claim rebuilds the same signal state. The root
 * mode comes from `program.root.kind` (light content vs. DSD open/closed).
 *
 * Fails closed with `OE_PROGRAM_MISSING` for unregistered or uncompiled
 * classes — there is no runtime JSX fallback renderer in 0.44.
 */
export function renderDsd(
  input: string | CustomElementConstructor,
  options: RenderDsdOptions = {},
): RenderOutput {
  const resolvedClass = (options.componentClass ??
    (typeof input === 'string'
      ? (typeof customElements !== 'undefined' ? customElements.get(input) : undefined)
      : input)) as CompiledComponentConstructor | undefined;
  if (!resolvedClass) {
    throw new OpenElementError(
      `[openElement] renderDsd(${
        typeof input === 'string' ? JSON.stringify(input) : 'class'
      }) found no compiled class: pass options.componentClass or register the tag. ` +
        'The 0.44 serializer reads the compiled statics from the class and fails ' +
        'closed for unregistered components.',
      { code: 'OE_PROGRAM_MISSING', phase: 'ssr' },
    );
  }
  const program = resolvedClass.__partProgram;
  if (!program) failUncompiled(resolvedClass, typeof input === 'string' ? input : '<unknown>');
  const tag = program.tag;
  if (typeof input === 'string' && input !== tag) {
    throw new OpenElementError(
      `[openElement] renderDsd tag "${input}" does not match the compiled program tag "${tag}".`,
      { code: 'OE_PROGRAM_MISSING', phase: 'ssr' },
    );
  }

  const properties = Array.isArray(resolvedClass.__compiledProperties)
    ? resolvedClass.__compiledProperties
    : program.metadata.properties;
  const props = options.props ?? {};

  const signals: Record<string, ReturnType<typeof signal>> = {};
  const hostAttrs: Array<readonly [string, unknown]> = [];
  for (const record of properties) {
    const value = record.name in props
      ? coerceServerProp(record, props[record.name])
      : record.default;
    signals[record.name] = signal(value);
    if (record.attribute !== null) {
      const serialized = serializePropertyValue(record, value);
      if (serialized !== serializePropertyValue(record, record.default) && serialized !== null) {
        hostAttrs.push([record.attribute, serialized] as const);
      }
    }
  }

  const mode = program.root.kind === 'light'
    ? 'light'
    : program.root.kind === 'shadow-open'
    ? 'open'
    : 'closed';
  const host: CompiledProgramHost = { signals, handlers: {} };
  const html = serializeCompiledProgram(program, host, { mode, hostAttrs });

  return {
    html,
    errors: [],
    metrics: {
      tagName: tag,
      renderTimeMs: 0,
      templateSize: html.length,
      layer: mode === 'light' ? 'light-dom' : 'dsd-interactive',
      hasError: false,
      nestingDepth: 0,
    },
    hydrationHints: [],
  };
}
