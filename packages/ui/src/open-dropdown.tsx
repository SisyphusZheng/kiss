/**
 * @openelement/ui - open-dropdown
 * Popover-API dropdown with CSS Anchor Positioning placement.
 * The content is a native popover (top layer, built-in light dismiss and
 * focus return); placement anchors to the host, no hand-rolled fallback.
 *
 * v0.44: compiled authoring (ADR-0143). The per-instance anchor name is
 * assigned at activation (SSG renders every page in one process while islands
 * upgrade in arbitrary order, so server and client counters can never agree —
 * component-recipes.ts); the compiled style sink applies it to the content.
 *
 * @slot trigger - Control used to toggle the dropdown
 * @slot - Dropdown content
 * @csspart trigger - Trigger wrapper
 * @csspart content - Popover content
 */
import { computed, OpenElement } from '@openelement/element';
import { element, property } from './compile-decorators.ts';
import { nextInstanceId, overlayRecipe, recipe } from './component-recipes.ts';
import { readInstanceState, writeInstanceState } from './instance-state.ts';

@element('open-dropdown', { root: 'shadow-open' })
export class OpenDropdown extends OpenElement {
  static override styles = [
    overlayRecipe,
    recipe(`
    :host {
      display: inline-block;
    }

    .trigger {
      display: contents;
    }

    .content {
      /* The base inset is the placement fallback for engines without CSS Anchor
         Positioning; it must stay present because Firefox's anchor resolution
         only applies anchor() longhands on top of an explicit inset. */
      position: absolute;
      inset: 100% auto auto 0;
      top: anchor(bottom);
      left: anchor(left);
      min-width: 12rem;
      /* The gap rides on margin-top: calc(anchor() + length) resolves without
         the added length in Firefox. */
      margin: var(--size-2) 0 0;
      padding: var(--size-2);
      font-family: var(--font-sans);
    }
  `),
  ];

  /** #1061: every instance anchors its popover to its own host. */
  @property({ reflect: false, attribute: false })
  anchorName = '';

  /** The content half of the anchor pair, applied via the style sink. */
  @property({ reflect: false, attribute: false, type: String })
  anchorStyle = computed(() => this.anchorName === '' ? '' : `position-anchor: ${this.anchorName}`);

  render() {
    return (
      <div>
        <span
          class='trigger'
          part='trigger'
          onPointerDown={this.onTriggerPointerDown}
          onClick={this.toggle}
        >
          <slot name='trigger'></slot>
        </span>
        <div
          class='overlay content'
          part='content'
          popover='auto'
          style={this.anchorStyle}
        >
          <slot></slot>
        </div>
      </div>
    );
  }

  override onDsdHydrated(): void {
    this.syncAnchorName();
  }

  override onCsrRendered(): void {
    this.syncAnchorName();
  }

  // Both anchor halves must hold a name from the same realm. The SSR markup
  // stays unpositioned until activation (the popover is closed until a user
  // opens it, which requires hydration anyway); at activation the client
  // assigns one realm-unique name to both halves.
  private syncAnchorName(): void {
    if (this.anchorName === '') {
      this.anchorName = `--open-dropdown-trigger-${nextInstanceId()}`;
    }
    this.style.setProperty('anchor-name', this.anchorName);
  }

  private onTriggerPointerDown(): void {
    const content = this.shadowRoot?.querySelector<HTMLElement>('.content');
    writeInstanceState(
      this,
      'openAtPointerDown',
      content?.matches(':popover-open') ?? false,
    );
  }

  private toggle(): void {
    // A mouse click on the trigger is preceded by a pointerdown that natively
    // light-dismisses an open popover; the click that follows must not re-open
    // it. Keyboard/programmatic clicks have no pointerdown and toggle normally.
    const wasOpen = readInstanceState(this, 'openAtPointerDown', () => false);
    writeInstanceState(this, 'openAtPointerDown', false);
    if (wasOpen) return;
    const content = this.shadowRoot?.querySelector<HTMLElement>('.content');
    content?.togglePopover();
  }
}
