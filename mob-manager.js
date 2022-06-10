import * as THREE from 'three';
import metaversefile from 'metaversefile';
// import {scene} from './renderer.js';
import {getLocalPlayer} from './players.js';
import physicsManager from './physics-manager.js';
import hpManager from './hp-manager.js';
import {LodChunkTracker} from './lod.js';
import {alea} from './procgen/procgen.js';
import {createRelativeUrl} from './util.js';
import dropManager from './drop-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector6 = new THREE.Vector3();
const localVector7 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const upVector = new THREE.Vector3(0, 1, 0);
const chunkWorldSize = 30;
const minDistance = 1;
const hitDistance = 1.5;

const _zeroY = v => {
  v.y = 0;
  return v;
};

function makeCharacterController(app, {
  radius,
  height,
  physicsOffset,
}) {
  // const radius = 0.2;
  const innerHeight = height - radius * 2;
  const contactOffset = 0.1 * height;
  const stepOffset = 0.1 * height;

  // app.matrixWorld.decompose(localVector, localQuaternion, localVector2);
  const characterPosition = localVector.setFromMatrixPosition(app.matrixWorld)
    .add(
      localVector3.copy(physicsOffset)
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

    this.name = this.app.name + '@' + this.app.position.toArray().join(',');

    this.updateFns = [];
    this.cleanupFns = [];

    if (srcUrl) {
      (async () => {
        await this.loadApp(srcUrl);
      })();
    }
  }
  #getRng() {
    return alea(this.name);
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
        physicsPosition = [0, 0, 0],
        // physicsQuaternion = [0, 0, 0],
        // modelPosition = [0, 0, 0],
        modelQuaternion = [0, 0, 0, 1],
        extraPhysics = [],
      } = mobComponent;
      mobUrl = createRelativeUrl(mobUrl, mobJsonUrl);
      const physicsOffset = new THREE.Vector3().fromArray(physicsPosition);
      // const physicsRotation = new THREE.Quaternion().fromArray(physicsQuaternion);
      // const modelOffset = new THREE.Vector3().fromArray(modelPosition);
      const modelPrerotation = new THREE.Quaternion().fromArray(modelQuaternion);

      const subApp = await metaversefile.createAppAsync({
        start_url: mobUrl,
        position: this.app.position,
        quaternion: this.app.quaternion,
        scale: this.app.scale,
      });
      if (!live) return;

      const rng = this.#getRng();
      const numDrops = Math.floor(rng() * 3) + 1;
      let lastHitTime = 0;

      const _attachToApp = () => {
        this.app.add(subApp);
        this.subApp = subApp;

        this.app.position.set(0, 0, 0);
        this.app.quaternion.identity();
        this.app.scale.set(1, 1, 1);
        this.app.updateMatrixWorld();

        this.cleanupFns.push(() => {
          this.app.clear();
        });
      };
      _attachToApp();

      const _drop = () => {
        const {moduleUrls} = metaversefile.useDefaultModules();
        const silkStartUrl = moduleUrls.silk;
        for (let i = 0; i < numDrops; i++) {
          dropManager.createDropApp({
            start_url: silkStartUrl,
            position: subApp.position.clone()
              .add(new THREE.Vector3(0, 0.7, 0)),
            quaternion: subApp.quaternion,
            scale: subApp.scale
          });
        }
      };
      const _bindHitTracker = () => {
        const hitTracker = hpManager.makeHitTracker();
        hitTracker.bind(subApp);
        subApp.dispatchEvent({type: 'hittrackeradded'});
        const die = () => {
          this.app.destroy();
          _drop();
        };
        subApp.addEventListener('die', die, {once: true});
      };
      _bindHitTracker();

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
        physicsOffset,
      });
      const _getPhysicsExtraPositionQuaternion = (
        spec,
        localVector,
        localQuaternion,
        localVector2,
        localMatrix
      ) => {
        const {
          position,
          quaternion,
        } = spec;
        
        localVector.fromArray(position);
        localQuaternion.fromArray(quaternion);
        localVector2.set(1, 1, 1);
        localMatrix.compose(localVector, localQuaternion, localVector2)
          .premultiply(mesh.matrixWorld)
          .decompose(localVector, localQuaternion, localVector2);
      };
      const extraPhysicsObjects = extraPhysics.map(spec => {
        const {
          radius,
          halfHeight,
        } = spec;
        _getPhysicsExtraPositionQuaternion(spec, localVector, localQuaternion, localVector2, localMatrix);
        const physicsObject = physicsManager.addCapsuleGeometry(localVector, localQuaternion, radius, halfHeight);
        physicsObject.spec = spec;
        return physicsObject;
      });
      const physicsObjects = [characterController].concat(extraPhysicsObjects);
      subApp.getPhysicsObjects = () => physicsObjects;

      this.cleanupFns.push(() => {
        physicsManager.destroyCharacterController(characterController);
        for (const extraPhysicsObject of extraPhysicsObjects) {
          physicsManager.removeGeometry(extraPhysicsObject);
        }
      });

      // rotation hacks
      {
        mesh.position.y = 0;
        localEuler.setFromQuaternion(mesh.quaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        mesh.quaternion.setFromEuler(localEuler);
      }

      // initialize animation
      const idleAnimationClips = idleAnimation.map(name => animations.find(a => a.name === name)).filter(a => !!a);
      if (idleAnimationClips.length > 0) {
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

      // set up frame loop
      let animation = null;
      let velocity = new THREE.Vector3(0, 0, 0);
      this.updateFns.push((timestamp, timeDiff) => {
        const localPlayer = getLocalPlayer();
        const timeDiffS = timeDiff / 1000;

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
          // decompose world transform
          mesh.matrixWorld.decompose(localVector2, localQuaternion, localVector3);
          const meshPosition = localVector2;
          const meshQuaternion = localQuaternion;
          const meshScale = localVector3;

          const meshPositionY0 = localVector4.copy(meshPosition);
          const characterPositionY0 = localVector5.copy(localPlayer.position)
            .add(localVector6.set(0, localPlayer.avatar ? -localPlayer.avatar.height : 0, 0));
          const distance = meshPositionY0.distanceTo(characterPositionY0);

          _zeroY(meshPositionY0);
          _zeroY(characterPositionY0);

          const _handleAggroMovement = () => {
            if (distance < aggroDistance) {
              if (distance > minDistance) {
                const movementDirection = _zeroY(characterPositionY0.sub(meshPositionY0))
                  .normalize();
                const maxMoveDistance = distance - minDistance;
                const moveDistance = Math.min(walkSpeed * timeDiff * 1000, maxMoveDistance);
                const moveDelta = localVector6.copy(movementDirection)
                  .multiplyScalar(moveDistance)
                  .add(localVector7.copy(velocity).multiplyScalar(timeDiffS));
                const minDist = 0;

                const popExtraGeometry = (() => {
                  for (const extraPhysicsObject of extraPhysicsObjects) {
                    physicsManager.disableActor(extraPhysicsObject);
                  }
                  return () => {
                    for (const extraPhysicsObject of extraPhysicsObjects) {
                      physicsManager.enableActor(extraPhysicsObject);
                    }
                  };
                })();

                const flags = physicsManager.moveCharacterController(
                  characterController,
                  moveDelta,
                  minDist,
                  timeDiffS,
                  characterController.position
                );
                popExtraGeometry();

                // const collided = flags !== 0;
                let grounded = !!(flags & 0x1);
                if (!grounded) {                  
                  velocity.add(
                    localVector.copy(physicsManager.getGravity())
                      .multiplyScalar(timeDiffS)
                  );
                } else {
                  velocity.set(0, 0, 0);
                }

                meshPosition.copy(characterController.position)
                  .sub(physicsOffset);
                
                const targetQuaternion = localQuaternion2
                  .setFromRotationMatrix(
                    localMatrix
                      .lookAt(
                        meshPosition,
                        localPlayer.position,
                        upVector
                      )
                  ).premultiply(modelPrerotation);
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
              }
            }
          };
          _handleAggroMovement();

          const _handleAggroHit = () => {
            if (distance < hitDistance) {
              const timeSinceLastHit = timestamp - lastHitTime;
              if (timeSinceLastHit > 1000) {
                localPlayer.characterHitter.getHit(Math.random() * 10);
                lastHitTime = timestamp;
              }
            }
          };
          _handleAggroHit();

          const _updateExtraPhysics = () => {
            for (const extraPhysicsObject of extraPhysicsObjects) {
              const {spec} = extraPhysicsObject;

              _getPhysicsExtraPositionQuaternion(spec, localVector, localQuaternion, localVector2, localMatrix);

              extraPhysicsObject.position.copy(localVector);
              extraPhysicsObject.quaternion.copy(localQuaternion);
              extraPhysicsObject.updateMatrixWorld();
              physicsManager.setTransform(extraPhysicsObject);
            }
          };
          _updateExtraPhysics();
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
  getPhysicsObjects() {
    if (this.subApp) {
      return this.subApp.getPhysicsObjects();
    } else {
      return [];
    }
  }
  update(timestamp, timeDiff) {
    for (const fn of this.updateFns) {
      fn(timestamp, timeDiff);
    }
  }
  destroy() {
    for (const fn of this.cleanupFns) {
      fn();
    }
  }
}

class MobGenerator {
  constructor(parent) {
    this.object = new THREE.Object3D();
    this.object.name = 'mob-chunks';

    // parameters
    this.parent = parent;

    // members
    // this.physicsObjects = [];
  }
  generateChunk(chunk) {
    const rng = alea(chunk.name);

    if (rng() < 0.2) {
      const i = 0;
      const mobModuleNames = this.parent.getMobModuleNames();
      const mobModuleName = mobModuleNames[Math.floor(rng() * mobModuleNames.length)];
      const mobModule = this.parent.mobModules[mobModuleName];

      const r = n => -n + rng() * n * 2;
      const app = metaversefile.createApp({
        position: chunk.clone()
          .multiplyScalar(chunkWorldSize)
          .add(new THREE.Vector3(rng() * chunkWorldSize, 0, rng() * chunkWorldSize)),
        quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r(Math.PI)),
      });
      app.name = chunk.name + '-' + i;
      (async () => {
        await app.addModule(mobModule);
      })();

      if (!chunk.binding) {
        chunk.binding = {
          apps: [],
        };
      }
      chunk.binding.apps.push(app);
      
      this.object.add(app);
      app.updateMatrixWorld();
      
      app.addEventListener('destroy', e => {
        this.object.remove(app);
        const index = chunk.binding.apps.indexOf(app);
        chunk.binding.apps.splice(index, 1);
      });

      /* this.dispatchEvent(new MessageEvent('appadd', {
        data: {
          app,
        },
      })); */
    }
  }
  disposeChunk(chunk) {
    if (chunk.binding) {
      for (const app of chunk.binding.apps) {
        // this.object.remove(app);

        /* this.dispatchEvent(new MessageEvent('appremove', {
          data: {
            app,
          },
        })); */

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
    // scene.add(this.object);

    this.mobModules = {};
    // this.apps = [];
    this.compiled = false;
    
    this.generator = new MobGenerator(this);
    /* this.generator.addEventListener('appadd', e => {
      const {app} = e.data;
      console.log('got app add', {app});
      this.apps.push(app);
    });
    this.generator.addEventListener('appremove', e => {
      const {app} = e.data;
      const index = this.apps.indexOf(app);
      this.apps.splice(index, 1);
    }); */
    this.tracker = new LodChunkTracker(this.generator, {
      chunkWorldSize,
    });
  }
  getMobModuleNames() {
    return Object.keys(this.mobModules).sort();
  }
  async addMobModule(srcUrl) {
    const m = await metaversefile.import(srcUrl);
    this.mobModules[srcUrl] = m;
  }
  compile() {
    this.compiled = true;
  }
  getChunks() {
    return this.generator.object;
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
    // scene.remove(this.object);
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
  getPhysicsObjects() {
    let results = [];
    for (const mob of this.mobs) {
      const physicsObjects = mob.getPhysicsObjects();
      results.push(physicsObjects);
    }
    results = results.flat();
    return results;
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