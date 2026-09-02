import { element, OpenElement, property } from '@openelement/element';
import { pageBlogIndexStyles } from './page-blog-index-styles.ts';

interface BlogIndexRow {
  slug: string;
  href: string;
  index: string;
  title: string;
  excerpt: string;
  date: string;
}

@element('blog-index')
export default class BlogIndexPage extends OpenElement {
  static override styles = pageBlogIndexStyles;

  @property({ reflect: false, attribute: false })
  featuredHref = '';
  @property({ reflect: false, attribute: false })
  featuredKicker = '';
  @property({ reflect: false, attribute: false })
  featuredTitle = '';
  @property({ reflect: false, attribute: false })
  featuredExcerpt = '';
  @property({ reflect: false, attribute: false })
  rows: BlogIndexRow[] = [];

  render() {
    return (
      <main class='journal'>
        <header class='masthead'>
          <p class='eyebrow'>Blog — Dispatches from the lab</p>
          <h1>Dispatches.</h1>
          <p class='lede'>
            The public audit trail: what changed, why the package graph moved, and which standards
            boundary matters next.
          </p>
        </header>

        <a class='featured' href={this.featuredHref}>
          <p class='featured-kicker'>
            <span>{this.featuredKicker}</span>
            <span class='read-time'>Latest dispatch</span>
          </p>
          <h2>{this.featuredTitle}</h2>
          <p class='featured-excerpt'>{this.featuredExcerpt}</p>
          <span class='read-more'>Read the dispatch →</span>
        </a>

        <section class='stream' aria-label='Recent dispatches'>
          {this.rows.map((row) => (
            <a class='row' key={row.slug} href={row.href}>
              <span class='row-index' aria-hidden='true'>{row.index}</span>
              <div>
                <span class='row-title'>{row.title}</span>
                <p class='row-excerpt'>{row.excerpt}</p>
              </div>
              <span class='row-date'>{row.date}</span>
            </a>
          ))}
        </section>
      </main>
    );
  }
}
