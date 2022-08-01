import * as THREE from 'three';
import {scene, camera} from './renderer.js';
import physics from './physics-manager.js';
import physx from './physx.js';
import Avatar from './avatars/avatars.js';
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

const hitAttemptEventData = {
  type: '',
  args: null,
};
const hitAttemptEvent = new MessageEvent('hitattempt', {
  data: hitAttemptEventData,
});


// player.characterHitter.attemptHit({
//   type: 'sword',
//   args: {
//     hitRadius,
//     hitHalfHeight,
//     position: localVector,
//     quaternion: player.quaternion,
//   },
//   timestamp,
// });



export class CharacterHitter {
  constructor(player) {
    this.player = player;

    // this.lastHitTime = -Infinity;
    this.lastHitTimes = new WeakMap();
    this.lastHitIndices = new WeakMap();
  }
  attemptHit({
    type,
    args,
    timestamp = performance.now(),
  }) {
    hitAttemptEventData.type = type;
    hitAttemptEventData.args = args;
    hitManager.dispatchEvent(hitAttemptEvent);

    switch (type) {
      case 'sword': {
        const {
          sizeXHalf,
          sizeYHalf,
          sizeZHalf,
          position,
          quaternion,
        } = args;

        // if(this.player.isNpcPlayer) {
          physics.disableGeometryQueries(this.player.characterController);
        // }

        // const collision = physx.physxWorker.collideCapsulePhysics(
        //   physx.physics,
        //   hitRadius,
        //   hitHalfHeight,
        //   position, //this.player.position,
        //   quaternion, //this.player.quaternion,
        //   1
        // );

        const collision = physx.physxWorker.overlapBoxPhysics(physx.physics, sizeXHalf, sizeYHalf, sizeZHalf, position, quaternion);

        // if(this.player.isNpcPlayer) {
          physics.enableGeometryQueries(this.player.characterController);
        // }

        if (collision) {
          console.log(collision);
          collision.objectIds.forEach(objectId => {
            const collisionId = objectId;
//
            if(collisionId === window.localPlayer.characterController.physicsId) { // workaround, because metaversefile.getPairByPhysicsId currently doesnt return localPlayer's pair
              window.localPlayer.characterHitter.getHit(100);
            }
//
            const result = metaversefile.getPairByPhysicsId(collisionId);
            if (result) {
              console.log(result);
              const [app, physicsObject] = result;
              if (app.getComponent('vincibility') !== 'invincible') {
                const lastHitTime = this.lastHitTimes.get(app) ?? 0;
                const lastHitIndex = this.lastHitIndices.get(app) ?? -1;
                const timeDiff = timestamp - lastHitTime;
                const useAction = this.player.getAction('use');
                if (useAction.index !== lastHitIndex || timeDiff > 1000) {
                  console.log(objectId);
                  const damage = typeof useAction.damage === 'number' ? useAction.damage : 10;
                  const hitDirection = app.position.clone()
                    .sub(position);
                  hitDirection.y = 0;
                  hitDirection.normalize();
  
                  const hitPosition = position.clone();
                  localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
                  localEuler.x = 0;
                  localEuler.z = 0;
                  const hitQuaternion = localQuaternion.setFromEuler(localEuler);
  
                  // const willDie = app.willDieFrom(damage);
                  app.hit(damage, {
                    type: 'sword',
                    collisionId,
                    physicsObject,
                    hitPosition,
                    hitQuaternion,
                    hitDirection,
                    // willDie,
                  });
  
                  this.lastHitTimes.set(app, timestamp);
                  this.lastHitIndices.set(app, useAction.index);
                }
              }
            }
            
    //       const collisionId = collision.objectId;
    //       if(collisionId === window.localPlayer.characterController.physicsId) { // workaround, because metaversefile.getPairByPhysicsId currently doesnt return localPlayer's pair
    //         window.localPlayer.characterHitter.getHit(100);
    //       }

    //       const result = metaversefile.getPairByPhysicsId(collisionId);
    //       if (result) {
    //         const [app, physicsObject] = result;
    //         const timeDiff = timestamp - this.lastHitTime;
    //         if (timeDiff > 1000) {
    //           const useAction = this.player.getAction('use');
    //           const damage = typeof useAction.damage === 'number' ? useAction.damage : 0;
    //           const hitDirection = app.position.clone()
    //             .sub(this.player.position);
    //           hitDirection.y = 0;
    //           hitDirection.normalize();
    
    //           const damageMeshOffsetDistance = 1.5;
    //           const hitPosition = localVector.copy(this.player.position)
    //             .add(localVector2.set(0, 0, -damageMeshOffsetDistance).applyQuaternion(this.player.quaternion))
    //             .clone();
    //           localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
    //           localEuler.x = 0;
    //           localEuler.z = 0;
    //           const hitQuaternion = localQuaternion.setFromEuler(localEuler);
    // console.log('HIT');
    //           // const willDie = app.willDieFrom(damage);
    //           app.hit(damage, {
    //             type: 'sword',
    //             collisionId,
    //             physicsObject,
    //             hitPosition,
    //             hitQuaternion,
    //             hitDirection,
    //             // willDie,
    //           });
            
    //           this.lastHitTime = timestamp;

    //           return collision;
    //         }
    //       }
    });
          return null;
        }
      }
      case 'bullet': {
        const result = physics.raycast(args.position, args.quaternion);
        if (result) {
          const _performHit = () => {
            const targetApp = metaversefile.getAppByPhysicsId(result.objectId);
            if (targetApp) {
              const damage = 2;

              const hitPosition = new THREE.Vector3().fromArray(result.point);
              const hitQuaternion = new THREE.Quaternion().setFromRotationMatrix(
                localMatrix.lookAt(
                  this.player.position,
                  hitPosition,
                  localVector.set(0, 1, 0)
                )
              );

              const hitDirection = targetApp.position.clone()
                .sub(this.player.position);
              // hitDirection.y = 0;
              hitDirection.normalize();
              
              // const willDie = targetApp.willDieFrom(damage);
              targetApp.hit(damage, {
                type: 'bullet',
                collisionId: result.objectId,
                hitPosition,
                hitDirection,
                hitQuaternion,
                // willDie,
              });
            } else {
              console.warn('no app with physics id', result.objectId);
            }
          };
          _performHit();

          return result
        }
        return null;
      }
      default: {
        throw new Error('unknown hit type :' + type);
      }
    }
  }
  getHit(damage) {
    // debugger
    const newAction = {
      type: 'hurt',
      animation: Math.random() < 0.5 ? 'pain_arch' : 'pain_back',
    };
    console.log('add hurtAction', 'character-hitter.js')
    const hurtAction = this.player.addAction(newAction);

    const emotions = [
      // 'joy',
      // 'fun',
      'sorrow',
      'angry',
      // 'neutral',
      'surprise',
    ];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const faceposeAction = this.player.addAction({
      type: 'facepose',
      emotion,
      value: 1,
    });

    const gruntTypes = [
      'hurt',
      'scream',
      'attack',
      'angry',
      'gasp',
    ];
    const gruntType = gruntTypes[Math.floor(Math.random() * gruntTypes.length)];
    // console.log('play grunt', emotion, gruntType);
    this.player.characterSfx.playGrunt(gruntType);

    {
      const damageMeshApp = metaversefile.createApp();
      (async () => {
        await metaverseModules.waitForLoad();
        const {modules} = metaversefile.useDefaultModules();
        const m = modules['damageMesh'];
        await damageMeshApp.addModule(m);
      })();
      damageMeshApp.position.copy(this.player.position);
      localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
      localEuler.x = 0;
      localEuler.z = 0;
      damageMeshApp.quaternion.setFromEuler(localEuler);
      damageMeshApp.updateMatrixWorld();
      scene.add(damageMeshApp);
    }

    const animations = Avatar.getAnimations();
    const hurtAnimation = animations.find(a => a.isHurt);
    const hurtAnimationDuration = hurtAnimation.duration;
    setTimeout(() => {
      const hurtActionIndex = this.player.indexOfAction(hurtAction);
      this.player.removeActionIndex(hurtActionIndex);
    }, hurtAnimationDuration * 1000);
    setTimeout(() => {
      const faceposeActionIndex = this.player.indexOfAction(faceposeAction);
      this.player.removeActionIndex(faceposeActionIndex);
    }, 1000);
  }
  update() {
    // nothing
  }
}
const hitManager = new EventTarget();
export default hitManager;