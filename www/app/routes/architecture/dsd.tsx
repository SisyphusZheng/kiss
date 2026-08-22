export const meta = { section: 'Principles', label: 'DSD Rendering', order: 30 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class DsdGuidePage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'dsd' } as const;
}

export const tagName = 'dsd-guide-page';
defineCustomElement(tagName, DsdGuidePage);
export default DsdGuidePage;
