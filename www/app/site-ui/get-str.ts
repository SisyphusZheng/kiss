/**
 * Shared attribute/prop reader for www site-ui components.
 *
 * SSR injectProps() sets camelCase JS properties while plain markup only sets
 * attributes; read the property first (camelCase, then raw name), then the
 * attribute, then the default.
 */
export function getStr(host: Element, attr: string, def: string): string {
  const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const prop = Reflect.get(host, camel) ?? Reflect.get(host, attr);
  if (prop !== undefined && prop !== null) return String(prop);
  return host.getAttribute(attr) || def;
}
