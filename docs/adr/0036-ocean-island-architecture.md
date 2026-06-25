# ADR-0036: Ocean-Island Architecture for v0.20.0

> **Status**: ACCEPTED / IMPLEMENTED
> **Date**: 2026-05-20 (updated 2026-05-21)
> **Author**: 齐活林（Delivery Director）with 许清楚（PM）+ 高见远（Architect）
> **Key Amendment**: ADR-0036a — StyleSheet cross-environment shim (2026-05-21)
> **Supersedes**: v0.20.0-prd.md, v0.20.0-architecture.md（merged into this ADR）

---

## 1. Context

### 1.1 Current State (v0.19.x)

LessJS components (`@openelement/ui`) are built on **Lit + DsdLitElement**:

```typescript
// 当前：Lit 依赖
class LessButton extends DsdLitElement {
  static override styles = [lessDesignTokens, css`...`]; // Lit CSSResult
  override render() {
    if (this._dsdHydrated) return nothing; // hack!
    return html`<button @click=${fn}>...`; // Lit TemplateResult
  }
}
```

### 1.2 Core Conflict

```
Lit assumes:          render() = DOM source of truth
DSD reality:          <template shadowrootmode="open"> already has final DOM

Result:
  ✗ render() returns nothing in DSD path    (hack)
  ✗ @click stripped during SSR              (needs hydrateEvents instead)
  ✗ Lit DOM diffing never fires             (wasted 6KB gzip)
  ✗ Lit template engine bypassed entirely   (wasted abstraction)
```

### 1.3 Why Now

| # | Problem                                                | Impact                        |
| - | ------------------------------------------------------ | ----------------------------- |
| ① | `render()` hack (`_dsdHydrated → nothing`)             | Confusing, maintenance burden |
| ② | `@click` stripped in SSR                               | Two event models coexist      |
| ③ | Lit 6KB gzip wasted                                    | DSD never uses Lit's core     |
| ④ | Can't use FAST/Preact for DSD components               | Locked into Lit               |
| ⑤ | 3 CSS approaches (Lit css + inline cssText + CSS vars) | Inconsistent                  |
| ⑥ | `render(): string` already supported by `renderDsd()`  | Pipeline ready                |

---

## 2. Decision

### 2.1 Ocean-Island Architecture

We adopt a **two-layer component model**:

```
┌──────────────────────────────────────────────────────┐
│                    LessJS v0.20.0                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Ocean (~80% of page): DSD components                  │
│  ┌────────────────────────────────────────────────┐  │
│  │  Base: DsdElement (native HTMLElement)           │  │
│  │  render(): string → SSR as DSD template          │  │
│  │  hydrateEvents → declarative event binding       │  │
│  │  StyleSheet (ssr-safe CSSStyleSheet)          │  │
│  │  CSS Parts ::part() → external customization     │  │
│  │  Zero framework dependency                       │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  Island (~20% of page): Pure Islands                   │
│  ┌────────────────────────────────────────────────┐  │
│  │  Framework per need: Lit / FAST / Preact / React │  │
│  │  Strategy: eager / lazy / visible / idle        │  │
│  │  Adapters serve Island SSR only                 │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  CSS Stack (3 layers, all native)                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  Layer 1: Open Props — design tokens             │  │
│  │  Layer 2: StyleSheet — component styles       │  │
│  │  Layer 3: CSS Parts ::part() — external API      │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 2.2 Key Design Decisions

| ID | Decision                                              | Rationale                                                                         |
| -- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| D1 | `DsdElement` in `@openelement/core`                   | Zero deps, co-located with `renderDsd()`                                          |
| D2 | `render(): string`                                    | Already supported by `renderDsd()` line 177-181                                   |
| D3 | `StyleSheet` for styles (SSR-safe CSSStyleSheet shim) | Native API in browser, shim in Deno/Node                                          |
| D4 | Open Props for tokens                                 | Replace ~100 lines of custom token code                                           |
| D5 | `hydrateEvents` preserved → **DEPRECATED v0.21.0**    | Superseded by `@click` in `html` templates (ADR-0039). See SOP-006 for migration. |
| D6 | `@openelement/adapter-lit` retained                   | v0.20 keeps compatibility; v0.21 deprecates DSD path                              |
| D7 | `less-hero-ping` migrated to DsdElement               | OBE: fully migrated in SOP-017 convergence pass                                   |
| D8 | CSS Parts on every component                          | Standard WC external styling API                                                  |

### 2.3 What Changes

| v0.19 (Current)                        | v0.20 (Target)                                       |
| -------------------------------------- | ---------------------------------------------------- |
| `DsdLitElement` (Lit base)             | `DsdElement` (HTMLElement base)                      |
| `render() → TemplateResult`            | `render() → string`                                  |
| `css\`...\`` (Lit)                     | `CSSStyleSheet + replaceSync()`                      |
| `static properties` + `updated()`      | `observedAttributes` + `attributeChangedCallback`    |
| `@click` (SSR stripped)                | `hydrateEvents` (v0.20) → `@click` in `html` (v0.21) |
| `color-values.ts` + `design-tokens.ts` | Open Props (zero maintenance)                        |
| Inline `cssText` (less-search)         | `CSSStyleSheet`                                      |

### 2.4 What Stays the Same

- `renderDsd()` and `wrapDsdOutput()` — already support `render(): string`
- `hydrateEvents` protocol — **deprecated in v0.21.0**, replaced by `@click` in `html` templates (ADR-0039, SOP-006)
- `adapter-registry` — same multi-adapter dispatch
- `@openelement/adapter-lit` — retained for Pure Island SSR
- `less-hero-ping` — stays Lit

---

## 3. Architecture Details

### 3.1 DsdElement API Contract

```typescript
// @openelement/core → DsdElement
export class DsdElement extends HTMLElement {
  // === For subclasses to override ===
  static hydrateEvents?: HydrateEventDescriptor[]; // declarative events
  static styles?: CSSStyleSheet | CSSStyleSheet[]; // adopted styles
  static observedAttributes?: string[]; // native reactivity
  static delegatesFocus?: boolean; // focus delegation
  static formAssociated?: boolean; // form participation

  // === DSD state ===
  protected _dsdHydrated: boolean; // DSD pre-populated?

  // === SSR contract (MUST override) ===
  render(): string; // return Shadow DOM HTML

  // === Lifecycle (base handles) ===
  protected createRenderRoot(): ShadowRoot; // DSD detection + style attach
  connectedCallback(): void; // hydrateEvents + CSR fallback
  disconnectedCallback(): void; // cleanup (AbortController)
  attributeChangedCallback(name, old, val): void; // DOM sync

  // === Internals ===
  protected _internals?: ElementInternals; // :state() support
  protected _hydrateEvents(): void; // ported from WithDsdHydration
}
```

### 3.2 SSR Pipeline (Ocean path)

```
DsdElement.render(): string
  → renderDsd() line 177-181: `typeof result === 'string'` → content
  → NEW: CSSStyleSheet extraction (static styles → cssRules → styleCss)
  → wrapDsdOutput(): <template shadowrootmode="open"><style>...</style>...content</template>
  → Client: browser parses DSD → Shadow DOM auto-attached → hydrateEvents()
```

### 3.3 SSR Pipeline (Island path — unchanged)

```
LitElement.render(): TemplateResult
  → registered adapters dispatch (adapter-lit claims it)
  → adapter.render() → HTML string
  → wrapDsdOutput() with DSD template
  → Client: LitElement upgrade → render() fires → reactivity
```

### 3.4 CSS StyleSheet Extraction (new code in `render-dsd.ts`)

```typescript
// Insert BEFORE adapter-based extraction (line 250), ~15 lines:
let styleCss = '';

// Try native DsdElement styles first
const ctor = componentClass as unknown as { styles?: CSSStyleSheet | CSSStyleSheet[] };
if (ctor.styles) {
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  for (const sheet of sheets) {
    try {
      for (const rule of [...sheet.cssRules]) {
        styleCss += rule.cssText + '\n';
      }
    } catch { /* cross-origin sheet, skip */ }
  }
}

// Fallback: registered adapters (Lit, etc.)
if (!styleCss) {
  for (const adapter of getRegisteredAdapters()) {
    // ... existing logic
  }
}
```

### 3.5 Open Props Integration

```
Current:                     v0.20:
color-values.ts (~40 lines)  → DELETE — use Open Props --gray-* series
design-tokens.ts (~30 lines) → DELETE — use Open Props --size-*, --radius-*, etc.
colors.ts (~30 lines)        → DELETE — use --brand (fallback --indigo-6)

SSR mechanics:
  Build-time: extract used Open Props variable values
  Inline into each component's CSSStyleSheet
  CSS Custom Properties naturally pierce Shadow DOM boundaries
```

---

### 3.6 StyleSheet — Cross-Environment CSSStyleSheet Abstraction (ADR-0036a)

`packages/core/src/style-sheet.ts` provides a `StyleSheet` class that auto-detects the environment:

```
Browser:           new StyleSheet()  ===  new CSSStyleSheet()  (zero overhead)
Deno/Node/Worker:  new StyleSheet()  ===  new ShimStyleSheet()  (in-memory)
```

ShimSurface: `replaceSync(css)`, `cssRules: { cssText }[]` — only the subset LessJS needs.
Usage: all component files and `open-props-tokens.ts` use `new StyleSheet()` instead of
`new CSSStyleSheet()`. The SSR pipeline (`render-dsd.ts`) reads `StyleSheetLike` type.

This eliminates the `ReferenceError: CSSStyleSheet is not defined` crash that occurred in
Deno tests, SSR builds, and Node.js environments where the CSSOM is unavailable.

---

### 4.1 Migration Order

| Phase | SOP     | Components                                      | Lines  | Complexity | Time |
| ----- | ------- | ----------------------------------------------- | ------ | ---------- | ---- |
| P0-A  | SOP-004 | less-card, less-callout, less-step-card         | ~256   | 🟢 Low     | 0.7d |
| P0-B  | SOP-005 | less-button, less-input                         | ~505   | 🟡 Med     | 0.8d |
| P1-A  | SOP-006 | less-theme-toggle, less-code-block, less-dialog | ~870   | 🟡 Med     | 1.0d |
| P1-B  | SOP-007 | less-layout                                     | 1202   | 🔴 High    | 1.5d |
| P1-C  | SOP-008 | less-search                                     | 317    | 🔴 High    | 1.0d |
| P1-D  | SOP-009 | less-hero-ping (Island)                         | ~80    | N/A        | 0.3d |
| Infra | SOP-001 | DsdElement base class                           | ~150   | 🟢         | 0.5d |
| Infra | SOP-002 | SSR CSSStyleSheet extraction                    | ~15    | 🟢         | 0.3d |
| Infra | SOP-003 | Open Props migration                            | ~100→0 | 🟢         | 0.5d |
| QA    | SOP-010 | CSS Parts coverage                              | all    | 🟢         | 0.5d |
| QA    | SOP-011 | Build & bundle verify                           | —      | 🟢         | 0.3d |
| QA    | SOP-012 | Regression testing                              | all    | 🟡         | 0.5d |

**Total: ~7.5 days** (single dev, sequential)

### 4.2 Dependency Graph

```
SOP-001 (DsdElement)
  ├─→ SOP-002 (SSR extraction)
  ├─→ SOP-003 (Open Props)
  │     ├─→ SOP-004 (Group A: card/callout/step-card)
  │     │     ├─→ SOP-005 (Group B: button/input)
  │     │     │     ├─→ SOP-010 (CSS Parts)
  │     │     │     │     ├─→ SOP-006 (Group C: theme-toggle/code-block/dialog)
  │     │     │     │     │     ├─→ SOP-007 (Group D: layout)
  │     │     │     │     │     │     ├─→ SOP-008 (Group E: search)
  │     │     │     │     │     │     │     ├─→ SOP-009 (Island: hero-ping)
  │     │     │     │     │     │     │     │     ├─→ SOP-011 (Build verify)
  │     │     │     │     │     │     │     │     │     └─→ SOP-012 (Regression)
```

---

## 5. Consequences

### 5.1 Positive

- **Cleaner code**: No `_dsdHydrated → nothing` hack. Render pipeline: one path.
- **Smaller bundle**: Remove Lit 6KB gzip from DSD components (~50% reduction).
- **True framework compatibility**: DSD components are framework-agnostic (anyone can extend `DsdElement`). FAST, Preact, React can all write DSD components.
- **Zero maintenance tokens**: Open Props replaces ~100 lines of custom design token code.
- **Standard CSS API**: `::part()` on every component = consistent external customization.
- **Backward compatible**: `@openelement/adapter-lit` stays. Existing Lit components on other sites using LessJS continue to work.

### 5.2 Negative / Risk

| Risk                                            | Severity | Mitigation                                                                |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `less-layout` (1202 lines) migration complexity | High     | 3-step layered migration: styles → events → state                         |
| `less-search` overlay behavior regression       | Medium   | Keep DOM structure identical, only change how CSS is attached             |
| `attributeChangedCallback` boilerplate          | Low      | ~30 extra lines per interactive component, acceptable                     |
| `@property` Safari support gap                  | Low      | Graceful degradation: no-`@property` = plain CSS vars, same visual result |
| `CSSStyleSheet.cssRules` cross-origin error     | Very Low | Sheets are inline-constructed, never cross-origin                         |

### 5.3 Neutral

- `updated()` → `attributeChangedCallback + _syncDOM()` is more verbose but more explicit
- Less "magic" reactivity — developers see exactly what happens on attribute changes
- `@openelement/adapter-lit` becomes a much smaller, focused package (Island SSR only)

---

## 6. Alternatives Considered

| Alternative                          | Why Rejected                                                                |
| ------------------------------------ | --------------------------------------------------------------------------- |
| **Keep Lit, fix the hack**           | Doesn't solve framework lock-in (④), still wastes 6KB (③)                   |
| **Vanilla Extract**                  | Generates global CSS — fundamental conflict with Shadow DOM encapsulation   |
| **CSS Modules**                      | Same global CSS problem; not designed for Shadow DOM                        |
| **Fast Element as replacement**      | Swaps one framework dependency for another; doesn't solve the root problem  |
| **Svelte/Preact for DSD components** | Same framework lock-in problem; their render pipeline has same DSD conflict |

---

## 7. References

- [ADR-0033: Architecture Positioning (SSG + Islands)](./0033-architecture-positioning-ssg-islands.md)
- [ADR-0035: SSG Resilient Rendering & Visual Overhaul](./0035-ssg-resilient-rendering-visual-overhaul.md)
- SDS-001 through SDS-012: Detailed implementation SOPs in `docs/sop/v0.20.0/`

---

## Appendix A: Before/After Component Comparison

```typescript
// ═══════════ v0.19 (Lit) ═══════════
import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { DsdLitElement } from '@openelement/adapter-lit';
import { lessDesignTokens } from './design-tokens.js';

class LessButton extends DsdLitElement {
  static override styles = [
    lessDesignTokens,
    css`
      :host {
        display: inline-block;
      }
      .btn {
        padding: 8px 16px;
      }
    `,
  ];

  @property({ type: String, reflect: true })
  variant = 'default';
  @property({ type: Boolean, reflect: true })
  disabled = false;

  override render() {
    if (this._dsdHydrated) return nothing; // ← HACK
    return html`
      <button class="btn btn--${this.variant}" ?disabled="${this.disabled}" @click="${this
        ._handleClick}">
        <!-- ← stripped in SSR -->
        <slot></slot>
      </button>
    `;
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('disabled')) this._updateState();
  }
}

// ═══════════ v0.20 (Native DsdElement) ═══════════
import { DsdElement } from '@openelement/core';

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  :host { display: inline-block; }
  .btn {
    padding: var(--size-2) var(--size-4);
    color: var(--gray-9);
    border-radius: var(--radius-2);
  }
  .btn--primary { background: var(--brand, var(--indigo-6)); color: var(--gray-0); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
`);

export class LessButton extends DsdElement {
  static observedAttributes = ['variant', 'size', 'disabled'];
  static styles = sheet;
  static delegatesFocus = true;
  static hydrateEvents = [
    { selector: '.btn', event: 'click', method: '_handleClick' },
  ];

  render(): string {
    const v = this.getAttribute('variant') || 'default';
    const s = this.getAttribute('size') || 'md';
    const d = this.hasAttribute('disabled');
    return `<button class="btn btn--${v} btn--${s}"
      part="control" ${d ? 'disabled' : ''}>
      <slot></slot></button>`;
  }

  attributeChangedCallback(name: string, old: string | null, val: string | null) {
    if (old === val) return;
    this._syncDOM();
  }

  private _syncDOM() {
    const btn = this.shadowRoot?.querySelector('.btn') as HTMLButtonElement | null;
    if (!btn) return;
    const v = this.getAttribute('variant') || 'default';
    const s = this.getAttribute('size') || 'md';
    btn.className = `btn btn--${v} btn--${s}`;
    btn.disabled = this.hasAttribute('disabled');
  }

  private _handleClick() {
    this.dispatchEvent(new CustomEvent('less-click', { bubbles: true, composed: true }));
  }
}
```
