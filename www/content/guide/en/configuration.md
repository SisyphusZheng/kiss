---
title: 'Configuration'
section: 'Production'
label: 'Configuration'
order: 10
---

# Configuration

openElement is configured through Vite. The root app package is reserved for
authoring helpers; Vite integration uses the `/vite` subpath.

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

The AppShell protocol supports the default shell, no shell, and custom route
layouts. The framework should own the routing contract; applications own the
visual shell.
