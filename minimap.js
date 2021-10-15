throw new Error('dead code');
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {rigManager} from './rig.js';
import {camera} from './app-object.js';
import {world} from './world.js';
import {arrowGeometry, arrowMaterial} from './shaders.js';

const localVector = new THREE.Vector3();
const localEuler = new THREE.Euler();

let mapRenderer;
const mapScene = new THREE.Scene();
const mapCamera = new THREE.PerspectiveCamera(60, 200 / 140, 0.1, 1000);
const mapCameraOffset = new THREE.Vector3(0, 4, 10);
const mapIndicator = (() => {
  const geometry = arrowGeometry;
  const material =  new THREE.MeshBasicMaterial({
    color: 0xef5350,
    side: THREE.DoubleSide,
  });
  const mapIndicator = new THREE.Mesh(geometry, material);
  mapIndicator.frustumCulled = false;
  mapScene.add(mapIndicator);
  return mapIndicator;
})();
const init = mapCanvas => {
  mapRenderer = new THREE.WebGLRenderer({
    canvas: mapCanvas,
    antialias: true,
    alpha: true,
  });
  mapRenderer.setPixelRatio(window.devicePixelRatio);

  mapCamera.position.copy(mapCameraOffset);
  mapCamera.rotation.order = 'YXZ';
  mapCamera.lookAt(new THREE.Vector3(0, 0, 0));

  const planeMesh = (() => {
    const s = 0.1;
    const geometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.BoxBufferGeometry(10, s, s).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -1000/2)),
      new THREE.BoxBufferGeometry(10, s, s).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 1000/2)),
      new THREE.BoxBufferGeometry(s, s, 1000).applyMatrix4(new THREE.Matrix4().makeTranslation(10/2, 0, 0)),
      new THREE.BoxBufferGeometry(s, s, 1000).applyMatrix4(new THREE.Matrix4().makeTranslation(-10/2, 0, 0)),
    ]);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    return mesh;
  })();
  mapScene.add(planeMesh);
  
  world.addEventListener('objectsadd', e => {
    const mesh = e.data;
    const minimapObject = minimap.addObject(mesh);
    mesh.minimapObject = minimapObject;
  });
  world.addEventListener('objectsremove', e => {
    const mesh = e.data;
    minimap.removeObject(mesh.minimapObject);
  });
};

const objectGeometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
const objectMaterial = new THREE.MeshBasicMaterial({
  color: 0x5c6bc0,
});

const objects = [];
const _makeObject = baseMesh => {
  const mesh = new THREE.Mesh(objectGeometry, objectMaterial);
  mesh.frustumCulled = false;
  mesh.update = () => {
    mesh.position.copy(baseMesh.position);
    mesh.quaternion.copy(baseMesh.quaternion);
    mesh.scale.copy(baseMesh.scale);
  };
  return mesh;
};
const _makeWorld = extents => {
  const box = new THREE.Box3().set(
    new THREE.Vector3().fromArray(extents, 0),
    new THREE.Vector3().fromArray(extents, 3),
  );
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.PlaneBufferGeometry(size.x, size.y)
      // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z + size.z/2)),
    new THREE.PlaneBufferGeometry(size.x, size.y)
      // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z - size.z/2)),
    new THREE.PlaneBufferGeometry(size.z, size.y)
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x + size.z/2, center.y, center.z)),
    new THREE.PlaneBufferGeometry(size.z, size.y)
      .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2)))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x - size.x/2, center.y, center.z)),
  ]);
  const material = new THREE.MeshNormalMaterial({
    /* transparent: true,
    opacity: 0.5, */
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.update = () => {};
  return mesh;
};

const update = () => {
  if (mapRenderer) {
    localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;
    if (rigManager.localRig) {
      mapCamera.position.copy(rigManager.localRig.inputs.hmd.position)
        .add(localVector.copy(mapCameraOffset).applyEuler(localEuler));
      mapIndicator.position.copy(rigManager.localRig.inputs.hmd.position);
      mapIndicator.quaternion.setFromEuler(localEuler);
      mapIndicator.visible = true;
    } else {
      mapIndicator.visible = false;
    }
    mapCamera.lookAt(mapIndicator.position);
    mapRenderer.render(mapScene, mapCamera);

    for (const object of objects) {
      object.update();
    }
  }
};

const minimap = {
  update,
  init,
  addObject(baseMesh) {
    const object = _makeObject(baseMesh);
    mapScene.add(object);
    objects.push(object);
    return object;
  },
  removeObject(object) {
    mapScene.remove(object);
    objects.splice(objects.indexOf(object), 1);
  },
  addWorld(extents) {
    const object = _makeWorld(extents);
    mapScene.add(object);
    objects.push(object);
    return object;
  },
};
export default minimap;