export const meta = { section: 'Principles', label: 'Architecture', order: 10 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class ArchitecturePage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'architecture' } as const;
}

export const tagName = 'engine-architecture';
defineCustomElement(tagName, ArchitecturePage);
export default ArchitecturePage;
