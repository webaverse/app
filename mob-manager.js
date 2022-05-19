import * as THREE from 'three';
import metaversefile from 'metaversefile';
import {scene} from './renderer.js';
import {getLocalPlayer} from './players.js';
import physicsManager from './physics-manager.js';
import {LodChunkTracker} from './lod.js';
import {alea} from './procgen/procgen.js';
import {createRelativeUrl} from './util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const upVector = new THREE.Vector3(0, 1, 0);
const chunkWorldSize = 30;

const _zeroY = v => {
  v.y = 0;
  return v;
};

function makeCharacterController(app, {
  radius,
  height,
  offset,
}) {
  // const radius = 0.2;
  const innerHeight = height - radius * 2;
  const contactOffset = 0.1 * height;
  const stepOffset = 0.1 * height;

  app.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  const characterPosition = localVector.setFromMatrixPosition(app.matrixWorld)
    .add(
      localVector3.copy(offset)
        .applyQuaternion(localQuaternion)
    );

  const characterController = physicsManager.createCharacterController(
    radius - contactOffset,
    innerHeight,
    contactOffset,
    stepOffset,
    characterPosition
  );
  // this.characterControllerObject = new THREE.Object3D();
  return characterController;
}

class Mob {
  constructor(app = null, srcUrl = '') {
    this.app = app;
    // this.srcUrl = srcUrl;
    this.subApp = null;

    this.updateFns = [];
    this.cleanupFns = [];

    if (srcUrl) {
      (async () => {
        await this.loadApp(srcUrl);
      })();
    }
  }
  async loadApp(mobJsonUrl) {
    let live = true;
    this.cleanupFns.push(() => {
      live = false;
    });

    const res = await fetch(mobJsonUrl);
    if (!live) return;
    const json = await res.json();
    if (!live) return;

    const mobComponent = json;
    if (mobComponent) {
      let {
        mobUrl = '',
        radius = 0.3,
        height = 1,
        position = [0, 0, 0],
      } = mobComponent;
      mobUrl = createRelativeUrl(mobUrl, mobJsonUrl);
      const offset = new THREE.Vector3().fromArray(position);

      const subApp = await metaversefile.createAppAsync({
        start_url: mobUrl,
        position: this.app.position,
        quaternion: this.app.quaternion,
        scale: this.app.scale,
      });
      if (!live) return;
      scene.add(subApp);
      subApp.updateMatrixWorld();
      this.subApp = subApp;

      this.cleanupFns.push(() => {
        scene.remove(subApp);
      });

      const mesh = subApp;
      const animations = subApp.glb.animations;
      let  {idleAnimation = ['idle'], aggroDistance, walkSpeed = 1} = mobComponent;
      if (idleAnimation) {
        if (!Array.isArray(idleAnimation)) {
          idleAnimation = [idleAnimation];
        }
      } else {
        idleAnimation = [];
      }

      const characterController = makeCharacterController(subApp, {
        radius,
        height,
        offset,
      });
      const physicsObjects = [characterController];
      subApp.getPhysicsObjects = () => physicsObjects;

      const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      if (idleAnimationClips.length > 0) {
        // hacks
        {
          mesh.position.y = 0;
          localEuler.setFromQuaternion(mesh.quaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          mesh.quaternion.setFromEuler(localEuler);
        }
        
        const mixer = new THREE.AnimationMixer(mesh);
        const idleActions = idleAnimationClips.map(idleAnimationClip => mixer.clipAction(idleAnimationClip));
        for (const idleAction of idleActions) {
          idleAction.play();
        }
        
        this.updateFns.push((timestamp, timeDiff) => {
          const deltaSeconds = timeDiff / 1000;
          mixer.update(deltaSeconds);
        });
      }

      let animation = null;
      this.updateFns.push((timestamp, timeDiff) => {
        const localPlayer = getLocalPlayer();
        const timeDiffS = timeDiff / 1000;
        // console.log('do update');

        /* const _updatePhysics = () => {
          const physicsIds = mesh.getPhysicsIds();
          for (const physicsId of physicsIds) {
            physicsManager.setPhysicsTransform(physicsId, mesh.position, mesh.quaternion, mesh.scale);
          }
        }; */

        if (animation) {
          mesh.position.add(localVector.copy(animation.velocity).multiplyScalar(timeDiff/1000));
          animation.velocity.add(localVector.copy(physicsManager.getGravity()).multiplyScalar(timeDiff/1000));
          if (mesh.position.y < 0) {
            animation = null;
          }

          physicsManager.setCharacterControllerPosition(characterController, mesh.position);

          mesh.updateMatrixWorld();
          
          // _updatePhysics();
        } else {
          // const head = rigManager.localRig.model.isVrm ? rigManager.localRig.modelBones.Head : rigManager.localRig.model;
          // const position = localVector.copy(localPlayer.position)

          mesh.matrixWorld.decompose(localVector2, localQuaternion, localVector3);
          const meshPosition = localVector2;
          const meshQuaternion = localQuaternion;
          const meshScale = localVector3;

          const meshPositionY0 = _zeroY(localVector4.copy(meshPosition));
          const characterPositionY0 = _zeroY(localVector5.copy(localPlayer.position));

          const distance = meshPositionY0
            .distanceTo(characterPositionY0);
          if (distance < aggroDistance) {
            const minDistance = 1;
            if (distance > minDistance) {
              const direction = characterPositionY0.sub(meshPositionY0).normalize();
              const maxMoveDistance = distance - minDistance;
              const moveDistance = Math.min(walkSpeed * timeDiff * 1000, maxMoveDistance);
              const moveDelta = localVector6.copy(direction).multiplyScalar(moveDistance);
              const minDist = 0;

              const flags = physicsManager.moveCharacterController(
                characterController,
                moveDelta,
                minDist,
                timeDiffS,
                characterController.position
              );
              // window.flags = flags;

              meshPosition.copy(characterController.position)
                .sub(offset);
              
              const targetQuaternion = localQuaternion2
                .setFromRotationMatrix(
                  localMatrix
                    .lookAt(
                      meshPosition,
                      localPlayer.position,
                      upVector
                    )
                );
              localEuler.setFromQuaternion(targetQuaternion, 'YXZ');
              localEuler.x = 0;
              localEuler.y += Math.PI;
              localEuler.z = 0;
              localQuaternion2.setFromEuler(localEuler);
              meshQuaternion.slerp(targetQuaternion, 0.1);

              mesh.matrixWorld.compose(meshPosition, meshQuaternion, meshScale);
              mesh.matrix.copy(mesh.matrixWorld);
              if (app.parent) {
                mesh.matrix.premultiply(localMatrix.copy(app.parent.matrixWorld).invert());
              }
              mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
              
              // _updatePhysics();
            }
          }
        }
      });
      const hit = e => {
        const {hitQuaternion} = e;
        const euler = new THREE.Euler().setFromQuaternion(hitQuaternion, 'YXZ');
        euler.x = 0;
        euler.z = 0;
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        const hitSpeed = 1;
        animation = {
          velocity: new THREE.Vector3(0, 6, -5).applyQuaternion(quaternion).multiplyScalar(hitSpeed),
        };
      };
      subApp.addEventListener('hit', hit);
      this.cleanupFns.push(() => {
        subApp.removeEventListener('hit', hit);
      });
    }
  }
  update(timestamp, timeDiff) {
    for (const fn of this.updateFns) {
      fn(timestamp, timeDiff);
    }
  }
  destroy() {
    console.log('destroy mob', this);
    for (const fn of this.cleanupFns) {
      fn();
    }
  }
}

class MobGenerator {
  constructor(parent) {
    // parameters
    this.parent = parent;

    // members
    // this.physicsObjects = [];
  }
  generateChunk(chunk) {
    const rng = alea(chunk.name);

    if (rng() < 0.2) {
      const mobModule = this.parent.mobModules[Math.floor(rng() * this.parent.mobModules.length)];

      const r = n => -n + rng() * n * 2;
      const app = metaversefile.createApp({
        position: chunk.clone()
          .multiplyScalar(chunkWorldSize)
          .add(new THREE.Vector3(r(chunkWorldSize), 0, r(chunkWorldSize))),
      });
      console.log('create app', app.position.toArray().join(','));
      (async () => {
        await app.addModule(mobModule);
      })();

      if (!chunk.binding) {
        chunk.binding = {
          apps: [],
        };
      }
      chunk.binding.apps.push(app);
    }
  }
  disposeChunk(chunk) {
    if (chunk.binding) {
      for (const app of chunk.binding.apps) {
        app.destroy();
      }
      chunk.binding = null;
    }

    /* for (const physicsObject of chunk.physicsObjects) {
      physicsManager.removeGeometry(physicsObject);

      const index = this.physicsObjects.findIndex(po => po.physicsId === physicsObject.physicsId);
      this.physicsObjects.splice(index, 1);
    }
    chunk.physicsObjects.length = 0; */
  }
  /* update(timestamp, timeDiff) {
    // nothing
  } */
  destroy() {
    // nothing; the owning lod tracker disposes of our contents
  }
}

class Mobber {
  constructor() {
    this.object = new THREE.Object3D();
    scene.add(this.object);

    this.mobModules = [];
    this.compiled = false;
    
    this.generator = new MobGenerator(this);
    this.tracker = new LodChunkTracker(this.generator, {
      chunkWorldSize,
    });
  }
  async addMobModule(srcUrl) {
    const m = await metaversefile.import(srcUrl);
    this.mobModules.push(m);
  }
  compile() {
    this.compiled = true;
  }
  getPhysicsObjects() {
    return [];
  }
  update(timestamp, timeDiff) {
    if (this.compiled) {
      const localPlayer = getLocalPlayer();
      this.tracker.update(localPlayer.position);
    }
  }
  destroy() {
    this.tracker.destroy();
    this.generator.destroy();
    scene.remove(this.object);
  }
}

class MobManager {
  constructor() {
    this.mobbers = [];
    this.mobs = [];
  }
  createMobber() {
    const mobber = new Mobber();
    this.mobbers.push(mobber);
    return mobber;
  }
  destroyMobber(mobber) {
    mobber.destroy();
    this.mobbers.splice(this.mobbers.indexOf(mobber), 1);
  }
  addMobApp(app, srcUrl) {
    console.log('add app', app.position.toArray().join(','));

    if (app.appType !== 'mob') {
      console.warn('not a mob app', app);
      throw new Error('only mob apps can be mobs');
    }
    if (!srcUrl) {
      console.warn('no srcUrl', app);
      throw new Error('srcUrl is required');
    }

    const mob = new Mob(app, srcUrl);
    this.mobs.push(mob);
  }
  removeMobApp(app) {
    const index = this.mobs.findIndex(mob => mob.app === app);
    if (index !== -1) {
      const mob = this.mobs[index];
      mob.destroy();
      this.mobs.splice(index, 1);
    }
  }
  update(timestamp, timeDiff) {
    for (const mobber of this.mobbers) {
      mobber.update(timestamp, timeDiff);
    }
    for (const mob of this.mobs) {
      mob.update(timestamp, timeDiff);
    }
  }
}
const mobManager = new MobManager();

export default mobManager;