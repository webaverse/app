/*
app manager binds z.js data to live running metaversefile apps.
you can have as many app managers as you want.
*/

import * as THREE from 'three';
import * as Z from 'zjs';

import { makePromise, getRandomString } from './util.js';
import physicsManager from './physics-manager.js';
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';
import { jsonParse } from './util.js';
import { worldMapName } from './constants.js';

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

let binder = 0;

const appManagers = [];
class AppManager extends EventTarget {
  constructor({ appsArray = new Z.Doc().getArray(worldMapName) } = {}) {
    super();

    this.appsArray = null;
    this.apps = [];

    this.pendingAddPromises = new Map();
    // this.pushingLocalUpdates = false;
    this.unbindStateFn = null;
    this.trackedAppUnobserveMap = new Map();
    // we were binding state here, but we don't want that since it causes remote player isomorphism problems
    // this.bindState(appsArray);
    this.bindEvents();

    appManagers.push(this);
  }
  tick(timestamp, timeDiff, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timeDiff;
    this.dispatchEvent(new MessageEvent('frame', localFrameOpts));
  }
  /* setPushingLocalUpdates(pushingLocalUpdates) {
    this.pushingLocalUpdates = pushingLocalUpdates;
  } */
  getPeerOwnerAppManager(instanceId) {
    for (const appManager of appManagers) {
      if (
        appManager !== this &&
        appManager.appsArray.doc === this.appsArray.doc &&
        appManager.hasTrackedApp(instanceId)
      ) {
        return appManager;
      }
    }
    return null;
  }
  isBound() {
    return !!this.appsArray;
  }
  unbindState() {
      this.unbindStateFn();
      this.appsArray = null;
      this.unbindStateFn = null;
    // }
  }
  unbindStateLocal() {
    // console.log('unbind state local', this.appsArray, this.appsArray && this.appsArray.toJSON(), new Error().stack);
    if (this.unbindStateFn) {
      this.unbindState();
    }
  }
  unbindStateRemote() {
    if (this.unbindStateFn) {
      // console.log('unbind player observers', lastPlayers, new Error().stack);
      // this is the point where we should destroy the remote players in a fake way
      console.log('got players array', this.appsArray);
      const appSpecs = this.appsArray.toJSON();
      for (const appSpec of appSpecs) {
        const app = this.getAppByInstanceId(appSpec.instanceId);
        if (app) {
          console.log('destroy remote player app', app);
          this.removeApp(app);
        } else {
          console.log('no remote app to destroy', appSpec);
          throw new Error('no remote app to destroy');
        }
      }

      this.unbindState();
    }
  }
  bindState(nextAppsArray) {
    const observe = (e) => {
      const { added, deleted } = e.changes;
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

          if(oldApp.getComponent('wear') && this.callBackFn) {
            this.callBackFn(oldApp, 'wear', 'add')
          }
        } else {
          const trackedApp = this.getOrCreateTrackedApp(instanceId);
          // console.log('detected add app', instanceId, trackedApp.toJSON(), new Error().stack);
          this.dispatchEvent(
            new MessageEvent('trackedappadd', {
              data: {
                trackedApp,
              },
            })
          );
        }
      }
      for (const item of deleted.values()) {
        const appMap = item.content.type;
        const instanceId =
          item.content.type._map.get('instanceId').content.arr[0]; // needed to get the old data

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
          
          if(app.getComponent('wear') && this.callBackFn) {
            this.callBackFn(app, 'wear', 'remove')
          }
          break;
        }

        // console.log('detected remove app 2', instanceId, appManagers.length);

        if (!migrated) {
          // console.log('detected remove app 3', instanceId, appManagers.length);

          this.dispatchEvent(
            new MessageEvent('trackedappremove', {
              data: {
                instanceId,
                app,
              },
            })
          );
        }
      }
    };
    // XXX this creates the observer which gets hit with double add
    nextAppsArray.observe(observe);
    this.unbindStateFn = nextAppsArray.unobserve.bind(
      nextAppsArray,
      observe
    );

    this.appsArray = nextAppsArray;
  }
  bindStateLocal(nextAppsArray) {
    this.unbindStateLocal();
    this.bindState(nextAppsArray);
  }
  bindStateRemote(nextAppsArray) {
    this.unbindStateRemote();
    this.bindState(nextAppsArray);
  }
  loadApps() {
    console.log('load apps', this.appsArray);
    for (let i = 0; i < this.appsArray.length; i++) {
      const trackedApp = this.appsArray.get(i, Z.Map);
      this.dispatchEvent(
        new MessageEvent('trackedappadd', {
          data: {
            trackedApp,
          },
        })
      );
    }
  }
  bindTrackedApp(trackedApp, app) {
    const _observe = (e, origin) => {
      if(origin == 'push') return console.log("push")

        if (e.changes.keys.has('transform')) {
          const transform = trackedApp.get('transform');
          app.position.fromArray(transform, 0);
          app.quaternion.fromArray(transform, 3);
          app.scale?.fromArray(transform, 7);
          app.transform = transform;
      }
    };
    trackedApp.observe(_observe);

    const instanceId = trackedApp.get('instanceId');
    this.trackedAppUnobserveMap.set(
      instanceId,
      trackedApp.unobserve.bind(trackedApp, _observe)
    );
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
    const localBinder = ++binder;
    console.log('app bind events', this.apps, localBinder, new Error().stack);
    
    const m = new Map();
    this.addEventListener('trackedappadd', async (e) => {
      const { trackedApp } = e.data;
      const trackedAppJson = trackedApp.toJSON();
      const {
        instanceId,
        contentId,
        transform,
        position,
        quaternion,
        scale,
        components: componentsString,
      } = trackedAppJson;
      // console.log('tracked app add', instanceId, localBinder, new Error().stack);
      m.set(instanceId, true);
      // console.log("trackedAppJson is", trackedAppJson)
      const components = JSON.parse(componentsString);

      const p = makePromise();
      p.instanceId = instanceId;
      this.pendingAddPromises.set(instanceId, p);

      let live = true;

      const clear = (e) => {
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
          if(position){
            app.position.fromArray(position);
            app.quaternion.fromArray(quaternion);
            if(scale) app.scale.fromArray(scale);  
          } else {
            app.position?.fromArray(transform);
            app.quaternion?.fromArray(transform, 3);
            app.scale?.fromArray(transform, 7);
          }
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

       // this.bindTrackedApp(trackedApp, app);

        p.accept(app);
      } catch (err) {
        p.reject(err);
      } finally {
        cleanup();
      }
    });
    this.addEventListener('trackedappremove', async (e) => {
      const { instanceId, app } = e.data;

      this.unbindTrackedApp(instanceId);

      this.removeApp(app);
    });
    this.addEventListener('trackedappimport', async e => {
      // console.log("trackedappimport is", e)
      const {
        instanceId,
        app,
      } = e.data;

      const trackedApp = this.getTrackedApp(instanceId);

      const wear = trackedApp.get('wear')

      this.bindTrackedApp(trackedApp, app);
    
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

    const resize = (e) => {
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
    return this.apps.find((app) => app.instanceId === instanceId);
  }
  getAppByPhysicsId(physicsId) {
    for (const app of this.apps) {
      if (
        app.getPhysicsObjects &&
        app.getPhysicsObjects().some((o) => o.physicsId === physicsId)
      ) {
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
        // console.log('get or create tracked app 1', instanceId, this.appsArray.toJSON());
        return app;
      }
    }

    const appMap = new Z.Map();
    this.appsArray.push([appMap]);
    // console.log('get or create tracked app 2', instanceId, this.appsArray.toJSON());
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
      }
      this.dispatchEvent(new MessageEvent('clear'));
    } else {
      throw new Error('cannot clear world while it is bound');
    }
  }
  addTrackedAppInternal(instanceId, contentId, transform, components) {
    console.log('add tracked app internal', instanceId, contentId);
    
    const trackedApp = this.getOrCreateTrackedApp(instanceId);
    trackedApp.set('instanceId', instanceId);
    trackedApp.set('contentId', contentId);
    trackedApp.set('transform', transform);
    trackedApp.set('components', JSON.stringify(components));
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
      const transform = new Float32Array(11);

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

      self.addTrackedAppInternal(instanceId, contentId, transform, components);
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
      console.warn('invalid remove instance id', {
        removeInstanceId,
        appsJson,
      });
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

    this.dispatchEvent(
      new MessageEvent('appadd', {
        data: app,
      })
    );
  }
  removeApp(app) {
    const index = this.apps.indexOf(app);
    // console.log('remove app', app.instanceId, app.contentId, index, this.apps.map(a => a.instanceId), new Error().stack);
    if (index !== -1) {
      this.apps.splice(index, 1);

      this.dispatchEvent(
        new MessageEvent('appremove', {
          data: app,
        })
      );
      app.destroy();
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
      const { modules } = metaversefile.useDefaultModules();
      const m = modules['errorPlaceholder'];
      await app.addModule(m);
    })();
    return app;
  }
  /* setBlindStateMode(stateBlindMode) {
    this.stateBlindMode = stateBlindMode;
  } */
  transplantApp(app, dstAppManager) {
    const { instanceId } = app;
    const srcAppManager = this;

    // srcAppManager.setBlindStateMode(true);
    // dstAppManager.setBlindStateMode(true);

    if (srcAppManager.appsArray.doc === dstAppManager.appsArray.doc) {
      this.unbindTrackedApp(instanceId);

      let dstTrackedApp = null;
      srcAppManager.appsArray.doc.transact(() => {
        const srcTrackedApp = srcAppManager.getTrackedApp(instanceId);
        const contentId = srcTrackedApp.get('contentId');

        let transform = srcTrackedApp.get('transform');
        const components = srcTrackedApp.get('components');
        srcAppManager.removeTrackedAppInternal(instanceId);
        
        if(!transform){
          const position = srcTrackedApp.get('position');
          transform = new Float32Array(11);
          const quaternion = srcTrackedApp.get('quaternion');
          const scale = srcTrackedApp.get('scale');

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

        dstTrackedApp = dstAppManager.addTrackedAppInternal(
          instanceId,
          contentId,
          transform,
          components
        );
      });

      // dstAppManager.bindTrackedApp(dstTrackedApp, app);
    } else {
      throw new Error('cannot transplant apps between app manager with different state binding');
    }

    // srcAppManager.setBlindStateMode(false);
    // dstAppManager.setBlindStateMode(false);
  }
  importApp(app) {
    let dstTrackedApp = null;
    this.appsArray.doc.transact(() => {
      const contentId = app.contentId;
      const instanceId = app.instanceId;
      const transform = app.transform?.toArray();
      const components = app.components.slice();
      
      dstTrackedApp = this.addTrackedAppInternal(
        instanceId,
        contentId,
        transform,
        components,
      );

      this.addApp(app);
    });
    
    this.bindTrackedApp(dstTrackedApp, app);

    this.addApp(app);
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
            app.matrixWorld.decompose(
              localVector,
              localQuaternion,
              localVector2
            );

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
                  .decompose(
                    physicsObject.position,
                    physicsObject.quaternion,
                    physicsObject.scale
                  );
                physicsObject.matrixWorld.copy(physicsObject.matrix);
                for (const child of physicsObject.children) {
                  child.updateMatrixWorld();
                }

                physicsManager.setTransform(physicsObject);
                physicsManager.getBoundingBoxForPhysicsId(
                  physicsObject.physicsId,
                  physicsObject.physicsMesh.geometry.boundingBox
                );
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
      const position = trackedApp.get('position');
      const quaternion = trackedApp.get('quaternion');
      const scale = trackedApp.get('scale');
      const componentsString = trackedApp.get('components');
      const components = jsonParse(componentsString) ?? [];
      const object = {
        position,
        quaternion,
        scale,
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
export { AppManager };
