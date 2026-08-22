export const meta = { section: 'Guide', label: 'Architecture', order: 20 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideArchitecturePage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'architecture' } as const;
}

export const tagName = 'guide-architecture-page';
defineCustomElement(tagName, GuideArchitecturePage);
export default GuideArchitecturePage;
