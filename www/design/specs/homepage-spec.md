# Homepage Spec

## Purpose

The homepage sells the product by showing the product: Web Components,
Declarative Shadow DOM, routes, islands, packages, and public contracts.

## First Viewport

- H1: `Web Components full-stack framework.`
- Left side: product statement, lede, primary/secondary actions.
- Right side: `open-lab-stage emphasis="high" motion="auto"`.
- Below the stage/copy: four compact proof points.
- The first viewport must feel like a browser/devtools/spec workbench, not a
  card stack.
- Desktop first viewport must leave a hint of the Product Matrix section.

## Required Sections

1. Hero with `open-lab-stage` browser/devtools/spec artifact.
2. Four product pillars: Elements, UI, Framework, Protocols.
3. Workflow: Author, Render DSD, Hydrate islands, Serve API, Prove contracts.
4. System map: product matrix and package boundary sketch.
5. Entry paths: Guide, API, Architecture, Roadmap.
6. Closing CTA using `open-button`.

## Component Rules

- Use `open-button` for actions.
- Use `open-card` for repeated proof, pillar, workflow, and entry items.
- Use `open-badge` for state labels.
- Use `open-lab-panel` for spec, route, package, and artifact panels.
- Use `open-standards-visual` for engineering graphics.
- Use `open-lab-stage` for the first-viewport kinetic product object.

## Layout Rules

- Desktop hero: two columns with the visual artifact visible in the first viewport.
- Tablet/mobile hero: stacked, with actions and artifact still above secondary sections.
- Cards are not nested inside cards.
- All colors, spacing, radius, and type come from Open Props or semantic tokens.
- `prefers-reduced-motion` must disable non-essential stage animation.
