import { normalizeLocalePath } from '@openelement/app/i18n';

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:']);
const LOCALE_LABELS: Record<string, string> = { en: '中文', zh: 'English' };
const SECTION_MAP: Readonly<Record<string, readonly string[]>> = {
  '/guide': ['Quick Start', 'Guide', 'Core', 'Production'],
  '/architecture': ['Principles', 'Reference'],
  '/blog': ['History'],
  '/apilist': ['Reference'],
  '/roadmap': ['History', 'Project'],
  '/changelog': ['History', 'Project'],
  '/contributing': ['History', 'Project'],
};

/** Generated nav data leaves the project-links group nameless; label it. */
const FALLBACK_SECTION = 'Project';

export interface NavItem {
  path?: string;
  href?: string;
  label: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface HeaderNavLink {
  href: string;
  label: string;
}

export function isSafeLayoutUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('//')) return false;
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) return true;

  try {
    const parsed = new URL(trimmed, 'https://openelement.org/');
    return SAFE_URL_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function isExternalLayoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://openelement.org/');
    return parsed.origin !== 'https://openelement.org' && SAFE_URL_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function localizeLayoutPath(
  path: string,
  locale: string,
  locales: string[],
  defaultLocale: string,
): string {
  if (isSafeLayoutUrl(path) && /^https?:/i.test(path)) return path;
  if (locale === defaultLocale) return path;
  return normalizeLocalePath(`/${locale}${path === '/' ? '' : path}`, {
    locales,
    defaultLocale,
  }).localizedPath;
}

export function localeSwitchPath(
  currentPath: string,
  currentLocale: string,
  locales: string[],
  defaultLocale: string,
): string {
  const other = locales.find((locale) => locale !== currentLocale) || currentLocale;
  const bare = normalizeLocalePath(currentPath, { locales, defaultLocale }).path;
  return localizeLayoutPath(bare, other, locales, defaultLocale);
}

export function localeSwitchLabel(currentLocale: string): string {
  return LOCALE_LABELS[currentLocale] || currentLocale;
}

export function localeSwitchScopeNote(currentLocale: string): string {
  return currentLocale === 'zh'
    ? 'Switch to English'
    : '中文翻译目前覆盖 Guide 层；其他层的页面仍为英文。';
}

export function filterNavSections(items: NavSection[], currentPath: string): NavSection[] {
  const named = items.map((section) =>
    section.section ? section : { ...section, section: FALLBACK_SECTION }
  );
  for (const [prefix, sections] of Object.entries(SECTION_MAP)) {
    if (currentPath.startsWith(prefix)) {
      return named.filter((section) => sections.includes(section.section));
    }
  }
  return named;
}

export function mobileSectionRoot(href: string, locales: string[]): string {
  const segments = href.split('/').filter(Boolean);
  const start = locales.length > 1 && locales.includes(segments[0]) ? 1 : 0;
  return segments.length > start + 1 ? `/${segments[start]}` : href;
}
