/**
 * ./index.ts — Reactive property runtime.
 *
 * ADR-0057: static props + Signal model.
 *
 * v0.29.5: WeakMap replaces Symbol.for() for type-safe signal storage.
 */

// Minimal element interface for core WeakMap identity
interface _El extends HTMLElement {}

import type {
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '../protocol/prop.ts';
export type { PropDecl, PropDeclFull, PropDeclShorthand, PropsFrom, PropType };

// ─── Internal types ─────────────────────────────────────────────

type PropSignal = { value: unknown; subscribe(fn: (v: unknown) => void): () => void };

// ─── WeakMap storage (v0.29.5: replaces Symbol.for()) ───────────

const _staticPropSignals = new WeakMap<_El, Map<string, PropSignal>>();
const _staticPropUnsubs = new WeakMap<_El, Array<() => void>>();

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
    const { type, default: defaultValue } = normalizePropDecl(decl);
    if (newValue === null) {
      sig.value = defaultValue;
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

import type { NormalizedPropDecl } from '../protocol/prop.ts';
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
