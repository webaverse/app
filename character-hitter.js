import * as THREE from 'three';
import {camera} from './renderer.js';
import physics from './physics-manager.js';
import physx from './physx.js';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

export class CharacterHitter {
  constructor(player) {
    this.player = player;

    this.lastHitTimes = new WeakMap();
    this.lastHitIndices = new WeakMap();
  }
  attemptHit({
    type,
    args,
    timestamp = performance.now(),
  }) {
    switch (type) {
      case 'sword': {
        const {
          sizeXHalf,
          sizeYHalf,
          sizeZHalf,
          position,
          quaternion,
        } = args;
        const collision = physx.physxWorker.overlapBoxPhysics(physx.physics, sizeXHalf, sizeYHalf, sizeZHalf,
          position, quaternion
        );
        collision.objectIds.forEach(objectId => {
          debugger
          const collisionId = objectId;
          const result = metaversefileApi.getPairByPhysicsId(collisionId);
          if (result) {
            const [app, physicsObject] = result;
            if (app.getComponent('vincibility') !== 'invincible') {
              const lastHitTime = this.lastHitTimes.get(app) ?? 0;
              const lastHitIndex = this.lastHitIndices.get(app) ?? -1;
              const timeDiff = timestamp - lastHitTime;
              const useAction = this.player.getAction('use');
              if (useAction.index !== lastHitIndex || timeDiff > 1000) {
                const damage = typeof useAction.damage === 'number' ? useAction.damage : 10;
                const hitDirection = app.position.clone()
                  .sub(this.player.position);
                hitDirection.y = 0;
                hitDirection.normalize();

                const hitPosition = localVector.copy(this.player.position)
                  // .add(localVector2.set(0, 0, -damageMeshOffsetDistance).applyQuaternion(this.player.quaternion)) // todo: no need?
                  .add(localVector2.set(0, 0, 0).applyQuaternion(this.player.quaternion)) // todo: no need?
                  .clone();
                localEuler.setFromQuaternion(camera.quaternion, 'YXZ');
                localEuler.x = 0;
                localEuler.z = 0;
                const hitQuaternion = new THREE.Quaternion().setFromEuler(localEuler);

                // const willDie = app.willDieFrom(damage);
                app.hit(damage, {
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
        });
        return null;
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
  update() {
    // nothing
  }
}