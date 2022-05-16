import * as THREE from 'three';

class ArmTransforms {
	constructor() {
    this.transform = new THREE.Object3D();
		this.upperArm = new THREE.Object3D();
		this.upperArm.name = 'ikUpperArm';
		this.lowerArm = new THREE.Object3D();
		this.lowerArm.name = 'ikLowerArm';
		this.hand = new THREE.Object3D();
		this.hand.name = 'ikHand';
		this.thumb0 = new THREE.Object3D();
		this.thumb0.name = 'ikThumb0';
		this.thumb1 = new THREE.Object3D();
		this.thumb1.name = 'ikThumb1';
		this.thumb2 = new THREE.Object3D();
		this.thumb2.name = 'ikThumb2';
		this.indexFinger1 = new THREE.Object3D();
		this.indexFinger1.name = 'ikIndexFinger1';
		this.indexFinger2 = new THREE.Object3D();
		this.indexFinger2.name = 'ikIndexFinger2';
		this.indexFinger3 = new THREE.Object3D();
		this.indexFinger3.name = 'ikIndexFinger3';
		this.middleFinger1 = new THREE.Object3D();
		this.middleFinger1.name = 'ikMiddleFinger1';
		this.middleFinger2 = new THREE.Object3D();
		this.middleFinger2.name = 'ikMiddleFinger2';
		this.middleFinger3 = new THREE.Object3D();
		this.middleFinger3.name = 'ikMiddleFinger3';
		this.ringFinger1 = new THREE.Object3D();
		this.ringFinger1.name = 'ikRingFinger1';
		this.ringFinger2 = new THREE.Object3D();
		this.ringFinger2.name = 'ikRingFinger2';
		this.ringFinger3 = new THREE.Object3D();
		this.ringFinger3.name = 'ikRingFinger3';
		this.littleFinger1 = new THREE.Object3D();
		this.littleFinger1.name = 'ikLittleFinger1';
		this.littleFinger2 = new THREE.Object3D();
		this.littleFinger2.name = 'ikLittleFinger2';
		this.littleFinger3 = new THREE.Object3D();
		this.littleFinger3.name = 'ikLittleFinger3';

    this.transform.add(this.upperArm);
		this.upperArm.add(this.lowerArm);
		this.lowerArm.add(this.hand);

		this.hand.add(this.thumb0);
		this.thumb0.add(this.thumb1);
		this.thumb1.add(this.thumb2);

		this.hand.add(this.indexFinger1);
		this.indexFinger1.add(this.indexFinger2);
		this.indexFinger2.add(this.indexFinger3);

		this.hand.add(this.middleFinger1);
		this.middleFinger1.add(this.middleFinger2);
		this.middleFinger2.add(this.middleFinger3);

		this.hand.add(this.ringFinger1);
		this.ringFinger1.add(this.ringFinger2);
		this.ringFinger2.add(this.ringFinger3);

		this.hand.add(this.littleFinger1);
		this.littleFinger1.add(this.littleFinger2);
		this.littleFinger2.add(this.littleFinger3);
	}
}

export default ArmTransforms;
