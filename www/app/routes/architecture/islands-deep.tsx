export const meta = { section: 'Principles', label: 'Island Deep Dive', order: 50 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class IslandsDeepGuidePage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'islands-deep' } as const;
}

export const tagName = 'page-islands-deep-guide';
defineCustomElement(tagName, IslandsDeepGuidePage);
export default IslandsDeepGuidePage;
