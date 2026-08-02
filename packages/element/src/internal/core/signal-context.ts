/**
 * ./signal-context.ts - SignalContext DOM-tree-based cross-component signal sharing.
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

const defaultSignals = new WeakMap<Context<unknown>, WritableSignal<unknown>>();
const hostSignals = new WeakMap<object, Map<symbol, WritableSignal<unknown>>>();

export function createContext<T>(key: symbol, defaultValue: T): Context<T> {
  const context: Context<T> = { key, defaultValue };
  const s = signal<T>(defaultValue);
  defaultSignals.set(context as Context<unknown>, s as WritableSignal<unknown>);
  return context;
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
  let lastNode: Node | null = host ?? null;
  while (current) {
    const store = hostSignals.get(current as object);
    if (store) {
      const candidate = store.get(ctx.key);
      if (candidate) return candidate as WritableSignal<T>;
    }
    current = current.parentNode;
    if (current) {
      lastNode = current;
    } else {
      // Crossed the top of the current tree. Derive the next node from the last
      // real node visited (not the original host) so each shadow boundary is
      // crossed exactly once and the walk terminates at the document root.
      const root = lastNode?.getRootNode?.();
      current = root instanceof ShadowRoot ? root.host : null;
      if (current) lastNode = current;
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
  const s = defaultSignals.get(ctx as Context<unknown>);
  if (s) return s as WritableSignal<T>;
  return signal(ctx.defaultValue);
}
