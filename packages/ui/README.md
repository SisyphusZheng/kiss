# @openelement/ui

First-party reference UI package for the OpenElement framework.

The components are first-party `open-*` Web Components. They are designed to
prove the OpenElement authoring model with shadow/DSD output, explicit light DOM
where needed, and island upgrade. UI is a supporting reference surface, not a
separate application-framework promise.

As of v0.40.8, there is **no Linear compatibility layer**. The legacy
`open-*-linear` components and `linear-token-sheet` token sheet have been
removed from the public surface. Use the canonical Open Props components and
`@openelement/ui/open-props-tokens` instead.

## Install

```bash
npm install @openelement/ui
```

## Components

| Component         | Tag                 | Notes                          |
| ----------------- | ------------------- | ------------------------------ |
| `OpenButton`      | `open-button`       | Button component.              |
| `OpenInput`       | `open-input`        | Input component.               |
| `OpenCard`        | `open-card`         | Content card.                  |
| `OpenCodeBlock`   | `open-code-block`   | Code block with copy behavior. |
| `OpenThemeToggle` | `open-theme-toggle` | Theme switch island.           |
| `OpenDialog`      | `open-dialog`       | Modal/non-modal dialog.        |
| `OpenCallout`     | `open-callout`      | Callout/notice box.            |
| `OpenDropdown`    | `open-dropdown`     | Popover-first dropdown.        |
| `OpenTabs`        | `open-tabs`         | Accessible tab interface.      |

## Layering contract

Dependencies flow in one direction:

```text
audited Open Props subset
  -> semantic tokens
    -> component recipes
      -> Web Component primitives
```

Tokens contain shared style values and classes and import no components.
Primitives may consume tokens but never composites. Composites may compose
primitives and tokens. `OpenLayout` owns only reusable layout, theme,
keyboard, and accessibility behavior; application routing and document
navigation belongs to `@openelement/app`.

Existing per-component imports remain stable across this layering change.

## Package Manifest

`@openelement/ui` exports a CEM-compatible `manifest` so openElement can include these
components in package manifest scanning:

```ts
import { openElement } from '@openelement/adapter-vite';

export default {
  plugins: [
    openElement({
      packageIslands: ['@openelement/ui'],
    }),
  ],
};
```

The manifest includes attributes, events, slots, CSS parts, SSR renderability,
DSD behavior, and hydration strategy metadata.

## Subpath Exports

```text
@openelement/ui/open-button
@openelement/ui/open-input
@openelement/ui/open-card
@openelement/ui/open-code-block
@openelement/ui/open-callout
@openelement/ui/open-theme-toggle
@openelement/ui/open-dialog
@openelement/ui/open-dropdown
@openelement/ui/open-tabs
@openelement/ui/open-props-tokens
```

## License

MIT
