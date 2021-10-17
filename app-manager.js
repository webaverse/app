/*
app manager binds y.js data to live running metaversefile app objects.
you can have as many app managers as you want.
*/

import * as THREE from 'three';
import * as Y from 'yjs';

import {camera, scene, sceneHighPriority} from './app-object.js';
import {makePromise, getRandomString} from './util.js';
import metaversefile from './metaversefile-api.js';

const localData = {
  timestamp: 0,
  frame: null,
  timeDiff: 0,
};
const localFrameOpts = {
  data: localData,
};

class AppManager extends EventTarget {
  constructor({state = new Y.Doc(), objects = []} = {}) {
    super();
    
    this.state = state;
    this.objects = objects;
    this.bindState(this.state);
    this.bindEvents();
    
    this.pendingAddPromise = null;
    this.pushingLocalUpdates = false;
  }
  pretick(timestamp, frame) {
    localData.timestamp = timestamp;
    localData.frame = frame;
    localData.timeDiff = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.dispatchEvent(new MessageEvent('preframe', localFrameOpts));
  }
  tick(timestamp, frame) {
    this.dispatchEvent(new MessageEvent('startframe', localFrameOpts));
    this.dispatchEvent(new MessageEvent('frame', localFrameOpts));
  }
  setPushingLocalUpdates(pushingLocalUpdates) {
    this.pushingLocalUpdates = pushingLocalUpdates;
  }
  bindState(state) {
    const objects = state.getArray('objects');
    let lastObjects = [];
    objects.observe(() => {
      const nextObjects = objects.toJSON();

      for (const name of nextObjects) {
        if (!lastObjects.includes(name)) {
          const trackedObject = this.getOrCreateTrackedObject(name);
          this.dispatchEvent(new MessageEvent('trackedobjectadd', {
            data: {
              trackedObject,
            },
          }));
        }
      }
      for (const name of lastObjects) {
        if (!nextObjects.includes(name)) {
          const trackedObject = state.getMap('objects.' + name);
          this.dispatchEvent(new MessageEvent('trackedobjectremove', {
            data: {
              instanceId: name,
              trackedObject,
            },
          }));
        }
      }

      lastObjects = nextObjects;
    });
  }
  bindEvents() {
    this.addEventListener('trackedobjectadd', async e => {
      const {trackedObject} = e.data;
      const trackedObjectJson = trackedObject.toJSON();
      const {instanceId, contentId, position, quaternion, scale, components: componentsString} = trackedObjectJson;
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
        if (app) {
          metaversefile.removeApp(app);
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
          // components,
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
        metaversefile.addApp(app);
        const mesh = await app.addModule(m);
        if (!live) return _bailout(app);
        if (!mesh) {
          console.warn('failed to load object', {contentId});
        }

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
              console.log('got', trackedObject.toJSON(), trackedObjectJson, trackedObject.get('position'));
              if (e.keysChanged.has('position')) {
                app.position.fromArray(trackedObject.get('position'));
              }
              if (e.keysChanged.has('quaternion')) {
                app.quaternion.fromArray(trackedObject.get('quaternion'));
              }
              if (e.keysChanged.has('scale')) {
                app.scale.fromArray(trackedObject.get('scale'));
              }
            }
          };
          trackedObject.observe(_observe);
          trackedObject.unobserve = trackedObject.unobserve.bind(trackedObject, _observe);
        };
        _bindTransforms();

        const _bindDestroy = () => {
          app.addEventListener('destroy', () => {
            this.objects.splice(this.objects.indexOf(app), 1);
          });
        };
        _bindDestroy();
        
        this.objects.push(app);

        this.dispatchEvent(new MessageEvent('objectadd', {
          data: app,
        }));

        p.accept(app);
      } catch (err) {
        p.reject(err);
      } finally {
        cleanup();
      }
    });
    this.addEventListener('trackedobjectremove', async e => {
      const {instanceId, trackedObject} = e.data;
      const index = this.objects.findIndex(object => object.instanceId === instanceId);
      if (index !== -1) {
        const object = this.objects[index];
        object.destroy && object.destroy();
        metaversefile.removeApp(object);
        trackedObject.unobserve();

        this.dispatchEvent(new MessageEvent('objectremove', {
          data: object,
        }));
      } else {
        console.warn('remove for non-tracked object', instanceId);
      }
    });
  }
  getObjects() {
    return this.objects;
  }
  getTrackedObject(name) {
    const {state} = this;
    const objects = state.getArray('objects');
    return state.getMap('objects.' + name);
  }
  getOrCreateTrackedObject(name) {
    const {state} = this;
    const objects = state.getArray('objects');

    let hadObject = false;
    for (const object of objects) {
      if (object === name) {
        hadObject = true;
        break;
      }
    }
    if (!hadObject) {
      objects.push([name]);
    }

    return state.getMap('objects.' + name);
  }  
  clear() {
    const objects = this.objects.slice();
    for (const object of objects) {
      this.removeObject(object.instanceId);
    }
    this.dispatchEvent(new MessageEvent('clear'));
  }
  setTrackedObjectTransform(name, p, q, s) {
    const {state} = this;
    state.transact(function tx() {
      const objects = state.getArray('objects');
      const trackedObject = state.getMap('objects.' + name);
      trackedObject.set('position', p.toArray());
      trackedObject.set('quaternion', q.toArray());
      trackedObject.set('scale', s.toArray());
    });
  }
  addObject(contentId, position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1), components = []) {
    const self = this;
    const {state} = this;
    const instanceId = getRandomString();
    state.transact(function tx() {
      const trackedObject = self.getOrCreateTrackedObject(instanceId);
      trackedObject.set('instanceId', instanceId);
      trackedObject.set('contentId', contentId);
      trackedObject.set('position', position.toArray());
      trackedObject.set('quaternion', quaternion.toArray());
      trackedObject.set('scale', scale.toArray());
      trackedObject.set('components', JSON.stringify(components));
      const originalJson = trackedObject.toJSON();
      trackedObject.set('originalJson', JSON.stringify(originalJson));
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
  removeObject(removeInstanceId) {
    const {state} = this;
    state.transact(() => {
      const objects = state.getArray('objects');
      const objectsJson = objects.toJSON();
      const removeIndex = objectsJson.indexOf(removeInstanceId);
      if (removeIndex !== -1) {
        const allRemoveIndices = [removeIndex];
        for (const removeIndex of allRemoveIndices) {
          const instanceId = objectsJson[removeIndex];

          objects.delete(removeIndex, 1);

          const trackedObject = state.getMap('objects.' + instanceId);
          const keys = Array.from(trackedObject.keys());
          for (const key of keys) {
            trackedObject.delete(key);
          }
        }
      } else {
        console.warn('invalid remove instance id', {removeInstanceId, objectsJson});
      }
    });
  }
  resize(e) {
    const objects = this.objects.slice();
    for (const o of objects) {
      o.resize && o.resize(e);
    }
  }
  getObjectFromPhysicsId(physicsId) {
    for (const object of objects) {
      if (object.getPhysicsObjects && object.getPhysicsObjects().some(o => o.physicsId === physicsId)) {
        return object;
      }
    }
    return null;
  }
}
export {
  AppManager,
};