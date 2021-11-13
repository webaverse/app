import * as THREE from 'three';

export const getSkinnedMeshes = object => {
  const model = object.scene;
  const skinnedMeshes = [];
  model.traverse(o => {
    if (o.isSkinnedMesh) {
      skinnedMeshes.push(o);
    }
  });
  skinnedMeshes.sort((a, b) => b.skeleton.bones.length - a.skeleton.bones.length);
  return skinnedMeshes;
};
export const getSkeleton = object => {
  const skinnedMeshes = getSkinnedMeshes(object);
  const skeletonSkinnedMesh = skinnedMeshes.find(o => o.skeleton.bones[0].parent) || null;
  const skeleton = skeletonSkinnedMesh && skeletonSkinnedMesh.skeleton;
  /* const poseSkeletonSkinnedMesh = skeleton ? skinnedMeshes.find(o => o.skeleton !== skeleton && o.skeleton.bones.length >= skeleton.bones.length) : null;
  const poseSkeleton = poseSkeletonSkinnedMesh && poseSkeletonSkinnedMesh.skeleton;
  if (poseSkeleton) {
    copySkeleton(poseSkeleton, skeleton);
    poseSkeletonSkinnedMesh.bind(skeleton);
  } */
  return skeleton;
};
export const getEyePosition = (() => {
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  return function(modelBones) {
    if (modelBones.Eye_L && modelBones.Eye_R) {
      return modelBones.Eye_L.getWorldPosition(localVector)
        .add(modelBones.Eye_R.getWorldPosition(localVector2))
        .divideScalar(2);
    } else {
      const neckToHeadDiff = modelBones.Head.getWorldPosition(localVector)
        .sub(modelBones.Neck.getWorldPosition(localVector2));
      if (neckToHeadDiff.z < 0) {
        neckToHeadDiff.z *= -1;
      }
      return modelBones.Head.getWorldPosition(localVector)
        .add(neckToHeadDiff)
        .divideScalar(2);
    }
  }
})();
export const getHeight = (() => {
  const localVector = new THREE.Vector3();
  return function(modelBones) {
    return getEyePosition(modelBones)
      .sub(modelBones.Root.getWorldPosition(localVector))
      .y;
  };
})();
export const makeBoneMap = object => {
  const result = {};
  const vrmExtension = object?.parser?.json?.extensions?.VRM;
  const humanBones = vrmExtension?.humanoid?.humanBones || [];
  const skeleton = getSkeleton(object);
  for (const {bone, node} of humanBones) {
    const boneSpec = object.parser.json.nodes[node];
    const b = skeleton.bones.find(b => b.userData.name === boneSpec.name);
    result[bone] = b;
    if (!b) {
      console.warn('missing bone:', boneSpec.name);
    }
  }
  result.root = result.hips?.parent;
  return result;
};
export const getTailBones = object => {
  const result = [];
  const skeleton = getSkeleton(object);
  const _recurse = bones => {
    for (let i = 0; i < bones.length; i++) {
      const bone = bones[i];
      if (bone.children.length === 0) {
        if (!result.includes(bone)) {
          result.push(bone);
        }
      } else {
        _recurse(bone.children);
      }
    }
  };
  _recurse(skeleton.bones);
  return result;
};