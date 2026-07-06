# openElement www Design Direction

> Version: 4.0.0
> Date: 2026-06-19
> Product line: openElement v0.41.0-alpha.6
> Direction: Monet Aperture Editorial Lab
> Status: Required implementation spec for `www`

`www` uses one unified art system: Vue-like documentation clarity, Enerblock-like
industrial drafting, the current `<open/>` brand mark, and real openElement
product surfaces. The site must feel designed, but every content claim must come
from the repository, generated metadata, public package surfaces, or current
roadmap/changelog files.

## Locked Layout Rule

| Area                               | Rule                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Homepage hero                      | Full viewport width. This is the only full-width cinematic composition. |
| Homepage middle                    | Centered content container, target width 1120px. Never full width.      |
| Docs/API/Roadmap/Blog/Architecture | Centered readable containers after any page header.                     |
| Footer                             | Aligned to the same site rhythm as content containers.                  |

The user-approved homepage rule is simple: hero may be full width; content after
hero must not be full width and must contain enough real substance.

## Truth Policy

| Page          | Content source                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Homepage      | Product anchors in route code, package concepts, real docs/API/roadmap links.                                                                                |
| Docs          | Generated route metadata and existing guide/architecture routes.                                                                                             |
| API Reference | Real package boundaries and public UI primitives; no invented API signatures.                                                                                |
| Blog index    | `www/app/data/_generated-blog-data.ts` and content frontmatter.                                                                                              |
| Blog article  | The current post payload only. No fake read time, dates, or summaries.                                                                                       |
| Roadmap       | Current roadmap file and required anchors: `v0.41.0-alpha.6`, `v0.41.0-alpha.7`, `v0.41.0-beta.1`, and `Web Components Fullstack Framework + Basic Element`. |
| Changelog     | Root `CHANGELOG.md`.                                                                                                                                         |
| Contributing  | Current contributing route content and repo workflow.                                                                                                        |
| Design System | Real `@openelement/ui` primitives and Open Props semantic tokens.                                                                                            |

Generated mockups are visual references only. They are never a source of truth.

## Page System

### Homepage

- Full-width hero with `<open/>`, route graph, DSD boundary, spec panels.
- Below hero, use a centered editorial container.
- Middle content must include:
  - standards/product model
  - Elements / Routes / Protocols
  - DOM tree / route graph / island hydration / package graph
  - build/code panels
  - developer workflow rail
  - Docs / API / Roadmap reference surfaces
  - live island verification section outside the first viewport

### Docs

- Header area may be expressive, but content below must be constrained.
- Use docs sidebar/navigation as the primary wayfinding.
- Show command/search, route graph, and guide entry surfaces with true links.

### API Reference

- Use one left category rail only.
- Do not add duplicate unclickable `Core / Framework / UI` tabs or chips.
- Content sections describe real package surfaces and real UI primitives.
- A right rail may show on-this-page anchors for current sections only.

### Roadmap

- Use a centered release rail and product truth panels.
- Preserve all SSG smoke anchors and current release-line facts.
- Roadmap visuals explain status; they must not create new commitments.

### Blog

- Blog index is an editorial release and architecture journal.
- Post metadata comes from generated blog data.
- Article pages use a readable article container with a right on-this-page rail.
- Do not invent read times, post summaries, or category counts.

### Architecture / Design System

- Architecture pages use the same reference container and drafting panels.
- Design System shows only real UI primitives:
  `open-brand-mark`, `open-button`, `open-card`, `open-badge`,
  `open-lab-panel`, `open-lab-stage`, `open-standards-visual`,
  `open-theme-toggle`, and related exported primitives.

### Changelog / Contributing / 404

- Remove legacy Linear visual language from public pages.
- Use `openPropsTokenSheet` and current `@openelement/ui` primitives.
- Keep content factual and tied to `CHANGELOG.md` or current route text.

## Art Direction

| Token      | Requirement                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| Color      | Monet purple is the accent, not a page wash.                                     |
| Background | Off-white/light surfaces with drafting lines; dark mode must preserve hierarchy. |
| Typography | Instrument Sans for UI and prose; mono only for code, labels, commands.          |
| Shape      | Interface containers use restrained radii, generally 8px or less.                |
| Graphics   | Use route graphs, package layers, DSD boundaries, and `<open/>` geometry.        |
| Cards      | Use cards for repeated items only; avoid card walls.                             |

## Implementation Rules

| Rule       | Requirement                                                                             |
| ---------- | --------------------------------------------------------------------------------------- |
| Tokens     | `openPropsTokenSheet` and semantic tokens only.                                         |
| Components | `www` composes `@openelement/ui` primitives where practical.                            |
| Legacy     | Public pages should not use `linearTokenSheet` or `open-*-linear`.                      |
| API        | No fake signatures. If an API cannot be verified, describe the package surface instead. |
| Width      | Middle/body content uses `min(..., calc(100% - ...))` container constraints.            |
| Motion     | Motion clarifies diagrams only; reduced motion must remain usable.                      |
| Validation | Build, targeted e2e, visual screenshots, and AutoFlow hooks before push.                |

## Version History

| Version | Date       | Changes                                                                      |
| ------- | ---------- | ---------------------------------------------------------------------------- |
| 4.0.0   | 2026-06-19 | Monet Aperture Editorial Lab, constrained body content, truth-source policy. |
| 3.1.0   | 2026-06-18 | Kinetic Standards Lab and AutoFlow-clean delivery.                           |
| 3.0.0   | 2026-06-17 | Strict Open Props, UI-package-first redesign.                                |
| 2.0.0   | 2026-06-17 | Web Standards Lab direction.                                                 |
| 1.0.0   | 2026-06-16 | Legacy dark external-brand direction.                                        |
