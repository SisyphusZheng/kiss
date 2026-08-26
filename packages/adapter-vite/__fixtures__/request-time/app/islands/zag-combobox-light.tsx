/**
 * zag-combobox-light — #1149 spike island (light-mode variant).
 *
 * Light-mode qualification path composing with ADR-0142 (#1148): the SSR'd
 * light subtree carries data-oe-light and is activated in place — node
 * identity, focus, and the pre-upgrade input value survive, and the Zag
 * machine then binds to that surviving DOM (seeding defaultInputValue from
 * the live input, see zag-combobox-shared.tsx). Form participation is real
 * here: the input lives in the same tree as the page's <form>, so a native
 * POST carries the selected value.
 *
 * Light mode applies no static styles, so the Open Props / --oe-* sheet is
 * SSR'd as a raw <style> node scoped to the component root class.
 */
import { defineCustomElement, OpenElement } from '@openelement/element';
import { defineIslandConfig } from '@openelement/app';
import {
  bindZagCombobox,
  COMBOBOX_ITEMS,
  comboboxTokenCss,
  renderComboboxStructure,
  type ZagComboboxBinding,
  type ZagComboboxSnapshot,
} from '../components/zag-combobox-shared.tsx';

export const tagName = 'zag-combobox-light';
export const openElement = defineIslandConfig({ hydrate: 'load', ssr: true });

export default class ZagComboboxLight extends OpenElement {
  static override renderMode = 'light' as const;

  #binding: ZagComboboxBinding | null = null;

  override render() {
    return (
      <div class='zag-combobox-light'>
        <style>{comboboxTokenCss('.zag-combobox-light')}</style>
        {renderComboboxStructure({ label: 'Fruit', name: 'fruit' })}
      </div>
    );
  }

  // Light-mode connections fire onCsrRendered on both the in-place
  // activation path and the CSR path (ADR-0142 lifecycle rule).
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
    const id = this.getAttribute('machine-id') ?? tagName;
    this.#binding = bindZagCombobox({
      id,
      name: 'fruit',
      items: COMBOBOX_ITEMS,
      partsRoot: this,
      // Light mode: the part ids live in the host's root node — a ShadowRoot
      // when nested inside a page, the Document for a top-level host.
      getRootNode: () => this.getRootNode(),
      onValueChange: () => {
        const globalScope = globalThis as { __zagSelectCounts?: Record<string, number> };
        const counts = (globalScope.__zagSelectCounts ??= {});
        counts[id] = (counts[id] ?? 0) + 1;
      },
    });
  }
}

defineCustomElement(tagName, ZagComboboxLight);
