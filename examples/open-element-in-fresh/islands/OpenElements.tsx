/** @jsxImportSource preact */

import { useEffect } from 'preact/hooks';

export default function OpenElementsIsland() {
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let unmounted = false;

    Promise.all([
      import('@openelement/ui'),
      import('@openelement/core/hydrate'),
    ]).then(([_, { hydrateOpenElement }]) => {
      if (unmounted) return;
      dispose = hydrateOpenElement(document.body);
    });

    return () => {
      unmounted = true;
      dispose?.();
    };
  }, []);

  return null;
}
