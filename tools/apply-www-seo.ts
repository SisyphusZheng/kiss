/**
 * Apply the per-route SEO plan to the built www output (#1307).
 *
 * Runs in `deno task build` after the adapter build and before Pagefind
 * indexing: rewrites each built page's title/description/og metadata and
 * injects canonical + hreflang links, derived from the committed content
 * graph (content routes) and www/app/seo.ts (route-level pages). Fails
 * closed — a built page without an SEO entry, an entry without a built
 * page, or a page whose boilerplate anchors drifted all fail the build.
 */
import { walk } from '@std/fs/walk';
import { join } from '@std/path';
import type { ContentGraph } from './lib/content-graph.ts';
import { applySeoToHtml, buildSeoPlan } from './lib/www-seo.ts';
import { routeSeo } from '../www/app/seo.ts';

export const WWW_DIST = 'www/dist';
const CONTENT_GRAPH = 'www/app/data/_generated-content-graph.json';
const SITE_LOCALES = ['en', 'zh'] as const;

export async function applyWwwSeo(dist = WWW_DIST): Promise<string[]> {
  const graph = JSON.parse(await Deno.readTextFile(CONTENT_GRAPH)) as ContentGraph;
  const builtHtmlFiles: string[] = [];
  for await (
    const entry of walk(dist, {
      includeDirs: false,
      exts: ['.html'],
      skip: [/(^|\/)pagefind(\/|$)/],
    })
  ) {
    builtHtmlFiles.push(entry.path.slice(dist.length + 1));
  }
  builtHtmlFiles.sort();

  const { plan, failures } = buildSeoPlan({
    graph,
    routeSeo,
    locales: SITE_LOCALES,
    builtHtmlFiles,
  });
  const rewritten: string[] = [];
  if (failures.length === 0) {
    for (const entry of plan) {
      const path = join(dist, entry.file);
      const html = await Deno.readTextFile(path);
      const applied = applySeoToHtml(html, entry);
      if (applied === null) {
        failures.push({
          file: entry.file,
          message: 'expected boilerplate head anchors not found — template drift',
        });
        continue;
      }
      if (applied !== html) {
        await Deno.writeTextFile(path, applied);
        rewritten.push(entry.file);
      }
    }
  }
  if (failures.length > 0) {
    console.error('www SEO application failed:');
    for (const failure of failures) console.error(`- ${failure.file}: ${failure.message}`);
    Deno.exit(1);
  }
  return rewritten;
}

if (import.meta.main) {
  const rewritten = await applyWwwSeo();
  console.log(`www SEO applied to ${rewritten.length} page(s).`);
}
