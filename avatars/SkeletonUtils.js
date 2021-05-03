import {
	AnimationClip,
	AnimationMixer,
	Euler,
	Matrix4,
	Quaternion,
	QuaternionKeyframeTrack,
	SkeletonHelper,
	Vector2,
	Vector3,
	VectorKeyframeTrack
} from '../three.module.js';

import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';

const _anim_bones = {
	Hips : 'Hips',
	Spine: 'Spine',
	//Spine1.quaternion
	Spine2: 'Chest',
	Neck: 'Neck',
	Head: 'Head',
	LeftShoulder: 'LeftShoulder',
	LeftArm: 'LeftArm',
	LeftForeArm: 'LeftElbow',
	LeftHand: 'LeftWrist',
	LeftHandMiddle1: 'LeftMiddleFinger1',
	LeftHandMiddle2: 'LeftMiddleFinger2',
	LeftHandMiddle3: 'LeftMiddleFinger3',
	LeftHandThumb1: 'LeftThumb0',
	LeftHandThumb2: 'LeftThumb1',
	LeftHandThumb3: 'LeftThumb2',
	LeftHandIndex1: 'LeftIndexFinger1',
	LeftHandIndex2: 'LeftIndexFinger2',
	LeftHandIndex3: 'LeftIndexFinger3',
	LeftHandRing1: 'LeftRingFinger1',
	LeftHandRing2: 'LeftRingFinger2',
	LeftHandRing3: 'LeftRingFinger3',
	LeftHandPinky1: 'LeftLittleFinger1',
	LeftHandPinky2: 'LeftLittleFinger2',
	LeftHandPinky3: 'LeftLittleFinger3',
	RightShoulder: 'RightShoulder',
	RightArm: 'RightArm',
	RightForeArm: 'RightElbow',
	RightHand: 'RightWrist',
	RightHandMiddle1: 'RightMiddleFinger1',
	RightHandMiddle2: 'RightMiddleFinger2',
	RightHandMiddle3: 'RightMiddleFinger3',
	RightHandThumb1: 'RightThumb0',
	RightHandThumb2: 'RightThumb1',
	RightHandThumb3: 'RightThumb2',
	RightHandIndex1: 'RightIndexFinger1',
	RightHandIndex2: 'RightIndexFinger2',
	RightHandIndex3: 'RightIndexFinger3',
	RightHandRing1: 'RightRingFinger1',
	RightHandRing2: 'RightRingFinger2',
	RightHandRing3: 'RightRingFinger3',
	RightHandPinky1: 'RightLittleFinger1',
	RightHandPinky2: 'RightLittleFinger2',
	RightHandPinky3: 'RightLittleFinger3',
	RightUpLeg: 'RightLeg',
	RightLeg: 'RightKnee',
	RightFoot: 'RightAnkle',
	//RightToeBase.quaternion
	LeftUpLeg: 'LeftLeg',
	LeftLeg: 'LeftKnee',
	LeftFoot: 'LeftAnkle',
	//LeftToeBase.quaternion
}

const _getTailBones = skeleton => {
	const result = [];
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
const _findClosestParentBone = (bone, pred) => {
	for (; bone; bone = bone.parent) {
		if (pred(bone)) {
			return bone;
		}
	}
	return null;
};
const _findFurthestParentBone = (bone, pred) => {
	let result = null;
	for (; bone; bone = bone.parent) {
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
	};
	return _recurse(bone);
};
const _countCharacters = (name, regex) => {
	let result = 0;
	for (let i = 0; i < name.length; i++) {
		if (regex.test(name[i])) {
			result++;
		}
	}
	return result;
};
const _findHips = skeleton => skeleton.bones.find(bone => /hip|rootx/i.test(bone.name));
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

const _findArmature = bone => {
	for (;; bone = bone.parent) {
	  if (!bone.isBone) {
		return bone;
	  }
	}
}
  


class SkeletonUtils {

	static retarget(target, source, options = {}) {

		const pos = new Vector3(),
			quat = new Quaternion(),
			scale = new Vector3(),
			bindBoneMatrix = new Matrix4(),
			relativeMatrix = new Matrix4(),
			globalMatrix = new Matrix4();

		options.preserveMatrix = options.preserveMatrix !== undefined ? options.preserveMatrix : true;
		options.preservePosition = options.preservePosition !== undefined ? options.preservePosition : true;
		options.preserveHipPosition = options.preserveHipPosition !== undefined ? options.preserveHipPosition : false;
		options.useTargetMatrix = options.useTargetMatrix !== undefined ? options.useTargetMatrix : false;
		options.hip = options.hip !== undefined ? options.hip : 'hip';
		options.names = options.names || {};

		const sourceBones = source.isObject3D ? source.skeleton.bones : this.getBones(source),
			bones = target.isObject3D ? target.skeleton.bones : this.getBones(target);

		let bindBones,
			bone, name, boneTo,
			bonesPosition;

		// reset bones

		if (target.isObject3D) {

			target.skeleton.pose();

		} else {

			options.useTargetMatrix = true;
			options.preserveMatrix = false;

		}

		if (options.preservePosition) {

			bonesPosition = [];

			for (let i = 0; i < bones.length; i++) {

				bonesPosition.push(bones[i].position.clone());

			}

		}

		if (options.preserveMatrix) {

			// reset matrix

			target.updateMatrixWorld();

			target.matrixWorld.identity();

			// reset children matrix

			for (let i = 0; i < target.children.length; ++i) {

				target.children[i].updateMatrixWorld(true);

			}

		}

		if (options.offsets) {

			bindBones = [];

			for (let i = 0; i < bones.length; ++i) {

				bone = bones[i];
				name = options.names[bone.name] || bone.name;

				if (options.offsets && options.offsets[name]) {

					bone.matrix.multiply(options.offsets[name]);

					bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);

					bone.updateMatrixWorld();

				}

				bindBones.push(bone.matrixWorld.clone());

			}

		}

		for (let i = 0; i < bones.length; ++i) {

			bone = bones[i];
			name = options.names[bone.name] || bone.name;

			boneTo = this.getBoneByName(name, sourceBones);

			globalMatrix.copy(bone.matrixWorld);

			if (boneTo) {

				boneTo.updateMatrixWorld();

				if (options.useTargetMatrix) {

					relativeMatrix.copy(boneTo.matrixWorld);

				} else {

					relativeMatrix.copy(target.matrixWorld).invert();
					relativeMatrix.multiply(boneTo.matrixWorld);

				}

				// ignore scale to extract rotation

				scale.setFromMatrixScale(relativeMatrix);
				relativeMatrix.scale(scale.set(1 / scale.x, 1 / scale.y, 1 / scale.z));

				// apply to global matrix

				globalMatrix.makeRotationFromQuaternion(quat.setFromRotationMatrix(relativeMatrix));

				if (target.isObject3D) {

					const boneIndex = bones.indexOf(bone),
						wBindMatrix = bindBones ? bindBones[boneIndex] : bindBoneMatrix.copy(target.skeleton.boneInverses[boneIndex]).invert();

					globalMatrix.multiply(wBindMatrix);

				}

				globalMatrix.copyPosition(relativeMatrix);

			}

			if (bone.parent && bone.parent.isBone) {

				bone.matrix.copy(bone.parent.matrixWorld).invert();
				bone.matrix.multiply(globalMatrix);

			} else {

				bone.matrix.copy(globalMatrix);

			}

			if (options.preserveHipPosition && name === options.hip) {

				bone.matrix.setPosition(pos.set(0, bone.position.y, 0));

			}

			bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);

			bone.updateMatrixWorld();

		}

		if (options.preservePosition) {

			for (let i = 0; i < bones.length; ++i) {

				bone = bones[i];
				name = options.names[bone.name] || bone.name;

				if (name !== options.hip) {

					bone.position.copy(bonesPosition[i]);

				}

			}

		}

		if (options.preserveMatrix) {

			// restore matrix

			target.updateMatrixWorld(true);

		}

	}

	static retargetClip(target, source, clip, options = {}) {

		options.useFirstFramePosition = options.useFirstFramePosition !== undefined ? options.useFirstFramePosition : false;
		options.fps = options.fps !== undefined ? options.fps : 30;
		options.names = options.names || [];

		if (!source.isObject3D) {

			source = this.getHelperFromSkeleton(source);

		}

		const numFrames = Math.round(clip.duration * (options.fps / 1000) * 1000),
			delta = 1 / options.fps,
			convertedTracks = [],
			mixer = new AnimationMixer(source),
			bones = this.getBones(target.skeleton),
			boneDatas = [];
		let positionOffset,
			bone, boneTo, boneData,
			name;

		mixer.clipAction(clip).play();
		mixer.update(0);

		source.updateMatrixWorld();

		for (let i = 0; i < numFrames; ++i) {

			const time = i * delta;

			this.retarget(target, source, options);

			for (let j = 0; j < bones.length; ++j) {

				name = options.names[bones[j].name] || bones[j].name;

				boneTo = this.getBoneByName(name, source.skeleton);

				if (boneTo) {

					bone = bones[j];
					boneData = boneDatas[j] = boneDatas[j] || { bone: bone };

					if (options.hip === name) {

						if (!boneData.pos) {

							boneData.pos = {
								times: new Float32Array(numFrames),
								values: new Float32Array(numFrames * 3)
							};

						}

						if (options.useFirstFramePosition) {

							if (i === 0) {

								positionOffset = bone.position.clone();

							}

							bone.position.sub(positionOffset);

						}

						boneData.pos.times[i] = time;

						bone.position.toArray(boneData.pos.values, i * 3);

					}

					if (!boneData.quat) {

						boneData.quat = {
							times: new Float32Array(numFrames),
							values: new Float32Array(numFrames * 4)
						};

					}

					boneData.quat.times[i] = time;

					bone.quaternion.toArray(boneData.quat.values, i * 4);

				}

			}

			mixer.update(delta);

			source.updateMatrixWorld();

		}

		for (let i = 0; i < boneDatas.length; ++i) {

			boneData = boneDatas[i];

			if (boneData) {

				if (boneData.pos) {

					convertedTracks.push(new VectorKeyframeTrack(
						'.bones[' + boneData.bone.name + '].position',
						boneData.pos.times,
						boneData.pos.values
					));

				}

				convertedTracks.push(new QuaternionKeyframeTrack(
					'.bones[' + boneData.bone.name + '].quaternion',
					boneData.quat.times,
					boneData.quat.values
				));

			}

		}

		mixer.uncacheAction(clip);

		return new AnimationClip(clip.name, - 1, convertedTracks);

	}

	static getHelperFromSkeleton(skeleton) {

		const source = new SkeletonHelper(skeleton.bones[0]);
		source.skeleton = skeleton;

		return source;

	}

	static getSkeletonOffsets(target, source, options = {}) {

		const targetParentPos = new Vector3(),
			targetPos = new Vector3(),
			sourceParentPos = new Vector3(),
			sourcePos = new Vector3(),
			targetDir = new Vector2(),
			sourceDir = new Vector2();

		options.hip = options.hip !== undefined ? options.hip : 'hip';
		options.names = options.names || {};

		if (!source.isObject3D) {

			source = this.getHelperFromSkeleton(source);

		}

		const nameKeys = Object.keys(options.names),
			nameValues = Object.values(options.names),
			sourceBones = source.isObject3D ? source.skeleton.bones : this.getBones(source),
			bones = target.isObject3D ? target.skeleton.bones : this.getBones(target),
			offsets = [];

		let bone, boneTo,
			name, i;

		target.skeleton.pose();

		for (i = 0; i < bones.length; ++i) {

			bone = bones[i];
			name = options.names[bone.name] || bone.name;

			boneTo = this.getBoneByName(name, sourceBones);

			if (boneTo && name !== options.hip) {

				const boneParent = this.getNearestBone(bone.parent, nameKeys),
					boneToParent = this.getNearestBone(boneTo.parent, nameValues);

				boneParent.updateMatrixWorld();
				boneToParent.updateMatrixWorld();

				targetParentPos.setFromMatrixPosition(boneParent.matrixWorld);
				targetPos.setFromMatrixPosition(bone.matrixWorld);

				sourceParentPos.setFromMatrixPosition(boneToParent.matrixWorld);
				sourcePos.setFromMatrixPosition(boneTo.matrixWorld);

				targetDir.subVectors(
					new Vector2(targetPos.x, targetPos.y),
					new Vector2(targetParentPos.x, targetParentPos.y)
				).normalize();

				sourceDir.subVectors(
					new Vector2(sourcePos.x, sourcePos.y),
					new Vector2(sourceParentPos.x, sourceParentPos.y)
				).normalize();

				const laterialAngle = targetDir.angle() - sourceDir.angle();

				const offset = new Matrix4().makeRotationFromEuler(
					new Euler(
						0,
						0,
						laterialAngle
					)
				);

				bone.matrix.multiply(offset);

				bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);

				bone.updateMatrixWorld();

				offsets[name] = offset;

			}

		}

		return offsets;

	}

	static renameBones(skeleton, names) {

		const bones = this.getBones(skeleton);

		for (let i = 0; i < bones.length; ++i) {

			const bone = bones[i];

			if (names[bone.name]) {

				bone.name = names[bone.name];

			}

		}

		return this;

	}

	static getBones(skeleton) {

		return Array.isArray(skeleton) ? skeleton : skeleton.bones;

	}

	static getBoneByName(name, skeleton) {

		for (let i = 0, bones = this.getBones(skeleton); i < bones.length; i++) {

			if (name === bones[i].name)

				return bones[i];

		}

	}

	static getNearestBone(bone, names) {

		while (bone.isBone) {

			if (names.indexOf(bone.name) !== - 1) {

				return bone;

			}

			bone = bone.parent;

		}

	}

	static findBoneTrackData(name, tracks) {

		const regexp = /\[(.*)\]\.(.*)/,
			result = { name: name };

		for (let i = 0; i < tracks.length; ++i) {

			// 1 is track name
			// 2 is track type
			const trackData = regexp.exec(tracks[i].name);

			if (trackData && name === trackData[1]) {

				result[trackData[2]] = i;

			}

		}

		return result;

	}

	static getEqualsBonesNames(skeleton, targetSkeleton) {

		const sourceBones = this.getBones(skeleton),
			targetBones = this.getBones(targetSkeleton),
			bones = [];

		search: for (let i = 0; i < sourceBones.length; i++) {

			const boneName = sourceBones[i].name;

			for (let j = 0; j < targetBones.length; j++) {

				if (boneName === targetBones[j].name) {

					bones.push(boneName);

					continue search;

				}

			}

		}

		return bones;

	}

	static clone(source) {

		const sourceLookup = new Map();
		const cloneLookup = new Map();

		const clone = source.clone();

		parallelTraverse(source, clone, function (sourceNode, clonedNode) {

			sourceLookup.set(clonedNode, sourceNode);
			cloneLookup.set(sourceNode, clonedNode);

		});

		clone.traverse(function (node) {

			if (!node.isSkinnedMesh) return;

			const clonedMesh = node;
			const sourceMesh = sourceLookup.get(node);
			const sourceBones = sourceMesh.skeleton.bones;

			clonedMesh.skeleton = sourceMesh.skeleton.clone();
			clonedMesh.bindMatrix.copy(sourceMesh.bindMatrix);

			clonedMesh.skeleton.bones = sourceBones.map(function (bone) {

				return cloneLookup.get(bone);

			});

			clonedMesh.bind(clonedMesh.skeleton, clonedMesh.bindMatrix);

		});

		return clone;

	}

	static match(skeleton) {
		const tailBones = _getTailBones(skeleton)
		const EyeL = _findEye(tailBones, true)
		const EyeR = _findEye(tailBones, false)
		const Head = _findHead(tailBones)
		const Neck = Head.parent
		const Chest = Neck.parent
		const Hips = _findHips(skeleton)
		const Spine = _findSpine(Chest, Hips)
		const LeftShoulder = _findShoulder(tailBones, true)
		const LeftWrist = _findHand(LeftShoulder)
		const LeftThumb2 = _getOptional(_findFinger(LeftWrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02l|l_thumb3|thumb002l/i))
		const LeftThumb1 = _ensureParent(LeftThumb2)
		const LeftThumb0 = _ensureParent(LeftThumb1, LeftWrist)
		const LeftIndexFinger3 = _getOptional(_findFinger(LeftWrist, /index(?:finger)?3|index_distal|index02l|indexfinger3_l|index002l/i))
		const LeftIndexFinger2 = _ensureParent(LeftIndexFinger3)
		const LeftIndexFinger1 = _ensureParent(LeftIndexFinger2, LeftWrist)
		const LeftMiddleFinger3 = _getOptional(_findFinger(LeftWrist, /middle(?:finger)?3|middle_distal|middle02l|middlefinger3_l|middle002l/i))
		const LeftMiddleFinger2 = _ensureParent(LeftMiddleFinger3)
		const LeftMiddleFinger1 = _ensureParent(LeftMiddleFinger2, LeftWrist)
		const LeftRingFinger3 = _getOptional(_findFinger(LeftWrist, /ring(?:finger)?3|ring_distal|ring02l|ringfinger3_l|ring002l/i))
		const LeftRingFinger2 = _ensureParent(LeftRingFinger3)
		const LeftRingFinger1 = _ensureParent(LeftRingFinger2, LeftWrist)
		const LeftLittleFinger3 = _getOptional(_findFinger(LeftWrist, /little(?:finger)?3|pinky3|little_distal|little02l|lifflefinger3_l|little002l/i))
		const LeftLittleFinger2 = _ensureParent(LeftLittleFinger3)
		const LeftLittleFinger1 = _ensureParent(LeftLittleFinger2, LeftWrist)
		const LeftElbow = /^lower_arm(?:l|r)2$/i.test(LeftWrist.parent.name) ? LeftWrist.parent.parent : LeftWrist.parent
		const LeftArm = LeftElbow.parent
		const RightShoulder = _findShoulder(tailBones, false)
		const RightWrist = _findHand(RightShoulder)
		const RightThumb2 = _getOptional(_findFinger(RightWrist, /thumb3_end|thumb2_|handthumb3|thumb_distal|thumb02r|r_thumb3|thumb002r/i))
		const RightThumb1 = _ensureParent(RightThumb2)
		const RightThumb0 = _ensureParent(RightThumb1, RightWrist)
		const RightIndexFinger3 = _getOptional(_findFinger(RightWrist, /index(?:finger)?3|index_distal|index02r|indexfinger3_r|index002r/i))
		const RightIndexFinger2 = _ensureParent(RightIndexFinger3)
		const RightIndexFinger1 = _ensureParent(RightIndexFinger2, RightWrist)
		const RightMiddleFinger3 = _getOptional(_findFinger(RightWrist, /middle(?:finger)?3|middle_distal|middle02r|middlefinger3_r|middle002r/i))
		const RightMiddleFinger2 = _ensureParent(RightMiddleFinger3)
		const RightMiddleFinger1 = _ensureParent(RightMiddleFinger2, RightWrist)
		const RightRingFinger3 = _getOptional(_findFinger(RightWrist, /ring(?:finger)?3|ring_distal|ring02r|ringfinger3_r|ring002r/i))
		const RightRingFinger2 = _ensureParent(RightRingFinger3)
		const RightRingFinger1 = _ensureParent(RightRingFinger2, RightWrist)
		const RightLittleFinger3 = _getOptional(_findFinger(RightWrist, /little(?:finger)?3|pinky3|little_distal|little02r|lifflefinger3_r|little002r/i))
		const RightLittleFinger2 = _ensureParent(RightLittleFinger3)
		const RightLittleFinger1 = _ensureParent(RightLittleFinger2, RightWrist)
		const RightElbow = /^lower_arm(?:l|r)2$/i.test(RightWrist.parent.name) ? RightWrist.parent.parent : RightWrist.parent
		const RightArm = RightElbow.parent
		const LeftAnkle = _findFoot(tailBones, true)
		const LeftKnee = LeftAnkle.parent
		const LeftLeg = LeftKnee.parent
		const RightAnkle = _findFoot(tailBones, false)
		const RightKnee = RightAnkle.parent
		const RightLeg = RightKnee.parent


		const modelBones = Object.seal({
			Hips,
			Spine,
			Chest,
			Neck,
			Head,
			EyeL,
			EyeR,

			LeftShoulder,
			LeftArm,
			LeftElbow,
			LeftWrist,
			LeftThumb2,
			LeftThumb1,
			LeftThumb0,
			LeftIndexFinger3,
			LeftIndexFinger2,
			LeftIndexFinger1,
			LeftMiddleFinger3,
			LeftMiddleFinger2,
			LeftMiddleFinger1,
			LeftRingFinger3,
			LeftRingFinger2,
			LeftRingFinger1,
			LeftLittleFinger3,
			LeftLittleFinger2,
			LeftLittleFinger1,
			LeftLeg,
			LeftKnee,
			LeftAnkle,

			RightShoulder,
			RightArm,
			RightElbow,
			RightWrist,
			RightThumb2,
			RightThumb1,
			RightThumb0,
			RightIndexFinger3,
			RightIndexFinger2,
			RightIndexFinger1,
			RightMiddleFinger3,
			RightMiddleFinger2,
			RightMiddleFinger1,
			RightRingFinger3,
			RightRingFinger2,
			RightRingFinger1,
			RightLittleFinger3,
			RightLittleFinger2,
			RightLittleFinger1,
			RightLeg,
			RightKnee,
			RightAnkle,

		})	

		return modelBones

	}
	static flipBones = (modelBones)=>{
		const armature = _findArmature(modelBones.Hips)
		const armatureQuaternion = armature.quaternion.clone()
	    const armatureMatrixInverse = armature.matrixWorld.clone().invert()
    	armature.position.set(0, 0, 0);
    	armature.quaternion.set(0, 0, 0, 1);
    	armature.scale.set(1, 1, 1);
    	armature.updateMatrix();


		const leftArmDirection = modelBones.LeftWrist.getWorldPosition(new Vector3()).sub(modelBones.Head.getWorldPosition(new Vector3()));
		const flipZ = leftArmDirection.x < 0; // eyeDirection.z < 0;
		const armatureDirection = new Vector3(0, 1, 0).applyQuaternion(armature.quaternion);
		const flipY = armatureDirection.z < -0.5;
		const legDirection = new Vector3(0, 0, -1).applyQuaternion(modelBones.LeftLeg.getWorldQuaternion(new Quaternion()).premultiply(armature.quaternion.clone().invert()));
		const flipLeg = legDirection.y < 0.5;
	
		this.flipZ = flipZ;
		this.flipY = flipY;
		this.flipLeg = flipLeg;
		
		// NeedsNewFunc: Pre-rotate
		const preRotations = {};
		const _ensurePrerotation = k => {
		  const boneName = modelBones[k].name;
		  if (!preRotations[boneName]) {
			preRotations[boneName] = new Quaternion()
		  }
		  return preRotations[boneName]
		};
		if (flipY) {
		  _ensurePrerotation('Hips').premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
		}
		if (flipZ) {
		  _ensurePrerotation('Hips').premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));
		}
		if (flipLeg) {
		  ['LeftLeg', 'RightLeg'].forEach(k => {
			_ensurePrerotation(k).premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2));
		  });
		}

		const _recurseBoneAttachments = o => {
			for (const child of o.children) {
			  if (child.isBone) {
				_recurseBoneAttachments(child);
			  } else {
				child.matrix
				  .premultiply(localMatrix.compose(localVector.set(0, 0, 0), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI), localVector2.set(1, 1, 1)))
				  .decompose(child.position, child.quaternion, child.scale);
			  }
			}
		  }

		  _recurseBoneAttachments(modelBones.Hips);
	  
		  const qrArm = flipZ ? modelBones.LeftArm : modelBones.RightArm;
		  const qrElbow = flipZ ? modelBones.LeftElbow : modelBones.RightElbow;
		  const qrWrist = flipZ ? modelBones.LeftWrist : modelBones.RightWrist;
		  const qr = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
			.premultiply(
			  new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(
				new Vector3(0, 0, 0),
				qrElbow.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse)
				  .sub(qrArm.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse))
				  .applyQuaternion(armatureQuaternion),
				new Vector3(0, 1, 0),
			  )),
			);
		  const qr2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
			.premultiply(
			  new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(
				new Vector3(0, 0, 0),
				qrWrist.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse)
				  .sub(qrElbow.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse))
				  .applyQuaternion(armatureQuaternion),
				new Vector3(0, 1, 0),
			  )),
			);
		  const qlArm = flipZ ? modelBones.RightArm : modelBones.LeftArm;
		  const qlElbow = flipZ ? modelBones.RightElbow : modelBones.LeftElbow;
		  const qlWrist = flipZ ? modelBones.RightWrist : modelBones.LeftWrist;
		  const ql = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
			.premultiply(
			  new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(
				new Vector3(0, 0, 0),
				qlElbow.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse)
				  .sub(qlArm.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse))
				  .applyQuaternion(armatureQuaternion),
				new Vector3(0, 1, 0),
			  )),
			);
		  const ql2 = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
			.premultiply(
			  new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(
				new Vector3(0, 0, 0),
				qlWrist.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse)
				  .sub(qlElbow.getWorldPosition(new Vector3()).applyMatrix4(armatureMatrixInverse))
				  .applyQuaternion(armatureQuaternion),
				new Vector3(0, 1, 0),
			  )),
			);
	  
		  _ensurePrerotation('RightArm').multiply(qr.clone().invert());
		  _ensurePrerotation('RightElbow').multiply(qr.clone()).premultiply(qr2.clone().invert());
		  _ensurePrerotation('LeftArm').multiply(ql.clone().invert());
		  _ensurePrerotation('LeftElbow').multiply(ql.clone()).premultiply(ql2.clone().invert());
		  _ensurePrerotation('LeftLeg').premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
		  _ensurePrerotation('RightLeg').premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
	  
		  for (const k in preRotations) {
			preRotations[k].invert();
		  }
	  
		  fixSkeletonZForward(armature.children[0], {
			preRotations,
		  });
	  
		  if (flipY) {
			modelBones.Hips.quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2));
		  }
		  if (flipZ) {
			modelBones.Hips.quaternion.premultiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));
		  }
		  modelBones.RightArm.quaternion.premultiply(qr.clone().invert());
		  modelBones.RightElbow.quaternion.premultiply(qr).premultiply(qr2.clone().invert());
		  modelBones.LeftArm.quaternion.premultiply(ql.clone().invert());
		  modelBones.LeftElbow.quaternion.premultiply(ql).premultiply(ql2.clone().invert());
		  // End prerotate
	}
	static getStandardBoneName = (name)=> _anim_bones[name]

}


function parallelTraverse(a, b, callback) {

	callback(a, b);

	for (let i = 0; i < a.children.length; i++) {

		parallelTraverse(a.children[i], b.children[i], callback);

	}

}

export { SkeletonUtils }
