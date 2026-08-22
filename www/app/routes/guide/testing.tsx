export const meta = { section: 'Guide', label: 'Testing', order: 110 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideTestingPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'testing' } as const;
}

export const tagName = 'guide-testing-page';
defineCustomElement(tagName, GuideTestingPage);
export default GuideTestingPage;
