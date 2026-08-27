/**
 * v0.44.0-alpha.0 compiler spike fixture (#1160).
 *
 * This is the exact TSX grammar recognized by the open:compiled-element spike
 * transform. The file is transformed through the Vite plugin hook; it is never
 * executed directly. The local decorator declarations exist only so the fixture
 * is self-contained - the canonical decorator contract is owned by #1162.
 */
import { OpenElement } from '@openelement/element';

declare function element(tag: string): ClassDecorator;
declare function property(options: { reflect: boolean }): PropertyDecorator;

@element('oe-spike-counter')
export class SpikeCounter extends OpenElement {
  @property({ reflect: true })
  count = 0;

  @property({ reflect: false })
  label = 'ready';

  @property({ reflect: false })
  items: Array<{ id: string; text: string }> = [{ id: 'a', text: 'alpha' }, {
    id: 'b',
    text: 'beta',
  }];

  increment(): void {
    this.count++;
  }

  render() {
    return (
      <div class='spike'>
        <h1>Count: {this.count}</h1>
        <input value={this.label} />
        <button onClick={this.increment}>+</button>
        {this.count > 0 ? <p class='parity'>positive</p> : <p class='parity'>zero</p>}
        <ul>{this.items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>
      </div>
    );
  }
}
