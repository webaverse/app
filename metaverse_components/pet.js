import * as THREE from 'three';
import { CapsuleGeometry } from '../CapsuleGeometry.js';
import metaversefile from 'metaversefile';
import physicsManager from '../physics-manager';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const downQuaternion = new THREE.Quaternion(
  0.7071068, 0, 0, 0.7071068
);

let lastZDirection = 0;

const physicsIds = [];

export default (app, component) => {
  const {
    useFrame,
    usePhysics,
    useCleanup,
    useLocalPlayer,
    useRemotePlayers,
    getPlayerByAppInstanceId,
    useActivate,
  } = metaversefile;

  // app.rotation.y += Math.PI / 2;
  const physics = usePhysics();

  const petHeight = 0.01;
  const petWidth = 1.04;

  const physicsScene = physicsManager.getScene();
  const heightFactor = 1;
  const baseRadius = 0.2;
  const radius = (baseRadius / heightFactor) * petHeight;
  const capsuleHeight = petHeight - radius * 2;

  const contactOffset = (0.1 / heightFactor) * petHeight;
  const stepOffset = (0.5 / heightFactor) * petHeight;

  const characterController = physicsScene.createCharacterController(
    radius - contactOffset,
    capsuleHeight,
    contactOffset,
    stepOffset,
    app.position
  );

  // const capsuleGeometry = new CapsuleGeometry(
  //   radius - contactOffset,
  //   radius - contactOffset,
  //   capsuleHeight,
  //   contactOffset,
  //   stepOffset
  // );
  // const debugCapsuleMesh = new THREE.Mesh(
  //   capsuleGeometry,
  //   new THREE.MeshBasicMaterial()
  // );

  const debugCapsuleMesh = characterController.children[0];
  debugCapsuleMesh.visible = true;

  app.add(debugCapsuleMesh);

  // const debugCapsuleId = physics.addGeometry(debugCapsuleMesh);
  // physicsIds.push(debugCapsuleId);

  // const physicsObject = physicsScene.addCapsuleGeometry(app.position, app.quaternion, 0.2, 0.05);

  let petSpec = null;
  let petMixer = null;
  let idleAction = null;
  let walkAction = null;
  let runAction = null;
  let rootBone = null;

  let player = null;

  const petComponent = component;
  const _makePetMixer = () => {
    let petMixer, idleAction;

    let firstMesh = null;
    app.glb.scene.traverse((o) => {
      if (firstMesh === null && o.isMesh) {
        firstMesh = o;
      }
    });
    petMixer = new THREE.AnimationMixer(firstMesh);

    const idleAnimation = petComponent.idleAnimation
      ? app.glb.animations.find((a) => a.name === petComponent.idleAnimation)
      : null;
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
  app.addEventListener('wearupdate', (e) => {
    if (e.wear) {
      player = getPlayerByAppInstanceId(app.instanceId);
      if (app.glb) {
        const { animations } = app.glb;

        petSpec = app.getComponent('pet');
        if (petSpec) {
          const walkAnimation =
            petSpec.walkAnimation &&
            petSpec.walkAnimation !== petSpec.idleAnimation
              ? animations.find((a) => a.name === petSpec.walkAnimation)
              : null;
          if (walkAnimation) {
            walkAction = petMixer.clipAction(walkAnimation);
            walkAction.play();
          }
          const runAnimation =
            petSpec.runAnimation &&
            petSpec.runAnimation !== petSpec.idleAnimation
              ? animations.find((a) => a.name === petSpec.runAnimation)
              : null;
          if (runAnimation) {
            runAction = petMixer.clipAction(runAnimation);
            runAction.play();
          }
        }
      }
    } else {
      _unwear();
    }
  });

  const smoothVelocity = new THREE.Vector3();
  const lastLookQuaternion = new THREE.Quaternion();
  const _getAppDistance = () => {
    const position = player.position.clone();

    // setting the height of the y as the height of the ground
    const collisionToGround = physics.raycast(position, downQuaternion);
    if (collisionToGround) {
      position.y = collisionToGround.point[1];
    }
    // position.y = 0;

    const distance = app.position.distanceTo(position);
    return { distance, position };
  };
  const minDistance = 1;
  const _isFar = (distance) => distance - minDistance > 0.01;

  let fallLoopStartTimeS = 0;
  let lastGravityH = 0;
  const startFallingPosition = new THREE.Vector3(0, 0, 0);

  useFrame(({ timestamp, timeDiff }) => {
    const nowS = timestamp / 1000;
    const timeDiffS = timeDiff / 1000;
    const timeDiffCapped = Math.min(Math.max(timeDiff, 0), 100);
    const timeDiffSCapped = timeDiffCapped / 1000;

    if (fallLoopStartTimeS == 0) {
      fallLoopStartTimeS = nowS;
      startFallingPosition.copy(app.position);
      localVector.set(0, 0, 0);
    }
    const t = nowS - fallLoopStartTimeS;
    const h = 0.5 * physicsScene.getGravity().y * t * t;

    const displacement = localVector.set(0, h - lastGravityH, 0);
    smoothVelocity.add(displacement);
    const flags = physicsScene.moveCharacterController(
      characterController,
      smoothVelocity,
      0,
      timeDiffSCapped,
      app.position
    );

    lastGravityH = h;

    let grounded = !!(flags & 0x1);
    if (grounded) {
      fallLoopStartTimeS = 0;
      startFallingPosition.set(0, 0, 0);
      lastGravityH = 0;
    } 

    // components
    const _updateAnimation = () => {
      // making sure the nose of the pet hits the physics object in front of it
      app.position.z -= (petWidth / 2) * lastZDirection;

      if (petComponent) {
        if (rootBone) {
          rootBone.quaternion.copy(rootBone.originalQuaternion);
          rootBone.updateMatrixWorld();
        }
        if (petMixer) {
          // animated pet
          if (petSpec) {
            // activated pet
            const speed = 0.0014;

            const { distance, position } = _getAppDistance();

            const moveDelta = localVector;
            moveDelta.setScalar(0);

            if (_isFar(distance)) {
              // handle rounding errors
              const direction = position.sub(app.position).normalize();
              const maxMoveDistance = distance - minDistance;
              const moveDistance = Math.min(speed * timeDiff, maxMoveDistance);
              moveDelta.copy(direction).multiplyScalar(moveDistance);
              app.position.add(moveDelta);
              app.quaternion.slerp(
                localQuaternion.setFromUnitVectors(
                  localVector2.set(0, 0, 1),
                  direction
                ),
                0.1
              );

              lastZDirection = direction.z;

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
            const runSpeed = 0.03;
            const currentSpeed = smoothVelocity.length();
            if (walkAction) {
              walkAction.weight = Math.min(currentSpeed / walkSpeed, 1);
            }
            if (runAction) {
              runAction.weight = Math.min(
                Math.max(
                  (currentSpeed - walkSpeed) / (runSpeed - walkSpeed),
                  0
                ),
                1
              );
            }
            if (idleAction) {
              if (walkAction || runAction) {
                idleAction.weight = 1 - Math.min(currentSpeed / walkSpeed, 1);
              } else {
                idleAction.weight = 1;
              }
            }
          } else {
            // unactivated pet
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
        app.glb.scene.traverse((o) => {
          if (skinnedMesh === null && o.isSkinnedMesh) {
            skinnedMesh = o;
          }
        });
        if (skinnedMesh) {
          const bone = skinnedMesh.skeleton.bones.find(
            (bone) => bone.name === lookComponent.rootBone
          );
          if (bone) {
            rootBone = bone;
            if (!bone.originalQuaternion) {
              bone.originalQuaternion = bone.quaternion.clone();
            }
            if (!bone.originalWorldScale) {
              bone.originalWorldScale = bone.getWorldScale(new THREE.Vector3());
            }

            if (!bone.quaternion.equals(lastLookQuaternion)) {
              const { position } = nearestPlayer;
              localQuaternion2
                .setFromRotationMatrix(
                  localMatrix.lookAt(
                    position,
                    bone.getWorldPosition(localVector),
                    localVector2.set(0, 1, 0)
                  )
                )
                .premultiply(localQuaternion.copy(app.quaternion).invert());
              localEuler.setFromQuaternion(localQuaternion2, 'YXZ');
              localEuler.y = Math.min(
                Math.max(localEuler.y, -Math.PI * 0.5),
                Math.PI * 0.5
              );
              localQuaternion2
                .setFromEuler(localEuler)
                .premultiply(app.quaternion);

              bone.matrixWorld.decompose(
                localVector,
                localQuaternion,
                localVector2
              );
              localQuaternion
                .copy(localQuaternion2)
                .multiply(
                  localQuaternion3.copy(bone.originalQuaternion).invert()
                )
                .normalize();
              bone.matrixWorld.compose(
                localVector,
                localQuaternion,
                bone.originalWorldScale
              );
              bone.matrix
                .copy(bone.matrixWorld)
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
