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

const appManagers = [];

// Main class to handle metaverse apps
// Apps are synced with zjs 
// Docs for yjs, which is similar to zjs, can be helpful
// https://docs.yjs.dev/
class AppManager extends EventTarget {
  constructor({
    appsArray = new Z.Doc().getArray(worldMapName),
  } = {}) {
    super();
    // clear this apps array
    this.appsArray = null;
    this.apps = [];
    
    this.pendingAddPromises = new Map();
    // this.pushingLocalUpdates = false;
    this.unbindStateFn = null;
    this.trackedAppUnobserveMap = new Map();
    // bind the array to this app
    // this.bindState(appsArray);
    this.bindEvents();
    // add this app manager to the array, this is the main reference to this app
    appManagers.push(this);
  }
  // Update the app and dispatch a frame event to any listeners
  // this is the primary app update
  tick(timestamp, timeDiff, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timeDiff;
    this.dispatchEvent(new MessageEvent('frame', localFrameOpts));
  }
  /* setPushingLocalUpdates(pushingLocalUpdates) {
    this.pushingLocalUpdates = pushingLocalUpdates;
  } */
  // get the app manager for a tracked app with a particular ID
  getPeerOwnerAppManager(instanceId) {
    for (const appManager of appManagers) {
      if (appManager !== this && appManager.appsArray.doc === this.appsArray.doc && appManager.hasTrackedApp(instanceId)) {
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
  // bind the local app state to the shared zjs map
  bindState(nextAppsArray) {
    if (!nextAppsArray) return;
    this.unbindState();
  
      const observe = (e, origin) => {
        console.log("observing e", e)
        const {added, deleted} = e.changes;
        
        // handle new apps added
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

          console.log("appMap is", appMap)
          const hadApp = this.apps.some(app => app.instanceId === instanceId);
          // get the ref or create the app if it doesn't already exist
          const trackedApp = this.getOrCreateTrackedApp(instanceId);
          console.log("trackedApp is", appMap)

          // we already have the app
          if (hadApp) {
            console.log('accept migration add', instanceId);
            const app = metaversefile.getAppByInstanceId(instanceId)
            console.log("app is", app)
            if(app){

              this.bindTrackedApp(trackedApp, app);
              // this.addApp(app);
            } else {
              this.dispatchEvent(new MessageEvent('trackedappadd', {
                data: {
                  trackedApp,
                },
              }));
            }


          } else {
            // we don't have the app, so we created it -- notify listeners
            console.log('detected add app', instanceId, trackedApp.toJSON(), new Error().stack);
            this.dispatchEvent(new MessageEvent('trackedappadd', {
              data: {
                trackedApp,
              },
            }));
          }


        }
        // handle apps deleted
        for (const item of deleted.values()) {
          const appMap = item.content.type;
          const instanceId = item.content.type._map.get('instanceId').content.arr[0]; // needed to get the old data

          const app = this.getAppByInstanceId(instanceId);
          const peerOwnerAppManager = this.getPeerOwnerAppManager(instanceId);
          
          if (app && peerOwnerAppManager) {
            console.log('detected migrate app 1', instanceId, appManagers.length);
            console.log(new Error().stack)
            const e = new MessageEvent('trackedappmigrate', {
              data: {
                app,
                sourceAppManager: this,
                destinationAppManager: peerOwnerAppManager,
              },
            });
            this.dispatchEvent(e);
            peerOwnerAppManager.dispatchEvent(e);
          }
          
          
          else{
            console.log('detected remove app 2', instanceId, appManagers.length);
            console.log("Removing app", app)
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
    this.appsArray = nextAppsArray;
  }
  // call 'trackedappadd' event which initializes the apps everywhere
  loadApps() {
    for (let i = 0; i < this.appsArray.length; i++) {
      const trackedApp = this.appsArray.get(i, Z.Map);
      this.dispatchEvent(new MessageEvent('trackedappadd', {
        data: {
          trackedApp,
        },
      }));
    }
  }
  // bind a tracked app so that it's state is synced over the network
  // this sets up an observer to update whenever the tracked app changes
  bindTrackedApp(trackedApp, app) {
    console.log("bindTrackedApp", trackedApp, app, new Error().stack)
    const _observe = (e, origin) => {
      if (origin !== 'push') {
        // if (e.changes.keys.has('transform')) {
          const transform = trackedApp.get('transform');
          app.position.fromArray(transform, 0);
          app.quaternion.fromArray(transform, 3);
          app.scale.fromArray(transform, 7);
          app.transform = transform
        // }
      }
    };
    trackedApp.observe(_observe);
    
    const instanceId = trackedApp.get('instanceId');
    this.trackedAppUnobserveMap.set(instanceId, trackedApp.unobserve.bind(trackedApp, _observe));
  }
  // unbind and stop tracking this app
  // apps are also unbound and rebound when migrated
  unbindTrackedApp(instanceId) {
    console.log('unbind tracked app', instanceId, new Error().stack);
    const fn = this.trackedAppUnobserveMap.get(instanceId);
    
    if (fn) {
      this.trackedAppUnobserveMap.delete(instanceId);
      fn();
    } else {
      console.warn('tracked app was not bound:', instanceId);
    }
  }
  // bind events to this object to start listening for events to create and destroy apps
  bindEvents() {
    this.addEventListener('trackedappadd', async e => {
      const {trackedApp} = e.data;
      const trackedAppJson = trackedApp.toJSON();
      const {instanceId, contentId, transform, position, scale, quaternion, components: componentsString} = trackedAppJson;
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
          // name: contentId,
        });

        console.log("trackedappadd, components are, ", components)

        app?.position?.fromArray(position ?? transform)
        app?.quaternion?.fromArray(quaternion ?? transform, quaternion ? 0 : 3)
        app?.scale?.fromArray(scale ?? transform, scale ? 0 : 7);
        app.updateMatrixWorld();
        app.lastMatrix.copy(app.matrixWorld);

        app.instanceId = instanceId;
        app.setComponent('physics', true);
        for (const {key, value} of components) {
          app.setComponent(key, value);
        }
        // console.log('add module', m);
        const mesh = await app.addModule(m);
        if (!live) return _bailout(app);
        if (!mesh) {
          console.warn('failed to load object', {contentId});
        }
        
        this.bindTrackedApp(trackedApp, app);
        
        this.addApp(app);

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
  getOrCreateTrackedApp(instanceId) {
    for (let i = 0; this.appsArray.length > i; i++) {
    // for (const app of this.appsArray) {
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
    trackedApp.set('components', JSON.stringify(components));
    return trackedApp;
  }
  transform = new Float32Array(11);
  addTrackedApp(
    contentId,
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    components = [],
  ) {
    const self = this;
    const instanceId = getRandomString();
    this.appsArray.doc.transact(function tx() {

      const transform = self.transform

      const pack3 = (v, i) => {
        transform[i] = v.x;
        transform[i + 1] = v.y;
        transform[i + 2] = v.z;
      };
      const pack4 = (v, i) => {
        transform[i] = v.x;
        transform[i + 1] = v.y;
        transform[i + 2] = v.z;
        transform[i + 3] = v.w;
      };
  
      pack3(position, 0);
      pack4(quaternion, 3);
      pack3(scale, 7);
      
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
      throw new Error('no pending world add object promise');
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
      console.warn('invalid remove instance id', {removeInstanceId, appsJson});
      debugger;
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
  // Replace a tracked app with a new one
  transplantApp(app, dstAppManager) {
    const {instanceId} = app;
    const srcAppManager = this;
    
    // srcAppManager.setBlindStateMode(true);
    // dstAppManager.setBlindStateMode(true);
    
    if (srcAppManager.appsArray.doc === dstAppManager.appsArray.doc) {
      this.unbindTrackedApp(instanceId);
      
      let dstTrackedApp = null;
      srcAppManager.appsArray.doc.transact(() => {
        const srcTrackedApp = srcAppManager.getTrackedApp(instanceId);
        console.log("srcTrackedApp is", srcTrackedApp)
        const contentId = srcTrackedApp.get('contentId');

        const components = srcTrackedApp.get('components');

        let transform = srcTrackedApp.get('transform');
        if(!transform){
          const position = srcTrackedApp.get('position');
          const quaternion = srcTrackedApp.get('quaternion');
          const scale = srcTrackedApp.get('scale') ?? [1, 1, 1];
  
          transform = new Float32Array(11);
   
              const pack3 = (v, i) => {
                transform[i] = v[0];
                transform[i + 1] = v[1];
                transform[i + 2] = v[2];
              };
              const pack4 = (v, i) => {
                transform[i] = v[0];
                transform[i + 1] = v[1];
                transform[i + 2] = v[2];
                transform[i + 3] = v[3];
              };
          
              pack3(position, 0);
              pack4(quaternion, 3);
              pack3(scale, 7);
        }
        srcAppManager.removeTrackedAppInternal(instanceId);
        
        dstTrackedApp = dstAppManager.addTrackedAppInternal(
          instanceId,
          contentId,
          transform,
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
    if (this.appsArray) {
      this.appsArray.doc.transact(() => { 
        this.updatePhysics();
      }, 'push');
    }
  }
  packed = new Float32Array(11);
  updatePhysics() {
    for (const app of this.apps) {
      if (!app.matrix.equals(app.lastMatrix)) {
        const _updateTrackedApp = () => {
          // note: not all apps are tracked in multiplayer. for those that are, we push the transform update here.
          const trackedApp = this.getTrackedApp(app.instanceId);
          if (trackedApp) {
            app.matrixWorld.decompose(localVector, localQuaternion, localVector2);
            app.updateMatrixWorld();
            const packed = this.packed
            const pack3 = (v, i) => {
              packed[i] = v.x;
              packed[i + 1] = v.y;
              packed[i + 2] = v.z;
            };
            const pack4 = (v, i) => {
              packed[i] = v.x;
              packed[i + 1] = v.y;
              packed[i + 2] = v.z;
              packed[i + 3] = v.w;
            };
            pack3(localVector, 0);
            pack4(localQuaternion, 3);
            pack3(localVector2, 7);        
            trackedApp.set('transform', packed);
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

                physicsManager.setTransform(physicsObject);
                physicsManager.getBoundingBoxForPhysicsId(physicsObject.physicsId, physicsObject.physicsMesh.geometry.boundingBox);
              }
            }
          }
        };
        _updatePhysicsObjects();

        app.lastMatrix.copy(app.matrix);
      }
    }
  }
  updateRemote() {
    console.log("Remote update")
    for (const app of this.apps) {
      if (!app.matrix.equals(app.lastMatrix)) {
        const _updateTrackedApp = () => {
          // note: not all apps are tracked in multiplayer. for those that are, we push the transform update here.
          const trackedApp = this.getTrackedApp(app.instanceId);
          const transform = trackedApp.get('transform');
          if(transform){
            app.position.fromArray(transform, 0);
            app.quaternion.fromArray(transform, 3);
            app.scale.fromArray(transform, 7);
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

                physicsManager.setTransform(physicsObject);
                physicsManager.getBoundingBoxForPhysicsId(physicsObject.physicsId, physicsObject.physicsMesh.geometry.boundingBox);
              }
            }
          }
        };
        _updatePhysicsObjects();

        app.lastMatrix.copy(app.matrix);
        app.updateMatrixWorld()

      }
    }
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
    }
  }
}
export {
  AppManager,
};