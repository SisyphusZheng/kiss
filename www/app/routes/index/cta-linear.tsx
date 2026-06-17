/** @jsxImportSource @openelement/core */
/**
 * CTA Banner section — call to action with CLI command and primary link.
 */
import { StyleSheet, type StyleSheetLike } from "@openelement/core/style-sheet";
import "@openelement/ui/open-button-linear";
import "@openelement/ui/open-input-linear";

export const ctaSheet: StyleSheetLike = new StyleSheet();
ctaSheet.replaceSync(`
  .cta-section {
    background: var(--bg-canvas);
    padding: var(--space-section) var(--space-xl);
  }
  .cta-inner {
    max-width: 1200px;
    margin: 0 auto;
  }
  .cta-headline {
    margin: 0 0 var(--space-xs);
    font-family: var(--font-sans);
    font-size: var(--font-size-display-md);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight-xs);
    line-height: var(--line-height-headline);
    color: var(--color-text-primary);
  }
  .cta-subhead {
    margin: 0 0 var(--space-lg);
    font-family: var(--font-sans);
    font-size: var(--font-size-subhead);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }
  .cta-cli-row {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }
  .cta-cli-input {
    max-width: 520px;
    width: 100%;
  }
  .cta-action {
    display: flex;
    gap: var(--space-sm);
  }
  @media (max-width: 768px) {
    .cta-section { padding: var(--space-xxl) var(--space-md); }
    .cta-cli-row { flex-direction: column; align-items: flex-start; }
  }
`);

const CLI_VALUE = "deno run -A jsr:@openelement/create my-app";

export function renderCTA() {
  return (
    <section class="cta-section">
      <div class="cta-inner">
        <h2 class="cta-headline">Build with openElement.</h2>
        <p class="cta-subhead">
          Scaffold a new project in seconds.
        </p>
        <div class="cta-cli-row">
          <div class="cta-cli-input">
            <open-input-linear variant="cli" value={CLI_VALUE} copy size="lg" />
          </div>
        </div>
        <div class="cta-action">
          <open-button-linear
            variant="primary"
            href="/guide/getting-started"
            size="lg"
          >
            Read the docs
          </open-button-linear>
        </div>
      </div>
    </section>
  );
}
