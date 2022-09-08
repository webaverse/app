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

const _makeBox = () => {
  const geom = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({color: 0x00ff00});
  const mesh = new THREE.Mesh(geom, mat);
  //mesh.visible = false;
  return mesh;
};

let physicsObjects = [];

export default () => {
  const app = useApp();
  const physics = usePhysics();

  app.name = 'box';

  const mesh = _makeBox();
  
  const physicsId = physics.addBoxGeometry(
    app.position,
    app.quaternion,
    new THREE.Vector3(mesh.scale.x/2, mesh.scale.y/2, mesh.scale.z/2),
    false
  );

  //physics.setTrigger(physicsId.physicsId);

  app.add(mesh);
  mesh.updateMatrixWorld();
  physicsObjects.push(physicsId);

   useFrame(({timestamp, timeDiff}) => {
    physicsObjects.forEach(physicsObject => {
      //console.log(physics.getTriggerEvents());
      //let a = physics.overlapBox(mesh.scale.x/2, mesh.scale.y, mesh.scale.z/2, app.position, app.quaternion);
      //console.log(a);
    });
  }); 

  useCleanup(() => {
    physicsObjects.forEach(physicsObject => {
      physics.removeGeometry(physicsObject);
    });
  });

  return app;
};