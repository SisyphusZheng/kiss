export const meta = { section: 'Guide', label: 'Deployment', order: 100 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class GuideDeploymentPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'guide', slug: 'deployment' } as const;
}

export const tagName = 'guide-deployment-page';
defineCustomElement(tagName, GuideDeploymentPage);
export default GuideDeploymentPage;
