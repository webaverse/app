/*
app manager binds z.js data to live running metaversefile apps to keep them in snc
each "app owner" (world, local player, remote players) has an app manager
*/

import * as THREE from "three";
import * as Z from "zjs";

import {makePromise, getRandomString} from './util.js';
import physicsManager from './physics-manager.js';
import {getLocalPlayer} from './players.js';
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';
import {jsonParse} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const appManagers = [];
// Each app owner has an app manager, including players and the world(s)
// New AppManagers are constructed when LocalPlayer, RemotePlayer or World is constructed
class AppManager extends EventTarget {
  constructor(isLocalPlayer = false) {
    super();
    this.appsArray = null;
    this.apps = [];
    this.isLocalPlayer = isLocalPlayer;

    this.transform = new Float32Array(10);

    this.pendingAddPromises = new Map();
    this.unbindStateFn = null;
    this.trackedAppUnobserveMap = new Map();
    this.bindEvents();

    appManagers.push(this);
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
  getPeerOwnerAppManager(instanceId) {
    for (const appManager of appManagers) {
      if (
        appManager &&
        appManager.appsArray &&
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
  // Remove all the apps from remote players before calling unbindState
  unbindState() {
    // if (!this.unbindStateFn) return console.warn("unbindState called but not bound");
    if (this.unbindStateFn) this.unbindStateFn();
    this.appsArray = null;
    this.unbindStateFn = null;
  }
  // Sets up the listeners on the app for when it is added and deleted
  // Called in attachState in character controller on both remote and local player
  bindState(nextAppsArray) {
    if(this.isBound()) this.unbindState();
    const observeAppsFn = (e) => {
      const { added, deleted } = e.changes;

      // We are handling app transplanting with the deleted values to avoid potential race conditions
      for (const item of deleted.values()) {
        let appMap = item.content.type;
        const instanceId = appMap.get("instanceId");
        const app = this.getAppByInstanceId(instanceId);
        const peerOwnerAppManager = this.getPeerOwnerAppManager(instanceId);

        if (app && peerOwnerAppManager && peerOwnerAppManager !== this) {
          if (!peerOwnerAppManager.apps.includes(app)) {
            peerOwnerAppManager.apps.push(app);
          }
          if ((app.getComponent("wear") || app.getComponent("pet")) && peerOwnerAppManager.callBackFn) {
            peerOwnerAppManager.callBackFn(app, "wear", "add");
          }
        }
        const index = this.apps.indexOf(app);
        if (index !== -1) {
          this.apps.splice(index, 1);
        }
        if ((app.getComponent("wear") || app.getComponent("pet")) && this.callBackFn) {
          this.callBackFn(app, "wear", "remove");
        }
      }

      // Handle new apps added to the app manager
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

        const instanceId = appMap.get("instanceId");
        const app = this.apps.find((app) => app.instanceId === instanceId);
        if (!app) {
          const trackedApp = this.getOrCreateTrackedApp(instanceId);
          this.importTrackedApp(trackedApp);
        } else if(!this.isLocalPlayer) {
          const trackedApp = this.getOrCreateTrackedApp(instanceId);
          this.bindTrackedApp(trackedApp, app);
        }
      }
    };
    nextAppsArray.observe(observeAppsFn);
    this.unbindStateFn = nextAppsArray.unobserve.bind(nextAppsArray, observeAppsFn);
    this.appsArray = nextAppsArray;
  }
  // Called on the remote player on construction
  async loadApps() {
    for (let i = 0; i < this.appsArray.length; i++) {
      const trackedApp = this.appsArray.get(i, Z.Map);
      const app = await this.importTrackedApp(trackedApp);
      this.bindTrackedApp(trackedApp, app);
    }
  }
  // Bind the tracked app to start listening for events
  // Especially transform updates
  bindTrackedApp(trackedApp, app) {
    if(this.isLocalPlayer) return console.warn("Cannot bind tracked app, local player is app owner");
    if(this.trackedAppBound(trackedApp.instanceId)) this.unbindTrackedApp(trackedApp.instanceId);
    const observeTrackedAppFn = (e) => {
      if (e.changes.keys.has("transform")) {
        const transform = trackedApp.get("transform");
          app.position.fromArray(transform, 0);
          app.quaternion.fromArray(transform, 3);
          app.scale.fromArray(transform, 7);
          app.updateMatrixWorld();
      }
    };
    trackedApp.observe(observeTrackedAppFn);

    const instanceId = trackedApp.get("instanceId");
    this.trackedAppUnobserveMap.set(instanceId, trackedApp.unobserve.bind(trackedApp, observeTrackedAppFn));
  }
  trackedAppBound (instanceId) {
    return !!this.trackedAppUnobserveMap.get(instanceId)
  }
  unbindTrackedApp(instanceId) {
    const fn = this.trackedAppUnobserveMap.get(instanceId);
    if (!fn) return console.warn("tracked app was not bound:", instanceId);
    this.trackedAppUnobserveMap.delete(instanceId);
    fn();
  }
  bindEvents() {
    const resize = (e) => {
      this.resize(e);
    };
    window.addEventListener("resize", resize);
    this.cleanup = () => {
      window.removeEventListener("resize", resize);
    };
  }
  // Called when a new app is added to the app manager in observeAppsFn
  // Also called explicitly by loadApps on remote player at init
  async importTrackedApp(trackedApp) {
    const trackedAppBinding = trackedApp.toJSON();
    const {
      instanceId,
      contentId,
      position,
      quaternion,
      scale,
      transform,
      components,
    } = trackedAppBinding;

    const p = makePromise();
    p.instanceId = instanceId;
    this.pendingAddPromises.set(instanceId, p);

    let live = true;

    const clear = (e) => {
      live = false;
      cleanup();
    };
    const cleanup = () => {
      this.removeEventListener("clear", clear);

      this.pendingAddPromises.delete(instanceId);
    };
    this.addEventListener("clear", clear);
    const _bailout = (app) => {
      console.error("Bailout");
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
      p.reject(new Error("app cleared during load: " + contentId));
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
        if (position) {
          app.position.fromArray(position);
          app.quaternion.fromArray(quaternion);
          if (scale) app.scale.fromArray(scale);
        } else if (transform) {
          app.position?.fromArray(transform);
          app.quaternion?.fromArray(transform, 3);
          app.scale?.fromArray(transform, 7);
        }
        app.updateMatrixWorld();
        app.lastMatrix.copy(app.matrixWorld);

        // set components
        app.instanceId = instanceId;
        app.setComponent("physics", true);
        if (components)
          for (const { key, value } of components) {
            app.setComponent(key, value);
          }
      }

      // initialize app
      {
        const mesh = await app.addModule(m);
        if (!live) return _bailout(app);
        if (!mesh) {
          console.warn("failed to load object", { contentId });
        }

        this.addApp(app);
      }

      p.accept(app);
      return app;
    } catch (err) {
      p.reject(err);
    } finally {
      cleanup();
    }
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
      if (app.get("instanceId") === instanceId) {
        return app;
      }
    }

    const appMap = new Z.Map();
    this.appsArray.push([appMap]);
    return appMap;
  }
  getTrackedApp(instanceId) {
    for (const app of this.appsArray) {
      if (app.get("instanceId") === instanceId) {
        return app;
      }
    }
    return null;
  }
  hasTrackedApp(instanceId) {
    for (const app of this.appsArray) {
      if (app.get("instanceId") === instanceId) {
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
      this.dispatchEvent(new MessageEvent("clear"));
    } else {
      throw new Error("cannot clear world while it is bound");
    }
  }
  addTrackedAppInternal(instanceId, contentId, transform, components) {
    const trackedApp = this.getOrCreateTrackedApp(instanceId);
    trackedApp.set("instanceId", instanceId);
    trackedApp.set("contentId", contentId);
    trackedApp.set("transform", transform);
    trackedApp.set("components", components);
    return trackedApp;
  }
  addTrackedApp(
    contentId,
    position = new THREE.Vector3(),
    quaternion = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1),
    components = [],
    instanceId = getRandomString()
  ) {
    const self = this;
    this.appsArray.doc.transact(function tx() {
      const transform = new Float32Array(10);
      position.toArray(transform);
      quaternion.toArray(transform, 3);
      scale.toArray(transform, 7);

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
        throw new Error("no pending world add object promise");
      }
    }
  }
  getTrackedAppIndex(instanceId) {
    for (let i = 0; i < this.appsArray.length; i++) {
      const app = this.appsArray.get(i);
      if (app.get("instanceId") === instanceId) {
        return i;
      }
    }
    return -1;
  }
  removeTrackedAppInternal(instanceId) {
    const removeIndex = this.getTrackedAppIndex(instanceId);
    if (removeIndex !== -1) {
      this.appsArray.delete(removeIndex, 1);
    } else {
      console.warn("invalid remove instance id", instanceId);
    }
  }
  removeTrackedApp(removeInstanceId) {
    const self = this;
    this.appsArray.doc.transact(function tx() {
      self.removeTrackedAppInternal(removeInstanceId);
    });
  }
  addApp(app) {
    if (this.apps.includes(app)) return console.warn("Already has app", app)
    this.apps.push(app);

    this.dispatchEvent(new MessageEvent("appadd", {data: app}));
  }

  removeApp(app) {
    const index = this.apps.indexOf(app);
    if (index !== -1) {
      this.apps.splice(index, 1);

      this.dispatchEvent(
        new MessageEvent("appremove", {
          data: app,
        })
      );
    }
  }

  resize(e) {
    const apps = this.apps.slice();
    for (const app of apps) {
      app.resize && app.resize(e);
    }
  }

  // If the app fails to load, put this there instead
  getErrorPlaceholder() {
    const app = metaversefile.createApp({
      name: "error-placeholder",
    });
    app.contentId = "error-placeholder";
    (async () => {
      await metaverseModules.waitForLoad();
      const { modules } = metaversefile.useDefaultModules();
      const m = modules["errorPlaceholder"];
      await app.addModule(m);
    })();
    return app;
  }

  // Called when moving an app from one place to another
  // Especially in wear and unwear and when setting unwear on the character
  transplantApp(app, dstAppManager) {
    if(this === dstAppManager) return console.warn("Can't transplant app to itself");
    const { instanceId } = app;

    this.unbindTrackedApp(instanceId);

    let dstTrackedApp = null;
    const srcTrackedApp = this.getOrCreateTrackedApp(instanceId);

    const contentId = srcTrackedApp.get("contentId");
    let transform = srcTrackedApp.get("transform");
    const components = srcTrackedApp.get("components");

    if (!transform) transform = new Float32Array(10);

    app.position.toArray(transform);
    app.quaternion.toArray(transform, 3);
    app.scale.toArray(transform, 7);

    const self = this;
    this.appsArray.doc.transact(() => {
      self.removeTrackedAppInternal(instanceId);

      dstTrackedApp = dstAppManager.addTrackedAppInternal(
        instanceId,
        contentId,
        transform,
        components
      );
      dstAppManager.bindTrackedApp(dstTrackedApp, app);
    });
  }

  // Called in game.js when drop is handled
  // Also called when user drops a file onto the window by DragAndDrop.jsx
  importApp(app) {
    let dstTrackedApp = null;
    const contentId = app.contentId;
    const instanceId = app.instanceId;
    const components = app.components.slice();

    const transform = new Float32Array(10);
    app.position.toArray(transform);
    app.quaternion.toArray(transform, 3);
    app.scale.toArray(transform, 7);

    const self = this;
    this.appsArray.doc.transact(() => {
      dstTrackedApp = self.addTrackedAppInternal(instanceId, contentId, transform, components);
    });
  }
  hasApp(app) {
    return this.apps.includes(app);
  }

  // called by local player, remote players and world update()
  update(timeDiff) {
    if (!this.appsArray) return console.warn("Can't push app updates because appsArray is null")
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
                localVector2
              );
              const transform = self.transform;
              localVector.toArray(transform, 0);
              localVector.toArray(transform, 3);
              localVector.toArray(transform, 7);
              trackedApp.set('transform', transform)
            } else {
              console.warn("App is not a tracked app, not sending out transform")
            }
          };
          const localPlayer = getLocalPlayer();
          if(localPlayer.hasAction('sit') || app.getComponent('pet') || localPlayer.hasAction('grab')) {
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

          app.updateMatrix();
          app.lastMatrix.copy(app.matrix);
        }
      }
  }
  exportJSON() {
    const objects = [];
    for (const trackedApp of this.appsArray) {
      const transform = trackedApp.get("transform");
      const components = trackedApp.get("components") ?? [];
      const object = {
        transform,
        components,
      };

      let contentId = trackedApp.get("contentId");
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
    if (this.isBound()) {
      throw new Error('destroy of bound app manager');
    }
    const index = appManagers.indexOf(this);
    if (index !== -1) {
      this.clear();
      appManagers.splice(index, 1);
    } else {
      throw new Error("double destroy of app manager");
    }
  }
}
export { AppManager };