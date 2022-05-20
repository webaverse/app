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

    this.lastHitTime = -Infinity;
  }
  attemptHit({
    type,
    args,
    timestamp = performance.now(),
  }) {
    switch (type) {
      case 'sword': {
        const {
          hitRadius,
          hitHalfHeight,
          position,
          quaternion,
        } = args;
        const collision = physx.physxWorker.getCollisionObjectPhysics(
          physx.physics,
          hitRadius,
          hitHalfHeight,
          position,
          quaternion,
        );
        if (collision) {
          const collisionId = collision.objectId;
          const result = metaversefile.getPairByPhysicsId(collisionId);
          if (result) {
            const [app, physicsObject] = result;
            const timeDiff = timestamp - this.lastHitTime;
            if (timeDiff > 1000) {
              const useAction = this.player.getAction('use');
              const damage = typeof useAction.damage === 'number' ? useAction.damage : 10;
              const hitDirection = app.position.clone()
                .sub(this.player.position);
              hitDirection.y = 0;
              hitDirection.normalize();
    
              const damageMeshOffsetDistance = 1.5;
              const hitPosition = localVector.copy(this.player.position)
                .add(localVector2.set(0, 0, -damageMeshOffsetDistance).applyQuaternion(this.player.quaternion))
                .clone();
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
            
              this.lastHitTime = timestamp;

              return true;
            }
          }
        }
        return false;
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

          return true;
        }
        return false;
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