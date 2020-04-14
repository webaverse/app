import ArmTransforms from './ArmTransforms.js';
import ShoulderPoser from './ShoulderPoser.js';
import VRArmIK from './VRArmIK.js';


class ShoulderTransforms
	{
		constructor(rig) {
      this.transform = new THREE.Object3D();
      this.hips = new THREE.Object3D();
      this.spine = new THREE.Object3D();
      this.neck = new THREE.Object3D();
      this.head = new THREE.Object3D();
      this.eyes = new THREE.Object3D();

      this.hips.add(this.spine);
      this.spine.add(this.transform);
      this.transform.add(this.neck);
      this.neck.add(this.head);
      this.head.add(this.eyes);

			// this.leftShoulder = new THREE.Object3D();
			// this.transform.add(this.leftShoulder);
			// this.rightShoulder = new THREE.Object3D();
			// this.transform.add(this.rightShoulder);

			this.leftShoulderAnchor = new THREE.Object3D();
			this.transform.add(this.leftShoulderAnchor);
			this.rightShoulderAnchor = new THREE.Object3D();
			this.transform.add(this.rightShoulderAnchor);

			this.leftArm = new ArmTransforms();
			this.rightArm = new ArmTransforms();

			this.leftShoulderAnchor.add(this.leftArm.transform);
			this.rightShoulderAnchor.add(this.rightArm.transform);

      this.prone = false;
      this.proneFactor = 0;
      const now = Date.now();
      this.lastStandTimestamp = now;
      this.lastProneTimestamp = now;

			this.shoulderPoser = new ShoulderPoser(rig, this);

			this.leftArmIk = new VRArmIK(this.leftArm, this, this.shoulderPoser, this.shoulderPoser.vrTransforms.leftHand, true);
			this.rightArmIk = new VRArmIK(this.rightArm, this, this.shoulderPoser, this.shoulderPoser.vrTransforms.rightHand, false);
		}

		Start()
		{
			this.leftArmIk.Start();
			this.rightArmIk.Start();
		}

		Update() {
			this.shoulderPoser.Update();
			this.leftArmIk.Update();
			this.rightArmIk.Update();
		}
	}

export default ShoulderTransforms;
