export function el(
  tag: string,
  props?: Record<string, string>,
  ...children: (string | Node)[]
): HTMLElement {
  const element = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    element.append(child);
  }
  return element;
}

export function text(content: string): Text {
  return document.createTextNode(content);
}

export function setStyles(
  el: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  Object.assign(el.style, styles);
}
