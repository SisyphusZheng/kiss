import { assertEquals, assertExists, assertThrows } from '@std/assert';
import { renderDsd } from '@openelement/element';
import {
  defineApp,
  defineElement,
  defineIsland,
  defineIslandConfig,
  definePage,
  isOpenElementNotFound,
  isOpenElementRedirect,
  notFound,
  redirect,
  useLoaderData,
} from '../src/index.ts';
import * as appSurface from '../src/index.ts';

Deno.test('@openelement/app root export includes defineApp', () => {
  assertEquals(typeof defineApp, 'function');
});

Deno.test('definePage() returns a DsdElement-compatible constructor', async () => {
  const Page = definePage({
    render() {
      return <main>Hello OpenElement</main>;
    },
  });

  const out = await renderDsd('test-page', { componentClass: Page });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('<main>Hello OpenElement</main>'), true);
});

Deno.test('definePage() rejects function-form pages', () => {
  assertThrows(
    () => {
      definePage((() => <main>legacy</main>) as never);
    },
    Error,
    'canonical object descriptor',
  );
});

Deno.test('definePage() rejects legacy top-level metadata fields', () => {
  assertThrows(
    () => {
      definePage({
        title: 'Legacy',
        render() {
          return <main>legacy</main>;
        },
      } as never);
    },
    Error,
    'top-level "title"',
  );
});

Deno.test('definePage() canonical descriptor exposes metadata and load data to render()', async () => {
  const Page = definePage({
    route: { path: '/', id: 'home' },
    head: {
      title: 'Home',
      description: 'Application API',
      meta: [{ name: 'robots', content: 'index' }],
      dangerouslyHeadFragments: ['<link rel="canonical" href="https://example.test/">'],
    },
    renderIntent: {
      mode: 'static',
      revalidate: 60,
    },
    render() {
      return <main>Hello from definePage</main>;
    },
  });

  assertEquals(Page.openElementPage.route?.path, '/');
  assertEquals(Page.openElementPage.head?.title, 'Home');
  assertEquals(Page.openElementPage.head?.description, 'Application API');
  assertEquals(Page.openElementPage.head?.meta?.[0].name, 'robots');
  assertEquals(Page.openElementPage.head?.dangerouslyHeadFragments?.length, 1);
  assertEquals(Page.openElementPage.renderIntent.mode, 'static');
  assertEquals(Page.openElementPage.renderIntent.revalidate, 60);

  const out = await renderDsd('loaded-page', {
    componentClass: Page,
    props: { name: 'DX' },
  });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('Hello from definePage'), true);
});

Deno.test('definePage() passes structured route and meta context to render()', async () => {
  const Page = definePage({
    route: { path: '/articles/[slug]', params: ['slug'] },
    head: { title: 'Article' },
    render({ route, meta }) {
      return <main>{route.path}:{String(meta.section)}</main>;
    },
  });

  const out = await renderDsd('context-page', {
    componentClass: Page,
    props: {
      __openElementRoute: { path: '/guide' },
      __openElementMeta: { section: 'guide' },
    },
  });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('/guide:guide'), true);
});

Deno.test('definePage() rejects non-canonical layout and styles fields', () => {
  assertThrows(
    () => {
      definePage({
        layout: 'docs',
        render() {
          return <main>legacy layout</main>;
        },
      } as never);
    },
    Error,
    'top-level "layout"',
  );
  assertThrows(
    () => {
      definePage({
        styles: [],
        render() {
          return <main>legacy styles</main>;
        },
      } as never);
    },
    Error,
    'top-level "styles"',
  );
});

Deno.test('definePage() renders page error fallback through the same VNode contract', async () => {
  const Page = definePage({
    render() {
      return <main>ok</main>;
    },
    error({ error }) {
      return <main>Error: {String((error as Error).message)}</main>;
    },
  });

  const out = await renderDsd('error-page', {
    componentClass: Page,
    props: { __openElementError: new Error('boom') },
  });

  assertEquals(out.errors.length, 0);
  assertEquals(out.html.includes('Error: boom'), true);
});

Deno.test('redirect() and notFound() expose typed lifecycle control errors', () => {
  let redirectError: unknown;
  try {
    redirect('/login', 307);
  } catch (error) {
    redirectError = error;
  }

  assertEquals(isOpenElementRedirect(redirectError), true);
  assertEquals((redirectError as { location: string }).location, '/login');
  assertEquals((redirectError as { status: number }).status, 307);

  let notFoundError: unknown;
  try {
    notFound('missing article');
  } catch (error) {
    notFoundError = error;
  }

  assertEquals(isOpenElementNotFound(notFoundError), true);
  assertEquals((notFoundError as { status: number }).status, 404);
});

Deno.test('redirect() validates the 3xx whitelist at construction (ADR-0121 §3)', () => {
  // Valid statuses construct fine.
  for (const status of [301, 302, 303, 307, 308]) {
    let err: unknown;
    try {
      redirect('/target', status);
    } catch (error) {
      err = error;
    }
    assertEquals(isOpenElementRedirect(err), true, `status ${status} must be accepted`);
  }
  // A non-3xx "redirect" is a response the browser never follows — reject it.
  for (const status of [200, 201, 204, 400, 404, 418, 500]) {
    assertThrows(
      () => redirect('/target', status as never),
      Error,
      'redirect() status must be one of 301/302/303/307/308',
    );
  }
  // The duck-typed guard honors the same whitelist (#583): a shaped object
  // with an arbitrary status must not take the redirect channel.
  assertEquals(
    isOpenElementRedirect({
      name: 'OpenElementRedirect',
      location: 'https://evil.example',
      status: 200,
    }),
    false,
  );
  assertEquals(
    isOpenElementRedirect({ name: 'OpenElementRedirect', location: '/ok', status: 303 }),
    true,
  );
});

Deno.test('defineElement() validates custom element tag names', () => {
  assertThrows(
    () => {
      defineElement('BadName', () => <span />);
    },
    Error,
    'valid custom element name',
  );
});

Deno.test('@openelement/app root exports authoring helpers only', () => {
  assertExists(definePage);
  assertExists(defineElement);
  assertExists(defineIsland);
  assertExists(defineIslandConfig);
});

Deno.test('application page types reject unknown host members', () => {
  const Page = definePage({ render: () => null });
  const host = Object.create(Page.prototype) as InstanceType<typeof Page> & { data?: unknown };
  // @ts-expect-error arbitrary members are not part of the application host contract
  host.notARealApplicationMember = true;
});

Deno.test('public App surface does not expose data-context mutation hooks', () => {
  assertEquals('__enterDataContext' in appSurface, false);
  assertEquals('__exitDataContext' in appSurface, false);
  assertEquals('__activeDataContext' in appSurface, false);
});

Deno.test('page rendering pops data context when the renderer throws', () => {
  const Page = definePage({
    render() {
      throw new Error('render failed');
    },
  });
  const host = Object.create(Page.prototype) as InstanceType<typeof Page> & { data?: unknown };
  host.data = { secret: true };
  Object.assign(host, { __openElementParams: {} });

  assertThrows(() => host.render(), Error, 'render failed');
  assertEquals(useLoaderData(), undefined);
});

Deno.test('defineIslandConfig() returns canonical island metadata shape', () => {
  const config = defineIslandConfig({ hydrate: 'visible', dsd: false, ssr: false });

  assertEquals(config.hydrate, 'visible');
  assertEquals(config.dsd, false);
  assertEquals(config.ssr, false);
});

Deno.test('defineIslandConfig() rejects non-canonical island metadata', () => {
  assertThrows(
    () => {
      defineIslandConfig({ mode: 'legacy' } as never);
    },
    Error,
    'does not accept "mode"',
  );
  assertThrows(
    () => {
      defineIslandConfig({ hydrate: 'lazy' } as never);
    },
    Error,
    'Invalid island hydrate strategy "lazy"',
  );
});
