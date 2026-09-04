/**
 * Typed Content Graph generator (#1157, B2.4).
 *
 * Default mode builds the graph from the owned sources (Markdown collections,
 * PACKAGE_SURFACE.md API blocks, the @openelement/ui compiler manifest, the
 * roadmap route timeline and release truth) and writes
 * www/app/data/_generated-content-graph.json. `--check` regenerates and
 * requires byte-identical output — the CI drift gate.
 *
 * Validation fails closed on duplicate ids, broken entry/route references
 * and false locale alternates, in both modes.
 */
import { buildContentGraph, scanPublicRoutes, SITE_LOCALES } from './lib/content-graph-adapters.ts';
import { serializeContentGraph, validateContentGraph } from './lib/content-graph.ts';

export const CONTENT_GRAPH_ARTIFACT = 'www/app/data/_generated-content-graph.json';

export async function generateContentGraphJson(): Promise<string> {
  const graph = await buildContentGraph();
  const routes = await scanPublicRoutes();
  const failures = validateContentGraph(graph, { routes, locales: SITE_LOCALES });
  if (failures.length > 0) {
    console.error('Content graph validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    throw new Error(`content graph invalid: ${failures.length} failure(s)`);
  }
  return serializeContentGraph(graph);
}

if (import.meta.main) {
  const check = Deno.args.includes('--check');
  const json = await generateContentGraphJson();
  if (check) {
    let existing: string;
    try {
      existing = await Deno.readTextFile(CONTENT_GRAPH_ARTIFACT);
    } catch {
      console.error(`${CONTENT_GRAPH_ARTIFACT} is missing; run deno task generate:content-graph`);
      Deno.exit(1);
    }
    if (existing !== json) {
      console.error(
        `${CONTENT_GRAPH_ARTIFACT} is stale; run deno task generate:content-graph and commit the result`,
      );
      Deno.exit(1);
    }
    console.log(`Content graph check passed (${CONTENT_GRAPH_ARTIFACT} is byte-identical).`);
  } else {
    await Deno.writeTextFile(CONTENT_GRAPH_ARTIFACT, json);
    const entries = (json.match(/"id":/g) ?? []).length;
    console.log(`Wrote ${entries} entries to ${CONTENT_GRAPH_ARTIFACT}`);
  }
}
