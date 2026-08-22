export const meta = { section: 'Reference', label: 'Package Compatibility', order: 90 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class PackageCompatibilityPage extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'package-compatibility' } as const;
}

export const tagName = 'package-compatibility-page';
defineCustomElement(tagName, PackageCompatibilityPage);
export default PackageCompatibilityPage;
