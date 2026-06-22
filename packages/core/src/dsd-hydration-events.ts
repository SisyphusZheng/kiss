import type { HydrateEventDescriptor } from '@openelement/protocol/framework';

export function bindHydrateEvents(
  root: ParentNode,
  host: object,
  events: readonly HydrateEventDescriptor[],
  signal: AbortSignal,
): void {
  for (const desc of events) {
    if (desc.method.startsWith('__')) continue;
    const handler = Reflect.get(host, desc.method);
    if (typeof handler !== 'function') continue;

    for (const el of root.querySelectorAll(desc.selector)) {
      el.addEventListener(desc.event, handler.bind(host) as EventListener, { signal });
    }
  }
}
