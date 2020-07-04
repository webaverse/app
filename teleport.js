import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localRay = new THREE.Ray();

const floorPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));

const teleportGeometry = new THREE.TorusBufferGeometry(0.5, 0.15, 3, 5)
  .applyMatrix(new THREE.Matrix4().makeRotationX(-(Math.PI / 2)))
  .applyMatrix(new THREE.Matrix4().makeRotationY((1 / 20) * (Math.PI * 2)));
const teleportMaterial = new THREE.MeshBasicMaterial({
  color: 0x44c2ff,
});
const _makeTeleportMesh = index => {
  const geometry = teleportGeometry;
  const material = teleportMaterial;

  const teleportMesh = new THREE.Mesh(geometry, material);
  teleportMesh.visible = false;
  teleportMesh.frustumCulled = false;

  teleportMesh.update = (position, quaternion) => {
    teleportMesh.visible = false;

    localVector.copy(position);
    localEuler.setFromQuaternion(quaternion, 'YXZ');

    for (let i = 0; i < 20; i++, localVector.add(localVector2), localEuler.x = Math.max(localEuler.x - Math.PI*0.07, -Math.PI/2)) {
      localRay.set(localVector, localVector2.set(0, 0, -1).applyQuaternion(localQuaternion.setFromEuler(localEuler)));
      const intersection = localRay.intersectPlane(floorPlane, localVector3);
      if (intersection && intersection.distanceTo(localRay.origin) <= 1) {
        teleportMesh.position.copy(intersection);
        localEuler.setFromQuaternion(localQuaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        teleportMesh.quaternion.setFromEuler(localEuler);
        teleportMesh.visible = true;
        break;
      }
    }

    /* if (pad) {
      localVector.copy(vrCamera.position).applyMatrix4(localMatrix.getInverse(container.matrix));
      localEuler.setFromQuaternion(quaternion, 'YXZ');

      for (let i = 0; i < 20; i++, localVector.add(localVector2), localEuler.x = Math.max(localEuler.x - Math.PI*0.07, -Math.PI/2)) {
        localRay.set(localVector, localVector2.set(0, 0, -1).applyQuaternion(localQuaternion.setFromEuler(localEuler)));
        const intersection = localRay.intersectPlane(floorPlane, localVector3);
        if (intersection && intersection.distanceTo(localRay.origin) <= 1) {
          teleportMesh.position.copy(intersection);
          localEuler.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          teleportMesh.quaternion.setFromEuler(localEuler);
          teleportMesh.visible = true;
          break;
        }
      }
    } else if (lastPad) {
      localVector.copy(teleportMesh.position).applyMatrix4(container.matrix).sub(vrCamera.position);
      localVector.y = 0;
      container.position.sub(localVector);
    }

    if (padX !== 0 || padY !== 0) {
      localVector.set(padX, 0, padY);
      const moveLength = localVector.length();
      if (moveLength > 1) {
        localVector.divideScalar(moveLength);
      }
      const hmdEuler = localEuler.setFromQuaternion(rig.inputs.hmd.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      container.position.sub(localVector.multiplyScalar(walkSpeed * timeDiff * (stick ? 3 : 1) * rig.height).applyEuler(hmdEuler));
    } */
  };

  return teleportMesh;
};
const makeTeleportMeshes = () => [
  _makeTeleportMesh(0),
  _makeTeleportMesh(1),
];

export {
  makeTeleportMeshes,
};