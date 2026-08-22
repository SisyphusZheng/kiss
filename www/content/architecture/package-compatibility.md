---
title: 'Package Compatibility'
lede: 'OpenElement treats third-party Custom Elements as standards-based dependencies. Current builds use explicit package-island configuration and available Custom Elements Manifest metadata for SSR admission.'
order: 90
---

## Current contract

`@openelement/element` owns authoring; `app` and `adapter-vite` keep application and build behavior separate.

## Explicit admission

Known packages can be configured as package islands and use available CEM metadata without importing retired package surfaces.

## Roadmap diagnostics

Universal DSD/light/client-only classification and hydration-mismatch diagnostics are `0.43` roadmap work, not a current market claim.
