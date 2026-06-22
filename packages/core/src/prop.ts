/**
 * @openelement/core — Reactive property runtime.
 *
 * ADR-0052 / SOP-010 / ADR-0057: static props + Signal model.
 *
 * v0.29.5: WeakMap replaces Symbol.for() for type-safe signal storage.
 */

// Minimal element interface for core WeakMap identity
interface _El extends HTMLElement {
  requestReactiveUpdate?(): void;
}

import type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '@openelement/protocol/prop';
export type { PropDecl, PropDeclFull, PropDeclShorthand, PropsFrom, PropType };

// ─── Internal types ─────────────────────────────────────────────

interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor;
  attribute?: string | false;
  reflect?: boolean;
  noAccessor?: boolean;
}

interface PropMetadata {
  key: PropertyKey;
  options: PropertyOptions;
}

interface PropMetadataStore {
  props: PropMetadata[];
}

interface PropSignalMap {
  signals: Map<PropertyKey, { value: unknown; subscribe(fn: (v: unknown) => void): () => void }>;
}

type PropSignal = { value: unknown; subscribe(fn: (v: unknown) => void): () => void };

// ─── WeakMap storage (v0.29.5: replaces Symbol.for()) ───────────

const _propSignals = new WeakMap<_El, PropSignalMap>();
const _propUnsubscribers = new WeakMap<_El, Array<() => void>>();
const _ctorMetadata = new WeakMap<object, PropMetadataStore>();
const _staticPropSignals = new WeakMap<_El, Map<string, PropSignal>>();
const _staticPropUnsubs = new WeakMap<_El, Array<() => void>>();

// ─── @prop() runtime (legacy compat) ────────────────────────────

export function initializeProps(instance: _El): void {
  const store = _ctorMetadata.get(instance.constructor);
  if (!store?.props.length) return;

  const sigMap: PropSignalMap = { signals: new Map() };
  _propSignals.set(instance, sigMap);

  const unsubscribers: Array<() => void> = [];
  _propUnsubscribers.set(instance, unsubscribers);

  for (const { key, options } of store.props) {
    const attrName = resolveAttrName(key, options);
    const initialValue = getInitialValue(instance, key, attrName, options);

    const sig = createPropSignal(initialValue);
    let skipFirst = true;
    const unsubscribe = sig.subscribe(() => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      if (options.reflect && typeof key === 'string') {
        reflectToAttribute(instance, key, sig.value, options);
      }
      instance.requestReactiveUpdate?.();
    });
    unsubscribers.push(unsubscribe);

    sigMap.signals.set(key, sig);

    if (!options.noAccessor) {
      installPropAccessor(instance, key as string | symbol, sigMap);
    }
  }

  registerObservedAttributes(
    instance.constructor as CustomElementConstructor & {
      observedAttributes?: string[];
      requestReactiveUpdate?(): void;
    },
    store,
  );
}

export function disposeProps(instance: _El): void {
  const unsubs = _propUnsubscribers.get(instance);
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

export function handlePropAttributeChange(
  instance: _El,
  name: string,
  _oldValue: string | null,
  newValue: string | null,
): void {
  const sigMap = _propSignals.get(instance);
  if (!sigMap) return;

  const store = _ctorMetadata.get(instance.constructor);
  if (!store) return;

  for (const { key, options } of store.props) {
    const attr = resolveAttrName(key, options);
    if (attr !== name) continue;

    const sig = sigMap.signals.get(key);
    if (!sig) continue;

    const converted = fromAttribute(newValue, options);
    sig.value = converted;
    return;
  }
}

// ─── Internal helpers ───────────────────────────────────────────

function resolveAttrName(key: PropertyKey, options: PropertyOptions): string {
  if (options.attribute === false) return '';
  if (typeof options.attribute === 'string') return options.attribute;
  return String(key).toLowerCase();
}

function getInitialValue(
  instance: _El,
  key: PropertyKey,
  attrName: string,
  options: PropertyOptions,
): unknown {
  const own = (instance as unknown as Record<PropertyKey, unknown>)[key];
  if (own !== undefined) return own;

  if (attrName && instance.hasAttribute(attrName)) {
    return fromAttribute(instance.getAttribute(attrName), options);
  }

  return options.type === Boolean ? false : '';
}

function fromAttribute(value: string | null, options: PropertyOptions): unknown {
  if (value === null) {
    return options.type === Boolean ? false : options.type === Number ? 0 : '';
  }
  if (options.type === Boolean) return true;
  if (options.type === Number) {
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  }
  return value;
}

function reflectToAttribute(
  instance: _El,
  key: string,
  value: unknown,
  options: PropertyOptions,
): void {
  const attr = resolveAttrName(key, options);
  if (!attr) return;

  if (options.type === Boolean) {
    if (value) {
      instance.setAttribute(attr, '');
    } else {
      instance.removeAttribute(attr);
    }
  } else {
    instance.setAttribute(attr, String(value));
  }
}

function createPropSignal(initial: unknown): PropSignal {
  let _value = initial;
  const _subs = new Set<(v: unknown) => void>();

  return {
    get value(): unknown {
      return _value;
    },
    set value(v: unknown) {
      _value = v;
      for (const fn of _subs) fn(v);
    },
    subscribe(fn: (v: unknown) => void): () => void {
      _subs.add(fn);
      fn(_value);
      return () => _subs.delete(fn);
    },
  };
}

function installPropAccessor(
  instance: _El,
  key: string | symbol,
  sigMap: PropSignalMap,
): void {
  Object.defineProperty(instance, key, {
    get() {
      return sigMap.signals.get(key)?.value;
    },
    set(v: unknown) {
      const sig = sigMap.signals.get(key);
      if (sig) sig.value = v;
    },
    enumerable: true,
    configurable: true,
  });
}

function registerObservedAttributes(
  ctor: CustomElementConstructor & { observedAttributes?: string[] },
  store: PropMetadataStore,
): void {
  if (!ctor.observedAttributes) {
    ctor.observedAttributes = [];
  }
  for (const { key, options } of store.props) {
    const attr = resolveAttrName(key, options);
    if (attr && !ctor.observedAttributes.includes(attr)) {
      ctor.observedAttributes.push(attr);
    }
  }
}

// ─── Static props runtime ───────────────────────────────────────

export function initializeStaticProps(instance: _El): void {
  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef || typeof propsDef !== 'object') return;

  const sigMap = new Map<string, PropSignal>();
  _staticPropSignals.set(instance, sigMap);

  const unsubs: Array<() => void> = [];
  _staticPropUnsubs.set(instance, unsubs);

  for (const [name, decl] of Object.entries(propsDef)) {
    const { default: defVal, reflect } = normalizePropDecl(decl);
    const sig = createPropSignal(defVal);

    sigMap.set(name, sig);

    Object.defineProperty(instance, name, {
      get() {
        return sig;
      },
      set(v: unknown) {
        sig.value = v;
      },
      enumerable: true,
      configurable: true,
    });

    if (reflect) {
      const unsub = sig.subscribe(() => {
        const { type } = normalizePropDecl(decl);
        if (type === Boolean) {
          if (sig.value) instance.setAttribute(name, '');
          else instance.removeAttribute(name);
        } else {
          instance.setAttribute(name, String(sig.value));
        }
      });
      unsubs.push(unsub);
    }
  }

  registerStaticObservedAttributes(ctor, propsDef);
}

export function disposeStaticProps(instance: _El): void {
  const unsubs = _staticPropUnsubs.get(instance);
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

export function handleStaticPropAttributeChange(
  instance: _El,
  name: string,
  _oldValue: string | null,
  newValue: string | null,
): void {
  const sigMap = _staticPropSignals.get(instance);
  if (!sigMap) return;

  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef) return;

  for (const [propName, decl] of Object.entries(propsDef)) {
    if (propName.toLowerCase() !== name.toLowerCase()) continue;
    const sig = sigMap.get(propName);
    if (!sig) continue;
    const { type } = normalizePropDecl(decl);
    if (newValue === null) {
      sig.value = type === Boolean ? false : type === Number ? 0 : '';
    } else if (type === Boolean) {
      sig.value = true;
    } else if (type === Number) {
      const n = Number(newValue);
      sig.value = Number.isNaN(n) ? 0 : n;
    } else {
      sig.value = newValue;
    }
    return;
  }
}

export function syncStaticPropsFromAttributes(instance: _El): void {
  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef) return;

  const sigMap = _staticPropSignals.get(instance);
  if (!sigMap) return;

  const el = instance as unknown as {
    getAttribute(n: string): string | null;
    hasAttribute(n: string): boolean;
  };

  for (const [name, decl] of Object.entries(propsDef)) {
    const sig = sigMap.get(name);
    if (!sig) continue;
    if (el.hasAttribute(name)) {
      const { type } = normalizePropDecl(decl);
      const raw = el.getAttribute(name);
      if (raw === null) continue;
      if (type === Boolean) {
        sig.value = true;
      } else if (type === Number) {
        const n = Number(raw);
        sig.value = Number.isNaN(n) ? 0 : n;
      } else {
        sig.value = raw;
      }
    }
  }
}

export function unwrap<T>(sig: { value: T } | T): T {
  if (
    sig !== null && typeof sig === 'object' && 'value' in (sig as object) &&
    'subscribe' in (sig as object)
  ) {
    return (sig as { value: T }).value;
  }
  return sig as T;
}

// ─── Shared utilities ───────────────────────────────────────────

import type { NormalizedPropDecl } from '@openelement/protocol/prop';
export type { NormalizedPropDecl };

export function normalizePropDecl(decl: unknown): NormalizedPropDecl {
  if (typeof decl === 'function') {
    return {
      type: decl as NormalizedPropDecl['type'],
      default: decl === Boolean ? false : decl === Number ? 0 : '',
      reflect: false,
    };
  }
  if (decl && typeof decl === 'object') {
    const d = decl as { type?: unknown; default?: unknown; reflect?: unknown };
    return {
      type: (d.type ?? String) as NormalizedPropDecl['type'],
      default: d.default ?? (d.type === Boolean ? false : d.type === Number ? 0 : ''),
      reflect: d.reflect === true,
    };
  }
  return { type: String, default: '', reflect: false };
}

export function registerStaticObservedAttributes(
  ctor: { props?: Record<string, unknown>; observedAttributes?: string[] },
  propsDef: Record<string, unknown>,
): void {
  if (!ctor.observedAttributes) {
    ctor.observedAttributes = [];
  }
  for (const name of Object.keys(propsDef)) {
    if (!ctor.observedAttributes.includes(name.toLowerCase())) {
      ctor.observedAttributes.push(name.toLowerCase());
    }
  }
}
