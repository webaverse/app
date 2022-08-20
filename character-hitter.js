import * as THREE from 'three';
import {scene, camera} from './renderer.js';
import physics from './physics-manager.js';
// import physx from './physx.js';
import Avatar from './avatars/avatars.js';
import metaversefile from 'metaversefile';
import * as metaverseModules from './metaverse-modules.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

//

const physicsScene = physics.getScene();
// const y180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

//

const hitAttemptEventData = {
  type: '',
  args: null,
};
const hitAttemptEvent = new MessageEvent('hitattempt', {
  data: hitAttemptEventData,
});

export class CharacterHitter {
  constructor(character) {
    this.character = character;

    this.lastHitTime = -Infinity;
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
          hitRadius,
          hitHalfHeight,
          position,
          quaternion,
        } = args;
        const collision = physicsScene.getCollisionObject(
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
              const useAction = this.character.getAction('use');
              const damage = typeof useAction.damage === 'number' ? useAction.damage : 10;
              const hitDirection = app.position.clone()
                .sub(this.character.position);
              hitDirection.y = 0;
              hitDirection.normalize();
    
              const damageMeshOffsetDistance = 1.5;
              const hitPosition = localVector.copy(this.character.position)
                .add(localVector2.set(0, 0, -damageMeshOffsetDistance).applyQuaternion(this.character.quaternion))
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

              return collision;
            }
          }
        }
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
                  this.character.position,
                  hitPosition,
                  localVector.set(0, 1, 0)
                )
              );

              const hitDirection = targetApp.position.clone()
                .sub(this.character.position);
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
    const newAction = {
      type: 'hurt',
      animation: Math.random() < 0.5 ? 'pain_arch' : 'pain_back',
    };
    const hurtAction = this.character.addAction(newAction);

    const emotions = [
      // 'joy',
      // 'fun',
      'sorrow',
      'angry',
      // 'neutral',
      'surprise',
    ];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const faceposeAction = this.character.addAction({
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
    this.character.characterSfx.playGrunt(gruntType);

    {
      const damageMeshApp = metaversefile.createApp();
      (async () => {
        await metaverseModules.waitForLoad();
        const {modules} = metaversefile.useDefaultModules();
        const m = modules['damageMesh'];
        await damageMeshApp.addModule(m);
      })();
      damageMeshApp.position.copy(this.character.position);
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
      const hurtActionIndex = this.character.indexOfAction(hurtAction);
      this.character.removeActionIndex(hurtActionIndex);
    }, hurtAnimationDuration * 1000);
    setTimeout(() => {
      const faceposeActionIndex = this.character.indexOfAction(faceposeAction);
      this.character.removeActionIndex(faceposeActionIndex);
    }, 1000);
  }
  update() {
    // nothing
  }
}
const hitManager = new EventTarget();
export default hitManager;