import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useWear, useUse, useCleanup, getNextInstanceId} = metaversefile;

const localMatrix = new THREE.Matrix4();

function getObjectUrl(object) {
  let {start_url, type, content} = object;
  
  let u;
  if (start_url) {
    // make path relative to the .scn file
    u = /^\\.\\//.test(start_url) ? (new URL(import.meta.url).pathname.replace(/(\\/)[^\\/]*$/, '$1') + start_url.replace(/^\\.\\//, '')) : start_url;
  } else if (type && content) {
    if (typeof content === 'object') {
      content = JSON.stringify(content);
    }
    u = '/@proxy/data:' + type + ',' + encodeURI(content);
  } else {
    throw new Error('invalid scene object: ' + JSON.stringify(object));
  }
  return u;
}

export default e => {
  const app = useApp();

  const srcUrl = ${this.srcUrl};
  
  const _updateSubAppMatrix = subApp => {
    // localMatrix.decompose(subApp.position, subApp.quaternion, subApp.scale);
    if (subApp === subApps[0]) { // group head
      subApp.updateMatrixWorld();
      app.position.copy(subApp.position);
      app.quaternion.copy(subApp.quaternion);
      app.scale.copy(subApp.scale);
      app.matrix.copy(subApp.matrix);
      app.matrixWorld.copy(subApp.matrixWorld);
    } else { // group tail
      localMatrix.copy(subApp.offsetMatrix);
      if (subApps[0]) {
        localMatrix.premultiply(subApps[0].matrixWorld);
      }
      localMatrix.decompose(subApp.position, subApp.quaternion, subApp.scale);
      // /light/.test(subApp.name) && console.log('update subapp', subApp.position.toArray().join(', '));
      subApp.updateMatrixWorld();
    }
  };
  
  let live = true;
  let subApps = [];
  e.waitUntil((async () => {
    const res = await fetch(srcUrl);
    const j = await res.json();
    const {objects} = j;
    subApps = Array(objects.length);
    for (let i = 0; i < subApps.length; i++) {
      subApps[i] = null;
    }
    // console.log('group objects 1', objects);
    const promises = objects.map(async (object, i) => {
      if (live) {
        let {position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], components = []} = object;
        position = new THREE.Vector3().fromArray(position);
        quaternion = new THREE.Quaternion().fromArray(quaternion);
        scale = new THREE.Vector3().fromArray(scale);

        let u2 = getObjectUrl(object);
        // console.log('add object', u2, {start_url, type, content});
        
        // console.log('group objects 2', u2);
        
        if (/^https?:/.test(u2)) {
          u2 = '/@proxy/' + u2;
        }
        const m = await metaversefile.import(u2);
        // console.log('group objects 3', u2, m);
        const subApp = metaversefile.createApp({
          name: u2,
        });
        subApp.instanceId = getNextInstanceId();
        if (i === 0) { // group head
          subApp.position.copy(app.position);
          subApp.quaternion.copy(app.quaternion);
          subApp.scale.copy(app.scale);
        } else { // group tail
          subApp.position.copy(position);
          subApp.quaternion.copy(quaternion);
          subApp.scale.copy(scale);
        }
        subApp.updateMatrixWorld();
        subApp.contentId = u2;
        subApp.offsetMatrix = subApp.matrix.clone();
        // console.log('group objects 3', subApp);
        subApp.setComponent('physics', true);
        for (const {key, value} of components) {
          subApp.setComponent(key, value);
        }
        subApps[i] = subApp;
        _updateSubAppMatrix(subApp);
        await subApp.addModule(m);
        // console.log('group objects 4', subApp);
        metaversefile.addApp(subApp);
      }
    });
    await Promise.all(promises);
  })());
  
  app.getPhysicsObjects = () => {
    const result = [];
    for (const subApp of subApps) {
      if (subApp) {
        result.push.apply(result, subApp.getPhysicsObjects());
      }
    }
    return result;
  };
  
  useFrame(() => {
    for (const subApp of subApps) {
      subApp && _updateSubAppMatrix(subApp);
    }
  });
  
  useActivate(() => {
    for (const subApp of subApps) {
      subApp && subApp.activate();
    }
  });
  
  useWear(() => {
    for (const subApp of subApps) {
      subApp && subApp.wear();
    }
  });
  
  useUse(() => {
    for (const subApp of subApps) {
      subApp && subApp.use();
    }
  });
  
  useCleanup(() => {
    live = false;
    for (const subApp of subApps) {
      if (subApp) {
        metaversefile.removeApp(subApp);
        subApp.destroy();
      }
    }
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'group';
export const components = ${this.components};