# openElement www Design Direction

> Version: 3.0.0
> Date: 2026-06-17
> Product line: openElement v0.40.7
> Direction: Web Standards Lab
> Status: Required implementation spec for `www`

`www` must read like a standards lab for a Web Components full-stack framework.
The visual asset is the product itself: route graphs, Declarative Shadow DOM,
browser/devtools frames, island hydration diagrams, package boundaries, and API
contract sheets.

## Locked Product Answers

| Question | Answer |
| --- | --- |
| Product story | Web Components full-stack framework |
| Visual direction | Web Standards Lab |
| Hero asset | Browser DevTools + Spec Sheet + Standards Diagram |
| Engineering graphics | DOM tree, route graph, island hydration, package graph |
| Content model | Docs-first product site |
| Language order | English structure first, Chinese later |
| Theme policy | Light and dark are first-class; code/artifact panels stay dark |
| Token policy | Strict Open Props and semantic token use only |
| Component policy | `www` composes `@openelement/ui` primitives |

## Navigation

| Section | Path | Description |
| --- | --- | --- |
| Tokens | `tokens/` | Open Props mapping, aliases, and hardcoding ban |
| Components | `components/` | Required UI primitives and interaction states |
| Specs | `specs/` | Homepage, docs landing, and design-system specs |
| Handoff | `handoff/` | Migration and QA checklist |
| Mockups | `mockups/` | Legacy snapshots pending regeneration from this spec |

## Art Direction

1. Start with a working interface object, not marketing decoration.
2. Use light reading surfaces, restrained borders, and dark code/artifact frames.
3. Use product diagrams as the signature visual system.
4. Keep cards for repeated items and framed tools only.
5. Use 8px or smaller radius for interface containers.
6. Use letter spacing `0` for display, headings, labels, badges, and buttons.
7. Avoid decorative blobs, bokeh, oversized gradients, and external brand mimicry.
8. Every page must point to build path, API surface, architecture contract, or roadmap truth.

## Implementation Rules

| Rule | Requirement |
| --- | --- |
| Color | Use `openPropsTokenSheet` and semantic aliases such as `--bg-base`, `--bg-card`, `--text-primary`, `--border`, `--brand`, `--success`, `--warning`, `--info` |
| Spacing | Use `--size-*` tokens; page CSS may introduce layout only, not a second spacing system |
| Radius | Use `--radius-*`; interface containers max out at `--radius-2` |
| Components | Buttons, cards, badges, panels, code/spec artifacts, and standards visuals come from `@openelement/ui` |
| Dark mode | No page-local light-only surfaces; component shadow roots must use `openPropsTokenSheet` |
| Validation | Desktop/mobile screenshots in light and dark, static token scan, and minimum build/check before push |

## Version History

| Version | Date | Changes |
| --- | --- | --- |
| 3.0.0 | 2026-06-17 | Strict Open Props, UI-package-first Awwwards-level redesign |
| 2.0.0 | 2026-06-17 | Web Standards Lab direction |
| 1.0.0 | 2026-06-16 | Legacy dark external-brand direction |
