# Design language v2 mockups

The v2 direction for the openElement site, authored 2026-07-25 against the
v0.41.0 stable line. It keeps the cinematic Web Standards Lab identity
(ink canvas, violet accent, `<open/>` mark, floating pixels, grid hairlines)
and fixes the diagnosed shortcomings of the alpha-era design.

Files (SVG source + rendered PNG, 1440px wide unless noted):

- `v2-01-homepage-hero` — new hero: mono/serif type pairing and the element
  cross-section (host / shadow root / core) as the signature artifact,
  replacing the vinyl record.
- `v2-02-homepage-fullpage` — full scroll story with varied section rhythm:
  split code scene, full-bleed DSD transformation panel, four island
  strategy cards, output targets with a stats strip, and the Begin scene.
- `v2-03-guide-page` — reading-page density fix: compact meta header,
  content and the card grid visible on the first screen.
- `v2-04-architecture-page` — hero title column hard-capped so artifact
  panels can never clip the title (the alpha-line overlap bug).
- `v2-05-mobile-home` — 390×844 composition, designed separately from
  desktop (900×930 canvas including annotations).
- `v2-06-design-system` — the language sheet: mono 800 + Instrument Serif
  italic pairing rules, violet-on-ink ramps, pill/card/callout/terminal
  components, and the signature-elements contract.

Design rules that make this v2 (enforced in `v2-06`):

1. Two voices only: JetBrains Mono for everything structural, Instrument
   Serif italic for one accent phrase per composition. No third typeface.
2. Dark ink is the brand theme; light mode is a supported reading theme.
3. The element cross-section is the only hero artifact — it tells the DSD
   story instead of decorating it.
4. Sections vary composition (split / full-bleed / card grid / stats /
   centered); no two adjacent scenes share a layout.
5. Cards keep the alpha-line signature top edge-highlight.

Render: screenshot the SVGs with Playwright at native size (see the QA
notes in the v2 review thread); the older `../generate.mjs` pipeline is
broken and describes the retired indigo direction — do not use it for v2.
