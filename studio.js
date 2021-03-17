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

const _toTimeString = sec_num => {
  var minutes = Math.floor(sec_num / 60);
  var seconds = Math.floor(sec_num - (minutes * 60));
  var ms = Math.floor((sec_num - (minutes * 60) - seconds) * 100);

  if (minutes < 10) {minutes   = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  if (ms < 10) {ms = "0"+ms;}
  return minutes+':'+seconds+':'+ms;
};

const Ruler = {
  view() {
    const lines = Array(100);
    for (let i = 0; i < lines.length; i++) {
      lines[i] = m('.tick' + ((i % 10 === 0) ? '.large' : ''), {
        style: {
          left: `${i * 20}px`,
          width: '${20}px',
        },
      });
    }
    return m('.ruler', lines);
  }
};

let rootInstance = null;
const Root = {
  oninit() {
    this.currentTime = 0;
    this.playing = false;

    window.addEventListener('keydown', e => {
      switch (e.which) {
        case 32: { // space
          this.playing = !this.playing;
          _render();
          break;
        }
      }
    });
    
    rootInstance = this;
  },
  // To ensure the tag gets properly diffed on route change.
  // onbeforeupdate: init,
  update(timeDiff) {
    if (this.playing) {
      this.currentTime += timeDiff / 1000;
      _render();
    }
  },
  view() {
    const timeString = _toTimeString(this.currentTime);
    const zoom = 10;

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
            value: timeString,
          }),
        ]),
        m(".core", [
          m(".playlist", {
            onclick: e => {
              e.preventDefault();
              e.stopPropagation();
              
              const playListEl = mithrilRoot.querySelector('.playlist');
              const box = playListEl.getBoundingClientRect();
              this.currentTime = (e.clientX - box.left) / zoom;
              _render();
            },
          }, [
            m(".needle", {
              style: {
                left: `${this.currentTime * zoom}px`,
              },
            }),
            m(Ruler),
            m(".tracks", [
              m(".track"),
              m(".track"),
              m(".track"),
            ])
          ]),
          m(".clips", [
            m(".clip", {
              style: {
                backgroundColor: '#5c6bc0',
              },
            }, 'Camera'),
            m(".clip", {
              style: {
                backgroundColor: '#ec407a',
              },
            }, 'Sakura'),
            m(".clip", {
              style: {
                backgroundColor: '#ffa726',
              },
            }, 'Move'),
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
  },
  update(timeDiff) {
    rootInstance.update(timeDiff);
  }
};
export default studio;