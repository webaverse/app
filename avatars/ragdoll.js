import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import physx from '../physx.js';
import {getDiffQuaternion, getNextPhysicsId} from '../util.js';
import metaversefile from 'metaversefile';
import physicsManager from '../physics-manager.js';

const {DEG2RAD} = THREE.MathUtils;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const localMatrix = new THREE.Matrix4();
const identityVector = new THREE.Vector3();
const identityQuaternion = new THREE.Quaternion();

export const makeRagdollMesh = () => {
  const ragdollMeshGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const ragdollMeshMaterial = new THREE.MeshNormalMaterial({
    // color: 0xFF0000,
    transparent: true,
    depthTest: false,
  });
  const boneRadius = 0.03;

  const _makeCapsuleGeometry = meshBone => {
    const radius = boneRadius;
    const height = meshBone.boneLength - boneRadius * 2;
    const halfHeight = height / 2;
    let size;
    switch (meshBone.name) {
      case 'Left_arm':
      case 'Left_elbow':
      case 'Right_arm':
      case 'Right_elbow':
        size = new THREE.Vector3(height, radius * 2, radius * 2);
        break;
      default:
        size = new THREE.Vector3(radius * 2, height, radius * 2);
        break;
    }
    meshBone.size = size;
    meshBone.sizeHalf = size.clone().multiplyScalar(0.5);
    const geometry = BufferGeometryUtils.mergeBufferGeometries([
      (() => {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        return geometry;
      })(),
      new THREE.BoxGeometry(0.3, 0.005, 0.005).translate(0.15, 0, 0),
      new THREE.BoxGeometry(0.01, 0.01, 0.06).translate(0, 0, 0.03),
    ]);
    geometry.radius = radius;
    geometry.halfHeight = halfHeight;
    return geometry;
  };

  const _makeCubeMesh = (name, isTop, scale = 1) => { // todo: redundant with _makeCapsuleGeometry?
    const object = new THREE.Object3D(); // === flatMeshes.Hips/Spine etc
    object.name = name;
    object.physicsId = getNextPhysicsId();

    const physicsMesh = new THREE.Mesh(ragdollMeshGeometry, ragdollMeshMaterial);
    object.add(physicsMesh);
    object.physicsMesh = physicsMesh;

    object.parent2 = null;
    object.children2 = [];
    object.add2 = function(child) {
      object.children2.push(child);
      child.parent2 = object;
    };

    object.isTop = isTop;

    return object;
  };
  const _makeMeshes = () => {
    const mesh = {
      Hips: _makeCubeMesh('Hips', false),

      Spine: _makeCubeMesh('Spine', true),
      Chest: _makeCubeMesh('Chest', true),
      UpperChest: _makeCubeMesh('UpperChest', true),

      Neck: _makeCubeMesh('Neck', true),
      Head: _makeCubeMesh('Head', true),

      Left_shoulder: _makeCubeMesh('Left_shoulder', true),
      Left_arm: _makeCubeMesh('Left_arm', true),
      Left_elbow: _makeCubeMesh('Left_elbow', true),
      Left_wrist: _makeCubeMesh('Left_wrist', true),

      Right_shoulder: _makeCubeMesh('Right_shoulder', true),
      Right_arm: _makeCubeMesh('Right_arm', true),
      Right_elbow: _makeCubeMesh('Right_elbow', true),
      Right_wrist: _makeCubeMesh('Right_wrist', true),

      Left_leg: _makeCubeMesh('Left_leg', false),
      Left_knee: _makeCubeMesh('Left_knee', false),
      Left_ankle: _makeCubeMesh('Left_ankle', false),
      // Left_toe: _makeCubeMesh('Left_toe', false),

      Right_leg: _makeCubeMesh('Right_leg', false),
      Right_knee: _makeCubeMesh('Right_knee', false),
      Right_ankle: _makeCubeMesh('Right_ankle', false),
      // Right_toe: _makeCubeMesh('Right_toe', false),
    };

    // hips
    mesh.Hips.add2(mesh.Spine);
    mesh.Spine.add2(mesh.Chest);
    mesh.Chest.add2(mesh.UpperChest);

    // head
    mesh.UpperChest.add2(mesh.Neck);
    mesh.Neck.add2(mesh.Head);

    // shoulders
    mesh.UpperChest.add2(mesh.Left_shoulder);
    mesh.UpperChest.add2(mesh.Right_shoulder);

    // arms
    mesh.Left_shoulder.add2(mesh.Left_arm);
    mesh.Left_arm.add2(mesh.Left_elbow);
    mesh.Left_elbow.add2(mesh.Left_wrist);

    mesh.Right_shoulder.add2(mesh.Right_arm);
    mesh.Right_arm.add2(mesh.Right_elbow);
    mesh.Right_elbow.add2(mesh.Right_wrist);

    // legs
    mesh.Hips.add2(mesh.Left_leg);
    mesh.Left_leg.add2(mesh.Left_knee);
    mesh.Left_knee.add2(mesh.Left_ankle);
    // mesh.Left_ankle.add2(mesh.Left_toe);

    mesh.Hips.add2(mesh.Right_leg);
    mesh.Right_leg.add2(mesh.Right_knee);
    mesh.Right_knee.add2(mesh.Right_ankle);
    // mesh.Right_ankle.add2(mesh.Right_toe);

    return mesh;
  };

  const flatMeshes = _makeMeshes(); // type: physicsObject/meshBone
  const flatMesh = new THREE.Object3D();
  flatMesh.name = 'flatMesh';
  for (const k in flatMeshes) {
    flatMesh.add(flatMeshes[k]); // note
  }
  // const modelBoneToFlatMeshBoneMap = new Map();

  const object = new THREE.Object3D(); // === ragdollMesh
  object.name = 'ragdollMesh';
  object.flatMeshes = flatMeshes;
  object.add(flatMesh); // note

  object.wrapToAvatar = avatar => {
    for (const k in flatMeshes) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = flatMeshes[k];

      const children = modelBone.children.map(child => {
        let result = null;
        child.traverse(o => {
          if (result === null) {
            if (/^ik/.test(o.name)) {
              result = o;
            }
          }
        });
        return result;
      });

      // bone length
      const modelBoneStart = new THREE.Vector3().setFromMatrixPosition(modelBone.matrixWorld);
      let modelBoneEnd;
      const boneLength = (() => {
        if (k === 'Hips') {
          modelBoneEnd = modelBoneStart.clone();
          return Math.max(0.1, boneRadius * 2);
        } else {
          if (children.length === 0) {
            const diff = new THREE.Vector3().setFromMatrixPosition(modelBone.matrixWorld)
              .sub(new THREE.Vector3().setFromMatrixPosition(modelBone.parent.matrixWorld));
            const length = diff.length();
            modelBoneEnd = modelBoneStart.clone()
              .add(
                diff,
              );
            return Math.max(0.08, length); // same length as parent
          } else {
            // todo: use real bone end, instead of calculated.
            const acc = new THREE.Vector3();
            for (const child of children) {
              localVector.setFromMatrixPosition(child.matrixWorld);
              acc.add(localVector);
            }
            modelBoneEnd = acc.divideScalar(children.length);
            return Math.max(0.08, modelBoneStart.distanceTo(modelBoneEnd));
          }
        }
      })();
      modelBone.boneLength = boneLength;
      modelBone.modelBoneEnd = modelBone.worldToLocal(modelBoneEnd.clone());
      meshBone.boneLength = boneLength;
      meshBone.modelBoneEnd = modelBone.modelBoneEnd;

      // forward quaternion
      if (k === 'Hips') {
        modelBone.forwardQuaternion = new THREE.Quaternion()
          .setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      } else {
        modelBone.forwardQuaternion = new THREE.Quaternion()
          .setFromRotationMatrix(
            localMatrix.lookAt(
              modelBoneStart,
              modelBoneEnd,
              localVector2.set(0, 1, 0),
            ),
          );
      }

      // set capsule geometries
      meshBone.physicsMesh.geometry = _makeCapsuleGeometry(meshBone);

      // memoize
      // modelBoneToFlatMeshBoneMap.set(modelBone, meshBone);
    }
  };
  object.createRagdoll = avatar => {
    if (object.isCreatedRagdoll) return;
    object.isCreatedRagdoll = true;
    object.skeleton = true;
    const localPlayer = metaversefile.useLocalPlayer();
    for (const k in flatMeshes) {
      const meshBone = flatMeshes[k];
      const body = physx.physxWorker.addBoxGeometryPhysics(physx.physics, meshBone.position, meshBone.quaternion, meshBone.sizeHalf, meshBone.physicsId, true, localPlayer.characterController.physicsId);
      avatar.app.physicsObjects.push(meshBone);
      // console.log('mass 1: ', physicsManager.getBodyMass(body));
      // physicsManager.updateMassAndInertia(body, 0.000001);
      physicsManager.updateMassAndInertia(body, 0); // note: set mass 0 ( ie kinematic? ) will not break joints and get good result, but got much slow animation.
      // physicsManager.updateMassAndInertia(body, 1000);
      // console.log('mass 2: ', physicsManager.getBodyMass(body));
    }

    //

    const PxD6Axis = {
      eX: 0, // !< motion along the X axis
      eY: 1, // !< motion along the Y axis
      eZ: 2, // !< motion along the Z axis
      eTWIST: 3, // !< motion around the X axis
      eSWING1: 4, // !< motion around the Y axis
      eSWING2: 5, // !< motion around the Z axis
      eCOUNT: 6,
    };
    const PxD6Motion = {
      eLOCKED: 0, // !< The DOF is locked, it does not allow relative motion.
      eLIMITED: 1, // !< The DOF is limited, it only allows motion within a specific range.
      eFREE: 2, // !< The DOF is free and has its full range of motion.
    };

    // hips
    const jointHipsSpine = physicsManager.addJoint(flatMeshes.Hips, flatMeshes.Spine,
      localVector.copy(avatar.modelBoneOutputs.Spine.position),
      localVector2.copy(avatar.modelBoneOutputs.Spine.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointHipsSpine, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointHipsSpine, -5 * DEG2RAD, 10 * DEG2RAD);

    const jointSpineChest = physicsManager.addJoint(flatMeshes.Spine, flatMeshes.Chest,
      localVector.copy(avatar.modelBoneOutputs.Spine.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Chest.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointSpineChest, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointSpineChest, -5 * DEG2RAD, 10 * DEG2RAD);

    const jointChestUpperChest = physicsManager.addJoint(flatMeshes.Chest, flatMeshes.UpperChest,
      localVector.copy(avatar.modelBoneOutputs.Chest.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.UpperChest.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointChestUpperChest, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointChestUpperChest, -5 * DEG2RAD, 10 * DEG2RAD);

    // head
    const jointUpperChestNeck = physicsManager.addJoint(flatMeshes.UpperChest, flatMeshes.Neck,
      localVector.copy(avatar.modelBoneOutputs.UpperChest.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Neck.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointUpperChestNeck, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointUpperChestNeck, -5 * DEG2RAD, 10 * DEG2RAD);

    const jointNeckHead = physicsManager.addJoint(flatMeshes.Neck, flatMeshes.Head,
      localVector.copy(avatar.modelBoneOutputs.Neck.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Head.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointNeckHead, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointNeckHead, -5 * DEG2RAD, 10 * DEG2RAD);

    // shoulders
    /* eslint-disable-next-line */
    const jointUpperChestLeft_shoulder = physicsManager.addJoint(flatMeshes.UpperChest, flatMeshes.Left_shoulder,
      localVector.copy(avatar.modelBoneOutputs.Left_shoulder.position).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Left_shoulder.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointUpperChestLeft_shoulder, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointUpperChestLeft_shoulder, -Math.PI * 0, Math.PI * 0);

    /* eslint-disable-next-line */
    const jointUpperChestRight_shoulder = physicsManager.addJoint(flatMeshes.UpperChest, flatMeshes.Right_shoulder,
      localVector.copy(avatar.modelBoneOutputs.Right_shoulder.position).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Right_shoulder.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointUpperChestRight_shoulder, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointUpperChestRight_shoulder, -Math.PI * 0, Math.PI * 0);

    // arms
    /* eslint-disable-next-line */
    const jointLeft_shoulderLeft_arm = physicsManager.addJoint(flatMeshes.Left_shoulder, flatMeshes.Left_arm,
      localVector.copy(avatar.modelBoneOutputs.Left_shoulder.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Left_arm.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, -45 * DEG2RAD, -35 * DEG2RAD)), identityQuaternion, false);
    physicsManager.setJointMotion(jointLeft_shoulderLeft_arm, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointLeft_shoulderLeft_arm, PxD6Axis.eSWING2, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointLeft_shoulderLeft_arm, 50 * DEG2RAD, 40 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointLeft_armLeft_elbow = physicsManager.addJoint(flatMeshes.Left_arm, flatMeshes.Left_elbow,
      localVector.copy(avatar.modelBoneOutputs.Left_arm.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Left_elbow.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, -70 * DEG2RAD, 0)), identityQuaternion, false);
    physicsManager.setJointMotion(jointLeft_armLeft_elbow, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointLeft_armLeft_elbow, 71 * DEG2RAD, 0 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointLeft_elbowLeft_wrist = physicsManager.addJoint(flatMeshes.Left_elbow, flatMeshes.Left_wrist,
      localVector.copy(avatar.modelBoneOutputs.Left_elbow.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Left_wrist.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, 0, 30 * DEG2RAD)), identityQuaternion, false);
    physicsManager.setJointMotion(jointLeft_elbowLeft_wrist, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointLeft_elbowLeft_wrist, PxD6Axis.eSWING2, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointLeft_elbowLeft_wrist, 10 * DEG2RAD, 60 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointRight_shoulderRight_arm = physicsManager.addJoint(flatMeshes.Right_shoulder, flatMeshes.Right_arm,
      localVector.copy(avatar.modelBoneOutputs.Right_shoulder.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Right_arm.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, 45 * DEG2RAD, 35 * DEG2RAD)), identityQuaternion, false);
    physicsManager.setJointMotion(jointRight_shoulderRight_arm, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointRight_shoulderRight_arm, PxD6Axis.eSWING2, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointRight_shoulderRight_arm, 50 * DEG2RAD, 40 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointRight_armRight_elbow = physicsManager.addJoint(flatMeshes.Right_arm, flatMeshes.Right_elbow,
      localVector.copy(avatar.modelBoneOutputs.Right_arm.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Right_elbow.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, 70 * DEG2RAD, 0)), identityQuaternion, false);
    physicsManager.setJointMotion(jointRight_armRight_elbow, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointRight_armRight_elbow, 71 * DEG2RAD, 0 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointRight_elbowRight_wrist = physicsManager.addJoint(flatMeshes.Right_elbow, flatMeshes.Right_wrist,
      localVector.copy(avatar.modelBoneOutputs.Right_elbow.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Right_wrist.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, 0, -30 * DEG2RAD)), identityQuaternion, false);
    physicsManager.setJointMotion(jointRight_elbowRight_wrist, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointRight_elbowRight_wrist, PxD6Axis.eSWING2, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointRight_elbowRight_wrist, 10 * DEG2RAD, 60 * DEG2RAD);

    // legs
    /* eslint-disable-next-line */
    const jointHipsLeft_leg = physicsManager.addJoint(flatMeshes.Hips, flatMeshes.Left_leg,
      localVector.copy(avatar.modelBoneOutputs.Left_leg.position),
      localVector2.copy(avatar.modelBoneOutputs.Left_leg.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointHipsLeft_leg, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointHipsLeft_leg, -80 * DEG2RAD, 10 * DEG2RAD);
    physicsManager.setJointMotion(jointHipsLeft_leg, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointHipsLeft_leg, PxD6Axis.eSWING2, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointHipsLeft_leg, 45 * DEG2RAD, 45 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointHipsRight_leg = physicsManager.addJoint(flatMeshes.Hips, flatMeshes.Right_leg,
      localVector.copy(avatar.modelBoneOutputs.Right_leg.position),
      localVector2.copy(avatar.modelBoneOutputs.Right_leg.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointHipsRight_leg, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointHipsRight_leg, -80 * DEG2RAD, 10 * DEG2RAD);
    physicsManager.setJointMotion(jointHipsRight_leg, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointHipsRight_leg, PxD6Axis.eSWING2, PxD6Motion.eLIMITED);
    physicsManager.setJointSwingLimit(jointHipsRight_leg, 45 * DEG2RAD, 45 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointLeft_legLeft_knee = physicsManager.addJoint(flatMeshes.Left_leg, flatMeshes.Left_knee,
      localVector.copy(avatar.modelBoneOutputs.Left_leg.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Left_knee.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointLeft_legLeft_knee, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointLeft_legLeft_knee, -Math.PI * 0.0, Math.PI * 0.6);

    /* eslint-disable-next-line */
    const jointLeft_kneeLeft_ankle = physicsManager.addJoint(flatMeshes.Left_knee, flatMeshes.Left_ankle,
      localVector.copy(avatar.modelBoneOutputs.Left_knee.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Left_ankle.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, 0, 0)), identityQuaternion, false);
    physicsManager.setJointMotion(jointLeft_kneeLeft_ankle, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointLeft_kneeLeft_ankle, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointLeft_kneeLeft_ankle, -10 * DEG2RAD, 30 * DEG2RAD);
    physicsManager.setJointSwingLimit(jointLeft_kneeLeft_ankle, 30 * DEG2RAD, 0 * DEG2RAD);

    // const jointLeft_ankleLeft_toe = physicsManager.addJoint(flatMeshes.Left_ankle, flatMeshes.Left_toe,
    //   avatar.modelBoneOutputs.Left_ankle.modelBoneEnd.clone().multiplyScalar(0.5),
    //   avatar.modelBoneOutputs.Left_toe.modelBoneEnd.clone().multiplyScalar(0.5).negate(),
    //   new THREE.Quaternion().setFromEuler(localEuler.set(0, 0, 0)), new THREE.Quaternion(), false);
    // physicsManager.setJointMotion(jointLeft_ankleLeft_toe, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    // physicsManager.setJointTwistLimit(jointLeft_ankleLeft_toe,       -10 * DEG2RAD,      90 * DEG2RAD);

    /* eslint-disable-next-line */
    const jointRight_legRight_knee = physicsManager.addJoint(flatMeshes.Right_leg, flatMeshes.Right_knee,
      localVector.copy(avatar.modelBoneOutputs.Right_leg.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Right_knee.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity(), identityQuaternion, false);
    physicsManager.setJointMotion(jointRight_legRight_knee, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointRight_legRight_knee, -Math.PI * 0.0, Math.PI * 0.6);

    /* eslint-disable-next-line */
    const jointRight_kneeRight_ankle = physicsManager.addJoint(flatMeshes.Right_knee, flatMeshes.Right_ankle,
      localVector.copy(avatar.modelBoneOutputs.Right_knee.modelBoneEnd).multiplyScalar(0.5),
      localVector2.copy(avatar.modelBoneOutputs.Right_ankle.modelBoneEnd).multiplyScalar(0.5).negate(),
      localQuaternion.identity().setFromEuler(localEuler.set(0, 0, 0)), identityQuaternion, false);
    physicsManager.setJointMotion(jointRight_kneeRight_ankle, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    physicsManager.setJointMotion(jointRight_kneeRight_ankle, PxD6Axis.eSWING1, PxD6Motion.eLIMITED);
    physicsManager.setJointTwistLimit(jointRight_kneeRight_ankle, -10 * DEG2RAD, 30 * DEG2RAD);
    physicsManager.setJointSwingLimit(jointRight_kneeRight_ankle, 30 * DEG2RAD, 0 * DEG2RAD);

    // const jointRight_ankleRight_toe = physicsManager.addJoint(flatMeshes.Right_ankle, flatMeshes.Right_toe,
    //   avatar.modelBoneOutputs.Right_ankle.modelBoneEnd.clone().multiplyScalar(0.5),
    //   avatar.modelBoneOutputs.Right_toe.modelBoneEnd.clone().multiplyScalar(0.5).negate(),
    //   new THREE.Quaternion().setFromEuler(localEuler.set(0, 0, 0)), new THREE.Quaternion(), false);
    // physicsManager.setJointMotion(jointRight_ankleRight_toe, PxD6Axis.eTWIST, PxD6Motion.eLIMITED);
    // physicsManager.setJointTwistLimit(jointRight_ankleRight_toe,       -10 * DEG2RAD,      90 * DEG2RAD);

    // rootScene.children[2].visible = false; // test: hide E tag.
  };
  object.setFromAvatar = avatar => {
    // avatar.modelBoneOutputs.Root.updateMatrixWorld();
    // todo: why one frame lag, even with avatar.modelBoneOutputs.Root.updateMatrixWorld().
    for (const k in flatMeshes) {
      const modelBone = avatar.modelBoneOutputs[k];
      const meshBone = flatMeshes[k]; // ragdollMesh's

      modelBone.matrixWorld.decompose(localVector, localQuaternion, localVector2);

      localQuaternion2.copy(localQuaternion).multiply(
        modelBone.forwardQuaternion,
      );
      if (k === 'Hips') {
        meshBone.matrixWorld.compose(localVector, localQuaternion, localVector2);
        meshBone.matrixWorld.decompose(meshBone.position, meshBone.quaternion, meshBone.scale);
      } else {
        // put bone at center of neighbor joints
        localVector.add(
          localVector3.set(0, 0, -meshBone.boneLength * 0.5)
            .applyQuaternion(localQuaternion2),
        );
        meshBone.matrixWorld.compose(localVector, localQuaternion, localVector2);
        meshBone.matrixWorld.decompose(meshBone.position, meshBone.quaternion, meshBone.scale);
      }
      physicsManager.setTransform(meshBone);
      physicsManager.setVelocity(meshBone, identityVector);
      physicsManager.setAngularVelocity(meshBone, identityVector);
    }
    object.updateMatrixWorld();
  };
  object.toAvatar = avatar => {
    avatar.modelBoneOutputs.Hips.position.set(0, 0, 0);
    avatar.modelBoneOutputs.Hips.quaternion.identity();
    flatMeshes.Hips.matrixWorld.decompose(avatar.modelBoneOutputs.Root.position, avatar.modelBoneOutputs.Root.quaternion, avatar.modelBoneOutputs.Root.scale);

    avatar.modelBoneOutputs.Left_leg.quaternion.copy(getDiffQuaternion(flatMeshes.Hips.quaternion, flatMeshes.Left_leg.quaternion));
    avatar.modelBoneOutputs.Spine.quaternion.copy(getDiffQuaternion(flatMeshes.Hips.quaternion, flatMeshes.Spine.quaternion));
    avatar.modelBoneOutputs.Chest.quaternion.copy(getDiffQuaternion(flatMeshes.Spine.quaternion, flatMeshes.Chest.quaternion));
    avatar.modelBoneOutputs.UpperChest.quaternion.copy(getDiffQuaternion(flatMeshes.Chest.quaternion, flatMeshes.UpperChest.quaternion));
    avatar.modelBoneOutputs.Right_leg.quaternion.copy(getDiffQuaternion(flatMeshes.Hips.quaternion, flatMeshes.Right_leg.quaternion));
    avatar.modelBoneOutputs.Left_knee.quaternion.copy(getDiffQuaternion(flatMeshes.Left_leg.quaternion, flatMeshes.Left_knee.quaternion));
    avatar.modelBoneOutputs.Left_ankle.quaternion.copy(getDiffQuaternion(flatMeshes.Left_knee.quaternion, flatMeshes.Left_ankle.quaternion));
    avatar.modelBoneOutputs.Right_knee.quaternion.copy(getDiffQuaternion(flatMeshes.Right_leg.quaternion, flatMeshes.Right_knee.quaternion));
    avatar.modelBoneOutputs.Right_ankle.quaternion.copy(getDiffQuaternion(flatMeshes.Right_knee.quaternion, flatMeshes.Right_ankle.quaternion));
    avatar.modelBoneOutputs.Left_arm.quaternion.copy(getDiffQuaternion(flatMeshes.Left_shoulder.quaternion, flatMeshes.Left_arm.quaternion));
    avatar.modelBoneOutputs.Left_elbow.quaternion.copy(getDiffQuaternion(flatMeshes.Left_arm.quaternion, flatMeshes.Left_elbow.quaternion));
    avatar.modelBoneOutputs.Left_wrist.quaternion.copy(getDiffQuaternion(flatMeshes.Left_elbow.quaternion, flatMeshes.Left_wrist.quaternion));
    avatar.modelBoneOutputs.Right_arm.quaternion.copy(getDiffQuaternion(flatMeshes.Right_shoulder.quaternion, flatMeshes.Right_arm.quaternion));
    avatar.modelBoneOutputs.Right_elbow.quaternion.copy(getDiffQuaternion(flatMeshes.Right_arm.quaternion, flatMeshes.Right_elbow.quaternion));
    avatar.modelBoneOutputs.Right_wrist.quaternion.copy(getDiffQuaternion(flatMeshes.Right_elbow.quaternion, flatMeshes.Right_wrist.quaternion));
    avatar.modelBoneOutputs.Neck.quaternion.copy(getDiffQuaternion(flatMeshes.UpperChest.quaternion, flatMeshes.Neck.quaternion));
    avatar.modelBoneOutputs.Head.quaternion.copy(getDiffQuaternion(flatMeshes.Neck.quaternion, flatMeshes.Head.quaternion));
  };
  object.skeleton = null;
  return object;
};
