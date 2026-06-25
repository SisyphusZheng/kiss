/** @jsxImportSource preact */

import { useEffect } from "preact/hooks";

export default function OpenElementsIsland() {
  useEffect(() => {
    Promise.all([
      import("@openelement/ui"),
      import("@openelement/core/hydrate"),
    ]).then(([_, { hydrateOpenElement }]) => {
      hydrateOpenElement(document.body);
    });
  }, []);

  return null;
}
