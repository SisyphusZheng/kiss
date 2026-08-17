import { assert, assertEquals, assertFalse } from '@std/assert';
import {
  filterNavSections,
  isExternalLayoutUrl,
  isSafeLayoutUrl,
  localeSwitchLabel,
  localeSwitchPath,
  localizeLayoutPath,
  mobileSectionRoot,
} from '../app/site-ui/open-layout-navigation.ts';
import {
  installLayoutScrollState,
  isMobileMenuToggle,
  shouldDismissMobileMenu,
} from '../app/site-ui/open-layout-behaviors.ts';

Deno.test('open-layout navigation rejects executable and protocol-relative URLs', () => {
  assert(isSafeLayoutUrl('/guide'));
  assert(isSafeLayoutUrl('https://github.com/open-element'));
  assertFalse(isSafeLayoutUrl('javascript:alert(1)'));
  assertFalse(isSafeLayoutUrl('//attacker.example/path'));
  assert(isExternalLayoutUrl('https://github.com/open-element'));
  assertFalse(isExternalLayoutUrl('/guide'));
});

Deno.test('open-layout navigation localizes and switches canonical paths', () => {
  assertEquals(localizeLayoutPath('/guide', 'zh', ['en', 'zh'], 'en'), '/zh/guide');
  assertEquals(localizeLayoutPath('/guide', 'en', ['en', 'zh'], 'en'), '/guide');
  assertEquals(localeSwitchPath('/zh/guide', 'zh', ['en', 'zh'], 'en'), '/guide');
  assertEquals(localeSwitchLabel('en'), '中文');
});

Deno.test('open-layout navigation filters only the active section family', () => {
  const sections = [
    { section: 'Quick Start', items: [] },
    { section: 'Reference', items: [] },
    { section: 'History', items: [] },
  ];
  assertEquals(filterNavSections(sections, '/guide/api'), [sections[0]]);
  assertEquals(filterNavSections(sections, '/architecture/dsd'), [sections[1]]);
  assertEquals(filterNavSections(sections, '/roadmap'), sections);
  assertEquals(mobileSectionRoot('/zh/guide/api', ['en', 'zh']), '/guide');
});

Deno.test('open-layout mobile menu dismisses only for backdrop or navigation links', () => {
  const classList = (tokens: string[]) => ({ contains: (token: string) => tokens.includes(token) });
  assert(shouldDismissMobileMenu([{ classList: classList(['mobile-backdrop']) }]));
  assert(shouldDismissMobileMenu([{ tagName: 'A' }]));
  assertFalse(shouldDismissMobileMenu([{ tagName: 'BUTTON' }]));
  assert(isMobileMenuToggle([{ classList: classList(['mobile-menu-btn']) }]));
  assertFalse(isMobileMenuToggle([{ classList: classList(['mobile-backdrop']) }]));
});

Deno.test('open-layout scroll state is throttled and cleanup cancels pending work', () => {
  let listener: (() => void) | undefined;
  let callback: (() => void) | undefined;
  let removed = false;
  let cancelled = false;
  let scrolled = false;
  const cleanup = installLayoutScrollState(
    {
      scrollY: 12,
      addEventListener: (_type, next) => listener = next,
      removeEventListener: () => removed = true,
      setTimeout: (next) => {
        callback = next;
        return 7;
      },
      clearTimeout: (id) => cancelled = id === 7,
    },
    () => ({
      classList: { toggle: (_name: string, value?: boolean) => scrolled = value === true },
    }),
  );

  listener?.();
  callback?.();
  assert(scrolled);
  listener?.();
  cleanup();
  assert(removed);
  assert(cancelled);
});
