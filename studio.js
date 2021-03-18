import m from './mithril.js';

const zoom = 10;
const entityColors = {
  camera: '#5c6bc0',
  sakura: '#ec407a',
  move: '#ffa726',
};

const _toTimeString = sec_num => {
  var minutes = Math.floor(sec_num / 60);
  var seconds = Math.floor(sec_num - (minutes * 60));
  var ms = Math.floor((sec_num - (minutes * 60) - seconds) * 100);

  if (minutes < 10) {minutes   = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  if (ms < 10) {ms = "0"+ms;}
  return minutes+':'+seconds+':'+ms;
};
const _getEventTime = e => {
  const playListEl = mithrilRoot.querySelector('.playlist');
  const box = playListEl.getBoundingClientRect();
  return (e.clientX - box.left) / zoom;
};
const _timeToPixels = t => t * zoom;

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

const Entity = {
  view(vnode) {
    return m('.entity', {
      class: vnode.attrs.selectedObject === vnode.attrs.entity ? 'selected' : '',
      style: {
        backgroundColor: entityColors[vnode.attrs.entity.type],
        left: `${_timeToPixels(vnode.attrs.entity.startTime)}px`,
        width: `${_timeToPixels(vnode.attrs.entity.endTime - vnode.attrs.entity.startTime)}px`,
      },
      onclick(e) {
        e.preventDefault();
        e.stopPropagation();
        vnode.attrs.selectObject(vnode.attrs.entity);
      },
      ondragover(e) {
        e.preventDefault();
      },
      ondrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const dataString = e.dataTransfer.getData('application/json');
        const data = JSON.parse(dataString);
        vnode.attrs.drop({
          data,
          time: _getEventTime(e) - vnode.attrs.entity.startTime,
        });
      },
    }, [
      m('.core', vnode.attrs.entity.type),
      m('.attributes', vnode.attrs.entity.attributes.map(a => {
        return m('.attribute', {
          class: vnode.attrs.selectedObject === a ? 'selected' : '',
          style: {
            backgroundColor: entityColors[a.type],
            left: `${_timeToPixels(a.startTime)}px`,
            width: `${_timeToPixels(a.endTime - a.startTime)}px`,
          },
          onclick(e) {
            e.preventDefault();
            e.stopPropagation();
            vnode.attrs.selectObject(a);
          },
        }, a.type);
      })),
    ]);
  },
};

const Track = {
  view(vnode) {
    const _dropAttribute = (entity, o) => {
      const {data: {type}, time} = o;
      const attribute = {
        type,
        startTime: time,
        endTime: time + 5,
      };
      entity.attributes.push(attribute);
      _render();
    };
    
    return m('.track', {
      ondragover(e) {
        e.preventDefault();
      },
      ondrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const dataString = e.dataTransfer.getData('application/json');
        const data = JSON.parse(dataString);
        vnode.attrs.drop({
          data,
          time: _getEventTime(e),
        });
      },
    }, m('.entities', vnode.attrs.entities.map(entity => m(Entity, {
      entity,
      selectedObject: vnode.attrs.selectedObject,
      selectObject: vnode.attrs.selectObject,
      drop(o) {
        _dropAttribute(entity, o);
      },
    }))));
  },
};

let rootInstance = null;
const Root = {
  oninit() {
    this.currentTime = 0;
    this.playing = false;
    const _makeTrack = () => ({
      entities: [],
    });
    this.tracks = [
      _makeTrack(),
      _makeTrack(),
      _makeTrack(),
    ];
    this.selectedObject = null;

    window.addEventListener('keydown', e => {
      switch (e.which) {
        case 32: { // space
          this.playing = !this.playing;
          _render();
          break;
        }
        case 8: // backspace
        case 46: // delete
        {
          let changed = false;
          for (const track of this.tracks) {
            const index = track.entities.indexOf(this.selectedObject);
            if (index !== -1) {
              track.entities.splice(index, 1);
              this.selectedObject = null;
              changed = true;
            }
            
            for (const entity of track.entities) {
              const index = entity.attributes.indexOf(this.selectedObject);
              if (index !== -1) {
                entity.attributes.splice(index, 1);
                this.selectedObject = null;
                changed = true;
              }
            }
          }
          if (changed) {
            _render();
          }
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
    const _dropTrack = (track, o) => {
      const {data: {type}, time} = o;
      const entity = {
        type,
        startTime: time,
        endTime: time + 20,
        attributes: [],
      };
      track.entities.push(entity);
      _render();
    };

    return m(".studio", [
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
              
              this.currentTime = _getEventTime(e);
              this.selectedObject = null;
              _render();
            },
          }, [
            m(".needle", {
              style: {
                left: `${_timeToPixels(this.currentTime)}px`,
              },
            }),
            m(Ruler),
            m(".tracks", this.tracks.map(track => {
              return m(Track, {
                entities: track.entities,
                selectedObject: this.selectedObject,
                drop(o) {
                  _dropTrack(track, o);
                },
                selectObject: o => {
                  this.selectedObject = o;
                  _render();
                },
              });
            })),
          ]),
          m(".clips", [
            m(".clip", {
              style: {
                backgroundColor: entityColors.camera,
              },
              draggable: true,
              ondragstart(e) {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'camera',
                }));
              },
            }, 'Camera'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.sakura,
              },
              draggable: true,
              ondragstart(e) {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'sakura',
                }));
              },
            }, 'Sakura'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.move,
              },
              draggable: true,
              ondragstart(e) {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'move',
                }));
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