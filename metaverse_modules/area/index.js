import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {useApp, useLocalPlayer, useProcGen, useGeometries, useCamera, useMaterials, useFrame, useActivate, usePhysics, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
// const localBox = new THREE.Box3();
const localLine = new THREE.Line3();
const localMatrix = new THREE.Matrix4();
const oneVector = new THREE.Vector3(1, 1, 1);

const _makePlaneGeometry = (width, height) => {
  return new THREE.PlaneGeometry(width, height)
    .applyMatrix4(localMatrix.makeTranslation(0, height / 2, 0));
};
const _makeAreaMesh = (width, height, depth) => {
  const geometries = [
    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth / 2)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width / 2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI / 2)),
    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth / 2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width / 2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI * 3 / 2)),

    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI / 4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth / 2)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI / 4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width / 2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI / 2)),
    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI / 4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth / 2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI / 4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width / 2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI * 3 / 2)),
  ];
  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  const material = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

export default () => {
  const app = useApp();

  app.name = 'area';

  const sizeArray = app.getComponent('size') ?? [4, 2, 4];
  const [width, height, depth] = sizeArray;

  const mesh = _makeAreaMesh(width, height, depth);
  app.add(mesh);
  mesh.updateMatrixWorld();

  /* useFrame(({timestamp, timeDiff}) => {
    // XXX
  }); */

  return app;
};
