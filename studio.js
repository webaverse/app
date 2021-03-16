import m from './mithril.js';

function init() {
}

function feed(a, src) {
  return {
    view() {
      return m(a, {
        src,
      });
    },
  };
}

const Root = {
  oninit: init,
  // To ensure the tag gets properly diffed on route change.
  onbeforeupdate: init,
  view: () => {
    return m(".studio", [
      // m("p", "My ramblings about everything"),

      m("footer", [
        m(".toolbar", [
          m(".buttons", [
            m(".button", [
              m("i.fa.fa-play", {
                onclick(e) {
                  console.log('play');
                },
              }),
            ]),
            m(".button.disabled", [
              m("i.fa.fa-stop", {
                onclick(e) {
                  console.log('stop');
                },
              }),
            ]),
          ]),
          m("input", {
            type: 'text',
            value: '0:00:00',
          }),
        ]),
        m(".core", [
          m(".playlist", [
            m(".needle"),
            m(".tracks", [
              m(".track"),
              m(".track"),
              m(".track"),
            ])
          ]),
          m(".clips", [
            m(".clip"),
            m(".clip"),
            m(".clip"),
          ]),
        ]),
      ]),
    ]);
  },
};

const studio = {
  init() {
    m.render(document.getElementById('mithril-root'), m(Root));
  }
};
export default studio;