import * as THREE from 'three';
import {Helpers} from './Unity.js';

const stepRate = 0.2;
const stepHeight = 0.2;
const stepMinDistance = 0;
const stepMaxDistance = 0.25;
const stepRestitutionDistance = 0.8;
// const minStepDistanceTimeFactor = 0.2;
const minHmdVelocityTimeFactor = 0.015;
// const velocityLearningFactor = 1;
const maxVelocity = 0.015;
const velocityRestitutionFactor = 25;
const crossStepFactor = 0.9;

const zeroVector = new THREE.Vector3();
const oneVector = new THREE.Vector3(1, 1, 1);
const identityRotation = new THREE.Quaternion();
const downHalfRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
const upHalfRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2);
const downJumpRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/4);
// const downQuarterRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/4);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

const _mod = (a, n) => (a % n + n) % n;
const _angleDiff = (targetA, sourceA) => {
  let a = targetA - sourceA;
  a = _mod((a + Math.PI), Math.PI*2) - Math.PI;
  return a;
};

class Leg {
  constructor(legsManager, left) {
  	this.transform = new THREE.Object3D();
    this.upperLeg = new THREE.Object3D();
    this.lowerLeg = new THREE.Object3D();
    this.foot = new THREE.Object3D();
    this.foot.stickTransform = new THREE.Object3D();
    this.foot.startTransform = new THREE.Object3D();
    this.foot.endTransform = new THREE.Object3D();
    this.foot.startHmdFloorTransform = new THREE.Object3D();

    this.toe = new THREE.Object3D();

    this.transform.add(this.upperLeg);
    this.upperLeg.add(this.lowerLeg);
    this.lowerLeg.add(this.foot);
    this.foot.add(this.toe);

    this.upperLegLength = 0;
    this.lowerLegLength = 0;
    this.legLength = 0;
    this.eyesToUpperLegOffset = new THREE.Vector3();

    this.legsManager = legsManager;
    this.left = left;

    // this.standing = true;
    // this.standFactor = 1;
    // const now = Date.now();
    // this.lastStandTimestamp = now;
    // this.lastJumpTimestamp = now;

    this.stepping = false;
    this.lastStepTimestamp = 0;

    this.balance = 1;
  }

  Start() {
    this.upperLegLength = this.lowerLeg.position.length();
    this.lowerLegLength = this.foot.position.length();
    this.legLength = this.upperLegLength + this.lowerLegLength;

    Helpers.getWorldPosition(this.upperLeg, this.eyesToUpperLegOffset)
  	  .sub(Helpers.getWorldPosition(this.legsManager.rig.shoulderTransforms.head, localVector));

    // this.Reset();
  }

  Update() {
    const footPosition = localVector.copy(this.foot.stickTransform.position);
    // footPosition.y = 0;
    const upperLegPosition = Helpers.getWorldPosition(this.upperLeg, localVector2);

    const footRotation = this.foot.stickTransform.quaternion;
    /* localEuler.setFromQuaternion(footRotation, 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;
    const flatFootRotation = localQuaternion.setFromEuler(localEuler); */

    const hypotenuseDistance = this.upperLegLength;
    const verticalDistance = ((this.legsManager.rig.shoulderTransforms.prone /*|| !this.standing*/) ?
    	upperLegPosition.distanceTo(this.foot.stickTransform.position)
    :
      Math.abs(upperLegPosition.y - this.foot.stickTransform.position.y)
    ) * this.upperLegLength / this.legLength;

    
    const offsetDistance = hypotenuseDistance > verticalDistance ? Math.sqrt(hypotenuseDistance*hypotenuseDistance - verticalDistance*verticalDistance) : 0;

    const lowerLegPosition = localVector4.copy(upperLegPosition).add(footPosition).divideScalar(2)
      .add(
      	localVector5.copy(footPosition).sub(upperLegPosition)
	        .cross(localVector6.set(1, 0, 0).applyQuaternion(footRotation))
	        .normalize()
      		.multiplyScalar(offsetDistance)
      );

    this.upperLeg.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        zeroVector,
        localVector5.copy(upperLegPosition).sub(lowerLegPosition),
        localVector6.set(0, 0, 1).applyQuaternion(footRotation)
      )
    )
      .multiply(downHalfRotation)
      .premultiply(Helpers.getWorldQuaternion(this.transform, localQuaternion2).invert());
    Helpers.updateMatrixMatrixWorld(this.upperLeg);

    this.lowerLeg.quaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        zeroVector,
        localVector5.copy(lowerLegPosition).sub(footPosition),
        localVector6.set(0, 0, 1).applyQuaternion(footRotation)
      )
    )
      .multiply(downHalfRotation)
      .premultiply(Helpers.getWorldQuaternion(this.upperLeg, localQuaternion2).invert());
    Helpers.updateMatrixMatrixWorld(this.lowerLeg);

    this.lowerLeg.updateMatrix();
    this.lowerLeg.updateMatrixWorld();

    // this.lowerLeg.position = lowerLegPosition;

    // if (this.standing || this.stepping) {
      // this.foot.position = footPosition;
      this.foot.quaternion.copy(footRotation)
        .multiply(downHalfRotation)
        .premultiply(Helpers.getWorldQuaternion(this.lowerLeg, localQuaternion2).invert());
      Helpers.updateMatrixMatrixWorld(this.foot);
      
      this.foot.updateMatrix();
      this.foot.updateMatrixWorld();
	}

}

class LegsManager {
	constructor(rig) {
    this.hips = rig.shoulderTransforms.hips;
    this.leftLeg = new Leg(this, true);
    this.hips.add(this.leftLeg.transform);
    this.rightLeg = new Leg(this, false);
    this.hips.add(this.rightLeg.transform);

    this.rig = rig;
    this.poseManager = rig.poseManager;

    this.legSeparation = 0;
    this.lastHmdPosition = new THREE.Vector3();

    this.hmdVelocity = new THREE.Vector3();

    this.enabled = true;
    this.lastEnabled = false;
  }

  Start() {
  	this.legSeparation = Helpers.getWorldPosition(this.leftLeg.upperLeg, localVector)
  	  .distanceTo(Helpers.getWorldPosition(this.rightLeg.upperLeg, localVector2));
  	this.lastHmdPosition.copy(this.poseManager.vrTransforms.head.position);
  	this.leftLeg.Start();
  	this.rightLeg.Start();

    this.Reset();
  }

  Reset() {
    Helpers.copyTransform(this.leftLeg.upperLeg, this.rig.modelBones.Right_leg);
    Helpers.copyTransform(this.leftLeg.lowerLeg, this.rig.modelBones.Right_knee);
    Helpers.copyTransform(this.leftLeg.foot, this.rig.modelBones.Right_ankle);
    this.leftLeg.foot.getWorldPosition(this.leftLeg.foot.stickTransform.position);
    this.leftLeg.foot.getWorldQuaternion(this.leftLeg.foot.stickTransform.quaternion);

    Helpers.copyTransform(this.rightLeg.upperLeg, this.rig.modelBones.Left_leg);
    Helpers.copyTransform(this.rightLeg.lowerLeg, this.rig.modelBones.Left_knee);
    Helpers.copyTransform(this.rightLeg.foot, this.rig.modelBones.Left_ankle);
    this.rightLeg.foot.getWorldPosition(this.rightLeg.foot.stickTransform.position);
    this.rightLeg.foot.getWorldQuaternion(this.rightLeg.foot.stickTransform.quaternion);

    // this.leftLeg.Reset();
    // this.rightLeg.Reset();
  }

	Update() {
    if (this.enabled) {
      if (!this.lastEnabled) {
        this.Reset();
      }

  		Helpers.updateMatrixWorld(this.leftLeg.transform);
  		Helpers.updateMatrixWorld(this.leftLeg.upperLeg);
  		Helpers.updateMatrixWorld(this.leftLeg.lowerLeg);
  		Helpers.updateMatrixWorld(this.leftLeg.foot);

      Helpers.updateMatrixWorld(this.rightLeg.transform);
  		Helpers.updateMatrixWorld(this.rightLeg.upperLeg);
  		Helpers.updateMatrixWorld(this.rightLeg.lowerLeg);
  		Helpers.updateMatrixWorld(this.rightLeg.foot);

      Helpers.updateMatrixMatrixWorld(this.leftLeg.transform);
  		Helpers.updateMatrixMatrixWorld(this.leftLeg.upperLeg);
  		Helpers.updateMatrixMatrixWorld(this.leftLeg.lowerLeg);
  		Helpers.updateMatrixMatrixWorld(this.leftLeg.foot);

      Helpers.updateMatrixMatrixWorld(this.rightLeg.transform);
  		Helpers.updateMatrixMatrixWorld(this.rightLeg.upperLeg);
  		Helpers.updateMatrixMatrixWorld(this.rightLeg.lowerLeg);
  		Helpers.updateMatrixMatrixWorld(this.rightLeg.foot);


  		const now = Date.now();

  		/* this.hmdVelocity.multiplyScalar(1-velocityLearningFactor)
  		  .add(localVector.copy(this.poseManager.vrTransforms.head.position).sub(this.lastHmdPosition).multiplyScalar(velocityLearningFactor)); */
  		this.hmdVelocity.copy(this.poseManager.vrTransforms.head.position).sub(this.lastHmdPosition);
  		// console.log('v', this.hmdVelocity.toArray().join(','));

      /* this.leftLeg.standFactor = this.leftLeg.getStandFactor();
  	  this.leftLeg.standing = true; // this.leftLeg.standFactor >= 1;
  	  if (this.leftLeg.standing) {
  	  	this.leftLeg.lastStandTimestamp = now;
  	  } else {
  	  	this.leftLeg.lastJumpTimestamp = now;
  	  }
  	  if (this.leftLeg.stepping && !this.leftLeg.standing) {
        this.leftLeg.stepping = false;
  	  } */
  	  /* this.rightLeg.standFactor = this.rightLeg.getStandFactor();
  	  this.rightLeg.standing = true; // this.rightLeg.standFactor >= 1;
  	  if (this.rightLeg.standing) {
  	  	this.rightLeg.lastStandTimestamp = now;
  	  } else {
  	  	this.rightLeg.lastJumpTimestamp = now;
  	  }
  	  if (this.rightLeg.stepping && !this.rightLeg.standing) {
        this.rightLeg.stepping = false;
  	  } */

      const floorHeight = this.poseManager.vrTransforms.floorHeight;

      const hipsFloorPosition = localVector.copy(this.hips.position);
      hipsFloorPosition.y = floorHeight;
      const hipsFloorEuler = localEuler.setFromQuaternion(this.hips.quaternion, 'YXZ');
      hipsFloorEuler.x = 0;
      hipsFloorEuler.z = 0;
      const planeMatrix = localMatrix.compose(hipsFloorPosition, localQuaternion.setFromEuler(hipsFloorEuler), oneVector);
      const planeMatrixInverse = localMatrix2.copy(planeMatrix).invert();

      const fakePosition = localVector2;
      const fakeScale = localVector3;

      const leftFootPosition = localVector4;
      const leftFootRotation = localQuaternion;
      localMatrix3.compose(this.leftLeg.foot.stickTransform.position, this.leftLeg.foot.stickTransform.quaternion, oneVector)
        .premultiply(planeMatrixInverse)
        .decompose(leftFootPosition, leftFootRotation, fakeScale);

      const rightFootPosition = localVector5;
      const rightFootRotation = localQuaternion2;
      localMatrix3.compose(this.rightLeg.foot.stickTransform.position, this.rightLeg.foot.stickTransform.quaternion, oneVector)
        .premultiply(planeMatrixInverse)
        .decompose(rightFootPosition, rightFootRotation, fakeScale);

      // rotation

      const maxTiltAngleFactor = 0.1;
      if (/*this.leftLeg.standing && */!this.rig.shoulderTransforms.prone) {
        const leftFootEuler = localEuler.setFromQuaternion(leftFootRotation, 'YXZ');
        leftFootEuler.x = 0;
  	    leftFootEuler.z = 0;
      	if (leftFootEuler.y < -Math.PI*maxTiltAngleFactor) {
      		leftFootEuler.y = -Math.PI*maxTiltAngleFactor;
      	}
      	if (leftFootEuler.y > Math.PI*maxTiltAngleFactor) {
      		leftFootEuler.y = Math.PI*maxTiltAngleFactor;
      	}
      	localMatrix3.compose(zeroVector, localQuaternion3.setFromEuler(leftFootEuler), oneVector)
  	      .premultiply(planeMatrix)
  	      .decompose(fakePosition, this.leftLeg.foot.stickTransform.quaternion, fakeScale);
  	  /* } else if (!this.leftLeg.standing) {
  	  	this.leftLeg.foot.stickTransform.quaternion.copy(this.hips.quaternion)
  	  	  .multiply(downJumpRotation); */
      } else {
      	Helpers.getWorldQuaternion(this.leftLeg.foot, this.leftLeg.foot.stickTransform.quaternion)
      	  .multiply(upHalfRotation);
      }
      if (/*this.rightLeg.standing && */!this.rig.shoulderTransforms.prone) {
  	    const rightFootEuler = localEuler.setFromQuaternion(rightFootRotation, 'YXZ');
  	    rightFootEuler.x = 0;
  	    rightFootEuler.z = 0;
      	if (rightFootEuler.y < -Math.PI*maxTiltAngleFactor) {
      		rightFootEuler.y = -Math.PI*maxTiltAngleFactor;
      	}
      	if (rightFootEuler.y > Math.PI*maxTiltAngleFactor) {
      		rightFootEuler.y = Math.PI*maxTiltAngleFactor;
      	}
      	localMatrix3.compose(zeroVector, localQuaternion3.setFromEuler(rightFootEuler), oneVector)
  	      .premultiply(planeMatrix)
  	      .decompose(fakePosition, this.rightLeg.foot.stickTransform.quaternion, fakeScale);
  	  /* } else if (!this.rightLeg.standing) {
  	  	this.rightLeg.foot.stickTransform.quaternion.copy(this.hips.quaternion)
  	  	  .multiply(downJumpRotation); */
  	  } else {
        Helpers.getWorldQuaternion(this.rightLeg.foot, this.rightLeg.foot.stickTransform.quaternion)
          .multiply(upHalfRotation);
  	  }

  	  // step

      const _getLegStepFactor = leg => {
      	if (leg.stepping) {
  	      const timeDiff = now - leg.lastStepTimestamp;
  	      leg.lastStepTimestamp = now;

  				const scaledStepRate = stepRate
  				  /* / Math.max(
  				  	localVector.set(this.poseManager.vrTransforms.head.position.x, 0, this.poseManager.vrTransforms.head.position.z)
  				  	  .distanceTo(leg.foot.startHmdFloorTransform.position),
  				  	minStepDistanceTimeFactor
  				  ) */
  				  * Math.max(localVector2.set(this.hmdVelocity.x, 0, this.hmdVelocity.z).length() / this.rig.height, minHmdVelocityTimeFactor);
  				return Math.min(Math.max(leg.stepFactor + scaledStepRate * timeDiff, 0), 1);
  	    } else {
  	    	return 0;
  	    }
      };
      this.leftLeg.stepFactor = _getLegStepFactor(this.leftLeg);
      this.rightLeg.stepFactor = _getLegStepFactor(this.rightLeg);

      const leftCanStep = /*this.leftLeg.standing && */!this.leftLeg.stepping && (!this.rightLeg.stepping || this.rightLeg.stepFactor >= crossStepFactor);
      const rightCanStep = /*this.rightLeg.standing && */!this.rightLeg.stepping && (!this.leftLeg.stepping || this.leftLeg.stepFactor >= crossStepFactor);
      const maxStepAngleFactor = 0;
      if (leftCanStep || rightCanStep) {
      	let leftStepDistance = 0;
      	let leftStepAngleDiff = 0;
  	    if (leftCanStep) {
  	    	const leftDistance = Math.sqrt(leftFootPosition.x*leftFootPosition.x + leftFootPosition.z*leftFootPosition.z);
  				const leftAngleDiff = Math.atan2(leftFootPosition.x, leftFootPosition.z);
  				if (leftDistance < this.rig.height*stepMinDistance) {
  					leftStepDistance = leftDistance;
  				} else if (leftDistance > this.rig.height*stepMaxDistance) {
  					leftStepDistance = leftDistance;
  				}
  				if (leftAngleDiff > -Math.PI*maxStepAngleFactor) {
  					leftStepAngleDiff = leftAngleDiff;
  				} else if (leftAngleDiff < -Math.PI+Math.PI*maxStepAngleFactor) {
  					leftStepAngleDiff = leftAngleDiff;
  				}
  			}
  			let rightStepDistance = 0;
      	let rightStepAngleDiff = 0;
  			if (rightCanStep) {
  				const rightDistance = Math.sqrt(rightFootPosition.x*rightFootPosition.x + rightFootPosition.z*rightFootPosition.z);
  				const rightAngleDiff = Math.atan2(rightFootPosition.x, rightFootPosition.z);
  		    if (rightDistance < this.rig.height*stepMinDistance) {
  		    	rightStepDistance = rightDistance;
  		    } else if (rightDistance > this.rig.height*stepMaxDistance) {
  		    	rightStepDistance = rightDistance;
  		    }
  		    if (rightAngleDiff < Math.PI*maxStepAngleFactor) {
  		    	rightStepAngleDiff = rightAngleDiff;
  		    } else if (rightAngleDiff > Math.PI-Math.PI*maxStepAngleFactor) {
  					rightStepAngleDiff = rightAngleDiff;
  				}
  			}

        const _stepLeg = leg => {
          const footDistance = this.legSeparation*stepRestitutionDistance;//Math.min(Math.max(leftStepDistance, this.legSeparation*0.7), this.legSeparation*1.4);

  				leg.foot.startTransform.position.copy(leg.foot.stickTransform.position);
          // leg.foot.startTransform.quaternion.copy(leg.foot.stickTransform.quaternion);

  			  leg.foot.endTransform.position.copy(hipsFloorPosition)
  				  .add(localVector6.set((leg.left ? -1 : 1) * footDistance, 0, 0).applyQuaternion(leg.foot.stickTransform.quaternion));
  				const velocityVector = localVector6.set(this.hmdVelocity.x, 0, this.hmdVelocity.z);
  				const velocityVectorLength = velocityVector.length();
  				if (velocityVectorLength > maxVelocity*this.rig.height) {
            velocityVector.multiplyScalar(maxVelocity*this.rig.height / velocityVectorLength);
  				}
  				velocityVector.multiplyScalar(velocityRestitutionFactor);
  				leg.foot.endTransform.position.add(velocityVector);
          leg.foot.endTransform.updateMatrix();
          leg.foot.endTransform.updateMatrixWorld();
  			  // leg.foot.endTransform.quaternion.copy(this.rightLeg.foot.stickTransform.quaternion);

  			  leg.foot.startHmdFloorTransform.position.set(this.poseManager.vrTransforms.head.position.x, 0, this.poseManager.vrTransforms.head.position.z);
          leg.foot.startHmdFloorTransform.updateMatrix();
          leg.foot.startHmdFloorTransform.updateMatrixWorld();
          leg.lastStepTimestamp = now;
          leg.stepping = true;
  			};

  			if (
  				(leftStepDistance !== 0 || leftStepAngleDiff !== 0) &&
  				(rightStepDistance === 0 || Math.abs(leftStepDistance*this.leftLeg.balance) >= Math.abs(rightStepDistance*this.rightLeg.balance)) &&
  				(rightStepAngleDiff === 0 || Math.abs(leftStepAngleDiff*this.leftLeg.balance) >= Math.abs(rightStepAngleDiff*this.rightLeg.balance))
  			) {
  				_stepLeg(this.leftLeg);
          this.leftLeg.balance = 0;
          this.rightLeg.balance = 1;
  			} else if (rightStepDistance !== 0  || rightStepAngleDiff !== 0) {
  				_stepLeg(this.rightLeg);
        	this.rightLeg.balance = 0;
          this.leftLeg.balance = 1;
  			}
  		}
      
      // position

      if (this.rig.shoulderTransforms.prone) {
      	const targetPosition = Helpers.getWorldPosition(this.leftLeg.upperLeg, localVector6)
          .add(
          	localVector7.set(0, -this.leftLeg.legLength*0.95 + floorHeight, 0)
          	  .applyQuaternion(this.hips.quaternion)
          );
        targetPosition.y = 0;
      	this.leftLeg.foot.stickTransform.position.lerp(targetPosition, 0.1);

      	this.leftLeg.stepping = false;
      } else if (this.leftLeg.stepping) {
        this.leftLeg.foot.stickTransform.position.copy(this.leftLeg.foot.startTransform.position)
          .lerp(this.leftLeg.foot.endTransform.position, this.leftLeg.stepFactor)
          .add(localVector6.set(0, Math.sin(this.leftLeg.stepFactor*Math.PI) * stepHeight * this.rig.height, 0));
          this.leftLeg.foot.stickTransform.updateMatrix();
          this.leftLeg.foot.stickTransform.updateMatrixWorld();
        if (this.leftLeg.stepFactor >= 1) {
        	this.leftLeg.stepping = false;
        }
  		/* } else if (!this.leftLeg.standing) {
        const targetPosition = Helpers.getWorldPosition(this.leftLeg.upperLeg, localVector6)
          .add(
          	localVector7.set(0, 0, 1)
              .normalize()
          	  .applyQuaternion(this.hips.quaternion)
          	  .multiplyScalar(this.leftLeg.legLength*0.5)
          );
        this.leftLeg.foot.stickTransform.position.lerp(targetPosition, 0.1); */
  		} else {
  			const targetPosition = localVector6.copy(this.leftLeg.foot.stickTransform.position);
  			targetPosition.y = floorHeight;
  			this.leftLeg.foot.stickTransform.position.lerp(targetPosition, 0.2);
  		}
  		if (this.rig.shoulderTransforms.prone) {
      	const targetPosition = Helpers.getWorldPosition(this.rightLeg.upperLeg, localVector6)
          .add(
          	localVector7.set(0, -this.rightLeg.legLength*0.95 + floorHeight, 0)
          	  .applyQuaternion(this.hips.quaternion)
          );
        targetPosition.y = 0;
      	this.rightLeg.foot.stickTransform.position.lerp(targetPosition, 0.1);

      	this.rightLeg.stepping = false;
  		} else if (this.rightLeg.stepping) {
        this.rightLeg.foot.stickTransform.position.copy(this.rightLeg.foot.startTransform.position)
          .lerp(this.rightLeg.foot.endTransform.position, this.rightLeg.stepFactor)
          .add(localVector6.set(0, Math.sin(this.rightLeg.stepFactor*Math.PI) * stepHeight * this.rig.height, 0));
        // this.rightLeg.foot.stickTransform.quaternion.copy(this.rightLeg.foot.startTransform.quaternion).slerp(this.rightLeg.foot.endTransform.quaternion, stepFactor);

        if (this.rightLeg.stepFactor >= 1) {
        	this.rightLeg.stepping = false;
        }
  		/* } else if (!this.rightLeg.standing) {
        const targetPosition = Helpers.getWorldPosition(this.rightLeg.upperLeg, localVector6)
          .add(
          	localVector7.set(0, 0, 1)
          	  .normalize()
          	  .applyQuaternion(this.hips.quaternion)
          	  .multiplyScalar(this.rightLeg.legLength*0.6)
          );
        this.rightLeg.foot.stickTransform.position.lerp(targetPosition, 0.1); */
  		} else {
  			const targetPosition = localVector6.copy(this.rightLeg.foot.stickTransform.position);
  			targetPosition.y = floorHeight;
  			this.rightLeg.foot.stickTransform.position.lerp(targetPosition, 0.2);
  		}

  		this.leftLeg.Update();
  		this.rightLeg.Update();
    }
    this.lastHmdPosition.copy(this.poseManager.vrTransforms.head.position);
    this.lastEnabled = this.enabled;
  }
}

export default LegsManager;
