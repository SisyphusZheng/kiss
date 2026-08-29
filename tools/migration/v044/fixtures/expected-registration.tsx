declare function element(tag: string): ClassDecorator;

import { OpenElement } from '@openelement/element';

const tagName = 'oe-migration-registration';

@element('oe-migration-registration')
export class MigrationRegistration extends OpenElement {
  render() {
    return <button>legacy registration</button>;
  }
}
