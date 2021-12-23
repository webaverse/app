import * as THREE from 'three';

/**
* Takes in a rootBone and recursively traverses the bone heirarchy,
* setting each bone's +Z axis to face it's child bones. The IK system follows this
* convention, so this step is necessary to update the bindings of a skinned mesh.
*
* Must rebind the model to it's skeleton after this function.
*
* @param {THREE.Bone} rootBone
* @param {Object} context - options and buffer for stateful bone calculations
*                 context.exclude: [ boneNames to exclude ]
*                 context.preRotations: { boneName: THREE.Quaternion, ... }
*/

function fixSkeletonZForward(rootBone, context) {
  context = context || {};
  precalculateZForwards(rootBone, context);
  if (context.exclude) {
    var bones = [rootBone];
    rootBone.traverse((b) => bones.push(b));
    bones.forEach((b) => {
      if (~context.exclude.indexOf(b.id) || ~context.exclude.indexOf(b.name)) {
        delete context.averagedDirs[b.id];
      }
    });
  }
  return setZForward(rootBone, context);
}

const RESETQUAT = new THREE.Quaternion();
const Y_AXIS = new THREE.Vector3(0,1,0);

/**
* Takes in a rootBone and recursively traverses the bone heirarchy,
* setting each bone's +Z axis to face it's child bones. The IK system follows this
* convention, so this step is necessary to update the bindings of a skinned mesh.
*
* Must rebind the model to it's skeleton after this function.
*
* @param {THREE.BONE} rootBone
*/

function precalculateZForwards(rootBone, context) {
  context = context || rootBone;
  context.worldPos = context.worldPos || {};
  context.averagedDirs = context.averagedDirs || {};
  context.preRotations = context.preRotations || {};
  getOriginalWorldPositions(rootBone, context.worldPos)
  calculateAverages(rootBone, context.worldPos, context.averagedDirs);
  return context;
}

function setZForward(rootBone, context) {
  if (!context || !context.worldPos) {
    context = context || {};
    precalculateZForwards(rootBone, context);
  }
  updateTransformations(rootBone, context.worldPos, context.averagedDirs, context.preRotations);
  return context;
}

function calculateAverages(parentBone, worldPos, averagedDirs) {
  var averagedDir = new THREE.Vector3();
  const childBones = parentBone.children.filter(c => c.isBone);
  childBones.forEach((childBone) => {
    //average the child bone world pos
    var childBonePosWorld = worldPos[childBone.id][0];
    averagedDir.add(childBonePosWorld);
  });

  averagedDir.multiplyScalar(1/(childBones.length));
  averagedDirs[parentBone.id] = averagedDir;

  childBones.forEach((childBone) => {
    calculateAverages(childBone, worldPos, averagedDirs);
  });
}

function updateTransformations(parentBone, worldPos, averagedDirs, preRotations) {

      var averagedDir = averagedDirs[parentBone.id];
      if (averagedDir) {

        //set quaternion
        parentBone.quaternion.copy(RESETQUAT);
        // parentBone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI*2));
        parentBone.traverse(child => child.updateMatrix())
        parentBone.updateMatrixWorld(true);

        //get the child bone position in local coordinates
        // var childBoneDir = parentBone.worldToLocal(averagedDir.clone()).normalize();

        //set direction to face child
        // setQuaternionFromDirection(childBoneDir, Y_AXIS, parentBone.quaternion)
        // console.log('new quaternion', parentBone.quaternion.toArray().join(','));
    }
    var preRot = preRotations[parentBone.id] || preRotations[parentBone.name];
    if (preRot) parentBone.quaternion.multiply(preRot);
    // parentBone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
    parentBone.traverse(child => child.updateMatrix())
    parentBone.updateMatrixWorld(true);

    //set child bone position relative to the new parent matrix.
    const childBones = parentBone.children.filter(c => c.isBone);
    childBones.forEach((childBone) => {
      var childBonePosWorld = worldPos[childBone.id][0].clone();
      parentBone.worldToLocal(childBonePosWorld);
      childBone.position.copy(childBonePosWorld);
      childBone.traverse(child => child.updateMatrix())
      childBone.updateMatrixWorld(true);
    });

    childBones.forEach((childBone) => {
      updateTransformations(childBone, worldPos, averagedDirs, preRotations);
    });
}

//borrowing this from utils.js , not sure how to import it
const t1 = new THREE.Vector3();
const t2 = new THREE.Vector3();
const t3 = new THREE.Vector3();
const m1 = new THREE.Matrix4();
function setQuaternionFromDirection(direction, up, target) {
  const x = t1;
  const y = t2;
  const z = t3;
  const m = m1;
  const el = m1.elements;

  z.copy(direction);
  x.crossVectors(up, z);

  if (x.lengthSq() === 0) {
    // parallel
    if (Math.abs(up.z) === 1) {
      z.x += 0.0001;
    } else {
      z.z += 0.0001;
    }
    z.normalize();
    x.crossVectors(up, z);
  }

  x.normalize();
  y.crossVectors(z, x);

  el[ 0 ] = x.x; el[ 4 ] = y.x; el[ 8 ] = z.x;
  el[ 1 ] = x.y; el[ 5 ] = y.y; el[ 9 ] = z.y;
  el[ 2 ] = x.z; el[ 6 ] = y.z; el[ 10 ] = z.z;

  return target.setFromRotationMatrix(m);
}

function getOriginalWorldPositions(rootBone, worldPos) {
  var rootBoneWorldPos = rootBone.getWorldPosition(new THREE.Vector3())
  worldPos[rootBone.id] = [rootBoneWorldPos];
  rootBone.children.forEach((child) => {
    child.isBone && getOriginalWorldPositions(child, worldPos)
  })
}

function _worldToLocalDirection(direction, parent) {
    const inverseParent = new THREE.Matrix4().getInverse(parent.matrixWorld);
    direction.transformDirection(inverseParent);
  return direction;
}

function _localToWorldDirection(direction, parent) {
  const parentMat = parent.matrixWorld;
  direction.transformDirection(parentMat);
  return direction;
}

export {
  fixSkeletonZForward, setQuaternionFromDirection
};