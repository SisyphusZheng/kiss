declare function element(tag: string): ClassDecorator;

import { OpenElement } from '@openelement/element';

@element('oe-migration-registration')
export class MigrationRegistration extends OpenElement {
  render() {
    return <button type='button'>legacy registration</button>;
  }
}
