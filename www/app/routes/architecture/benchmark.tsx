export const meta = { section: 'Reference', label: 'Performance', order: 100 };

import { defineCustomElement } from '@openelement/element';
import { ArticlePage, articlePageStyles } from '@openelement/site-ui/article-page.tsx';

export class Benchmark extends ArticlePage {
  static override styles = [articlePageStyles()];
  static override article = { collection: 'architecture', slug: 'benchmark' } as const;
}

export const tagName = 'benchmark-page';
defineCustomElement(tagName, Benchmark);
export default Benchmark;
