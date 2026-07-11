/**
 * ./index.ts - SignalContext DOM-tree-based cross-component signal sharing.
 *
 * v0.29.6: WeakMap replaces symbol-keyed DOM property stamping.
 * Consumer walks parentElement / shadowRoot.host upward to find signals.
 *
 * @module ./signal-context.ts
 */

import type { WritableSignal } from '../signal/index.ts';
import { signal } from '../signal/index.ts';

export interface Context<T> {
  key: symbol;
  defaultValue: T;
}

const defaultSignals = new Map<symbol, WritableSignal<unknown>>();
const hostSignals = new WeakMap<object, Map<symbol, WritableSignal<unknown>>>();

export function createContext<T>(key: symbol, defaultValue: T): Context<T> {
  const s = signal<T>(defaultValue);
  defaultSignals.set(key, s);
  return { key, defaultValue };
}

function getOrCreateHostSignal<T>(
  host: object,
  ctx: Context<T>,
  initialValue: T,
): WritableSignal<T> {
  let map = hostSignals.get(host);
  if (!map) {
    map = new Map();
    hostSignals.set(host, map);
  }
  let scoped = map.get(ctx.key) as WritableSignal<T> | undefined;
  if (!scoped) {
    scoped = signal<T>(initialValue);
    map.set(ctx.key, scoped as WritableSignal<unknown>);
  }
  return scoped;
}

export function provideContext<T>(
  host: HTMLElement,
  ctx: Context<T>,
  value: T,
): void {
  const scoped = getOrCreateHostSignal(host, ctx, value);
  scoped.value = value;
}

function findProvidedSignal<T>(
  host: HTMLElement | undefined,
  ctx: Context<T>,
): WritableSignal<T> | undefined {
  let current: Node | null | undefined = host;
  while (current) {
    const store = hostSignals.get(current as object);
    if (store) {
      const candidate = store.get(ctx.key);
      if (candidate) return candidate as WritableSignal<T>;
    }
    current = current.parentNode;
    if (!current) {
      const root = host?.getRootNode?.();
      current = root instanceof ShadowRoot ? root.host : null;
    }
  }
  return undefined;
}

export function consumeContext<T>(
  ctx: Context<T>,
  host?: HTMLElement,
): WritableSignal<T> {
  const scoped = findProvidedSignal(host, ctx);
  if (scoped) return scoped;
  const s = defaultSignals.get(ctx.key);
  if (s) return s as WritableSignal<T>;
  return signal(ctx.defaultValue);
}
