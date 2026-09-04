/**
 * Built-output internal link + fragment truth (#1159, B2.4).
 *
 * Walks www/dist HTML, resolves every internal href/src against the built
 * output tree and requires fragment targets (#id) to exist in the target
 * document. External links are out of scope here — the scheduled external
 * checker is deferred to Beta.3 (#1156, workflow-cap ruling).
 */

export interface LinkFailure {
  file: string;
  message: string;
}

/** Per-page SEO invariants checked over built HTML (#1159). */
export function findSeoFailures(html: string, file: string): LinkFailure[] {
  const failures: LinkFailure[] = [];
  const titles = html.match(/<title>/g) ?? [];
  if (titles.length !== 1) {
    failures.push({ file, message: `expected exactly one <title>, found ${titles.length}` });
  }
  if (!/<meta name="description" content="[^"]{20,}"\s*\/?>/.test(html)) {
    failures.push({ file, message: 'missing or trivial meta description' });
  }
  if (!/<meta property="og:title" content="[^"]+"/.test(html)) {
    failures.push({ file, message: 'missing og:title' });
  }
  return failures;
}

export interface BuiltLink {
  from: string;
  raw: string;
  path: string;
  fragment: string;
  line: number;
}

const ATTR_PATTERN = /(?:href|src)="([^"]+)"/g;

/** Extract internal link targets from one built HTML document. */
export function extractBuiltLinks(file: string, html: string): BuiltLink[] {
  const links: BuiltLink[] = [];
  for (const match of html.matchAll(ATTR_PATTERN)) {
    const raw = match[1];
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) continue;
    const line = html.slice(0, match.index).split('\n').length;
    const [path, ...fragmentParts] = raw.split('#');
    links.push({ from: file, raw, path, fragment: fragmentParts.join('#'), line });
  }
  return links;
}

/** Map a URL path to the built-output file that serves it, or null. */
export function resolveBuiltPath(path: string, exists: (file: string) => boolean): string | null {
  const clean = path.replace(/^\//, '').replace(/\/+$/, '');
  if (clean === '') return exists('index.html') ? 'index.html' : null;
  // Static assets carry an extension; routes are clean URLs with index.html.
  const lastSegment = clean.slice(clean.lastIndexOf('/') + 1);
  if (/\.[a-z0-9]+$/i.test(lastSegment)) {
    return exists(clean) ? clean : null;
  }
  const asRoute = `${clean}/index.html`;
  if (exists(asRoute)) return asRoute;
  const asFile = `${clean}.html`;
  return exists(asFile) ? asFile : null;
}

/** True when the target document anchors the fragment. */
export function anchorsFragment(html: string, fragment: string): boolean {
  return html.includes(`id="${fragment}"`) || html.includes(`name="${fragment}"`);
}
