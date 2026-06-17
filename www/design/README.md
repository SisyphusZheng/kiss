# openElement www Design Direction

> Version: 3.1.0
> Date: 2026-06-18
> Product line: openElement v0.40.7
> Direction: Kinetic Standards Lab
> Status: Required implementation spec for `www`

`www` must read like a kinetic standards lab for a Web Components full-stack
framework. The visual asset is the product itself: route graphs, Declarative
Shadow DOM, browser/devtools frames, island hydration diagrams, package
boundaries, API contract sheets, and motion that clarifies how the system works.

## Locked Product Answers

| Question             | Answer                                                           |
| -------------------- | ---------------------------------------------------------------- |
| Product story        | Web Components full-stack framework                              |
| Visual direction     | Kinetic Standards Lab                                            |
| Hero asset           | Browser DevTools + Spec Sheet + Standards Diagram + Route Motion |
| Engineering graphics | DOM tree, route graph, island hydration, package graph           |
| Content model        | Docs-first product site                                          |
| Language order       | English structure first, Chinese later                           |
| Theme policy         | Light and dark are first-class; code/artifact panels stay dark   |
| Token policy         | Strict Open Props and semantic token use only                    |
| Component policy     | `www` composes `@openelement/ui` primitives                      |
| Award benchmark      | Awwwards balance: Design 40, UX/UI 30, Creativity 20, Content 10 |

## Navigation

| Section    | Path          | Description                                          |
| ---------- | ------------- | ---------------------------------------------------- |
| Tokens     | `tokens/`     | Open Props mapping, aliases, and hardcoding ban      |
| Components | `components/` | Required UI primitives and interaction states        |
| Specs      | `specs/`      | Homepage, docs landing, and design-system specs      |
| Handoff    | `handoff/`    | Migration and QA checklist                           |
| Mockups    | `mockups/`    | Legacy snapshots pending regeneration from this spec |

## Art Direction

1. Start with a working interface object, not marketing decoration.
2. Use light reading surfaces, restrained borders, and dark code/artifact frames.
3. Use product diagrams as the signature visual system.
4. Use motion to reveal route, render, DSD, island, and package relationships.
5. Use 8px or smaller radius for interface containers.
6. Use letter spacing `0` for display, headings, labels, badges, and buttons.
7. Avoid decorative blobs, bokeh, oversized gradients, and external brand mimicry.
8. Every page must point to build path, API surface, architecture contract, or roadmap truth.
9. Keep cards for repeated items and framed tools only.

## Motion System

| Motion         | Requirement                                                                          |
| -------------- | ------------------------------------------------------------------------------------ |
| Stage          | `open-lab-stage` owns first-viewport product art and browser/devtools composition    |
| Diagrams       | `open-standards-visual` accepts `motion="auto                                        |
| Interaction    | Hover and scroll-adjacent motion may add lift, scan, pulse, or diagram emphasis only |
| Reduced motion | `prefers-reduced-motion: reduce` disables non-essential animation                    |
| Mobile         | Collapse side panels and reduce kinetic density before text becomes crowded          |

## Implementation Rules

| Rule       | Requirement                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Color      | Use `openPropsTokenSheet` and semantic aliases such as `--bg-base`, `--bg-card`, `--text-primary`, `--border`, `--brand`, `--success`, `--warning`, `--info` |
| Spacing    | Use `--size-*` tokens; page CSS may introduce layout only, not a second spacing system                                                                       |
| Radius     | Use `--radius-*`; interface containers max out at `--radius-2`                                                                                               |
| Components | Buttons, cards, badges, panels, code/spec artifacts, and standards visuals come from `@openelement/ui`                                                       |
| Dark mode  | No page-local light-only surfaces; component shadow roots must use `openPropsTokenSheet`                                                                     |
| Validation | Desktop/mobile screenshots in light and dark, static token scan, and minimum build/check before push                                                         |
| Git gates  | Commit and push must pass normal AutoFlow hooks; no `--no-verify`                                                                                            |

## Screenshot Acceptance

| View          | Requirement                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| Desktop light | First viewport shows product story, kinetic lab stage, and a hint of the next section        |
| Desktop dark  | Dark theme preserves surface hierarchy, artifact contrast, and readable code/spec text       |
| Mobile light  | Hero copy, primary actions, kinetic stage, and proof cards stack without horizontal overflow |
| Mobile dark   | No washed-out surfaces, no hidden text, and no component overlap                             |

## Version History

| Version | Date       | Changes                                                                     |
| ------- | ---------- | --------------------------------------------------------------------------- |
| 3.1.0   | 2026-06-18 | Kinetic Standards Lab, AutoFlow-clean delivery, motion/reduced-motion rules |
| 3.0.0   | 2026-06-17 | Strict Open Props, UI-package-first Awwwards-level redesign                 |
| 2.0.0   | 2026-06-17 | Web Standards Lab direction                                                 |
| 1.0.0   | 2026-06-16 | Legacy dark external-brand direction                                        |
