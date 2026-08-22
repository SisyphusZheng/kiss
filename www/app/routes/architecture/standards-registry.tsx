export const meta = { section: 'Reference', label: 'WC Standards Contract', order: 80 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class StandardsRegistryPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'standards-registry' } as const;
}

export const tagName = 'standards-registry-page';
defineCustomElement(tagName, StandardsRegistryPage);
export default StandardsRegistryPage;
