import type { StyleSheetLike } from './internal/protocol/style-sheet.ts';

/** Owns global styles and document-theme propagation for OpenElement hosts. */
export class OpenElementThemeManager {
  #styles: StyleSheetLike[] = [];
  #connected = new Set<HTMLElement>();
  #observerInstalled = false;

  registerStyles(sheets: unknown | unknown[]): void {
    for (const sheet of Array.isArray(sheets) ? sheets : [sheets]) {
      if (!this.#styles.includes(sheet as StyleSheetLike)) {
        this.#styles.push(sheet as StyleSheetLike);
      }
    }
  }

  getStyles(): StyleSheetLike[] {
    return [...this.#styles];
  }

  resetStyles(): void {
    this.#styles.length = 0;
  }

  applyStyles(root: ShadowRoot, component?: StyleSheetLike | StyleSheetLike[]): void {
    const componentStyles = component ? (Array.isArray(component) ? component : [component]) : [];
    const existing: readonly unknown[] = root.adoptedStyleSheets;
    const styles = [
      ...new Set([
        ...existing,
        ...this.#styles,
        ...componentStyles,
      ]),
    ];
    if (styles.length > 0) root.adoptedStyleSheets = styles as unknown as CSSStyleSheet[];
  }

  connect(host: HTMLElement): void {
    this.#connected.add(host);
    const theme = typeof document === 'undefined'
      ? undefined
      : document.documentElement?.dataset?.theme;
    if (theme && !host.hasAttribute('data-theme')) host.setAttribute('data-theme', theme);
    this.#installObserver();
  }

  disconnect(host: HTMLElement): void {
    this.#connected.delete(host);
  }

  #installObserver(): void {
    if (
      this.#observerInstalled || typeof document === 'undefined' ||
      typeof MutationObserver === 'undefined'
    ) return;
    this.#observerInstalled = true;
    const observer = new MutationObserver((mutations) => {
      if (!mutations.some((m) => m.type === 'attributes' && m.attributeName === 'data-theme')) {
        return;
      }
      const theme = document.documentElement?.dataset?.theme;
      for (const host of this.#connected) {
        if (!host.isConnected) continue;
        if (theme) host.setAttribute('data-theme', theme);
        else host.removeAttribute('data-theme');
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
}
