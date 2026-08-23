import { unwrapSignalLike } from '../signal/index.ts';
import { camelToKebab } from './tag-utils.ts';

/** VNode bookkeeping keys that never become DOM attributes in any renderer. */
export const VNODE_CONTROL_PROP_KEYS = new Set(['children', 'key', 'trustedHtml']);

/** Props represented through dedicated SSR content/ref paths, never attributes. */
export const SSR_SKIP_ATTR_KEYS = new Set([
  ...VNODE_CONTROL_PROP_KEYS,
  'ref',
  'innerHTML',
  'textContent',
]);

export function attrNameFor(tagName: string, key: string): string {
  const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
  return attrName === key && tagName.includes('-') ? camelToKebab(attrName) : attrName;
}

export function stylePropertyNameFor(key: string): string {
  return camelToKebab(key);
}

export function resolveStyleObject(value: unknown): Record<string, string | number> {
  const style: Record<string, string | number> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const resolved = unwrapSignalLike(entry);
    if (resolved != null) style[key] = resolved as string | number;
  }
  return style;
}

export function styleObjectToString(value: unknown): string {
  return Object.entries(resolveStyleObject(value))
    .map(([key, entry]) => `${stylePropertyNameFor(key)}: ${entry}`)
    .join('; ');
}
