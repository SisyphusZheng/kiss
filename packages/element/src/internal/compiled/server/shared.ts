/**
 * Shared validation and host access for the alpha.3 server and claim modes.
 *
 * This module deliberately consumes the serialized Part Program shape from the
 * alpha.0 seed. It owns no DOM discovery and performs no rendering fallback:
 * malformed programs and unsafe values are rejected before either execution
 * mode can produce or attach to output.
 */

import {
  type PartProgramSpike,
  type SpikePart,
  type SpikeTreeNode,
  validateSpikeProgram,
} from '../program.ts';

export interface CompiledSignalLike<T = unknown> {
  readonly value: T;
  subscribe(fn: (value: T) => void): () => void;
}

/** Host state consumed by compiled execution modes. */
export interface CompiledProgramHost {
  signals: Record<string, CompiledSignalLike<unknown>>;
  handlers?: Record<string, (event: unknown) => void>;
}

export class CompiledProgramValidationError extends Error {
  readonly code = 'OPEN_ELEMENT_COMPILED_PROGRAM_INVALID';
  readonly path: string;

  constructor(path: string, message: string) {
    super(`[compiled-program] ${path}: ${message}`);
    this.name = 'CompiledProgramValidationError';
    this.path = path;
  }
}

const HTML_TAG_RE = /^[a-z][a-z0-9._:-]*$/;
const ATTRIBUTE_NAME_RE = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/;
const EVENT_NAME_RE = /^[a-z][a-z0-9:.-]*$/;
const FORBIDDEN_ATTRIBUTE_NAMES = new Set(['srcdoc']);
const RAW_TEXT_TAGS = new Set(['script', 'style']);
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function fail(path: string, message: string): never {
  throw new CompiledProgramValidationError(path, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateTag(tag: string, path: string): void {
  if (!HTML_TAG_RE.test(tag)) fail(path, `unsafe element tag ${JSON.stringify(tag)}`);
  if (RAW_TEXT_TAGS.has(tag)) {
    fail(path, `raw-text element <${tag}> is outside the compiled Part Program grammar`);
  }
}

function validateAttributeName(name: string, path: string): void {
  if (!ATTRIBUTE_NAME_RE.test(name)) fail(path, `unsafe attribute name ${JSON.stringify(name)}`);
  const lower = name.toLowerCase();
  if (lower.startsWith('on') || FORBIDDEN_ATTRIBUTE_NAMES.has(lower)) {
    fail(path, `event or executable attribute ${JSON.stringify(name)} is not supported`);
  }
}

function validateAttributes(
  attrs: Array<[string, string]>,
  path: string,
  seen = new Set<string>(),
): void {
  attrs.forEach(([name, value], index) => {
    const attrPath = `${path}[${index}]`;
    validateAttributeName(name, `${attrPath}.name`);
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) fail(attrPath, `duplicate attribute ${JSON.stringify(name)}`);
    seen.add(normalized);
    if (typeof value !== 'string') fail(`${attrPath}.value`, 'attribute value must be a string');
  });
}

function validateStaticNodes(
  nodes: SpikeTreeNode[],
  path: string,
  allowItemValue: boolean,
  allowAnchors = false,
): void {
  nodes.forEach((node, index) => {
    const nodePath = `${path}[${index}]`;
    if (node.k === 'text') {
      if (typeof node.value !== 'string') fail(nodePath, 'text value must be a string');
      return;
    }
    if (node.k === 'ival') {
      if (!allowItemValue) fail(nodePath, 'item value slot is outside an each Region');
      return;
    }
    if (node.k === 'part') {
      if (!allowAnchors) fail(nodePath, 'Part anchor is outside the compiled template');
      if (!Number.isInteger(node.index) || node.index < 0) {
        fail(nodePath, 'Part anchor needs a non-negative integer index');
      }
      return;
    }
    if (node.k !== 'el') {
      fail(nodePath, 'unsupported node kind');
    }
    validateTag(node.tag, `${nodePath}.tag`);
    validateAttributes(node.attrs, `${nodePath}.attrs`);
    if (VOID_TAGS.has(node.tag) && node.children.length > 0) {
      fail(nodePath, `void element <${node.tag}> may not have children`);
    }
    validateStaticNodes(node.children, `${nodePath}.children`, allowItemValue, allowAnchors);
  });
}

function validatePart(part: SpikePart, index: number): void {
  const path = `parts[${index}]`;
  if (part.index !== index) fail(path, `index must equal its position (${index})`);
  switch (part.k) {
    case 'text':
      if (!part.signal) fail(path, 'text Part needs a non-empty signal name');
      return;
    case 'prop':
      if (!part.signal || !part.name) fail(path, 'property Part needs signal and name');
      validateAttributeName(part.name, `${path}.name`);
      if (
        part.path.length === 0 ||
        part.path.some((value) => !Number.isInteger(value) || value < 0)
      ) {
        fail(`${path}.path`, 'property Part path must contain non-negative child indices');
      }
      return;
    case 'event':
      if (!part.event || !EVENT_NAME_RE.test(part.event)) {
        fail(`${path}.event`, `unsupported event name ${JSON.stringify(part.event)}`);
      }
      if (!part.handler) fail(path, 'event Part needs a non-empty handler name');
      if (
        part.path.length === 0 ||
        part.path.some((value) => !Number.isInteger(value) || value < 0)
      ) {
        fail(`${path}.path`, 'event Part path must contain non-negative child indices');
      }
      return;
    case 'when':
      if (!part.signal) fail(path, 'conditional Region needs a non-empty signal name');
      if (!Number.isFinite(part.gt)) fail(`${path}.gt`, 'threshold must be finite');
      validateStaticNodes(part.on, `${path}.on`, false);
      validateStaticNodes(part.off, `${path}.off`, false);
      return;
    case 'each':
      if (!part.signal || !part.key || !part.field) {
        fail(path, 'list Region needs signal, key and field names');
      }
      validateStaticNodes(part.item, `${path}.item`, true);
      return;
    default:
      fail(path, 'unsupported Part kind');
  }
}

function resolveTemplateNode(
  program: PartProgramSpike,
  path: number[],
  where: string,
): SpikeTreeNode {
  let nodes = program.template;
  let node: SpikeTreeNode | undefined;
  path.forEach((index, depth) => {
    node = nodes[index];
    if (!node) fail(where, `path [${path.join(',')}] is unresolved at depth ${depth}`);
    if (node.k !== 'el' && depth < path.length - 1) {
      fail(where, `path [${path.join(',')}] crosses a non-element node`);
    }
    nodes = node.k === 'el' ? node.children : [];
  });
  if (!node) fail(where, `path [${path.join(',')}] is empty`);
  return node;
}

function validateLocations(program: PartProgramSpike): void {
  const anchorCounts = new Map<number, number>();
  const walkAnchors = (nodes: SpikeTreeNode[], path: string): void => {
    nodes.forEach((node, index) => {
      const nodePath = `${path}[${index}]`;
      if (node.k === 'el') {
        walkAnchors(node.children, `${nodePath}.children`);
        return;
      }
      if (node.k !== 'part') return;
      if (!Number.isInteger(node.index) || node.index < 0 || node.index >= program.parts.length) {
        fail(nodePath, `Part anchor index ${String(node.index)} is outside parts`);
      }
      const part = program.parts[node.index];
      if (part.k !== 'text' && part.k !== 'when' && part.k !== 'each') {
        fail(nodePath, 'anchor must reference a text Part or Region');
      }
      const count = (anchorCounts.get(node.index) ?? 0) + 1;
      anchorCounts.set(node.index, count);
      if (count > 1) fail(nodePath, `Part ${node.index} has duplicate dynamic locations`);
    });
  };
  walkAnchors(program.template, 'template');

  program.parts.forEach((part) => {
    if (part.k === 'text' || part.k === 'when' || part.k === 'each') {
      if (anchorCounts.get(part.index) !== 1) {
        fail(`parts[${part.index}]`, 'every dynamic Part/Region must have exactly one anchor');
      }
      return;
    }
    const target = resolveTemplateNode(program, part.path, `parts[${part.index}].path`);
    if (target.k !== 'el') fail(`parts[${part.index}].path`, 'sink path must target an element');
    if (part.k === 'prop') {
      if (target.attrs.some(([name]) => name.toLowerCase() === part.name.toLowerCase())) {
        fail(
          `parts[${part.index}]`,
          `property Part duplicates static attribute ${JSON.stringify(part.name)}`,
        );
      }
      const duplicate = program.parts.some((other) =>
        other !== part && other.k === 'prop' &&
        other.name.toLowerCase() === part.name.toLowerCase() &&
        other.path.length === part.path.length && other.path.every((value, i) =>
          value === part.path[i]
        )
      );
      if (duplicate) fail(`parts[${part.index}]`, 'multiple property Parts own one DOM sink');
    } else {
      const duplicate = program.parts.some((other) =>
        other !== part && other.k === 'event' && other.event === part.event &&
        other.path.length === part.path.length && other.path.every((value, i) =>
          value === part.path[i]
        )
      );
      if (duplicate) fail(`parts[${part.index}]`, 'multiple event Parts own one DOM event sink');
    }
  });
}

/** Validate the seed program plus alpha.3's security and ownership invariants. */
export function assertCompiledProgram(raw: unknown): PartProgramSpike {
  let program: PartProgramSpike;
  try {
    program = validateSpikeProgram(raw);
  } catch (error) {
    if (error instanceof CompiledProgramValidationError) throw error;
    const detail = error instanceof Error ? error.message : String(error);
    fail('program', detail);
  }
  validateTag(program.tag, 'tag');
  validateStaticNodes(program.template, 'template', false, true);
  program.parts.forEach(validatePart);
  validateLocations(program);
  return program;
}

/** Read one compiled dependency without subscribing or discovering anything. */
export function signalOf(host: unknown, name: string): CompiledSignalLike<unknown> {
  if (!isRecord(host) || !isRecord(host.signals)) {
    throw new CompiledProgramValidationError('host', 'expected a signals record');
  }
  const signal = host.signals[name];
  if (!isRecord(signal) || typeof signal.subscribe !== 'function' || !('value' in signal)) {
    throw new CompiledProgramValidationError(
      'host.signals',
      `missing signal ${JSON.stringify(name)}`,
    );
  }
  return signal as unknown as CompiledSignalLike<unknown>;
}

export function handlersOf(host: unknown): Record<string, (event: unknown) => void> {
  if (!isRecord(host) || host.handlers === undefined) return {};
  if (!isRecord(host.handlers)) {
    throw new CompiledProgramValidationError('host.handlers', 'expected a handlers record');
  }
  const handlers: Record<string, (event: unknown) => void> = {};
  for (const [name, handler] of Object.entries(host.handlers)) {
    if (typeof handler !== 'function') {
      throw new CompiledProgramValidationError(
        `host.handlers.${name}`,
        'handler must be a function',
      );
    }
    handlers[name] = handler as (event: unknown) => void;
  }
  return handlers;
}

export function isRecordValue(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

export function voidElement(tag: string): boolean {
  return VOID_TAGS.has(tag);
}

export function rawTextElement(tag: string): boolean {
  return RAW_TEXT_TAGS.has(tag);
}

export function attributeNameIsSafe(name: string): boolean {
  const lower = name.toLowerCase();
  return ATTRIBUTE_NAME_RE.test(name) && !lower.startsWith('on') &&
    !FORBIDDEN_ATTRIBUTE_NAMES.has(lower);
}
