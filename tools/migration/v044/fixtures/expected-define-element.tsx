declare function element(tag: string): ClassDecorator;

import { OpenElement } from '@openelement/element';

const styles = new StyleSheet();

@element('oe-migration-card')
export class MigrationCard extends OpenElement {
  static styles = styles;
  render() {
    return <article>legacy definition</article>;
  }
}
