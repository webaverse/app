import * as THREE from 'three';
import metaversefile from 'metaversefile';
import Avatar from './avatars/avatars.js';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
import {glowMaterial} from './shaders.js';
import easing from './easing.js';
import {rarityColors} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

const rarityColorsArray = Object.keys(rarityColors).map(k => rarityColors[k][0]);
const cubicBezier = easing(0, 1, 0, 1);
const cubicBezier2 = easing(0, 1, 1, 1);
const gracePickupTime = 1000;

const componentTemplates = {
  wear(app, component) {
    let wearSpec = null;
    let modelBones = null;
    let appAimAnimationMixers = null;

    // console.log('wear component add', app.contentId);

    const initialScale = app.scale.clone();

    const localPlayer = metaversefile.useLocalPlayer();

    const wearupdate = e => {
      // console.log('wear update', e);
      
      if (e.wear) {
        wearSpec = app.getComponent('wear');
        initialScale.copy(app.scale);
        // console.log('activate component', app, wear);
        if (wearSpec) {
          // const {app, wearSpec} = e.data;
          // console.log('got wear spec', [wearSpec.skinnedMesh, app.glb]);
          if (wearSpec.skinnedMesh && app.glb) {
            let skinnedMesh = null;
            app.glb.scene.traverse(o => {
              if (skinnedMesh === null && o.isSkinnedMesh && o.name === wearSpec.skinnedMesh) {
                skinnedMesh = o;
              }
            });
            if (skinnedMesh && localPlayer.avatar) {
              app.position.set(0, 0, 0);
              app.quaternion.identity(); //.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
              app.scale.copy(initialScale)//.multiplyScalar(wearableScale);
              app.updateMatrix();
              app.matrixWorld.copy(app.matrix);
              
              // this adds pseudo-VRM onto our GLB assuming a mixamo rig
              // used for the glb wearable skinning feature
              const _mixamoRigToFakeVRMHack = () => {
                const {nodes} = app.glb.parser.json;
                const boneNodeMapping = {
                  hips: 'J_Bip_C_Hips',
                  leftUpperLeg: 'J_Bip_L_UpperLeg',
                  rightUpperLeg: 'J_Bip_R_UpperLeg',
                  leftLowerLeg: 'J_Bip_L_LowerLeg',
                  rightLowerLeg: 'J_Bip_R_LowerLeg',
                  leftFoot: 'J_Bip_L_Foot',
                  rightFoot: 'J_Bip_R_Foot',
                  spine: 'J_Bip_C_Spine',
                  chest: 'J_Bip_C_Chest',
                  neck: 'J_Bip_C_Neck',
                  head: 'J_Bip_C_Head',
                  leftShoulder: 'J_Bip_L_Shoulder',
                  rightShoulder: 'J_Bip_R_Shoulder',
                  leftUpperArm: 'J_Bip_L_UpperArm',
                  rightUpperArm: 'J_Bip_R_UpperArm',
                  leftLowerArm: 'J_Bip_L_LowerArm',
                  rightLowerArm: 'J_Bip_R_LowerArm',
                  leftHand: 'J_Bip_L_Hand',
                  rightHand: 'J_Bip_R_Hand',
                  leftToes: 'J_Bip_L_ToeBase',
                  rightToes: 'J_Bip_R_ToeBase',
                  leftEye: 'J_Adj_L_FaceEye',
                  rightEye: 'J_Adj_R_FaceEye',
                  leftThumbProximal: 'J_Bip_L_Thumb1',
                  leftThumbIntermediate: 'J_Bip_L_Thumb2',
                  leftThumbDistal: 'J_Bip_L_Thumb3',
                  leftIndexProximal: 'J_Bip_L_Index1',
                  leftIndexIntermediate: 'J_Bip_L_Index2',
                  leftIndexDistal: 'J_Bip_L_Index3',
                  leftMiddleProximal: 'J_Bip_L_Middle1',
                  leftMiddleIntermediate: 'J_Bip_L_Middle2',
                  leftMiddleDistal: 'J_Bip_L_Middle3',
                  leftRingProximal: 'J_Bip_L_Ring1',
                  leftRingIntermediate: 'J_Bip_L_Ring2',
                  leftRingDistal: 'J_Bip_L_Ring3',
                  leftLittleProximal: 'J_Bip_L_Little1',
                  leftLittleIntermediate: 'J_Bip_L_Little2',
                  leftLittleDistal: 'J_Bip_L_Little3',
                  rightThumbProximal: 'J_Bip_R_Thumb1',
                  rightThumbIntermediate: 'J_Bip_R_Thumb2',
                  rightThumbDistal: 'J_Bip_R_Thumb3',
                  rightIndexProximal: 'J_Bip_R_Index1',
                  rightIndexIntermediate: 'J_Bip_R_Index2',
                  rightIndexDistal: 'J_Bip_R_Index3',
                  rightMiddleProximal: 'J_Bip_R_Middle3',
                  rightMiddleIntermediate: 'J_Bip_R_Middle2',
                  rightMiddleDistal: 'J_Bip_R_Middle1',
                  rightRingProximal: 'J_Bip_R_Ring1',
                  rightRingIntermediate: 'J_Bip_R_Ring2',
                  rightRingDistal: 'J_Bip_R_Ring3',
                  rightLittleProximal: 'J_Bip_R_Little1',
                  rightLittleIntermediate: 'J_Bip_R_Little2',
                  rightLittleDistal: 'J_Bip_R_Little3',
                  upperChest: 'J_Bip_C_UpperChest',
                };
                const humanBones = [];
                for (const k in boneNodeMapping) {
                  const boneName = boneNodeMapping[k];
                  const boneNodeIndex = nodes.findIndex(node => node.name === boneName);
                  if (boneNodeIndex !== -1) {
                    const boneSpec = {
                      bone: k,
                      node: boneNodeIndex,
                      // useDefaultValues: true, // needed?
                    };
                    humanBones.push(boneSpec);
                  } else {
                    console.log('failed to find bone', boneNodeMapping, k, nodes, boneNodeIndex);
                  }
                }
                if (!app.glb.parser.json.extensions) {
                  app.glb.parser.json.extensions = {};
                }
                app.glb.parser.json.extensions.VRM = {
                  humanoid: {
                    humanBones,
                  },
                };
              };
              _mixamoRigToFakeVRMHack();
              const bindSpec = Avatar.bindAvatar(app.glb);
  
              // skeleton = bindSpec.skeleton;
              modelBones = bindSpec.modelBones;
            }
          }
          
          // app.wear();
        }
      } else {
        _unwear();
      }
    };
    app.addEventListener('wearupdate', wearupdate);

    const _unwear = () => {
      if (wearSpec) {
        app.scale.copy(initialScale);
        app.updateMatrixWorld();

        wearSpec = null;
        modelBones = null;
      }
    };

    const _copyBoneAttachment = spec => {
      const {boneAttachment = 'hips', position, quaternion, scale} = spec;
      const boneName = Avatar.modelBoneRenames[boneAttachment];
      const bone = localPlayer.avatar.foundModelBones[boneName];
      if (bone) {
        bone.matrixWorld
          .decompose(app.position, app.quaternion, app.scale);
        if (Array.isArray(position)) {
          app.position.add(localVector.fromArray(position).applyQuaternion(app.quaternion));
        }
        if (Array.isArray(quaternion)) {
          app.quaternion.multiply(localQuaternion.fromArray(quaternion));
        }
        if (Array.isArray(scale)) {
          app.scale.multiply(localVector.fromArray(scale));
        }
        app.updateMatrixWorld();
      } else {
        console.warn('invalid bone attachment', {app, boneAttachment});
      }
    };
    const frame = metaversefile.useFrame(({timestamp, timeDiff}) => {
      // const localPlayer = metaversefile.useLocalPlayer();
      if (wearSpec && localPlayer.avatar) {
        const {instanceId} = app;

        // animations
        if (app.glb) {
          const appAimAction = Array.from(localPlayer.getActionsState())
            .find(action => action.type === 'aim' && action.instanceId === instanceId);
          const {animations} = app.glb;

          const appAnimation = appAimAction?.appAnimation ? animations.find(a => a.name === appAimAction.appAnimation) : null;
          if (appAnimation && !appAimAnimationMixers) {
            const clip = animations.find(a => a.name === appAimAction.appAnimation);
            if (clip) {
              appAimAnimationMixers = [];
              app.glb.scene.traverse(o => {
                if (o.isMesh) {
                  const mixer = new THREE.AnimationMixer(o);
                  
                  const action = mixer.clipAction(clip);
                  action.setLoop(0, 0);
                  action.play();

                  const appAimAnimationMixer = {
                    update(deltaSeconds) {
                      mixer.update(deltaSeconds);
                    },
                    destroy() {
                      action.stop();
                    },
                  };
                  appAimAnimationMixers.push(appAimAnimationMixer);
                }
              });
            }
          } else if (appAimAnimationMixers && !appAnimation) {
            for (const appAimAnimationMixer of appAimAnimationMixers) {
              appAimAnimationMixer.destroy();
            }
            appAimAnimationMixers = null;
          }
        }
        // bone bindings
        {
          const appUseAction = Array.from(localPlayer.getActionsState())
            .find(action => action.type === 'use' && action.instanceId === instanceId);
          if (appUseAction?.boneAttachment && wearSpec.boneAttachment) {
            _copyBoneAttachment(appUseAction);
          } else {
            const appAimAction = Array.from(localPlayer.getActionsState())
              .find(action => action.type === 'aim' && action.instanceId === instanceId);
            if (appAimAction?.boneAttachment && wearSpec.boneAttachment) {
              _copyBoneAttachment(appAimAction);
            } else {
              if (modelBones) {
                Avatar.applyModelBoneOutputs(modelBones, localPlayer.avatar.modelBoneOutputs, localPlayer.avatar.getTopEnabled(), localPlayer.avatar.getBottomEnabled(), localPlayer.avatar.getHandEnabled(0), localPlayer.avatar.getHandEnabled(1));
                modelBones.Root.updateMatrixWorld();
              } else if (wearSpec.boneAttachment) {
                _copyBoneAttachment(wearSpec);
              }
            }
          }
        }
      }

      const petComponent = app.getComponent('pet');
      if (!petComponent) {
        if (appAimAnimationMixers) {
          const deltaSeconds = timeDiff / 1000;
          for (const mixer of appAimAnimationMixers) {
            mixer.update(deltaSeconds);
            app.updateMatrixWorld();
          }
        }
      }
    });

    return {
      remove() {
        // console.log('wear component remove');

        app.removeEventListener('wearupdate', wearupdate);
        metaversefile.clearFrame(frame);

        _unwear();
      },
    };
  },
  drop(app) {
    // console.log('call default component', new Error().stack);

    const localPlayer = metaversefile.useLocalPlayer();

    const dropComponent = app.getComponent('drop');
    if (dropComponent) {
      const glowHeight = 5;
      const glowGeometry = new THREE.CylinderBufferGeometry(0.01, 0.01, glowHeight)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, glowHeight/2, 0));
      const colors = new Float32Array(glowGeometry.attributes.position.array.length);
      glowGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const color = new THREE.Color(rarityColorsArray[Math.floor(Math.random() * rarityColorsArray.length)]);
      for (let i = 0; i < glowGeometry.attributes.color.array.length; i += 3) {
        color.toArray(glowGeometry.attributes.color.array, i);
      }
      const material = glowMaterial.clone();
      const glowMesh = new THREE.Mesh(glowGeometry, material);
      app.add(glowMesh);

      const velocity = dropComponent.velocity ? new THREE.Vector3().fromArray(dropComponent.velocity) : new THREE.Vector3();
      const angularVelocity = dropComponent.angularVelocity ? new THREE.Vector3().fromArray(dropComponent.angularVelocity) : new THREE.Vector3();
      let grounded = false;
      const startTime = performance.now();
      let animation = null;
      const timeOffset = Math.random() * 10;
      const frame = metaversefile.useFrame(e => {
        const {timestamp, timeDiff} = e;
        const timeDiffS = timeDiff/1000;
        const dropComponent = app.getComponent('drop');
        if (!grounded) {
          app.position
            .add(
              localVector.copy(velocity)
                .multiplyScalar(timeDiffS)
            );
          velocity.add(
            localVector.copy(physicsManager.getGravity())
              .multiplyScalar(timeDiffS)
          );
          
          const groundHeight = 0.1;
          if (app.position.y <= groundHeight) {
            app.position.y = groundHeight;
            const newDrop = JSON.parse(JSON.stringify(dropComponent));
            velocity.set(0, 0, 0);
            newDrop.velocity = velocity.toArray();
            app.setComponent('drop', newDrop);
            grounded = true;
          }
        }
        // if (grounded) {
          app.rotation.y += angularVelocity.y * timeDiff;
        // }
        
        glowMesh.visible = !animation;
        if (!animation) {
          localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector);
          localVector.y = 0;
          const distance = localVector.distanceTo(app.position);
          if (distance < 1) {
            // console.log('check 1');
            const timeSinceStart = timestamp - startTime;
            if (timeSinceStart > gracePickupTime) {
              // console.log('check 2');
              animation = {
                startPosition: app.position.clone(),
                startTime: timestamp,
                endTime: timestamp + 1000,
              };
            }
          }
        }
        if (animation) {
          const headOffset = 0.5;
          const bodyOffset = -0.3;
          const tailTimeFactorCutoff = 0.8;
          const timeDiff = timestamp - animation.startTime;
          const timeFactor = Math.min(Math.max(timeDiff / (animation.endTime - animation.startTime), 0), 1);
          if (timeFactor < 1) {
            if (timeFactor < tailTimeFactorCutoff) {
              const f = cubicBezier(timeFactor);
              localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector)
                .add(localVector2.set(0, headOffset, 0));
              app.position.copy(animation.startPosition).lerp(localVector, f);
            } else {
              {
                const f = cubicBezier(tailTimeFactorCutoff);
                localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, headOffset, 0));
                app.position.copy(animation.startPosition).lerp(localVector, f);
              }
              {
                const tailTimeFactor = (timeFactor - tailTimeFactorCutoff) / (1 - tailTimeFactorCutoff);
                const f = cubicBezier2(tailTimeFactor);
                localPlayer.avatar.modelBoneOutputs.Head.getWorldPosition(localVector)
                  .add(localVector2.set(0, bodyOffset, 0));
                app.position.lerp(localVector, f);
                app.scale.setScalar(1 - tailTimeFactor);
              }
            }
          } else {
            world.appManager.dispatchEvent(new MessageEvent('pickup', {
              data: {
                app,
              },
            }));
            world.appManager.removeApp(app);
            app.destroy();
          }
        }
        
        app.updateMatrixWorld();
      });
    }

    return {
      remove() {
        metaversefile.clearFrame(frame);
      },
    };
  },
};
export {
  componentTemplates,
};