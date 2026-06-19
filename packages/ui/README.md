# @openelement/ui

openElement UI product package.

The components are first-party `open-*` Web Components. They are designed to
prove the openElement Elements model with shadow/DSD output, explicit light DOM
where needed, and island upgrade. ADR-0099 makes UI one of the four first-class
products and keeps external UI libraries out of the current default target.

As of v0.40.8, there is **no Linear compatibility layer**. The legacy
`open-*-linear` components and `linear-token-sheet` token sheet have been
removed from the public surface. Use the canonical Open Props components and
`@openelement/ui/open-props-tokens` instead.

## Install

```bash
deno add jsr:@openelement/ui
```

## Components

| Component         | Tag                 | Notes                          |
| ----------------- | ------------------- | ------------------------------ |
| `OpenButton`      | `open-button`       | Button component.              |
| `OpenInput`       | `open-input`        | Input component.               |
| `OpenCard`        | `open-card`         | Content card.                  |
| `OpenCodeBlock`   | `open-code-block`   | Code block with copy behavior. |
| `OpenLayout`      | `open-layout`       | Docs/layout shell.             |
| `OpenThemeToggle` | `open-theme-toggle` | Theme switch island.           |
| `OpenHeroPing`    | `open-hero-ping`    | Status indicator.              |
| `OpenDialog`      | `open-dialog`       | Dialog component.              |
| `OpenCallout`     | `open-callout`      | Callout/notice box.            |
| `OpenStepCard`    | `open-step-card`    | Step card.                     |

## Package Manifest

`@openelement/ui` exports a CEM-compatible `manifest` so openElement can include these
components in package manifest scanning:

```ts
import { openElement } from '@openelement/app/vite';

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
@openelement/ui/open-layout
@openelement/ui/open-step-card
@openelement/ui/open-callout
@openelement/ui/open-theme-toggle
@openelement/ui/open-hero-ping
@openelement/ui/open-dialog
@openelement/ui/open-dropdown
@openelement/ui/open-modal
@openelement/ui/open-tabs
@openelement/ui/open-props-tokens
@openelement/ui/daisy-classes
```

## License

MIT
