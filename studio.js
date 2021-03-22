import * as THREE from './three.module.js';
import m from './mithril.js';
import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import easing from './easing.js';
import {RigAux} from './rig-aux.js';
import {renderer, scene, camera, avatarScene} from './app-object.js';
import {getExt, unFrustumCull} from './util.js';

const localVector = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

/* const cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), new THREE.MeshPhongMaterial({
  color: 0xFF0000,
}));
scene.add(cubeMesh); */

const cubicBezier = easing(0, 1, 0, 1);
const zoom = 10;
const entityColors = {
  camera: '#5c6bc0',
  billboard: '#9ccc65',
  pass: '#ec407a',
  avatar: '#42a5f5',
  song: '#7e57c2',
  move: '#ffa726',
  pose: '#ffa726',
  viseme: '#ffa726',
  eyeTarget: '#ffa726',
  headTarget: '#ffa726',
  voice: '#ffa726',
  model: '#42a5f5',
  text: '#90a4ae',
};
let id = 0;
const _getNextId = () => ++id;
let app = null;
const entityHandlers = {
  camera(entity) {
    return {
      update(currentTime) {
        const factor = (currentTime - entity.startTime) / (entity.endTime - entity.startTime);
        if (factor >= 0 && factor <= 1) {
          camera.position.copy(entity.startPosition).lerp(entity.endPosition, factor);
          camera.quaternion.copy(entity.startQuaternion).slerp(entity.endQuaternion, factor);
        } else {
          camera.position.set(0, 1.5, 0);
          camera.quaternion.set(0, 0, 0, 1);
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        // nothing
      },
    };
  },
  avatar(entity) {
    entity.isAvatar = true;
    let eyeTargetEnabled = false;
    const eyeTarget = new THREE.Vector3();
    entity.setEyeTarget = newEyeTarget => {
      if (newEyeTarget) {
        eyeTargetEnabled = true;
        eyeTarget.copy(newEyeTarget);
      } else {
        eyeTargetEnabled = false;
      }
    };
    let headTargetEnabled = false;
    const headTarget = new THREE.Quaternion();
    entity.setHeadTarget = newHeadTarget => {
      if (newHeadTarget) {
        headTargetEnabled = true;
        headTarget.copy(newHeadTarget);
      } else {
        headTargetEnabled = false;
      }
    };
    let microphoneMediaStream = null;
    let lastMicrophoneMediaStream = null;
    entity.setMicrophoneMediaStream = newMicrophoneMediaStream => {
      microphoneMediaStream = newMicrophoneMediaStream;
    };
    let activeVisemes = [];
    entity.setActiveVisemes = newActiveVisemes => {
      activeVisemes = newActiveVisemes;
    };
    let activePoses = [];
    entity.setActivePoses = newActivePoses => {
      activePoses = newActivePoses;
    };
    
    let o;
    let live = true;
    (async () => {
      const spec = await runtime.loadFile({
        url: entity.start_url,
        ext: getExt(entity.start_url),
      }, {
        contentId: entity.start_url,
      });
      if (live) {
        /* if (!spec.isVrm && spec.run) {
          spec.run();
        } */
        const avatar = new Avatar(spec.raw, {
          fingers: true,
          hair: true,
          visemes: true,
          debug: false,
        });
        avatar.model.isVrm = true;
        avatar.setTopEnabled(false);
        avatar.setBottomEnabled(false);
        avatar.aux = new RigAux({
          rig: avatar,
          scene: avatarScene,
        });
        avatar.aux.rig = avatar;
        unFrustumCull(avatar.model);
        scene.add(avatar.model);
        
        o = avatar;
      }
    })();
    
    let lastTimestamp = performance.now();
    return {
      update(currentTime) {
        const timeDiff = currentTime - lastTimestamp;
        lastTimestamp = currentTime;

        if (o) {
          const factor = (currentTime - entity.startTime) / (entity.endTime - entity.startTime);
          if (factor >= 0 && factor <= 1) {
            o.model.position.copy(entity.startPosition).lerp(entity.endPosition, factor);
            o.model.quaternion.copy(entity.startQuaternion).slerp(entity.endQuaternion, factor);
            if (eyeTargetEnabled) {
              o.eyeTargetEnabled = true;
              o.eyeTarget.copy(eyeTarget);
            } else {
              o.eyeTargetEnabled = false;
            }
            if (headTargetEnabled) {
              o.headTargetEnabled = true;
              o.headTarget.copy(headTarget);
            } else {
              o.headTargetEnabled = false;
            }
            if (microphoneMediaStream !== lastMicrophoneMediaStream) {
              o.setMicrophoneMediaStream(microphoneMediaStream, {
                muted: false,
              });
              lastMicrophoneMediaStream = microphoneMediaStream;
            }
            o.activeVisemes = activeVisemes;
            o.activePoses = activePoses;
            o.model.visible = true;

            o.update(timeDiff);
          } else {
            o.eyeTargetEnabled = false;
            o.setMicrophoneMediaStream(null);
            lastMicrophoneMediaStream = null;
            o.activeVisemes = [];
            o.activePoses = [];
            o.model.position.set(0, 0, 0);
            o.model.quaternion.set(0, 0, 0, 1);
            o.model.visible = false;
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        if (o) {
          scene.remove(o.model);
        }
        live = false;
      },
    };
  },
  model(entity) {
    let o;
    let live = true;
    (async () => {
      o = await runtime.loadFile({
        url: entity.start_url,
        ext: getExt(entity.start_url),
      }, {
        contentId: entity.start_url,
      });
      if (live) {
        scene.add(o);
      }
    })();

    return {
      update(currentTime) {
        if (o) {
          const factor = (currentTime - entity.startTime) / (entity.endTime - entity.startTime);
          if (factor >= 0 && factor <= 1) {
            o.position.copy(entity.startPosition).lerp(entity.endPosition, factor);
            o.quaternion.copy(entity.startQuaternion).slerp(entity.endQuaternion, factor);
            o.visible = true;
          } else {
            o.position.set(0, 0, 0);
            o.quaternion.set(0, 0, 0, 1);
            o.visible = false;
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        if (o) {
          scene.remove(o);
        }
        live = false;
      },
    };
  },
  song(entity) {
    const audio = new Audio();
    audio.src = entity.start_url;
    audio.addEventListener('canplaythrough', () => {
      // console.log('audio load ok');
    });
    audio.addEventListener('error', err => {
      console.warn(err);
    });

    return {
      update(currentTime) {
        const innerTime = currentTime - entity.startTime;
        if (innerTime >= 0 && innerTime < audio.duration) {
          if (audio.paused) {
            audio.play();
            audio.currentTime = innerTime;
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
      destroy() {
        // nothing
      },
    };
  },
  billboard(entity) {
    let o;
    let live = true;
    (async () => {
      o = await runtime.loadFile({
        url: entity.start_url,
        ext: getExt(entity.start_url),
      }, {
        contentId: entity.start_url,
      });
      if (live) {
        scene.add(o);
      }
    })();
    
    return {
      update(currentTime) {
        if (o) {
          const factor = (currentTime - entity.startTime) / (entity.endTime - entity.startTime);
          if (factor >= 0 && factor <= 1) {
            o.position.copy(entity.startPosition).lerp(entity.endPosition, factor);
            o.quaternion.copy(entity.startQuaternion).slerp(entity.endQuaternion, factor);
            o.visible = true;
          } else {
            o.position.set(0, 0, 0);
            o.quaternion.set(0, 0, 0, 1);
            o.visible = false;
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        if (o) {
          scene.remove(o);
        }
        live = false;
      },
    };
  },
  pass(entity) {
    let o;
    let live = true;
    (async () => {
      o = await runtime.loadFile({
        url: entity.start_url,
        ext: getExt(entity.start_url),
      }, {
        contentId: entity.start_url,
      });
      if (live) {
        if (o.useAux) {
          o.useAux();
        }
        scene.add(o);
      }
    })();
    
    return {
      update(currentTime) {
        if (o) {
          const factor = (currentTime - entity.startTime) / (entity.endTime - entity.startTime);
          if (factor >= 0 && factor <= 1) {
            // o.position.copy(entity.startPosition).lerp(entity.endPosition, factor);
            // o.quaternion.copy(entity.startQuaternion).slerp(entity.endQuaternion, factor);
            o.visible = true;
          } else {
            // o.position.set(0, 0, 0);
            // o.quaternion.set(0, 0, 0, 1);
            o.visible = false;
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        if (o) {
          scene.remove(o);
        }
        live = false;
      },
    };
  },
  text(entity) {
    let o;
    let live = true;
    (async () => {
      o = await runtime.loadFile({
        url: entity.start_url,
        ext: getExt(entity.start_url),
      }, {
        contentId: entity.start_url,
      });
      if (live) {
        scene.add(o);
      }
    })();
    
    return {
      update(currentTime) {
        if (o) {
          const factor = (currentTime - entity.startTime) / (entity.endTime - entity.startTime);
          if (factor >= 0 && factor <= 1) {
            o.position.copy(entity.startPosition).lerp(entity.endPosition, factor);
            o.quaternion.copy(entity.startQuaternion).slerp(entity.endQuaternion, factor);
            o.visible = true;
          } else {
            o.position.set(0, 0, 0);
            o.quaternion.set(0, 0, 0, 1);
            o.visible = false;
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        if (o) {
          scene.remove(o);
        }
        live = false;
      },
    };
  },
};
const attributeHandlers = {
  idle(entity, attribute) {
    return {
      update(currentTime) {
        if (entity.isAvatar) {
          const idleTime = currentTime - entity.startTime - attribute.startTime;
          entity.setIdleTime(idleTime);
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        // nothing
      },
    };
  },
  eyeTarget(entity, attribute) {
    return {
      update(currentTime) {
        if (entity.isAvatar) {
          const factor = (currentTime - entity.startTime - attribute.startTime) / (attribute.endTime - attribute.startTime);
          if (factor >= 0 && factor <= 1) {
            entity.setEyeTarget(localVector.copy(attribute.startPosition).lerp(attribute.endPosition, factor));
          } else {
            entity.setEyeTarget(null);
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        // nothing
      },
    };
  },
  headTarget(entity, attribute) {
    return {
      update(currentTime) {
        if (entity.isAvatar) {
          const factor = (currentTime - entity.startTime - attribute.startTime) / (attribute.endTime - attribute.startTime);
          if (factor >= 0 && factor <= 1) {
            entity.setHeadTarget(localQuaternion.copy(attribute.startQuaternion).slerp(attribute.endQuaternion, factor));
          } else {
            entity.setHeadTarget(null);
          }
        }
      },
      stop() {
        // nothing
      },
      destroy() {
        // nothing
      },
    };
  },
  pose(entity, attribute) {
    return {
      update(currentTime) {
        if (entity.isAvatar) {
          let f = 1 - Math.abs(currentTime - ((entity.startTime + attribute.startTime) + (entity.startTime + attribute.startTime + attribute.length))/2) / (attribute.length/2);
          f = Math.min(Math.max(f, 0), 1);
          f = cubicBezier(f);
          
          entity.setActivePoses([
            {
              index: attribute.index,
              value: f,
            },
          ]);
        }
      },
      stop() {
        /* if (!audio.paused) {
          audio.pause();
        } */
      },
      destroy() {
        // nothing
      },
    };
  },
  viseme(entity, attribute) {
    return {
      update(currentTime) {
        if (entity.isAvatar) {
          let f = 1 - Math.abs(currentTime - ((entity.startTime + attribute.startTime) + (entity.startTime + attribute.startTime + attribute.length))/2) / (attribute.length/2);
          f = Math.min(Math.max(f, 0), 1);
          f = cubicBezier(f);
          
          entity.setActiveVisemes([
            {
              index: attribute.index,
              value: f,
            },
          ]);
        }
      },
      stop() {
        /* if (!audio.paused) {
          audio.pause();
        } */
      },
      destroy() {
        // nothing
      },
    };
  },
  voice(entity, attribute) {
    const audio = new Audio();
    audio.src = attribute.start_url;
    audio.addEventListener('canplaythrough', () => {
      // console.log('audio load ok');
    });
    audio.addEventListener('error', err => {
      console.warn(err);
    });

    return {
      update(currentTime) {
        if (entity.isAvatar) {
          const innerTime = currentTime - entity.startTime - attribute.startTime;
          if (innerTime >= 0 && innerTime < audio.duration) {
            if (audio.paused) {
              audio.play();
              audio.currentTime = innerTime;
              
              entity.setMicrophoneMediaStream(audio);
            }
          } else {
            if (!audio.paused) {
              audio.pause();

              entity.setMicrophoneMediaStream(null);
            }
          }
        }
      },
      stop() {
        if (!audio.paused) {
          audio.pause();
        }
      },
      destroy() {
        // nothing
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
      draggable: true,
      ondragstart(e) {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'entity',
          id: vnode.attrs.entity.id,
        }));
      },
      ondragover(e) {
        e.preventDefault();
      },
      ondrop(e) {
        const dataString = e.dataTransfer.getData('application/json');
        if (dataString) {
          const data = JSON.parse(dataString);
          if (vnode.attrs.drop({
            data,
            time: _getEventTime(e) - vnode.attrs.entity.startTime,
          })) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
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
      draggable: true,
      ondragstart(e) {
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'attribute',
          id: vnode.attrs.attribute.id,
        }));
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
    return m('.track', {
      ondragover(e) {
        e.preventDefault();
      },
      ondrop(e) {
        const dataString = e.dataTransfer.getData('application/json');
        if (dataString) {
          const data = JSON.parse(dataString);
          if (vnode.attrs.drop({
            data,
            time: _getEventTime(e),
          })) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      },
    }, m('.entities', vnode.attrs.entities.map(entity => m(Entity, {
      entity,
      selectedObject: vnode.attrs.selectedObject,
      selectObject: vnode.attrs.selectObject,
      drop(o) {
        return _dropAttribute(entity, o);
      },
    }))));
  },
};

const defaultLength = 60;
const adders = {
  camera(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'camera',
      length: defaultLength,
      startPosition: new THREE.Vector3(-5, 1, -1).toArray(),
      endPosition: new THREE.Vector3(-5, 1, -1).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.03).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI * 0.03).toArray(),
    }));
  },
  billboard(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'billboard',
      length: 12,
      start_url: './sakura/index.glbb',
      startPosition: new THREE.Vector3(0, 0, -1).toArray(),
      endPosition: new THREE.Vector3(0, 2, -1).toArray(),
      startQuaternion: new THREE.Quaternion(0, 0, 0, 1).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.2).toArray(),
    }));
  },
  depthPass(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pass',
      length: 12,
      start_url: './depth-pass/index.glfs',
    }));
  },
  song(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'song',
      length: 30,
      start_url: './assets2/song2.mp3',
    }));
  },
  avatar1(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'avatar',
      length: defaultLength,
      start_url: './assets2/sacks3.vrm',
      startPosition: new THREE.Vector3(-5, 1.5, -4).toArray(),
      endPosition: new THREE.Vector3(-5, 1.5, -4).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).toArray(),
    }));
  },
  avatar2(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'avatar',
      length: defaultLength,
      start_url: './assets2/kasamoto_kanji.vrm',
      startPosition: new THREE.Vector3(-4, 1.6, -4).toArray(),
      endPosition: new THREE.Vector3(-4, 1.6, -4).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI).toArray(),
    }));
  },
  avatar3(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'avatar',
      length: defaultLength,
      start_url: './assets2/shilo.vrm',
      startPosition: new THREE.Vector3(-5.7, 1.08, -3.5).toArray(),
      endPosition: new THREE.Vector3(-5.7, 1.08, -3.5).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 1.5).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 1.5).toArray(),
    }));
  },
  move(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'move',
      length: 10,
    }));
  },
  viseme1(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'viseme',
      length: defaultLength,
      index: 25,
    }));
  },
  viseme2(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'viseme',
      length: defaultLength,
      index: 23,
    }));
  },
  viseme3(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'viseme',
      length: defaultLength,
      index: 22,
    }));
  },
  pose1(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pose',
      length: defaultLength,
      index: 30,
    }));
  },
  pose2(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pose',
      length: defaultLength,
      index: 33,
    }));
  },
  pose3(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pose',
      length: defaultLength,
      index: 81,
    }));
  },
  pose4(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pose',
      length: defaultLength,
      index: 153, // cute
    }));
  },
  pose5(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pose',
      length: defaultLength,
      index: 214, // shootself
    }));
  },
  pose6(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'pose',
      length: defaultLength,
      index: 178, // open
    }));
  },
  eyeTarget1(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'eyeTarget',
      length: 10,
      startPosition: new THREE.Vector3(-5, 1, 10).toArray(),
      endPosition: new THREE.Vector3(-5, 1, 10).toArray(),
    }));
  },
  eyeTarget2(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'eyeTarget',
      length: 10,
      startPosition: new THREE.Vector3(-10, -10, 0).toArray(),
      endPosition: new THREE.Vector3(-10, -10, 0).toArray(),
    }));
  },
  eyeTarget3(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'eyeTarget',
      length: 10,
      startPosition: new THREE.Vector3(0, 1.5, 0).toArray(),
      endPosition: new THREE.Vector3(0, 1.5, 0).toArray(),
    }));
  },
  headTarget1(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'headTarget',
      length: 10,
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.1).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI * 0.1).toArray(),
    }));
  },
  headTarget2(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'headTarget',
      length: 10,
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.1).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.1).toArray(),
    }));
  },
  headTarget3(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'headTarget',
      length: 10,
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.1)
        // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.1))
        .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.05))
        .toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.1)
        // .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI * 0.1))
        .premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.05))
        .toArray(),
    }));
  },
  voice(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'voice',
      length: defaultLength,
      start_url: './ghost.mp3',
    }));
  },
  fox(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'model',
      length: 10,
      start_url: './assets2/fox.glb',
      startPosition: new THREE.Vector3(1, 2, -1.5).toArray(),
      endPosition: new THREE.Vector3(0, 2, -3).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0).toArray(),
    }));
  },
  homespace(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'model',
      length: defaultLength,
      start_url: './homespace/homespace.glb',
      startPosition: new THREE.Vector3(0, 0, 0).toArray(),
      endPosition: new THREE.Vector3(0, 0, 0).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5).toArray(),
    }));
  },
  donotwant(e) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'text',
      length: defaultLength,
      start_url: './donotwant/iranai.txt',
      startPosition: new THREE.Vector3(-3, 1.5, -3).toArray(),
      endPosition: new THREE.Vector3(-3, 1.5, -3).toArray(),
      startQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.1).toArray(),
      endQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0).toArray(),
    }));
  },
};
const _useAdder = o => {
  if (typeof o === 'string') {
    const name = o;
    if (!adders[name]) {
      console.warn('no such adder', {name});
    }
    adders[name]({
      dataTransfer: {
        setData(type, s) {
          _dropEntity(rootInstance.tracks[0], {
            data: JSON.parse(s),
            time: 0,
          });
        },
      },
    });
  } else if (Array.isArray(o)) {
    const firstTrack = rootInstance.tracks[0];

    const [name, childNames] = o;
    adders[name]({
      dataTransfer: {
        setData(type, s) {
          _dropEntity(firstTrack, {
            data: JSON.parse(s),
            time: 0,
          });
        },
      },
    });
    for (const childName of childNames) {
      adders[childName]({
        dataTransfer: {
          setData(type, s) {
            _dropAttribute(firstTrack.entities[firstTrack.entities.length - 1], {
              data: JSON.parse(s),
              time: 0,
            });
          },
        },
      });
    }
  } else {
    console.warn('unknown type of name', {name});
  }
};
const _dropEntity = (track, o) => {
  let result = false;
  const {data: {id, type, length, start_url, startPosition, endPosition, startQuaternion, endQuaternion}, time} = o;
  if (type === 'attribute' || type === 'entity') {
    if (track.id !== id) {
      const object = rootInstance.spliceObject(id);
      object.startTime = time;
      object.endTime = time + object.length;
      track.entities.push(object);
      result = true;
    }
  } else {
    const entity = {
      type,
      id: _getNextId(),
      start_url,
      startTime: time,
      endTime: time + length,
      length,
      attributes: [],
      startPosition: startPosition && new THREE.Vector3().fromArray(startPosition),
      endPosition: endPosition && new THREE.Vector3().fromArray(endPosition),
      startQuaternion: startQuaternion && new THREE.Quaternion().fromArray(startQuaternion),
      endQuaternion: endQuaternion && new THREE.Quaternion().fromArray(endQuaternion),
      update(currentTime) {
        instance && instance.update(currentTime);
        
        for (const attribute of this.attributes) {
          attribute.update(currentTime);
        }
      },
      stop() {
        instance && instance.stop();
        
        for (const attribute of this.attributes) {
          attribute.stop();
        }
      },
      destroy() {
        instance && instance.stop();
        instance && instance.destroy();
        
        for (const attribute of this.attributes) {
          attribute.destroy();
        }
      },
    };
    track.entities.push(entity);

    const handler = entityHandlers[type];
    const instance = handler && handler(entity);
    
    result = true;
  }
  _render();
  
  return result;
};
const _makeNubs = () => ([
  {
    type: 'start',
    time: 0,
  },
  {
    type: 'end',
    time: 0,
  },
]);
const _dropAttribute = (entity, o) => {
  let result = false;
  const {data: {id, type, length, index, start_url, startPosition, endPosition, startQuaternion, endQuaternion}, time} = o;
  if (type === 'attribute' || type === 'entity') {
    if (entity.id !== id) {
      const object = rootInstance.spliceObject(id);
      object.start_url = start_url;
      object.startTime = time;
      object.endTime = time + object.length;
      object.nubs = _makeNubs();
      entity.attributes.push(object);
      result = true;
    }
  } else {
    const attribute = {
      id: _getNextId(),
      type,
      startTime: time,
      endTime: time + length,
      length,
      index,
      start_url,
      startPosition: startPosition && new THREE.Vector3().fromArray(startPosition),
      endPosition: endPosition && new THREE.Vector3().fromArray(endPosition),
      startQuaternion: startQuaternion && new THREE.Quaternion().fromArray(startQuaternion),
      endQuaternion: endQuaternion && new THREE.Quaternion().fromArray(endQuaternion),
      nubs: _makeNubs(),
      update(currentTime) {
        instance && instance.update(currentTime);
      },
      stop() {
        instance && instance.stop();
      },
      destroy() {
        instance && instance.stop();
        instance && instance.destroy();
      },
    };
    entity.attributes.push(attribute);

    const handler = attributeHandlers[type];
    const instance = handler && handler(entity, attribute);
    
    result = true;
  }
  _render();
  
  return result;
};

let rootInstance = null;
const _stopAllTracks = () => {
  for (const track of rootInstance.tracks) {
    track.stop();
  }
};
const Root = {
  oninit() {
    this.currentTime = 0;

    const _makeTrack = () => ({
      id: _getNextId(),
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
    const numTracks = 4;
    this.tracks = Array(numTracks);
    for (let i = 0; i < numTracks; i++) {
      this.tracks[i] = _makeTrack();
    }
    this.selectedObject = null;

    window.addEventListener('keydown', e => {
      switch (e.which) {
        case 27: { // esc
          this.selectedObject = null;
          _render();
          break;
        }
        case 32: { // space
          if (app.paused) {
            app.play();
          } else {
            app.pause();
          }
          if (app.paused) {
            _stopAllTracks();
          }
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
    if (!app.paused) {
      this.currentTime += timeDiff / 1000;
      _render();
      
      for (const track of this.tracks) {
        track.update(this.currentTime);
      }
    }
  },
  /* findObject(id) {
    for (const track of this.tracks) {
      if (track.id === id) {
        return track;
      }
      
      for (const entity of track.entities) {
        if (entity.id === id) {
          return entity;
        }

        for (const attribute of entity.attributes) {
          if (attribute.id === id) {
            return attribute;
          }
        }
      }
    }
    return null;
  }, */
  spliceObject(id) {
    for (let i = 0; i < this.tracks.length; i++) {
      const track = this.tracks[i];
      if (track.id === id) {
        this.tracks.splice(i, 1);
        return track;
      }
      
      for (let i = 0; i < track.entities.length; i++) {
        const entity = track.entities[i];
        if (entity.id === id) {
          track.entities.splice(i, 1);
          return entity;
        }

        for (let i = 0; i < entity.attributes.length; i++) {
          const attribute = entity.attributes[i];
          if (attribute.id === id) {
            entity.attributes.splice(i, 1);
            return attribute;
          }
        }
      }
    }
    return null;
  },
  view(vnode) {
    const timeString = _toTimeString(this.currentTime);

    return m(".studio", [
      m("footer", [
        m(".toolbar", [
          m(".buttons", [
            m(".button", {
              class: app.paused ? '' : 'disabled',
            }, [
              m("i.fa.fa-play", {
                onclick: e => {
                  app.play();
                  _render();
                },
              }),
            ]),
            m(".button", {
              class: app.paused ? 'disabled' : '',
            }, [
              m("i.fa.fa-stop", {
                onclick: e => {
                  app.pause();
                  _stopAllTracks();
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
              _stopAllTracks();
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
                  return _dropEntity(track, o);
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
                adders.camera(e);
              },
            }, 'Camera'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.billboard,
              },
              draggable: true,
              ondragstart(e) {
                adders.billboard(e);
              },
            }, 'Billboard'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.pass,
              },
              draggable: true,
              ondragstart(e) {
                adders.depthPass(e);
              },
            }, 'Pass'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.song,
              },
              draggable: true,
              ondragstart(e) {
                adders.song(e);
              },
            }, 'Song'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.avatar,
              },
              draggable: true,
              ondragstart(e) {
                adders.avatar1(e);
              },
            }, 'Avatar 1'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.avatar,
              },
              draggable: true,
              ondragstart(e) {
                adders.avatar2(e);
              },
            }, 'Avatar 2'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.avatar,
              },
              draggable: true,
              ondragstart(e) {
                adders.avatar3(e);
              },
            }, 'Avatar 3'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.move,
              },
              draggable: true,
              ondragstart(e) {
                adders.move(e);
              },
            }, 'Move'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.pose,
              },
              draggable: true,
              ondragstart(e) {
                adders.pose1(e);
              },
            }, 'Pose 1'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.pose,
              },
              draggable: true,
              ondragstart(e) {
                adders.pose3(e);
              },
            }, 'Pose 3'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.viseme,
              },
              draggable: true,
              ondragstart(e) {
                adders.viseme1(e);
              },
            }, 'Viseme 1'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.pose,
              },
              draggable: true,
              ondragstart(e) {
                adders.pose3(e);
              },
            }, 'Pose 3'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.viseme,
              },
              draggable: true,
              ondragstart(e) {
                adder.viseme3(e);
              },
            }, 'Viseme 3'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.eyeTarget,
              },
              draggable: true,
              ondragstart(e) {
                adders.eyeTarget1(e);
              },
            }, 'Eye Target 1'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.headTarget,
              },
              draggable: true,
              ondragstart(e) {
                adders.headTarget1(e);
              },
            }, 'Head Target 1'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.voice,
              },
              draggable: true,
              ondragstart(e) {
                adders.voice(e);
              },
            }, 'Voice'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.model,
              },
              draggable: true,
              ondragstart(e) {
                adders.fox(e);
              },
            }, 'Fox'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.model,
              },
              draggable: true,
              ondragstart(e) {
                adders.homespace(e);
              },
            }, 'Homespace'),
            m(".clip", {
              style: {
                backgroundColor: entityColors.text,
              },
              draggable: true,
              ondragstart(e) {
                adders.donotwant(e);
              },
            }, 'Text'),
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
  init(newApp) {
    app = newApp;
    _render();
    
    [
      'camera',
      'homespace',
      // 'depthPass',
      [
        'avatar1',
        [
          'pose1',
          'viseme1',
          'eyeTarget1',
          'headTarget1',
        ],
      ],
      [
        'avatar2',
        [
          'pose2',
          'viseme2',
          'eyeTarget2',
          'headTarget2',
        ],
      ],
      [
        'avatar3',
        [
          'pose3',
          'viseme3',
          'eyeTarget3',
          'headTarget3',
        ],
      ],
    ].forEach(n => {
      _useAdder(n);
    });
  },
  update(timeDiff) {
    rootInstance.update(timeDiff);
  }
};
export default studio;