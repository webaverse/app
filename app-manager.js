/*
app manager binds z.js data to live running metaversefile apps.
you can have as many app managers as you want.
*/

import * as THREE from 'three';
import * as Z from 'zjs';

import {makePromise, getRandomString} from './util.js';
import physicsManager from './physics-manager.js';
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';
import {jsonParse} from './util.js';
import {worldMapName} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const localData = {
  timestamp: 0,
  frame: null,
  timeDiff: 0,
};
const localFrameOpts = {
  data: localData,
};
const frameEvent = new MessageEvent('frame', localFrameOpts);

const physicsScene = physicsManager.getScene();

const appManagers = [];
class AppManager extends EventTarget {
  constructor({
    appsArray = new Z.Doc().getArray(worldMapName),
  } = {}) {
    super();
    
    this.appsArray = null;
    this.apps = [];

    this.transform = new Float32Array(10);
    
    this.pendingAddPromises = new Map();
    // this.pushingLocalUpdates = false;
    this.unbindStateFn = null;
    this.trackedAppUnobserveMap = new Map();
    
    this.bindState(appsArray);
    this.bindEvents();
  
    appManagers.push(this);
  }
  tick(timestamp, timeDiff, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timeDiff;
    this.dispatchEvent(frameEvent);
  }
  /* setPushingLocalUpdates(pushingLocalUpdates) {
    this.pushingLocalUpdates = pushingLocalUpdates;
  } */
  getPeerOwnerAppManager(instanceId) {
    for (const appManager of appManagers) {
      if (appManager !== this && /*appManager.appsArray.doc === this.appsArray.doc &&*/ appManager.hasTrackedApp(instanceId)) {
        return appManager;
      }
    }
    return null;
  }
  isBound() {
    return !!this.appsArray;
  }
  unbindState() {
    if (this.isBound()) {
      this.unbindStateFn();
      this.appsArray = null;
      this.unbindStateFn = null;
    }
  }
  bindState(nextAppsArray) {
    this.unbindState();
  
    if (nextAppsArray) {
      const observe = e => {
        const {added, deleted} = e.changes;
        
        for (const item of added.values()) {
          let appMap = item.content.type;
          if (appMap.constructor === Object) {
            for (let i = 0; i < this.appsArray.length; i++) {
              const localAppMap = this.appsArray.get(i, Z.Map); // force to be a map
              if (localAppMap.binding === item.content.type) {
                appMap = localAppMap;
                break;
              }
            }
          }

          const instanceId = appMap.get('instanceId');
          
          const oldApp = this.apps.find(app => app.instanceId === instanceId);
          if (oldApp) {
            // console.log('accept migration add', instanceId);
            this.dispatchEvent(new MessageEvent('trackedappimport', {
              data: {
                instanceId,
                app: oldApp,
                // sourceAppManager: this,
                // destinationAppManager: peerOwnerAppManager,
              },
            }));
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
            
            const e = new MessageEvent('trackedappexport', {
              data: {
                instanceId,
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
      };
      nextAppsArray.observe(observe);
      this.unbindStateFn = () => {
        nextAppsArray.unobserve(observe);
      };
    }
    this.appsArray = nextAppsArray;
  }
  async loadApps() {
    for (let i = 0; i < this.appsArray.length; i++) {
      const trackedApp = this.appsArray.get(i, Z.Map);
      if(this.hasTrackedApp(trackedApp.get('instanceId'))) {
        const app = this.apps.find(app => app.instanceId === trackedApp.get('instanceId'));
        if(!app){
          await this.importTrackedApp(trackedApp);
        }
      }
    }
  }
  trackedAppBound (instanceId) {
    return !!this.trackedAppUnobserveMap.get(instanceId)
  }
  
  async importTrackedApp(trackedApp) {
    const trackedAppBinding = trackedApp.toJSON();
    const {instanceId, contentId, transform, components} = trackedAppBinding;
    
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

    // attempt to load app
    try {
      const m = await metaversefile.import(contentId);
      if (!live) return _bailout(null);

      // create app
      // as an optimization, the app may be reused by calling addApp() before tracking it
      const app = metaversefile.createApp();

      // setup
      {
        // set pose
        app.position.fromArray(transform);
        app.quaternion.fromArray(transform, 3);
        app.scale.fromArray(transform, 7);
        app.updateMatrixWorld();
        app.lastMatrix.copy(app.matrixWorld);

        // set components
        app.instanceId = instanceId;
        app.setComponent('physics', true);
        for (const {key, value} of components) {
          app.setComponent(key, value);
        }
      }

      // initialize app
      {
        // console.log('add module', m);
        const mesh = await app.addModule(m);
        if (!live) return _bailout(app);
        if (!mesh) {
          console.warn('failed to load object', {contentId});
        }

        this.addApp(app);
      }

      this.bindTrackedApp(trackedApp, app);

      p.accept(app);
    } catch (err) {
      p.reject(err);
    } finally {
      cleanup();
    }
  }

  bindTrackedApp(trackedApp, app) {
    // console.log('bind tracked app', trackedApp.get('instanceId'));
    const _observe = (e, origin) => {
      // ! bellow code is bugged
      // if (origin !== 'push') {
      //   if (e.changes.keys.has('transform')) {
      //     app.position.fromArray(trackedApp.get('transform'));
      //     app.quaternion.fromArray(trackedApp.get('transform'), 3);
      //     app.scale.fromArray(trackedApp.get('transform'), 7);
      //     app.updateMatrixWorld();
      //   }
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
      this.importTrackedApp(trackedApp);
    });
    this.addEventListener('trackedappremove', async e => {
      const {instanceId, app} = e.data;
      
      this.unbindTrackedApp(instanceId);
      
      this.removeApp(app);
      app.destroy();
    });
    this.addEventListener('trackedappimport', async e => {
      const {
        instanceId,
        app,
      } = e.data;
    
      /* if (!this.apps.includes(app)) {
        this.apps.push(app);
      } */
    });
    this.addEventListener('trackedappexport', async e => {
      const {
        instanceId,
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
  getPhysicsObjectByPhysicsId(physicsId) {
    for (const app of this.apps) {
      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        if (physicsObject.physicsId === physicsId) {
          return physicsObject;
        }
      }
    }
    return null;
  }
  getPairByPhysicsId(physicsId) {
    for (const app of this.apps) {
      const physicsObjects = app.getPhysicsObjects();
      for (const physicsObject of physicsObjects) {
        if (physicsObject.physicsId === physicsId) {
          return [app, physicsObject];
        }
      }
    }
    return null;
  }
  getOrCreateTrackedApp(instanceId) {
    for (let i = 0; this.appsArray.length > i; i++) {
      const app = this.appsArray.get(i, Z.Map);
      if (app.get('instanceId') === instanceId) {
        return app;
      }
    }
    
    const appMap = new Z.Map();
    this.appsArray.push([appMap]);
    return appMap;
  }
  getTrackedApp(instanceId) {
    for (const app of this.appsArray) {
      if (app.get('instanceId') === instanceId) {
        return app;
      }
    }
    return null;
  }
  hasTrackedApp(instanceId) {
    for (const app of this.appsArray) {
      if (app.get('instanceId') === instanceId) {
        return true;
      }
    }
    return false;
  }
  clear() {
    if (!this.isBound()) {
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
    transform,
    components,
  ) {
    // console.log('add tracked app internal', instanceId, contentId);
    const trackedApp = this.getOrCreateTrackedApp(instanceId);
    trackedApp.set('instanceId', instanceId);
    trackedApp.set('contentId', contentId);
    trackedApp.set('transform', transform);
    trackedApp.set('components', components);
    return trackedApp;
  }
  addTrackedApp(
    contentId,
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    components = [],
    instanceId = getRandomString(),
  ) {
    const self = this;
    this.appsArray.doc.transact(function tx() {
      const transform = new Float32Array(10);
      position.toArray(transform);
      quaternion.toArray(transform, 3);
      scale.toArray(transform, 7);
      self.addTrackedAppInternal(
        instanceId,
        contentId,
        transform,
        components,
      );
    });
    const p = this.pendingAddPromises.get(instanceId);
    if (p) {
      return p;
    } else {
      const app = this.getAppByInstanceId(instanceId);
      if (app) {
        return Promise.resolve(app);
      } else {
        throw new Error('no pending world add object promise');
      }
    }
  }
  getTrackedAppIndex(instanceId) {
    for (let i = 0; i < this.appsArray.length; i++) {
      const app = this.appsArray.get(i);
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
      this.appsArray.delete(removeIndex, 1);
    } else {
      console.warn('invalid remove instance id', instanceId);
    }
  }
  removeTrackedApp(removeInstanceId) {
    const self = this;
    this.appsArray.doc.transact(function tx() {
      self.removeTrackedAppInternal(removeInstanceId);
    });
  }
  addApp(app) {
    this.apps.push(app);
    
    this.dispatchEvent(new MessageEvent('appadd', {
      data: app,
    }));
  }
  removeApp(app) {
    const index = this.apps.indexOf(app);
    // console.log('remove app', app.instanceId, app.contentId, index, this.apps.map(a => a.instanceId), new Error().stack);
    if (index !== -1) {
      this.apps.splice(index, 1);
      
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
    
    this.unbindTrackedApp(instanceId);
    
    let dstTrackedApp = null;

    const wrapTxFn = (srcAppManager.appsArray.doc === dstAppManager.appsArray.doc) ?
      innerFn => srcAppManager.appsArray.doc.transact(innerFn)
    :
      innerFn => dstAppManager.appsArray.doc.transact(() => {
        srcAppManager.appsArray.doc.transact(innerFn);
      });
    wrapTxFn(() => {
      const srcTrackedApp = srcAppManager.getTrackedApp(instanceId);
      /* if (!srcTrackedApp) {
        console.log('transplant app', {app, srcTrackedApp});
        debugger;
      } */
      const contentId = srcTrackedApp.get('contentId');
      const transform = srcTrackedApp.get('transform');
      const components = srcTrackedApp.get('components');
      
      srcAppManager.removeTrackedAppInternal(instanceId);
      
      dstTrackedApp = dstAppManager.addTrackedAppInternal(
        instanceId,
        contentId,
        transform,
        components,
      );
    });
    
    dstAppManager.bindTrackedApp(dstTrackedApp, app);
    /* } else {
      throw new Error('cannot transplant apps between app manager with different state binding');
    } */
    
    // srcAppManager.setBlindStateMode(false);
    // dstAppManager.setBlindStateMode(false);
  }
  importApp(app) {
    const self = this;
    this.appsArray.doc.transact(() => {
      const contentId = app.contentId;
      const instanceId = app.instanceId;
      const components = app.components.slice();
      const transform = new Float32Array(10);
      app.position.toArray(transform);
      app.quaternion.toArray(transform, 3);
      app.scale.toArray(transform, 7);
      
      const dstTrackedApp = self.addTrackedAppInternal(
        instanceId,
        contentId,
        transform,
        components,
      );

      self.addApp(app);
      self.bindTrackedApp(dstTrackedApp, app);
    });
  }
  hasApp(app) {
    return this.apps.includes(app);
  }
  pushAppUpdates() {
    if (this.appsArray) {
      this.appsArray.doc.transact(() => { 
        this.updatePhysics();
      }, 'push');
    }
  }
  updatePhysics() {
    for (const app of this.apps) {
      if (!app.matrix.equals(app.lastMatrix)) {
        const _updateTrackedApp = () => {
          // note: not all apps are tracked in multiplayer. for those that are, we push the transform update here.
          const trackedApp = this.getTrackedApp(app.instanceId);
          if (trackedApp) {
            app.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        
            localVector.toArray(this.transform);
            localQuaternion.toArray(this.transform, 3);
            localVector2.toArray(this.transform, 7);
            trackedApp.set('transform', this.transform);

            app.updateMatrixWorld();
          }
        };
        _updateTrackedApp();

        const _updatePhysicsObjects = () => {
          // update attached physics objects with a relative transform
          const physicsObjects = app.getPhysicsObjects();
          if (physicsObjects.length > 0) {
            const lastMatrixInverse = localMatrix.copy(app.lastMatrix).invert();

            for (const physicsObject of physicsObjects) {
              if (!physicsObject.detached) {
                physicsObject.matrix
                  .premultiply(lastMatrixInverse)
                  .premultiply(app.matrix)
                  .decompose(physicsObject.position, physicsObject.quaternion, physicsObject.scale);
                physicsObject.matrixWorld.copy(physicsObject.matrix);
                for (const child of physicsObject.children) {
                  child.updateMatrixWorld();
                }

                physicsScene.setTransform(physicsObject);
                physicsScene.getBoundingBoxForPhysicsId(physicsObject.physicsId, physicsObject.physicsMesh.geometry.boundingBox);
              }
            }
          }
        };
        _updatePhysicsObjects();

        app.lastMatrix.copy(app.matrix);
      }
    }
  }
  exportJSON() {
    const objects = [];

    // iterate over appsArray
    for (const trackedApp of this.appsArray) {
      const transform = trackedApp.get('transform');
      const components = trackedApp.get('components') ?? [];
      const object = {
        transform,
        components,
      };
      // console.log('got app object', object);
    
      let contentId = trackedApp.get('contentId');
      const match = contentId.match(/^\/@proxy\/data:([^;,]+),([\s\S]*)$/);
      if (match) {
        const type = match[1];
        const content = decodeURIComponent(match[2]);
        object.type = type;
        object.content = jsonParse(content) ?? {};
      } else {
        object.contentId = contentId;
      }

      objects.push(object);
    }

    return objects;
  }
  destroy() {
    if (!this.isBound()) {
      this.clear();
      
      const index = appManagers.indexOf(this);
      if (index !== -1) {
        this.clear();
        
        appManagers.splice(index, 1);
      } else {
        throw new Error('double destroy of app manager');
      }
    } else {
      throw new Error('destroy of bound app manager');
    }
  }
}
export {
  AppManager,
};
