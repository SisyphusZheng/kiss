import { LitElement, html, css } from 'lit'
import '../../components/header.js'
import '../../components/footer.js'

/**
 * Dynamic post page
 *
 * File name `[slug].ts` becomes route `/posts/:slug`.
 * The `slug` param is available via `c.req.param('slug')`.
 */
export class PostPage extends LitElement {
  static styles = css`
    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }

    h1 {
      margin-bottom: 1rem;
    }

    .date {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .content {
      margin-bottom: 2rem;
    }

    .back-link {
      display: inline-block;
      margin-top: 2rem;
    }
  `

  // Props passed from server (SSR)
  static properties = {
    slug: { type: String },
    title: { type: String },
    date: { type: String },
    content: { type: String },
  }

  constructor() {
    super()
    this.slug = ''
    this.title = ''
    this.date = ''
    this.content = ''
  }

  render() {
    // In a real app, you'd fetch the post based on `this.slug`
    const post = {
      title: this.slug === 'hello-kiss' ? 'Hello KISS Framework' : 'Why Web Standards Matter',
      date: this.slug === 'hello-kiss' ? '2026-04-23' : '2026-04-22',
      content: `<p>This is the post content. In a real app, you'd fetch this from a CMS or markdown file.</p>
                <p>KISS makes it easy to build server-rendered pages with interactive islands.</p>`
    }

    return html`
      <app-header></app-header>
      <main>
        <h1>${post.title}</h1>
        <p class="date">${post.date}</p>
        <div class="content">
          ${post.content}
        </div>
        <a class="back-link" href="/">← Back to home</a>
      </main>
      <app-footer></app-footer>
    `
  }
}

customElements.define('post-page', PostPage)
