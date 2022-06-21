import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import metaversefile from 'metaversefile';
import {getLocalPlayer} from './players.js';
import physicsManager from './physics-manager.js';
import hpManager from './hp-manager.js';
// import {LodChunkTracker} from './lod.js';
import {alea} from './procgen/procgen.js';
import {createRelativeUrl} from './util.js';
import dropManager from './drop-manager.js';
import loaders from './loaders.js';
import {InstancedBatchedMesh, InstancedGeometryAllocator} from './instancing.js';
import {createTextureAtlas} from './atlasing.js';

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
const identityMatrix = new THREE.Matrix4();
const chunkWorldSize = 16;
const minDistance = 1;
const hitDistance = 1.5;
const maxAnisotropy = 16;

const maxInstancesPerDrawCall = 128;
const maxDrawCallsPerGeometry = 1;
const maxBonesPerInstance = 128;

// window.THREE = THREE;

const _zeroY = v => {
  v.y = 0;
  return v;
};
const _findMesh = o => {
  let mesh = null;
  const _recurse = o => {
    if (o.isMesh) {
      mesh = o;
    } else if (o.children) {
      for (const child of o.children) {
        _recurse(child);
        if (mesh) {
          break;
        }
      }
    }
  };
  _recurse(o);
  return mesh;
};
const _findBone = o => {
  let bone = null;
  const _recurse = o => {
    if (o.isBone) {
      bone = o;
    } else if (o.children) {
      for (const child of o.children) {
        _recurse(child);
        if (bone) {
          break;
        }
      }
    }
  };
  _recurse(o);
  return bone;
};

function makeCharacterController(app, {
  radius,
  height,
  physicsOffset,
}) {
  const innerHeight = height - radius * 2;
  const contactOffset = 0.1 * height;
  const stepOffset = 0.1 * height;

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
  return characterController;
}

class Mob {
  constructor(app = null, srcUrl = '') {
    this.app = app;
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

class MobInstance {
  constructor(skeleton, mixer) {
    this.skeleton = skeleton;
    this.mixer = mixer;
  }
}

class InstancedSkeleton extends THREE.Skeleton {
  constructor(parent) {
    super();

    this.parent = parent;

    // bone texture
    const boneTexture = this.parent.allocator.getTexture('boneTexture');
    this.boneMatrices = boneTexture.image.data;
    this.boneTexture = boneTexture;
    this.boneTextureSize = boneTexture.image.width;
  }
  update() {
    const boneMatrices = this.boneMatrices;
    const boneTexture = this.parent.allocator.getTexture('boneTexture');

    for (let drawCallIndex = 0; drawCallIndex < this.parent.drawCalls.length; drawCallIndex++) {
      const drawCall = this.parent.drawCalls[drawCallIndex];
      
      if (drawCall) {
        // const {geometryIndex} = drawCall;

        for (let instanceIndex = 0; instanceIndex < drawCall.instances.length; instanceIndex++) {
          const mobInstance = drawCall.instances[instanceIndex];
          const {skeleton} = mobInstance;

          // geometry -> instance (skeleton) -> bone -> matrix
          const dstOffset = drawCall.freeListEntry.start * maxDrawCallsPerGeometry * maxInstancesPerDrawCall * maxBonesPerInstance * 16 +
            instanceIndex * maxBonesPerInstance * 16;

          const bones = skeleton.bones;
          const boneInverses = skeleton.boneInverses;

          // flatten bone matrices to array

          for ( let i = 0, il = bones.length; i < il; i ++ ) {

            // compute the offset between the current and the original transform

            const matrix = bones[ i ] ? bones[ i ].matrixWorld : identityMatrix;

            localMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
            localMatrix.toArray( boneMatrices, dstOffset + i * 16 );

          }
        }
      }
    }

    boneTexture.needsUpdate = true;
	}
}

class MobBatchedMesh extends InstancedBatchedMesh {
  constructor({
    procGenInstance,
    mobData,
  }) {
    const {
      glbs,
      skinnedMeshes: meshes,
    } = mobData;
    const {
      // atlas,
      // atlasImages,
      atlasTextures,
      geometries,
    } = createTextureAtlas(meshes, {
      attributes: ['position', 'normal', 'uv', 'skinIndex', 'skinWeight'],
      textures: ['map', 'normalMap', 'roughnessMap', 'metalnessMap'],
    });

    // allocator

    const allocator = new InstancedGeometryAllocator(geometries, [
      {
        name: 'p',
        Type: Float32Array,
        itemSize: 3,
      },
      {
        name: 'q',
        Type: Float32Array,
        itemSize: 4,
      },
      {
        name: 'boneTexture',
        Type: Float32Array,
        itemSize: maxBonesPerInstance * 16,
      },
    ], {
      maxInstancesPerDrawCall,
      maxDrawCallsPerGeometry,
    });
    const {geometry, textures: attributeTextures} = allocator;
    for (const k in attributeTextures) {
      const texture = attributeTextures[k];
      texture.anisotropy = maxAnisotropy;
    }

    // material

    const material = new THREE.MeshStandardMaterial({
      map: atlasTextures.map,
      normalMap: atlasTextures.normalMap,
      roughnessMap: atlasTextures.roughnessMap,
      metalnessMap: atlasTextures.metalnessMap,
      // side: THREE.DoubleSide,
      // transparent: true,
      // alphaTest: 0.5,
      onBeforeCompile: (shader) => {
        // console.log('on before compile', shader.fragmentShader);

        shader.uniforms.pTexture = {
          value: attributeTextures.p,
          needsUpdate: true,
        };
        shader.uniforms.qTexture = {
          value: attributeTextures.q,
          needsUpdate: true,
        };

        // skin vertex

        window.shader = shader;
        window.vertexShader = shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(`#include <skinning_pars_vertex>`, `\
// #undef USE_SKINNING

#ifdef USE_SKINNING
uniform mat4 bindMatrix;
uniform mat4 bindMatrixInverse;
uniform highp sampler2D boneTexture;
uniform int boneTextureSize;
mat4 getBoneMatrix( const in float base, const in float i ) {
  float j = base + i * 4.0;
  float x = mod( j, float( boneTextureSize ) );
  float y = floor( j / float( boneTextureSize ) );
  float dx = 1.0 / float( boneTextureSize );
  float dy = 1.0 / float( boneTextureSize );
  y = dy * ( y + 0.5 );
  vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
  vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
  vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
  vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
  mat4 bone = mat4( v1, v2, v3, v4 );
  return bone;
}
#endif
        `);
        shader.vertexShader = shader.vertexShader.replace(`#include <skinbase_vertex>`, `\
int boneTextureInstanceIndex = gl_DrawID * ${maxInstancesPerDrawCall} * ${maxBonesPerInstance} +
  gl_InstanceID * ${maxBonesPerInstance};
float boneIndexOffset = float(boneTextureInstanceIndex) * 4.;

#ifdef USE_SKINNING
  mat4 boneMatX = getBoneMatrix( boneIndexOffset, skinIndex.x );
  mat4 boneMatY = getBoneMatrix( boneIndexOffset, skinIndex.y );
  mat4 boneMatZ = getBoneMatrix( boneIndexOffset, skinIndex.z );
  mat4 boneMatW = getBoneMatrix( boneIndexOffset, skinIndex.w );

  /* mat4 boneMatX = mat4(1.);
  mat4 boneMatY = mat4(1.);
  mat4 boneMatZ = mat4(1.);
  mat4 boneMatW = mat4(1.); */
#endif
        `);
        shader.vertexShader = shader.vertexShader.replace(`#include <skinnormal_vertex>`, `\
#ifdef USE_SKINNING
  mat4 skinMatrix = mat4( 0.0 );
  skinMatrix += skinWeight.x * boneMatX;
  skinMatrix += skinWeight.y * boneMatY;
  skinMatrix += skinWeight.z * boneMatZ;
  skinMatrix += skinWeight.w * boneMatW;
  skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
  objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
  #ifdef USE_TANGENT
    objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
  #endif
#endif
        `);
        shader.vertexShader = shader.vertexShader.replace(`#include <skinning_vertex>`, `\
#ifdef USE_SKINNING
  vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
  vec4 skinned = vec4( 0.0 );
  skinned += boneMatX * skinVertex * skinWeight.x;
  skinned += boneMatY * skinVertex * skinWeight.y;
  skinned += boneMatZ * skinVertex * skinWeight.z;
  skinned += boneMatW * skinVertex * skinWeight.w;
  transformed = ( bindMatrixInverse * skinned ).xyz;
#endif
        `);
        
        // vertex shader

        shader.vertexShader = shader.vertexShader.replace(`#include <uv_pars_vertex>`, `\
#undef USE_INSTANCING

#include <uv_pars_vertex>

uniform sampler2D pTexture;
uniform sampler2D qTexture;

vec3 rotate_vertex_position(vec3 position, vec4 q) { 
  return position + 2.0 * cross(q.xyz, cross(q.xyz, position) + q.w * position);
}
        `);
        shader.vertexShader = shader.vertexShader.replace(`#include <project_vertex>`, `\
int instanceIndex = gl_DrawID * ${maxInstancesPerDrawCall} + gl_InstanceID;
const float width = ${attributeTextures.p.image.width.toFixed(8)};
const float height = ${attributeTextures.p.image.height.toFixed(8)};
float x = mod(float(instanceIndex), width);
float y = floor(float(instanceIndex) / width);
vec2 pUv = (vec2(x, y) + 0.5) / vec2(width, height);
vec3 p = texture2D(pTexture, pUv).xyz;
vec4 q = texture2D(qTexture, pUv).xyzw;

// instance offset position
{
  transformed = rotate_vertex_position(transformed, q);
  transformed += p;
}

vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
        `);
        /* shader.vertexShader = shader.vertexShader.replace(`#include <worldpos_vertex>`, `\
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif
        `); */

        // fragment shader        

        shader.fragmentShader = shader.fragmentShader.replace(`#include <uv_pars_fragment>`, `\
#undef USE_INSTANCING

#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif
        `);
        
        return shader;
      },
    });

    // mesh

    super(geometry, material, allocator);
    this.frustumCulled = false;

    this.procGenInstance = procGenInstance;

    {
      this.isSkinnedMesh = true;

      this.bindMode = 'attached';
      this.bindMatrix = new THREE.Matrix4();
      this.bindMatrixInverse = new THREE.Matrix4();

      /* const bones = [];
      const boneInverses = [];
      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i];
        if (bones.length > maxBonesPerInstance) {
          throw new Error('too many bones in base mesh skeleton: ' + bones.length);
        }
        bones.push.apply(bones, mesh.skeleton.bones);
        boneInverses.push.apply(boneInverses, mesh.skeleton.boneInverses);
      } */

      // this.bindMode = 'attached';
      // this.bindMatrix = this.matrixWorld;
      // this.bindMatrixInverse = this.bindMatrix.clone().invert();

      this.skeleton = new InstancedSkeleton(this);
    
      // window.skeleton = this.skeleton; // XXX
    }

    // window.shader = shader;
    // window.vertexShader = shader.vertexShader;
    // window.fragmentShader = shader.fragmentShader;
    // window.geometry = geometry;

    this.glbs = glbs;
    this.meshes = meshes;
    // this.rootBones = rootBones;
    this.drawCalls = Array(meshes.length).fill(null);

    this.animationMixers = [];

    /* this.meshes = lodMeshes;
    this.shapeAddresses = shapeAddresses;
    this.physics = physics;
    this.physicsObjects = []; */
  }
  async addChunk(chunk, {
    signal,
  } = {}) {
    if (chunk.y === 0) {
      let live = true;
      signal.addEventListener('abort', e => {
        live = false;
      });

      const _getMobData = async chunk => {
        const lod = 1;
        return await this.procGenInstance.dcWorkerManager.createMobSplat(chunk.x * chunkWorldSize, chunk.z * chunkWorldSize, lod);
      };
      const mobData = await _getMobData(chunk);
      // mobData.instances.length > 0 && console.log('got mob data', mobData, chunk); // XXX
      if (!live) return;

      const _getDrawCall = geometryIndex => {
        // console.log('alloc geometry', geometryIndex);
        let drawCall = this.drawCalls[geometryIndex];
        if (!drawCall) {
          drawCall = this.allocator.allocDrawCall(geometryIndex);
          drawCall.instances = [];

          this.drawCalls[geometryIndex] = drawCall;
        }
        return drawCall;
      };
      const _renderMobGeometry = (drawCall, ps, qs, index) => {
        // locals

        const instanceIndex = drawCall.getInstanceCount();
        const pTexture = drawCall.getTexture('p');
        const pOffset = drawCall.getTextureOffset('p');
        const qTexture = drawCall.getTexture('q');
        const qOffset = drawCall.getTextureOffset('q');
        // const boneTextureOffsetTexture = drawCall.getTexture('boneTextureOffset');
        // const boneTextureOffsetOffset = drawCall.getTextureOffset('boneTextureOffset');

        // position

        const px = ps[index * 3];
        const py = ps[index * 3 + 1];
        const pz = ps[index * 3 + 2];
        pTexture.image.data[pOffset + instanceIndex * 3] = px;
        pTexture.image.data[pOffset + instanceIndex * 3 + 1] = py;
        pTexture.image.data[pOffset + instanceIndex * 3 + 2] = pz;

        drawCall.updateTexture('p', pOffset / 3 + instanceIndex, 1);

        // quaternion

        const qx = qs[index * 4];
        const qy = qs[index * 4 + 1];
        const qz = qs[index * 4 + 2];
        const qw = qs[index * 4 + 3];
        qTexture.image.data[qOffset + instanceIndex * 4] = qx;
        qTexture.image.data[qOffset + instanceIndex * 4 + 1] = qy;
        qTexture.image.data[qOffset + instanceIndex * 4 + 2] = qz;
        qTexture.image.data[qOffset + instanceIndex * 4 + 3] = qw;

        drawCall.updateTexture('q', qOffset / 4 + instanceIndex, 1);

        // bone texture offset

        // XXX allocate space in the bone texture via instanced skeleton
        // each bone requires a mat4, i.e 4 vec4 pixels per bone
        // console.log('free list', this.skeleton.boneTextureFreeList);
        /* console.log('alloc', {
          boneTextureSize: this.skeleton.boneTextureSize,
          boneTextureOffsetSize: this.skeleton.boneTextureSize * this.skeleton.boneTextureSize,
          allocSize: mesh.skeleton.bones.length * 4,
        }); */
        // const boneTextureEntry = this.skeleton.boneTextureFreeList.alloc(mesh.skeleton.bones.length * 4);
        // boneTextureOffsetTexture.image.data[boneTextureOffsetOffset] = boneTextureEntry.start;
        
        // drawCall.updateTexture('boneTextureOffset', boneTextureOffsetOffset + instanceIndex, 1);
        



        // mob instance

        const glb = this.glbs[drawCall.geometryIndex];
        const glb2Scene = SkeletonUtils.clone(glb.scene);
        const mesh2 = _findMesh(glb2Scene);
        const rootBone2 = _findBone(glb2Scene);
        const skeleton2 = mesh2.skeleton;
        if (skeleton2.bones.length > maxBonesPerInstance) {
          throw new Error('too many bones in base mesh skeleton: ' + bones.length);
        }
        /* if (skeleton.bones.some(b => {
          return mesh.skeleton.includes(b);
        })) {
          debugger;
        } */
        
        // animations
        let mixer = null;
        /* for (const glb of glbs)*/ {
          // const glb = this.glbs[drawCall.geometryIndex];
          // const rootBone = this.rootBones[drawCall.geometryIndex];
          // const rootBone = skeleton2.bones[0];
          const {animations} = glb;
          // console.log('got animations', animations);
          // const idleAnimation = animations.find(a => a.name === 'idle');
          const clip = animations[0];
          if (clip) {
            // console.log('new mixer', rootBone);
            // try {
              mixer = new THREE.AnimationMixer(rootBone2);
              // console.log('new action', clip);
              const action = mixer.clipAction(clip);
              action.play();
              mixer.updateMatrixWorld = () => {
                glb2Scene.updateMatrixWorld();

                // window.glb2Scene = glb2Scene; // XXX
              };

              this.animationMixers.push(mixer);
            /* } catch (err) {
              debugger;
            } */
          }
        }

        const instance = new MobInstance(skeleton2, mixer);
        drawCall.instances.push(instance);

        // physics
        // const shapeAddress = this.#getShapeAddress(drawCall.geometryIndex);
        // const physicsObject = this.#addPhysicsShape(shapeAddress, px, py, pz, qx, qy, qz, qw);
        // this.physicsObjects.push(physicsObject);

        // bookkeeping

        drawCall.incrementInstanceCount();

        // return

        return instance;
      };
      const _unrenderMobGeometry = (drawCall, mobInstance) => {
        const instanceIndex = drawCall.instances.indexOf(mobInstance);
        if (drawCall.instances.length >= 2) {
          // locals
          
          const lastInstanceIndex = drawCall.getInstanceCount() - 1;
          const oldInstance = drawCall.instances[instanceIndex];
          
          const pTexture = drawCall.getTexture('p');
          const pOffset = drawCall.getTextureOffset('p');
          const qTexture = drawCall.getTexture('q');
          const qOffset = drawCall.getTextureOffset('q');
          const boneTextureOffsetTexture = drawCall.getTexture('boneTexture');
          const boneTextureOffsetOffset = drawCall.getTextureOffset('boneTexture');

          // delete by replacing current instance with last instance

          pTexture.image.data[pOffset + instanceIndex * 3] = pTexture.image.data[pOffset + lastInstanceIndex * 3];
          pTexture.image.data[pOffset + instanceIndex * 3 + 1] = pTexture.image.data[pOffset + lastInstanceIndex * 3 + 1];
          pTexture.image.data[pOffset + instanceIndex * 3 + 2] = pTexture.image.data[pOffset + lastInstanceIndex * 3 + 2];

          qTexture.image.data[qOffset + instanceIndex * 4] = qTexture.image.data[qOffset + lastInstanceIndex * 4];
          qTexture.image.data[qOffset + instanceIndex * 4 + 1] = qTexture.image.data[qOffset + lastInstanceIndex * 4 + 1];
          qTexture.image.data[qOffset + instanceIndex * 4 + 2] = qTexture.image.data[qOffset + lastInstanceIndex * 4 + 2];
          qTexture.image.data[qOffset + instanceIndex * 4 + 3] = qTexture.image.data[qOffset + lastInstanceIndex * 4 + 3];

          // copy the last instance bone matrix (a block of maxBonesPerInstance bones) to the current location
          boneTextureOffsetTexture.image.data.set(boneTextureOffsetTexture.image.data.subarray(
            boneTextureOffsetOffset + lastInstanceIndex * maxBonesPerInstance * 16,
            boneTextureOffsetOffset + (lastInstanceIndex + 1) * maxBonesPerInstance * 16
          ), boneTextureOffsetOffset + instanceIndex * maxBonesPerInstance * 16);

          drawCall.updateTexture('p', pOffset / 3 + instanceIndex, 1);
          drawCall.updateTexture('q', qOffset / 4 + instanceIndex, 1);
          drawCall.updateTexture('boneTexture', boneTextureOffsetOffset + instanceIndex, 1);

          // animations

          const mixerIndex = oldInstance.mixer !== null ? this.animationMixers.indexOf(oldInstance.mixer) : -1;
          if (mixerIndex !== -1) {
            this.animationMixers.splice(mixerIndex, 1);
          }

          // this.skeleton.boneTextureFreeList.free(oldInstance.boneTextureEntry);
          // this.skeleton.removeSkeleton(oldInstance.skeleton);

          // mob instance

          drawCall.instances[instanceIndex] = drawCall.instances[drawCall.instances.length - 1];
          drawCall.instances.length--;
        } else {
          drawCall.instances.length = 0;
        }

        // bookkeeping

        drawCall.decrementInstanceCount();
      }

      for (let i = 0; i < mobData.instances.length; i++) {
        const geometryNoise = mobData.instances[i];
        // console.log('got noise', geometryNoise);
        const geometryIndex = Math.floor(geometryNoise * this.meshes.length);
        
        const drawCall = _getDrawCall(geometryIndex);
        const mobInstance = _renderMobGeometry(drawCall, mobData.ps, mobData.qs, i);
        // window.drawCall = drawCall;

        signal.addEventListener('abort', e => {
          _unrenderMobGeometry(drawCall, mobInstance);
        });
      }
    }
  }
  update(timestamp, timeDiff) {
    // console.log('update', timestamp, timeDiff);
    if (this.animationMixers.length > 0) {
      const deltaSeconds = timeDiff / 1000;
      for (const mixer of this.animationMixers) {
        mixer.update(deltaSeconds);
        mixer.updateMatrixWorld();
      }
    }
    this.skeleton.update();
  }
}

class MobsCompiledData {
  constructor({
    procGenInstance = null,
    appUrls = [],
  } = {}) {
    this.glbs = null;
    this.skinnedMeshes = null;

    this.loadPromise = (async () => {
      // lod mob modules
      const glbs = await Promise.all(appUrls.map(async u => {
        const m = await metaversefile.import(u);

        // load glb
        const glb = await (async () => {
          const mobJsonUrl = m.srcUrl;
          const res = await fetch(mobJsonUrl);
          const j = await res.json();

          return await new Promise((accept, reject) => {
            const mobUrl = createRelativeUrl(j.mobUrl, mobJsonUrl);
            loaders.gltfLoader.load(mobUrl, accept, function onProgress() {}, reject);
          });
        })();
        return glb;
      }));
      const skinnedMeshSpecs = glbs.map(glb => {
        const mesh = _findMesh(glb.scene);

        return {
          glb,
          mesh,
        };
      });
      const skinnedMeshes = skinnedMeshSpecs.map(spec => spec.mesh);

      this.glbs = glbs;
      this.skinnedMeshes = skinnedMeshes;
    })();
  }
  waitForLoad() {
    return this.loadPromise;
  }
}

class MobGenerator {
  constructor({
    procGenInstance,
    mobData,
  }) {
    // this.procGenInstance = procGenInstance;
    // this.mobData = mobData;

    this.object = new THREE.Object3D();
    this.object.name = 'mob-chunks';

    // make batched mesh
    const mobBatchedMesh = new MobBatchedMesh({
      procGenInstance,
      mobData,
    });
    this.object.add(mobBatchedMesh);
    this.mobBatchedMesh = mobBatchedMesh;
  }
  getMobModuleNames() {
    return Object.keys(this.mobModules).sort();
  }
  generateChunk(chunk) {
    const abortController = new AbortController();
    const {signal} = abortController;
    
    (async () => {
      await this.mobBatchedMesh.addChunk(chunk, {
        signal,
      });
    })();    

    chunk.binding = {
      abortController,
    };
  }
  disposeChunk(chunk) {
    const {abortController} = chunk.binding;
    abortController.abort();
    chunk.binding = null;
  }
  update(timestamp, timeDiff) {
    this.mobBatchedMesh.update(timestamp, timeDiff);
  }
  destroy() {
    // nothing; the owning lod tracker disposes of our contents
  }
}

class Mobber {
  constructor({
    procGenInstance,
    mobData,
  }) {
    this.procGenInstance = procGenInstance;
    this.mobData = mobData;
    
    const generator = new MobGenerator({
      procGenInstance,
      mobData,
    });
    this.generator = generator;
    /* this.tracker = new LodChunkTracker(this.generator, {
      chunkWorldSize,
    }); */
    const numLods = 1;
    const tracker = procGenInstance.getChunkTracker({
      numLods,
      // trackY: true,
      // relod: true,
    });
    const chunkadd = e => {
      const {chunk, waitUntil} = e.data;
      waitUntil(generator.generateChunk(chunk));
    };
    tracker.addEventListener('chunkadd', chunkadd);
    const chunkremove = e => {
      const {chunk} = e.data;
      generator.disposeChunk(chunk);
    };
    tracker.addEventListener('chunkremove', chunkremove);
    this.tracker = tracker;
  }
  async waitForUpdate() {
    await new Promise((accept, reject) => {
      this.tracker.addEventListener('update', () => {
        accept();
      });
    });
  }
  /* async addMobModule(srcUrl) {
    const m = await metaversefile.import(srcUrl);
    this.mobModules[srcUrl] = m;
  }
  compile() {
    this.compiled = true;
  } */
  getChunks() {
    return this.generator.object;
  }
  update(timestamp, timeDiff) {
    const localPlayer = getLocalPlayer();
    !this.procGenInstance.range && this.tracker.update(localPlayer.position);
    this.generator.update(timestamp, timeDiff);
  }
  destroy() {
    this.tracker.destroy();
    this.generator.destroy();
  }
}

class MobManager {
  constructor() {
    this.mobbers = [];
    this.mobs = [];
  }
  createMobber({
    procGenInstance,
    mobData,
  }) {
    const mobber = new Mobber({
      procGenInstance,
      mobData,
    });
    this.mobbers.push(mobber);
    return mobber;
  }
  destroyMobber(mobber) {
    mobber.destroy();
    this.mobbers.splice(this.mobbers.indexOf(mobber), 1);
  }
  async loadData(appUrls) {
    const mobData = new MobsCompiledData({
      appUrls,
    });
    await mobData.waitForLoad();
    return mobData;
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
    // mobber is updated by the app that created it
    /* for (const mobber of this.mobbers) {
      mobber.update(timestamp, timeDiff);
    } */

    for (const mob of this.mobs) {
      mob.update(timestamp, timeDiff);
    }
  }
}
const mobManager = new MobManager();

export default mobManager;