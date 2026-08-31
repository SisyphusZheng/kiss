import { assertEquals, assertStringIncludes } from '@std/assert';
import { renderRuntimeHelpers } from '../src/internal/ssg/entry-render-runtime.ts';

Deno.test('nested static SSR expands route, article, reading shell, and island exactly once', async () => {
  const helpers = renderRuntimeHelpers({ default: false, layouts: {} }, [
    'open-page-rail',
    'open-article-view',
    'open-reading-shell',
  ]);
  const harness = `
const records = {
  "guide-page": [{ name: "model", attribute: null, converter: "object" }],
  "open-article-view": [{ name: "model", attribute: null, converter: "object" }],
  "open-reading-shell": [{ name: "metadata", attribute: "metadata", converter: "object" }],
  "open-page-rail": [{ name: "items", attribute: "items", converter: "array" }],
};
const customElements = { get(tag) { return { __compiledProperties: records[tag] || [] }; } };
const escapeHtml = (value) => String(value);
const __locales = ["en"];
const __getDefaultLocale = () => "en";
const __navSections = [];
const __headerNav = [];
function attr(value) {
  return JSON.stringify(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}
function renderDsd(tag, options) {
  const props = options.props || {};
  if (tag === "guide-page") return { html: '<guide-page data-oe-light><open-article-view model="' + attr(props.model) + '"></open-article-view></guide-page>' };
  if (tag === "open-article-view") return { html: '<open-article-view data-oe-light><open-reading-shell metadata="' + attr(props.model.metadata) + '"><span slot="meta">Projected meta</span><open-page-rail items="' + attr(props.model.items) + '"></open-page-rail><x-foreign>foreign</x-foreign></open-reading-shell></open-article-view>' };
  if (tag === "open-reading-shell") return { html: '<open-reading-shell data-oe-light><header><slot name="meta"><span>Fallback meta</span></slot></header><main><h1>' + props.metadata.title + '</h1><slot></slot></main></open-reading-shell>' };
  if (tag === "open-page-rail") return { html: '<open-page-rail data-oe-light><nav>' + props.items[0].label + '</nav></open-page-rail>' };
  throw new Error("unexpected tag " + tag);
}
${helpers}
export function run() { return __ssr("guide-page", { model: { metadata: { title: "Compiled guide" }, items: [{ label: "Start" }] } }); }
export function localize(href, locale, defaultLocale) { return __localizeShellHref(href, locale, defaultLocale); }
`;
  const mod = await import(
    'data:text/javascript;charset=utf-8,' + encodeURIComponent(harness)
  );
  const html = mod.run() as string;

  assertEquals((html.match(/<open-article-view data-oe-light>/g) ?? []).length, 1);
  assertEquals((html.match(/<open-reading-shell data-oe-light>/g) ?? []).length, 1);
  assertEquals((html.match(/<open-page-rail data-oe-light>/g) ?? []).length, 1);
  assertStringIncludes(html, '<h1>Compiled guide</h1>');
  assertStringIncludes(html, '<slot name="meta"><span slot="meta">Projected meta</span></slot>');
  assertEquals(html.includes('Fallback meta'), false);
  assertStringIncludes(
    html,
    '<slot><open-page-rail data-oe-light><nav>Start</nav></open-page-rail><x-foreign>foreign</x-foreign></slot>',
  );
  assertStringIncludes(html, '<nav>Start</nav>');
  assertStringIncludes(html, '<x-foreign>foreign</x-foreign>');
  assertEquals(html.includes('[object Object]'), false);
  assertEquals(mod.localize('/', 'zh', 'en'), '/zh');
  assertEquals(mod.localize('/docs', 'zh', 'en'), '/zh/docs');
  assertEquals(mod.localize('/zh/docs', 'zh', 'en'), '/zh/docs');
  assertEquals(mod.localize('/docs', 'en', 'en'), '/docs');
  assertEquals(mod.localize('https://example.com/docs', 'zh', 'en'), 'https://example.com/docs');
});
