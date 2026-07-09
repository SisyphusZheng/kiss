import { assertEquals, assertArrayIncludes } from 'jsr:@std/assert@1';
import type { VNode, ComponentFn, ComponentCtor } from '../src/vnode.ts';

const fnComponent: ComponentFn = () => null;
class CtorComponent {
  render() {
    return null;
  }
}
const ctor: ComponentCtor = CtorComponent as unknown as ComponentCtor;

Deno.test('VNode: accepts a string tag with props and children', () => {
  const node: VNode = {
    tag: 'div',
    props: { class: 'x' },
    children: ['hello', { tag: 'span', props: {}, children: [] }],
  };
  assertEquals(node.tag, 'div');
  assertEquals(node.props.class, 'x');
  assertArrayIncludes(node.children, ['hello']);
});

Deno.test('VNode: tag may be a function or class component', () => {
  const fnNode: VNode = { tag: fnComponent, props: {}, children: [] };
  const ctorNode: VNode = { tag: ctor, props: {}, children: [] };
  assertEquals(fnNode.tag, fnComponent);
  assertEquals(ctorNode.tag, ctor);
});

Deno.test('VNode: supports optional key and ref', () => {
  const node: VNode = {
    tag: 'div',
    props: {},
    children: [],
    key: 'item-1',
    ref: () => {},
  };
  assertEquals(node.key, 'item-1');
  assertEquals(typeof node.ref, 'function');
});
