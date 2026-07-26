/**
 * Shared v4 section treatments for guide routes: numbered § section headings
 * and optional left-margin sidenotes. Copy stays unchanged; these classes only
 * restyle existing outline headings and aside paragraphs.
 */
export const guideSectionStyles = `
  .guide-sections {
    counter-reset: guide-section;
  }

  .guide-sections :is(h2, h3)[id]::before {
    counter-increment: guide-section;
    content: "§" counter(guide-section) " — ";
    color: var(--violet-8);
  }

  .sidenote {
    margin: var(--size-4) 0 var(--size-6);
    padding-inline-start: var(--size-3);
    border-inline-start: var(--border-size-2) solid var(--violet-8);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-00);
    line-height: 1.6;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  @media (min-width: 1600px) {
    .sidenote {
      float: inline-start;
      clear: inline-start;
      width: clamp(6.5rem, 8vw, 8rem);
      margin-block: var(--size-1) 0;
      margin-inline-start: calc(-1 * (clamp(6.5rem, 8vw, 8rem) + var(--size-6)));
      padding-inline-start: 0;
      border-inline-start: none;
    }
  }
`;
