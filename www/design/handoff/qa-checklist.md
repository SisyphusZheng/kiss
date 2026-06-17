# QA Checklist

## Visual

- [ ] Default theme is light-first.
- [ ] Page canvas uses `#f6f8fb`.
- [ ] Primary surface uses `#ffffff`.
- [ ] Code/artifact panels use dark background (`#111827` or dark theme equivalent).
- [ ] Brand action color is `#1d4ed8`.
- [ ] Standards/contract accent color is `#047857`.
- [ ] Text hierarchy is clear: primary, secondary, muted.
- [ ] Borders are restrained and visible on light surfaces.
- [ ] No negative letter spacing.
- [ ] No decorative blobs, bokeh, or generic SaaS gradients.

## Components

- [ ] Buttons use 8px radius and no translateY hover motion.
- [ ] Icon/tool buttons use stable square dimensions.
- [ ] Cards use 8px radius or less.
- [ ] Cards are not nested inside other cards.
- [ ] Inputs have stable height and focus-visible outline.
- [ ] Badges are read-only status labels and do not dominate the page.
- [ ] Header is 64px sticky and aligns with mobile drawer offset.

## Layout

- [ ] Homepage first viewport shows product statement and engineering artifact.
- [ ] Docs landing exposes Guide, API, Architecture, Roadmap.
- [ ] Roadmap is concise product truth, not a historical dump.
- [ ] Design-system page documents Web Standards Lab, not Linear style.
- [ ] Prose pages use narrow readable content width.
- [ ] Mobile text does not overflow buttons, cards, or panels.
- [ ] Fixed-format UI has stable dimensions.

## Content

- [ ] Current product formula is `Elements + UI + Framework + Protocols`.
- [ ] Current public graph language is v0.40.7 / 11-package line.
- [ ] No Hub product promise appears on core entry pages.
- [ ] Old package-count claims are not used as current truth.
- [ ] Each major page links to a build path, API surface, architecture contract, or roadmap truth.

## Accessibility

- [ ] WCAG AA contrast for text and interactive controls.
- [ ] Focus-visible is present for links, buttons, inputs, and icon controls.
- [ ] Current navigation state uses `aria-current`.
- [ ] Icon-only controls have accessible labels.
- [ ] Color is not the only carrier of state.

## Validation

- [ ] Visual review desktop, tablet, mobile.
- [ ] Browser review for header, sidebar, mobile nav, and theme toggle.
- [ ] Build output should not include section helper files as standalone routes.
