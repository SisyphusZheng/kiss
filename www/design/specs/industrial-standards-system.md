# Industrial Standards System

## Reference

Primary reference: Enerblock, Awwwards site of the day direction.

Observed design language:

- One saturated field color and one near-black ink color.
- Hard engineering grid instead of soft decorative gradients.
- Huge geometric brand mark treated as a product object.
- Short, blunt headlines with no marketing-card hero.
- Real media strip below the hero, then sticky/editorial sections.
- Cards behave like technical sheets: square, bordered, aligned to the grid.

## openElement Translation

This is not a copy of Enerblock. For openElement the same language becomes:

- **Color**: Open Props `--red-6` as the standards signal, `--gray-12` as ink,
  `--gray-0` as paper, `--gray-3` as rule lines.
- **Logo**: open aperture `O` mark. The outside ring is the open platform,
  the inside ring is the Shadow DOM boundary, the right-angle notch is
  `mode: open`, and the two internal rails are the element surface.
- **Hero**: "Web Standards / Productized." Left text column, giant mark on the
  right, code/devtools workbench media strip below.
- **Typography**: one grotesk/system sans, very large hero type, mono only for
  package names and protocol labels.
- **Layout**: visible grid divisions, square edges, no glass cards, no floating
  SaaS panels.

## Site-Wide Rules

- Header, cards, buttons, panels, search, roadmap entries, and docs paths must
  all share square grid construction.
- Light mode should feel like paper plus red ink. Dark mode should feel like
  black console plus red signal.
- Page sections should alternate between red field, paper field, and black media
  field, not many small card walls.
- Motion should use reveal, horizontal scan, and logo rail translation; no
  decorative bokeh or gradient orbs.
- The first viewport must have one dominant mark and one dominant headline.

## Logo Acceptance

- Recognizable at 32px as an `O`, not a generic code glyph.
- Works as black-on-red, black-on-paper, and white-on-black.
- Describes the project goal: Web Components as open, inspectable standards
  boundaries rather than another JavaScript framework glyph.
