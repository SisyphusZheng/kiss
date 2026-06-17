/** @jsxImportSource @openelement/core */
/**
 * Features section — 3×2 grid of open-card-linear cards.
 * Each card: 32px SVG icon (brand color), title, description.
 */
import { StyleSheet, type StyleSheetLike } from "@openelement/core/style-sheet";
import "@openelement/ui/open-card-linear";

export const featuresSheet: StyleSheetLike = new StyleSheet();
featuresSheet.replaceSync(`
  .features-section {
    padding: var(--space-section) var(--space-xl);
  }
  .features-inner {
    max-width: 1200px;
    margin: 0 auto;
  }
  .features-eyebrow {
    font-family: var(--font-sans);
    font-size: var(--font-size-eyebrow);
    font-weight: var(--font-weight-medium);
    color: var(--color-brand);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    margin: 0 0 var(--space-sm);
  }
  .features-headline {
    margin: 0 0 var(--space-xxl);
    font-family: var(--font-sans);
    font-size: var(--font-size-display-md);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight-xs);
    line-height: var(--line-height-headline);
    color: var(--color-text-primary);
    max-width: 680px;
  }
  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-md);
  }
  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--color-brand);
    margin-bottom: var(--space-sm);
  }
  .feature-icon svg {
    width: 32px;
    height: 32px;
    stroke-width: 1.5;
  }
  .feature-title {
    font-family: var(--font-sans);
    font-size: var(--font-size-card-title);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-xs);
  }
  .feature-desc {
    font-family: var(--font-sans);
    font-size: var(--font-size-body-sm);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
    margin: 0;
  }
  @media (max-width: 1024px) {
    .features-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .features-section { padding: var(--space-xxl) var(--space-md); }
    .features-grid { grid-template-columns: 1fr; }
  }
`);

interface Feature {
  icon: unknown;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    title: "Elements-first",
    desc:
      "OpenElement is the future Elements surface; shadow/DSD remains the default render mode.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
    title: "One renderer model",
    desc:
      "JSX becomes VNode IR. SSR, CSR, signals, and events share the same structural model.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    title: "App lifecycle",
    desc:
      "Route params, load context, route metadata, redirect, not-found, and error fallback are explicit app contracts.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Trusted boundary",
    desc:
      "HTML injection is explicit and reserved for pre-sanitized non-interactive content.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: "Gate-proven",
    desc:
      "AutoFlow3, package graph validation, workflow slimming, and Nitro proofs guard the 14-package line.",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    title: "Web standards",
    desc:
      "Custom Elements, Shadow DOM, CSSStyleSheet, URL, fetch, and Web Streams stay at the center.",
  },
];

export function renderFeatures() {
  return (
    <section class="features-section">
      <div class="features-inner">
        <p class="features-eyebrow">Why openElement</p>
        <h2 class="features-headline">
          Static-first Web Components without duplicate render paths.
        </h2>
        <div class="features-grid">
          {features.map((f) => (
            <open-card-linear>
              <span class="feature-icon">{f.icon}</span>
              <h3 class="feature-title">{f.title}</h3>
              <p class="feature-desc">{f.desc}</p>
            </open-card-linear>
          ))}
        </div>
      </div>
    </section>
  );
}
