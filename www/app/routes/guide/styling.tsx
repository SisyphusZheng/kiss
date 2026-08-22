export const meta = { section: 'Guide', label: 'Styling', order: 5 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideStylingPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'styling' } as const;
}

export const tagName = 'guide-styling-page';
defineCustomElement(tagName, GuideStylingPage);
export default GuideStylingPage;
