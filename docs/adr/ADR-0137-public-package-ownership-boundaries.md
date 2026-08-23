# ADR-0137: Public package ownership boundaries

- Status: ACCEPTED (v0.43.1; #1097)
- Amends: ADR-0119 and ADR-0135 public-interface freeze

## Context

The stable package roots still named implementation files below `internal/`.
The element root also exported adapter-specific blog, navigation, i18n and
build-context types, while adapter-vite mirrored the complete element type
surface through `export type *`. This made an internal refactor observable and
let unrelated element additions silently become adapter contracts.

The v0.43.1 architecture review requires those ownership leaks to be corrected
before the v1 surface is frozen. Because five misplaced type exports were on a
stable root, this decision is an explicit narrow amendment to the freeze.

## Decision

1. Package root entries may not name an `internal/` module specifier. Supported
   implementations are exposed through deliberate, named public facade modules.
2. Adapter-vite owns and exports `OpenElementBlogOptions`,
   `OpenElementNavSection`, `OpenElementHeaderNavLink`,
   `OpenElementI18nContextOptions`, and `OpenElementBuildContextLike`.
   The element root no longer exports these five adapter-only contracts.
3. The adapter framework compatibility module uses an explicit type list. Type
   star exports are forbidden there.
4. App's loader/action hooks live in a public source module; the private
   render-context store remains internal.
5. `arch:check` mechanically rejects a regression, and the public-interface
   snapshot records the intentional ownership transfer.

## Compatibility and migration

Runtime behavior and retained symbol shapes do not change. The only consumer
change is the import authority for five build-only types:

```ts
// before
import type { OpenElementBuildContextLike } from '@openelement/element';

// v0.43.1+
import type { OpenElementBuildContextLike } from '@openelement/adapter-vite';
```

This break is preferred to preserving a deprecated alias because an alias would
keep the incorrect element ownership and fail the issue's required surface
reduction. No other element export is removed.

## Consequences

- Internal implementation moves no longer alter package-root specifiers.
- Adapter public types cannot expand when element adds an unrelated export.
- The element surface is narrower by five build/content contracts; adapter-vite
  gains the same explicitly owned names.
- Future root-surface changes still require the normal snapshot and amendment
  process.
