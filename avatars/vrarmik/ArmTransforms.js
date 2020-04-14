class ArmTransforms
	{
		constructor() {
      this.transform = new THREE.Object3D();
			this.upperArm = new THREE.Object3D();
			this.lowerArm = new THREE.Object3D();
			this.hand = new THREE.Object3D();

      this.transform.add(this.upperArm);
			this.upperArm.add(this.lowerArm);
			this.lowerArm.add(this.hand);
		}
	}

export default ArmTransforms;
