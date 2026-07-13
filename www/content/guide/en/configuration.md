---
title: 'Configuration'
section: 'Production'
label: 'Configuration'
order: 10
---

# Configuration

OpenElement is configured through Vite with the supported
`@openelement/adapter-vite` root entry. Element and App packages remain focused
on authoring rather than build implementation.

## Minimal Configuration

```ts
import { defineConfig } from 'vite';
import { openElement } from '@openelement/adapter-vite';

export default defineConfig({
  plugins: [openElement()],
});
```

## Common Options

```ts
openElement({
  routesDir: 'app/routes',
  islandsDir: 'app/islands',
  componentsDir: 'app/components',
  packageIslands: ['@openelement/ui'],
});
```

## JSX Runtime

Generated projects configure automatic JSX:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@openelement/element"
  }
}
```

## AppShell

Applications own their visual shell while the framework owns route and render
semantics. Keep shell configuration in the supported adapter options; do not
depend on internal shell or manifest types.

## Product tasks

Generated projects expose the product lifecycle:

```sh
deno task dev
deno task check
deno task test
deno task build
deno task preview
```
