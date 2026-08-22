export const meta = { section: 'Guide', label: 'Getting Started', order: 1 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideGettingStartedPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'getting-started' } as const;
}

export const tagName = 'guide-getting-started-page';
defineCustomElement(tagName, GuideGettingStartedPage);
export default GuideGettingStartedPage;
