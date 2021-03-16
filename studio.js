import m from './mithril.js';

/* function feed(a, src) {
  return {
    view() {
      return m(a, {
        src,
      });
    },
  };
} */

const Root = {
  oninit() {
    this.playing = false;
    this.needleOffset = 0;

    window.addEventListener('keydown', e => {
      switch (e.which) {
        case 32: { // space
          this.playing = !this.playing;
          _render();
          break;
        }
      }
    });
  },
  // To ensure the tag gets properly diffed on route change.
  // onbeforeupdate: init,
  view() {
    return m(".studio", [
      // m("p", "My ramblings about everything"),

      m("footer", [
        m(".toolbar", [
          m(".buttons", [
            m(".button", {
              class: this.playing ? 'disabled' : '',
            }, [
              m("i.fa.fa-play", {
                onclick: e => {
                  this.playing = true;
                  _render();
                },
              }),
            ]),
            m(".button", {
              class: this.playing ? '' : 'disabled',
            }, [
              m("i.fa.fa-stop", {
                onclick: e => {
                  this.playing = false;
                  _render();
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
          m(".playlist", {
            onclick: e => {
              e.preventDefault();
              e.stopPropagation();
              
              const playListEl = mithrilRoot.querySelector('.playlist');
              const box = playListEl.getBoundingClientRect();
              this.needleOffset = e.clientX - box.left;
              _render();
            },
          }, [
            m(".needle", {
              style: {
                left: `${this.needleOffset}px`,
              },
            }),
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
const mithrilRoot = document.getElementById('mithril-root');
const _render = () => {
  m.render(mithrilRoot, m(Root));
};

const studio = {
  init() {
    _render();
  }
};
export default studio;