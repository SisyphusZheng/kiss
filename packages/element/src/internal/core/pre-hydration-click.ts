/**
 * pre-hydration-click.ts - #942: click capture/replay across the hydration
 * window.
 *
 * Islands with a deferred strategy (idle, or a slow module fetch) expose a
 * window between first paint and hydration where the SSR'd shadow DOM is
 * live but has no listeners: a click lands on inert markup and is silently
 * lost. This module records clicks whose composed path crosses a
 * not-yet-hydrated host (detected by hydration markers), then re-dispatches
 * each recorded event once when that host hydrates.
 *
 * Surface is deliberately small:
 *   - click only — pointer clicks and keyboard activation (Enter/Space) both
 *     fire a native `click`, so no other event types are needed.
 *   - one capture-phase listener per document, installed by
 *     `ensurePreHydrationClickCapture()` (idempotent, SSR-safe).
 *   - queues are WeakMap-keyed by host, so a host that never hydrates leaks
 *     nothing (and its clicks are simply lost, as before).
 *
 * The original event is NOT preventDefaulted: replay only exists to run the
 * island's own handler once. Known edges (accepted): default actions on
 * anchors/checkboxes inside the window may run twice (native + replay), and
 * replayed events carry isTrusted=false. A replay is skipped once a host is
 * flushed (WeakSet), so a replay can never re-enter the queue.
 *
 * The module is runtime-safe without DOM globals (SSR): `Element`/`Node` are
 * only used as types, never via `instanceof`.
 */

import {
  DATA_EID,
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  DATA_SIGNAL_RENDER,
} from '../protocol/hydration-markers.ts';

interface PendingClick {
  event: Event;
  /** Original dispatch target (composedPath()[0]) captured at record time:
   *  composedPath() is empty once the event finished dispatching. */
  target: EventTarget;
}

const pendingClicks = new WeakMap<Element, PendingClick[]>();
const flushedHosts = new WeakSet<Element>();
let installed = false;

/** Duck-typed element check (no `instanceof Element` in non-DOM runtimes). */
function isElementLike(node: unknown): node is Element {
  return typeof node === 'object' && node !== null &&
    typeof (node as { nodeType?: unknown }).nodeType === 'number' &&
    typeof (node as { hasAttribute?: unknown }).hasAttribute === 'function';
}

/** Duck-typed node check (event targets need dispatchEvent for replay). */
function isNodeLike(node: unknown): node is Element {
  return typeof node === 'object' && node !== null &&
    typeof (node as { nodeType?: unknown }).nodeType === 'number' &&
    typeof (node as { dispatchEvent?: unknown }).dispatchEvent === 'function';
}

function hasHydrationMarkers(node: Element): boolean {
  return node.hasAttribute(DATA_EID) ||
    node.hasAttribute(DATA_SIGNAL) ||
    node.hasAttribute(DATA_SIGNAL_ATTR) ||
    node.hasAttribute(DATA_SIGNAL_CLASS) ||
    node.hasAttribute(DATA_SIGNAL_RENDER);
}

function shadowRootHasMarkers(el: Element): boolean {
  const root = el.shadowRoot;
  if (!root || typeof root.querySelector !== 'function') return false;
  return Boolean(
    root.querySelector(
      `[${DATA_SIGNAL}], [${DATA_EID}], [${DATA_SIGNAL_RENDER}]`,
    ),
  );
}

/**
 * First unflushed hydration-bearing host in the composed path.
 *
 * Shadow-DOM: the host carries the markers inside its shadow root. Marker
 * elements inside that root (e.g. a `data-eid` button) appear in the path
 * BEFORE the host and `closest()` cannot cross the shadow boundary, so the
 * owning host is resolved via `getRootNode().host` — never the marker
 * element itself, or the replay queue would be keyed to the wrong node and
 * never flushed. Light-DOM: markers sit on descendants and the owning island
 * is the nearest `data-ssr-props` ancestor.
 */
function pendingHostFromPath(path: readonly EventTarget[]): Element | null {
  for (const node of path) {
    if (!isElementLike(node)) continue;
    if (shadowRootHasMarkers(node)) return node;
    if (hasHydrationMarkers(node)) {
      if (typeof node.getRootNode === 'function') {
        const root = node.getRootNode() as Node;
        const host = root !== node.ownerDocument ? (root as { host?: Element }).host : undefined;
        if (host) return host;
      }
      const host = typeof node.closest === 'function' ? node.closest('[data-ssr-props]') : null;
      return host ?? node;
    }
  }
  return null;
}

/**
 * Install the document-level click capture listener. Called by the
 * generated client entry (before any island module loads) and by
 * `hydrateOpenElement` for third-party runtimes.
 */
export function ensurePreHydrationClickCapture(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener('click', (event) => {
    if (!isNodeLike(event.target)) return;
    if (typeof event.composedPath !== 'function') return;
    const path = event.composedPath();
    const host = pendingHostFromPath(path);
    if (!host || flushedHosts.has(host)) return;
    let queue = pendingClicks.get(host);
    if (!queue) {
      queue = [];
      pendingClicks.set(host, queue);
    }
    queue.push({ event, target: path[0] ?? event.target });
  }, true);
}

/**
 * Replay clicks that landed inside `host` before it hydrated.
 *
 * Call right after the host's event bindings are live: element-managed
 * hosts after `markSelfHydrated` (DSD/CSR/light paths), and hosts hydrated
 * by `hydrateOpenElement`. Re-dispatching the original event on its target
 * runs the now-bound native handler exactly once; the capture listener skips
 * it because the host is flushed before replay.
 */
export function flushPendingClicks(host: Element): void {
  flushedHosts.add(host);
  const queue = pendingClicks.get(host);
  if (!queue) return;
  pendingClicks.delete(host);
  for (const pending of queue) {
    // Dispatch on the ORIGINAL target (captured at record time), not
    // `event.target`: at the document level the browser retargets target to
    // the outermost shadow host, so dispatching there would never reach the
    // island's own handler.
    if (isNodeLike(pending.target)) {
      pending.target.dispatchEvent(pending.event);
    }
  }
}

/** Test hook: whether the capture listener is installed. */
export function isPreHydrationClickCaptureInstalled(): boolean {
  return installed;
}
