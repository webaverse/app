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
  let skeleton = null;
  
  if (!skeleton) {
    const skinnedMeshes = getSkinnedMeshes(object);
    const skeletonSkinnedMesh = skinnedMeshes.find(o => o.skeleton.bones[0].parent) || null;
    skeleton = skeletonSkinnedMesh && skeletonSkinnedMesh.skeleton;
  }
  if (!skeleton) {
    skeleton = {
      bones: object.scene.children,
    };
    /* const skinnedMeshes = getSkinnedMeshes(object);
    const skeletonSkinnedMesh = skinnedMeshes.find(o => o.skeleton.bones[0].parent) || null;
    skeleton = skeletonSkinnedMesh && skeletonSkinnedMesh.skeleton; */
  }
  
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
  return function(object) {
    const modelBones = getModelBones(object);
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
export const getModelBones = object => {
  const _countCharacters = (name, regex) => {
    let result = 0;
    for (let i = 0; i < name.length; i++) {
      if (regex.test(name[i])) {
        result++;
      }
    }
    return result;
  };
  const _findClosestParentBone = (bone, pred) => {
    for (; bone?.isBone; bone = bone.parent) {
      if (pred(bone)) {
        return bone;
      }
    }
    return null;
  };
  const _findFurthestParentBone = (bone, pred) => {
    let result = null;
    for (; bone?.isBone; bone = bone.parent) {
      if (pred(bone)) {
        result = bone;
      }
    }
    return result;
  };
  const _distanceToParentBone = (bone, parentBone) => {
    for (let i = 0; bone; bone = bone.parent, i++) {
      if (bone === parentBone) {
        return i;
      }
    }
    return Infinity;
  };
  const _findClosestChildBone = (bone, pred) => {
    const _recurse = bone => {
      if (pred(bone)) {
        return bone;
      } else {
        for (let i = 0; i < bone.children.length; i++) {
          const result = _recurse(bone.children[i]);
          if (result) {
            return result;
          }
        }
        return null;
      }
    }
    return _recurse(bone);
  };
  const _findHips = skeleton => skeleton.bones.find(bone => /hip/i.test(bone.name));
  const _findChest = skeleton => skeleton.bones.find(bone => /chest/i.test(bone.name));
  const _findHead = tailBones => {
    const headBones = tailBones.map(tailBone => {
      const headBone = _findFurthestParentBone(tailBone, bone => /head/i.test(bone.name));
      if (headBone) {
        return headBone;
      } else {
        return null;
      }
    }).filter(bone => bone);
    const headBone = headBones.length > 0 ? headBones[0] : null;
    if (headBone) {
      return headBone;
    } else {
      return null;
    }
  };
  const _findEye = (tailBones, left) => {
    const regexp = left ? /l/i : /r/i;
    const eyeBones = tailBones.map(tailBone => {
      const eyeBone = _findClosestParentBone(tailBone, bone => bone.isBone && /eye/i.test(bone.name) && regexp.test(bone.name.replace(/eye/gi, '')));
      if (eyeBone) {
        return eyeBone;
      } else {
        return null;
      }
    }).filter(spec => spec).sort((a, b) => {
      const aName = a.name.replace(/shoulder/gi, '');
      const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
      const bName = b.name.replace(/shoulder/gi, '');
      const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
      if (!left) {
        return aLeftBalance - bLeftBalance;
      } else {
        return bLeftBalance - aLeftBalance;
      }
    });
    const eyeBone = eyeBones.length > 0 ? eyeBones[0] : null;
    if (eyeBone) {
      return eyeBone;
    } else {
      return null;
    }
  };
  const _findSpine = (chest, hips) => {
    for (let bone = chest; bone; bone = bone.parent) {
      if (bone.parent === hips) {
        return bone;
      }
    }
    return null;
  };
  const _findShoulder = (tailBones, left) => {
    const regexp = left ? /l/i : /r/i;
    const shoulderBones = tailBones.map(tailBone => {
      const shoulderBone = _findClosestParentBone(tailBone, bone => /shoulder/i.test(bone.name) && regexp.test(bone.name.replace(/shoulder/gi, '')));
      if (shoulderBone) {
        const distance = _distanceToParentBone(tailBone, shoulderBone);
        if (distance >= 3) {
          return {
            bone: shoulderBone,
            distance,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }
    }).filter(spec => spec).sort((a, b) => {
      const diff = b.distance - a.distance;
      if (diff !== 0) {
        return diff;
      } else {
        const aName = a.bone.name.replace(/shoulder/gi, '');
        const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
        const bName = b.bone.name.replace(/shoulder/gi, '');
        const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
        if (!left) {
          return aLeftBalance - bLeftBalance;
        } else {
          return bLeftBalance - aLeftBalance;
        }
      }
    });
    const shoulderBone = shoulderBones.length > 0 ? shoulderBones[0].bone : null;
    if (shoulderBone) {
      return shoulderBone;
    } else {
      return null;
    }
  };
  const _findHand = shoulderBone => _findClosestChildBone(shoulderBone, bone => /hand|wrist/i.test(bone.name));
  const _findFinger = (handBone, r) => _findClosestChildBone(handBone, bone => r.test(bone.name));
  const _findFoot = (tailBones, left) => {
    const regexp = left ? /l/i : /r/i;
    const legBones = tailBones.map(tailBone => {
      const footBone = _findFurthestParentBone(tailBone, bone => /foot|ankle|leg(?:l|r)4|UpperLegNeck/i.test(bone.name) && regexp.test(bone.name.replace(/foot|ankle|leg(l|r)4|UpperLegNeck/gi, '$1')));
      if (footBone) {
        const legBone = _findFurthestParentBone(footBone, bone => /leg|thigh|legl2|LowerLeg/i.test(bone.name) && regexp.test(bone.name.replace(/leg|thigh|leg(?:l|r)2|LowerLeg/gi, '')));
        if (legBone) {
          const distance = _distanceToParentBone(footBone, legBone);
          if (distance >= 2) {
            return {
              footBone,
              distance,
            };
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }).filter(spec => spec).sort((a, b) => {
      const diff = b.distance - a.distance;
      if (diff !== 0) {
        return diff;
      } else {
        const aName = a.footBone.name.replace(/foot|ankle/gi, '');
        const aLeftBalance = _countCharacters(aName, /l/i) - _countCharacters(aName, /r/i);
        const bName = b.footBone.name.replace(/foot|ankle/gi, '');
        const bLeftBalance = _countCharacters(bName, /l/i) - _countCharacters(bName, /r/i);
        if (!left) {
          return aLeftBalance - bLeftBalance;
        } else {
          return bLeftBalance - aLeftBalance;
        }
      }
    });
    const footBone = legBones.length > 0 ? legBones[0].footBone : null;
    if (footBone) {
      return footBone;
    } else {
      return null;
    }
  };
  const _getOptional = o => o || new THREE.Bone();
  const _ensureParent = (o, parent) => {
    if (!o.parent) {
      if (!parent) {
        parent = new THREE.Bone();
      }
      parent.add(o);
    }
    return o.parent;
  };
  
  // first, try to get the mapping from the VRM metadata
  const boneMap = makeBoneMap(object);
  let Eye_L = boneMap.leftEye;
  let Eye_R = boneMap.rightEye;
  let Head = boneMap.head;
  let Neck = boneMap.neck;
  let UpperChest = boneMap.upperChest;
  let Chest = boneMap.chest || boneMap.neck?.parent;
  let Hips = boneMap.hips;
  let Root = boneMap.root;
  let Spine = boneMap.spine;
  let Left_shoulder = boneMap.leftShoulder;
  let Left_wrist = boneMap.leftHand;
  let Left_thumb2 = boneMap.leftThumbDistal;
  let Left_thumb1 = boneMap.leftThumbIntermediate;
  let Left_thumb0 = boneMap.leftThumbProximal;
  let Left_indexFinger3 = boneMap.leftIndexDistal;
  let Left_indexFinger2 = boneMap.leftIndexIntermediate;
  let Left_indexFinger1 = boneMap.leftIndexProximal;
  let Left_middleFinger3 = boneMap.leftMiddleDistal;
  let Left_middleFinger2 = boneMap.leftMiddleIntermediate;
  let Left_middleFinger1 = boneMap.leftMiddleProximal;
  let Left_ringFinger3 = boneMap.leftRingDistal;
  let Left_ringFinger2 = boneMap.leftRingIntermediate;
  let Left_ringFinger1 = boneMap.leftRingProximal;
  let Left_littleFinger3 = boneMap.leftLittleDistal;
  let Left_littleFinger2 = boneMap.leftLittleIntermediate;
  let Left_littleFinger1 = boneMap.leftLittleProximal;
  let Left_elbow = boneMap.leftLowerArm;
  let Left_arm = boneMap.leftUpperArm;
  let Right_shoulder = boneMap.rightShoulder;
  let Right_wrist = boneMap.rightHand;
  let Right_thumb2 = boneMap.rightThumbDistal;
  let Right_thumb1 = boneMap.rightThumbIntermediate;
  let Right_thumb0 = boneMap.rightThumbProximal;
  let Right_indexFinger3 = boneMap.rightIndexDistal;
  let Right_indexFinger2 = boneMap.rightIndexIntermediate;
  let Right_indexFinger1 = boneMap.rightIndexProximal;
  let Right_middleFinger3 = boneMap.rightMiddleDistal;
  let Right_middleFinger2 = boneMap.rightMiddleIntermediate;
  let Right_middleFinger1 = boneMap.rightMiddleProximal;
  let Right_ringFinger3 = boneMap.rightRingDistal;
  let Right_ringFinger2 = boneMap.rightRingIntermediate;
  let Right_ringFinger1 = boneMap.rightRingProximal;
  let Right_littleFinger3 = boneMap.rightLittleDistal;
  let Right_littleFinger2 = boneMap.rightLittleIntermediate;
  let Right_littleFinger1 = boneMap.rightLittleProximal
  let Right_elbow = boneMap.rightLowerArm;
  let Right_arm = boneMap.rightUpperArm;
  let Left_ankle = boneMap.leftFoot;
  let Left_knee = boneMap.leftLowerLeg;
  let Left_leg = boneMap.leftUpperLeg;
  let Right_ankle = boneMap.rightFoot;
  let Right_knee = boneMap.rightLowerLeg;
  let Right_leg = boneMap.rightUpperLeg;
  let Left_toe = boneMap.leftToes;
  let Right_toe = boneMap.rightToes;

  // failed to find VRM mapping, massive hack to find bones anyway
  // this is probably not a VRM, but pretending to be one
  if (!Root) {
    const skeleton = getSkeleton(object);
    const tailBones = getTailBones(object);
    
    Eye_L = _findEye(tailBones, true);
    Eye_R = _findEye(tailBones, false);
    Head = _findHead(tailBones);
    Neck = Head.parent;
    UpperChest = Neck.parent;
    //Chest = UpperChest.parent;
    Chest = _findChest(skeleton);
    Hips = _findHips(skeleton);
    Root = Hips?.parent;
    Spine = _findSpine(Chest, Hips);
    Left_shoulder = _findShoulder(tailBones, true);
    Left_wrist = _findHand(Left_shoulder);
    Left_thumb2 = _getOptional(_findFinger(Left_wrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02l|l_thumb3|thumb002l/i));
    Left_thumb1 = _ensureParent(Left_thumb2);
    Left_thumb0 = _ensureParent(Left_thumb1, Left_wrist);
    Left_indexFinger3 = _getOptional(_findFinger(Left_wrist, /index(?:finger)?3|index_distal|index02l|indexfinger3_l|index002l/i));
    Left_indexFinger2 = _ensureParent(Left_indexFinger3);
    Left_indexFinger1 = _ensureParent(Left_indexFinger2, Left_wrist);
    Left_middleFinger3 = _getOptional(_findFinger(Left_wrist, /middle(?:finger)?3|middle_distal|middle02l|middlefinger3_l|middle002l/i));
    Left_middleFinger2 = _ensureParent(Left_middleFinger3);
    Left_middleFinger1 = _ensureParent(Left_middleFinger2, Left_wrist);
    Left_ringFinger3 = _getOptional(_findFinger(Left_wrist, /ring(?:finger)?3|ring_distal|ring02l|ringfinger3_l|ring002l/i));
    Left_ringFinger2 = _ensureParent(Left_ringFinger3);
    Left_ringFinger1 = _ensureParent(Left_ringFinger2, Left_wrist);
    Left_littleFinger3 = _getOptional(_findFinger(Left_wrist, /little(?:finger)?3|pinky3|little_distal|little02l|lifflefinger3_l|little002l/i));
    Left_littleFinger2 = _ensureParent(Left_littleFinger3);
    Left_littleFinger1 = _ensureParent(Left_littleFinger2, Left_wrist);
    Left_elbow = /^lower_arm(?:l|r)2$/i.test(Left_wrist.parent.name) ? Left_wrist.parent.parent : Left_wrist.parent;
    Left_arm = Left_elbow.parent;
    Right_shoulder = _findShoulder(tailBones, false);
    Right_wrist = _findHand(Right_shoulder);
    Right_thumb2 = _getOptional(_findFinger(Right_wrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02r|r_thumb3|thumb002r/i));
    Right_thumb1 = _ensureParent(Right_thumb2);
    Right_thumb0 = _ensureParent(Right_thumb1, Right_wrist);
    Right_indexFinger3 = _getOptional(_findFinger(Right_wrist, /index(?:finger)?3|index_distal|index02r|indexfinger3_r|index002r/i));
    Right_indexFinger2 = _ensureParent(Right_indexFinger3);
    Right_indexFinger1 = _ensureParent(Right_indexFinger2, Right_wrist);
    Right_middleFinger3 = _getOptional(_findFinger(Right_wrist, /middle(?:finger)?3|middle_distal|middle02r|middlefinger3_r|middle002r/i));
    Right_middleFinger2 = _ensureParent(Right_middleFinger3);
    Right_middleFinger1 = _ensureParent(Right_middleFinger2, Right_wrist);
    Right_ringFinger3 = _getOptional(_findFinger(Right_wrist, /ring(?:finger)?3|ring_distal|ring02r|ringfinger3_r|ring002r/i));
    Right_ringFinger2 = _ensureParent(Right_ringFinger3);
    Right_ringFinger1 = _ensureParent(Right_ringFinger2, Right_wrist);
    Right_littleFinger3 = _getOptional(_findFinger(Right_wrist, /little(?:finger)?3|pinky3|little_distal|little02r|lifflefinger3_r|little002r/i));
    Right_littleFinger2 = _ensureParent(Right_littleFinger3);
    Right_littleFinger1 = _ensureParent(Right_littleFinger2, Right_wrist);
    Right_elbow = /^lower_arm(?:l|r)2$/i.test(Right_wrist.parent.name) ? Right_wrist.parent.parent : Right_wrist.parent;
    Right_arm = Right_elbow.parent;
    Left_ankle = _findFoot(tailBones, true);
    Left_knee = Left_ankle.parent;
    Left_leg = Left_knee.parent;
    Right_ankle = _findFoot(tailBones, false);
    Right_knee = Right_ankle.parent;
    Right_leg = Right_knee.parent;
  }

  return {
    Root,

    Hips,
    Spine,
    Chest,
    UpperChest,
    Neck,
    Head,
    Eye_L,
    Eye_R,

    Left_shoulder,
    Left_arm,
    Left_elbow,
    Left_wrist,
    Left_thumb2,
    Left_thumb1,
    Left_thumb0,
    Left_indexFinger3,
    Left_indexFinger2,
    Left_indexFinger1,
    Left_middleFinger3,
    Left_middleFinger2,
    Left_middleFinger1,
    Left_ringFinger3,
    Left_ringFinger2,
    Left_ringFinger1,
    Left_littleFinger3,
    Left_littleFinger2,
    Left_littleFinger1,
    Left_leg,
    Left_knee,
    Left_ankle,

    Right_shoulder,
    Right_arm,
    Right_elbow,
    Right_wrist,
    Right_thumb2,
    Right_thumb1,
    Right_thumb0,
    Right_indexFinger3,
    Right_indexFinger2,
    Right_indexFinger1,
    Right_middleFinger3,
    Right_middleFinger2,
    Right_middleFinger1,
    Right_ringFinger3,
    Right_ringFinger2,
    Right_ringFinger1,
    Right_littleFinger3,
    Right_littleFinger2,
    Right_littleFinger1,
    Right_leg,
    Right_knee,
    Right_ankle,
    Left_toe,
    Right_toe,
  };
};