export const meta = { section: 'Guide', label: 'Core Concepts', order: 10 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideCoreConceptsPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'core-concepts' } as const;
}

export const tagName = 'guide-core-concepts-page';
defineCustomElement(tagName, GuideCoreConceptsPage);
export default GuideCoreConceptsPage;
