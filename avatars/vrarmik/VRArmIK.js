import * as THREE from 'three';
import {Helpers} from './Unity.js';
import * as FIK from './fik.module.js'
import { rootScene } from '../../renderer.js';

const zeroVector = new THREE.Vector3();
const forwardVector = new THREE.Vector3(0, 0, 1);
const leftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2);
const rightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
const bankLeftRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
const bankRightRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2);
const z180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const FINGER_SPECS = [
  [2, 'thumb0'],
  [3, 'thumb1'],
  [4, 'thumb2'],

  // [6, 'indexFinger0'],
  [7, 'indexFinger1'],
  [8, 'indexFinger2'],
  [9, 'indexFinger3'],

  // [11, 'middleFinger0'],
  [12, 'middleFinger1'],
  [13, 'middleFinger2'],
  [14, 'middleFinger3'],

  // [16, 'ringFinger0'],
  [17, 'ringFinger1'],
  [18, 'ringFinger2'],
  [19, 'ringFinger3'],

  // [21, 'littleFinger0'],
  [22, 'littleFinger1'],
  [23, 'littleFinger2'],
  [24, 'littleFinger3'],
];

function getDiffQuaternion(target, quaternionA, quaternionB) {
  // Purpose: Get a diffQuaternion which can rotate quaternionA to quaternionB.
  // i.e. quaternionA * diffQuaternion = quaternionB .
  // https://forum.unity.com/threads/subtracting-quaternions.317649/
  // https://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/functions/index.htm
  target.copy(quaternionB).invert().multiply(quaternionA).invert();
}

	class VRArmIK
	{
		constructor(arm, shoulder, shoulderPoser, shoulderAnchor, target, left) { // left right reversed.
			this.arm = arm;
			this.shoulder = shoulder;
			this.shoulderPoser = shoulderPoser;
      this.shoulderAnchor = shoulderAnchor;
			this.target = target;
			this.left = left;

			this.upperArmLength = 0;
			this.lowerArmLength = 0;
			this.armLength = 0;
    }

		Start()
		{
			this.upperArmLength = Helpers.getWorldPosition(this.arm.lowerArm, localVector).distanceTo(Helpers.getWorldPosition(this.arm.upperArm, localVector2));
			this.lowerArmLength = Helpers.getWorldPosition(this.arm.hand, localVector).distanceTo(Helpers.getWorldPosition(this.arm.lowerArm, localVector2));
			this.armLength = this.upperArmLength + this.lowerArmLength;

      if (!this.left) {
        window.vrArmIk = this;
        // console.log(window.modelBoneOutputs.Left_arm.boneLength);
        this.solver = new FIK.Structure3D(window.rootScene);
        window.solver = this.solver;
        this.chain = new FIK.Chain3D();
        const base = new FIK.Bone3D(new FIK.V3(0, 1, 0), new FIK.V3(this.upperArmLength, 1, 0));
        window.base = base;
        this.chain.addBone(base);
        // this.chain.setHingeBaseboneConstraint('global', new FIK.V3(0, 0, 1), 0, 0, new FIK.V3(0, 1, 0));
        // this.chain.setRotorBaseboneConstraint('global', FIK.X_NEG, 45);
        // this.chain.setRotorBaseboneConstraint('global', FIK.Z_AXE, 0);
        // this.chain.addConsecutiveHingedBone(new FIK.V3(0, 0, -1), this.lowerArmLength, 'local', FIK.Y_AXE, 150, 0, FIK.Z_AXE);
        this.chain.addConsecutiveBone(new FIK.V3(0, 0, -1), this.lowerArmLength);

        // this.solver.add(this.chain, target.position, true);
        // window.fikTarget = new FIK.V3(-this.upperArmLength, 1, -this.lowerArmLength);
        window.fikTarget = new FIK.V3(1, 1 + (1), 1);
        this.solver.add(this.chain, window.fikTarget, true);
      }
		}

		Update()
		{
      this.target.position.set(0, 1, 0);

      this.shoulderAnchor.quaternion.identity();
      
			Helpers.updateMatrixWorld(this.arm.transform);
			Helpers.updateMatrixWorld(this.arm.upperArm);

			const upperArmPosition = Helpers.getWorldPosition(this.arm.upperArm, localVector);
      const handRotation = this.target.quaternion;
      const handPosition = localVector2.copy(this.target.position);

      const shoulderRotation = Helpers.getWorldQuaternion(this.shoulder.chest, localQuaternion);
      const shoulderRotationInverse = localQuaternion2.copy(shoulderRotation).invert();

      const hypotenuseDistance = this.upperArmLength;
	    const directDistance = upperArmPosition.distanceTo(handPosition) / 2;
      const offsetDistance = hypotenuseDistance > directDistance ? Math.sqrt(hypotenuseDistance*hypotenuseDistance - directDistance*directDistance) : 0;
      const offsetDirection = localVector3.copy(handPosition).sub(upperArmPosition)
        .normalize()
        .cross(localVector4.set(-1, 0, 0).applyQuaternion(shoulderRotation));

      const targetEuler = localEuler.setFromQuaternion(
      	localQuaternion3
      	  .multiplyQuaternions(handRotation, shoulderRotationInverse)
      	  .premultiply(z180Quaternion),
      	'XYZ'
      );
      // const targetDirection = new Vector3(0, 0, 1).applyQuaternion(targetLocalRotation);
      if (this.left) {
    		const yFactor = Math.min(Math.max((targetEuler.y+Math.PI*0.1)/(Math.PI/2), 0), 1);
    		// const zFactor = Math.min(Math.max((-targetDirection.x + 0.5)/0.25, 0), 1)
    		// const xFactor = Math.min(Math.max((targetDirection.y-0.8)/0.2, 0), 1);
    		// yFactor *= 1-xFactor;
    		// const factor = Math.min(yFactor, 1-xFactor);//Math.min(yFactor, 1-xFactor);
    		targetEuler.z = Math.min(Math.max(targetEuler.z, -Math.PI/2), 0);
    		targetEuler.z = (targetEuler.z * (1 - yFactor)) + (-Math.PI/2 * yFactor);
    		// targetEuler.z *= 1 - xFactor;
    		// targetEuler.z *= 1 - zFactor;
      } else {
      	const yFactor = Math.min(Math.max((-targetEuler.y-Math.PI*0.1)/(Math.PI/2), 0), 1);
    		// const zFactor = Math.min(Math.max((-targetDirection.x + 0.5)/0.25, 0), 1)
    		// const xFactor = Math.min(Math.max((targetDirection.y-0.8)/0.2, 0), 1);
    		// yFactor *= 1-xFactor;
    		// const factor = Math.min(yFactor, 1-xFactor);//Math.min(yFactor, 1-xFactor);
    		targetEuler.z = Math.min(Math.max(targetEuler.z, 0), Math.PI/2);
    		targetEuler.z = (targetEuler.z * (1 - yFactor)) + (Math.PI/2 * yFactor);
    		// targetEuler.z *= 1 - xFactor;
    		// targetEuler.z *= 1 - zFactor;
      }
      offsetDirection
        .applyQuaternion(shoulderRotationInverse)
        .applyAxisAngle(forwardVector, targetEuler.z)
        .applyQuaternion(shoulderRotation);

      const elbowPosition = localVector4.copy(upperArmPosition).add(handPosition).divideScalar(2)
        .add(localVector5.copy(offsetDirection).multiplyScalar(offsetDistance));
      const upVector = localVector5.set(this.left ? -1 : 1, 0, 0).applyQuaternion(shoulderRotation);
      this.arm.upperArm.quaternion.setFromRotationMatrix(
      	localMatrix.lookAt(
	      	zeroVector,
	      	localVector6.copy(elbowPosition).sub(upperArmPosition),
	      	upVector
	      )
      )
        .multiply(this.left ? rightRotation : leftRotation)
        .premultiply(Helpers.getWorldQuaternion(this.arm.upperArm.parent, localQuaternion3).invert());
      Helpers.updateMatrixMatrixWorld(this.arm.upperArm);

      // this.arm.lowerArm.position = elbowPosition;
      this.arm.lowerArm.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(
	      	zeroVector,
	      	localVector6.copy(handPosition).sub(elbowPosition),
	      	upVector
	      )
      )
        .multiply(this.left ? rightRotation : leftRotation)
        .premultiply(Helpers.getWorldQuaternion(this.arm.lowerArm.parent, localQuaternion3).invert());
      Helpers.updateMatrixMatrixWorld(this.arm.lowerArm);

      // this.arm.hand.position = handPosition;
      this.arm.hand.quaternion.copy(this.target.quaternion)
        .multiply(this.left ? bankRightRotation : bankLeftRotation)
        .premultiply(Helpers.getWorldQuaternion(this.arm.hand.parent, localQuaternion3).invert());
      Helpers.updateMatrixMatrixWorld(this.arm.hand);

      for (const fingerSpec of FINGER_SPECS) {
        const [index, key] = fingerSpec;
        this.arm[key].quaternion.copy(this.target.fingers[index].quaternion);
        Helpers.updateMatrixMatrixWorld(this.arm[key]);
      }
      
      if (!this.left) {
        // window.modelBoneOutputs.Left_wrist.getWorldPosition(localVector);
        // localVector.sub(window.modelBoneOutputs.Left_arm.getWorldPosition(localVector2));
        // localVector.setFromMatrixPosition(window.modelBoneOutputs.Left_wrist.matrixWorld);
        localVector.copy(this.target.position);
        localVector2.setFromMatrixPosition(window.modelBoneOutputs.Left_arm.matrixWorld);
        localVector.sub(localVector2);
        // localVector.applyQuaternion(localQuaternion.copy(window.localPlayer.quaternion).invert());
        localEuler.setFromQuaternion(window.localPlayer.quaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        localEuler.y *= -1;
        // const localPlayerQuaternionNeg = localQuaternion3.setFromEuler(localEuler);
        localEuler.y += Math.PI / 2;
        localVector.applyEuler(localEuler);
        // console.log(localVector.y);
        localVector.y += 1;
        window.fikTarget.x = localVector.x;
        window.fikTarget.y = localVector.y;
        window.fikTarget.z = localVector.z;
        // console.log(window.logVector3(window.fikTarget));

        localEuler.y += Math.PI / 2;
        const localPlayerQuaternionNeg = localQuaternion3.setFromEuler(localEuler);

        this.solver.update();
        // this.solver.meshChains[0][0].updateMatrixWorld();
        // this.solver.meshChains[0][1].updateMatrixWorld();
        rootScene.updateMatrixWorld();

        localEuler.set(0, Math.PI / 2, 0);
        // this.arm.upperArm.quaternion.copy(this.solver.meshChains[0][0].quaternion).premultiply(localQuaternion.setFromEuler(localEuler));
        // this.arm.lowerArm.quaternion.copy(this.solver.meshChains[0][1].quaternion).premultiply(localQuaternion.setFromEuler(localEuler));
        // this.arm.upperArm.quaternion.copy(this.solver.meshChains[0][0].quaternion);
        // this.arm.
        // this.arm.upperArm.quaternion.multiply(localQuaternion.setFromEuler(localEuler.set(0, Math.PI / 2, 0)));
        // this.arm.upperArm.quaternion.multiply(localQuaternion.setFromEuler(localEuler.set(0, Math.PI, 0)));
        // this.arm.upperArm.quaternion.multiply(localQuaternion.setFromEuler(localEuler.set(0, Math.PI * 1.5, 0)));
        // this.arm.upperArm.quaternion.multiply(localQuaternion.setFromEuler(localEuler.set(0, Math.PI / -2, 0)));
        // getDiffQuaternion(localQuaternion, this.solver.meshChains[0][0].quaternion, this.solver.meshChains[0][1].quaternion);
        // this.arm.lowerArm.quaternion.copy(localQuaternion);
        this.solver.meshChains[0][0].rotation.order = 'ZYX';
        this.arm.upperArm.rotation.x = this.solver.meshChains[0][0].rotation.z;
        this.arm.upperArm.rotation.y = this.solver.meshChains[0][0].rotation.y;
        this.arm.upperArm.rotation.z = -this.solver.meshChains[0][0].rotation.x;
        this.solver.meshChains[0][1].rotation.order = 'ZYX';
        this.arm.lowerArm.rotation.x = this.solver.meshChains[0][1].rotation.z;
        this.arm.lowerArm.rotation.y = this.solver.meshChains[0][1].rotation.y;
        this.arm.lowerArm.rotation.z = -this.solver.meshChains[0][1].rotation.x;
        this.arm.lowerArm.quaternion.premultiply(localQuaternion.copy(this.arm.upperArm.quaternion).invert());

        // // this.arm.upperArm.quaternion.premultiply(this.shoulderAnchor.getWorldQuaternion(localQuaternion).premultiply(localPlayerQuaternionNeg).invert());
        // // this.arm.lowerArm.quaternion.premultiply(this.shoulderAnchor.getWorldQuaternion(localQuaternion).premultiply(localPlayerQuaternionNeg).invert());
        // // this.arm.upperArm.quaternion.premultiply(this.shoulderAnchor.quaternion);
        // // this.arm.lowerArm.quaternion.premultiply(this.shoulderAnchor.quaternion);

        this.shoulderAnchor.getWorldQuaternion(localQuaternion);
        localQuaternion.multiply(localPlayerQuaternionNeg);
        // // console.log(localQuaternion);
        // // localVector.set(-1, 0, 0).applyQuaternion(localQuaternion);
        // // localQuaternion.setFromUnitVectors(
        // //   localVector.normalize(),
        // //   localVector2.set(-1, 0, 0),
        // // );
        // this.arm.upperArm.quaternion.premultiply(localQuaternion.invert());

        // window.modelBoneOutputs.Left_arm.quaternion.premultiply(window.modelBoneOutputs.Left_shoulder.getWorldQuaternion(new THREE.Quaternion()).invert());
        // window.modelBoneOutputs.Left_arm.quaternion.premultiply(localQuaternion.invert());
        window.modelBoneOutputs.Hips.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)));
        window.modelBoneOutputs.Hips.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 4, 0, 0)));
        window.modelBoneOutputs.Left_arm.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 4, 0)));
      }
		}
	}

export default VRArmIK;
