export const meta = { section: 'Principles', label: 'Islands', order: 40 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class IslandsPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'islands' } as const;
}

export const tagName = 'islands-guide-page';
defineCustomElement(tagName, IslandsPage);
export default IslandsPage;
