export const meta = { section: 'Guide', label: 'Error Handling', order: 80 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideErrorHandlingPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'error-handling' } as const;
}

export const tagName = 'guide-error-handling-page';
defineCustomElement(tagName, GuideErrorHandlingPage);
export default GuideErrorHandlingPage;
