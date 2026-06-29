# ADR-0031: Registry Hub v2 — Component Browser + Full-Stack Usage Workflow

- Status: Proposed
- Date: 2026-05-17
- Target: v0.19.0 (Phase 2)

## Context

v0.19.0 (ADR-0030) delivered the Registry Hub MVP — a searchable package index
with compatibility evidence and CLI submission pipeline. However, user testing
revealed a critical gap: **the Hub shows packages but does not help developers
actually use the components inside them**.

The user's purpose when visiting the Hub is not "browse a catalogue".
Their purpose is: **"I need `<sl-dialog>` in my LessJS page."**

Currently, after finding a package and reading its detail page, a developer
hits a wall:

- `less add` CLI does not exist (v0.18.2 SOP was written but never implemented)
- No component-level drill-down — 39 Shoelace tags are listed as text, not clickable
- No rendered preview for individual components
- No usage examples or code snippets
- No guidance on what happens after installation

### What the User Wants

1. Package → Component drill-down: clicking a component tag opens its own page
2. Each component page shows a **rendered preview** of the component
3. `less add <package>` actually works as a CLI command
4. Each component shows usage example code that the user can copy
5. The entire flow from **discovery to usage** is seamless

### User Personas

#### Persona A: Alex — LessJS Site Builder (Primary)

- **Background**: Frontend developer, knows HTML/CSS/JS, chose LessJS for its
  SSG + DSD approach
- **Goal**: "I need a dialog component for my site. I don't want to write one."
- **Flow**: Browse Hub → Find `@shoelace-style/shoelace` → See `<sl-dialog>`
  → Click it → See rendered preview → Copy usage snippet → `less add shoelace`
  → Paste snippet in route → Build → Done
- **Pain points**: Currently stops dead at "less add shoelace" — no CLI, no
  snippet, no preview

#### Persona B: Bob — WC Package Author (Secondary)

- **Background**: Built a component library, wants it discoverable
- **Goal**: "I want LessJS users to find and use my components."
- **Flow**: Run `less hub submit my-package` → CI validates → PR merges →
  Package appears in Hub → Users can see rendered previews per component
- **Pain points**: Currently no documentation on how to submit; no preview of
  what users will see

#### Persona C: Carol — Framework Evaluator (Discovery)

- **Background**: Evaluating LessJS vs Astro vs Eleventy
- **Goal**: "Does LessJS have a good third-party component ecosystem?"
- **Flow**: Browse Hub → See richness of packages → See that components have
  rendered previews and usage docs → Confident that ecosystem is healthy
- **Pain points**: Empty Hub looks dead; no way to evaluate quality

#### Persona D: Dave — Casual Browser (Long Tail)

- **Background**: Heard about Web Components, wants to see what's possible
- **Goal**: "What kind of components can I use on the web today?"
- **Flow**: Browse Hub → Click interesting packages → Click individual
  components → See live previews → Gets inspired
- **Pain points**: Flat text list with no visual feedback

## Decision

**Rebuild the Registry Hub as a three-tier browser (Package → Component → Preview)
with a working `less add` CLI and usage-first detail pages.**

### Tier 1: Package List (Existing, Enhance)

The current `/registry/` index page stays with search, filter, and package
cards. **Enhancements**:

- Show package metrics at a glance (total components, SSR count, client count)
- Add "new" badge for recently submitted packages
- Sort by component count, last updated, compatibility tier

### Tier 2: Package Detail (Existing, Enhance)

The current `/registry/:package` detail page stays. **Enhancements**:

- Each component tag in the list becomes a **clickable link** to its own page
- Add a **"Quick install"** section with the `less add` command and a copy
  button
- Add a **"Usage"** section with a generic usage example for the package
- Show per-component compatibility breakdown (not just package-level)

### Tier 3: Component Detail (New)

**New route**: `/registry/:package/:component`

Example: `/registry/@shoelace-style~shoelace/sl-dialog`

**Page structure**:

1. **Rendered Preview**: SSR snapshot or inline demo of the component
   - SSR-capable components: rendered at build time, embedded as static HTML
   - Client-only components: displayed via iframe snapshot or placeholder
   - The preview is **pre-rendered SSG**, no runtime JS needed
2. **Usage Example**: Copy-paste code snippet showing how to use the component
   - Shows import statement
   - Shows usage in a LessJS route template
   - SSR considerations (wrap in client-only island if needed)
3. **API Reference**: Attributes, events, slots, CSS custom properties
   - Pulled from CEM manifest when available
   - Fallback: basic tag name + compatibility info from hub record
4. **Compatibility**: Per-component tier, validation details
5. **Related Components**: Others in the same package

### Data Flow

```
hub-index/
├── index.json                    ← Search index (exists)
└── packages/
    ├── @shoelace-style/
    │   └── shoelace.json         ← Package record with full tag details (exists)
    └── ...

SSG build:
  scan() → hub-data.ts + hub-data-full.ts (modified to include more detail)
         → [package].ts        = /registry/:package           (enhance)
         → [package]/[component].ts = /registry/:package/:component (new)
```

### SSR Snapshots for Component Previews

Each component record can carry an `ssrSnapshot` field (HTML string, <5KB).
For SSR-capable components:

- Generated during `hub:scan` by rendering the component in isolation
- Embedded directly in the SSG page as static HTML
- For client-only components: a placeholder or a pre-captured screenshot

The snapshot format uses inline HTML in a controlled container:

```html
<div class="component-preview">
  <!-- SSR-rendered HTML of the component -->
  <sl-button variant="primary">Click me</sl-button>
</div>
```

### `less add` CLI Implementation

The v0.18.2 SOP specified the full `less add` flow but was never coded.
For v0.19.1, `less add` becomes real:

1. `less add <package>` resolves the package source (JSR/npm/local)
2. Runs validation (reuse v0.18.1 `validate-manifest` logic)
3. Determines compatibility tier
4. Updates project configuration
5. Registers components for island upgrade (if SSR-capable)
6. Outputs usage instructions

### Component Usage Examples

Hardcoded per well-known package, with a generic fallback:

**Known packages** (Shoelace, Media Chrome, @openelement/ui):
Hand-written, high-quality usage examples with real attribute/event usage.

**Generic fallback** (any unknown package):
Auto-generated from CEM manifest:

```html
<script>
  import 'package-name/register.js';
</script>
<template>
  <my-component attr="value"></my-component>
</template>
```

## Consequences

### Positive

- **Complete user flow**: from discovery to usage in one seamless journey
- **Rendered previews**: users see what they're getting before installing
- **Component-level granularity**: precisely evaluate individual components,
  not just whole packages
- **`less add` CLI closes the final gap**: MVP Hub becomes production-ready
- **Usage examples reduce friction**: copy-paste adoption instead of
  documentation spelunking
- **Static SSG for all tiers**: zero server cost, same architecture as v0.19.0

### Negative

- **Significant scope**: CLI (`less add`) + new routes + preview generation +
  usage examples is more work than a typical patch
- **Snapshot generation**: client-only component previews are harder;
  SSR snapshots require rendering infrastructure during `hub:scan`
- **CEM data dependency**: rich API reference depends on packages publishing
  good `custom-elements.json`; fallback is thin
- **`less add` runs build-time code**: must be careful not to execute
  untrusted package code during validation

### Neutral

- Component detail route pattern (`[package]/[component].ts`) mirrors existing
  `[package].ts` pattern — same SSG approach
- Component previews can grow incrementally: start with SSR-capable snapshots,
  add iframes or lazy-loading for client-only later
- Hardcoded usage examples can be community-contributed over time

## Implementation Priority

| Priority | Item                                        | Depends On                          |
| -------- | ------------------------------------------- | ----------------------------------- |
| P0       | `less add` CLI implementation               | v0.18.2 SOP (exists)                |
| P0       | Component detail route + SSG                | Package detail route (exists)       |
| P0       | Component → Component drill-down link       | Component detail route              |
| P1       | Rendered preview for SSR-capable components | `hub:scan` snapshot generation      |
| P1       | Usage example section on detail pages       | Hub data format                     |
| P2       | API reference from CEM                      | CEM parser (exists in adapter-vite) |
| P2       | Client-only component placeholder preview   | Preview infrastructure              |
| P2       | Richer package list (badges, metrics)       | —                                   |

## Route Design

```
/registry                           → Package list (index.ts, exists)
/registry/:package                  → Package detail ([package].ts, exists)
/registry/:package/:component       → Component detail (NEW, [package]/[component].ts)
```

The `:package` parameter uses `~` as a `/` substitute (e.g., `@openelement~ui` for
`@openelement/ui`), matching the existing convention.

The `:component` parameter is the raw tag name (e.g., `sl-dialog`,
`less-button`).

## Related Artifacts

- Predecessor: ADR-0030 (Hub MVP architecture)
- SOP: `docs/sop/v0.19.1-component-browser.md`
- Status: `docs/status/STATUS.md`
- Route implementation: `www/app/routes/registry/`
- CLI implementation: `packages/hub/src/cli/`
- Conversation record: `docs/conversation/registry-hub-v2-design.md`
