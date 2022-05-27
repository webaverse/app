/*
metaversefile uses plugins to load files from the metaverse and load them as apps.
it is an interface between raw data and the engine.
metaversfile can load many file types, including javascript.
*/

import * as THREE from 'three';
import {Text} from 'troika-three-text';
import React from 'react';
import * as ReactThreeFiber from '@react-three/fiber';
import metaversefile from 'metaversefile';
import {getRenderer, scene, sceneHighPriority, sceneLowPriority, rootScene, camera} from './renderer.js';
import cameraManager from './camera-manager.js';
import physicsManager from './physics-manager.js';
import Avatar from './avatars/avatars.js';
import {world} from './world.js';
import ERC721 from './erc721-abi.json';
import ERC1155 from './erc1155-abi.json';
import {web3} from './blockchain.js';
import {moduleUrls, modules} from './metaverse-modules.js';
import {componentTemplates} from './metaverse-components.js';
import postProcessing from './post-processing.js';
import {getRandomString, memoize} from './util.js';
import * as mathUtils from './math-utils.js';
import JSON6 from 'json-6';
import * as materials from './materials.js';
import * as geometries from './geometries.js';
import {MeshLodder} from './mesh-lodder.js';
import * as avatarCruncher from './avatar-cruncher.js';
import * as avatarSpriter from './avatar-spriter.js';
import {chatManager} from './chat-manager.js';
import loreAI from './ai/lore/lore-ai.js';
import npcManager from './npc-manager.js';
import universe from './universe.js';
import {PathFinder} from './npc-utils.js';
import {localPlayer, remotePlayers} from './players.js';
import loaders from './loaders.js';
import * as voices from './voices.js';
import * as procgen from './procgen/procgen.js';
import {getHeight} from './avatars/util.mjs';
import performanceTracker from './performance-tracker.js';
import renderSettingsManager from './rendersettings-manager.js';
import questManager from './quest-manager.js';
import {murmurhash3} from './procgen/murmurhash3.js';
import debug from './debug.js';
import * as sceneCruncher from './scene-cruncher.js';
import * as scenePreviewer from './scene-previewer.js';
import * as sounds from './sounds.js';
import hpManager from './hp-manager.js';
import particleSystemManager from './particle-system.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
// const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();

class App extends THREE.Object3D {
  constructor() {
    super();

    this.isApp = true;
    this.components = [];
    this.description = '';
    this.appType = 'none';
    this.modules = [];
    this.modulesHash = 0;
    // cleanup tracking
    this.physicsObjects = [];
    this.hitTracker = null;
    this.hasSubApps = false;
    this.lastMatrix = new THREE.Matrix4();

    const startframe = () => {
      performanceTracker.decorateApp(this);
    };
    performanceTracker.addEventListener('startframe', startframe);
    this.addEventListener('destroy', () => {
      performanceTracker.removeEventListener('startframe', startframe);
    });
  }
  getComponent(key) {
    const component = this.components.find(component => component.key === key);
    return component ? component.value : null;
  }
  #setComponentInternal(key, value) {
    let component = this.components.find(component => component.key === key);
    if (!component) {
      component = {key, value};
      this.components.push(component);
    }
    component.key = key;
    component.value = value;
    this.dispatchEvent({
      type: 'componentupdate',
      key,
      value,
    });
  }
  setComponent(key, value = true) {
    this.#setComponentInternal(key, value);
    this.dispatchEvent({
      type: 'componentsupdate',
      keys: [key],
    });
  }
  setComponents(o) {
    const keys = Object.keys(o);
    for (const k of keys) {
      const v = o[k];
      this.#setComponentInternal(k, v);
    }
    this.dispatchEvent({
      type: 'componentsupdate',
      keys,
    });
  }
  hasComponent(key) {
    return this.components.some(component => component.key === key);
  }
  removeComponent(key) {
    const index = this.components.findIndex(component => component.type === key);
    if (index !== -1) {
      this.components.splice(index, 1);
      this.dispatchEvent({
        type: 'componentupdate',
        key,
        value: null,
      });
    }
  }
  get contentId() {
    return this.getComponent('contentId') + '';
  }
  set contentId(contentId) {
    this.setComponent('contentId', contentId + '');
  }
  get instanceId() {
    return this.getComponent('instanceId') + '';
  }
  set instanceId(instanceId) {
    this.setComponent('instanceId', instanceId + '');
  }
  get paused() {
    return this.getComponent('paused') === true;
  }
  set paused(paused) {
    this.setComponent('paused', !!paused);
  }
  addModule(m) {
    throw new Error('method not bound');
  }
  updateModulesHash() {
    this.modulesHash = murmurhash3(this.modules.map(m => m.contentId).join(','));
  }
  getPhysicsObjects() {
    return this.physicsObjects;
  }
  hit(damage, opts) {
    this.hitTracker && this.hitTracker.hit(damage, opts);
  }
  getRenderSettings() {
    if (this.hasSubApps) {
      return renderSettingsManager.findRenderSettings(this);
    } else {
      return null;
    }
  }
  activate() {
    this.dispatchEvent({
      type: 'activate',
    });
  }
  wear() {
    localPlayer.wear(this);
  }
  unwear() {
    localPlayer.unwear(this);
  }
  use() {
    this.dispatchEvent({
      type: 'use',
      use: true,
    });
  }
  destroy() {
    this.dispatchEvent({
      type: 'destroy',
    });
  }
}

const defaultModules = {
  moduleUrls,
  modules,
};

const loreAIScene = loreAI.createScene(localPlayer);
const _bindAppManagerToLoreAIScene = (appManager, loreAIScene) => {
  const bindings = new WeakMap();
  appManager.addEventListener('appadd', e => {
    const app = e.data;
    const object = loreAIScene.addObject({
      name: app.name,
      description: app.description,
    });
    bindings.set(app, object);
  });
  appManager.addEventListener('appremove', e => {
    const app = e.data;
    const object = bindings.get(app);
    loreAIScene.removeObject(object);
    bindings.delete(app);
  });
};
_bindAppManagerToLoreAIScene(world.appManager, loreAIScene);

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
  };

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

const _loadImageTexture = src => {
  const img = new Image();
  img.onload = () => {
    texture.needsUpdate = true;
  };
  img.onerror = err => {
    console.warn(err);
  };
  img.crossOrigin = 'Anonymous';
  img.src = src;
  const texture = new THREE.Texture(img);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  // texture.anisotropy = 16;
  return texture;
};
const _threeTone = memoize(() => {
  return _loadImageTexture('/textures/threeTone.jpg');
});
const _fiveTone = memoize(() => {
  return _loadImageTexture('/textures/fiveTone.jpg');
});
const _twentyTone = memoize(() => {
  return _loadImageTexture('/textures/twentyTone.png');
});
const gradientMaps = {
  get threeTone() {
    return _threeTone();
  },
  get fiveTone() {
    return _fiveTone();
  },
  get twentyTone() {
    return _twentyTone();
  },
};

const abis = {
  ERC721,
  ERC1155,
};

/* debug.addEventListener('enabledchange', e => {
  document.getElementById('statsBox').style.display = e.data.enabled ? null : 'none';
}); */

let currentAppRender = null;
let iframeContainer = null;
let recursion = 0;
let wasDecapitated = false;
// const apps = [];
const mirrors = [];
metaversefile.setApi({
  // apps,
  async import(s) {
    if (/^(?:ipfs:\/\/|https?:\/\/|weba:\/\/|data:)/.test(s)) {
      const prefix = location.protocol + '//' + location.host + '/@proxy/';
      if (s.startsWith(prefix)) {
        s = s.slice(prefix.length);
      }
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
  useApp() {
    const app = currentAppRender;
    if (app) {
      return app;
    } else {
      throw new Error('useApp cannot be called outside of render()');
    }
  },
  useRenderer() {
    return getRenderer();
  },
  useRenderSettings() {
    return renderSettingsManager;
  },
  useScene() {
    return scene;
  },
  useSound() {
    return sounds;
  },
  useCamera() {
    return camera;
  },
  /* usePostOrthographicScene() {
    return postSceneOrthographic;
  },
  usePostPerspectiveScene() {
    return postScenePerspective;
  }, */
  getMirrors() {
    return mirrors;
  },
  getWinds() {
    return world.winds;
  },
  setWinds(wind) {
    world.winds.push(wind);
  },
  removeWind(wind) {
    const index = world.winds.indexOf(wind);
    if (index > -1) {
      world.winds.splice(index, 1);
    }
  },
  registerMirror(mirror) {
    mirrors.push(mirror);
  },
  unregisterMirror(mirror) {
    const index = mirrors.indexOf(mirror);
    if (index !== -1) {
      mirrors.splice(index, 1);
    }
  },
  useWorld() {
    return {
      appManager: world.appManager,
      getApps() {
        return world.appManager.apps;
      },
    };
  },
  useChatManager() {
    return chatManager;
  },
  useQuests() {
    return questManager;
  },
  useLoreAI() {
    return loreAI;
  },
  useLoreAIScene() {
    return loreAIScene;
  },
  useVoices() {
    return voices;
  },
  useAvatarCruncher() {
    return avatarCruncher;
  },
  useAvatarSpriter() {
    return avatarSpriter;
  },
  useSceneCruncher() {
    return sceneCruncher;
  },
  useScenePreviewer() {
    return scenePreviewer;
  },
  usePostProcessing() {
    return postProcessing;
  },
  /* createAvatar(o, options) {
    return new Avatar(o, options);
  }, */
  useAvatarAnimations() {
    return Avatar.getAnimations();
  },
  useFrame(fn) {
    const app = currentAppRender;
    if (app) {
      const frame = e => {
        if (!app.paused) {
          performanceTracker.startCpuObject(app.modulesHash, app.name);
          fn(e.data);
          performanceTracker.endCpuObject();
        }
      };
      world.appManager.addEventListener('frame', frame);
      const destroy = () => {
        cleanup();
      };
      app.addEventListener('destroy', destroy);
      
      const cleanup = () => {
        world.appManager.removeEventListener('frame', frame);
        app.removeEventListener('destroy', destroy);
      };
      
      return {
        cleanup,
      };
    } else {
      throw new Error('useFrame cannot be called outside of render()');
    }
  },
  clearFrame(frame) {
    frame.cleanup();
  },
  useBeforeRender() {
    recursion++;
    if (recursion === 1) {
      // scene.directionalLight.castShadow = false;
      if (localPlayer.avatar) {
        wasDecapitated = localPlayer.avatar.decapitated;
        localPlayer.avatar.undecapitate();
      }
    }
  },
  useAfterRender() {
    recursion--;
    if (recursion === 0) {
      // console.log('was decap', wasDecapitated);
      if (localPlayer.avatar && wasDecapitated) {
        localPlayer.avatar.decapitate();
        localPlayer.avatar.skeleton.update();
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
    /* if (!player) {
      player = new RemotePlayer();
    } */
    return player;
  },
  useRemotePlayers() {
    return Array.from(remotePlayers.values());
  },
  useNpcManager() {
    return npcManager;
  },
  usePathFinder() {
    return PathFinder;
  },
  useLoaders() {
    return loaders;
  },
  useMeshLodder() {
    return MeshLodder;
  },
  usePhysics() {
    const app = currentAppRender;
    if (app) {
      const physics = {};
      for (const k in physicsManager) {
        physics[k] = physicsManager[k];
      }
      /* const localVector = new THREE.Vector3();
      const localVector2 = new THREE.Vector3();
      const localQuaternion = new THREE.Quaternion();
      const localMatrix = new THREE.Matrix4(); */
      // const localMatrix2 = new THREE.Matrix4();
      physics.addBoxGeometry = (addBoxGeometry => function(position, quaternion, size, dynamic) {
        /* const basePosition = position;
        const baseQuaternion = quaternion;
        const baseScale = size;
        app.updateMatrixWorld();
        localMatrix
          .compose(position, quaternion, size)
          .premultiply(app.matrixWorld)
          .decompose(localVector, localQuaternion, localVector2);
        position = localVector;
        quaternion = localQuaternion;
        size = localVector2; */

        const physicsObject = addBoxGeometry.call(this, position, quaternion, size, dynamic);
        // physicsObject.position.copy(app.position);
        // physicsObject.quaternion.copy(app.quaternion);
        // physicsObject.scale.copy(app.scale);
        
        // const {physicsMesh} = physicsObject;
        // physicsMesh.position.copy(position);
        // physicsMesh.quaternion.copy(quaternion);
        // physicsMesh.scale.copy(size);
        // app.add(physicsObject);
        // physicsObject.updateMatrixWorld();

        app.physicsObjects.push(physicsObject);

        return physicsObject;
      })(physics.addBoxGeometry);
      physics.addCapsuleGeometry = (addCapsuleGeometry => function(position, quaternion, radius, halfHeight, physicsMaterial, dynamic, flags) {
        // const basePosition = position;
        // const baseQuaternion = quaternion;
        // const baseScale = new THREE.Vector3(radius, halfHeight*2, radius)

        // app.updateMatrixWorld();
        // localMatrix
        //   .compose(position, quaternion, new THREE.Vector3(radius, halfHeight*2, radius))
        //   .premultiply(app.matrixWorld)
        //   .decompose(localVector, localQuaternion, localVector2);
        // position = localVector;
        // quaternion = localQuaternion;
        //size = localVector2;
        
        const physicsObject = addCapsuleGeometry.call(this, position, quaternion, radius, halfHeight, physicsMaterial, dynamic, flags);
        // physicsObject.position.copy(app.position);
        // physicsObject.quaternion.copy(app.quaternion);
        // physicsObject.scale.copy(app.scale);
        // physicsObject.updateMatrixWorld();
        
        // const {physicsMesh} = physicsObject;
        // physicsMesh.position.copy(basePosition);
        // physicsMesh.quaternion.copy(baseQuaternion);

        // physicsMesh.scale.copy(baseScale);
        // app.add(physicsObject);
        // physicsObject.updateMatrixWorld();

        // const localPlayer = metaversefile.useLocalPlayer();

        /*if(localPlayer.avatar) {
          if(localPlayer.avatar.height) {
            console.log(localPlayer.avatar.height);
          }
        }*/
        
        app.physicsObjects.push(physicsObject);

        // physicsManager.pushUpdate(app, physicsObject);
        //physicsManager.setTransform(physicsObject);
        return physicsObject;
      })(physics.addCapsuleGeometry);
      /* physics.addSphereGeometry = (addSphereGeometry => function(position, quaternion, radius, physicsMaterial, ccdEnabled) {
        const basePosition = position;
        const baseQuaternion = quaternion;
        const baseScale = new THREE.Vector3(radius, radius, radius);
        // app.updateMatrixWorld();
        // localMatrix
        //   .compose(position, quaternion, new THREE.Vector3(1, 1, 1))
        //   .premultiply(app.matrixWorld)
        //   .decompose(localVector, localQuaternion, localVector2);
        // position = localVector;
        // quaternion = localQuaternion;
        //size = localVector2;
        
        const physicsObject = addSphereGeometry.call(this, position, quaternion, radius, physicsMaterial, ccdEnabled);
        //physicsObject.position.copy(app.position);
        //physicsObject.quaternion.copy(app.quaternion);
        //physicsObject.scale.copy(app.scale);
        
        const {physicsMesh} = physicsObject;
        physicsMesh.position.copy(basePosition);
        physicsMesh.quaternion.copy(baseQuaternion);
        //physicsMesh.scale.copy(baseScale);
        // app.add(physicsObject);
        physicsObject.updateMatrixWorld();
        
        app.physicsObjects.push(physicsObject);
        // physicsManager.pushUpdate(app, physicsObject);
        return physicsObject;
      })(physics.addSphereGeometry); */
      physics.addGeometry = (addGeometry => function(mesh) {
        /* const oldParent = mesh.parent;
        
        const parentMesh = new THREE.Object3D();
        parentMesh.position.copy(app.position);
        parentMesh.quaternion.copy(app.quaternion);
        parentMesh.scale.copy(app.scale);
        parentMesh.add(mesh);
        parentMesh.updateMatrixWorld(); */
        
        const physicsObject = addGeometry.call(this, mesh);
        /* physicsObject.position.copy(app.position);
        physicsObject.quaternion.copy(app.quaternion);
        physicsObject.scale.copy(app.scale);
        physicsObject.updateMatrixWorld(); */
        // window.physicsObject = physicsObject;
        
        /* if (oldParent) {
          oldParent.add(mesh);
          mesh.updateMatrixWorld();
        } */
        
        // app.add(physicsObject);
        app.physicsObjects.push(physicsObject);
        return physicsObject;
      })(physics.addGeometry);
      physics.addCookedGeometry = (addCookedGeometry => function(buffer, position, quaternion, scale) {
        const physicsObject = addCookedGeometry.apply(this, arguments);
        // app.add(physicsObject);
        app.physicsObjects.push(physicsObject);
        return physicsObject;
      })(physics.addCookedGeometry);
      physics.addConvexGeometry = (addConvexGeometry => function(mesh) {
        const physicsObject = addConvexGeometry.apply(this, arguments);
        // app.add(physicsObject);
        app.physicsObjects.push(physicsObject);
        return physicsObject;
      })(physics.addConvexGeometry);
      physics.addCookedConvexGeometry = (addCookedConvexGeometry => function(buffer, position, quaternion, scale) {
        const physicsObject = addCookedConvexGeometry.apply(this, arguments);
        // app.add(physicsObject);
        app.physicsObjects.push(physicsObject);
        return physicsObject;
      })(physics.addCookedConvexGeometry);
      /* physics.enablePhysicsObject = (enablePhysicsObject => function(physicsObject) {
        enablePhysicsObject.call(this, physicsObject);
      })(physics.enablePhysicsObject);
      physics.disablePhysicsObject = (disablePhysicsObject => function(physicsObject) {
        disablePhysicsObject.call(this, physicsObject);
      })(physics.disablePhysicsObject);
      physics.enableGeometryQueries = (enableGeometryQueries => function(physicsObject) {
        enableGeometryQueries.call(this, physicsObject);
      })(physics.enableGeometryQueries);
      physics.disableGeometryQueries = (disableGeometryQueries => function(physicsObject) {
        disableGeometryQueries.call(this, physicsObject);
      })(physics.disableGeometryQueries); */

      /* physics.setTransform = (setTransform => function(physicsObject) {
        setTransform.call(this, physicsObject);
      })(physics.setTransform); */
      /* physics.getPhysicsTransform = (getPhysicsTransform => function(physicsId) {
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
      })(physics.setPhysicsTransform); */
      physics.removeGeometry = (removeGeometry => function(physicsObject) {
        removeGeometry.apply(this, arguments);
        
        const index = app.physicsObjects.indexOf(physicsObject);
        if (index !== -1) {
          app.remove(physicsObject);
          app.physicsObjects.splice(index);
        }
      })(physics.removeGeometry);
      
      return physics;
    } else {
      throw new Error('usePhysics cannot be called outside of render()');
    }
  },
  useHpManager() {
    return hpManager;
  },
  useProcGen() {
    return procgen;
  },
  useCameraManager() {
    return cameraManager;
  },
  useParticleSystem() {
    return particleSystemManager;
  },
  useDefaultModules() {
    return defaultModules;
  },
  useWeb3() {
    return web3.mainnet;
  },
  useAbis() {
    return abis;
  },
  useMathUtils() {
    return mathUtils;
  },
  useActivate(fn) {
    const app = currentAppRender;
    if (app) {
      app.addEventListener('activate', e => {
        fn(e);
      });
      app.addEventListener('destroy', () => {
        app.removeEventListener('activate', fn);
      });
    } else {
      throw new Error('useActivate cannot be called outside of render()');
    }
  },
  useWear(fn) {
    const app = currentAppRender;
    if (app) {
      app.addEventListener('wearupdate', e => {
        fn(e);
      });
      app.addEventListener('destroy', () => {
        app.removeEventListener('wearupdate', fn);
      });
    } else {
      throw new Error('useWear cannot be called outside of render()');
    }
  },
  useUse(fn) {
    const app = currentAppRender;
    if (app) {
      app.addEventListener('use', e => {
        fn(e);
      });
      app.addEventListener('destroy', () => {
        app.removeEventListener('use', fn);
      });
    } else {
      throw new Error('useUse cannot be called outside of render()');
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
  getNextInstanceId() {
    return getRandomString();
  },
  createAppInternal({
    start_url = '',
    module = null,
    components = [],
    position = null,
    quaternion = null,
    scale = null,
    parent = null,
    in_front = false,
  } = {}, {onWaitPromise = null} = {}) {
    const app = new App();

    // transform
    const _updateTransform = () => {
      let matrixNeedsUpdate = false;
      if (Array.isArray(position)) {
        app.position.fromArray(position);
        matrixNeedsUpdate = true;
      } else if (position?.isVector3) {
        app.position.copy(position);
        matrixNeedsUpdate = true;
      }
      if (Array.isArray(quaternion)) {
        app.quaternion.fromArray(quaternion);
        matrixNeedsUpdate = true;
      } else if (quaternion?.isQuaternion) {
        app.quaternion.copy(quaternion);
        matrixNeedsUpdate = true;
      }
      if (Array.isArray(scale)) {
        app.scale.fromArray(scale);
        matrixNeedsUpdate = true;
      } else if (scale?.isVector3) {
        app.scale.copy(scale);
        matrixNeedsUpdate = true;
      }
      if (in_front) {
        app.position.copy(localPlayer.position).add(new THREE.Vector3(0, 0, -1).applyQuaternion(localPlayer.quaternion));
        app.quaternion.copy(localPlayer.quaternion);
        app.scale.setScalar(1);
        matrixNeedsUpdate = true;
      }
      if (parent) {
        parent.add(app);
        matrixNeedsUpdate = true;
      }

      if (matrixNeedsUpdate) {
        app.updateMatrixWorld();
        app.lastMatrix.copy(app.matrixWorld);
      }
    };
    _updateTransform();

    // components
    const _updateComponents = () => {
      if (Array.isArray(components)) {
        for (const {key, value} of components) {
          app.setComponent(key, value);
        }
      } else if (typeof components === 'object' && components !== null) {
        for (const key in components) {
          const value = components[key];
          app.setComponent(key, value);
        }
      }
    };
    _updateComponents();

    // load
    if (start_url || module) {
      const p = (async () => {
        let m;
        if (start_url) {
          m = await metaversefile.import(start_url);
        } else {
          m = module;
        }
        await metaversefile.addModule(app, m);
      })();
      if (onWaitPromise) {
        onWaitPromise(p);
      }
    }
    
    return app;
  },
  createApp(spec) {
    return metaversefile.createAppInternal(spec);
  },
  async createAppAsync(spec, opts) {
    let p = null;
    const app = metaversefile.createAppInternal(spec, {
      onWaitPromise(newP) {
        p = newP;
      },
    });
    if (p !== null) {
      await p;
    }
    return app;
  },
  createAppPair(spec) {
    let promise = null;
    const app = metaversefile.createAppInternal(spec, {
      onWaitPromise(newPromise) {
        promise = newPromise;
      },
    });
    return [app, promise];
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
    return world.appManager.addApp.apply(world.appManager, arguments);
  },
  removeApp() {
    return world.appManager.removeApp.apply(world.appManager, arguments);
  },
  addTrackedApp() {
    return world.appManager.addTrackedApp.apply(world.appManager, arguments);
  },
  removeTrackedApp(app) {
    return world.appManager.removeTrackedApp.apply(world.appManager, arguments);
  },
  getAppByInstanceId(instanceId) {
    let result = world.appManager.getAppByInstanceId(instanceId) ||
      localPlayer.appManager.getAppByInstanceId(instanceId);
    if (result) {
      return result;
    } else {
      const remotePlayers = metaversefile.useRemotePlayers();
      for (const remotePlayer of remotePlayers) {
        const remoteApp = remotePlayer.appManager.getAppByInstanceId(instanceId);
        if (remoteApp) {
          return remoteApp;
        }
      }
      return null;
    }
  },
  getAppByPhysicsId(physicsId) {
    let result = world.appManager.getAppByPhysicsId(physicsId) ||
      localPlayer.appManager.getAppByPhysicsId(physicsId);
    if (result) {
      return result;
    } else {
      const remotePlayers = metaversefile.useRemotePlayers();
      for (const remotePlayer of remotePlayers) {
        const remoteApp = remotePlayer.appManager.getAppByPhysicsId(physicsId);
        if (remoteApp) {
          return remoteApp;
        }
      }
      return null;
    }
  },
  getPhysicsObjectByPhysicsId(physicsId) {
    let result = world.appManager.getPhysicsObjectByPhysicsId(physicsId) ||
      localPlayer.appManager.getPhysicsObjectByPhysicsId(physicsId);
    if (result) {
      return result;
    } else {
      const remotePlayers = metaversefile.useRemotePlayers();
      for (const remotePlayer of remotePlayers) {
        const remotePhysicsObject = remotePlayer.appManager.getPhysicsObjectByPhysicsId(physicsId);
        if (remotePhysicsObject) {
          return remotePhysicsObject;
        }
      }
      return null;
    }
  },
  getPairByPhysicsId(physicsId) {
    let result = world.appManager.getPairByPhysicsId(physicsId) ||
      localPlayer.appManager.getPairByPhysicsId(physicsId);
    if (result) {
      return result;
    } else {
      const remotePlayers = metaversefile.useRemotePlayers();
      for (const remotePlayer of remotePlayers) {
        const remotePair = remotePlayer.appManager.getPairByPhysicsId(physicsId);
        if (remotePair) {
          return remotePair;
        }
      }
      return null;
    }
  },
  getAvatarHeight(obj) {
    return getHeight(obj);
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
      scene,
      rootScene,
      // postSceneOrthographic,
      // postScenePerspective,
      camera,
      sceneHighPriority,
      sceneLowPriority,
      iframeContainer,
    };
  },
  /* useRigManagerInternal() {
    return rigManager;
  }, */
  /* useAvatar() {
    return Avatar;
  }, */
  useText() {
    return Text;
  },
  useGeometries() {
    return geometries;
  },
  useMaterials() {
    return materials;
  },
  useJSON6Internal() {
    return JSON6;
  },
  useGradientMapsInternal() {
    return gradientMaps;
  },
  isSceneLoaded() {
    return universe.isSceneLoaded();
  },
  async waitForSceneLoaded() {
    await universe.waitForSceneLoaded();
  },
  useDebug() {
    return debug;
  },
  async addModule(app, m) {
    // wait to make sure module initialization happens in a clean tick loop,
    // even when adding a module from inside of another module's initialization
    await Promise.resolve();

    app.name = m.name ?? (m.contentId ? m.contentId.match(/([^\/\.]*)$/)[1] : '');
    app.description = m.description ?? '';
    app.appType = m.type ?? '';
    app.contentId = m.contentId ?? '';
    if (Array.isArray(m.components)) {
      for (const {key, value} of m.components) {
        if (!app.hasComponent(key)) {
          app.setComponent(key, value);
        }
      }
    }
    app.modules.push(m);
    app.updateModulesHash();

    let renderSpec = null;
    let waitUntilPromise = null;
    const _initModule = () => {
      currentAppRender = app;

      try {
        const fn = m.default;
        if (typeof fn === 'function') {
          renderSpec = fn({
            waitUntil(p) {
              waitUntilPromise = p;
            },
          });
        } else {
          console.warn('module default export is not a function', m);
          return null;
        }
      } catch(err) {
        console.warn(err);
        return null;
      } finally {
        currentAppRender = null;
      }
    };
    _initModule();

    if (waitUntilPromise) {
      await waitUntilPromise;
    }

    const _bindDefaultComponents = app => {
      // console.log('bind default components', app); // XXX
      
      currentAppRender = app;

      // component handlers
      const componentHandlers = {};
      for (const {key, value} of app.components) {
        const componentHandlerTemplate = componentTemplates[key];
        if (componentHandlerTemplate) {
          componentHandlers[key] = componentHandlerTemplate(app, value);
        }
      }
      app.addEventListener('componentupdate', e => {
        const {key, value} = e;

        currentAppRender = app;

        const componentHandler = componentHandlers[key];
        if (!componentHandler && value !== undefined) {
          const componentHandlerTemplate = componentTemplates[key];
          if (componentHandlerTemplate) {
            componentHandlers[key] = componentHandlerTemplate(app, value);
          }
        } else if (componentHandler && value === undefined) {
          componentHandler.remove();
          delete componentHandlers[key];
        }

        currentAppRender = null;
      });

      currentAppRender = null;
    };

    if (renderSpec instanceof THREE.Object3D) {
      const o = renderSpec;
      if (o !== app) {
        app.add(o);
        o.updateMatrixWorld();
      }
      
      app.addEventListener('destroy', () => {
        if (o !== app) {
          app.remove(o);
        }
      });

      _bindDefaultComponents(app);
      
      return app;
    } else if (React.isValidElement(renderSpec)) {
      const o = new THREE.Object3D();
      // o.contentId = contentId;
      // o.getPhysicsIds = () => app.physicsIds;
      o.destroy = () => {
        app.destroy();
        
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

      _bindDefaultComponents(app);
      
      return app;
    } else if (renderSpec === false || renderSpec === null || renderSpec === undefined) {
      app.destroy();
      return null;
    } else if (renderSpec === true) {
      // console.log('background app', app);
      return null;
    } else {
      app.destroy();
      console.warn('unknown renderSpec:', renderSpec);
      throw new Error('unknown renderSpec');
    }
  },
});
App.prototype.addModule = function(m) {
  return metaversefile.addModule(this, m);
};

export default metaversefile;
