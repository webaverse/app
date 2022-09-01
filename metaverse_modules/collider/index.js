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

const _makePlaneCollider = (x, z) => {
  const geom = new THREE.PlaneBufferGeometry(x, z);
  const mat = new THREE.MeshStandardMaterial({color: 0xffffff});
  const mesh = new THREE.Mesh(geom, mat);
  //mesh.visible = false;
  return mesh;
};


export default () => {
  const app = useApp();
  const physics = usePhysics();

  app.name = 'planeCollider';

  const mesh = _makePlaneCollider(10000, 10000);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  physics.addGeometry(mesh);
  app.add(mesh);
  mesh.updateMatrixWorld();

  /* useFrame(({timestamp, timeDiff}) => {
    // XXX
  }); */

  return app;
};