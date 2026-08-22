export const meta = { section: 'Guide', label: 'Islands and SSR', order: 90 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideIslandsAndSsrPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'islands-and-ssr' } as const;
}

export const tagName = 'guide-islands-and-ssr-page';
defineCustomElement(tagName, GuideIslandsAndSsrPage);
export default GuideIslandsAndSsrPage;
