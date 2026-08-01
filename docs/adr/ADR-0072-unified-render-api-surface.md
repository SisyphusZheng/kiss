# ADR-0072: Unified Render API Surface — One `renderDsd`, One Entry Point

| Metadata       | Value                                    |
| -------------- | ---------------------------------------- |
| **ADR**        | 0072                                     |
| **Status**     | ACCEPTED                                 |
| **Date**       | 2026-05-31                               |
| **Author**     | Qi (Delivery Director) + Zhi (Architect) |
| **Supersedes** | ADR-0071 § public export surface         |
| **Version**    | v0.28.0                                  |

> Numbering collision: shares ADR-0072 with
> [ADR-0072-mdx-in-lessjs.md](./ADR-0072-mdx-in-lessjs.md) — they are different
> decisions, both retained; cite by filename.

---

## Context

### Current State

ADR-0071 unified the internal rendering pipeline (one VNode traversal instead of two). But the public API surface still exposes three rendering functions and a JSX factory:

```ts
// @openelement/core — root exports (current)
export { renderDsd, renderDsdByName } from './render-dsd.js';
export { renderNestedDsd, renderToString } from './jsx-render-string.js';
export { For, Fragment, jsx, jsxDEV, jsxs, Show } from './jsx-runtime.js';
```

Three rendering functions, each with a different first parameter:

| Function                       | Input           | Purpose                         |
| ------------------------------ | --------------- | ------------------------------- |
| `renderDsd(tag, class, props)` | tagName + class | Direct class rendering          |
| `renderDsdByName(tag, props)`  | tagName only    | Auto-lookup from registry       |
| `renderNestedDsd(vnode)`       | VNode tree      | Tree walk + nested CE rendering |

`renderDsdByName` is a one-line wrapper around `renderDsd`:

```ts
export async function renderDsdByName(tagName, props, ...) {
  const cls = customElements.get(tagName);
  return await renderDsd(tagName, cls, props, ...);
}
```

`renderNestedDsd` is called by `renderDsd` internally and by `entry-renderer.ts` generated code. It's a tree-walk function, not a user-facing concept.

`jsx` is exported from the root entry alongside rendering functions — a category error. JSX factories are compiler protocols, not user APIs.

### Industry Reference

All six surveyed frameworks follow the same pattern:

| Framework            | SSR render functions                                    | Polymorphic input?             | JSX factory in SSR package?         |
| -------------------- | ------------------------------------------------------- | ------------------------------ | ----------------------------------- |
| React 19             | `renderToString`, `renderToReadableStream` (2)          | No — both take ReactElement    | **No** — `createElement` in `react` |
| Vue 3                | `renderToString`, `renderToStream` (2)                  | **Yes** — `App \| VNode`       | **No** — `h()` in `vue`             |
| SolidJS              | `renderToString`, `renderToStringAsync` (2)             | No — both take function→JSX    | **No** — via `solid-js/h` subpath   |
| Fresh                | No public API (0)                                       | N/A                            | N/A                                 |
| SvelteKit            | No public API (0)                                       | N/A                            | N/A                                 |
| Astro                | No public API (0)                                       | N/A                            | N/A                                 |
| **LessJS (current)** | `renderDsd` + `renderDsdByName` + `renderNestedDsd` (3) | **No** — three separate inputs | **Yes** — `jsx` exported from root  |

LessJS is the only framework that exports more than 2 render functions and the only one that exports a JSX factory from its SSR package root.

### Why This Matters

1. **API surface is a promise.** Every exported function is a contract. `renderDsdByName` and `renderNestedDsd` are implementation details that leaked into the contract.
2. **Naming asymmetry.** Users ask "how do I render a component?" and get three answers with subtle differences they must learn.
3. **`jsx` in root is wrong.** Deno's `jsxImportSource` already points to the subpath. Exporting it from root encourages manual `jsx()` calls — a pattern no framework supports.

---

## Decision

### Principle

**One rendering concept, one export name. Implementation details stay internal. JSX factories stay in the compiler protocol layer.**

### Architecture

```ts
// @openelement/core — root exports (target)
export { renderDsd } from './render-dsd.js';  // ONE rendering function
export { renderToString } from './jsx-render-string.js';  // sync string fallback
export { DsdElement, Fragment } from '...';  // component model

// @openelement/core/jsx-runtime — compiler protocol (already exists)
export { jsx, jsxDEV, jsxs } from './jsx-runtime.js';
export { For, Show } from './jsx-runtime.js';

// Internal (not exported from root)
export async function renderDsdTree(vnode) { ... }  // was renderNestedDsd
```

### Key Decisions

1. **`renderDsd(input, props?)` accepts `string | CustomElementConstructor`**

   ```ts
   renderDsd('less-layout', { currentPath: '/' }); // auto-lookup from registry
   renderDsd(LessLayout, { currentPath: '/' }); // direct class
   ```

   When input is a string, `customElements.get()` is called internally. When input is a class, it's used directly. This absorbs `renderDsdByName` into `renderDsd` with zero behavior change.

2. **`renderNestedDsd` renamed to `renderDsdTree`, removed from root export**

   `renderDsdTree` is called internally by `renderDsd` to process the VNode tree returned by `render()`. It's not a user-facing concept — the user asks to "render a component", not to "walk a VNode tree".

3. **`jsx`, `jsxDEV`, `jsxs` removed from root export**

   These remain on `@openelement/core/jsx-runtime` subpath where Deno's `jsxImportSource` expects them. Adapter generated code imports them from the subpath.

4. **`For`, `Show` moved out of root export**

   They remain available on `@openelement/core/jsx-runtime` subpath (alongside `jsx`). This mirrors SolidJS: `<For>` and `<Show>` are control-flow components available from the JSX runtime, not from the root SSR package.

5. **`Fragment` stays in root**

   `<></>` is part of the core component model — it's used in JSX, not a renderer concern. Vue exports `Fragment` from `vue`. React exports `Fragment` from `react`. Both export it from the root package.

### What Gets Removed

| Export                  | From                                 | Reason                                                |
| ----------------------- | ------------------------------------ | ----------------------------------------------------- |
| `renderDsdByName`       | root `index.ts`                      | Absorbed into `renderDsd('tag', props)`               |
| `renderNestedDsd`       | root `index.ts`                      | Hidden as internal `renderDsdTree`                    |
| `jsx`, `jsxDEV`, `jsxs` | root `index.ts`                      | JSX factories belong on jsx-runtime subpath only      |
| `For`, `Show`           | root `index.ts`                      | Control-flow components belong on jsx-runtime subpath |
| `renderDsdByName`       | `entry-renderer.ts` generated export | No longer needed                                      |

### What Gets Added

| Export                                      | Where           | Purpose                  |
| ------------------------------------------- | --------------- | ------------------------ |
| `renderDsd(input: string \| class, props?)` | root `index.ts` | Polymorphic single entry |

---

## Consequences

### Positive

- **API surface**: 3 render functions → 1. Matches Vue's `renderToString(input: App | VNode)` pattern.
- **JSX separation**: `jsx` leaves the root namespace. Matches React (`createElement` in `react`, not `react-dom/server`).
- **Control flow separation**: `For`/`Show` stay on jsx-runtime subpath. Matches SolidJS pattern.
- **Implementation freedom**: `renderDsdTree` can be refactored without breaking the public contract.
- **Entry renderer simplification**: Generated code imports `renderDsd` + `jsx` from their proper locations instead of dumping everything into one `export { ... } from "@openelement/core"`.

### Negative

- **Breaking change**: Users who import `renderDsdByName`, `renderNestedDsd`, or `jsx` from `@openelement/core` root must update. Audit shows **zero user code** does this — all consumers are internal (entry-renderer.ts generated code, tests, and apilist docs).
- **`renderDsd` signature change**: The second parameter changes from required `componentClass` to optional `props`. Internal callers need updating.

### Neutral

- `renderDsdTree` name is bikesheddable. The important thing is it's not exported.
- `@openelement/core/jsx-runtime` subpath already exists and is already used by Deno's `jsxImportSource`.

---

## Implementation

See **SOP-012: Unified Render API Surface** (`docs/sop/v0.27.0/SOP-012-unified-render-api-surface.md`).
