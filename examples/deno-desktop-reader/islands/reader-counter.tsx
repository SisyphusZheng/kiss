/** @jsxImportSource preact */
import { useState } from "preact/hooks";
import { definePreactIsland } from "@openelement/app/preact";

definePreactIsland({
  tagName: "reader-counter",
  render: () => {
    const [count, setCount] = useState(0);
    return (
      <div>
        <button type="button" onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
      </div>
    );
  },
});
