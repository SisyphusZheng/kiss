# How openElement compares

openElement occupies a specific niche: a Web Components-native fullstack
framework with a JSX-first authoring layer. Other tools are adjacent or solve a
different slice of the problem.

## Competitors

| Tool    | Role                             | When to choose it over openElement                               |
| ------- | -------------------------------- | ---------------------------------------------------------------- |
| Lit     | Web Components authoring library | You need standalone components, not a fullstack app.             |
| Stencil | WC compiler / design-system tool | You are shipping a component library, not an application.        |
| Enhance | HTML-first WC fullstack peer     | You prefer HTML templates over JSX and islands-driven hydration. |
| Astro   | Content-first app framework      | Web Components are one integration among many.                   |
| Fresh   | Preact-first app framework       | You are building a Preact app, not a WC-native app.              |

## When to choose openElement

- You want DSD-native SSR out of the box, not an opt-in rendering mode.
- You want JSX authoring that compiles to standards-based Custom Elements.
- You need file-based routing, API routes, and islands in the same framework.
- You are targeting Deno Desktop or edge runtimes with the same component model.
