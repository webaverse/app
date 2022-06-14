/*
app manager binds z.js data to live running metaversefile apps.
you can have as many app managers as you want.
*/

import * as THREE from "three";
import * as Z from "zjs";

import { makePromise, getRandomString } from "./util.js";
import physicsManager from "./physics-manager.js";
import {getLocalPlayer} from './players.js';
import metaversefile from "metaversefile";
import * as metaverseModules from "./metaverse-modules.js";
import { jsonParse } from "./util.js";
import logger from "./logger.js";

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

const appManagers = [];
// Each app owner has an app manager, including players and the world(s)
// New AppManagers are constructed when LocalPlayer, RemotePlayer or World is constructed
class AppManager extends EventTarget {
  constructor() {
    super();
    this.appsArray = null;
    this.apps = [];

    this.pendingAddPromises = new Map();
    this.unbindStateFn = null;
    this.trackedAppUnobserveMap = new Map();
    this.bindEvents();

    appManagers.push(this);
    logger.log('New app manager', new Error().stack);
  }
  // Called on local player and world app managers
  tick(timestamp, timeDiff, frame) {
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
    logger.log('appManager.unbindState');
    if (!this.unbindStateFn) return console.warn("unbindState called but not bound");
    this.unbindStateFn();
    this.appsArray = null;
    this.unbindStateFn = null;
  }
  // On local player we move between worlds and don't want to unbind unless destroyed, i.e. if NPC
  unbindStateLocal() {
    logger.log('appManager.unbindStateLocal');
    if (this.unbindStateFn) {
      this.unbindState();
    }
  }
  // On remote players we remove the app
  unbindStateRemote() {
    logger.log('appManager.unbindStateRemote');
    if (!this.unbindStateFn) return logger.warn("unbindStateRemote called but not bound");
      // const appSpecs = this.appsArray.toJSON();
      // for (const appSpec of appSpecs) {
      //   const app = this.getAppByInstanceId(appSpec.instanceId);
      //   if (app) {
      //     this.removeApp(app);
      //   } else {
      //     logger.warn("App was already destroyed.")
      //   }
      // }

      this.unbindState();
  }
  // Sets up the listeners on the app for when it is added and deleted
  // Called in attachState in character controller on both remote and local player
  bindState(nextAppsArray) {
    logger.log('appManager.bindState', nextAppsArray)
    const observeAppsFn = (e) => {
      const { added, deleted } = e.changes;
      
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

        if (!this.apps.find((app) => app.instanceId === instanceId)) {
          const trackedApp = this.getOrCreateTrackedApp(instanceId);
          this.importTrackedApp(trackedApp);
        }
      }

      // Handle apps removed
      for (const item of deleted.values()) {
        let appMap = item.content.type;
        const instanceId = appMap.get("instanceId");
        const app = this.getAppByInstanceId(instanceId);
        const peerOwnerAppManager = this.getPeerOwnerAppManager(instanceId);

        if(peerOwnerAppManager !== this){
              if (!peerOwnerAppManager.apps.includes(app)) {
                peerOwnerAppManager.apps.push(app);
              }
              if (app.getComponent("wear") && peerOwnerAppManager.callBackFn) {
                peerOwnerAppManager.callBackFn(app, "wear", "add");
              }
          }
            const index = this.apps.indexOf(app);
            if (index !== -1) {
              this.apps.splice(index, 1);
            }
            if (app.getComponent("wear") && this.callBackFn) {
              this.callBackFn(app, "wear", "remove");
            }
      }
    };
    nextAppsArray.observe(observeAppsFn);
    this.unbindStateFn = nextAppsArray.unobserve.bind(nextAppsArray, observeAppsFn);
    this.appsArray = nextAppsArray;
  }
  // Called by the localPlayer.attachState
  bindStateLocal(nextAppsArray) {
    logger.log('appManager.bindStateLocal', nextAppsArray)
    this.unbindStateLocal();
    this.bindState(nextAppsArray);
  }
    // Called by the remote4Player.attachState
  bindStateRemote(nextAppsArray) {
    logger.log('appManager.bindStateRemote', nextAppsArray)
    this.unbindStateRemote();
    this.bindState(nextAppsArray);
  }
  // Called on the remote player on construction
  loadApps() {
    logger.log('appManager.loadApps')
    for (let i = 0; i < this.appsArray.length; i++) {
      const trackedApp = this.appsArray.get(i, Z.Map);
      this.importTrackedApp(trackedApp);
    }
  }
  // Called by importApp
  bindTrackedApp(trackedApp, app) {
    logger.log('appManager.bindTrackedApp', trackedApp, app)
    const observeTrackedAppFn = (e) => {
      if (e.changes.keys.has("transform")) {
        const transform = trackedApp.get("transform");
        if (transform) {
          app.position.fromArray(transform, 0);
          app.quaternion?.fromArray(transform, 3);
          app.scale?.fromArray(transform, 7);
          app.transform = transform;
        } else {
          console.error("transform isn't set wtf", trackedApp.toJSON());
        }
      } else {
        logger.warn("Unhandled trackedApp change", e.changes.keys);
      }
    };
    trackedApp.observe(observeTrackedAppFn);

    const instanceId = trackedApp.get("instanceId");
    this.trackedAppUnobserveMap.set(
      instanceId,
      trackedApp.unobserve.bind(trackedApp, observeTrackedAppFn)
    );
  }
  unbindTrackedApp(instanceId) {
    logger.log('appManager.unbindTrackedApp', instanceId)
    const fn = this.trackedAppUnobserveMap.get(instanceId);
    if (fn) {
      this.trackedAppUnobserveMap.delete(instanceId);
      fn();
    } else {
      console.warn("tracked app was not bound:", instanceId);
    }
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
    logger.log('appManager.importTrackedApp', trackedApp)
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
        if(components)
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
    logger.log('appManager.addTrackedAppInternal', instanceId);
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
    logger.log('appManager.addTrackedApp', instanceId);

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
  removeTrackedApp(instanceId) {
    logger.log('appManager.removeTrackedApp', instanceId);

    const removeIndex = this.getTrackedAppIndex(instanceId);
    if (removeIndex !== -1) {
      this.appsArray.delete(removeIndex, 1);
    } else {
      console.warn("invalid remove instance id", {instanceId});
    }
  }
  addApp(app) {
    logger.log('appManager.addApp', app);

    if(this.apps.includes(app)) return console.warn("Already has app", app)
    this.apps.push(app);

    this.dispatchEvent(
      new MessageEvent("appadd", {
        data: app,
      })
    );
    // if (app.getComponent("wear") && this.callBackFn) {
    //   this.callBackFn(app, "wear", "add");
    // }

    const trackedApp = this.getTrackedApp(app.instanceId);
    const _observe = (e) => {
      console.log("e", e)
      const transform = trackedApp.get("transform");
      if (e.changes.keys.has("transform") && transform && !this.isAppGrabbed(app.instanceId)) {
        app.position.fromArray(transform, 0);
        app.quaternion?.fromArray(transform, 3);
        app.scale?.fromArray(transform, 7);
        app.transform = transform;
        app.updateMatrixWorld();
      }
    };
    trackedApp.observe(_observe);
  }

  removeApp(app) {
    logger.log('appManager.removeApp', app, new Error().stack);

    const index = this.apps.indexOf(app);
    // if (app.getComponent("wear") && this.callBackFn) {
    //   this.callBackFn(app, "wear", "remove");
    // }
    if (index !== -1) {
      this.apps.splice(index, 1);

      this.dispatchEvent(
        new MessageEvent("appremove", {
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
    logger.log('appManager.transplantApp', app, dstAppManager);

    const { instanceId } = app;
    const srcAppManager = this;

    if (srcAppManager.appsArray.doc === dstAppManager.appsArray.doc) {
      if (this.isBound()) {
        console.warn(
          "Calling unbind tracked app, but the app is already unbound:",
          instanceId
        );
        this.unbindTrackedApp(instanceId);
      }

      let dstTrackedApp = null;
      srcAppManager.appsArray.doc.transact(() => {
        const srcTrackedApp = srcAppManager.getOrCreateTrackedApp(instanceId);
        const contentId = srcTrackedApp.get("contentId");

        let transform = srcTrackedApp.get("transform");
        const components = srcTrackedApp.get("components");
        srcAppManager.removeTrackedApp(instanceId);

        console.log("removing src tracked app", instanceId);

        if (!transform) {
          transform = new Float32Array(11);

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

          pack3(app.position, 0);
          pack4(app.quaternion, 3);
          pack3(app.scale, 7);
        }

        dstTrackedApp = dstAppManager.addTrackedAppInternal(
          instanceId,
          contentId,
          transform,
          components
        );
        console.log("dstTrackedApp add tracked app", dstTrackedApp);

        dstAppManager.bindTrackedApp(dstTrackedApp, app);
      });

    } else {
      throw new Error(
        "cannot transplant apps between app manager with different state binding"
      );
    }
  }
  // Called in game.js when drop is handled
  // Also called when user drops a file onto the window by DragAndDrop.jsx
  importApp(app) {
    logger.log('appManager.importApp', app);

    let dstTrackedApp = null;
    const contentId = app.contentId;
    const instanceId = app.instanceId;
    const components = app.components.slice();

    let transform
    if (app.transform) {
      transform = app.transform.toArray()
    } else {
      transform = new Float32Array(11);

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

      pack3(app.position, 0);
      pack4(app.quaternion, 3);
      pack3(app.scale, 7);
    }
    const self = this;
    this.appsArray.doc.transact(() => {
      dstTrackedApp = self.addTrackedAppInternal(
        instanceId,
        contentId,
        transform,
        components
      );
      self.bindTrackedApp(dstTrackedApp, app);
    });
  }
  hasApp(app) {
    return this.apps.includes(app);
  }
  packed = new Float32Array(11);

  isAppGrabbed(instanceId) {
    const localPlayer = getLocalPlayer();
    const grabAction = localPlayer.findAction(action => action.type === 'grab');
    return grabAction ? grabAction.instanceId == instanceId : false
  }

  // called by local player, remote players and world update()
  update() {
    if (!this.appsArray) return console.warn("Can't push app updates because appsArray is null")
    const self = this;
    this.appsArray.doc.transact(() => {
      for (const app of self.apps) {
        const trackedApp = self.getTrackedApp(app.instanceId);
        if (!app.matrix.equals(app.lastMatrix)) {
          const _updateTrackedApp = () => {
            if (trackedApp) {
              app.matrixWorld.decompose(
                localVector,
                localQuaternion,
                localVector2
              );
  
              app.updateMatrixWorld();
              const packed = self.packed;
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
              trackedApp.set("transform", packed);
            }
          };

          if (this.isAppGrabbed(app.instanceId)) {
            _updateTrackedApp();
          }
  
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
    }, "push");
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