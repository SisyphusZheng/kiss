/**
 * Built-output internal link/fragment gate (#1159, B2.4).
 *
 * Runs against www/dist after the build: every internal href/src must resolve
 * to a built file, every #fragment must anchor in the target document, and
 * every sitemap.xml URL must resolve. Fails closed — the acceptance bar is
 * zero broken internal links or fragments. External URLs are deliberately not
 * fetched (scheduled external checks are deferred to Beta.3 under #1156).
 */
import { walk } from '@std/fs/walk';
import { join } from '@std/path';
import { normalize as posixNormalize } from '@std/path/posix';
import {
  anchorsFragment,
  extractBuiltLinks,
  findSeoFailures,
  type LinkFailure,
  resolveBuiltPath,
} from './lib/www-links.ts';

export const WWW_DIST = 'www/dist';

export async function checkBuiltLinks(dist = WWW_DIST): Promise<LinkFailure[]> {
  const failures: LinkFailure[] = [];
  const files = new Set<string>();
  const htmlFiles: string[] = [];
  for await (
    const entry of walk(dist, { includeDirs: false, skip: [/(^|\/)pagefind(\/|$)/] })
  ) {
    files.add(entry.path.slice(dist.length + 1));
    if (entry.path.endsWith('.html')) htmlFiles.push(entry.path);
  }
  const exists = (file: string) => files.has(file);
  const htmlCache = new Map<string, string>();
  const readHtml = async (file: string): Promise<string> => {
    const cached = htmlCache.get(file);
    if (cached !== undefined) return cached;
    const text = await Deno.readTextFile(join(dist, file));
    htmlCache.set(file, text);
    return text;
  };

  for (const htmlFile of htmlFiles.sort()) {
    const relative = htmlFile.slice(dist.length + 1);
    const html = await readHtml(relative);
    failures.push(...findSeoFailures(html, relative));
    for (const link of extractBuiltLinks(relative, html)) {
      let target: string | null;
      if (link.path === '') {
        target = relative;
      } else if (link.path.startsWith('/')) {
        target = resolveBuiltPath(link.path, exists);
      } else {
        // Relative link: resolve against the page's directory, normalizing
        // '.'/'..' segments so self-references resolve to the page itself.
        const baseDir = relative.slice(0, relative.lastIndexOf('/'));
        target = resolveBuiltPath(posixNormalize(`${baseDir}/${link.path}`), exists);
      }
      if (target === null) {
        failures.push({
          file: `${link.from}:${link.line}`,
          message: `broken internal link '${link.raw}'`,
        });
        continue;
      }
      if (link.fragment !== '' && !anchorsFragment(await readHtml(target), link.fragment)) {
        failures.push({
          file: `${link.from}:${link.line}`,
          message: `broken fragment '#${link.fragment}' in '${link.path || relative}'`,
        });
      }
    }
  }

  // Sitemap URLs must resolve to built pages.
  if (exists('sitemap.xml')) {
    const sitemap = await Deno.readTextFile(join(dist, 'sitemap.xml'));
    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = match[1];
      const path = new URL(url).pathname;
      if (resolveBuiltPath(path, exists) === null) {
        failures.push({ file: 'sitemap.xml', message: `sitemap URL does not resolve: ${url}` });
      }
    }
  }
  return failures;
}

if (import.meta.main) {
  const failures = await checkBuiltLinks();
  if (failures.length > 0) {
    console.error('Built-output link check failed:');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    Deno.exit(1);
  }
  console.log(`Built-output link check passed (${WWW_DIST}).`);
}
