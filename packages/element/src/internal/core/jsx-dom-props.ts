import type { BindingDescriptor } from './binding-descriptor.ts';
import {
  bindAttr,
  bindClass,
  bindEvent,
  bindHtml,
  bindRef,
  bindStaticAttr,
  bindStaticBoolean,
  bindStaticProp,
  bindStaticStyle,
  bindText,
} from './binding-descriptor.ts';
import { eventTypeFromProp } from './event-marker.ts';
import { normalizePublicProps } from './props-utils.ts';
import { trustRenderHtml } from './security.ts';
import { isSignalLike, unwrapSignalLike } from '../signal/index.ts';
import type { Signal } from '../protocol/signal.ts';
import {
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  parseSignalAttrSpec,
} from '../protocol/hydration-markers.ts';
import { attrNameFor, resolveStyleObject, VNODE_CONTROL_PROP_KEYS } from './vnode-prop-rules.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
  'svg',
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'rect',
  'g',
  'defs',
  'clipPath',
  'mask',
  'pattern',
  'use',
  'symbol',
  'image',
  'text',
  'tspan',
  'textPath',
  'linearGradient',
  'radialGradient',
  'stop',
  'animate',
  'animateTransform',
  'animateMotion',
  'foreignObject',
  'title',
  'desc',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
]);

export function createElementForTag(tag: string): Element {
  return SVG_TAGS.has(tag) ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
}

const signalNameIndex = new WeakMap<Map<string, Signal<unknown>>, Map<Signal<unknown>, string>>();

export function signalNameFor(
  value: unknown,
  signalRegistry?: Map<string, Signal<unknown>>,
): string | undefined {
  if (!signalRegistry || !isSignalLike(value)) return undefined;
  let index = signalNameIndex.get(signalRegistry);
  if (!index) {
    index = new Map();
    for (const [name, signal] of signalRegistry) if (!index.has(signal)) index.set(signal, name);
    signalNameIndex.set(signalRegistry, index);
  }
  return index.get(value as Signal<unknown>);
}

/** Translate normalized JSX props into deferred DOM binding descriptors. */
export function collectPropBindings(
  el: Element,
  rawProps: Record<string, unknown>,
  signalRegistry?: Map<string, Signal<unknown>>,
): BindingDescriptor[] {
  const descriptors: BindingDescriptor[] = [];
  const trustedHtml = rawProps.trustedHtml === true;
  const props = normalizePublicProps(rawProps);

  for (const [key, value] of Object.entries(props)) {
    if (VNODE_CONTROL_PROP_KEYS.has(key)) continue;
    if (key === 'ref' && typeof value === 'function') {
      descriptors.push(bindRef(el, value as (el: Element) => void));
      continue;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = eventTypeFromProp(key);
      if (eventType) descriptors.push(bindEvent(el, eventType, value as EventListener));
      continue;
    }
    if (typeof value === 'function' || value == null) continue;
    if (key === 'innerHTML') {
      descriptors.push(...innerHtmlDescriptors(el, value, trustedHtml));
      continue;
    }
    if (isSignalLike(value)) {
      descriptors.push(...signalDescriptors(el, key, value as Signal<unknown>, signalRegistry));
      continue;
    }
    const resolved = unwrapSignalLike(value);
    if (key === 'style' && typeof resolved === 'object' && resolved !== null) {
      descriptors.push(bindStaticStyle(el, resolveStyleObject(resolved)));
    } else descriptors.push(staticDescriptor(el, key, resolved));
  }

  collectManualSignalMarker(descriptors, el, props, signalRegistry);
  return descriptors;
}

function collectManualSignalMarker(
  descriptors: BindingDescriptor[],
  el: Element,
  props: Record<string, unknown>,
  signalRegistry?: Map<string, Signal<unknown>>,
): void {
  const markerName = props[DATA_SIGNAL];
  if (typeof markerName !== 'string' || !signalRegistry) return;
  const signal = signalRegistry.get(markerName);
  if (!signal) return;
  const className = props[DATA_SIGNAL_CLASS];
  const attrSpec = props[DATA_SIGNAL_ATTR];
  if (typeof className === 'string') descriptors.push(bindClass(el, className, signal));
  if (typeof attrSpec === 'string') {
    const names = parseSignalAttrSpec(attrSpec);
    if (names.length) descriptors.push(bindAttr(el, names, signal));
  }
  if (typeof className !== 'string' && typeof attrSpec !== 'string') {
    descriptors.push(bindText(el, signal));
  }
}

function innerHtmlDescriptors(
  el: Element,
  value: unknown,
  trustedHtml: boolean,
): BindingDescriptor[] {
  if (isSignalLike(value)) return [bindHtml(el, value as Signal<unknown>, trustedHtml)];
  const resolved = String(unwrapSignalLike(value));
  if (trustedHtml) (el as HTMLElement).innerHTML = trustRenderHtml(resolved);
  else (el as HTMLElement).textContent = resolved;
  return [];
}

function signalDescriptors(
  el: Element,
  key: string,
  signal: Signal<unknown>,
  signalRegistry?: Map<string, Signal<unknown>>,
): BindingDescriptor[] {
  const name = signalNameFor(signal, signalRegistry);
  if (name) el.setAttribute(DATA_SIGNAL, name);
  return [bindAttr(el, [attrNameFor(el.localName, key)], signal)];
}

function staticDescriptor(el: Element, key: string, value: unknown): BindingDescriptor {
  if (key === 'textContent') return bindStaticProp(el, 'textContent', value);
  if (typeof value === 'boolean') {
    return bindStaticBoolean(el, attrNameFor(el.localName, key), value);
  }
  return bindStaticAttr(el, attrNameFor(el.localName, key), value);
}
