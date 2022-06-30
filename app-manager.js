/*
app manager binds z.js data to live running metaversefile apps to keep them in snc
each "app owner" (world, local player, remote players) has an app manager
*/

import * as THREE from 'three';
import * as Z from 'zjs';

import {makePromise, getRandomString, jsonParse} from './util.js';
import physicsManager from './physics-manager.js';
import {getLocalPlayer} from './players.js';
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const appManagers = [];
// Each app owner has an app manager, including players and the world(s)
// New AppManagers are constructed when LocalPlayer, RemotePlayer or World is constructed
class AppManager extends EventTarget {
  constructor(owner) {
    super();
    appManagers.push(this);

    this.appsArray = null;
    this.apps = [];
    this.owner = owner;
    this.trackedAppUnobserveMap = new Map();
    this.unbindStateFn = null;

    this.transform = new Float32Array(10);

    const _bindEvents = () => {
      const resize = e => {
        const apps = this.apps.slice();
        for (const app of apps) {
          app.resize && app.resize(e);
        }
      };
      window.addEventListener('resize', resize);
      this.cleanup = () => {
        window.removeEventListener('resize', resize);
      };
    };

    _bindEvents();
  }

  // Called on local player and world app managers
  tick(timestamp, timeDiff, frame) {
    const localData = {
      timestamp: 0,
      frame: null,
      timeDiff: 0,
    };
    const localFrameOpts = {
      data: localData,
    };
    const frameEvent = new MessageEvent('frame', localFrameOpts);
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timeDiff;
    this.dispatchEvent(frameEvent);
  }

  isBound() {
    return !!this.appsArray;
  }

  // Sets up the listeners on the app for when it is added and deleted
  // Called in attachState in character controller on both remote and local player
  bindState(nextAppsArray) {
    if (this.isBound()) throw new Error('AppManager is already bound');
    const observeAppsFn = (e, origin) => {
      if (origin === 'push') return; // ignore self
      const {added, deleted} = e.changes;
      console.log(e);

      for (const item of deleted.values()) {
        // if the user picks up the sword, then it will call this event on world's app manager
        // const instanceId = item.content.type.get('instanceId');
        // // get the app from the app manager
        // const app = this.getAppByInstanceId(instanceId);
        // // does it exist on this object
        // if ((app.getComponent('wear') || app.getComponent('pet')) && this.owner.unwear) {
        //   this.owner.unwear(app);
        // }
      }

      // Handle new apps added to the app manager
      for (const item of added.values()) {
        const appMap = item.content.type;
        const instanceId = appMap.get('instanceId');

        // const app = metaversefile.getPlayerByInstanceId(instanceId);

        // const trackedPeer = appManagers.find(am => am.hasTrackedApp(instanceId));
        // console.log("trackedPeer is", trackedPeer.owner)
        // if (trackedPeer === this) console.log('peer owner is this', trackedPeer.owner);
        // else console.log('peer owner is', trackedPeer.owner);

        // console.log('app is', app);
        // const localPlayer = getLocalPlayer();
        // if (localPlayer !== this.owner){
        // const trackedApp = this.getOrCreateTrackedApp(instanceId);
        //   console.log("trackedApp is", trackedApp)
        // }
        // // if we can't find the app, we want to know where it is
        // // if it doesn't exist, we should create it again

        // if (app && (app.getComponent('wear') || app.getComponent('pet')) && this.owner.unwear) {
        //   console.log('wear');
        //   this.owner.wear(app);
        // } 

        // if (!app) {
        //   console.log('peerOwner', this.owner, trackedApp);
        //   this.importTrackedApp(trackedApp);
        // } else {
        //   this.bindTrackedApp(trackedApp, app);
        // }
      }
    };
    nextAppsArray.observe(observeAppsFn);
    this.unbindStateFn = nextAppsArray.unobserve.bind(nextAppsArray, observeAppsFn);
    this.appsArray = nextAppsArray;
  }

  // Remove all the apps from remote players before calling unbindState
  unbindState() {
    if (!this.unbindStateFn) throw new Error('unbindState called but not bound');
    this.unbindStateFn();
    this.appsArray = null;
    this.unbindStateFn = null;
  }

  // Tracked app handlers
  // Tracked apps a have been bound to the zjs document and send and receive state updates

  // Bind an app to it's tracked representation to start listening for events
  bindTrackedApp(trackedApp, app) {
    if (this.trackedAppBound(trackedApp.instanceId)) throw new Error('Tracked app is already bound');
    const observeTrackedAppFn = (e, origin) => {
      if (origin === 'push') return; // ignore self
      if (e.changes.keys.has('transform')) {
        const transform = trackedApp.get('transform');
        app.position.fromArray(transform);
        app.quaternion.fromArray(transform, 3);
        app.scale.fromArray(transform, 7);
        app.updateMatrixWorld();
        console.log("set app position")
      } else {
        console.warn('tracked app key change', e);
      }
    };

    trackedApp.observe(observeTrackedAppFn);

    const instanceId = trackedApp.get('instanceId');
    this.trackedAppUnobserveMap.set(
      instanceId,
      trackedApp.unobserve.bind(trackedApp, observeTrackedAppFn),
    );
  }

  unbindTrackedApp(instanceId) {
    const fn = this.trackedAppUnobserveMap.get(instanceId);
    if (!fn) throw new Error('Tracked app was not bound:', instanceId);
    this.trackedAppUnobserveMap.delete(instanceId);
    fn();
  }

  trackedAppBound(instanceId) {
    return !!this.trackedAppUnobserveMap.get(instanceId);
  }

  async addTrackedApp(
    contentId,
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    components = [],
    instanceId = getRandomString(),
  ) {
    const transform = new Float32Array(10);
    position.toArray(transform, 0);
    quaternion.toArray(transform, 3);
    scale.toArray(transform, 7);
    const trackedApp = this.getOrCreateTrackedApp(instanceId);
    this.appsArray.doc.transact(() => {
      trackedApp.set('instanceId', instanceId);
      trackedApp.set('contentId', contentId);
      trackedApp.set('transform', transform);
      trackedApp.set('components', components);
  });
    return await this.importTrackedApp(trackedApp);
  }

  // Called when a new app is added to the app manager in observeAppsFn
  async importTrackedApp(trackedApp) {
    const trackedAppBinding = trackedApp.toJSON();
    const {instanceId, contentId, transform, components} = trackedAppBinding;
    const p = makePromise();
    p.instanceId = instanceId;

    let live = true;

    const clear = e => {
      live = false;
      cleanup();
    };

    const cleanup = () => {
      this.removeEventListener('clear', clear);
    };
    this.addEventListener('clear', clear);

    // If the app fails to load, we'll drop a placeholder instead
    const _bailout = app => {
      const errorPH = this.getErrorPlaceholder();
      if (app) {
        errorPH.position.fromArray(app.position);
        errorPH.quaternion.fromArray(app.quaternion);
        errorPH.scale.fromArray(app.scale);
      }
      this.addApp(errorPH);

      if (app) this.removeApp(app);

      p.reject(new Error('app cleared during load: ' + contentId));
    };

    // attempt to load app
    try {
      const m = await metaversefile.import(contentId);
      if (!live) return _bailout(null);

      const app = metaversefile.createApp();
      app.instanceId = instanceId;

      // set components
      app.setComponent('physics', true); // default physics component to true
      if (components) {
        for (const {key, value} of components) {
          app.setComponent(key, value);
        }
      }

      // initialize module
      const mesh = await app.addModule(m);
      if (!live) return _bailout(app);
      if (!mesh) console.error('Failed to load app', {contentId});

      this.addApp(app);

      // set transform from last app state
      app.position.fromArray(transform);
      app.quaternion.fromArray(transform, 3);
      app.scale.fromArray(transform, 7);
      app.updateMatrixWorld();
      console.log("set app position in import")

      p.accept(app);
      return app;
    } catch (err) {
      p.reject(err);
    } finally {
      cleanup();
    }
  }

  getOrCreateTrackedApp(instanceId) {
    for (let i = 0; this.appsArray.length > i; i++) {
      const app = this.appsArray.get(i, Z.Map);
      if (app.get('instanceId') === instanceId) {
        return app;
      }
    }
    const appMap = new Z.Map();
    const self = this;
    this.appsArray.doc.transact(() => {
      self.appsArray.push([appMap]);
    });
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

  getTrackedAppIndex(instanceId) {
    for (let i = 0; i < this.appsArray.length; i++) {
      const app = this.appsArray.get(i);
      if (app.get('instanceId') === instanceId) {
        return i;
      }
    }
    return -1;
  }

  // Called when app is killed or deleted
  removeTrackedApp(instanceId) {
    const removeIndex = this.getTrackedAppIndex(instanceId);
    if (removeIndex === -1) throw new Error('Cannot remove tracked app that does not exist');
    this.appsArray.delete(removeIndex, 1);
  }

  // Adds the app to internal array and calls the appadd event on all listeners
  // These handlers add the app to the scene, etc.
  addApp(app) {
    if (this.apps.includes(app)) throw new Error('Manager already has app', app);
    this.apps.push(app);
    this.dispatchEvent(new MessageEvent('appadd', {data: app}));
  }

  // Removes the app from internal array and calls the appremove event on all listeners
  // These handlers remove the app from the scene, etc.
  removeApp(app) {
    const index = this.apps.indexOf(app);
    if (index === -1) throw new Error('Try to remove app that is not in manager');
    this.apps.splice(index, 1);

    this.dispatchEvent(
      new MessageEvent('appremove', {
        data: app,
      }),
    );
  }

  // Called when moving an app from one place to another
  // Especially in wear and unwear and when setting unwear on the character
  transplantApp(app, dstAppManager) {
    if (this === dstAppManager) return console.warn("Can't transplant app to itself");
    const {instanceId} = app;

    if (this.trackedAppBound(instanceId)) {
      this.unbindTrackedApp(instanceId);
    }

    const srcTrackedApp = this.getTrackedApp(instanceId);

    const contentId = srcTrackedApp.get('contentId');
    const transform = srcTrackedApp.get('transform');
    const components = srcTrackedApp.get('components');

    const self = this;
    const trackedApp = dstAppManager.getOrCreateTrackedApp(instanceId);
    this.appsArray.doc.transact(() => {
      self.removeTrackedApp(instanceId);

      trackedApp.set('instanceId', instanceId);
      trackedApp.set('contentId', contentId);
      trackedApp.set('transform', transform);
      trackedApp.set('components', components);
    });
    dstAppManager.bindTrackedApp(trackedApp, app);
  }

  // Called in game.js when loot drop occurs
  // Also called when user drops a file onto the window by DragAndDrop.jsx
  importApp(app) {
    const contentId = app.contentId;
    const instanceId = app.instanceId;
    const components = app.components.slice();

    const transform = new Float32Array(10);
    app.position.toArray(transform);
    app.quaternion.toArray(transform, 3);
    app.scale.toArray(transform, 7);
    console.log("set app position in importapp")


    const self = this;
    this.appsArray.doc.transact(() => {
      const trackedApp = self.getOrCreateTrackedApp(instanceId);
      trackedApp.set('instanceId', instanceId);
      trackedApp.set('contentId', contentId);
      trackedApp.set('transform', transform);
      trackedApp.set('components', components);
    });
  }

  hasApp(app) {
    return this.apps.includes(app);
  }

  getApps() {
    return this.apps;
  }

  getAppByInstanceId(instanceId) {
    return this.apps.find(app => app.instanceId === instanceId);
  }

  getAppByPhysicsId(physicsId) {
    for (const app of this.apps) {
      if (
        app.getPhysicsObjects &&
        app.getPhysicsObjects().some(o => o.physicsId === physicsId)
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

  // called by local player, remote players and world update()
  update(timeDiff) {
    if (!this.appsArray) return console.warn("Can't push app updates because appsArray is null");
    const self = this;
    for (const app of self.apps) {
      const trackedApp = self.getTrackedApp(app.instanceId);
      if (!app.matrix.equals(app.lastMatrix)) {
        const _updateTrackedApp = () => {
          if (trackedApp) {
            app.updateMatrixWorld();
            app.matrixWorld.decompose(
              localVector,
              localQuaternion,
              localVector2,
            );
            const transform = self.transform;
            localVector.toArray(transform, 0);
            localVector.toArray(transform, 3);
            localVector.toArray(transform, 7);
            this.appsArray.doc.transact(() => {
              trackedApp.set('transform', transform);
            });
          }
        };
        const localPlayer = getLocalPlayer();
        if (localPlayer.hasAction('sit') || app.getComponent('pet') || localPlayer.hasAction('grab')) {
          _updateTrackedApp();
        }

        // update attached physics objects with a relative transform
        const _updatePhysicsObjects = () => {
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
                    physicsObject.scale,
                  );
                physicsObject.matrixWorld.copy(physicsObject.matrix);
                for (const child of physicsObject.children) {
                  child.updateMatrixWorld();
                }

                physicsManager.setTransform(physicsObject);
                physicsManager.getBoundingBoxForPhysicsId(
                  physicsObject.physicsId,
                  physicsObject.physicsMesh.geometry.boundingBox,
                );
              }
            }
          }
        };
        _updatePhysicsObjects();

        app.updateMatrix();
        app.lastMatrix.copy(app.matrix);
      }
    }
  }

  // If the app fails to load, put this there instead
  getErrorPlaceholder() {
    const app = metaversefile.createApp({
      name: 'error-placeholder',
    });
    app.contentId = 'error-placeholder';
    (async () => {
      await metaverseModules.waitForLoad();
      const {modules} = metaversefile.useDefaultModules();
      const m = modules.errorPlaceholder;
      await app.addModule(m);
    })();
    return app;
  }

  // Serialize the entire app manager to a JSON string
  exportJSON() {
    const objects = [];
    for (const trackedApp of this.appsArray) {
      const transform = trackedApp.get('transform');
      const components = trackedApp.get('components') ?? [];
      const object = {
        transform,
        components,
      };

      const contentId = trackedApp.get('contentId');
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

  // Remove all apps from the manager -- can't do this if bound
  clear() {
    if (this.isBound()) throw new Error('cannot clear world while it is bound');
    const apps = this.apps.slice();
    for (const app of apps) {
      this.removeApp(app);
    }
    this.dispatchEvent(new MessageEvent('clear'));
  }

  // Called when the character controller or world is destroyed
  destroy() {
    if (this.isBound()) throw new Error('Cannot destroy bound app manager');

    const index = appManagers.indexOf(this);
    if (index > -1) throw new Error('App manager has already been removed');

    this.clear();
    appManagers.splice(index, 1);
  }
}
export {AppManager};
