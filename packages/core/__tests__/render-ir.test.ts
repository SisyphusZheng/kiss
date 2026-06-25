import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  dsdHostNode,
  fragmentNode,
  renderToNode,
  serializeRenderNode,
  textNode,
  trustedHtmlNode,
} from '../src/render-ir.ts';
import { jsx } from '../src/jsx-runtime.ts';

Deno.test('render-ir serializes text as escaped HTML', () => {
  assertEquals(
    serializeRenderNode(textNode('<script>x</script>')),
    '&lt;script&gt;x&lt;/script&gt;',
  );
});

Deno.test('render-ir serializes trusted HTML without sanitizer mutation', () => {
  assertEquals(
    serializeRenderNode(trustedHtmlNode('<img src=x onerror="x()">')),
    '<img src=x onerror="x()">',
  );
});

Deno.test('render-ir converts VNode trees into element IR before serialization', async () => {
  const node = await renderToNode(
    jsx('section', {
      className: 'note',
      children: [
        jsx('h2', { children: 'Title' }),
        jsx('p', { innerHTML: '<b>safe text</b>' }),
      ],
    }),
  );

  assertEquals(
    serializeRenderNode(node),
    '<section class="note"><h2>Title</h2><p>&lt;b&gt;safe text&lt;/b&gt;</p></section>',
  );
});

Deno.test('render-ir keeps trustedHtml as explicit trusted-html node', async () => {
  const node = await renderToNode(
    jsx('div', { innerHTML: '<span>trusted</span>', trustedHtml: true }),
  );

  assertEquals(serializeRenderNode(node), '<div><span>trusted</span></div>');
});

Deno.test('render-ir preserves unknown custom elements during SSR', async () => {
  const node = await renderToNode(
    jsx('third-party-card', {
      className: 'card',
      userName: 'Ada',
      disabled: true,
      children: [
        jsx('span', { slot: 'label', children: ['Profile'] }),
      ],
    }),
  );

  assertEquals(
    serializeRenderNode(node),
    '<third-party-card class="card" user-name="Ada" disabled>' +
      '<span slot="label">Profile</span>' +
      '</third-party-card>',
  );
});

Deno.test('render-ir serializes DSD host nodes through the same serializer', () => {
  const html = serializeRenderNode(
    dsdHostNode({
      tag: 'x-card',
      attrs: { title: 'Hello' },
      ssrPropsAttr: '',
      source: '',
      templateAttrs: ' shadowrootdelegatesfocus',
      styleCss: ':host { display: block; }',
      shadow: [trustedHtmlNode('<p>shadow</p>')],
      light: [textNode('light')],
      layer: 'dsd-static',
    }),
  );

  assertStringIncludes(html, '<x-card title="Hello">');
  assertStringIncludes(html, '<template shadowrootmode="open" shadowrootdelegatesfocus>');
  assertStringIncludes(html, '<style>:host { display: block; }</style>');
  assertStringIncludes(html, '<p>shadow</p>');
  assertStringIncludes(html, 'light</x-card>');
});

Deno.test('render-ir fragment serializes children in order', () => {
  assertEquals(
    serializeRenderNode(fragmentNode([textNode('a'), trustedHtmlNode('<b>b</b>')])),
    'a<b>b</b>',
  );
});
