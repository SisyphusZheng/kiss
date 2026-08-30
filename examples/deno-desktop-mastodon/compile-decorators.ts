/** Runtime no-op markers consumed by the v0.44 compiled-element transform. */
export function element(
  _tag: string,
  _options?: { root: 'light' | 'shadow-open' | 'shadow-closed' },
): (target: unknown, context?: unknown) => void {
  return () => undefined;
}
