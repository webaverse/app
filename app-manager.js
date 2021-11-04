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
  constructor({prefix = worldMapName, state = new Y.Doc(), apps = [], autoSceneManagement = true} = {}) {
    super();
    
    this.prefix = prefix;
    this.state = state;
    this.apps = apps;
    
    this.bindState(this.state);
    this.bindEvents();
    
    this.pendingAddPromise = null;
    this.pushingLocalUpdates = false;
    this.lastTimestamp = performance.now();
    this.autoSceneManagement = autoSceneManagement;
    // this.stateBlindMode = false;
  
    appManagers.push(this);
  }
  pretick(timestamp, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.dispatchEvent(new MessageEvent('preframe', localFrameOpts));
  }
  tick(timestamp, frame) {
    // this.dispatchEvent(new MessageEvent('startframe', localFrameOpts));
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
  bindState(state) {
    const apps = state.getArray(this.prefix);
    let lastApps = [];
    apps.observe(() => {
      // if (!this.stateBlindMode) {
        const nextApps = apps.toJSON();

        // console.log('next apps', nextApps, lastApps);

        for (const instanceId of nextApps) {
          if (!lastApps.includes(instanceId)) {
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
        }
        for (const instanceId of lastApps) {
          if (!nextApps.includes(instanceId)) {
            const trackedApp = state.getMap(this.prefix + '.' + instanceId);
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
                  trackedApp,
                  app,
                },
              }));
            }
          }
        }

        lastApps = nextApps;
      // }
    });

    const resize = e => {
      this.resize(e);
    };
    window.addEventListener('resize', resize);
    this.cleanup = () => {
      window.removeEventListener('resize', resize);
    };
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
    trackedApp.unobserveBinding = trackedApp.unobserve.bind(trackedApp, _observe);
  }
  unbindTrackedApp(trackedApp) {
    // console.log('unbind tracked app', this.prefix, trackedApp.get('instanceId'));
    trackedApp.unobserveBinding();
    trackedApp.unobserveBinding = null;
  }
  bindEvents() {
    this.addEventListener('trackedappadd', async e => {
      const {trackedApp} = e.data;
      const trackedAppJson = trackedApp.toJSON();
      const {instanceId, contentId, position, quaternion, scale, components: componentsString} = trackedAppJson;
      const components = JSON.parse(componentsString);
      
      const p = makePromise();
      this.pendingAddPromise = p;

      let live = true;
      
      const clear = e => {
        live = false;
        cleanup();
      };
      const cleanup = () => {
        this.removeEventListener('clear', clear);
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
        for (const {key, value} of components) {
          app.setComponent(key, value);
        }
        const mesh = await app.addModule(m);
        if (!live) return _bailout(app);
        if (!mesh) {
          console.warn('failed to load object', {contentId});
        }
        
        this.addApp(app);

        /* const _bindRender = () => {
          // unFrustumCull(app);

          if (app.renderOrder === -Infinity) {
            sceneHighPriority.add(app);
          }
        };
        _bindRender(); */

        this.bindTrackedApp(trackedApp, app);

        this.dispatchEvent(new MessageEvent('appadd', {
          data: app,
        }));

        p.accept(app);
      } catch (err) {
        p.reject(err);
      } finally {
        cleanup();
      }
    });
    this.addEventListener('trackedappremove', async e => {
      const {instanceId, trackedApp, app} = e.data;
      
      this.unbindTrackedApp(trackedApp);
      
      this.removeApp(app);
      app.destroy();

      this.dispatchEvent(new MessageEvent('appremove', {
        data: app,
      }));
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

    let hadObject = false;
    for (const app of apps) {
      if (app === instanceId) {
        hadObject = true;
        break;
      }
    }
    if (!hadObject) {
      apps.push([instanceId]);
    }

    return state.getMap(this.prefix + '.' + instanceId);
  }
  getTrackedApp(instanceId) {
    const apps = this.state.getArray(this.prefix);
    for (const app of apps) {
      if (app === instanceId) {
        return this.state.getMap(this.prefix + '.' + instanceId);
      }
    }
    return null;
  }
  hasTrackedApp(instanceId) {
    const apps = this.state.getArray(this.prefix);
    for (const app of apps) {
      if (app === instanceId) {
        return true;
      }
    }
    return false;
  }
  clear() {
    const apps = this.apps.slice();
    for (const app of apps) {
      this.removeApp(app);
      app.destroy();
    }
    this.dispatchEvent(new MessageEvent('clear'));
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
    const originalJson = trackedApp.toJSON();
    trackedApp.set('originalJson', JSON.stringify(originalJson));
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
    if (this.pendingAddPromise) {
      const result = this.pendingAddPromise;
      result.instanceId = instanceId;
      this.pendingAddPromise = null;
      return result;
    } else {
      throw new Error('no pending world add object promise');
    }
  }
  removeTrackedAppInternal(removeInstanceId) {
    // console.log('remove tracked app internal', removeInstanceId);
    const {state} = this;
    const apps = state.getArray(this.prefix);
    const appsJson = apps.toJSON();
    const removeIndex = appsJson.indexOf(removeInstanceId);
    if (removeIndex !== -1) {
      // const allRemoveIndices = [removeIndex];
      // for (const removeIndex of allRemoveIndices) {
        const instanceId = appsJson[removeIndex];

        apps.delete(removeIndex, 1);

        const trackedAppKey = this.prefix + '.' + instanceId;
        const trackedApp = state.getMap(trackedAppKey);
        const keys = Array.from(trackedApp.keys());
        for (const key of keys) {
          trackedApp.delete(key);
        }
      // }
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
    
    if (this.autoSceneManagement) {
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
    }
  }
  removeApp(app) {
    const index = this.apps.indexOf(app);
    // console.log('remove app', app.instanceId, app.contentId, index, this.apps.map(a => a.instanceId), new Error().stack);
    if (index !== -1) {
      this.apps.splice(index, 1);
      
      if (this.autoSceneManagement) {
        app.parent.remove(app);
      }
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
      const srcTrackedApp = srcAppManager.getTrackedApp(instanceId);
      this.unbindTrackedApp(srcTrackedApp);
      
      let dstTrackedApp = null;
      srcAppManager.state.transact(() => {
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