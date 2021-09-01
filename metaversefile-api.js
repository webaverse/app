import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import React from 'react';
import * as ReactThreeFiber from '@react-three/fiber';
import metaversefile from 'metaversefile';
import {getRenderer, scene, camera, appManager} from './app-object.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import * as ui from './vr-ui.js';

const localVector2D = new THREE.Vector2();

class PlayerHand {
  constructor() {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
  }
}
class LocalPlayer {
  constructor() {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.leftHand = new PlayerHand();
    this.rightHand = new PlayerHand();
    this.hands = [
      this.leftHand,
      this.rightHand,
    ];
  }
}
const localPlayer = new LocalPlayer();
let localPlayerNeedsUpdate = false;
appManager.addEventListener('startframe', e => {
  localPlayerNeedsUpdate = true;
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
    console.warn(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children; 
  }
}
function createPointerEvents(store) {
  // const { handlePointer } = createEvents(store)
  const handlePointer = key => e => {
    // const handlers = eventObject.__r3f.handlers;
    // console.log('handle pointer', key, e);
  };
  const names = {
    onClick: 'click',
    onContextMenu: 'contextmenu',
    onDoubleClick: 'dblclick',
    onWheel: 'wheel',
    onPointerDown: 'pointerdown',
    onPointerUp: 'pointerup',
    onPointerLeave: 'pointerleave',
    onPointerMove: 'pointermove',
    onPointerCancel: 'pointercancel',
    onLostPointerCapture: 'lostpointercapture',
  }

  return {
    connected: false,
    handlers: (Object.keys(names).reduce(
      (acc, key) => ({ ...acc, [key]: handlePointer(key) }),
      {},
    )),
    connect: (target) => {
      const { set, events } = store.getState()
      events.disconnect?.()
      set((state) => ({ events: { ...state.events, connected: target } }))
      Object.entries(events?.handlers ?? []).forEach(([name, event]) =>
        target.addEventListener(names[name], event, { passive: true }),
      )
    },
    disconnect: () => {
      const { set, events } = store.getState()
      if (events.connected) {
        Object.entries(events.handlers ?? []).forEach(([name, event]) => {
          if (events && events.connected instanceof HTMLElement) {
            events.connected.removeEventListener(names[name], event)
          }
        })
        set((state) => ({ events: { ...state.events, connected: false } }))
      }
    },
  }
}

let loaders = null;
const _getLoaders = () => {
  if (!loaders) {
    const gltfLoader = new GLTFLoader();
    loaders = {
      gltfLoader,
    };
  }
  return loaders;
};

let currentAppRender = null;
let recursion = 0;
metaversefile.setApi({
  async import(s) {
    return await import(s);
  },
  async load(s) {
    if (/^https?:\/\//.test(s)) {
      s = `/@proxy/${s}`;
    }
    // console.log('do import', s);
    const m = await this.import(s);
    const app = this.add(m);
    return app;
  },
  useFrame(fn) {
    const app = currentAppRender;
    if (app) {
      appManager.addEventListener('frame', e => {
        fn(e.data);
      });
      app.addEventListener('destroy', () => {
        appManager.removeEventListener('frame', fn);
      });
    } else {
      throw new Error('useFrame cannot be called outside of render()');
    }
  },
  useBeforeRender() {
    recursion++;
    if (recursion === 1) {
      // scene.directionalLight.castShadow = false;
      if (rigManager.localRig) {
        rigManager.localRig.model.visible = true;
      }
    }
  },
  useAfterRender() {
    recursion--;
    if (recursion === 0) {
      // scene.directionalLight.castShadow = true;
      if (rigManager.localRig) {
        rigManager.localRig.model.visible = false;
      }
    }
  },
  useCleanup(fn) {
    const app = currentAppRender;
    if (app) {
      app.addEventListener('destroy', () => {
        fn();
      });
    } else {
      throw new Error('useCleanup cannot be called outside of render()');
    }
  },
  useLocalPlayer() {
    if (localPlayerNeedsUpdate) {
      if (rigManager.localRig) {
        localPlayer.position.copy(rigManager.localRig.inputs.hmd.position);
        localPlayer.quaternion.copy(rigManager.localRig.inputs.hmd.quaternion);
        localPlayer.leftHand.position.copy(rigManager.localRig.inputs.leftGamepad.position);
        localPlayer.leftHand.quaternion.copy(rigManager.localRig.inputs.leftGamepad.quaternion);
        localPlayer.rightHand.position.copy(rigManager.localRig.inputs.rightGamepad.position);
        localPlayer.rightHand.quaternion.copy(rigManager.localRig.inputs.rightGamepad.quaternion);
      } else {
        localPlayer.position.set(0, 0, 0);
        localPlayer.quaternion.set(0, 0, 0, 1);
        localPlayer.leftHand.position.set(0, 0, 0);
        localPlayer.leftHand.quaternion.set(0, 0, 0, 1);
        localPlayer.rightHand.position.set(0, 0, 0);
        localPlayer.rightHand.quaternion.set(0, 0, 0, 1);
      }
      localPlayerNeedsUpdate = false;
    }
    return localPlayer;
  },
  useLoaders() {
    return _getLoaders();
  },
  usePhysics() {
    return physicsManager;
  },
  useUi() {
    return ui;
  },
  useActivate(fn) {
    // XXX implement this
  },
  async add(m) {
    const appId = appManager.getNextAppId();
    const app = appManager.createApp(appId);
    currentAppRender = app;

    let renderSpec = null;
    const fn = m.default;
    (() => {
      try {
        if (typeof fn === 'function') {
          renderSpec = fn(metaversefile);
        } else {
          return null;
        }
      } catch(err) {
        console.warn(err);
        return null;
      }
    })();
    currentAppRender = null
    
    const loaded = renderSpec?.loaded;
    if (loaded instanceof Promise) {
      await loaded;
    }

    // console.log('gor react', React, ReactAll);
    if (renderSpec instanceof THREE.Object3D) {
      const o = renderSpec;
      app.add(o);
      
      app.addEventListener('destroy', () => {
        app.remove(o);
      });
      
      return app;
    } else if (React.isValidElement(renderSpec)) {
      const o = new THREE.Object3D();
      // o.contentId = contentId;
      o.getPhysicsIds = () => app.physicsIds;
      o.destroy = () => {
        appManager.destroyApp(appId);
        
        (async () => {
          const roots = ReactThreeFiber._roots;
          const root = roots.get(rootDiv);
          const fiber = root?.fiber
          if (fiber) {
            const state = root?.store.getState()
            if (state) state.internal.active = false
            await new Promise((accept, reject) => {
              ReactThreeFiber.reconciler.updateContainer(null, fiber, null, () => {
                if (state) {
                  // setTimeout(() => {
                    state.events.disconnect?.()
                    // state.gl?.renderLists?.dispose?.()
                    // state.gl?.forceContextLoss?.()
                    ReactThreeFiber.dispose(state)
                    roots.delete(canvas)
                    // if (callback) callback(canvas)
                  // }, 500)
                }
                accept();
              });
            });
          }
        })();
      };
      app.add(o);
      
      const renderer = getRenderer();
      const sizeVector = renderer.getSize(localVector2D);
      const rootDiv = document.createElement('div');
      let rtfScene = null;
      appManager.addEventListener('frame', e => {
        const renderer2 = Object.create(renderer);
        renderer2.render = () => {
          // nothing
          // console.log('elide render');
        };
        renderer2.setSize = () => {
          // nothing
        };
        renderer2.setPixelRatio = () => {
          // nothing
        };
        
        ReactThreeFiber.render(
          React.createElement(ErrorBoundary, {}, [
            React.createElement(fn, {
              // app: appContextObject,
              key: 0,
            }),
          ]),
          rootDiv,
          {
            gl: renderer2,
            camera,
            size: {
              width: sizeVector.x,
              height: sizeVector.y,
            },
            events: createPointerEvents,
            onCreated: state => {
              // state = newState;
              // scene.add(state.scene);
              console.log('got state', state);
              const {scene: newRtfScene} = state;
              if (newRtfScene !== rtfScene) {
                if (rtfScene) {
                  o.remove(rtfScene);
                  rtfScene = null;
                }
                rtfScene = newRtfScene;
                o.add(rtfScene);
              }
            },
            frameloop: 'demand',
          }
        );
      });
      app.addEventListener('destroy', async () => {
        const roots = ReactThreeFiber._roots;
        const root = roots.get(rootDiv);
        const fiber = root?.fiber
        if (fiber) {
          const state = root?.store.getState()
          if (state) state.internal.active = false
          await new Promise((accept, reject) => {
            ReactThreeFiber.reconciler.updateContainer(null, fiber, null, () => {
              if (state) {
                // setTimeout(() => {
                  state.events.disconnect?.()
                  // state.gl?.renderLists?.dispose?.()
                  // state.gl?.forceContextLoss?.()
                  ReactThreeFiber.dispose(state)
                  roots.delete(canvas)
                  // if (callback) callback(canvas)
                // }, 500)
              }
              accept();
            });
          });
        }
      });
      
      return app;
    } else if (renderSpec === null) {
      appManager.destroyApp(appId);
      return null;
    } else {
      appManager.destroyApp(appId);
      console.warn('unknown renderSpec:', renderSpec);
      throw new Error('unknown renderSpec');
    }
  },
});
window.metaversefile = metaversefile;
/* [
  './lol.jsx',
  './street/.metaversefile',
  './assets2/sacks3.glb',
].map(async u => {
  const module = await metaversefile.import(u);
  metaversefile.add(module);
}); */

export default metaversefile;