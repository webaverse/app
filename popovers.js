import * as THREE from './three.module.js';
import {appManager, renderer, scene, orthographicScene, camera, dolly} from './app-object.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const popoverMeshes = [];

const context = renderer.getContext();
function toScreenPosition(obj, camera, vector) {
  var widthHalf = 0.5*context.canvas.width;
  var heightHalf = 0.5*context.canvas.height;

  obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);
  vector.project(camera);

  vector.x = ( vector.x * widthHalf ) + widthHalf;
  vector.y = - ( vector.y * heightHalf ) + heightHalf;

  return vector;
}

const addPopover = (textMesh, {width, height, target} = {}) => {
  const popoverMesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial({
    color: 0x000000,
  }));
  popoverMesh.width = width;
  popoverMesh.height = height;
  popoverMesh.position.z = -1; // needed for othro camera
  popoverMesh.add(textMesh);
  orthographicScene.add(popoverMesh);
  popoverMesh.update = () => {
    const n = localVector.set(0, 0, -1)
      .applyQuaternion(camera.quaternion)
      .dot(
        localVector2.copy(target.position)
          .sub(camera.position)
      );
    toScreenPosition(target, camera, localVector);
    popoverMesh.position.x = -1 + localVector.x/(window.innerWidth*window.devicePixelRatio)*2;
    popoverMesh.position.y = 1 - localVector.y/(window.innerHeight*window.devicePixelRatio)*2;
    const distance = popoverMesh.position.distanceTo(camera.position);
    const maxSoftDistance = 3;
    const maxHardDistance = 8;
    if (n > 0 && distance < maxHardDistance) {
      const halfWidthFactor = popoverMesh.width/(window.innerWidth*window.devicePixelRatio);
      const halfHeightFactor = popoverMesh.height/(window.innerHeight*window.devicePixelRatio);
      popoverMesh.scale.set(popoverMesh.width/(window.innerWidth*window.devicePixelRatio), popoverMesh.height/(window.innerHeight*window.devicePixelRatio), 1);
      if (distance > maxSoftDistance) {
        popoverMesh.scale.multiplyScalar(1 / (distance - maxSoftDistance + 1));
      }
      /* if (distance > maxDistance / 2) {
        popoverMesh.position.x = Math.min(Math.max(popoverMesh.position.x, -0.99 + halfWidthFactor), 0.99 - halfWidthFactor);
        popoverMesh.position.y = Math.min(Math.max(popoverMesh.position.y, -0.99 + halfHeightFactor), 0.99 - halfHeightFactor);
      } */
      popoverMesh.visible = true;
    } else {
      popoverMesh.visible = false;
    }
  };
  popoverMeshes.push(popoverMesh);
  return popoverMesh;
};
const removePopover = popoverMesh => {
  orthographicScene.remove(popoverMesh);
};
const update = () => {
  for (const popoverMesh of popoverMeshes) {
    popoverMesh.update();
  }
};

export {
  addPopover,
  removePopover,
  update,
};