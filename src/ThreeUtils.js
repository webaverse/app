import * as THREE from 'three';
import {camera} from '../renderer.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const world2canvas = (v, target) => {
  if (!target) {
    target = new THREE.Vector3();
  }
  
  const dotView = localVector.set(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .dot(localVector2.copy(v).sub(camera.position));
  if (dotView > 0) {
    const worldPoint = target.copy(v)
      .project(camera);
    worldPoint.x = (worldPoint.x+1)/2;
    worldPoint.y = 1-(worldPoint.y+1)/2;
    worldPoint.z = Math.min(Math.max((1-(worldPoint.z+1)/2)*30, 0.25), 1);
    return worldPoint;
  } else {
    return target.set(0, 0, -1);
  }
};
export {
  world2canvas,
};