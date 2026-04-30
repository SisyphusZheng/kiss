import{c as i,a as s}from"./island-api-consumer-BlPm8Uni.js";const t={"--kiss-bg-base":"#000","--kiss-bg-surface":"#0a0a0a","--kiss-bg-elevated":"#111","--kiss-bg-hover":"#0e0e0e","--kiss-bg-card":"#0a0a0a","--kiss-border":"#1a1a1a","--kiss-border-hover":"#333","--kiss-text-primary":"#fff","--kiss-text-secondary":"#999","--kiss-text-tertiary":"#666","--kiss-text-muted":"#444","--kiss-accent":"#fff","--kiss-accent-dim":"#ccc","--kiss-accent-subtle":"rgba(255, 255, 255, 0.05)","--kiss-code-bg":"#111","--kiss-code-border":"#1a1a1a","--kiss-error":"#e55","--kiss-scrollbar-track":"transparent","--kiss-scrollbar-thumb":"#222"},a={"--kiss-bg-base":"#fff","--kiss-bg-surface":"#fafafa","--kiss-bg-elevated":"#f5f5f5","--kiss-bg-hover":"#f0f0f0","--kiss-bg-card":"#fff","--kiss-border":"#e5e5e5","--kiss-border-hover":"#ccc","--kiss-text-primary":"#000","--kiss-text-secondary":"#555","--kiss-text-tertiary":"#888","--kiss-text-muted":"#aaa","--kiss-accent":"#000","--kiss-accent-dim":"#333","--kiss-accent-subtle":"rgba(0, 0, 0, 0.03)","--kiss-code-bg":"#f5f5f5","--kiss-code-border":"#e5e5e5","--kiss-error":"#c44","--kiss-scrollbar-track":"transparent","--kiss-scrollbar-thumb":"#ccc"};function e(o){return Object.entries(o).map(([r,k])=>`${r}:${k}`).join(";")}const n=s`
  :host,
  :host([data-theme="light"]) {
    ${i(e(a))};
    color-scheme: light;
  }

  :host([data-theme="dark"]) {
    ${i(e(t))};
    color-scheme: dark;
  }
`;`${e(a)}${e(t)}`;const c=s`
  :host {
    /* === Spacing Scale (4px base unit) === */
    --kiss-size-1: 0.25rem; /* 4px */
    --kiss-size-2: 0.375rem; /* 6px */
    --kiss-size-3: 0.5rem; /* 8px */
    --kiss-size-4: 0.75rem; /* 12px */
    --kiss-size-5: 1rem; /* 16px */
    --kiss-size-6: 1.25rem; /* 20px */
    --kiss-size-7: 1.5rem; /* 24px */
    --kiss-size-8: 2rem; /* 32px */
    --kiss-size-9: 2.5rem; /* 40px */
    --kiss-size-10: 3rem; /* 48px */

    /* === Border Radius (Swiss: minimal) === */
    --kiss-radius-sm: 2px;
    --kiss-radius-md: 4px;
    --kiss-radius-lg: 6px;

    /* === Transitions === */
    --kiss-transition-fast: 0.1s ease;
    --kiss-transition-normal: 0.15s ease;
    --kiss-transition-slow: 0.25s ease;

    /* === Z-Index Scale === */
    --kiss-z-dropdown: 100;
    --kiss-z-sticky: 200;
    --kiss-z-fixed: 300;
    --kiss-z-modal-backdrop: 400;
    --kiss-z-modal: 500;
    --kiss-z-popover: 600;
    --kiss-z-tooltip: 700;
  }
`,d=s`
  :host {
    /* === Font Families === */
    --kiss-font-sans:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      Arial,
      sans-serif;
    --kiss-font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;

    /* === Font Sizes (modular scale ~1.125) === */
    --kiss-font-size-xs: 0.6875rem; /* 11px */
    --kiss-font-size-sm: 0.75rem; /* 12px */
    --kiss-font-size-md: 0.875rem; /* 14px */
    --kiss-font-size-lg: 1rem; /* 16px */
    --kiss-font-size-xl: 1.125rem; /* 18px */
    --kiss-font-size-2xl: 1.25rem; /* 20px */
    --kiss-font-size-3xl: 1.5rem; /* 24px */

    /* === Font Weights === */
    --kiss-font-weight-normal: 400;
    --kiss-font-weight-medium: 500;
    --kiss-font-weight-semibold: 600;
    --kiss-font-weight-bold: 700;
    --kiss-font-weight-extrabold: 800;

    /* === Line Heights === */
    --kiss-line-height-tight: 1.2;
    --kiss-line-height-normal: 1.5;
    --kiss-line-height-relaxed: 1.7;

    /* === Letter Spacing === */
    --kiss-letter-spacing-tight: -0.03em;
    --kiss-letter-spacing-normal: 0;
    --kiss-letter-spacing-wide: 0.02em;
    --kiss-letter-spacing-wider: 0.05em;
    --kiss-letter-spacing-widest: 0.15em;
  }
`,l=s`
  :host {
    /* === Box Shadows (subtle, Swiss restraint) === */
    --kiss-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
    --kiss-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15);
    --kiss-shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  /* Dark mode: invert shadow color for elevation on black backgrounds */
  :host([data-theme="dark"]) {
    --kiss-shadow-sm: 0 1px 3px rgba(255, 255, 255, 0.06);
    --kiss-shadow-md: 0 2px 8px rgba(255, 255, 255, 0.09);
    --kiss-shadow-lg: 0 4px 24px rgba(255, 255, 255, 0.12);
  }
`,p=s`
  ${c} ${d}
    ${n}
    ${l};
`;export{p as k};
