export const meta = { section: 'Guide', label: 'Migration', order: 75 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideMigrationPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'migration' } as const;
}

export const tagName = 'guide-migration-page';
defineCustomElement(tagName, GuideMigrationPage);
export default GuideMigrationPage;
