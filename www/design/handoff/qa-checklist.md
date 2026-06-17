# QA Checklist

## Visual

- [ ] Desktop light screenshot shows a composed browser/spec/artifact first viewport.
- [ ] Desktop light screenshot shows `open-lab-stage` and a hint of the next section.
- [ ] Desktop dark screenshot has no light-only panels or unreadable text.
- [ ] Mobile light screenshot has no horizontal overflow.
- [ ] Mobile dark screenshot keeps header, panels, cards, and artifacts consistent.
- [ ] The homepage does not read as a dense card stack.
- [ ] Code and artifact panels remain visually distinct from reading surfaces.
- [ ] Kinetic motion enhances product diagrams without hiding text.
- [ ] Reduced-motion mode disables non-essential animation.
- [ ] No decorative blobs, bokeh, generic SaaS gradients, or external brand mimicry.

## Components

- [ ] Redesigned entry pages use `open-button` for actions.
- [ ] Repeated items use `open-card`.
- [ ] Status labels use `open-badge`.
- [ ] Artifact/spec surfaces use `open-lab-panel`.
- [ ] The hero product object uses `open-lab-stage`.
- [ ] Product graphics use `open-standards-visual`.
- [ ] No `*-linear` components are used by redesigned entry pages.

## Token Contract

- [ ] Redesigned pages import `openPropsTokenSheet`, not `linearTokenSheet`.
- [ ] Page CSS has no hex/rgb/hsl color literals.
- [ ] Page CSS does not define a second `--space-*` or `--radius-md` system.
- [ ] `open-layout` uses `--size-*`, `--radius-*`, and semantic tokens.
- [ ] Letter spacing remains `0` for display and labels.

## Content

- [ ] Homepage H1 is `Web Components full-stack framework.`
- [ ] Product formula is `Elements + UI + Framework + Protocols`.
- [ ] Entry paths expose Guide, API, Architecture, and Roadmap.
- [ ] Roadmap is product truth, not a historical dump.
- [ ] No Hub product promise appears on entry pages.

## Validation

- [ ] Static token scan passes.
- [ ] Minimum build/check passes.
- [ ] AutoFlow dev passes before commit.
- [ ] AutoFlow push passes before normal push.
- [ ] Header nav has visible spacing on desktop.
- [ ] Theme toggle keeps body, layout shell, page panels, and component shadows aligned.
