/**
 * @openelement/core/event-marker — deterministic SSR event marker generation.
 */

import { assert, assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  createEventMarkerContext,
  eventMarkerId,
  eventTypeFromProp,
  serializeEventMarkers,
} from '../src/event-marker.ts';
import { DATA_EID } from '@openelement/protocol/hydration-markers';

Deno.test('eventMarkerId produces e-prefixed zero-based ids', () => {
  assertEquals(eventMarkerId(0), 'e0');
  assertEquals(eventMarkerId(1), 'e1');
  assertEquals(eventMarkerId(42), 'e42');
});

Deno.test('createEventMarkerContext yields sequential unique ids', () => {
  const ctx = createEventMarkerContext();
  assertEquals(ctx.nextId(), 'e0');
  assertEquals(ctx.nextId(), 'e1');
  assertEquals(ctx.nextId(), 'e2');
});

Deno.test('eventTypeFromProp maps camelCase on* props', () => {
  assertEquals(eventTypeFromProp('onClick'), 'click');
  assertEquals(eventTypeFromProp('onInput'), 'input');
  assertEquals(eventTypeFromProp('onSubmit'), 'submit');
  assertEquals(eventTypeFromProp('onMouseMove'), 'mousemove');
});

Deno.test('eventTypeFromProp applies event name aliases', () => {
  assertEquals(eventTypeFromProp('onDoubleClick'), 'dblclick');
  assertEquals(eventTypeFromProp('onMouseEnter'), 'mouseenter');
  assertEquals(eventTypeFromProp('onPointerDown'), 'pointerdown');
});

Deno.test('eventTypeFromProp supports dashed on-* props', () => {
  assertEquals(eventTypeFromProp('on-click'), 'click');
  assertEquals(eventTypeFromProp('on-custom-event'), 'custom-event');
});

Deno.test('eventTypeFromProp returns null for non-event props', () => {
  assertEquals(eventTypeFromProp('class'), null);
  assertEquals(eventTypeFromProp('id'), null);
  assertEquals(eventTypeFromProp('onClickCapture'), 'clickcapture');
});

Deno.test('serializeEventMarkers returns empty string when no event handler', () => {
  assertEquals(serializeEventMarkers(undefined, createEventMarkerContext()), '');
  assertEquals(
    serializeEventMarkers({ class: 'foo', id: 'bar' }, createEventMarkerContext()),
    '',
  );
});

Deno.test('serializeEventMarkers emits DATA_EID for the first event function', () => {
  const ctx = createEventMarkerContext();
  const out = serializeEventMarkers(
    { class: 'foo', onClick: () => {} },
    ctx,
  );
  assertEquals(out, ` ${DATA_EID}="e0"`);
});

Deno.test('serializeEventMarkers only emits one marker even with several handlers', () => {
  const ctx = createEventMarkerContext();
  const out = serializeEventMarkers(
    { onClick: () => {}, onInput: () => {} },
    ctx,
  );
  assertEquals(out, ` ${DATA_EID}="e0"`);
});

Deno.test('serializeEventMarkers ignores non-function event props', () => {
  const ctx = createEventMarkerContext();
  assertEquals(serializeEventMarkers({ onClick: 'not-a-fn' }, ctx), '');
  assert(eventTypeFromProp('onClick') !== null);
});
