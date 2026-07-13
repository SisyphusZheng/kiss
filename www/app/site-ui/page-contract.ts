/** Declarative route data for private WWW structural components. */

export type PageOutlineItem = Readonly<{
  id: string;
  label: string;
  level?: 2 | 3;
}>;

export type ReadingContract = Readonly<{
  breadcrumb: string;
  title: string;
  outline: readonly PageOutlineItem[];
  previous?: Readonly<{ href: string; label: string }>;
  next?: Readonly<{ href: string; label: string }>;
}>;

export type ReadingMetadata = Readonly<{
  breadcrumb: string;
  title: string;
  lede?: string;
  date?: string;
  tags?: readonly string[];
}>;

export type ReadingNavigation = Readonly<{
  previous?: Readonly<{ href: string; label: string }>;
  next?: Readonly<{ href: string; label: string }>;
}>;

export function defineReadingContract(contract: ReadingContract): ReadingContract {
  if (!contract.breadcrumb || !contract.title || !contract.outline.length) {
    throw new Error('WWW reading contracts require breadcrumb, title, and an outline.');
  }
  const ids = new Set<string>();
  for (const item of contract.outline) {
    if (!item.id || !item.label || ids.has(item.id)) {
      throw new Error('WWW reading contract outline ids and labels must be unique and non-empty.');
    }
    ids.add(item.id);
  }
  return contract;
}

export function serializeOutline(outline: readonly PageOutlineItem[]): string {
  return JSON.stringify(outline);
}
