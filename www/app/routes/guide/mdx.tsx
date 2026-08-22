export const meta = { section: 'Guide', label: 'MDX', order: 50 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideMdxPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'mdx' } as const;
}

export const tagName = 'guide-mdx-page';
defineCustomElement(tagName, GuideMdxPage);
export default GuideMdxPage;
