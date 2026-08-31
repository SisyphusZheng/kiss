/**
 * Server execution for the alpha.3 compiled Part Program.
 *
 * The serializer is a pure projection of one validated program and one host
 * snapshot. It never subscribes, creates a DOM, discovers bindings, or invokes
 * component code. `serializeCompiledProgram()` is the host-shaped server
 * artifact; `serializeProgramContent()` is the same artifact's root content and
 * matches the alpha.0 seed serializer's inner-output contract.
 */

import {
  partAnchorEndMarker,
  partAnchorMarker,
  type PartProgramSpike,
  type SpikeEachPart,
  type SpikeElementNode,
  type SpikeTreeNode,
  type SpikeWhenPart,
  STATIC_STYLES_MARKER,
} from '../program.ts';
import {
  assertCompiledProgram,
  attributeNameIsSafe,
  attributeValueOf,
  classValueOf,
  CompiledProgramValidationError,
  isRecordValue,
  signalOf,
  styleValueOf,
  voidElement,
} from './shared.ts';

export type { CompiledProgramHost, CompiledSignalLike } from './shared.ts';
export { assertCompiledProgram, CompiledProgramValidationError } from './shared.ts';

export type CompiledRootMode = 'light' | 'open' | 'closed';

export interface CompiledDsdOptions {
  delegatesFocus?: boolean;
  clonable?: boolean;
  serializable?: boolean;
  slotAssignment?: 'named' | 'manual';
  customElementRegistry?: boolean;
}

export type CompiledHostAttribute = readonly [name: string, value: unknown];

// The serializer emits the component's static styles as the first child of
// the DSD template (legacy renderDsd parity): never-upgrading hosts (pages)
// need their styles in the SSR payload. The claim path skips exactly this
// marked element; the client style scope still adopts the live sheets.
export { STATIC_STYLES_MARKER } from '../program.ts';

export interface CompiledServerOptions {
  /** Root ownership mode. Shadow modes become a native DSD template. */
  mode?: CompiledRootMode;
  /** Host attributes emitted in caller-provided order. */
  hostAttrs?: readonly CompiledHostAttribute[] | Record<string, unknown>;
  /** Native DSD template flags for open/closed roots. */
  dsd?: CompiledDsdOptions;
  /**
   * Static component CSS (collected from the class's `styles` static by the
   * caller). Emitted verbatim as one marked <style> element — the content is
   * authored CSS, so a `</style` sequence fails closed instead of escaping
   * into markup injection.
   */
  styleCss?: string;
}

const PROPERTY_PATH_SEPARATOR = '.';

interface SerializeContext {
  readonly program: PartProgramSpike;
  readonly host: unknown;
  readonly propPartsByPath: Map<string, Array<{ name: string; signal: string }>>;
  /** attr/bool/class/style sinks keyed by template path (part-index order). */
  readonly valueSinksByPath: Map<
    string,
    Array<{
      k: 'attr' | 'bool' | 'class' | 'style';
      signal: string;
      name?: string;
    }>
  >;
  /** html content sinks keyed by template path. */
  readonly htmlSinksByPath: Map<string, { signal: string }>;
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&#39;');
}

function pathKey(path: readonly number[]): string {
  return path.join(PROPERTY_PATH_SEPARATOR);
}

function createSerializeContext(program: PartProgramSpike, host: unknown): SerializeContext {
  const propPartsByPath = new Map<string, Array<{ name: string; signal: string }>>();
  const valueSinksByPath = new Map<
    string,
    Array<{ k: 'attr' | 'bool' | 'class' | 'style'; signal: string; name?: string }>
  >();
  const htmlSinksByPath = new Map<string, { signal: string }>();
  for (const part of program.parts) {
    if (part.k === 'prop') {
      const key = pathKey(part.path);
      const parts = propPartsByPath.get(key) ?? [];
      parts.push(part);
      propPartsByPath.set(key, parts);
      continue;
    }
    if (
      part.k === 'attr' || part.k === 'bool' || part.k === 'class' || part.k === 'style'
    ) {
      const key = pathKey(part.path);
      const sinks = valueSinksByPath.get(key) ?? [];
      sinks.push(
        part.k === 'attr' || part.k === 'bool'
          ? { k: part.k, signal: part.signal, name: part.name }
          : { k: part.k, signal: part.signal },
      );
      valueSinksByPath.set(key, sinks);
      continue;
    }
    if (part.k === 'html') {
      htmlSinksByPath.set(pathKey(part.path), { signal: part.signal });
    }
  }
  return { program, host, propPartsByPath, valueSinksByPath, htmlSinksByPath };
}

function serializeAttribute(name: string, value: string): string {
  return ` ${name}="${escapeAttribute(value)}"`;
}

function serializeHostAttributes(
  raw: CompiledServerOptions['hostAttrs'],
  mode: CompiledRootMode,
): string {
  let pairs: Array<CompiledHostAttribute>;
  if (Array.isArray(raw)) {
    pairs = raw.map((pair, index) => {
      if (!Array.isArray(pair) || pair.length !== 2) {
        throw new CompiledProgramValidationError(
          `hostAttrs[${index}]`,
          'host attributes must be [name, value] pairs',
        );
      }
      const name: unknown = pair[0];
      if (typeof name !== 'string') {
        throw new CompiledProgramValidationError(
          `hostAttrs[${index}]`,
          'host attribute name must be a string',
        );
      }
      const value: unknown = pair[1];
      return [name, value] as CompiledHostAttribute;
    });
  } else if (raw && typeof raw === 'object') {
    pairs = Object.entries(raw);
  } else {
    pairs = [];
  }
  const seen = new Set<string>();
  let result = '';
  for (const [name, value] of pairs) {
    if (typeof name !== 'string' || !attributeNameIsSafe(name)) {
      throw new CompiledProgramValidationError(
        'hostAttrs',
        `unsafe attribute name ${String(name)}`,
      );
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      throw new CompiledProgramValidationError(
        'hostAttrs',
        `duplicate attribute ${JSON.stringify(name)}`,
      );
    }
    seen.add(key);
    if (value === false || value === null || value === undefined) continue;
    if (value === true) {
      result += ` ${name}`;
      continue;
    }
    result += serializeAttribute(name, String(value));
  }
  if (mode === 'light') {
    if (seen.has('data-oe-light')) {
      throw new CompiledProgramValidationError(
        'hostAttrs',
        'data-oe-light is generated by light-root serialization',
      );
    }
    result += ' data-oe-light';
  }
  return result;
}

function serializeDsdAttributes(options: CompiledDsdOptions | undefined): string {
  if (!options) return '';
  const booleans = ['delegatesFocus', 'clonable', 'serializable', 'customElementRegistry'] as const;
  for (const key of booleans) {
    if (options[key] !== undefined && typeof options[key] !== 'boolean') {
      throw new CompiledProgramValidationError(`dsd.${key}`, 'DSD option must be boolean');
    }
  }
  if (
    options.slotAssignment !== undefined && options.slotAssignment !== 'named' &&
    options.slotAssignment !== 'manual'
  ) {
    throw new CompiledProgramValidationError(
      'dsd.slotAssignment',
      'DSD slotAssignment must be "named" or "manual"',
    );
  }
  const parts: string[] = [];
  if (options.delegatesFocus) parts.push(' shadowrootdelegatesfocus');
  if (options.clonable) parts.push(' shadowrootclonable');
  if (options.serializable) parts.push(' shadowrootserializable');
  if (options.slotAssignment === 'manual') parts.push(' shadowrootslotassignment="manual"');
  if (options.customElementRegistry) parts.push(' shadowrootcustomelementregistry');
  return parts.join('');
}

/** Item fields referenced by an each Region's template (ival + iattr slots). */
function itemTemplateFields(nodes: readonly SpikeTreeNode[], out = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (node.k === 'ival') {
      if (node.field !== undefined) out.add(node.field);
      continue;
    }
    if (node.k === 'el') {
      for (const [, field] of node.iattrs ?? []) out.add(field);
      itemTemplateFields(node.children, out);
    }
  }
  return out;
}

function itemsFor(
  ctx: SerializeContext,
  part: SpikeEachPart,
): Array<Record<string, unknown>> {
  if (part.key === undefined) {
    throw new CompiledProgramValidationError(
      `parts[${part.index}]`,
      'each Region needs key',
    );
  }
  const keyField = part.key;
  const requiredFields = itemTemplateFields(part.item);
  const value = signalOf(ctx.host, part.signal).value;
  if (!Array.isArray(value)) {
    throw new CompiledProgramValidationError(
      `parts[${part.index}].signal`,
      'each Region dependency must contain an array',
    );
  }
  const seen = new Set<string>();
  const items: Array<Record<string, unknown>> = [];
  value.forEach((item, ordinal) => {
    if (!isRecordValue(item)) {
      throw new CompiledProgramValidationError(
        `parts[${part.index}].signal[${ordinal}]`,
        'each Region items must be records',
      );
    }
    if (!Object.prototype.hasOwnProperty.call(item, keyField)) {
      throw new CompiledProgramValidationError(
        `parts[${part.index}].signal[${ordinal}]`,
        `each Region item needs ${JSON.stringify(keyField)}`,
      );
    }
    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(item, field)) {
        throw new CompiledProgramValidationError(
          `parts[${part.index}].signal[${ordinal}]`,
          `each Region item needs ${JSON.stringify(field)}`,
        );
      }
    }
    const key = String(item[keyField]);
    if (seen.has(key)) {
      throw new CompiledProgramValidationError(
        `parts[${part.index}].signal`,
        `duplicate each Region key ${JSON.stringify(key)}`,
      );
    }
    seen.add(key);
    items.push(item);
  });
  return items;
}

function whenIsActive(
  part: SpikeWhenPart,
  value: unknown,
): boolean {
  try {
    return Number(value) > part.gt;
  } catch {
    throw new CompiledProgramValidationError(
      `parts[${part.index}].signal`,
      'conditional dependency cannot be converted to a number',
    );
  }
}

/** Serialize one per-item attribute slot value with host-attribute semantics. */
function serializeItemAttribute(value: unknown): string | null {
  if (value === true) return '';
  if (value === false || value === null || value === undefined) return null;
  return String(value);
}

function serializeItemNodes(
  nodes: SpikeTreeNode[],
  part: SpikeEachPart,
  item: Record<string, unknown>,
): string {
  return nodes.map((node) => {
    if (node.k === 'ival') {
      const field = node.field ?? part.field;
      if (field === undefined) {
        throw new CompiledProgramValidationError(
          `parts[${part.index}].item`,
          'item value slot needs a field',
        );
      }
      return escapeText(String(item[field]));
    }
    if (node.k === 'text') return escapeText(node.value);
    if (node.k === 'el') {
      const attrs = node.attrs.map(([name, value]) => serializeAttribute(name, value));
      for (const [name, field] of node.iattrs ?? []) {
        const serialized = serializeItemAttribute(item[field]);
        if (serialized === null) continue;
        attrs.push(serialized === '' ? ` ${name}` : serializeAttribute(name, serialized));
      }
      if (voidElement(node.tag)) return `<${node.tag}${attrs.join('')}>`;
      return `<${node.tag}${attrs.join('')}>${
        serializeItemNodes(node.children, part, item)
      }</${node.tag}>`;
    }
    throw new CompiledProgramValidationError(
      `parts[${part.index}].item`,
      'item templates may not contain Part anchors',
    );
  }).join('');
}

function serializeElement(
  ctx: SerializeContext,
  node: SpikeElementNode,
  programPath: readonly number[],
): string {
  const attrs = node.attrs.map(([name, value]) => serializeAttribute(name, value));
  const key = pathKey(programPath);
  for (const sink of ctx.valueSinksByPath.get(key) ?? []) {
    const value = signalOf(ctx.host, sink.signal).value;
    if (sink.k === 'attr') {
      const serialized = attributeValueOf(value);
      if (serialized !== null) attrs.push(serializeAttribute(sink.name!, serialized));
      continue;
    }
    if (sink.k === 'bool') {
      if (value) attrs.push(` ${sink.name!}`);
      continue;
    }
    if (sink.k === 'class') {
      const serialized = classValueOf(value);
      if (serialized !== '') attrs.push(serializeAttribute('class', serialized));
      continue;
    }
    const serialized = styleValueOf(value);
    if (serialized !== '') attrs.push(serializeAttribute('style', serialized));
  }
  for (const part of ctx.propPartsByPath.get(key) ?? []) {
    const value = signalOf(ctx.host, part.signal).value;
    let serialized: string;
    if (node.tag.includes('-') && typeof value !== 'string') {
      try {
        const encoded = JSON.stringify(value);
        if (encoded === undefined) {
          throw new TypeError('value has no JSON representation');
        }
        serialized = encoded;
      } catch (error) {
        throw new CompiledProgramValidationError(
          `template[${programPath.join('][')}].${part.name}`,
          `custom-element property value must be JSON-serializable (${String(error)})`,
        );
      }
    } else {
      serialized = String(value);
    }
    attrs.push(serializeAttribute(part.name, serialized));
  }
  const open = `<${node.tag}${attrs.join('')}`;
  if (voidElement(node.tag)) return `${open}>`;
  const htmlSink = ctx.htmlSinksByPath.get(key);
  if (htmlSink) {
    // Trusted-HTML sink: the value must be pre-sanitized build-time content;
    // it replaces the element's (compiler-guaranteed empty) content verbatim.
    const value = signalOf(ctx.host, htmlSink.signal).value;
    if (typeof value !== 'string') {
      throw new CompiledProgramValidationError(
        `template[${programPath.join('][')}]`,
        'html sink value must be a string',
      );
    }
    return `${open}>${value}</${node.tag}>`;
  }
  return `${open}>${serializeNodes(ctx, node.children, programPath)}</${node.tag}>`;
}

function serializeNodes(
  ctx: SerializeContext,
  nodes: SpikeTreeNode[],
  parentPath: readonly number[],
): string {
  return nodes.map((node, index) => {
    const nodePath = [...parentPath, index];
    if (node.k === 'text') return escapeText(node.value);
    if (node.k === 'el') return serializeElement(ctx, node, nodePath);
    if (node.k === 'ival') {
      throw new CompiledProgramValidationError(
        'template',
        'item value slot is outside an each Region',
      );
    }
    const part = ctx.program.parts[node.index];
    const start = `<!--${partAnchorMarker(part.index)}-->`;
    if (part.k === 'text') {
      return `${start}${escapeText(String(signalOf(ctx.host, part.signal).value))}`;
    }
    if (part.k === 'when') {
      const value = signalOf(ctx.host, part.signal).value;
      const active = whenIsActive(part, value);
      const branch = active ? part.on : part.off;
      const end = `<!--${partAnchorEndMarker(part.index)}-->`;
      return `${start}${serializeNodes(ctx, branch, [])}${end}`;
    }
    if (part.k === 'each') {
      const end = `<!--${partAnchorEndMarker(part.index)}-->`;
      return `${start}${
        itemsFor(ctx, part).map((item) => serializeItemNodes(part.item, part, item)).join('')
      }${end}`;
    }
    throw new CompiledProgramValidationError(
      `template${nodePath.map((value) => `[${value}]`).join('')}`,
      `Part ${node.index} does not own a serializable anchor`,
    );
  }).join('');
}

function snapshotProgram(
  raw: unknown,
  host: unknown,
): { program: PartProgramSpike; ctx: SerializeContext } {
  const program = assertCompiledProgram(raw);
  // The host is intentionally checked lazily by signalOf so static-only
  // programs remain server-only and need no client signal artifact.
  return { program, ctx: createSerializeContext(program, host) };
}

/** Serialize only the program-owned root content, with deterministic markers. */
export function serializeProgramContent(raw: unknown, host: unknown): string {
  const { program, ctx } = snapshotProgram(raw, host);
  return serializeNodes(ctx, program.template, []);
}

/**
 * Serialize a compiled element host in light, open-DSD, or closed-DSD mode.
 * Light mode emits the existing provenance marker; closed mode remains a real
 * `shadowrootmode="closed"` root and is never treated as light DOM.
 */
export function serializeCompiledProgram(
  raw: unknown,
  host: unknown,
  options: CompiledServerOptions = {},
): string {
  const { program, ctx } = snapshotProgram(raw, host);
  const mode = options.mode ?? 'open';
  if (mode !== 'light' && mode !== 'open' && mode !== 'closed') {
    throw new CompiledProgramValidationError(
      'mode',
      `unsupported compiled root mode ${JSON.stringify(mode)}`,
    );
  }
  const content = serializeNodes(ctx, program.template, []);
  const hostAttrs = serializeHostAttributes(options.hostAttrs, mode);
  const styleCss = options.styleCss ?? '';
  if (/<\/style/i.test(styleCss)) {
    throw new CompiledProgramValidationError(
      'styleCss',
      'static component CSS may not contain "</style"',
    );
  }
  const styleElement = styleCss ? `<style ${STATIC_STYLES_MARKER}>${styleCss}</style>` : '';
  if (mode === 'light') {
    return `<${program.tag}${hostAttrs}>${styleElement}${content}</${program.tag}>`;
  }
  const dsdAttrs = serializeDsdAttributes(options.dsd);
  return `<${program.tag}${hostAttrs}><template shadowrootmode="${mode}"${dsdAttrs}>${styleElement}${content}</template></${program.tag}>`;
}

/**
 * Seed-compatible name: without options this returns only root content; with
 * root options it emits the complete compiled host artifact.
 */
export function serializeToHtml(
  raw: unknown,
  host: unknown,
  options?: CompiledServerOptions,
): string {
  return options === undefined
    ? serializeProgramContent(raw, host)
    : serializeCompiledProgram(raw, host, options);
}

/** Canonical explicit alias used by generated server adapters. */
export const serializePartProgram = serializeCompiledProgram;
