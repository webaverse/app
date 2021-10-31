/*
app manager binds y.js data to live running metaversefile apps.
you can have as many app managers as you want.
*/

import * as THREE from 'three';
import * as Y from 'yjs';

import {scene, sceneHighPriority, sceneLowPriority} from './renderer.js';
import {makePromise, getRandomString} from './util.js';
import metaversefile from './metaversefile-api.js';

const appsMapName = 'apps';

const localData = {
  timestamp: 0,
  frame: null,
  timeDiff: 0,
};
const localFrameOpts = {
  data: localData,
};

class AppManager extends EventTarget {
  constructor({state = new Y.Doc(), apps = []} = {}) {
    super();
    
    this.state = state;
    this.apps = apps;
    
    this.bindState(this.state);
    this.bindEvents();
    
    this.pendingAddPromise = null;
    this.pushingLocalUpdates = false;
    this.lastTimestamp = performance.now();
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
  bindState(state) {
    const apps = state.getArray(appsMapName);
    let lastApps = [];
    apps.observe(() => {
      const nextApps = apps.toJSON();

      // console.log('next apps', nextApps, lastApps);

      for (const instanceId of nextApps) {
        if (!lastApps.includes(instanceId)) {
          // console.log('detected new app', instanceId);
          const trackedApp = this.getOrCreateTrackedApp(instanceId);
          this.dispatchEvent(new MessageEvent('trackedappadd', {
            data: {
              trackedApp,
            },
          }));
        }
      }
      for (const instanceId of lastApps) {
        if (!nextApps.includes(instanceId)) {
          // console.log('detected app removal', instanceId);
          const trackedApp = state.getMap(appsMapName + '.' + instanceId);
          const app = this.getAppByInstanceId(instanceId);
          this.dispatchEvent(new MessageEvent('trackedappremove', {
            data: {
              instanceId,
              trackedApp,
              app,
            },
          }));
        }
      }

      lastApps = nextApps;
    });

    const resize = e => {
      appManager.resize(e);
    };
    window.addEventListener('resize', resize);
    this.cleanup = () => {
      window.removeEventListener('resize', resize);
    };
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

        const _bindRender = () => {
          // unFrustumCull(app);

          if (app.renderOrder === -Infinity) {
            sceneHighPriority.add(app);
          }
        };
        _bindRender();

        const _bindTransforms = () => {
          const _observe = e => {
            if (!this.pushingLocalUpdates) {
              // console.log('got', trackedApp.toJSON(), trackedAppJson, trackedApp.get('position'));
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
          };
          trackedApp.observe(_observe);
          trackedApp.unobserve = trackedApp.unobserve.bind(trackedApp, _observe);
        };
        _bindTransforms();

        /* const _bindDestroy = () => {
          app.addEventListener('destroy', () => {
            this.apps.splice(this.apps.indexOf(app), 1);
          });
        };
        _bindDestroy(); */

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
      
      trackedApp.unobserve();
      
      this.removeApp(app);
      app.destroy();

      this.dispatchEvent(new MessageEvent('appremove', {
        data: app,
      }));
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
    const apps = state.getArray(appsMapName);

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

    return state.getMap(appsMapName + '.' + instanceId);
  }  
  clear() {
    const apps = this.apps.slice();
    for (const app of apps) {
      this.removeApp(app);
      app.destroy();
    }
    this.dispatchEvent(new MessageEvent('clear'));
  }
  addTrackedApp(contentId, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1), components = []) {
    const self = this;
    const {state} = this;
    const instanceId = getRandomString();
    state.transact(function tx() {
      const trackedApp = self.getOrCreateTrackedApp(instanceId);
      trackedApp.set('instanceId', instanceId);
      trackedApp.set('contentId', contentId);
      trackedApp.set('position', position.toArray());
      trackedApp.set('quaternion', quaternion.toArray());
      trackedApp.set('scale', scale.toArray());
      trackedApp.set('components', JSON.stringify(components));
      const originalJson = trackedApp.toJSON();
      trackedApp.set('originalJson', JSON.stringify(originalJson));
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
  removeTrackedApp(removeInstanceId) {
    const {state} = this;
    state.transact(() => {
      const apps = state.getArray(appsMapName);
      const appsJson = apps.toJSON();
      const removeIndex = appsJson.indexOf(removeInstanceId);
      if (removeIndex !== -1) {
        const allRemoveIndices = [removeIndex];
        for (const removeIndex of allRemoveIndices) {
          const instanceId = appsJson[removeIndex];

          apps.delete(removeIndex, 1);

          const trackedApp = state.getMap(appsMapName + '.' + instanceId);
          const keys = Array.from(trackedApp.keys());
          for (const key of keys) {
            trackedApp.delete(key);
          }
        }
      } else {
        console.warn('invalid remove instance id', {removeInstanceId, appsJson});
      }
    });
  }
  setTrackedAppTransform(instanceId, p, q, s) {
    const {state} = this;
    state.transact(function tx() {
      const trackedApp = state.getMap(appsMapName + '.' + instanceId);
      trackedApp.set('position', p.toArray());
      trackedApp.set('quaternion', q.toArray());
      trackedApp.set('scale', s.toArray());
    });
  }
  addApp(app) {
    this.apps.push(app);
    
    const renderPriority = app.getComponent('renderPriority');
    switch (renderPriority) {
      case 'high': {
        sceneHighPriority.add(app);
        break;
      }
      case 'low': {
        sceneLowPriority.add(app);
        /* console.log('got render priority', renderPriority, sceneLowPriority, app, app.parent);
        Object.defineProperty(app, 'parent', {
          get() {
            return sceneLowPriority;
          },
          set(v) {
            debugger;
          },
        }); */
        break;
      }
      default: {
        scene.add(app);
        break;
      }
    }
  }
  removeApp(app) {
    const index = this.apps.indexOf(app);
    // console.log('remove app', app.instanceId, app.contentId, index, this.apps.map(a => a.instanceId), new Error().stack);
    if (index !== -1) {
      this.apps.splice(index, 1);
    }
    app.parent && app.parent.remove(app);
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
  destroy() {
    this.cleanup();
  }
}
export {
  AppManager,
};