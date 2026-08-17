interface ClassListLike {
  contains(token: string): boolean;
}

interface MenuPathEntry {
  classList?: ClassListLike;
  tagName?: string;
}

export function shouldDismissMobileMenu(path: readonly unknown[]): boolean {
  return path.some((entry) => {
    const element = entry as MenuPathEntry;
    return element.classList?.contains('mobile-backdrop') === true || element.tagName === 'A';
  });
}

export function isMobileMenuToggle(path: readonly unknown[]): boolean {
  return path.some((entry) => {
    const element = entry as MenuPathEntry;
    return element.classList?.contains('mobile-menu-btn') === true;
  });
}

export function setMobileMenuState(host: HTMLElement, open: boolean): void {
  host.toggleAttribute('menu-open', open);
  const main = host.shadowRoot?.querySelector('.layout-main');
  main?.toggleAttribute('inert', open);
}

export function propagateLayoutTheme(root: Element | ShadowRoot, theme: string): void {
  root.querySelectorAll('*').forEach((element) => {
    if (element.tagName.includes('-')) element.setAttribute('data-theme', theme);
    if (element.shadowRoot) propagateLayoutTheme(element.shadowRoot, theme);
  });
}

export interface LayoutScrollEnvironment {
  readonly scrollY: number;
  addEventListener(type: 'scroll', listener: () => void, options: { passive: boolean }): void;
  removeEventListener(type: 'scroll', listener: () => void): void;
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
}

interface LayoutScrollHeader {
  classList: { toggle(token: string, force?: boolean): boolean | void };
}

export function installLayoutScrollState(
  environment: LayoutScrollEnvironment,
  getHeader: () => LayoutScrollHeader | null | undefined,
): () => void {
  let pending: number | undefined;
  const onScroll = () => {
    if (pending !== undefined) return;
    pending = environment.setTimeout(() => {
      getHeader()?.classList.toggle('scrolled', environment.scrollY > 0);
      pending = undefined;
    }, 100);
  };

  environment.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    environment.removeEventListener('scroll', onScroll);
    if (pending !== undefined) environment.clearTimeout(pending);
  };
}
