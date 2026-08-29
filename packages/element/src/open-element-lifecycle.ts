/**
 * Abort-signal lifecycle box owned by an OpenElement host.
 *
 * Extracted from the base class (#904, concern: AbortController lifecycle).
 * Owns the disconnect-abort signal and the auto-clearing setTimeout /
 * requestAnimationFrame wrappers. dispose() aborts the current signal and
 * starts a fresh controller, mirroring the original lazy re-creation on
 * reconnect.
 */
export class ElementLifecycle {
  #controller = new AbortController();
  #connected = false;

  /** Aborted when the element disconnects (fresh signal on reconnect). */
  get signal(): AbortSignal {
    return this.#controller.signal;
  }

  /** Arm this lifecycle box once for one connected/adopted activation. */
  connect(): void {
    if (this.#connected) return;
    if (this.#controller.signal.aborted) this.#controller = new AbortController();
    this.#connected = true;
  }

  get active(): boolean {
    return this.#connected;
  }

  /** Abort the current signal; a reconnect gets a fresh, non-aborted one. */
  dispose(): void {
    if (!this.#connected && this.#controller.signal.aborted) return;
    this.#connected = false;
    this.#controller.abort();
    this.#controller = new AbortController();
  }

  /** setTimeout wrapper that auto-clears when the element disconnects. */
  setTimeout(handler: TimerHandler, timeout?: number): number {
    const id = globalThis.setTimeout(handler, timeout);
    this.signal.addEventListener('abort', () => globalThis.clearTimeout(id), {
      once: true,
    });
    return id;
  }

  /** requestAnimationFrame wrapper that auto-cancels on disconnect. */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = globalThis.requestAnimationFrame(callback);
    this.signal.addEventListener('abort', () => globalThis.cancelAnimationFrame(id), {
      once: true,
    });
    return id;
  }
}
