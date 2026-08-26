/**
 * zag-combobox-shared — imperative Zag Vanilla wiring shared by the
 * shadow/DSD (`zag-combobox`) and light-mode (`zag-combobox-light`) spike
 * islands built for issue #1149.
 *
 * Composition contract under test:
 * - OpenElement owns the TSX structure (renderComboboxStructure), SSR/DSD or
 *   light rendering, and the custom-element lifecycle. The machine starts
 *   only after OpenElement activation (onDsdHydrated / onCsrRendered) and
 *   stops deterministically on disconnect.
 * - Zag owns state, keyboard, focus, ARIA, and collection behavior. Updates
 *   reach the DOM through in-place spreadProps() diffing against the
 *   surviving nodes — never through OpenElement.update() root replacement.
 * - Visuals consume Open Props scale values through --oe-* semantic tokens
 *   (mirroring packages/ui/src/open-props-tokens.css conventions).
 *
 * Zag dependencies resolve ONLY through this fixture's own deno.json import
 * map; no published package manifest references them.
 */

import * as combobox from '@zag-js/combobox';
import { normalizeProps, spreadProps, VanillaMachine } from '@zag-js/vanilla';

export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Cherry is intentionally disabled so the e2e spec can cover disabled options. */
export const COMBOBOX_ITEMS: ComboboxItem[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
];

export interface ZagComboboxSnapshot {
  value: string[];
  valueAsString: string;
  inputValue: string;
  open: boolean;
  highlightedValue: string | null;
  collectionValues: string[];
}

export interface ZagComboboxBinding {
  /**
   * Controlled-prop update path: updateProps() -> subscribe -> spreadProps().
   * Sets value + inputValue together (Zag's documented controlled pattern).
   * Note: getInputProps spreads `defaultValue`, not live `value` — the DOM
   * input text follows on the machine's next syncInputValue transition
   * (open/close), which the e2e spec drives explicitly.
   */
  setControlledValue(value: string): void;
  /** Machine-state snapshot for assertions after controlled updates. */
  snapshot(): ZagComboboxSnapshot;
  /** onValueChange firings since start; the e2e spec uses it to detect duplicated listeners. */
  readonly selectionCount: number;
  stop(): void;
}

interface BindZagComboboxOptions {
  /** Unique machine id; scopes every generated element id inside the scope root. */
  id: string;
  /** Form field name spread onto the input (light-mode form participation). */
  name?: string;
  items: ComboboxItem[];
  /**
   * Where data-part nodes are queried: the island's ShadowRoot (shadow mode)
   * or the host element itself (light mode).
   */
  partsRoot: ParentNode;
  /**
   * Zag scope root for getElementById/activeElement resolution: the island
   * ShadowRoot for the shadow island; host.getRootNode() for the light island
   * (a ShadowRoot when nested in a page, the Document at top level).
   */
  getRootNode(): Document | ShadowRoot | Node;
  onValueChange?(value: string[]): void;
}

export function bindZagCombobox(options: BindZagComboboxOptions): ZagComboboxBinding {
  const { partsRoot } = options;

  // ADR-0142 composition: in-place activation preserves pre-upgrade input
  // values, so seed the machine from the live DOM. Without this, the first
  // spreadProps/syncInputValue pass would reset the input to '' and clobber
  // whatever the user typed before the island chunk loaded.
  const preUpgradeInputValue =
    partsRoot.querySelector<HTMLInputElement>('[data-part="input"]')?.value ?? '';

  let selectionCount = 0;
  // Typeahead filtering is consumer-owned in Zag: onInputValueChange swaps in
  // a filtered collection; renderParts then hides non-matching <li> nodes.
  let visibleItems = options.items;
  const makeCollection = (items: ComboboxItem[]) =>
    combobox.collection<ComboboxItem>({
      items,
      itemToValue: (item) => item.value,
      itemToString: (item) => item.label,
      isItemDisabled: (item) => item.disabled === true,
    });
  const machine = new VanillaMachine(combobox.machine, {
    id: options.id,
    name: options.name,
    collection: makeCollection(options.items),
    defaultInputValue: preUpgradeInputValue,
    getRootNode: () => options.getRootNode(),
    onValueChange(details: { value: string[] }) {
      selectionCount += 1;
      options.onValueChange?.(details.value);
    },
    onInputValueChange(details: { inputValue: string }) {
      const query = details.inputValue.trim().toLowerCase();
      visibleItems = query
        ? options.items.filter((item) => item.label.toLowerCase().includes(query))
        : options.items;
      machine.updateProps({ collection: makeCollection(visibleItems) });
    },
  });

  // spreadProps() diffs against the previous attrs per node (WeakMap-keyed),
  // so every notification patches the surviving SSR/CSR nodes in place. Only
  // the latest cleanup per node is retained for deterministic teardown.
  const cleanups = new Map<Element, () => void>();
  const spread = (el: Element | null, attrs: Record<string, unknown>): void => {
    if (!el) return;
    cleanups.set(el, spreadProps(el, attrs));
  };

  const renderParts = (): void => {
    const api = combobox.connect(machine.service, normalizeProps);
    spread(partsRoot.querySelector('[data-part="root"]'), api.getRootProps());
    spread(partsRoot.querySelector('[data-part="label"]'), api.getLabelProps());
    spread(partsRoot.querySelector('[data-part="control"]'), api.getControlProps());
    spread(partsRoot.querySelector('[data-part="input"]'), api.getInputProps());
    spread(partsRoot.querySelector('[data-part="trigger"]'), api.getTriggerProps());
    spread(partsRoot.querySelector('[data-part="positioner"]'), api.getPositionerProps());
    spread(partsRoot.querySelector('[data-part="content"]'), api.getContentProps());
    for (const item of options.items) {
      const el = partsRoot.querySelector<HTMLElement>(
        `[data-part="item"][data-value="${item.value}"]`,
      );
      if (!el) continue;
      if (!visibleItems.includes(item)) {
        // Filtered out by typeahead: hide and drop the stale spread listeners.
        cleanups.get(el)?.();
        cleanups.delete(el);
        el.hidden = true;
        continue;
      }
      el.hidden = false;
      cleanups.set(el, spreadProps(el, api.getItemProps({ item })));
    }
  };

  const unsubscribe = machine.subscribe(renderParts);
  machine.start();
  // start() publishes synchronously in 1.43.3; the explicit pass keeps the
  // wiring correct even if a future Zag version defers the initial notify.
  renderParts();

  // ADR-0142 composition seam: in-place activation preserves a focus that
  // PREDATES the machine, so no focus event will ever fire for it and the
  // machine would sit in 'idle' ignoring INPUT.CHANGE (idle has no such
  // transition). Sync the machine with the DOM reality at start.
  const scopeRoot = options.getRootNode();
  const activeElement = (scopeRoot as Document | ShadowRoot).activeElement;
  if (activeElement && activeElement === partsRoot.querySelector('[data-part="input"]')) {
    machine.send({ type: 'INPUT.FOCUS' });
  }

  return {
    setControlledValue(value: string): void {
      const item = options.items.find((candidate) => candidate.value === value);
      machine.updateProps({ value: [value], inputValue: item?.label ?? value });
    },
    snapshot() {
      const api = combobox.connect(machine.service, normalizeProps);
      return {
        value: [...api.value],
        valueAsString: api.valueAsString,
        inputValue: api.inputValue,
        open: api.open,
        highlightedValue: api.highlightedValue,
        collectionValues: api.collection.getValues(),
      };
    },
    get selectionCount(): number {
      return selectionCount;
    },
    stop(): void {
      unsubscribe();
      for (const cleanup of cleanups.values()) cleanup();
      cleanups.clear();
      machine.stop();
    },
  };
}

/** Stable structure shared by both island variants; Zag queries by data-part. */
export function renderComboboxStructure(options: { label: string; name?: string }) {
  return (
    <div class='zag-combobox' data-part='root'>
      <label class='zag-combobox-label' data-part='label'>{options.label}</label>
      <div class='zag-combobox-control' data-part='control'>
        <input
          class='zag-combobox-input'
          data-part='input'
          type='text'
          name={options.name}
          placeholder='Type or pick a fruit'
          autocomplete='off'
        />
        <button class='zag-combobox-trigger' data-part='trigger' type='button'>▾</button>
      </div>
      <div class='zag-combobox-positioner' data-part='positioner'>
        <ul class='zag-combobox-content' data-part='content'>
          {COMBOBOX_ITEMS.map((item) => (
            <li
              class='zag-combobox-item'
              data-part='item'
              data-value={item.value}
              data-disabled={item.disabled ? '' : undefined}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Open Props scale subset + --oe-* semantic tokens (values mirror
 * packages/ui/src/open-props-tokens.css). Consumed by the shadow island via
 * `static styles` (:host) and by the light island via an SSR'd <style> node
 * scoped to the component class, since light mode applies no static styles.
 */
export function comboboxTokenCss(hostSelector: string): string {
  return `
${hostSelector} {
  /* Open Props scale subset */
  --size-1: 4px;
  --size-2: 8px;
  --size-3: 12px;
  --gray-0: #f8f9fa;
  --gray-1: #f1f3f5;
  --gray-3: #dee2e6;
  --gray-7: #495057;
  --gray-9: #212529;
  --blue-1: #e7f0fd;
  --blue-6: #228be6;
  --radius-1: 6px;
  --border-size-1: 1px;

  /* --oe-* semantic tokens */
  --oe-bg-surface: var(--gray-0);
  --oe-bg-control: #ffffff;
  --oe-text: var(--gray-9);
  --oe-text-muted: var(--gray-7);
  --oe-border: var(--gray-3);
  --oe-accent: var(--blue-6);
  --oe-highlight-bg: var(--blue-1);

  display: block;
  font-family: system-ui, sans-serif;
  color: var(--oe-text);
}

.zag-combobox {
  display: grid;
  gap: var(--size-1);
  max-width: 320px;
}

.zag-combobox-label {
  font-size: 14px;
  color: var(--oe-text-muted);
}

.zag-combobox-control {
  display: flex;
  gap: var(--size-1);
}

.zag-combobox-input {
  flex: 1;
  padding: var(--size-2) var(--size-3);
  border: var(--border-size-1) solid var(--oe-border);
  border-radius: var(--radius-1);
  background: var(--oe-bg-control);
  color: var(--oe-text);
}

.zag-combobox-input:focus {
  outline: 2px solid var(--oe-accent);
  outline-offset: 1px;
}

.zag-combobox-trigger {
  padding: var(--size-2) var(--size-3);
  border: var(--border-size-1) solid var(--oe-border);
  border-radius: var(--radius-1);
  background: var(--oe-bg-surface);
}

.zag-combobox-content {
  list-style: none;
  margin: 0;
  padding: var(--size-1);
  border: var(--border-size-1) solid var(--oe-border);
  border-radius: var(--radius-1);
  background: var(--oe-bg-control);
}

.zag-combobox-item {
  padding: var(--size-2) var(--size-3);
  border-radius: var(--radius-1);
  cursor: pointer;
}

.zag-combobox-item[data-highlighted] {
  background: var(--oe-highlight-bg);
}

.zag-combobox-item[data-disabled] {
  color: var(--oe-text-muted);
  cursor: not-allowed;
}
`;
}
