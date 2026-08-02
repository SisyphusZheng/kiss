/**
 * Shared fake HydrationScope stand-in for the CSR/hydration adapter tests
 * (open-element-render.test.ts, open-element-hydration.test.ts). Matches the
 * structural surface both adapters touch; tests cast it across the real scope
 * type. Extracted from the two near-verbatim twins (#845).
 */
export class FakeScope {
  resetCount = 0;
  cached: unknown = '__unset__';
  lifecycleCreated = 0;
  hydrateRoots: unknown[] = [];

  reset(): void {
    this.resetCount++;
  }
  setCachedVNode(vnode: unknown): void {
    this.cached = vnode;
  }
  createLifecycle(): { disposers: Set<() => void> } {
    this.lifecycleCreated++;
    return { disposers: new Set() };
  }
  hydrate(shadowRoot: ShadowRoot): void {
    this.hydrateRoots.push(shadowRoot);
  }
}
