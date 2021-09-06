import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import React from 'react';
import * as ReactThreeFiber from '@react-three/fiber';
import metaversefile from 'metaversefile';
import {App, getRenderer, scene, camera, appManager} from './app-object.js';
import physicsManager from './physics-manager.js';
import {rigManager} from './rig.js';
import * as ui from './vr-ui.js';
import {ShadertoyLoader} from './shadertoy.js';

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
    const shadertoyLoader = new ShadertoyLoader();
    loaders = {
      gltfLoader,
      shadertoyLoader,
    };
  }
  return loaders;
};

let currentAppRender = null;
let recursion = 0;
metaversefile.setApi({
  async import(s) {
    if (/^https?:\/\//.test(s)) {
      s = `/@proxy/${s}`;
    }
    // console.log('do import', s);
    try {
      const m = await import(s);
      return m;
    } catch(err) {
      console.warn('error loading', JSON.stringify(s), err.stack);
      return null;
    }
  },
  async load(s) {
    const m = await this.import(s);
    const app = this.createApp();
    await this.addModule(app, m);
    return app;
  },
  useApp() {
    const app = currentAppRender;
    if (app) {
      return app;
    } else {
      throw new Error('useApp cannot be called outside of render()');
    }
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
    const app = currentAppRender;
    if (app) {
      const physics = {};
      for (const k in physicsManager) {
        physics[k] = physicsManager[k];
      }
      const localVector = new THREE.Vector3();
      const localVector2 = new THREE.Vector3();
      const localQuaternion = new THREE.Quaternion();
      const localMatrix = new THREE.Matrix4();
      const localMatrix2 = new THREE.Matrix4();
      physics.addBoxGeometry = (addBoxGeometry => function(position, quaternion, size, dynamic) {
        app.updateMatrixWorld();
        localMatrix
          .compose(position, quaternion, localVector2.set(1, 1, 1))
          .premultiply(app.matrixWorld)
          .decompose(localVector, localQuaternion, localVector2);
        position = localVector;
        quaternion = localQuaternion;
        const physicsId = addBoxGeometry.call(this, position, quaternion, size, dynamic);
        app.physicsIds.push(physicsId);
        return physicsId;
      })(physics.addBoxGeometry);
      physics.addGeometry = (addGeometry => function(mesh) {
        const physicsId = addGeometry.apply(this, arguments);
        app.physicsIds.push(physicsId);
        return physicsId;
      })(physics.addGeometry);
      physics.addCookedGeometry = (addCookedGeometry => function(buffer, position, quaternion, scale) {
        const physicsId = addCookedGeometry.apply(this, arguments);
        app.physicsIds.push(physicsId);
        return physicsId;
      })(physics.addCookedGeometry);
      physics.addConvexGeometry = (addConvexGeometry => function(mesh) {
        const physicsId = addConvexGeometry.apply(this, arguments);
        app.physicsIds.push(physicsId);
        return physicsId;
      })(physics.addConvexGeometry);
      physics.addCookedConvexGeometry = (addCookedConvexGeometry => function(buffer, position, quaternion, scale) {
        const physicsId = addCookedConvexGeometry.apply(this, arguments);
        app.physicsIds.push(physicsId);
        return physicsId;
      })(physics.addCookedConvexGeometry);
      physics.getPhysicsTransform = (getPhysicsTransform => function(physicsId) {
        const transform = getPhysicsTransform.apply(this, arguments);
        const {position, quaternion} = transform;
        app.updateMatrixWorld();
        localMatrix
          .compose(position, quaternion, localVector2.set(1, 1, 1))
          .premultiply(localMatrix2.copy(app.matrixWorld).invert())
          .decompose(position, quaternion, localVector2);
        return transform;
      })(physics.getPhysicsTransform);
      physics.setPhysicsTransform = (setPhysicsTransform => function(physicsId, position, quaternion, scale) {
        app.updateMatrixWorld();
        localMatrix
          .compose(position, quaternion, scale)
          .premultiply(app.matrixWorld)
          .decompose(localVector, localQuaternion, localVector2);
        position = localVector;
        quaternion = localQuaternion;
        return setPhysicsTransform.call(this, physicsId, position, quaternion);
      })(physics.setPhysicsTransform);
      physics.removeGeometry = (removeGeometry => function(physicsId) {
        removeGeometry.apply(this, arguments);
        const index = app.physicsIds.indexOf(physicsId);
        if (index !== -1) {
          app.physicsIds.splice(index);
        }
      })(physics.removeGeometry);
      
      return physics;
    } else {
      throw new Error('usePhysics cannot be called outside of render()');
    }
  },
  useUi() {
    return ui;
  },
  useActivate(fn) {
    // XXX implement this
  },
  createApp() {
    return appManager.createApp(appManager.getNextAppId());
  },
  async addModule(app, m) {
    currentAppRender = app;

    let renderSpec = null;
    let waitUntilPromise = null;
    const fn = m.default;
    (() => {
      try {
        if (typeof fn === 'function') {
          renderSpec = fn({
            waitUntil(p) {
              waitUntilPromise = p;
            },
          });
        } else {
          console.warn('module is not a function', m);
          return null;
        }
      } catch(err) {
        console.warn(err);
        return null;
      }
    })();
    currentAppRender = null
    
    /* const loaded = renderSpec?.loaded;
    if (loaded instanceof Promise) {
      await loaded;
    } */
    await waitUntilPromise;

    // console.log('gor react', React, ReactAll);
    if (renderSpec instanceof THREE.Object3D) {
      const o = renderSpec;
      if (o !== app) {
        app.add(o);
      }
      
      app.addEventListener('destroy', () => {
        if (o !== app) {
          app.remove(o);
        }
      });
      
      return app;
    } else if (React.isValidElement(renderSpec)) {
      const o = new THREE.Object3D();
      // o.contentId = contentId;
      o.getPhysicsIds = () => app.physicsIds;
      o.destroy = () => {
        appManager.destroyApp(app.appId);
        
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
      // console.log('destroy app', app);
      appManager.destroyApp(app.appId);
      return null;
    } else {
      appManager.destroyApp(app.appId);
      console.warn('unknown renderSpec:', renderSpec);
      throw new Error('unknown renderSpec');
    }
  },
});
App.prototype.addModule = function(m) {
  return metaversefile.addModule(this, m);
};
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