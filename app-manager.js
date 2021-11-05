/*
app manager binds y.js data to live running metaversefile apps.
you can have as many app managers as you want.
*/

import * as THREE from 'three';
import * as Y from 'yjs';

import {scene, sceneHighPriority, sceneLowPriority} from './renderer.js';
import {makePromise, getRandomString} from './util.js';
import physicsManager from './physics-manager.js';
import metaversefile from './metaversefile-api.js';
import * as metaverseModules from './metaverse-modules.js';
import {worldMapName} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

const localData = {
  timestamp: 0,
  frame: null,
  timeDiff: 0,
};
const localFrameOpts = {
  data: localData,
};

const appManagers = [];
class AppManager extends EventTarget {
  constructor({
    prefix = worldMapName,
    state = new Y.Doc(),
    apps = [],
    // autoSceneManagement = true,
  } = {}) {
    super();
    
    this.prefix = prefix;
    this.state = null;
    this.apps = apps;
    
    this.pendingAddPromises = new Map();
    this.pushingLocalUpdates = false;
    // this.autoSceneManagement = autoSceneManagement;
    this.unbindStateFn = null;
    this.trackedAppUnobserveMap = new Map();
    
    this.bindState(state);
    this.bindEvents();
  
    appManagers.push(this);
  }
  tick(timestamp, timeDiff, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timeDiff;
    this.dispatchEvent(new MessageEvent('frame', localFrameOpts));
  }
  setPushingLocalUpdates(pushingLocalUpdates) {
    this.pushingLocalUpdates = pushingLocalUpdates;
  }
  getPeerOwnerAppManager(instanceId) {
    for (const appManager of appManagers) {
      if (appManager !== this && appManager.state === this.state && appManager.hasTrackedApp(instanceId)) {
        return appManager;
      }
    }
    return null;
  }
  unbindState() {
    const lastState = this.state;
    if (lastState) {
      this.unbindStateFn();
      this.state = null;
      this.unbindStateFn = null;
    }
  }
  bindState(nextState) {
    this.unbindState();
  
    if (nextState) {
      const apps = nextState.getArray(this.prefix);
      const observe = e => {
        const {added, deleted, delta, keys} = e.changes;
        
        for (const item of added.values()) {
          const appMap = item.content.type;
          const instanceId = appMap.get('instanceId');
          
          const hadApp = this.apps.some(app => app.instanceId === instanceId);
          if (hadApp) {
            // console.log('accept migration add', this.prefix, instanceId);
          } else {
            const trackedApp = this.getOrCreateTrackedApp(instanceId);
            // console.log('detected add app', instanceId, trackedApp.toJSON(), new Error().stack);
            this.dispatchEvent(new MessageEvent('trackedappadd', {
              data: {
                trackedApp,
              },
            }));
          }
        }
        for (const item of deleted.values()) {
          const appMap = item.content.type;
          const instanceId = item.content.type._map.get('instanceId').content.arr[0]; // needed to get the old data

          const app = this.getAppByInstanceId(instanceId);
          let migrated = false;
          const peerOwnerAppManager = this.getPeerOwnerAppManager(instanceId);
          
          if (peerOwnerAppManager) {
            // console.log('detected migrate app 1', instanceId, appManagers.length);
            
            const e = new MessageEvent('trackedappmigrate', {
              data: {
                app,
                sourceAppManager: this,
                destinationAppManager: peerOwnerAppManager,
              },
            });
            this.dispatchEvent(e);
            peerOwnerAppManager.dispatchEvent(e);
            migrated = true;
            break;
          }
          
          // console.log('detected remove app 2', instanceId, appManagers.length);
          
          if (!migrated) {
            // console.log('detected remove app 3', instanceId, appManagers.length);
            
            this.dispatchEvent(new MessageEvent('trackedappremove', {
              data: {
                instanceId,
                app,
              },
            }));
          }
        }
        
        /* // if (!this.stateBlindMode) {
          const nextApps = apps.toJSON();

          // console.log('next apps', nextApps, lastApps);

          for (const instanceId of nextApps) {
            if (!lastApps.includes(instanceId)) {
              
            }
          }
          for (const instanceId of lastApps) {
            if (!nextApps.includes(instanceId)) {
              const trackedApp = nextState.getMap(this.prefix + '.' + instanceId);
              // console.log('detected remove app 1', instanceId, trackedApp.toJSON(), appManagers.length);
              
              const app = this.getAppByInstanceId(instanceId);
              let migrated = false;
              const peerOwnerAppManager = this.getPeerOwnerAppManager(instanceId);
              
              if (peerOwnerAppManager) {
                // console.log('detected migrate app 1', instanceId, trackedApp.toJSON(), appManagers.length);
                
                const e = new MessageEvent('trackedappmigrate', {
                  data: {
                    app,
                    sourceAppManager: this,
                    destinationAppManager: peerOwnerAppManager,
                  },
                });
                this.dispatchEvent(e);
                peerOwnerAppManager.dispatchEvent(e);
                migrated = true;
                break;
              }
              
              // console.log('detected remove app 2', instanceId, trackedApp.toJSON(), appManagers.length);
              
              if (!migrated) {
                // console.log('detected remove app 3', instanceId, trackedApp.toJSON(), appManagers.length);
                
                this.dispatchEvent(new MessageEvent('trackedappremove', {
                  data: {
                    instanceId,
                    // trackedApp,
                    app,
                  },
                }));
              }
            }
          }

          lastApps = nextApps; */
        // }
      };
      apps.observe(observe);
      this.unbindStateFn = () => {
        apps.unobserve(observe);
      };
    }
    this.state = nextState;
  }
  bindTrackedApp(trackedApp, app) {
    // console.log('bind tracked app', this.prefix, trackedApp.get('instanceId'));
    const _observe = e => {
      // if (!this.stateBlindMode) {
        if (!this.pushingLocalUpdates) {
          if (e.keysChanged.has('position')) {
            app.position.fromArray(trackedApp.get('position'));
          }
          if (e.keysChanged.has('quaternion')) {
            app.quaternion.fromArray(trackedApp.get('quaternion'));
          }
          if (e.keysChanged.has('scale')) {
            app.scale.fromArray(trackedApp.get('scale'));
          }
        }
      // }
    };
    trackedApp.observe(_observe);
    
    const instanceId = trackedApp.get('instanceId');
    this.trackedAppUnobserveMap.set(instanceId, trackedApp.unobserve.bind(trackedApp, _observe));
  }
  unbindTrackedApp(instanceId) {
    const fn = this.trackedAppUnobserveMap.get(instanceId);
    
    if (fn) {
      this.trackedAppUnobserveMap.delete(instanceId);
      fn();
    } else {
      console.warn('tracked app was not bound:', instanceId);
    }
  }
  bindEvents() {
    this.addEventListener('trackedappadd', async e => {
      const {trackedApp} = e.data;
      const trackedAppJson = trackedApp.toJSON();
      const {instanceId, contentId, position, quaternion, scale, components: componentsString} = trackedAppJson;
      const components = JSON.parse(componentsString);
      
      const p = makePromise();
      p.instanceId = instanceId;
      this.pendingAddPromises.set(instanceId, p);

      let live = true;
      
      const clear = e => {
        live = false;
        cleanup();
      };
      const cleanup = () => {
        this.removeEventListener('clear', clear);
        this.pendingAddPromises.delete(instanceId);
      };
      this.addEventListener('clear', clear);
      const _bailout = app => {

        // Add Error placeholder
        const errorPH = this.getErrorPlaceholder();
        if (app) {
          errorPH.position.fromArray(app.position);
          errorPH.quaternion.fromArray(app.quaternion);
          errorPH.scale.fromArray(app.scale);
        }
        this.addApp(errorPH);

        // Remove app
        if (app) {
          this.removeApp(app);
          app.destroy();
        }
        p.reject(new Error('app cleared during load: ' + contentId));
      };
      try {
        const m = await metaversefile.import(contentId);
        if (!live) return _bailout(null);
        const app = metaversefile.createApp({
          name: contentId,
          type: (() => {
            const match = contentId.match(/\.([a-z0-9]+)$/i);
            if (match) {
              return match[1];
            } else {
              return '';
            }
          })(),
        });
        app.position.fromArray(position);
        app.quaternion.fromArray(quaternion);
        app.scale.fromArray(scale);
        app.updateMatrixWorld();
        app.contentId = contentId;
        app.instanceId = instanceId;
        app.setComponent('physics', true);
        if (Array.isArray(m.components)) {
          for (const {key, value} of m.components) {
            app.setComponent(key, value);
          }
        }
        for (const {key, value} of components) {
          app.setComponent(key, value);
        }
        const mesh = await app.addModule(m);
        if (!live) return _bailout(app);
        if (!mesh) {
          console.warn('failed to load object', {contentId});
        }
        
        this.bindTrackedApp(trackedApp, app);
        
        this.addApp(app);

        /* const _bindRender = () => {
          // unFrustumCull(app);

          if (app.renderOrder === -Infinity) {
            sceneHighPriority.add(app);
          }
        };
        _bindRender(); */

        p.accept(app);
      } catch (err) {
        p.reject(err);
      } finally {
        cleanup();
      }
    });
    this.addEventListener('trackedappremove', async e => {
      const {instanceId, app} = e.data;
      
      this.unbindTrackedApp(instanceId);
      
      this.removeApp(app);
      app.destroy();
    });
    this.addEventListener('trackedappmigrate', async e => {
      const {
        app,
        sourceAppManager,
        destinationAppManager,
      } = e.data;
      // console.log('handle migrate', sourceAppManager === this, destinationAppManager === this);
      if (sourceAppManager === this) {
        const index = this.apps.indexOf(app);
        if (index !== -1) {
          this.apps.splice(index, 1);
        }
      } else if (destinationAppManager === this) {
        if (!this.apps.includes(app)) {
          this.apps.push(app);
        }
      }
    });
    
    const resize = e => {
      this.resize(e);
    };
    window.addEventListener('resize', resize);
    this.cleanup = () => {
      window.removeEventListener('resize', resize);
    };
  }
  getApps() {
    return this.apps;
  }
  getAppByInstanceId(instanceId) {
    return this.apps.find(app => app.instanceId === instanceId);
  }
  getAppByPhysicsId(physicsId) {
    for (const app of this.apps) {
      if (app.getPhysicsObjects && app.getPhysicsObjects().some(o => o.physicsId === physicsId)) {
        return app;
      }
    }
    return null;
  }
  getOrCreateTrackedApp(instanceId) {
    const {state} = this;
    const apps = state.getArray(this.prefix);

    for (const app of apps) {
      if (app.get('instanceId') === instanceId) {
        return app;
      }
    }
    
    const appMap = new Y.Map();
    apps.push([appMap]);
    return appMap;
  }
  getTrackedApp(instanceId) {
    const apps = this.state.getArray(this.prefix);
    for (const app of apps) {
      if (app.get('instanceId') === instanceId) {
        return app;
      }
    }
    return null;
  }
  hasTrackedApp(instanceId) {
    const apps = this.state.getArray(this.prefix);
    for (const app of apps) {
      if (app.get('instanceId') === instanceId) {
        return true;
      }
    }
    return false;
  }
  clear() {
    if (!this.state) {
      const apps = this.apps.slice();
      for (const app of apps) {
        this.removeApp(app);
        app.destroy();
      }
      this.dispatchEvent(new MessageEvent('clear'));
    } else {
      throw new Error('cannot clear world while it is bound');
    }
  }
  addTrackedAppInternal(
    instanceId,
    contentId,
    position,
    quaternion,
    scale,
    components,
  ) {
    // console.log('add tracked app internal', instanceId, contentId);
    const trackedApp = this.getOrCreateTrackedApp(instanceId);
    trackedApp.set('instanceId', instanceId);
    trackedApp.set('contentId', contentId);
    trackedApp.set('position', position);
    trackedApp.set('quaternion', quaternion);
    trackedApp.set('scale', scale);
    trackedApp.set('components', JSON.stringify(components));
    // const originalJson = trackedApp.toJSON();
    // trackedApp.set('originalJson', JSON.stringify(originalJson));
    return trackedApp;
  }
  addTrackedApp(
    contentId,
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    components = [],
  ) {
    const self = this;
    const {state} = this;
    const instanceId = getRandomString();
    state.transact(function tx() {
      self.addTrackedAppInternal(
        instanceId,
        contentId,
        position.toArray(),
        quaternion.toArray(),
        scale.toArray(),
        components,
      );
    });
    const p = this.pendingAddPromises.get(instanceId);
    if (p) {
      return p;
    } else {
      throw new Error('no pending world add object promise');
    }
  }
  getTrackedAppIndex(instanceId) {
    const apps = this.state.getArray(this.prefix);
    for (let i = 0; i < apps.length; i++) {
      const app = apps.get(i);
      if (app.get('instanceId') === instanceId) {
        return i;
      }
    }
    return -1;
  }
  removeTrackedAppInternal(instanceId) {
    // console.log('remove tracked app internal', removeInstanceId);
    
    const removeIndex = this.getTrackedAppIndex(instanceId);
    if (removeIndex !== -1) {
      const apps = this.state.getArray(this.prefix);
      apps.delete(removeIndex, 1);
    } else {
      console.warn('invalid remove instance id', {removeInstanceId, appsJson});
    }
  }
  removeTrackedApp(removeInstanceId) {
    const self = this;
    this.state.transact(function tx() {
      self.removeTrackedAppInternal(removeInstanceId);
    });
  }
  setTrackedAppTransform(instanceId, p, q, s) {
    const {state} = this;
    const self = this;
    state.transact(function tx() {
      const trackedApp = state.getMap(self.prefix + '.' + instanceId);
      trackedApp.set('position', p.toArray());
      trackedApp.set('quaternion', q.toArray());
      trackedApp.set('scale', s.toArray());
    });
  }
  addApp(app) {
    this.apps.push(app);
    
    /* if (this.autoSceneManagement) {
      const renderPriority = app.getComponent('renderPriority');
      switch (renderPriority) {
        case 'high': {
          sceneHighPriority.add(app);
          break;
        }
        case 'low': {
          sceneLowPriority.add(app);
          break;
        }
        default: {
          scene.add(app);
          break;
        }
      }
    } */
    
    this.dispatchEvent(new MessageEvent('appadd', {
      data: app,
    }));
  }
  removeApp(app) {
    const index = this.apps.indexOf(app);
    // console.log('remove app', app.instanceId, app.contentId, index, this.apps.map(a => a.instanceId), new Error().stack);
    if (index !== -1) {
      this.apps.splice(index, 1);
      
      if (this.autoSceneManagement) {
        app.parent.remove(app);
      }
      
      this.dispatchEvent(new MessageEvent('appremove', {
        data: app,
      }));
    }
  }
  resize(e) {
    const apps = this.apps.slice();
    for (const app of apps) {
      app.resize && app.resize(e);
    }
  }
  getErrorPlaceholder() {
    const app = metaversefile.createApp({
        name: 'error-placeholder',
      });
    app.contentId = 'error-placeholder';
    (async () => {
      await metaverseModules.waitForLoad();
      const {modules} = metaversefile.useDefaultModules();
      const m = modules['errorPlaceholder'];
      await app.addModule(m);
    })();
    return app;
  }
  /* setBlindStateMode(stateBlindMode) {
    this.stateBlindMode = stateBlindMode;
  } */
  transplantApp(app, dstAppManager) {
    const {instanceId} = app;
    const srcAppManager = this;
    
    // srcAppManager.setBlindStateMode(true);
    // dstAppManager.setBlindStateMode(true);
    
    if (srcAppManager.state === dstAppManager.state) {
      this.unbindTrackedApp(instanceId);
      
      let dstTrackedApp = null;
      srcAppManager.state.transact(() => {
        const srcTrackedApp = srcAppManager.getTrackedApp(instanceId);
        const contentId = srcTrackedApp.get('contentId');
        const position = srcTrackedApp.get('position');
        const quaternion = srcTrackedApp.get('quaternion');
        const scale = srcTrackedApp.get('scale');
        const components = srcTrackedApp.get('components');
        
        srcAppManager.removeTrackedAppInternal(instanceId);
        
        dstTrackedApp = dstAppManager.addTrackedAppInternal(
          instanceId,
          contentId,
          position,
          quaternion,
          scale,
          components,
        );
      });
      
      dstAppManager.bindTrackedApp(dstTrackedApp, app);
    } else {
      throw new Error('cannot transplant apps between app manager with different state');
    }
    
    // srcAppManager.setBlindStateMode(false);
    // dstAppManager.setBlindStateMode(false);
  }
  hasApp(app) {
    return this.apps.includes(app);
  }
  pushAppUpdates() {
    this.setPushingLocalUpdates(true);
    
    for (const app of this.apps) {
      if (this.hasTrackedApp(app.instanceId)) {
        app.updateMatrixWorld();
        if (!app.matrix.equals(app.lastMatrix)) {
          app.matrix.decompose(localVector, localQuaternion, localVector2);
          this.setTrackedAppTransform(app.instanceId, localVector, localQuaternion, localVector2);
          
          const physicsObjects = app.getPhysicsObjects();
          for (const physicsObject of physicsObjects) {
            physicsObject.position.copy(app.position);
            physicsObject.quaternion.copy(app.quaternion);
            physicsObject.scale.copy(app.scale);
            physicsObject.updateMatrixWorld();
            
            physicsManager.pushUpdate(physicsObject);
            physicsObject.needsUpdate = false;
          }
          
          app.lastMatrix.copy(app.matrix);
        }
      }
    }

    this.setPushingLocalUpdates(false);
  }
  destroy() {
    const index = appManagers.indexOf(this);
    if (index !== -1) {
      this.cleanup();
      
      appManagers.splice(index, 1);
    } else {
      throw new Error('double destroy of app manager');
    }
  }
}
export {
  AppManager,
};