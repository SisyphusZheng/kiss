import { assertEquals, assertStrictEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  claimExistingDom,
  type CompiledSpikeHost,
  createFreshDom,
  serializeToHtml,
} from '../../src/internal/compiled/runtime.ts';
import { validatePartProgram } from '../../src/internal/compiled/program.ts';
import { signal } from '../../src/internal/signal/framework.ts';
import { parseHtml, TestDocument, type TestElement, toHtml } from './test-dom.ts';
import { testProgram } from './test-program.ts';

const FIXED_PROGRAM = testProgram({
  tag: 'oe-fixed-parts',
  template: [{
    k: 'el',
    tag: 'div',
    attrs: [['data-static', 'yes']],
    children: [
      { k: 'el', tag: 'input', attrs: [], children: [] },
      { k: 'el', tag: 'button', attrs: [], children: [{ k: 'text', value: 'go' }] },
    ],
  }],
  parts: [
    { k: 'attr', index: 0, signal: 'title', name: 'title', path: [0] },
    { k: 'prop', index: 1, signal: 'value', name: 'value', path: [0, 0] },
    { k: 'bool', index: 2, signal: 'disabled', name: 'disabled', path: [0, 0] },
    { k: 'class', index: 3, signal: 'classes', path: [0] },
    { k: 'style', index: 4, signal: 'styles', path: [0] },
    {
      k: 'event',
      index: 5,
      event: 'click',
      signal: 'clickHandler',
      options: { once: true },
      path: [0, 1],
    },
    { k: 'ref', index: 6, ref: 'inputRef', path: [0, 0] },
  ],
});

function fixedHost() {
  const title = signal('initial');
  const value = signal('ready');
  const disabled = signal(false);
  const classes = signal<unknown>({ selected: true, active: true });
  const styles = signal<unknown>({ display: 'block', color: 'red' });
  const clickHandler = signal<unknown>((event: unknown) => {
    clicks.push((event as { type: string }).type);
  });
  const clicks: string[] = [];
  const refs: Array<string | null> = [];
  const host = {
    signals: { title, value, disabled, classes, styles, clickHandler },
    handlers: {},
    refs: {
      inputRef: (element: Element | null) => {
        refs.push(element?.tagName ?? null);
      },
    },
  } as unknown as CompiledSpikeHost;
  return { host, title, value, disabled, classes, styles, clickHandler, clicks, refs };
}

function asNode(element: TestElement): Node {
  return element as unknown as Node;
}

function fixedRoot(root: TestElement): TestElement {
  return root.childNodes[0] as TestElement;
}

Deno.test('fixed Parts share normalized commits across fresh and claim paths', () => {
  const initial = fixedHost();
  const html = serializeToHtml(FIXED_PROGRAM, initial.host);
  assertEquals(
    html,
    '<div data-static="yes" title="initial" class="active selected" style="color:red;display:block">' +
      '<input value="ready">' +
      '<button>go</button>' +
      '</div>',
  );

  const freshDoc = new TestDocument();
  const freshRoot = freshDoc.createElement('host');
  const fresh = createFreshDom(FIXED_PROGRAM, initial.host, asNode(freshRoot));
  const freshDiv = fixedRoot(freshRoot);
  const input = freshDiv.childNodes[0] as TestElement;
  const button = freshDiv.childNodes[1] as TestElement;
  assertEquals(toHtml(freshRoot), `<host>${html}</host>`);
  assertEquals(initial.refs, ['INPUT']);
  freshDoc.resetCounts();

  initial.classes.value = { active: true, selected: true };
  assertEquals(freshDoc.counts.attributes, 0, 'equivalent normalized class is a no-op');
  initial.title.value = 'updated';
  assertEquals(freshDiv.getAttribute('title'), 'updated');
  initial.value.value = 'changed';
  assertEquals(input.value, 'changed');
  assertEquals(freshDoc.counts.valueWrites, 1);
  initial.disabled.value = true;
  assertEquals(input.getAttribute('disabled'), '');
  assertEquals((input as unknown as { disabled: boolean }).disabled, true);
  initial.styles.value = { color: 'blue', display: 'none' };
  assertEquals(freshDiv.getAttribute('style'), 'color:blue;display:none');

  button.dispatch('click');
  button.dispatch('click');
  assertEquals(initial.clicks, ['click'], 'once option is owned by the event Part');

  const claimDoc = new TestDocument();
  const claimRoot = parseHtml(claimDoc, html);
  const claimHost = fixedHost();
  const claimInput = fixedRoot(claimRoot).childNodes[0] as TestElement;
  claimInput.simulateUserInput('typed before claim');
  claimDoc.resetCounts();
  const claimed = claimExistingDom(FIXED_PROGRAM, claimHost.host, asNode(claimRoot));
  assertStrictEquals(fixedRoot(claimRoot).childNodes[0] as TestElement, claimInput);
  assertEquals(claimInput.value, 'typed before claim');
  assertEquals(claimDoc.counts.valueWrites, 0, 'claim never performs initial property writes');
  assertEquals(claimHost.refs, ['INPUT']);

  claimHost.title.value = 'claimed update';
  assertEquals(fixedRoot(claimRoot).getAttribute('title'), 'claimed update');
  claimed.dispose();
  claimHost.title.value = 'after dispose';
  assertEquals(fixedRoot(claimRoot).getAttribute('title'), 'claimed update');
  assertEquals(claimHost.refs, ['INPUT', null]);
  fresh.dispose();
  assertEquals(initial.refs, ['INPUT', null]);
});

Deno.test('fixed Part errors are explicit and unsupported claim shapes fail closed', () => {
  const host = fixedHost();
  const eventIndex = FIXED_PROGRAM.parts.findIndex((part) => part.k === 'event');
  const missingHandlerProgram = {
    ...FIXED_PROGRAM,
    parts: FIXED_PROGRAM.parts.map((part) =>
      part.k === 'event' ? { ...part, signal: 'missingHandler' } : part
    ),
    dependencies: FIXED_PROGRAM.dependencies.map((dependency) =>
      dependency.owner.kind === 'part' && dependency.owner.index === eventIndex
        ? { ...dependency, signal: 'missingHandler' }
        : dependency
    ),
  };
  validatePartProgram(missingHandlerProgram);
  assertThrows(
    () =>
      createFreshDom(
        missingHandlerProgram,
        host.host,
        asNode(new TestDocument().createElement('host')),
      ),
    Error,
    'missing host signal',
  );

  const html = serializeToHtml(FIXED_PROGRAM, host.host);
  const doc = new TestDocument();
  const root = parseHtml(doc, html);
  (fixedRoot(root).childNodes[1] as TestElement).setAttribute('extra', 'unsafe');
  const error = assertThrows(() => claimExistingDom(FIXED_PROGRAM, host.host, asNode(root)), Error);
  assertStringIncludes(error.message, 'unexpected attribute');
});

Deno.test('a fixed-Part path of [0] targets the sole template root; an empty path fails closed', () => {
  const title = signal('initial');
  const program = testProgram({
    tag: 'oe-root-path',
    template: [{ k: 'el', tag: 'div', attrs: [], children: [] }],
    parts: [{ k: 'attr', index: 0, signal: 'title', name: 'title', path: [0] }],
  });
  const host = { signals: { title }, handlers: {} } as unknown as CompiledSpikeHost;
  const html = serializeToHtml(program, host);
  assertEquals(html, '<div title="initial"></div>');
  const doc = new TestDocument();
  const root = doc.createElement('host');

  createFreshDom(program, host, asNode(root));
  const div = root.childNodes[0] as TestElement;
  assertEquals(div.getAttribute('title'), 'initial');
  assertEquals(root.getAttribute('title'), null);

  title.value = 'updated';
  assertEquals(div.getAttribute('title'), 'updated');
  assertEquals(root.getAttribute('title'), null);

  const claimDoc = new TestDocument();
  const claimRoot = parseHtml(claimDoc, html);
  const claimed = claimExistingDom(program, host, asNode(claimRoot));
  const claimedDiv = claimRoot.childNodes[0] as TestElement;
  assertEquals(claimedDiv.getAttribute('title'), 'initial');
  assertEquals(claimRoot.getAttribute('title'), null);
  title.value = 'claimed update';
  assertEquals(claimedDiv.getAttribute('title'), 'claimed update');
  claimed.dispose();

  const emptyPath = {
    ...program,
    parts: program.parts.map((part) => part.k === 'attr' ? { ...part, path: [] } : part),
    locations: program.locations.map((location) =>
      location.kind === 'sink' ? { ...location, path: [] } : location
    ),
  };
  assertThrows(() => validatePartProgram(emptyPath), Error, 'path must target an element');
});

Deno.test('signal-driven event Parts replace handlers without duplicating listeners', () => {
  const handler = signal<unknown>(() => {});
  const program = testProgram({
    tag: 'oe-event-replace',
    template: [{ k: 'el', tag: 'button', attrs: [], children: [] }],
    parts: [{ k: 'event', index: 0, event: 'click', signal: 'handler', path: [0] }],
  });
  const host = { signals: { handler }, handlers: {} } as unknown as CompiledSpikeHost;

  const document = new TestDocument();
  const root = document.createElement('host');
  const instance = createFreshDom(program, host, asNode(root));
  const button = root.childNodes[0] as TestElement;
  const listenerCount = () => button.listeners.get('click')?.size ?? 0;

  const calls: string[] = [];
  handler.value = () => calls.push('first');
  assertEquals(listenerCount(), 1);
  button.dispatch('click');
  assertEquals(calls, ['first']);

  handler.value = () => calls.push('second');
  assertEquals(listenerCount(), 1, 'replacement removes the previous listener');
  button.dispatch('click');
  assertEquals(calls, ['first', 'second'], 'the replaced handler no longer fires');

  handler.value = () => calls.push('third');
  assertEquals(listenerCount(), 1);
  button.dispatch('click');
  assertEquals(calls, ['first', 'second', 'third']);

  instance.dispose();
  assertEquals(listenerCount(), 0, 'dispose removes the listener');
  button.dispatch('click');
  assertEquals(calls, ['first', 'second', 'third']);
});

Deno.test('style Parts normalize vendor-prefixed and custom declarations', () => {
  const styles = signal<unknown>({
    WebkitTransform: 'scale(1)',
    msTransition: 'opacity',
    '--accent': 'red',
  });
  const program = testProgram({
    tag: 'oe-style-normalization',
    template: [{ k: 'el', tag: 'div', attrs: [], children: [] }],
    parts: [{ k: 'style', index: 0, signal: 'styles', path: [0] }],
  });
  const host = { signals: { styles }, handlers: {} } as unknown as CompiledSpikeHost;
  const doc = new TestDocument();
  const root = doc.createElement('host');
  createFreshDom(program, host, asNode(root));

  assertEquals(
    (root.childNodes[0] as TestElement).getAttribute('style'),
    '--accent:red;-webkit-transform:scale(1);-ms-transition:opacity',
  );
});
