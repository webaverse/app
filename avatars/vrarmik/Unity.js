import * as THREE from 'three';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const Helpers = {
  getWorldPosition(o, v) {
    return v.setFromMatrixPosition(o.matrixWorld);
  },
  getWorldQuaternion(o, q) {
    o.matrixWorld.decompose(localVector, q, localVector2);
    return q;
  },
  getWorldScale(o, v) {
    return v.setFromMatrixScale(o.matrixWorld);
  },
  updateMatrix(o) {
    o.matrix.compose(o.position, o.quaternion, o.scale);
  },
  updateMatrixWorld(o) {
    o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix);
    // o.parent.updateMatrixWorld(true);
    // o.updateMatrixWorld(true); //not needed
  },
  updateMatrixMatrixWorld(o) {
    o.matrix.compose(o.position, o.quaternion, o.scale);
    o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix);
  },
  copyTransform(dst, src) {
    dst.position.copy(src.position);
    dst.quaternion.copy(src.quaternion);
    dst.scale.copy(src.scale);
  }
};

export {
  Helpers,
};
