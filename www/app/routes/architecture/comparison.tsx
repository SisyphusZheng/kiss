export const meta = { section: 'Principles', label: 'Comparison', order: 20 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class ComparisonPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'comparison' } as const;
}

export const tagName = 'comparison-page';
defineCustomElement(tagName, ComparisonPage);
export default ComparisonPage;
