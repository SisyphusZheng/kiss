import { OpenBadge, tagName as badge } from './open-badge.tsx';
import { OpenButton, tagName as button } from './open-button.tsx';
import { OpenCallout, tagName as callout } from './open-callout.tsx';
import { OpenCard, tagName as card } from './open-card.tsx';
import { OpenCodeBlock, tagName as codeBlock } from './open-code-block.tsx';
import { OpenDialog, tagName as dialog } from './open-dialog.tsx';
import { OpenDropdown, tagName as dropdown } from './open-dropdown.tsx';
import { OpenInput, tagName as input } from './open-input.tsx';
import { OpenTabs, tagName as tabs } from './open-tabs.tsx';
import { OpenThemeToggle, tagName as themeToggle } from './open-theme-toggle.tsx';

const COMPONENTS: ReadonlyArray<readonly [string, CustomElementConstructor]> = [
  [badge, OpenBadge],
  [button, OpenButton],
  [callout, OpenCallout],
  [card, OpenCard],
  [codeBlock, OpenCodeBlock],
  [dialog, OpenDialog],
  [dropdown, OpenDropdown],
  [input, OpenInput],
  [tabs, OpenTabs],
  [themeToggle, OpenThemeToggle],
];

/** Explicitly register every first-party UI element. Safe to call repeatedly. */
export function registerOpenUi(
  registry: CustomElementRegistry | undefined = globalThis.customElements,
): void {
  if (!registry) return;
  for (const [tagName, constructor] of COMPONENTS) {
    if (!registry.get(tagName)) registry.define(tagName, constructor);
  }
}
