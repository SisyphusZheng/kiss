// Batched Chromium DSD layout fix. Kept separate from HydrationScope because
// this is a browser scheduling concern, not hydration lifecycle state (#1098).
const LAYOUT_FIX_CHUNK_SIZE = 100;
const LAYOUT_FIX_WARN_THRESHOLD = 500;
const layoutFixHosts = new Set<Element>();
let layoutFixScheduled = false;
let layoutFixWarned = false;

function flushLayoutFixHosts(): void {
  layoutFixScheduled = false;
  const chunk: Element[] = [];
  for (const host of layoutFixHosts) {
    chunk.push(host);
    if (chunk.length >= LAYOUT_FIX_CHUNK_SIZE) break;
  }
  for (const host of chunk) {
    layoutFixHosts.delete(host);
    void (host as HTMLElement).offsetHeight;
  }
  if (layoutFixHosts.size === 0) return;
  if (typeof globalThis.requestAnimationFrame === 'function') {
    layoutFixScheduled = true;
    globalThis.requestAnimationFrame(flushLayoutFixHosts);
  } else {
    flushLayoutFixHosts();
  }
}

export function queueLayoutFixHost(host: Element | undefined): void {
  if (!host) return;
  layoutFixHosts.add(host);
  if (layoutFixHosts.size > LAYOUT_FIX_WARN_THRESHOLD && !layoutFixWarned) {
    layoutFixWarned = true;
    console.warn(
      `[openElement] ${layoutFixHosts.size} hosts queued for the DSD layout fix in one frame; ` +
        'a hydration pathology is likely (thousands of elements per frame).',
    );
  }
  if (layoutFixScheduled) return;
  layoutFixScheduled = true;
  if (typeof globalThis.requestAnimationFrame === 'function') {
    globalThis.requestAnimationFrame(flushLayoutFixHosts);
  } else {
    flushLayoutFixHosts();
  }
}
