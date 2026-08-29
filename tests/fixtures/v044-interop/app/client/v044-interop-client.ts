import { css, html, LitElement } from 'lit';
import { FASTElement, html as fastHtml } from '@microsoft/fast-element';
import { defineCustomElement as defineIonButton } from '@ionic/core/components/ion-button.js';

interface UpgradeEntry {
  phase: 'constructor' | 'connected';
  tag: string;
  id: string;
}

interface InteropState {
  upgradeOrder: UpgradeEntry[];
  events: string[];
  existingIdentity: Record<string, boolean>;
  existingLiveState: Record<string, boolean>;
  ready: boolean;
}

const state = (): InteropState => {
  const global = globalThis as typeof globalThis & { __v044InteropState?: InteropState };
  global.__v044InteropState ??= {
    upgradeOrder: [],
    events: [],
    existingIdentity: {},
    existingLiveState: {},
    ready: false,
  };
  return global.__v044InteropState;
};

const probeTags = [
  'v044-native-probe',
  'v044-lit-probe',
  'v044-fast-probe',
  'v044-stencil-probe',
] as const;

type LiveStateElement = Element & { __v044InteropLiveState?: string };

function findTag(root: Document | ShadowRoot, tag: string): HTMLElement | null {
  const direct = root.querySelector(tag);
  if (direct) return direct as HTMLElement;
  for (const element of root.querySelectorAll('*')) {
    const shadow = (element as HTMLElement).shadowRoot;
    if (!shadow) continue;
    const found = findTag(shadow, tag);
    if (found) return found;
  }
  return null;
}

function fixtureShadowRoot(): ShadowRoot | null {
  const fixture = findTag(document, 'v044-interop-fixture');
  return fixture?.shadowRoot ?? null;
}

function findById(root: ShadowRoot, id: string): Element | null {
  return Array.from(root.querySelectorAll('*')).find((element) =>
    (element as HTMLElement).id === id
  ) ?? null;
}

// Capture the authored elements before their definitions run. Custom element
// upgrade must happen in place and must not erase state already held by the
// platform or by the application.
const preUpgradeElements = new Map<string, Element>();
const preUpgradeRoot = fixtureShadowRoot();
if (preUpgradeRoot) {
  for (const tag of probeTags) {
    for (const element of preUpgradeRoot.querySelectorAll(tag)) {
      const liveElement = element as LiveStateElement;
      preUpgradeElements.set(liveElement.id, liveElement);
      liveElement.__v044InteropLiveState = `pre-upgrade:${liveElement.id}`;
    }
  }
}

function mark(phase: UpgradeEntry['phase'], element: Element): void {
  state().upgradeOrder.push({ phase, tag: element.localName, id: element.id });
}

function emit(element: Element, event: string): void {
  state().events.push(`${element.id}:${event}`);
  element.dispatchEvent(new CustomEvent(event, { bubbles: true, composed: true }));
}

class V044InteropChildHost extends HTMLElement {
  constructor() {
    super();
    mark('constructor', this);
    this.attachShadow({ mode: 'open' }).innerHTML = '<slot></slot>';
  }

  connectedCallback(): void {
    mark('connected', this);
  }
}

class V044NativeProbe extends HTMLElement {
  static observedAttributes = ['value'];
  #value = '';

  constructor() {
    super();
    mark('constructor', this);
    this.attachShadow({ mode: 'open' }).innerHTML =
      '<button id="control" part="control" type="button"><slot></slot></button>';
    this.shadowRoot!.querySelector('button')!.addEventListener('click', () => {
      emit(this, 'v044-probe-event');
    });
  }

  connectedCallback(): void {
    mark('connected', this);
  }

  attributeChangedCallback(name: string, _oldValue: string | null, value: string | null): void {
    if (name === 'value') this.#value = value ?? '';
  }

  get value(): string {
    return this.#value;
  }

  set value(next: string) {
    this.#value = String(next);
    this.setAttribute('value', this.#value);
  }
}

class V044LitProbe extends LitElement {
  static properties = { value: { type: String, reflect: true } };
  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      padding: 0.25rem;
    }
  `;

  constructor() {
    super();
    mark('constructor', this);
  }

  connectedCallback(): void {
    mark('connected', this);
    super.connectedCallback();
  }

  private onClick(): void {
    emit(this, 'v044-probe-event');
  }

  render() {
    return html`
      <button id="control" part="control" type="button" @click=${this.onClick}>
        <slot></slot>
      </button>
    `;
  }
}

class V044FastProbe extends FASTElement {
  static observedAttributes = ['value'];

  constructor() {
    super();
    mark('constructor', this);
  }

  connectedCallback(): void {
    mark('connected', this);
    super.connectedCallback();
  }

  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  set value(next: string) {
    this.setAttribute('value', String(next));
  }

  private onClick(): void {
    emit(this, 'v044-probe-event');
  }
}

V044FastProbe.define({
  name: 'v044-fast-probe',
  template: fastHtml<V044FastProbe>`
    <button id="control" part="control" type="button" @click=${(component) => component.onClick()}>
      <slot></slot>
    </button>
  `,
});

defineIonButton();
const IonButton = customElements.get('ion-button');
if (!IonButton) throw new Error('Stencil/Ionic ion-button did not register');

class V044StencilProbe extends IonButton {
  constructor() {
    super();
    mark('constructor', this);
  }

  connectedCallback(): void {
    mark('connected', this);
    super.connectedCallback();
  }
}

customElements.define('v044-interop-child-host', V044InteropChildHost);
customElements.define('v044-native-probe', V044NativeProbe);
customElements.define('v044-lit-probe', V044LitProbe);
customElements.define('v044-stencil-probe', V044StencilProbe);

const postUpgradeRoot = fixtureShadowRoot();
const existingIdentity: Record<string, boolean> = {};
const existingLiveState: Record<string, boolean> = {};
for (const [id, element] of preUpgradeElements) {
  const liveElement = element as LiveStateElement;
  existingIdentity[id] = postUpgradeRoot !== null && findById(postUpgradeRoot, id) === element;
  existingLiveState[id] = liveElement.__v044InteropLiveState === `pre-upgrade:${id}`;
}

const interopGlobal = globalThis as typeof globalThis & { __v044InteropState?: InteropState };
interopGlobal.__v044InteropState = {
  ...state(),
  existingIdentity,
  existingLiveState,
  ready: true,
};
