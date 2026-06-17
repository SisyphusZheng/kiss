/** @jsxImportSource @openelement/core */
/**
 * Showcase section — surface-1 background with tab switcher.
 * Three tabs: JSX / DSD / DOM — switching text-only code samples.
 */
import { StyleSheet, type StyleSheetLike } from "@openelement/core/style-sheet";
import "@openelement/ui/open-card-linear";

export const showcaseSheet: StyleSheetLike = new StyleSheet();
showcaseSheet.replaceSync(`
  .showcase-section {
    background: var(--surface-1);
    padding: var(--space-section) var(--space-xl);
  }
  .showcase-inner {
    max-width: 1200px;
    margin: 0 auto;
  }
  .showcase-eyebrow {
    font-family: var(--font-sans);
    font-size: var(--font-size-eyebrow);
    font-weight: var(--font-weight-medium);
    color: var(--color-brand);
    letter-spacing: var(--letter-spacing-wide);
    text-transform: uppercase;
    margin: 0 0 var(--space-sm);
  }
  .showcase-headline {
    margin: 0 0 var(--space-xs);
    font-family: var(--font-sans);
    font-size: var(--font-size-display-md);
    font-weight: var(--font-weight-semibold);
    letter-spacing: var(--letter-spacing-tight-xs);
    line-height: var(--line-height-headline);
    color: var(--color-text-primary);
  }
  .showcase-subhead {
    margin: 0 0 var(--space-xxl);
    font-family: var(--font-sans);
    font-size: var(--font-size-body-lg);
    font-weight: var(--font-weight-regular);
    color: var(--color-text-secondary);
    line-height: var(--line-height-normal);
  }
  .showcase-panel {
    overflow: hidden;
  }
  .showcase-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
    background: var(--surface-2);
  }
  .showcase-tab {
    font-family: var(--font-sans);
    font-size: var(--font-size-button);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .showcase-tab:hover {
    color: var(--color-text-primary);
  }
  .showcase-tab--active {
    color: var(--color-text-primary);
    border-bottom-color: var(--color-brand);
  }
  .showcase-body {
    padding: var(--space-lg);
    font-family: var(--font-mono);
    font-size: var(--font-size-mono);
    line-height: 1.6;
    color: var(--color-text-secondary);
    background: var(--surface-2);
    white-space: pre;
    overflow-x: auto;
    min-height: 200px;
  }
  .showcase-body code {
    font-family: var(--font-mono);
  }
  .kw { color: #c792ea; }
  .str { color: #c3e88d; }
  .fn { color: #82aaff; }
  .cm { color: #546e7a; }
  .pn { color: #89ddff; }
  @media (max-width: 768px) {
    .showcase-section { padding: var(--space-xxl) var(--space-md); }
  }
`);

const TAB_JSX = 0;
const TAB_DSD = 1;
const TAB_DOM = 2;

const tabs = ["JSX", "DSD", "DOM"];

const codeSamples: Record<number, string> = {
  [TAB_JSX]: `<span class='cm'>{/* Counter component */}</span>
<span class='kw'>import</span> { OpenElement } <span class='kw'>from</span> <span class='str'>'@openelement/element'</span>;

<span class='kw'>export</span> <span class='kw'>class</span> <span class='fn'>Counter</span> <span class='kw'>extends</span> OpenElement {
  #count = 0;

  <span class='fn'>override render</span>() {
    <span class='kw'>return</span> (
      &lt;div className=<span class='str'>"counter"</span>&gt;
        &lt;span&gt;{this.#count}&lt;/span&gt;
        &lt;button onClick={...}&gt;
          Increment
        &lt;/button&gt;
      &lt;/div&gt;
    );
  }
}`,

  [TAB_DSD]: `{/* Generated Declarative Shadow DOM */}
&lt;template shadowrootmode=<span class='str'>"open"</span>&gt;
  &lt;style&gt;
    .counter { display: flex; }
    button { background: var(--color-brand); }
  &lt;/style&gt;
  &lt;div className=<span class='str'>"counter"</span>&gt;
    &lt;span&gt;0&lt;/span&gt;
    &lt;button&gt;Increment&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;
{/* Zero JavaScript until interaction */}`,

  [TAB_DOM]: `{/* Light DOM after hydration */}
&lt;my-counter&gt;
  #shadow-root (open)
    &lt;div class=<span class='str'>"counter"</span>&gt;
      &lt;span&gt;0&lt;/span&gt;
      &lt;button&gt;Increment&lt;/button&gt;
    &lt;/div&gt;
  &lt;!-- Island script attached --&gt;
&lt;/my-counter&gt;
{/* Same renderer. Same structure. Same event model. */}`,
};

export function renderShowcase(
  activeTab: number,
  onTabChange: (i: number) => void,
) {
  return (
    <section class="showcase-section">
      <div class="showcase-inner">
        <p class="showcase-eyebrow">How it works</p>
        <h2 class="showcase-headline">
          One renderer. Three surfaces. Zero duplicate paths.
        </h2>
        <p class="showcase-subhead">
          Write JSX once. The same VNode pipeline produces DSD for SSR, DOM for
          CSR, and interactive islands on hydration.
        </p>
        <open-card-linear>
          <div slot="header">
            <div class="showcase-tabs">
              {tabs.map((label, i) => (
                <button
                  type="button"
                  class={"showcase-tab" +
                    (i === activeTab ? " showcase-tab--active" : "")}
                  onClick={() => onTabChange(i)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            class="showcase-body"
            // ponytail: trustRenderHtml is the framework's explicit trust
            // boundary for pre-sanitized static HTML in SSR output.
            dangerouslySetInnerHTML={{ __html: codeSamples[activeTab] }}
          />
        </open-card-linear>
      </div>
    </section>
  );
}
