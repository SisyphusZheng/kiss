export const meta = { section: 'Core', label: 'API Routes', order: 60 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideApiPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'api' } as const;
}

export const tagName = 'guide-api-page';
defineCustomElement(tagName, GuideApiPage);
export default GuideApiPage;
