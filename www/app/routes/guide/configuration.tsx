export const meta = { section: 'Guide', label: 'Configuration', order: 70 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideConfigurationPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'configuration' } as const;
}

export const tagName = 'guide-configuration-page';
defineCustomElement(tagName, GuideConfigurationPage);
export default GuideConfigurationPage;
