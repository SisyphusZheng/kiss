export const meta = { section: 'Guide', label: 'Security', order: 95 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideSecurityPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'security' } as const;
}

export const tagName = 'guide-security-page';
defineCustomElement(tagName, GuideSecurityPage);
export default GuideSecurityPage;
