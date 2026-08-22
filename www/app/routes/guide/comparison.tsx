export const meta = { section: 'Guide', label: 'Comparison', order: 25 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideComparisonPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'comparison' } as const;
}

export const tagName = 'guide-comparison-page';
defineCustomElement(tagName, GuideComparisonPage);
export default GuideComparisonPage;
