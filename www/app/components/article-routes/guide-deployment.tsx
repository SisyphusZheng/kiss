import { OpenElement } from '@openelement/element';
import '../../site-ui/open-article-view.tsx';
import type { ArticlePageModel } from '../../site-ui/article-page-model.ts';

declare function element(tag: string): ClassDecorator;
declare function property(
  options: { reflect: boolean; attribute?: false },
): (target: undefined, context: ClassFieldDecoratorContext) => void;

@element('guide-deployment')
export default class GuideDeploymentPage extends OpenElement {
  @property({ reflect: false, attribute: false })
  model: ArticlePageModel = {
    notFoundClass: 'container',
    articleClass: 'is-hidden',
    slug: '',
    notFoundMessage: '',
    metadata: { breadcrumb: '', title: '', lede: '' },
    navigation: {},
    railItems: [],
    articleHtml: '',
  };

  render() {
    return <open-article-view model={this.model}></open-article-view>;
  }
}
