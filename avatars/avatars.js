import THREE from '../three.module.js';
import {GLTFLoader} from '../GLTFLoader.js';
import {DRACOLoader} from '../DRACOLoader.js';
import './vrarmik/three-vrm.js';
import {BufferGeometryUtils} from '../BufferGeometryUtils.js';
import {fixSkeletonZForward} from './vrarmik/SkeletonUtils.js';
import PoseManager from './vrarmik/PoseManager.js';
import ShoulderTransforms from './vrarmik/ShoulderTransforms.js';
import LegsManager from './vrarmik/LegsManager.js';
import MicrophoneWorker from './microphone-worker.js';
import skeletonString from './skeleton.js';
import easing from '../easing.js';
import CBOR from '../cbor.js';
import {defaultAvatarModelUrl} from '../constants.js';
import { SkeletonUtils } from './SkeletonUtils.js'


/*
window.addEventListener('keydown', e => {
  //if (poseData) {
    if (e.which === 35) {
      poseIndex = Math.min(Math.max(poseIndex - 1, 0), poseData.length - 1);
      console.log(poseIndex);
    } else if (e.which === 40) {
      poseIndex = Math.min(Math.max(poseIndex + 1, 0), poseData.length - 1);
      console.log(poseIndex);
    } else if (e.which === 37) {
      emotionIndex = Math.min(Math.max(emotionIndex - 1, 0), Infinity);
      console.log(emotionIndex);
    } else if (e.which === 12) {
      emotionIndex = Math.min(Math.max(emotionIndex + 1, 0), Infinity);
      console.log(emotionIndex);
    }
  //}
}, true)
*/


const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('../')
dracoLoader.preload()
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let animations = null
let avatar_model = null

const nop = ()=>{}

const loadData = new Promise((resolve, reject) =>{
  let count = 2

  const progress = (err)=>{
    if (err){
      console.log(err)
    }
    if (--count===0){
      resolve()
    }
  }

  gltfLoader.load('../animations/animations1.glb', (data)=>{
    animations = data.animations
    animations.forEach(animation => {
      animation.interpolants = {}
      animation.tracks.forEach(track => {
        if (track instanceof THREE.QuaternionKeyframeTrack){
          const name = SkeletonUtils.getStandardBoneName(track.name.split('.')[0])
          if (name){
            const i = track.createInterpolant()
            i.name = track.name
            animation.interpolants[name] = i
          }
        }
      })
    })
    console.log(animations)
    progress()
  }, nop, progress)

  gltfLoader.load(defaultAvatarModelUrl, (data)=>{
    avatar_model = data
    console.log(avatar_model)
    progress()
  }, nop, progress)

})

let tt = 0

class Avatar {
  constructor(object, options = {}) {
    this.model = SkeletonUtils.clone(avatar_model.scene)
    
    this.poseManager = new PoseManager()
    this.shoulderTransforms = new ShoulderTransforms(this)
    this.legsManager = new LegsManager(this)

    const _makeInput = () => {
      const result = new THREE.Object3D()
      result.pointer = 0
      result.grip = 0
      result.enabled = false
      return result
    }

    this.inputs = {
      hmd          : _makeInput(),
      leftGamepad  : _makeInput(),
      rightGamepad : _makeInput(),
      hips         : _makeInput(),
    }
    
    this.sdkInputs = {
      hmd          : this.poseManager.vrTransforms.head,
      leftGamepad  : this.poseManager.vrTransforms.leftHand,
      rightGamepad : this.poseManager.vrTransforms.rightHand,
    }

    this.outputs = {
      eyes: this.shoulderTransforms.eyes,
      eyel: this.shoulderTransforms.eyel,
      eyer: this.shoulderTransforms.eyer,
      head: this.shoulderTransforms.head,
      hips: this.legsManager.hips,
      spine: this.shoulderTransforms.spine,
      chest: this.shoulderTransforms.transform,
      neck: this.shoulderTransforms.neck,
      leftShoulder: this.shoulderTransforms.leftShoulderAnchor,
      leftUpperArm: this.shoulderTransforms.leftArm.upperArm,
      leftLowerArm: this.shoulderTransforms.leftArm.lowerArm,
      leftHand: this.shoulderTransforms.leftArm.hand,
      rightShoulder: this.shoulderTransforms.rightShoulderAnchor,
      rightUpperArm: this.shoulderTransforms.rightArm.upperArm,
      rightLowerArm: this.shoulderTransforms.rightArm.lowerArm,
      rightHand: this.shoulderTransforms.rightArm.hand,
      leftUpperLeg: this.legsManager.leftLeg.upperLeg,
      leftLowerLeg: this.legsManager.leftLeg.lowerLeg,
      leftFoot: this.legsManager.leftLeg.foot,
      rightUpperLeg: this.legsManager.rightLeg.upperLeg,
      rightLowerLeg: this.legsManager.rightLeg.lowerLeg,
      rightFoot: this.legsManager.rightLeg.foot,
      leftThumb2: this.shoulderTransforms.rightArm.thumb2,
      leftThumb1: this.shoulderTransforms.rightArm.thumb1,
      leftThumb0: this.shoulderTransforms.rightArm.thumb0,
      leftIndexFinger3: this.shoulderTransforms.rightArm.indexFinger3,
      leftIndexFinger2: this.shoulderTransforms.rightArm.indexFinger2,
      leftIndexFinger1: this.shoulderTransforms.rightArm.indexFinger1,
      leftMiddleFinger3: this.shoulderTransforms.rightArm.middleFinger3,
      leftMiddleFinger2: this.shoulderTransforms.rightArm.middleFinger2,
      leftMiddleFinger1: this.shoulderTransforms.rightArm.middleFinger1,
      leftRingFinger3: this.shoulderTransforms.rightArm.ringFinger3,
      leftRingFinger2: this.shoulderTransforms.rightArm.ringFinger2,
      leftRingFinger1: this.shoulderTransforms.rightArm.ringFinger1,
      leftLittleFinger3: this.shoulderTransforms.rightArm.littleFinger3,
      leftLittleFinger2: this.shoulderTransforms.rightArm.littleFinger2,
      leftLittleFinger1: this.shoulderTransforms.rightArm.littleFinger1,
      rightThumb2: this.shoulderTransforms.leftArm.thumb2,
      rightThumb1: this.shoulderTransforms.leftArm.thumb1,
      rightThumb0: this.shoulderTransforms.leftArm.thumb0,
      rightIndexFinger3: this.shoulderTransforms.leftArm.indexFinger3,
      rightIndexFinger2: this.shoulderTransforms.leftArm.indexFinger2,
      rightIndexFinger1: this.shoulderTransforms.leftArm.indexFinger1,
      rightMiddleFinger3: this.shoulderTransforms.leftArm.middleFinger3,
      rightMiddleFinger2: this.shoulderTransforms.leftArm.middleFinger2,
      rightMiddleFinger1: this.shoulderTransforms.leftArm.middleFinger1,
      rightRingFinger3: this.shoulderTransforms.leftArm.ringFinger3,
      rightRingFinger2: this.shoulderTransforms.leftArm.ringFinger2,
      rightRingFinger1: this.shoulderTransforms.leftArm.ringFinger1,
      rightLittleFinger3: this.shoulderTransforms.leftArm.littleFinger3,
      rightLittleFinger2: this.shoulderTransforms.leftArm.littleFinger2,
      rightLittleFinger1: this.shoulderTransforms.leftArm.littleFinger1,
    }

    this.direction = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.jumpState = false
    this.jumpTime = NaN
    this.flyState = false
    this.flyTime = NaN
    this.useTime = NaN
    this.useAnimation = null
    this.sitState = false
    this.sitAnimation = null
    this.danceState = false
    this.danceTime = 0
    this.danceAnimation = null
    this.throwState = null
    this.throwTime = 0
    this.crouchState = false
    this.crouchTime = 0
    this.sitTarget = new THREE.Object3D()
    this.eyeTarget = new THREE.Vector3()
    this.eyeTargetEnabled = false
    this.headTarget = new THREE.Quaternion()
    this.headTargetEnabled = false

    this.windTarget = new THREE.Vector3()
    this.windTargetEnabled = false

    const skinnedMeshes = []
    let skinnedMesh = null
    this.model.traverse(o => {
      if (o.isSkinnedMesh) {
        skinnedMesh = o
        skinnedMeshes.push(o)
      }
    })


    const modelBones = SkeletonUtils.match(skinnedMesh.skeleton) 
    SkeletonUtils.flipBones(modelBones)
    this.modelBones = modelBones
    const skeleton = skinnedMesh.skeleton
    this.model.traverse(o => {
		  if (o.isSkinnedMesh) {
			  o.bind((o.skeleton.bones.length === skeleton.bones.length && o.skeleton.bones.every((bone, i) => bone === skeleton.bones[i])) ? skeleton : o.skeleton);
			}
		})
		
    this.model.updateMatrixWorld(true)

    const _averagePoint = points => {
      const result = new THREE.Vector3()
      for (let i = 0; i < points.length; i++) {
        result.add(points[i])
      }
      result.divideScalar(points.length)
      return result
    }

    const _getEyePosition = () => {
      if (this.modelBones.EyeL && this.modelBones.EyeR) {
        return this.modelBones.EyeL.getWorldPosition(new THREE.Vector3())
          .add(this.modelBones.EyeR.getWorldPosition(new THREE.Vector3()))
          .divideScalar(2)
      } else {
        const neckToHeadDiff = this.modelBones.Head.getWorldPosition(new THREE.Vector3()).sub(this.modelBones.Neck.getWorldPosition(new THREE.Vector3()))
        if (neckToHeadDiff.z < 0) {
          neckToHeadDiff.z *= -1
        }
        return this.modelBones.Head.getWorldPosition(new THREE.Vector3()).add(neckToHeadDiff)
      }
    }

    const eyePosition = _getEyePosition()


    this.height = eyePosition.clone().sub(_averagePoint([modelBones.LeftAnkle.getWorldPosition(new THREE.Vector3()), modelBones.RightAnkle.getWorldPosition(new THREE.Vector3())])).y;
    this.shoulderWidth = modelBones.LeftArm.getWorldPosition(new THREE.Vector3()).distanceTo(modelBones.RightArm.getWorldPosition(new THREE.Vector3()));
    this.leftArmLength = this.shoulderTransforms.leftArm.armLength;
    this.rightArmLength = this.shoulderTransforms.rightArm.armLength;
    const indexDistance = modelBones.LeftIndexFinger1.getWorldPosition(new THREE.Vector3())
      .distanceTo(modelBones.LeftWrist.getWorldPosition(new THREE.Vector3()));
    const handWidth = modelBones.LeftIndexFinger1.getWorldPosition(new THREE.Vector3())
      .distanceTo(modelBones.LeftLittleFinger1.getWorldPosition(new THREE.Vector3()));
    this.handOffsetLeft = new THREE.Vector3(handWidth * 0.7, -handWidth * 0.75, indexDistance * 0.5);
    this.handOffsetRight = new THREE.Vector3(-handWidth * 0.7, -handWidth * 0.75, indexDistance * 0.5);
    this.eyeToHipsOffset = modelBones.Hips.getWorldPosition(new THREE.Vector3()).sub(eyePosition);

    //
    this.active_animations = 0
    this.animations = new Array(8)
    for (let i=0;i<this.animations.length;i++){
      this.animations[i] = Object.seal({
        id     : 0,
        time   : 0,
        weight : 0,
      })
    }
    this._quaternion = new THREE.Quaternion()
    this.animationBonesWeight = Object.seal({
      Hips:0,
			Spine:0,
			Chest:0,
			Neck:0,
			Head:0,
			EyeL:0,
			EyeR:0,

			LeftShoulder:0,
			LeftArm:0,
			LeftElbow:0,			
      LeftWrist:0,
			LeftThumb2:0,
			LeftThumb1:0,
			LeftThumb0:0,
			LeftIndexFinger3:0,
			LeftIndexFinger2:0,
			LeftIndexFinger1:0,
			LeftMiddleFinger3:0,
			LeftMiddleFinger2:0,
			LeftMiddleFinger1:0,
			LeftRingFinger3:0,
			LeftRingFinger2:0,
			LeftRingFinger1:0,
			LeftLittleFinger3:0,
			LeftLittleFinger2:0,
			LeftLittleFinger1:0,
			LeftLeg:0,
			LeftKnee:0,
			LeftAnkle:0,

			RightShoulder:0,
			RightArm:0,
			RightElbow:0,
			RightWrist:0,
			RightThumb2:0,
			RightThumb1:0,
			RightThumb0:0,
			RightIndexFinger3:0,
			RightIndexFinger2:0,
			RightIndexFinger1:0,
			RightMiddleFinger3:0,
			RightMiddleFinger2:0,
			RightMiddleFinger1:0,
			RightRingFinger3:0,
			RightRingFinger2:0,
			RightRingFinger1:0,
			RightLittleFinger3:0,
			RightLittleFinger2:0,
			RightLittleFinger1:0,
			RightLeg:0,
			RightKnee:0,
			RightAnkle:0,
    })

    this.setAnimation('running',1)
    this.setAnimation('rifle_idle',0.5)
    this.setAnimation('throw',0.5)
    
  }
 
  getHandEnabled(i) {
    return this.shoulderTransforms.handsEnabled[i]
  }

  setHandEnabled(i, enabled) {
    this.shoulderTransforms.handsEnabled[i] = enabled
  }

  getTopEnabled() {
    return this.shoulderTransforms.enabled
  }

  setTopEnabled(enabled) {
    this.shoulderTransforms.enabled = enabled
  }

  getBottomEnabled() {
    return this.legsManager.enabled
  }

  setBottomEnabled(enabled) {
    this.legsManager.enabled = enabled
  }

  getAimed() {
    return this.shoulderTransforms.aimed
  }
  
  setAimed(aimed) {
    this.shoulderTransforms.aimed = aimed
  }


  setFloorHeight(floorHeight) {
    this.poseManager.vrTransforms.floorHeight = floorHeight
  }

  getFloorHeight() {
    return this.poseManager.vrTransforms.floorHeight
  }


  _findAnimation(name){
    for (let i=0;i<animations.length;i++){
      if (animations[i].name===name){
        return i
      }
    }
    return -1
  }

  setAnimation(name,weight){
    if (this.active_animations>=this.animations.length){
      return
    }
    if (this.getAnimation(name)!==-1){
      return
    }
    const id = this._findAnimation(name)
    if (id===-1){
      return
    }
    const anim = this.animations[this.active_animations]
    this.active_animations = this.active_animations + 1
    anim.id = id
    anim.time = 0
    anim.weight = weight
  }

  getAnimation(name){
    if (this.active_animations===0){
      return -1
    }
    const id = this._findAnimation(name)
    if (id===-1){
      return -1
    }
    for (let i=0;i<this.active_animations;i++){
      const anim = this.animations[i]
      if (anim.id===id){
        return i
      }
    }    
    return -1
  }

  removeAnimation(name){
    const i = this.getAnimation(name)
    if (i===-1){
      return
    }
    const anim = this.animations[i]
    this.active_animations = this.active_animations - 1
    const last = this.animations[this.active_animations]
    anim.id     = last.id
    anim.time   = last.time
    anim.weight = last.weight
  }

  _applyAnimation(delta) {

    delta = delta 

    for (let b in this.animationBonesWeight){
      this.animationBonesWeight[b] = 0
    }

    for (let i=0;i<this.active_animations;i++){
      const anim = this.animations[i]
      const weight = anim.weight
      if (weight===0){
        continue
      }
      const animation = animations[anim.id]
      const duration = animation.duration

      anim.time = anim.time + delta
      const t = anim.time % duration
      if (anim.time>duration){
        anim.time = t
      }else{

      }
     
      for (let a in animation.interpolants){
        const q = animation.interpolants[a].evaluate(t)
        const w = this.animationBonesWeight[a]
        const mix = weight / w

        if (w===0){
          this.modelBones[a].quaternion.fromArray(q)
        }else{
          this.modelBones[a].quaternion.slerp(this._quaternion.fromArray(q),mix)
        }

        this.animationBonesWeight[a] = w + weight

      } 
  
    }
  }


  update(timeDiff) {

    this._applyAnimation(timeDiff)
    //this._applyPose()

    //if (this.getTopEnabled()) {
    //  this._animateTop();
    //}

    //this._applyIk();
    //this._applyWind();

    
    for (const k in this.modelBones) {
      const modelBone = this.modelBones[k]
      if (modelBone) { // broken model
        //const modelBoneOutput = this.modelBoneOutputs[k];

        //if (/hips|thumb|finger/i.test(k)) {
          //modelBone.position.copy(modelBoneOutput.position);
        //}

        //modelBone.quaternion.multiplyQuaternions(modelBoneOutput.quaternion, modelBone.initialQuaternion);

        // Fix messed up bones if IK is being used
        //if (this.getIkEnabled()) {
          //this._fixIKProblems(k, modelBone);
        //}

        modelBone.updateMatrixWorld()
      }
    }
    
   
  }

  decapitate() {
    if (!this.decapitated) {
      this.modelBones.Head.traverse(o => {
        if (o.savedPosition) { // three-vrm adds vrmColliderSphere which will not be saved
          o.savedPosition.copy(o.position);
          o.savedMatrixWorld.copy(o.matrixWorld);
          o.position.set(NaN, NaN, NaN);
          o.matrixWorld.set(NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN);
        }
      });
      /* if (this.debugMeshes) {
        [this.debugMeshes.attributes.eyes, this.debugMeshes.attributes.head].forEach(attribute => {
          attribute.visible = false;
        });
      } */
      this.decapitated = true;
    }
  }

  undecapitate() {
    if (this.decapitated) {
      this.modelBones.Head.traverse(o => {
        if (o.savedPosition) {
          o.position.copy(o.savedPosition);
          o.matrixWorld.copy(o.savedMatrixWorld);
        }
      });
      /* if (this.debugMeshes) {
        [this.debugMeshes.attributes.eyes, this.debugMeshes.attributes.head].forEach(attribute => {
          attribute.visible = true;
        });
      } */
      this.decapitated = false;
    }
  }


  destroy() {
  }
}
Avatar.waitForLoad = () => loadData
export default Avatar
