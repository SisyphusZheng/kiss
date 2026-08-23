import { declareObservedAttributes, resolveObservedAttributes } from './internal/core/prop.ts';
import type { StyleSheetLike } from './internal/protocol/style-sheet.ts';
import { OpenElementBase } from './open-element-base.ts';
import { themeManager } from './open-element-styles.ts';

/** Static component configuration shared by every OpenElement subclass. */
export class OpenElementConfiguration extends OpenElementBase {
  static styles?: StyleSheetLike | StyleSheetLike[];
  static renderMode?: 'shadow' | 'light';
  static isErrorBoundary?: boolean;
  static head?: { title?: string; description?: string; ogImage?: string };
  /** @internal — use openPipeline({ island: { upgradeStrategy } }) instead. */
  static client?: { hydrate?: 'load' | 'idle' | 'visible' | 'only' };
  static delegatesFocus?: boolean;
  static formAssociated?: boolean;

  /** Locale set by SSR injection or the `locale` attribute. */
  locale?: string;

  /** Register styles applied to every OpenElement shadow root. */
  static registerGlobalStyles(sheets: unknown | unknown[]): void {
    themeManager.registerStyles(sheets);
  }

  /** Return a snapshot of globally registered styles. */
  static getGlobalStyles(): StyleSheetLike[] {
    return themeManager.getStyles();
  }

  /** Clear global styles; intended for test isolation. */
  static _resetGlobalStyles(): void {
    themeManager.resetStyles();
  }

  /**
   * Union explicitly observed attributes with attributes declared by static
   * props. A subclass class field may still intentionally shadow this accessor.
   */
  static get observedAttributes(): string[] {
    return resolveObservedAttributes(this);
  }

  static set observedAttributes(value: string[] | undefined) {
    declareObservedAttributes(this, value);
  }
}
