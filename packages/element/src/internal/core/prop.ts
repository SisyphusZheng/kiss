/**
 * ./prop.ts — Reactive property runtime.
 *
 * ADR-0057: static props + Signal model.
 *
 * v0.29.5: WeakMap replaces Symbol.for() for type-safe signal storage.
 */

import type {
  NormalizedPropDecl,
  PropDecl,
  PropDeclFull,
  PropDeclShorthand,
  PropsFrom,
  PropType,
} from '../protocol/prop.ts';
import { camelToKebab } from './tag-utils.ts';
export type { NormalizedPropDecl, PropDecl, PropDeclFull, PropDeclShorthand, PropsFrom, PropType };

// ─── Internal types ─────────────────────────────────────────────

type PropSignal = { value: unknown; subscribe(fn: (v: unknown) => void): () => void };

// ─── WeakMap storage (v0.29.5: replaces Symbol.for()) ───────────

const _staticPropSignals = new WeakMap<HTMLElement, Map<string, PropSignal>>();
const _staticPropUnsubs = new WeakMap<HTMLElement, Array<() => void>>();

// ─── Static props runtime ───────────────────────────────────────

export function initializeStaticProps(instance: HTMLElement): void {
  const ctor = instance.constructor as { props?: Record<string, unknown> };
  const propsDef = ctor.props as Record<string, unknown> | undefined;
  if (!propsDef || typeof propsDef !== 'object') return;

  // disconnect→reconnect (#772): connectedCallback fires on every DOM move.
  // Signals and accessors survive disposal, so property-set state is
  // preserved; only the reflect subscriptions torn down by
  // disposeStaticProps() are re-armed.
  const existing = _staticPropSignals.get(instance);
  if (existing) {
    subscribeReflectProps(instance, existing, propsDef);
    return;
  }

  const sigMap = new Map<string, PropSignal>();
  _staticPropSignals.set(instance, sigMap);
  _staticPropUnsubs.set(instance, []);

  for (const [name, decl] of Object.entries(propsDef)) {
    const { default: defVal } = normalizePropDecl(decl);
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
  }

  subscribeReflectProps(instance, sigMap, propsDef);

  // NOTE: observedAttributes merging intentionally does NOT happen here.
  // Browsers snapshot observedAttributes once at customElements.define(), so
  // pushing names at connect time never registers them. The merge lives on the
  // OpenElement base-class accessor instead (see resolveObservedAttributes).
}

/**
 * Arm reflect subscriptions mirroring signal writes back to attributes.
 * Runs on first initialization and again on reconnect (disconnectedCallback
 * disposes them via disposeStaticProps).
 */
function subscribeReflectProps(
  instance: HTMLElement,
  sigMap: Map<string, PropSignal>,
  propsDef: Record<string, unknown>,
): void {
  const unsubs = _staticPropUnsubs.get(instance);
  if (!unsubs) return;

  for (const [name, decl] of Object.entries(propsDef)) {
    const { reflect } = normalizePropDecl(decl);
    if (!reflect) continue;
    const sig = sigMap.get(name);
    if (!sig) continue;
    // The mirrored attribute uses the same kebab-case name that SSR
    // serialization and observedAttributes registration use.
    const attrName = camelToKebab(name);

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
        // Array/Object mirror as JSON, matching SSR serialization (#764).
        const next = type === Array || type === Object
          ? JSON.stringify(sig.value)
          : String(sig.value);
        if (instance.getAttribute(attrName) !== next) instance.setAttribute(attrName, next);
      }
    });
    unsubs.push(unsub);
  }
}

export function disposeStaticProps(instance: HTMLElement): void {
  const unsubs = _staticPropUnsubs.get(instance);
  if (unsubs) {
    for (const fn of unsubs.splice(0)) fn();
  }
}

export function handleStaticPropAttributeChange(
  instance: HTMLElement,
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
    const next: unknown = newValue === null
      ? defaultValue
      : parseAttributeValue(type, newValue, defaultValue);
    // Equality short-circuit: reflect subscribers mirror signal writes into
    // this same attribute. Re-writing an identical parsed value would
    // re-notify the subscriber and loop the write back into setAttribute.
    // Removal (newValue === null) bypasses the short-circuit: the signal may
    // already hold the default, yet the reflect subscriber must still fire so
    // the mirrored attribute is restored to match the restored default.
    if (newValue === null || !Object.is(sig.value, next)) sig.value = next;
    return;
  }
}

export function syncStaticPropsFromAttributes(instance: HTMLElement): void {
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
      const { type, default: defaultValue } = normalizePropDecl(decl);
      const raw = el.getAttribute(attrName);
      sig.value = parseAttributeValue(type, raw ?? '', defaultValue);
    }
  }
}

// ─── Shared utilities ───────────────────────────────────────────

/**
 * Array/Object props arrive through attributes as JSON strings (#764). Parse
 * failures fall back to the declared default so the signal always holds the
 * declared type.
 */
function parseJsonAttribute(raw: string, defaultValue: unknown): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Shared attribute→signal parsing for a non-null raw attribute value, used by
 * both handleStaticPropAttributeChange and syncStaticPropsFromAttributes. The
 * null/absent case stays with the caller: removal restores the declared
 * default, while sync only runs when hasAttribute() is true.
 */
function parseAttributeValue(
  type: NormalizedPropDecl['type'],
  raw: string,
  defaultValue: unknown,
): unknown {
  if (type === Boolean) return true;
  if (type === Number) {
    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }
  if (type === Array || type === Object) return parseJsonAttribute(raw, defaultValue);
  return raw;
}

function normalizePropDecl(decl: unknown): NormalizedPropDecl {
  if (typeof decl === 'function') {
    return {
      type: decl as NormalizedPropDecl['type'],
      default: defaultForType(decl),
      reflect: false,
    };
  }
  if (decl && typeof decl === 'object') {
    const d = decl as { type?: unknown; default?: unknown; reflect?: unknown };
    return {
      type: (d.type ?? String) as NormalizedPropDecl['type'],
      default: d.default ?? defaultForType(d.type),
      reflect: d.reflect === true,
    };
  }
  return { type: String, default: '', reflect: false };
}

/** Declared-type default matching the PropsFrom inference for that type. */
function defaultForType(type: unknown): unknown {
  if (type === Boolean) return false;
  if (type === Number) return 0;
  if (type === Array) return [];
  if (type === Object) return {};
  return '';
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
