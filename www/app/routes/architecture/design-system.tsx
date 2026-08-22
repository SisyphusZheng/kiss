export const meta = { section: 'Reference', label: 'Design System', order: 15 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class DesignSystemPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'design-system' } as const;
}

export const tagName = 'design-system-page';
defineCustomElement(tagName, DesignSystemPage);
export default DesignSystemPage;
