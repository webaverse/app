import * as THREE from 'three';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

export default (app, component) => {
  const {useFrame, useCleanup, useLocalPlayer, useRemotePlayers, getPlayerByAppInstanceId, useActivate} = metaversefile;

  let petSpec = null;
  let petMixer = null;
  let idleAction = null;
  let walkAction = null;
  let runAction = null;
  let jumpAction = null;
  let hitAction = null;
  let attackAction = null;
  let rootBone = null;

  let player = null;

  const petComponent = component;
  const _makePetMixer = () => {
    let petMixer, idleAction;
    
    let firstMesh = null;
    app.glb.scene.traverse(o => {
      if (firstMesh === null && o.isMesh) {
        firstMesh = o;
      }
    });
    petMixer = new THREE.AnimationMixer(firstMesh);
    
    const idleAnimation = petComponent.idleAnimation ? app.glb.animations.find(a => a.name === petComponent.idleAnimation) : null;
    if (idleAnimation) {
      idleAction = petMixer.clipAction(idleAnimation);
      idleAction.play();
    } else {
      idleAction = null;
    }
    
    return {
      petMixer,
      idleAction,
    };
  };
  if (petComponent) {
    const m = _makePetMixer();
    petMixer = m.petMixer;
    idleAction = m.idleAction;
  }

  const _unwear = () => {
    if (petSpec) {
      petSpec = null;
      petMixer.stopAllAction();
      walkAction = null;
      runAction = null;
      rootBone = null;
      
      const m = _makePetMixer();
      petMixer = m.petMixer;
      idleAction = m.idleAction;
      player = null;
    }
  };
  app.addEventListener('wearupdate', e => {
    if (e.wear) {
      player = getPlayerByAppInstanceId(app.instanceId);
      if (app.glb) {
        const {animations} = app.glb;
        
        petSpec = app.getComponent('pet');
        if (petSpec) {
          const walkAnimation = (petSpec.walkAnimation && petSpec.walkAnimation !== petSpec.idleAnimation) ? animations.find(a => a.name === petSpec.walkAnimation) : null;
          if (walkAnimation) {
            walkAction = petMixer.clipAction(walkAnimation);
            walkAction.play();
          }
          const runAnimation = (petSpec.runAnimation && petSpec.runAnimation !== petSpec.idleAnimation) ? animations.find(a => a.name === petSpec.runAnimation) : null;
          if (runAnimation) {
            runAction = petMixer.clipAction(runAnimation);
            runAction.play();
          }
          const jumpAnimation = (petSpec.jumpAnimation && petSpec.jumpAnimation !== petSpec.idleAnimation) ? animations.find(a => a.name === petSpec.jumpAnimation) : null;
          if (jumpAnimation) {
            jumpAction = petMixer.clipAction(jumpAnimation);
            //jumpAction.play();
            jumpAction.loop = THREE.LoopOnce;
            //jumpAction.weight = 0;
          }
          const hitAnimation = (petSpec.hitAnimation && petSpec.hitAnimation !== petSpec.idleAnimation) ? animations.find(a => a.name === petSpec.hitAnimation) : null;
          if (hitAnimation) {
            //console.log("ya we got a hit animation");
            hitAction = petMixer.clipAction(hitAnimation);
            hitAction.play();
            hitAction.weight = 0;
          }
          const attackAnimation = (petSpec.attackAnimation && petSpec.attackAnimation !== petSpec.idleAnimation) ? animations.find(a => a.name === petSpec.attackAnimation) : null;
          if (attackAnimation) {
            //console.log("ya we got a hit animation");
            attackAction = petMixer.clipAction(attackAnimation);
            attackAction.loop = THREE.LoopOnce;
            //attackAction.play();
            //attackAction.weight = 0;
          }
        }
      }
    } else {
      _unwear();
    }
  });
  app.addEventListener('hit', e => {
      if(hitAction) {
        hitAction.weight = 1;
        setTimeout(() => {
          hitAction.weight = 0;
        }, hitAction._clip.duration, 1000);
      }
  });
  
  const smoothVelocity = new THREE.Vector3();
  const lastLookQuaternion = new THREE.Quaternion();
  const _getAppDistance = () => {
    const position = localVector.copy(player.position);
    position.y = app.position.y;
    const distance = app.position.distanceTo(position);
    return distance;
  };
  const minDistance = 1;
  const _isFar = distance => (distance - minDistance) > 0.01;
  const _shouldRun = distance => (distance - 5) > 0.01;
  useFrame(({timestamp, timeDiff}) => {
    // components
    const _updateAnimation = () => {
      // const petComponent = app.getComponent('pet');
      if (petComponent) {
        if (rootBone) {
          rootBone.quaternion.copy(rootBone.originalQuaternion);
          rootBone.updateMatrixWorld();
        }
        if (petMixer) { // animated pet
          if (petSpec) { // activated pet
            let speed = 0.0014;

            const fastSpeed = speed * 3;

            


            const distance = _getAppDistance();
            //console.log(distance);
            const moveDelta = localVector;
            moveDelta.setScalar(0);
            if (_isFar(distance)) { // handle rounding errors
              const position = player.position.clone();
              position.y = app.position.y;
              const direction = position.clone()
                .sub(app.position)
                .normalize();
              const maxMoveDistance = distance - minDistance;
              let speedFactor = Math.min(distance, 6);
              speed = 0.0014 * speedFactor;

            
              const moveDistance = Math.min(speed * timeDiff, maxMoveDistance);
              moveDelta.copy(direction)
                .multiplyScalar(moveDistance);
              app.position.add(moveDelta);
              app.quaternion.slerp(localQuaternion.setFromUnitVectors(localVector2.set(0, 0, 1), direction), 0.1);
              app.updateMatrixWorld();
            } /* else {
              // console.log('check', head === drop, component.attractedTo === 'fruit', typeof component.eatSpeed === 'number');
              if (head === drop && component.attractedTo === 'fruit' && typeof component.eatSpeed === 'number') {
                drop.scale.subScalar(1/component.eatSpeed*timeDiff);
                // console.log('new scale', drop.scale.toArray());
                if (drop.scale.x <= 0 || drop.scale.y <= 0 || drop.scale.z <= 0) {
                  dropManager.removeDrop(drop);
                }
              }
            } */
            smoothVelocity.lerp(moveDelta, 0.3);
            
            const walkSpeed = 0.01;
            const runSpeed = 0.06;
            const currentSpeed = smoothVelocity.length();

            let randomDecorate = (Math.random() > 0.99);
            let anims = [attackAction, jumpAction]
            let randomAnimation = Math.floor(Math.random() * anims.length);

            let factor = 0.1;

            if(currentSpeed < walkSpeed) {
              if(walkAction.weight > 0) {
                walkAction.weight -= factor;
              }
              if(runAction.weight > 0) {
                runAction.weight -= factor;
              }

              if(jumpAction.weight > 0) {
                //jumpAction.weight -= factor;
              }

              idleAction.weight = 1 - Math.min(currentSpeed / walkSpeed, 1);

              if(randomDecorate) {
                if(anims[randomAnimation] && !anims[randomAnimation].isRunning()) {
                  anims[randomAnimation].reset();
                  anims[randomAnimation].play();
                }
              }

            }
            else if (currentSpeed < runSpeed) {
              if(runAction.weight > 0) {
                runAction.weight -= factor;
              }
              if(idleAction.weight > 0) {
                idleAction.weight -= factor;
              }

              if(walkAction.weight < 1) {
                walkAction.weight += factor;
              }

              if(jumpAction.weight > 0) {
                //jumpAction.weight -= factor;
              }

              //walkAction.weight = Math.min(currentSpeed / walkSpeed, 1);
              // walk
            }
            else {
              if(walkAction.weight > 0) {
                walkAction.weight -= factor;
              }
              if(idleAction.weight > 0){
                idleAction.weight -= factor;
              }

              if(runAction.weight < 1) {
                runAction.weight += factor;
              }

              if(jumpAction.weight < 1) {
                //jumpAction.weight += factor;
              }

              //runAction.weight = Math.min(Math.max((currentSpeed - walkSpeed) / (runSpeed - walkSpeed), 0), 1);
              // run
            }

            // if (walkAction) {
            //   walkAction.weight = Math.min(currentSpeed / walkSpeed, 1);
            //   runAction.weight = 1 - walkAction.weight;
            // }
            // if (runAction) {
            //   runAction.weight = Math.min(Math.max((currentSpeed - walkSpeed) / (runSpeed - walkSpeed), 0), 1);
            //   walkAction.weight = 1 - runAction.weight;
            // }
            // if (idleAction) {
            //   if (walkAction || runAction) {
            //     idleAction.weight = 1 - Math.min(currentSpeed / walkSpeed, 1);
            //   } else {
            //     idleAction.weight = 1;
            //   }
            // }
          } else { // unactivated pet
            if (idleAction) {
              idleAction.weight = 1;
            }
          }
          const deltaSeconds = timeDiff / 1000;
          petMixer.update(deltaSeconds);
          app.updateMatrixWorld();
        }
      }
    };
    _updateAnimation();
    
    const _updateLook = () => {
      let nearestPlayer = useLocalPlayer();
      let nearestDistance = app.position.distanceTo(nearestPlayer.position);

      const players = useRemotePlayers();
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const distance = app.position.distanceTo(player.position);
        if (distance < nearestDistance) {
          nearestPlayer = player;
          nearestDistance = distance;
        }
      }

      const lookComponent = app.getComponent('look');
      if (lookComponent && app.glb) {
        let skinnedMesh = null;
        app.glb.scene.traverse(o => {
          if (skinnedMesh === null && o.isSkinnedMesh) {
            skinnedMesh = o;
          }
        });
        if (skinnedMesh) {
          const bone = skinnedMesh.skeleton.bones.find(bone => bone.name === lookComponent.rootBone);
          if (bone) {
            rootBone = bone;
            if (!bone.originalQuaternion) {
              bone.originalQuaternion = bone.quaternion.clone();
            }
            if (!bone.originalWorldScale) {
              bone.originalWorldScale = bone.getWorldScale(new THREE.Vector3());
            }
            
            if (!bone.quaternion.equals(lastLookQuaternion)) {
              const {position} = nearestPlayer;
              localQuaternion2.setFromRotationMatrix(
                localMatrix.lookAt(
                  position,
                  bone.getWorldPosition(localVector),
                  localVector2.set(0, 1, 0)
                )
              ).premultiply(localQuaternion.copy(app.quaternion).invert());
              localEuler.setFromQuaternion(localQuaternion2, 'YXZ');
              localEuler.y = Math.min(Math.max(localEuler.y, -Math.PI*0.5), Math.PI*0.5);
              localQuaternion2.setFromEuler(localEuler)
                .premultiply(app.quaternion);
              
              bone.matrixWorld.decompose(localVector, localQuaternion, localVector2);
              localQuaternion.copy(localQuaternion2)
                .multiply(localQuaternion3.copy(bone.originalQuaternion).invert())
                .normalize();
              bone.matrixWorld.compose(localVector, localQuaternion, bone.originalWorldScale);
              bone.matrix.copy(bone.matrixWorld)
                .premultiply(localMatrix.copy(bone.parent.matrixWorld).invert())
                .decompose(bone.position, bone.quaternion, bone.scale);
              bone.updateMatrixWorld();
              lastLookQuaternion.copy(bone.quaternion);
            }
          }
        }
      }
    };
    _updateLook();
  });
  
  useActivate(() => {
    app.wear();
  });
  
  useCleanup(() => {
    _unwear();
  });
  
  return app;
};