/**
 * zag-combobox — #1149 spike island (shadow/DSD variant).
 *
 * OpenElement owns SSR (DSD), the shadow render root, and the lifecycle; the
 * Zag machine starts only after activation (onDsdHydrated on the DSD path,
 * onCsrRendered on the CSR path) and stops in disconnectedCallback. Zag
 * scopes itself to this island's ShadowRoot via getRootNode, so two instances
 * on one page cannot query or collide with each other.
 */
import { defineCustomElement, OpenElement, StyleSheet } from '@openelement/element';
import type { StyleSheetLike } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import {
  bindZagCombobox,
  COMBOBOX_ITEMS,
  comboboxTokenCss,
  renderComboboxStructure,
  type ZagComboboxBinding,
  type ZagComboboxSnapshot,
} from '../components/zag-combobox-shared.tsx';

export const tagName = 'zag-combobox';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true, dsd: true });

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(comboboxTokenCss(':host'));

export default class ZagCombobox extends OpenElement {
  static override styles = [sheet];

  #binding: ZagComboboxBinding | null = null;

  override render() {
    return renderComboboxStructure({ label: 'Shadow fruit' });
  }

  protected override onDsdHydrated(): void {
    this.#startMachine();
  }

  protected override onCsrRendered(): void {
    this.#startMachine();
  }

  override disconnectedCallback(): void {
    this.#binding?.stop();
    this.#binding = null;
    super.disconnectedCallback();
  }

  /** e2e hook for the controlled-prop evidence path (machine.updateProps). */
  demoSetControlledValue(value: string): void {
    this.#binding?.setControlledValue(value);
  }

  /** e2e hook: machine-state snapshot after controlled updates. */
  demoSnapshot(): ZagComboboxSnapshot | null {
    return this.#binding?.snapshot() ?? null;
  }

  /** e2e hook: onValueChange firings since the current machine started. */
  get demoSelectionCount(): number {
    return this.#binding?.selectionCount ?? 0;
  }

  #startMachine(): void {
    if (this.#binding) return;
    const root = this.shadowRoot;
    if (!root) return;
    const id = this.getAttribute('machine-id') ?? tagName;
    this.#binding = bindZagCombobox({
      id,
      items: COMBOBOX_ITEMS,
      partsRoot: root,
      getRootNode: () => root,
      onValueChange: () => {
        // Cross-instance duplicate-listener probe for the e2e spec.
        const globalScope = globalThis as { __zagSelectCounts?: Record<string, number> };
        const counts = (globalScope.__zagSelectCounts ??= {});
        counts[id] = (counts[id] ?? 0) + 1;
      },
    });
  }
}

defineCustomElement(tagName, ZagCombobox);
