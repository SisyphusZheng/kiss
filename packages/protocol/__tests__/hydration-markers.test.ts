import { assertEquals } from 'jsr:@std/assert@1';
import {
  DATA_EID,
  DATA_SIGNAL,
  DATA_SIGNAL_ATTR,
  DATA_SIGNAL_CLASS,
  DATA_SIGNAL_RENDER,
  parseSignalAttrSpec,
} from '../src/hydration-markers.ts';

Deno.test('hydration marker constants keep canonical attribute names', () => {
  assertEquals(DATA_SIGNAL, 'data-signal');
  assertEquals(DATA_SIGNAL_ATTR, 'data-signal-attr');
  assertEquals(DATA_SIGNAL_CLASS, 'data-signal-class');
  assertEquals(DATA_SIGNAL_RENDER, 'data-signal-render');
  assertEquals(DATA_EID, 'data-eid');
});

Deno.test('parseSignalAttrSpec splits comma-separated attribute names', () => {
  assertEquals(parseSignalAttrSpec('class,disabled'), ['class', 'disabled']);
  assertEquals(parseSignalAttrSpec('value, aria-label'), ['value', 'aria-label']);
  assertEquals(parseSignalAttrSpec('  a , b ,c '), ['a', 'b', 'c']);
});

Deno.test('parseSignalAttrSpec ignores empty entries', () => {
  assertEquals(parseSignalAttrSpec('class,,disabled'), ['class', 'disabled']);
  assertEquals(parseSignalAttrSpec(','), []);
  assertEquals(parseSignalAttrSpec(''), []);
  assertEquals(parseSignalAttrSpec('   '), []);
});
