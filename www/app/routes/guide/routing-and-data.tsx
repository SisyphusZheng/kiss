export const meta = { section: 'Guide', label: 'Routing and Data', order: 40 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideRoutingAndDataPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'routing-and-data' } as const;
}

export const tagName = 'guide-routing-and-data-page';
defineCustomElement(tagName, GuideRoutingAndDataPage);
export default GuideRoutingAndDataPage;
