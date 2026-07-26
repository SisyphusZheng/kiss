# Design language v3 — View-Source Editorial

The v3 direction for the openElement site, authored 2026-07-25 after the v2
set was reviewed as too conservative. V3 keeps the ink canvas, the violet
ramp, the `<open/>` mark and the edge-highlight cards from the alpha line,
and replaces v2's tidy card-grid rhythm with a spec-sheet editorial system:
type is the visual, decoration is annotation.

Reference frame: Astro's editorial serif tension, Enhance's commitment to a
single extreme voice, Fresh's bold color blocking, and current Awwwards
kinetic-type / oversized-index / full-bleed-inversion devices — translated
into the existing Web Standards Lab identity, not pasted over it.

Files (SVG source + rendered PNG, 1440px wide unless noted):

- `v3-01-homepage-hero` — giant mono caps + oversized serif italic headline,
  spec strip, standards marquee, ghost `<open/>` watermark.
- `v3-02-homepage-fullpage` — the scroll story: outlined `01` anchor, violet
  flood DSD scene, outlined L/I/V/O island strategies, typographic OUTPUT
  rows (NODE shown in the active violet state), serif `Begin.`, footer mark.
- `v3-03-docs-landing` — library index: giant outlined numerals on hairline
  rows.
- `v3-04-guide-page` — template for all 12 guide pages: compact serif
  header, §-clauses, left-margin sidenotes, clause TOC rail.
- `v3-05-architecture-page` — template for the architecture pages: real
  node/edge package graph + ownership clauses; the hero title column is
  hard-capped so panels can never clip it (the alpha-line overlap bug).
- `v3-06-apilist` — surface registry table: package names at display size,
  subpath chips, kind stamps, machine-check footnote.
- `v3-07-roadmap` — version timeline: filled type for shipped/active,
  outlined for planned, serif theme titles.
- `v3-08-changelog` — release registry rows, current release with the violet
  bar, withdrawn artifacts ghosted.
- `v3-09-blog-index` — magazine index: featured dispatch + numbered
  editorial rows.
- `v3-10-blog-post` — article template: serif headline, pull quote, code
  with sidenote, next-dispatch footer.
- `v3-11-contributing` — setup terminal + PR checklist + where-to-help rows.
- `v3-12-404` — outlined giant `404` with one solid glyph.
- `v3-13-mobile-home` — 390×844 in the v3 language (900×960 canvas with
  annotations): scaled giant type, 2×2 spec strip, persistent marquee.
- `v3-14-design-system` — the rules sheet: kinetic type pairing, composition
  devices (outlined indices, flood inversion, marquee), violet-on-ink ramp,
  the annotation system, and component contracts.

The five rules that make this v3 (enforced in `v3-14`):

1. Two voices only, at full volume: JetBrains Mono 800 caps for structure,
   Instrument Serif italic for one oversized accent per composition.
2. Sections are §-numbered like a spec and anchored by giant outlined
   numerals; cropping at the canvas edge is allowed.
3. One full-bleed violet flood scene per page — never two in a row.
4. The standards marquee is the spine between scenes.
5. Cards are demoted to terminals and left-bar callouts; no neat rows of
   three cards anywhere.

The v2 set in `../v2/` is kept as the conservative iteration for contrast;
v3 supersedes it. The legacy `../generate.mjs` pipeline is broken and
describes the retired indigo direction — do not use it.
