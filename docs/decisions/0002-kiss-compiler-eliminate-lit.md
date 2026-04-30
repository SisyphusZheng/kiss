# `.kiss` Compiler — Eliminate Lit, Zero Runtime

## Status

**DRAFT** — Proposed for v1.0 roadmap.

## Context

KISS currently depends on `lit` (npm:lit) for component authoring. This brings:

- 58kb gzip runtime (lit-html + @lit/reactive-element + lit-element)
- @lit-labs/ssr for server rendering (with CJS polyfill for node-domexception)
- Hydration ceremony: litElementHydrateSupport must run before customElements.define
- SSR/DSD/hydration trilemma: three rendering paths must stay in sync
- Deno fmt panics on tagged template literals with HTML entities (dprint-core bug)
- Unnecessary type complexity: `noImplicitOverride`, decorators, complex generics

## Proposal

Introduce `.kiss` files — a component format purpose-built for KISS. A compiler transforms `.kiss` files into vanilla Custom Elements at build time. Zero runtime dependency.

### `.kiss` file format

```kiss
<!-- my-counter.kiss -->
<template>
  <button @click="decrement">−</button>
  <span>{count}</span>
  <button @click="increment">+</button>
</template>

<script>
  count = 0
  increment() { this.count++ }
  decrement() { this.count-- }
</script>

<style>
  :host { display: inline-flex; gap: 0.5rem; align-items: center; }
</style>
```

### Compiler output

```ts
// dist/assets/my-counter.js — vanilla Custom Element, 0 deps
const tpl = document.querySelector('#my-counter-template');
class MyCounter extends HTMLElement {
  #count = 0;
  #root = this.attachShadow({ mode: 'open' });
  get count() { return this.#count; }
  set count(v) { this.#count = v; this.#update(); }
  #update() {
    this.#root.querySelector('span').textContent = this.#count;
  }
  connectedCallback() {
    this.#root.append(tpl.content.cloneNode(true));
    this.#root.querySelector('button:first-child')
      .onclick = () => this.count--;
    this.#root.querySelector('button:last-child')
      .onclick = () => this.count++;
  }
}
customElements.define('my-counter', MyCounter);
```

### What the compiler eliminates

| Layer | Before (Lit) | After (.kiss compiler) |
|-------|-------------|----------------------|
| Runtime | 58kb gzip lit | 0kb |
| SSR | @lit-labs/ssr + DOM shim | template.innerHTML (sync) |
| Hydration | DSD + hydrate() + order bug | template.cloneNode (no hydration) |
| Polyfills | node-domexception CJS shim | none needed |
| Build | esbuild decorator transform | standard TS/JS only |
| Tests | need jsdom/puppeteer for Lit | native DOM works everywhere |

### SSG integration

The route scanner (route-scanner.ts) already maps `app/routes/*.ts` → URL paths. Extend it to also scan `.kiss` files:

- `app/routes/blog/hello-world.kiss` → `/blog/hello-world`
- `app/routes/blog.kiss` → `/blog`
- `app/islands/my-counter.kiss` → Island component

Page `.kiss` files render directly (template is the page). Island `.kiss` files get lazy chunk treatment like today's Lit islands.

### Backward compatibility

- `vite.config.ts` option: `compiler: 'lit' | 'kiss' | 'auto'` (auto = `.kiss` files use compiler, `.ts` files use Lit)
- Lit support retained as optional runtime throughout v0.x
- v1.0 defaults to `.kiss` compiler, Lit becomes opt-in

## Consequences

**Positive:**
- Zero JS runtime cost per page
- No hydration bugs (no hydration at all)
- No upstream dependency issues (dprint, node-domexception, parse5)
- Simpler developer API: HTML + minimal script, no class boilerplate
- True tree-shaking: only used components produce code
- SSG becomes synchronous string concatenation

**Negative:**
- Not backward compatible with existing Lit code (migration needed)
- Custom compiler = custom bugs (parser edge cases, sourcemap complexity)
- HMR in dev mode needs special handling (fall back to Lit or implement compiler in watch mode)
- No access to Lit ecosystem components (unless bridge is provided)

## Open Questions

1. Dev mode: run compiler on save, or fall back to Lit runtime for HMR?
2. Islands in `.kiss` format — does the `<script>` get extracted as a lazy module?
3. Slot/projection semantics — full HTML spec compliance needed in template compiler?
4. SSR rendering — `template.innerHTML` is identical to client, but lifecycle hooks (connectedCallback) need SSG treatment
