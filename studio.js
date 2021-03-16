import m from './mithril.js';

function init() {
}

const Root = {
    oninit: init,
    // To ensure the tag gets properly diffed on route change.
    onbeforeupdate: init,
    view: () =>
        m(".blog-summary", [
            m("p", "My ramblings about everything"),

            m(".feeds", [
                feed("Atom", "blog.atom.xml"),
                feed("RSS", "blog.rss.xml"),
            ]),

            tag != null
                ? m(TagHeader, {len: posts.length, tag})
                : m(".summary-header", [
                    m(".summary-title", "Posts, sorted by most recent."),
                    m(TagSearch),
                ]),

            m(".blog-list", posts.map((post) =>
                m(m.route.Link, {
                    class: "blog-entry",
                    href: `/posts/${post.url}`,
                }, [
                    m(".post-date", post.date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })),

                    m(".post-stub", [
                        m(".post-title", post.title),
                        m(".post-preview", post.preview, "..."),
                    ]),

                    m(TagList, {post, tag}),
                ])
            )),
        ])
};

const studio = {
  init() {
    m.render(document.body.getElementById('mythril-root'), m(Root));
  }
};
export default studio;