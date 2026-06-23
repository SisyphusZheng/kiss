---
title: 'Package Compatibility'
section: 'Compatibility'
label: 'Package Compatibility'
order: 10
---

# Package Compatibility

openElement detects and classifies third-party Web Component packages through
their [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)
and the openElement protocol manifest, deciding safely which ones can SSR and
which must stay client-only.

## The Problem

Third-party Web Components come from different ecosystems. Some use Lit, some
use vanilla classes, and some are browser-only with real-DOM dependencies.
openElement does not assume every package is SSR-safe; it reads
`custom-elements.json` and the `@openelement/protocol/manifest` schema to make
informed decisions.

### Reality check: CEM adoption is still low

Some third-party Web Component libraries do not ship a `custom-elements.json`
file. Without a CEM, auto-detection returns no results for these packages, and
they rely on explicit `packageIslands` declarations in `vite.config.ts`.

## 4-Tier Compatibility

| Tier               | Meaning                                                 | Build Behavior                                                       |
| ------------------ | ------------------------------------------------------- | -------------------------------------------------------------------- |
| `ssr-capable`      | Explicit openElement SSR declaration or adapter support | Import in SSR bundle, participate in DSD rendering                   |
| `client-only`      | Browser-only, missing SSR declaration, or no CEM        | Exclude from SSR bundle, emit client registration/hydration metadata |
| `rejected`         | Invalid manifest, duplicate tags, unsafe paths          | Fail before code generation                                          |
| `experimental-dom` | Opt-in DOM simulation candidate                         | Render only when flag is enabled, report all results                 |

## Build-Time Auto-Detection

During the Vite plugin's `buildStart()` phase, openElement scans
`node_modules` for `custom-elements.json` files and applies the
`@openelement/protocol/manifest` rules.

```ts
// Pseudocode
for (const pkg of node_modules) {
  const manifest = await readCustomElementsManifest(pkg);
  const tier = classifyWithProtocol({ manifest, pkg });
  registerPackageIsland({ pkg, tier });
}
```

### Key properties

- **No code execution** — reads JSON only, safe.
- **Scoped package support** — handles `@org/pkg` patterns.
- **Non-fatal** — a corrupted CEM won't break the build.
- **Zero-config** — automatic, no manual declarations needed when a valid
  manifest exists.

## Manifest Validation

Use the `@openelement/protocol/manifest` helpers to validate a package manifest
before wiring it into the build. Invalid manifests are rejected at build time
rather than at runtime.

## Current Site Results

The `www` example site uses `@openelement/ui`, which is auto-detected as
`ssr-capable` through the openElement protocol manifest. Third-party packages
without a CEM still require explicit `packageIslands` declarations in
`vite.config.ts`.

## CEM vs No-CEM Comparison

| Scenario                              | Detection            | Behavior                                  |
| ------------------------------------- | -------------------- | ----------------------------------------- |
| Has CEM + openElement SSR declaration | `ssr-capable`        | Auto-added to SSR bundle                  |
| Has CEM + no SSR declaration          | `client-only`        | Safe fallback, no server rendering        |
| No CEM                                | Empty (not detected) | Manual via `packageIslands`               |
| No CEM + not in packageIslands        | Empty                | Not registered (requires explicit import) |

## Roadmap

- **v0.18.1**: manifest validation helpers in `@openelement/protocol/manifest`.
- **v0.18.2**: explicit `packageIslands` install and configure flow.
- **v0.18.3**: DOM simulation — experimental client-only component rendering.
