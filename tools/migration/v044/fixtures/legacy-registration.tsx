import { defineCustomElement, OpenElement } from '@openelement/element';

const tagName = 'oe-migration-registration';

export class MigrationRegistration extends OpenElement {
  render() {
    return <button>legacy registration</button>;
  }
}
defineCustomElement(tagName, MigrationRegistration);
