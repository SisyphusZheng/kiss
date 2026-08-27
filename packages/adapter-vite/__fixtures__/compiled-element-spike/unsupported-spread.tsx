/**
 * v0.44.0-alpha.0 compiler spike negative fixture (#1160).
 *
 * Spread attributes are outside the spike grammar. The transform must fail
 * closed with a source-located diagnostic and must never fall back to the
 * legacy runtime path.
 */
import { OpenElement } from '@openelement/element';

declare function element(tag: string): ClassDecorator;

@element('oe-spike-unsupported')
export class UnsupportedSpike extends OpenElement {
  render() {
    const props = { id: 'spread' };
    return <div {...props}>nope</div>;
  }
}
