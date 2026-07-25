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
import { camelToKebab } from './tag-utils.ts';
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
    // The mirrored attribute uses the same kebab-case name that SSR
    // serialization and observedAttributes registration use.
    const attrName = camelToKebab(name);

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
      // createPropSignal.subscribe() fires once synchronously with the
      // current (default) value. connectedCallback syncs attributes into the
      // signal right after this initialization, so that first fire must not
      // write back: it would clobber SSR-delivered reflect attributes before
      // syncStaticPropsFromAttributes had a chance to read them.
      let pendingInitialSync = true;
      const unsub = sig.subscribe(() => {
        if (pendingInitialSync) {
          pendingInitialSync = false;
          return;
        }
        const { type } = normalizePropDecl(decl);
        if (type === Boolean) {
          // Presence mirrors truthiness; skip when already in sync.
          if (sig.value) {
            if (!instance.hasAttribute(attrName)) instance.setAttribute(attrName, '');
          } else if (instance.hasAttribute(attrName)) {
            instance.removeAttribute(attrName);
          }
        } else {
          // Equality short-circuit: the mirrored setAttribute re-enters
          // handleStaticPropAttributeChange, which writes the same value back
          // into the signal. Skipping the write when the attribute already
          // holds it breaks that loop (browsers fire attributeChangedCallback
          // even for an identical value).
          const next = String(sig.value);
          if (instance.getAttribute(attrName) !== next) instance.setAttribute(attrName, next);
        }
      });
      unsubs.push(unsub);
    }
  }

  // NOTE: observedAttributes merging intentionally does NOT happen here.
  // Browsers snapshot observedAttributes once at customElements.define(), so
  // pushing names at connect time never registers them. The merge lives on the
  // OpenElement base-class accessor instead (see resolveObservedAttributes).
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
    // Attribute names arrive lowercase; prop keys normalize to kebab-case,
    // matching observedAttributes registration and SSR serialization.
    if (camelToKebab(propName) !== name.toLowerCase()) continue;
    const sig = sigMap.get(propName);
    if (!sig) continue;
    const { type, default: defaultValue } = normalizePropDecl(decl);
    let next: unknown;
    if (newValue === null) {
      next = defaultValue;
    } else if (type === Boolean) {
      next = true;
    } else if (type === Number) {
      const n = Number(newValue);
      next = Number.isNaN(n) ? 0 : n;
    } else {
      next = newValue;
    }
    // Equality short-circuit: reflect subscribers mirror signal writes into
    // this same attribute. Re-writing an identical parsed value would
    // re-notify the subscriber and loop the write back into setAttribute.
    if (!Object.is(sig.value, next)) {
      sig.value = next;
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
    // Kebab-case attribute name, matching SSR serialization and
    // observedAttributes registration (camelToKebab).
    const attrName = camelToKebab(name);
    if (el.hasAttribute(attrName)) {
      const { type } = normalizePropDecl(decl);
      const raw = el.getAttribute(attrName);
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

// ─── Define-time observedAttributes resolution (B2 fix) ─────────

/**
 * User-declared observedAttributes stored per constructor via the OpenElement
 * base-class setter. Keyed by constructor so subclasses never share (or
 * mutate) a parent class's array.
 */
const _declaredObservedAttributes = new WeakMap<object, readonly string[]>();

/**
 * Store a hand-written observedAttributes list for a constructor. Called by
 * the OpenElement base-class static setter. The list is later unioned with
 * the constructor's static props attribute names on read.
 */
export function declareObservedAttributes(
  ctor: object,
  value: readonly string[] | undefined,
): void {
  if (value === undefined) {
    _declaredObservedAttributes.delete(ctor);
  } else {
    _declaredObservedAttributes.set(ctor, Object.freeze([...value]));
  }
}

/**
 * Resolve the effective observedAttributes for a constructor: the union of
 * every list stored via {@link declareObservedAttributes} along its prototype
 * chain and the lowercased attribute names declared by its `static props`.
 *
 * Read by the OpenElement base-class static getter, which browsers invoke
 * exactly once at customElements.define() — the only moment attribute
 * observation can be registered.
 */
export function resolveObservedAttributes(ctor: unknown): string[] {
  const merged: string[] = [];
  let current: unknown = ctor;
  while (typeof current === 'function') {
    const declared = _declaredObservedAttributes.get(current);
    if (declared) {
      for (const name of declared) {
        if (!merged.includes(name)) merged.push(name);
      }
    }
    current = Object.getPrototypeOf(current);
  }
  const propsDef = (ctor as { props?: Record<string, unknown> }).props;
  if (propsDef && typeof propsDef === 'object') {
    return mergePropsAttributeNames(merged, propsDef);
  }
  return merged;
}

/** Union kebab-cased static props attribute names into a fresh array. */
function mergePropsAttributeNames(
  base: readonly string[] | undefined,
  propsDef: Record<string, unknown>,
): string[] {
  const merged = base ? [...base] : [];
  for (const name of Object.keys(propsDef)) {
    const attrName = camelToKebab(name);
    if (!merged.includes(attrName)) {
      merged.push(attrName);
    }
  }
  return merged;
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
    // Fires fn once synchronously with the current value. The reflect
    // subscriber in initializeStaticProps relies on (and skips) exactly this
    // first fire; keep the contract synchronous.
    subscribe(fn: (v: unknown) => void): () => void {
      _subs.add(fn);
      fn(_value);
      return () => _subs.delete(fn);
    },
  };
}
