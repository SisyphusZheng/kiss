/**
 * @openelement/adapter-vite - entry-render-ssg.ts tests
 *
 * Behavioral tests for the generated SSG renderRoute(): the generated code
 * is executed in a data: module with mocked entry-level dependencies so the
 * loader/render error paths (redirect, 404, 500 + errors collection) are
 * exercised for real, not just string-matched.
 */
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.0';
import { buildEntryDescriptor } from '../src/internal/ssg/entry-descriptor.ts';
import { renderSsgSection } from '../src/internal/ssg/entry-render-ssg.ts';
import type { RouteEntry } from '../src/internal/protocol/framework.ts';

const routes: RouteEntry[] = [
  {
    path: '/boom',
    filePath: 'boom.tsx',
    type: 'page',
    varName: 'boom_route',
    tagName: 'boom-page',
  },
];

interface RenderedPage {
  html: string;
  status?: number;
  errors: Array<
    { code: string; severity: string; phase: string; tagName: string; message: string }
  >;
  componentCount: number;
  renderTimeMs: number;
}

/**
 * Execute the generated SSG section with mocked entry-level dependencies.
 * The generated code runs verbatim, except import.meta.env.PROD which is
 * replaced the same way Vite's define would at bundle time.
 */
async function loadGeneratedRenderRoute(options: {
  renderAppShellBody: string;
  loaderBody?: string;
  prod?: boolean;
}): Promise<(path: string, opts?: Record<string, unknown>) => Promise<RenderedPage>> {
  const desc = buildEntryDescriptor(routes, { ssg: true });
  const section = renderSsgSection(desc)
    .replaceAll('import.meta.env.PROD', options.prod ? 'true' : 'false');

  const harness = `
const $boom_route = {
  loader: ${options.loaderBody ?? 'undefined'},
  default: class BoomPage {},
};
function __pageDefinition(m) { return m?.default?.openElementPage || {}; }
function __routeMeta() { return {}; }
function __isOpenElementRedirect(e) { return e && e.__openRedirect === true; }
function __isOpenElementNotFound(e) { return e && e.__openNotFound === true; }
function __statusHtml(title, message) { return "<main><h1>" + title + "</h1><p>" + message + "</p></main>"; }
function wrapInDocument(content, opts) {
  return "<!DOCTYPE html><html lang=\\"" + opts.lang + "\\\"><head><title>" + opts.title + "</title></head><body>" + content + "</body></html>";
}
function jsx(tag, props) { return { tag: tag, props: props }; }
async function __renderAppShell(node, routePath) { ${options.renderAppShellBody} }
`;

  const mod = await import(
    'data:text/javascript;charset=utf-8,' + encodeURIComponent(harness + section)
  );
  return mod.renderRoute;
}

Deno.test('renderRoute: happy path returns html with empty errors', async () => {
  const renderRoute = await loadGeneratedRenderRoute({
    renderAppShellBody: 'return "<div>ok " + node.tag + "</div>";',
  });
  const result = await renderRoute('/boom');
  assertStringIncludes(result.html, '<div>ok boom-page</div>');
  assertEquals(result.status, undefined);
  assertEquals(result.errors, []);
});

Deno.test('renderRoute: render failure produces defined 500 and collects a RenderError', async () => {
  const renderRoute = await loadGeneratedRenderRoute({
    renderAppShellBody: 'throw new Error("render exploded");',
  });
  const result = await renderRoute('/boom');
  assertEquals(result.status, 500);
  assertStringIncludes(result.html, '500 Internal Server Error');
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].code, 'OPEN_ELEMENT_RENDER_RENDER_FAILED');
  assertEquals(result.errors[0].severity, 'error');
  assertEquals(result.errors[0].phase, 'render');
  assertEquals(result.errors[0].tagName, 'boom-page');
  assertEquals(result.errors[0].message, 'render exploded');
});

Deno.test('renderRoute: loader failure produces defined 500 and collects a RenderError', async () => {
  const renderRoute = await loadGeneratedRenderRoute({
    renderAppShellBody: 'return "unreachable";',
    loaderBody: 'async () => { throw new Error("loader exploded"); }',
  });
  const result = await renderRoute('/boom');
  assertEquals(result.status, 500);
  assertEquals(result.errors.length, 1);
  assertEquals(result.errors[0].message, 'loader exploded');
});

Deno.test('renderRoute: production mode hides the error stack from the 500 page', async () => {
  const renderRoute = await loadGeneratedRenderRoute({
    renderAppShellBody: 'throw new Error("render exploded");',
    prod: true,
  });
  const result = await renderRoute('/boom');
  assertEquals(result.status, 500);
  assert(!result.html.includes('render exploded'), 'prod 500 page must not leak error details');
  // The structured error is still collected for observability.
  assertEquals(result.errors[0].message, 'render exploded');
});

Deno.test('renderRoute: redirect and not-found still short-circuit with status pages', async () => {
  const redirect = await loadGeneratedRenderRoute({
    renderAppShellBody: 'throw { __openRedirect: true, location: "/login", status: 302 };',
  });
  const redirectResult = await redirect('/boom');
  assertEquals(redirectResult.status, 302);
  assertEquals(redirectResult.errors, []);

  const notFound = await loadGeneratedRenderRoute({
    renderAppShellBody: 'throw { __openNotFound: true, message: "gone" };',
  });
  const notFoundResult = await notFound('/boom');
  assertEquals(notFoundResult.status, 404);
  assertEquals(notFoundResult.errors, []);
});
