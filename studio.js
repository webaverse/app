import m from './mithril.js';

const zoom = 10;
const entityColors = {
  camera: '#5c6bc0',
  sakura: '#ec407a',
  song: '#7e57c2',
  move: '#ffa726',
};
const entityHandlers = {
  song() {
    const audio = new Audio();
    audio.src = './assets2/song2.mp3';
    audio.addEventListener('canplaythrough', () => {
      // console.log('audio load ok');
    });
    audio.addEventListener('error', err => {
      console.warn(err);
    });

    return {
      update(currentTime) {
        if (currentTime >= 0 && currentTime < audio.duration) {
          if (audio.paused) {
            audio.play();
            audio.currentTime = currentTime;
          }
        } else {
          if (!audio.paused) {
            audio.pause();
          }
        }
      },
      stop() {
        if (!audio.paused) {
          audio.pause();
        }
      },
    };
  },
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
      m('.attributes', vnode.attrs.entity.attributes.map(attribute => m(Attribute, {
        selectedObject: vnode.attrs.selectedObject,
        entity: vnode.attrs.entity,
        attribute,
        selectObject: vnode.attrs.selectObject,
      }))),
    ]);
  },
};

const Attribute = {
  view(vnode) {
    return m('.attribute', {
      class: vnode.attrs.selectedObject === vnode.attrs.attribute ? 'selected' : '',
      style: {
        backgroundColor: entityColors[vnode.attrs.attribute.type],
        left: `${_timeToPixels(vnode.attrs.attribute.startTime)}px`,
        width: `${_timeToPixels(vnode.attrs.attribute.endTime - vnode.attrs.attribute.startTime)}px`,
      },
      onclick(e) {
        e.preventDefault();
        e.stopPropagation();
        vnode.attrs.selectObject(vnode.attrs.attribute);
      },
      ondblclick(e) {
        const time = _getEventTime(e) - vnode.attrs.entity.startTime - vnode.attrs.attribute.startTime;
        const nub = {
          type: 'inner',
          time,
        };
        vnode.attrs.attribute.nubs.push(nub);
        _render();
      },
    }, vnode.attrs.attribute.nubs.map(nub => m(Nub, {
      nub,
      selectedObject: vnode.attrs.selectedObject,
      selectObject: vnode.attrs.selectObject,
    })).concat([
      m('div', {
      }, vnode.attrs.attribute.type),
    ]));
  },
};

const Nub = {
  view(vnode) {
    let style;
    if (vnode.attrs.nub.type === 'inner') {
      style = {
        left: `${_timeToPixels(vnode.attrs.nub.time)}px`,
      };
    } else if (vnode.attrs.nub.type === 'start') {
      style = {
        left: 0,
      };
    } else if (vnode.attrs.nub.type === 'end') {
      style = {
        right: 0,
      };
    }
    
    return m('.nub', {
      class: vnode.attrs.selectedObject === vnode.attrs.nub ? 'selected' : '',
      style,
      onclick(e) {
        e.preventDefault();
        e.stopPropagation();
        vnode.attrs.selectObject(vnode.attrs.nub);
      },
    });
  },
};

const Track = {
  view(vnode) {
    const _dropAttribute = (entity, o) => {
      const {data: {type, length}, time} = o;
      const attribute = {
        type,
        startTime: time,
        endTime: time + length,
        nubs: [
          {
            type: 'start',
            time: 0,
          },
          {
            type: 'end',
            time: 0,
          },
        ],
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
      update(currentTime) {
        for (const entity of this.entities) {
          entity.update(currentTime);
        }
      },
      stop() {
        for (const entity of this.entities) {
          entity.stop();
        }
      },
    });
    this.tracks = [
      _makeTrack(),
      _makeTrack(),
      _makeTrack(),
    ];
    this.selectedObject = null;

    window.addEventListener('keydown', e => {
      switch (e.which) {
        case 27: { // esc
          this.selectedObject = null;
          _render();
          break;
        }
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
              const entity = track.entities.splice(index, 1)[0];
              entity.destroy();
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
              
              for (const attribute of entity.attributes) {
                const index = attribute.nubs.indexOf(this.selectedObject);
                if (index !== -1) {
                  attribute.nubs.splice(index, 1);
                  this.selectedObject = null;
                  changed = true;
                }
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
      
      for (const entity of this.tracks) {
        entity.update(this.currentTime);
      }
    }
  },
  view() {
    const timeString = _toTimeString(this.currentTime);
    const _stopAll = () => {
      for (const track of this.tracks) {
        track.stop();
      }
    };
    const _dropTrack = (track, o) => {
      const {data: {type, length}, time} = o;
      const entity = {
        type,
        startTime: time,
        endTime: time + length,
        attributes: [],
        update(currentTime) {
          instance && instance.update(currentTime - entity.startTime);
        },
        stop() {
          instance && instance.stop();
        },
        destroy() {
          this.stop();
        },
      };
      track.entities.push(entity);
      
      const handler = entityHandlers[type];
      const instance = handler && handler();
      
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
                  _stopAll();
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
              _stopAll();
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
                  length: 10,
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
                  length: 12,
                }));
              },
            }, 'Sakura'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.song,
              },
              draggable: true,
              ondragstart(e) {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'song',
                  length: 30,
                }));
              },
            }, 'Song'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.move,
              },
              draggable: true,
              ondragstart(e) {
                e.dataTransfer.setData('application/json', JSON.stringify({
                  type: 'move',
                  length: 10,
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