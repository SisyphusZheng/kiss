# openElement Web Standards Lab Design System

> Version: 2.0.0
> Date: 2026-06-17
> Product line: openElement v0.40.7
> Direction: Web Standards Lab
> Status: Current implementation direction for `www`

This design system replaces the previous Linear-inspired dark marketing skin.
The site should look like a standards lab and documentation workbench: light
surfaces, restrained borders, dark code artifacts, visible route/package maps,
and direct paths into guides, API, architecture, and roadmap truth.

## Quick Navigation

| Section | Path | Description |
| --- | --- | --- |
| Tokens | `tokens/` | Light-first color, type, spacing, radius, and shell tokens |
| Components | `components/` | Button, card, input, nav, badge, and icon behavior specs |
| Specs | `specs/` | Homepage, docs landing, and design-system page specs |
| Handoff | `handoff/` | Migration and QA checklist |
| Mockups | `mockups/` | Legacy generated snapshots, pending regeneration |

## Design Principles

1. Light-first reading surface. Dark is reserved for code, terminal, and artifact panels.
2. Product artifact as visual asset: code, route graph, DSD pipeline, package boundary, browser/spec diagrams.
3. 8px radius or less for interface containers; badges may use pill radius.
4. No negative letter spacing. Type hierarchy comes from size, weight, line-height, and spacing.
5. No decorative blobs, bokeh, or SaaS-gradient hero backgrounds.
6. Sections are open page bands. Cards are for repeated items, examples, and framed tools only.
7. Every major page should point to build path, API surface, architecture contract, or roadmap truth.
8. Product language is `Elements + UI + Framework + Protocols`.
9. Current package language is the v0.40.7 11-package product graph.

## Core Palette

| Token | Value | Use |
| --- | --- | --- |
| `--bg-canvas` | `#f6f8fb` | Page background |
| `--surface-1` | `#ffffff` | Panels, cards, docs blocks |
| `--surface-2` | `#eef2f7` | Secondary surfaces |
| `--surface-3` | `#dfe6ef` | Raised or muted fills |
| `--bg-code` | `#111827` | Code and artifact panels |
| `--text-primary` | `#101828` | Headings and main text |
| `--text-secondary` | `#475467` | Lede and secondary text |
| `--text-muted` | `#667085` | Captions and meta |
| `--color-brand` | `#1d4ed8` | Primary action and links |
| `--color-standards` | `#047857` | Standards/contract accent |
| `--color-warning` | `#b45309` | Planned/warning state |
| `--border` | `rgba(16,24,40,0.12)` | Hairline borders |

## Typography

| Token | Size | Weight | Line Height | Letter Spacing |
| --- | --- | --- | --- | --- |
| Display | 56px | 780 | 1.02 | 0 |
| Page title | 40px | 760 | 1.10 | 0 |
| Section | 28px | 720 | 1.16 | 0 |
| Card title | 18px | 700 | 1.25 | 0 |
| Body | 16px | 400 | 1.65 | 0 |
| Caption | 12px | 800 | 1.45 | 0 |
| Mono | 13px | 500 | 1.55 | 0 |

## Layout Rules

| Surface | Rule |
| --- | --- |
| Header | 64px sticky shell, light translucent background, restrained border |
| Homepage hero | Product statement plus engineering artifact panel in first viewport |
| Docs landing | Reference desk: build, API, architecture, roadmap |
| Roadmap | Product truth, not historical release dump |
| Design system | Current rules and primitives, not a marketing moodboard |
| Prose pages | 760px content width, dark code blocks, light tables/callouts |

## Legacy Assets

The existing `mockups/*.svg`, `mockups/*.png`, and `mockups/generate.mjs` were
generated for the previous dark external-brand direction. They are retained as
legacy artifacts until a new mockup generator is produced for Web Standards Lab.

## Version History

| Version | Date | Changes |
| --- | --- | --- |
| 2.0.0 | 2026-06-17 | Web Standards Lab redesign direction |
| 1.0.0 | 2026-06-16 | Legacy dark external-brand redesign |
