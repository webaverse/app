import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import React from 'react';
import * as ReactThreeFiber from '@react-three/fiber';
import metaversefile from 'metaversefile';
import {App, getRenderer, scene, sceneHighPriority, camera, dolly} from './app-object.js';
import physicsManager from './physics-manager.js';
import Avatar from './avatars/avatars.js';
import {rigManager} from './rig.js';
import {world} from './world.js';
import {glowMaterial} from './shaders.js';
import * as ui from './vr-ui.js';
import {ShadertoyLoader} from './shadertoy.js';
import cameraManager from './camera-manager.js';
import {GIFLoader} from './GIFLoader.js';
import {VOXLoader} from './VOXLoader.js';
import ERC721 from './erc721-abi.json';
import ERC1155 from './erc1155-abi.json';
import {web3} from './blockchain.js';
import {moduleUrls, modules} from './metaverse-modules.js';
import easing from './easing.js';
import {rarityColors} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const upVector = new THREE.Vector3(0, 1, 0);
const defaultScale = new THREE.Vector3(1, 1, 1);

const cubicBezier = easing(0, 1, 0, 1);
const cubicBezier2 = easing(0, 1, 1, 1);
const gracePickupTime = 1000;
const rarityColorsArray = Object.keys(rarityColors).map(k => rarityColors[k][0]);

const defaultModules = {
  moduleUrls,
  modules,
};
const defaultComponents = {
  drop(app) {
    const dropComponent = app.getComponent('drop');
    if (dropComponent) {
      const glowHeight = 5;
      const glowGeometry = new THREE.CylinderBufferGeometry(0.01, 0.01, glowHeight)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, glowHeight/2, 0));
      const colors = new Float32Array(glowGeometry.attributes.position.array.length);
      glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const color = new THREE.Color(rarityColorsArray[Math.floor(Math.random() * rarityColorsArray.length)]);
      for (let i = 0; i < glowGeometry.attributes.color.array.length; i += 3) {
        color.toArray(glowGeometry.attributes.color.array, i);
      }
      const material = glowMaterial.clone();
      const glowMesh = new THREE.Mesh(glowGeometry, material);
      app.add(glowMesh);

      const velocity = dropComponent.velocity ? new THREE.Vector3().fromArray(dropComponent.velocity) : new THREE.Vector3();
      const angularVelocity = dropComponent.angularVelocity ? new THREE.Vector3().fromArray(dropComponent.angularVelocity) : new THREE.Vector3();
      let grounded = false;
      const startTime = performance.now();
      let animation = null;
      const timeOffset = Math.random() * 10;
      metaversefile.useFrame(e => {
        const {timestamp, timeDiff} = e;
        const timeDiffS = timeDiff/1000;
        const dropComponent = app.getComponent('drop');
        if (!grounded) {
          app.position
            .add(
              localVector.copy(velocity)
                .multiplyScalar(timeDiffS)
            );
          velocity.add(
            localVector.copy(physicsManager.getGravity())
              .multiplyScalar(timeDiffS)
          );
          
          const groundHeight = 0.1;
          if (app.position.y <= groundHeight) {
            app.position.y = groundHeight;
            const newDrop = JSON.parse(JSON.stringify(dropComponent));
            velocity.set(0, 0, 0);
            newDrop.velocity = velocity.toArray();
            app.setComponent('drop', newDrop);
            grounded = true;
          }
        }
        // if (grounded) {
          app.rotation.y += angularVelocity.y * timeDiff;
        // }
        app.updateMatrixWorld();
        
        glowMesh.visible = !animation;
        if (!animation) {
          rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector);
          localVector.y = 0;
          const distance = localVector.distanceTo(app.position);
          if (distance < 1) {
            // console.log('check 1');
            const timeSinceStart = timestamp - startTime;
            if (timeSinceStart > gracePickupTime) {
              // console.log('check 2');
              animation = {
                startPosition: app.position.clone(),
                startTime: timestamp,
                endTime: timestamp + 1000,
              };
            }
          }
        }
        if (animation) {
          const headOffset = 0.5;
          const bodyOffset = -0.3;
          const tailTimeFactorCutoff = 0.8;
          const timeDiff = timestamp - animation.startTime;
          const timeFactor = Math.min(Math.max(timeDiff / (animation.endTime - animation.startTime), 0), 1);
          if (timeFactor < 1) {
            if (timeFactor < tailTimeFactorCutoff) {
              const f = cubicBezier(timeFactor);
              rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                .add(localVector2.set(0, headOffset, 0));
              app.position.copy(animation.startPosition).lerp(localVector, f);
            } else {
              {
                const f = cubicBezier(tailTimeFactorCutoff);
                rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, headOffset, 0));
                app.position.copy(animation.startPosition).lerp(localVector, f);
              }
              {
                const tailTimeFactor = (timeFactor - tailTimeFactorCutoff) / (1 - tailTimeFactorCutoff);
                const f = cubicBezier2(tailTimeFactor);
                rigManager.localRig.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, bodyOffset, 0));
                app.position.lerp(localVector, f);
                app.scale.copy(defaultScale).multiplyScalar(1 - tailTimeFactor);
              }
            }
          } else {
            world.appManager.dispatchEvent(new MessageEvent('pickup', {
              data: {
                app,
              },
            }));
            world.removeObject(app.instanceId);
          }
        }
      });
    }
  },
};

class PlayerHand {
  constructor() {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
  }
}
class Player {
  constructor() {
    this.position = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.leftHand = new PlayerHand();
    this.rightHand = new PlayerHand();
    this.hands = [
      this.leftHand,
      this.rightHand,
    ];
    // this.playerId = 'Anonymous';
    this.aimed = false;
    this.grabs = [];
    this.wears = [];
    this.actions = [];
  }
}
class LocalPlayer extends Player {
  constructor() {
    super();
    
    this.teleportTo = this._bindTeleportTo();
  }
  setAvatar(app) {
    rigManager.setLocalAvatar(app);
  }
  wear(app) {
    const wearComponent = app.getComponent('wear');
    if (wearComponent) {
      app.dispatchEvent({
        type: 'wearupdate',
        wear: wearComponent,
      });
      
      const {instanceId} = app;
      this.wears.push({
        instanceId,
      });
      this.ungrab();
    } else {
      console.warn('cannot wear app with no wear component');
    }
  }
  grab(object) {
    const renderer = getRenderer();
    const {position, quaternion} = renderer.xr.getSession() ? useLocalPlayer().leftHand : camera;

    object.updateMatrixWorld();
    object.savedRotation = object.rotation.clone();
    object.startQuaternion = quaternion.clone();

    this.grabs[0] = {
      instanceId: object.instanceId,
      matrix: localMatrix.copy(object.matrixWorld)
        .premultiply(localMatrix2.compose(position, quaternion, localVector.set(1, 1, 1)).invert())
        .toArray(),
    };
  }
  ungrab() {
    this.grabs[0] = null;
  }
  lookAt(p) {
    const cameraOffset = cameraManager.getCameraOffset();
    camera.position.add(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
    camera.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        camera.position,
        p,
        localVector2.set(0, 1, 0)
      )
    );
    camera.position.sub(localVector.copy(cameraOffset).applyQuaternion(camera.quaternion));
    camera.updateMatrixWorld();
    
    /* this.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(this.position, p, upVector)
    );
    teleportTo(this.position, this.quaternion, {
      relation: 'head',
    }); */
  }
  _bindTeleportTo() {
    // const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localVector3 = new THREE.Vector3();
    // const localQuaternion = new THREE.Quaternion();
    const localQuaternion2 = new THREE.Quaternion();
    // const localQuaternion3 = new THREE.Quaternion();
    // const localQuaternion4 = new THREE.Quaternion();
    // const localEuler = new THREE.Euler();
    const localMatrix = new THREE.Matrix4();
    return function(position, quaternion, {relation = 'floor'} = {}) {
      const renderer = getRenderer();
      const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;

      if (renderer.xr.getSession()) {
        localMatrix.copy(xrCamera.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        
        dolly.matrix
          .premultiply(localMatrix.makeTranslation(position.x - localVector2.x, position.y - localVector2.y, position.z - localVector2.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, relation === 'floor' ? physicsManager.getAvatarHeight() : 0, 0))
          .decompose(dolly.position, dolly.quaternion, dolly.scale);
        dolly.updateMatrixWorld();
      } else {
        camera.matrix
          .premultiply(localMatrix.makeTranslation(position.x - camera.position.x, position.y - camera.position.y, position.z - camera.position.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, relation === 'floor' ? physicsManager.getAvatarHeight() : 0, 0))
          .decompose(camera.position, camera.quaternion, camera.scale);
        camera.quaternion.copy(quaternion);
        camera.updateMatrixWorld();
      }

      physicsManager.velocity.set(0, 0, 0);
    };
  }
}
class RemotePlayer extends Player {
  constructor() {
    super();
  }
}
const localPlayer = new LocalPlayer();
const remotePlayers = new Map();

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

const _memoize = fn => {
  let loaded = false;
  let cache = null;
  return () => {
    if (!loaded) {
      cache = fn();
      loaded = true;
    }
    return cache;
  };
};
const _gltfLoader = _memoize(() => new GLTFLoader());
const _shadertoyLoader = _memoize(() => new ShadertoyLoader());
const _gifLoader = _memoize(() => new GIFLoader());
const _voxLoader = _memoize(() => new VOXLoader({
  scale: 0.01,
}));
const loaders = {
  get gltfLoader() {
    return _gltfLoader();
  },
  get shadertoyLoader() {
    return _shadertoyLoader();
  },
  get gifLoader() {
    return _gifLoader();
  },
  get voxLoader() {
    return _voxLoader();
  },
};
const _makeRegexp = s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const abis = {
  ERC721,
  ERC1155,
};

let currentAppRender = null;
let iframeContainer = null;
let recursion = 0;
const apps = [];
metaversefile.setApi({
  apps,
  async import(s) {
    if (/^(?:ipfs:\/\/|https?:\/\/|data:)/.test(s)) {
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
  async load(u) {
    const m = await metaversefile.import(u);
    const app = metaversefile.createApp();
    await metaversefile.addModule(app, m);
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
  useWorld() {
    return {
      addObject() {
        return world.addObject.apply(world, arguments);
      },
      removeObject() {
        return world.removeObject.apply(world, arguments);
      },
    };
  },
  useFrame(fn) {
    const app = currentAppRender;
    if (app) {
      const frame = e => {
        fn(e.data);
      };
      world.appManager.addEventListener('frame', frame);
      app.addEventListener('destroy', () => {
        world.appManager.removeEventListener('frame', frame);
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
    return localPlayer;
  },
  useRemotePlayer(playerId) {
    let player = remotePlayers.get(playerId);
    if (!player) {
      player = new RemotePlayer();
    }
    return player;
  },
  useRemotePlayers() {
    return Array.from(remotePlayers.values());
  },
  useLoaders() {
    return loaders;
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
        return setPhysicsTransform.call(this, physicsId, position, quaternion, scale);
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
  useDefaultModules() {
    return defaultModules;
  },
  useDefaultComponents() {
    return defaultComponents;
  },
  useWeb3() {
    return web3.mainnet;
  },
  useAbis() {
    return abis;
  },
  useUi() {
    return ui;
  },
  useActivate(fn) {
    const app = currentAppRender;
    if (app) {
      app.addEventListener('activate', e => {
        fn(e);
      });
      app.addEventListener('destroy', () => {
        window.removeEventListener('activate', fn);
      });
    } else {
      throw new Error('useActivate cannot be called outside of render()');
    }
  },
  useResize(fn) {
    const app = currentAppRender;
    if (app) {
      window.addEventListener('resize', e => {
        fn(e);
      });
      app.addEventListener('destroy', () => {
        window.removeEventListener('resize', fn);
      });
    } else {
      throw new Error('useResize cannot be called outside of render()');
    }
  },
  getAppByName(name) {
    const r = _makeRegexp(name);
    return apps.find(app => r.test(app.name));
  },
  getAppsByName(name) {
    const r = _makeRegexp(name);
    return apps.filter(app => r.test(app.name));
  },
  getAppsByType(type) {
    const r = _makeRegexp(type);
    return apps.filter(app => r.test(app.type));
  },
  getAppsByTypes(types) {
    return types.flatMap(type => {
      const r = _makeRegexp(type);
      return apps.filter(app => r.test(app.type));
    });
  },
  getAppsByComponent(componentType) {
    const r = _makeRegexp(componentType);
    return apps.filter(app => app.components.some(component => r.test(component.type)));
  },
  createApp({name = '', start_url = '', type = '', /*components = [], */in_front = false} = {}) {
    const app = world.appManager.createApp(world.appManager.getNextAppId());
    app.name = name;
    app.type = type;
    // app.components = components;
    if (in_front) {
      app.position.copy(localPlayer.position).add(new THREE.Vector3(0, 0, -1).applyQuaternion(localPlayer.quaternion));
      app.quaternion.copy(localPlayer.quaternion);
    }
    if (start_url) {
      (async () => {
        const m = await metaversefile.import(start_url);
        await metaversefile.addModule(app, m);
      })();
    }
    return app;
  },
  createModule: (() => {
    const dataUrlPrefix = `data:application/javascript;charset=utf-8,`;
    const jsPrefix = `\
import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {Vector3, Quaternion, Euler, Matrix4, Box3, Object3D, Texture} = THREE;
const {apps, createApp, createModule, addApp, removeApp, useFrame, useLocalPlayer, getAppByName, getAppsByName, getAppsByType, getAppsByTypes, getAppsByComponent} = metaversefile;

export default () => {
`;
    const jsSuffix = '\n};';
    return s => {
      const result = dataUrlPrefix + encodeURIComponent(jsPrefix + s.replace(/\%/g, '%25') + jsSuffix);
      console.log('got', {dataUrlPrefix, jsPrefix, s, jsSuffix, result});
      return result;
    };
  })(),
  addApp(app) {
    scene.add(app);
    apps.push(app);
  },
  removeApp(app) {
    app.parent.remove(app);
    apps.splice(apps.indexOf(app), 1);
  },
  useInternals() {
    if (!iframeContainer) {
      iframeContainer = document.getElementById('iframe-container');
      
      iframeContainer.getFov = () => camera.projectionMatrix.elements[ 5 ] * (window.innerHeight / 2);
      iframeContainer.updateSize = function updateSize() {
        const fov = iframeContainer.getFov();
        iframeContainer.style.cssText = `
          position: fixed;
          left: 0;
          top: 0;
          width: ${window.innerWidth}px;
          height: ${window.innerHeight}px;
          perspective: ${fov}px;
          pointer-events: none;
          user-select: none;
        `;
      };
      iframeContainer.updateSize();
    }

    const renderer = getRenderer();
    return {
      renderer,
      camera,
      sceneHighPriority,
      iframeContainer,
    };
  },
  useRigManagerInternal() {
    return rigManager;
  },
  useAvatarInternal() {
    return Avatar;
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
    if (waitUntilPromise) {
      await waitUntilPromise;
    }

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
        world.appManager.destroyApp(app.appId);
        
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
      world.appManager.addEventListener('frame', e => {
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
    } else if (renderSpec === null || renderSpec === undefined) {
      // console.log('destroy app', app);
      world.appManager.destroyApp(app.appId);
      return null;
    } else if (renderSpec === true) {
      // console.log('background app', app);
      return null;
    } else {
      world.appManager.destroyApp(app.appId);
      console.warn('unknown renderSpec:', renderSpec);
      throw new Error('unknown renderSpec');
    }
  },
});
App.prototype.addModule = function(m) {
  return metaversefile.addModule(this, m);
};
/* [
  './lol.jsx',
  './street/.metaversefile',
  './assets2/sacks3.glb',
].map(async u => {
  const module = await metaversefile.import(u);
  metaversefile.add(module);
}); */

export default metaversefile;