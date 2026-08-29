/**
 * context.ts - Kernel-owned DOM-tree context service (alpha.2).
 *
 * One compiled element instance owns its context consumption: consumers
 * registered through this service subscribe while the element is connected,
 * unsubscribe exactly once on disconnect, and resubscribe without duplicates
 * on reconnect. Provision and lookup reuse the signal-backed DOM-tree walk in
 * internal/core/signal-context.ts, which crosses shadow boundaries via
 * getRootNode().host, matching platform semantics for light, open, and
 * closed roots. Notifications flow through the selected signal engine.
 */

import { consumeContext, type Context, provideContext } from '../../core/signal-context.ts';
import type { Unsubscribe } from '../../protocol/signal.ts';

interface ContextConsumer {
  context: Context<unknown>;
  notify: (value: unknown) => void;
}

export class CompiledContextService {
  #element: HTMLElement;
  #consumers = new Set<ContextConsumer>();
  #subscriptions = new Map<ContextConsumer, Unsubscribe>();
  #connected = false;
  #disposed = false;

  constructor(element: HTMLElement) {
    this.#element = element;
  }

  /** Provide a context value to the descendants of the owning element. */
  provide<T>(context: Context<T>, value: T): void {
    provideContext(this.#element, context, value);
  }

  /**
   * Consume a context value from the nearest ancestor provider, falling back
   * to the context default. The subscription is owned by this element
   * instance: it starts on connect, ends exactly once on disconnect, and is
   * re-resolved against the DOM tree on every reconnect.
   */
  consume<T>(context: Context<T>, notify: (value: T) => void): void {
    if (this.#disposed) throw new Error('[compiled-context] service is disposed');
    const consumer: ContextConsumer = {
      context: context as Context<unknown>,
      notify: notify as (value: unknown) => void,
    };
    this.#consumers.add(consumer);
    if (this.#connected) this.#subscribe(consumer);
  }

  /** Subscribe every registered consumer; called when the element connects. */
  connect(): void {
    if (this.#disposed) throw new Error('[compiled-context] service is disposed');
    if (this.#connected) return;
    this.#connected = true;
    for (const consumer of this.#consumers) this.#subscribe(consumer);
  }

  /** Unsubscribe every consumer exactly once; safe to call repeatedly. */
  disconnect(): void {
    if (!this.#connected) return;
    this.#connected = false;
    const subscriptions = [...this.#subscriptions.values()];
    this.#subscriptions.clear();
    for (const unsubscribe of subscriptions) unsubscribe();
  }

  dispose(): void {
    if (this.#disposed) return;
    this.disconnect();
    this.#consumers.clear();
    this.#disposed = true;
  }

  #subscribe(consumer: ContextConsumer): void {
    const signal = consumeContext(consumer.context, this.#element);
    this.#subscriptions.set(consumer, signal.subscribe(consumer.notify));
  }
}
