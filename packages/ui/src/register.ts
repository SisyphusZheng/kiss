import { OpenBadge, tagName as badge } from './open-badge.tsx';
import { OpenBrandMark, tagName as brandMark } from './open-brand-mark.tsx';
import { OpenButton, tagName as button } from './open-button.tsx';
import { OpenCallout, tagName as callout } from './open-callout.tsx';
import { OpenCard, tagName as card } from './open-card.tsx';
import { OpenCodeBlock, tagName as codeBlock } from './open-code-block.tsx';
import { OpenDialog, tagName as dialog } from './open-dialog.tsx';
import { OpenDropdown, tagName as dropdown } from './open-dropdown.tsx';
import HeroPing, { tagName as heroPing } from './open-hero-ping.tsx';
import { OpenInput, tagName as input } from './open-input.tsx';
import { OpenLabPanel, tagName as labPanel } from './open-lab-panel.tsx';
import { OpenLabStage, tagName as labStage } from './open-lab-stage.tsx';
import { OpenLayout, tagName as layout } from './open-layout.tsx';
import { OpenModal, tagName as modal } from './open-modal.tsx';
import { OpenStandardsVisual, tagName as standardsVisual } from './open-standards-visual.tsx';
import { OpenStepCard, tagName as stepCard } from './open-step-card.tsx';
import { OpenTabs, tagName as tabs } from './open-tabs.tsx';
import { OpenThemeToggle, tagName as themeToggle } from './open-theme-toggle.tsx';

const COMPONENTS: ReadonlyArray<readonly [string, CustomElementConstructor]> = [
  [badge, OpenBadge],
  [brandMark, OpenBrandMark],
  [button, OpenButton],
  [callout, OpenCallout],
  [card, OpenCard],
  [codeBlock, OpenCodeBlock],
  [dialog, OpenDialog],
  [dropdown, OpenDropdown],
  [heroPing, HeroPing],
  [input, OpenInput],
  [labPanel, OpenLabPanel],
  [labStage, OpenLabStage],
  [layout, OpenLayout],
  [modal, OpenModal],
  [standardsVisual, OpenStandardsVisual],
  [stepCard, OpenStepCard],
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
