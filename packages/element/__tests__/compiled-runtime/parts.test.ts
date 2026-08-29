import { assertEquals, assertStrictEquals, assertStringIncludes, assertThrows } from '@std/assert';
import {
  claimExistingDom,
  type CompiledSpikeHost,
  createFreshDom,
  serializeToHtml,
} from '../../src/internal/compiled/runtime.ts';
import { validateSpikeProgram } from '../../src/internal/compiled/program.ts';
import { signal } from '../../src/internal/signal/framework.ts';
import { parseHtml, TestDocument, type TestElement, toHtml } from './test-dom.ts';

const FIXED_PROGRAM = validateSpikeProgram({
  version: 1,
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
    { k: 'boolean', index: 2, signal: 'disabled', name: 'disabled', path: [0, 0] },
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
  const missingHandlerProgram = validateSpikeProgram({
    ...FIXED_PROGRAM,
    parts: FIXED_PROGRAM.parts.map((part) =>
      part.k === 'event' ? { ...part, signal: 'missing-handler' } : part
    ),
  });
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
