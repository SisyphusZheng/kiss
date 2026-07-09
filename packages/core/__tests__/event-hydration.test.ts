import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  collectEventBindings,
  eventMarkerId,
  eventRecordsToDescriptors,
  eventTypeFromProp,
} from '../src/event-hydration.ts';
import { For, Fragment, jsx, jsxs, Show } from '../src/jsx-runtime.ts';
import { renderDsdTree } from '../src/render-ir.ts';

Deno.test('event hydration: event marker ids are deterministic', () => {
  assertEquals(eventMarkerId(0), 'e0');
  assertEquals(eventMarkerId(12), 'e12');
});

Deno.test('event hydration: React-style onDoubleClick maps to native dblclick', () => {
  assertEquals(eventTypeFromProp('onClick'), 'click');
  assertEquals(eventTypeFromProp('onDoubleClick'), 'dblclick');
  assertEquals(eventTypeFromProp('onDblclick'), 'dblclick');
  assertEquals(eventTypeFromProp('onFocusIn'), 'focusin');
  assertEquals(eventTypeFromProp('onFocusOut'), 'focusout');
  assertEquals(eventTypeFromProp('onMouseEnter'), 'mouseenter');
  assertEquals(eventTypeFromProp('onMouseLeave'), 'mouseleave');
  assertEquals(eventTypeFromProp('onPointerDown'), 'pointerdown');
  assertEquals(eventTypeFromProp('onPointerMove'), 'pointermove');
  assertEquals(eventTypeFromProp('onPointerUp'), 'pointerup');
  assertEquals(eventTypeFromProp('onPointerCancel'), 'pointercancel');
  assertEquals(eventTypeFromProp('on-sl-change'), 'sl-change');
  assertEquals(eventTypeFromProp('on-md-input'), 'md-input');
  assertEquals(eventTypeFromProp('on-1bad'), null);
  assertEquals(eventTypeFromProp('onclick'), null);
});

Deno.test('event hydration: one marker binds every handler on the same element', async () => {
  const noop = () => {};
  const tree = jsx('button', {
    onClick: noop,
    onDoubleClick: noop,
    onFocusIn: noop,
    children: ['multi'],
  });

  const html = await renderDsdTree(tree);
  assertStringIncludes(html, 'data-eid="e0"');
  assertEquals(html.includes('data-eid="e1"'), false);

  const records = collectEventBindings(tree).get('e0') ?? [];
  assertEquals(records.map((record) => record.type), ['click', 'dblclick', 'focusin']);
});

Deno.test('event hydration: dashed custom events are marked and collected', async () => {
  const handler = () => {};
  const tree = jsx('sl-switch', {
    'on-sl-change': handler,
    children: ['Switch'],
  });

  const html = await renderDsdTree(tree);
  assertStringIncludes(html, '<sl-switch');
  assertStringIncludes(html, 'data-eid="e0"');

  const records = collectEventBindings(tree).get('e0') ?? [];
  assertEquals(records.map((record) => record.type), ['sl-change']);
  assertEquals(records[0]?.handler, handler);
});

Deno.test('event hydration: nested parent/child events match SSR child-before-parent order', async () => {
  const parentHandler = () => {};
  const childHandler = () => {};

  const tree = jsx('div', {
    onClick: parentHandler,
    children: [jsx('button', { onClick: childHandler, children: ['child'] })],
  });

  const html = await renderDsdTree(tree);
  assertStringIncludes(html, 'data-eid="e0"');
  assertStringIncludes(html, 'data-eid="e1"');

  const bindings = collectEventBindings(tree);
  assertEquals([...bindings.keys()], ['e0', 'e1']);
  // Child is visited first, so it gets e0; parent gets e1.
  assertEquals(bindings.get('e0')?.[0].handler, childHandler);
  assertEquals(bindings.get('e1')?.[0].handler, parentHandler);
});

Deno.test('event hydration: SSR markers and hydration bindings share one traversal contract', async () => {
  const noop = () => {};
  const Nested = (props: { children?: unknown }) =>
    jsxs(Fragment, {
      children: [
        jsx('span', { children: ['before'] }),
        ...(Array.isArray(props.children) ? props.children : [props.children]),
      ],
    });

  const tree = jsxs(Fragment, {
    children: [
      jsx('button', { onClick: noop, children: ['root'] }),
      jsx(Show, {
        when: true,
        children: [
          jsx('button', { onClick: noop, children: ['show'] }),
          jsx('button', { onClick: noop, children: ['hidden'] }),
        ],
      }),
      jsx(For, {
        each: ['a', 'b'],
        children: [(item: unknown) => jsx('button', { onClick: noop, children: [String(item)] })],
      }),
      jsx(Nested, {
        children: [jsx('button', { onClick: noop, children: ['nested'] })],
      }),
    ],
  });

  const html = await renderDsdTree(tree);
  for (const id of ['e0', 'e1', 'e2', 'e3', 'e4']) {
    assertStringIncludes(html, `data-eid="${id}"`);
  }
  assertEquals(html.includes('data-eid="e5"'), false);

  assertEquals([...collectEventBindings(tree).keys()], ['e0', 'e1', 'e2', 'e3', 'e4']);
});

Deno.test('event hydration: eventRecordsToDescriptors binds owner and mirrors descriptor shape', () => {
  const owner = { name: 'owner' };
  let clicked = false;
  const handler = function (this: { name: string }, _e: Event) {
    clicked = this.name === 'owner';
  };
  const records = [
    { id: 'e0', type: 'click', handler: handler as EventListener },
    { id: 'e0', type: 'keydown', handler: handler as EventListener },
  ];

  const el = { tagName: 'button' } as unknown as Element;
  const descriptors = eventRecordsToDescriptors(el, records, owner);

  assertEquals(descriptors.length, 2);
  assertEquals(descriptors[0].kind, 'event');
  assertEquals(descriptors[0].el, el);
  assertEquals(descriptors[0].type, 'click');
  (descriptors[0].handler as EventListener).call(owner, new Event('click'));
  assertEquals(clicked, true);
  assertEquals(descriptors[1].type, 'keydown');
});

// #293: hydration errors must be observable, not silently swallowed.
Deno.test('event hydration: component-instantiation failure is logged, not swallowed', () => {
  class BoomComponent {
    constructor() {
      throw new Error('boom-constructor');
    }
    render() {
      return jsx('button', { children: ['x'] });
    }
  }

  const originalError = console.error;
  let logged = '';
  console.error = (...args: unknown[]) => {
    logged += args.map((a) => String(a)).join(' ');
  };
  try {
    const tree = jsx(BoomComponent, { children: [] });
    // Must not throw — resilience is preserved, only made observable.
    const bindings = collectEventBindings(tree);
    assertEquals(bindings.size, 0);
    assertStringIncludes(logged, 'boom-constructor');
    assertStringIncludes(logged, '[hydration]');
  } finally {
    console.error = originalError;
  }
});

Deno.test('event hydration: function-component invocation failure is logged, not swallowed', () => {
  const boomFn = () => {
    throw new Error('boom-fn');
  };

  const originalError = console.error;
  let logged = '';
  console.error = (...args: unknown[]) => {
    logged += args.map((a) => String(a)).join(' ');
  };
  try {
    const tree = jsx(boomFn as unknown as (props: { children?: unknown }) => unknown, { children: [] });
    const bindings = collectEventBindings(tree);
    assertEquals(bindings.size, 0);
    assertStringIncludes(logged, 'boom-fn');
    assertStringIncludes(logged, '[hydration]');
  } finally {
    console.error = originalError;
  }
});
