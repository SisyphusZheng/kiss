export const CUSTOM_ELEMENT_NAME_RE = /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/;

export function isCustomElementName(value: string): boolean {
  return CUSTOM_ELEMENT_NAME_RE.test(value);
}
