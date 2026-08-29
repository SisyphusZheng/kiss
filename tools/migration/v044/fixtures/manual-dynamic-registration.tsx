import { OpenElement } from '@openelement/element';

declare function resolveTag(): string;

class ManualRegistration extends OpenElement {
  render() {
    return <div>manual registration</div>;
  }
}

customElements.define(resolveTag(), ManualRegistration);
