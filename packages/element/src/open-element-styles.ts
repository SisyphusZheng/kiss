import type { StyleSheetLike } from './internal/protocol/style-sheet.ts';
import { OpenElementThemeManager } from './open-element-theme.ts';

/**
 * Owns the global style registry and host theme propagation.
 *
 * Extracted from the base class (#904, concern: StyleSheet management).
 * The single themeManager instance serves every OpenElement host; the base
 * class only forwards the public statics to it.
 */
export const themeManager = new OpenElementThemeManager();

export type CompiledStyleRoot = HTMLElement | ShadowRoot;

function asStyleList(
  component?: StyleSheetLike | StyleSheetLike[],
): StyleSheetLike[] {
  return [
    ...new Set([
      ...themeManager.getStyles(),
      ...(component ? (Array.isArray(component) ? component : [component]) : []),
    ]),
  ];
}

function styleText(styles: readonly StyleSheetLike[]): string {
  return styles.flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText)).join('\n');
}

function isShadowRoot(root: CompiledStyleRoot): root is ShadowRoot {
  return typeof ShadowRoot !== 'undefined'
    ? root instanceof ShadowRoot
    : 'host' in root && 'adoptedStyleSheets' in root;
}

/**
 * Owns the style sink for one compiled element activation. Shadow roots use
 * constructable sheets; light DOM uses one document-head style node so the
 * compiled template's child-node claim shape remains untouched.
 */
export class CompiledStyleScope {
  #root?: CompiledStyleRoot;
  #styles: StyleSheetLike[] = [];
  #lightStyle?: HTMLStyleElement;

  connect(root: CompiledStyleRoot, component?: StyleSheetLike | StyleSheetLike[]): void {
    const styles = asStyleList(component);
    if (this.#root !== root) {
      this.#lightStyle?.parentNode?.removeChild(this.#lightStyle);
      this.#lightStyle = undefined;
    }
    this.#root = root;
    this.#styles = styles;

    if (isShadowRoot(root)) {
      if (!('adoptedStyleSheets' in root)) {
        throw new Error('[compiled-styles] shadow root does not support adoptedStyleSheets');
      }
      themeManager.applyStyles(root, component);
      return;
    }

    if (styles.length === 0) {
      this.#lightStyle?.parentNode?.removeChild(this.#lightStyle);
      this.#lightStyle = undefined;
      return;
    }
    const document = root.ownerDocument;
    const parent = document?.head ?? document?.documentElement;
    if (!document?.createElement || !parent) {
      throw new Error('[compiled-styles] light DOM style sink requires an owner document');
    }
    const style = this.#lightStyle ?? document.createElement('style');
    style.setAttribute('data-open-element-compiled-style', '');
    style.textContent = styleText(styles);
    if (style.parentNode !== parent) parent.appendChild(style);
    this.#lightStyle = style;
  }

  adopted(root: CompiledStyleRoot, component?: StyleSheetLike | StyleSheetLike[]): void {
    this.connect(root, component);
  }

  disconnect(): void {
    this.#lightStyle?.parentNode?.removeChild(this.#lightStyle);
    this.#lightStyle = undefined;
    this.#root = undefined;
    this.#styles = [];
  }

  get root(): CompiledStyleRoot | undefined {
    return this.#root;
  }

  get styles(): StyleSheetLike[] {
    return [...this.#styles];
  }
}
