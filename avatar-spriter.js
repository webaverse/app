import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, usePhysics, useGeometries, useMaterials, useAvatarAnimations, useCleanup} = metaversefile;
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {DoubleSidedPlaneGeometry, CameraGeometry} from './geometries.js';
import {WebaverseShaderMaterial} from './materials.js';
import Avatar from './avatars/avatars.js';
import { walkSpeed, runSpeed, crouchSpeed, narutoRunSpeed } from './constants.js';

const preview = false; // whether to draw debug meshes

const cameraGeometry = new CameraGeometry();
const cameraMaterial = new THREE.MeshBasicMaterial({
  color: 0x333333,
});
const cameraMesh = new THREE.Mesh(
  cameraGeometry,
  cameraMaterial,
);
// scene.add(cameraMesh);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();

const size = 4096;
const texSize = 512;
const numSlots = size / texSize;
const numFrames = 7;
const numAngles = 8;
const worldSize = 2;
const distance = 2.2; // render distance

// avatar animation constants
const maxCrouchTime = 200;

const cameraHeightFactor = 0.8; // the height of the camera in avatar space
const spriteScaleFactor = 1.2; // scale up the final sprite by this much in world space
const spriteFootFactor = 0.07; // offset down this factor in world space

// opacity factor for sprites
const alphaTest = 0.9;

const planeSpriteMeshes = [];
const spriteAvatarMeshes = [];
class SpritePlaneMesh extends THREE.Mesh {
  constructor(tex, {angleIndex}) {
    const planeSpriteMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          type: 't',
          value: tex,
          // needsUpdate: true,
        },
        uTime: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uAngleIndex: {
          type: 'f',
          value: angleIndex,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        precision highp float;
        precision highp int;

        uniform vec4 uSelectRange;

        // attribute vec3 barycentric;
        attribute float ao;
        attribute float skyLight;
        attribute float torchLight;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // vViewPosition = -mvPosition.xyz;
          vUv = uv;
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform float sunIntensity;
        uniform sampler2D uTex;
        // uniform vec3 uColor;
        uniform float uTime;
        // uniform vec3 sunDirection;
        // uniform float distanceOffset;
        uniform float uAngleIndex;
        float parallaxScale = 0.3;
        float parallaxMinLayers = 50.;
        float parallaxMaxLayers = 50.;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        float edgeFactor(vec2 uv) {
          float divisor = 0.5;
          float power = 0.5;
          return min(
            pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
            pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
          ) > 0.1 ? 0.0 : 1.0;
          /* return 1. - pow(abs(uv.x - round(uv.x/divisor)*divisor), power) *
            pow(abs(uv.y - round(uv.y/divisor)*divisor), power); */
        }

        vec3 getTriPlanarBlend(vec3 _wNorm){
          // in wNorm is the world-space normal of the fragment
          vec3 blending = abs( _wNorm );
          // blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
          // float b = (blending.x + blending.y + blending.z);
          // blending /= vec3(b, b, b);
          // return min(min(blending.x, blending.y), blending.z);
          blending = normalize(blending);
          return blending;
        }

        void main() {
          float animationIndex = floor(uTime * ${numFrames.toFixed(8)});
          float i = animationIndex + uAngleIndex;
          float x = mod(i, ${numSlots.toFixed(8)});
          float y = (i - x) / ${numSlots.toFixed(8)};
          
          gl_FragColor = texture(
            uTex,
            vec2(0., 1. - 1./${numSlots.toFixed(8)}) +
              vec2(x, -y)/${numSlots.toFixed(8)} +
              vec2(1.-vUv.x, vUv.y)/${numSlots.toFixed(8)}
          );
          // gl_FragColor.r = 1.;
          // gl_FragColor.a = 1.;
          if (gl_FragColor.a < ${alphaTest}) {
            discard;
          }
          gl_FragColor.a = 1.;
        }
      `,
      transparent: true,
      // depthWrite: false,
      // polygonOffset: true,
      // polygonOffsetFactor: -2,
      // polygonOffsetUnits: 1,
      // side: THREE.DoubleSide,
    });
    super(planeGeometry, planeSpriteMaterial);
    this.customPostMaterial = new PlaneSpriteDepthMaterial(undefined, {
      tex,
      angleIndex,
    });
    return this;
  }
}
class SpriteAvatarMesh extends THREE.Mesh {
  constructor(tex) {
    const avatarSpriteMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          type: 't',
          value: tex,
          // needsUpdate: true,
        },
        uTime: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uY: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        precision highp float;
        precision highp int;

        uniform vec4 uSelectRange;

        // attribute vec3 barycentric;
        attribute float ao;
        attribute float skyLight;
        attribute float torchLight;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // vViewPosition = -mvPosition.xyz;
          vUv = uv;
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform float sunIntensity;
        uniform sampler2D uTex;
        // uniform vec3 uColor;
        uniform float uTime;
        uniform float uY;
        // uniform vec3 sunDirection;
        // uniform float distanceOffset;
        float parallaxScale = 0.3;
        float parallaxMinLayers = 50.;
        float parallaxMaxLayers = 50.;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        float edgeFactor(vec2 uv) {
          float divisor = 0.5;
          float power = 0.5;
          return min(
            pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
            pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
          ) > 0.1 ? 0.0 : 1.0;
          /* return 1. - pow(abs(uv.x - round(uv.x/divisor)*divisor), power) *
            pow(abs(uv.y - round(uv.y/divisor)*divisor), power); */
        }

        vec3 getTriPlanarBlend(vec3 _wNorm){
          // in wNorm is the world-space normal of the fragment
          vec3 blending = abs( _wNorm );
          // blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
          // float b = (blending.x + blending.y + blending.z);
          // blending /= vec3(b, b, b);
          // return min(min(blending.x, blending.y), blending.z);
          blending = normalize(blending);
          return blending;
        }

        void main() {
          float angleIndex = floor(uY * ${numAngles.toFixed(8)});
          float animationIndex = floor(uTime * ${numFrames.toFixed(8)});
          float i = animationIndex + angleIndex * ${numFrames.toFixed(8)};
          float x = mod(i, ${numSlots.toFixed(8)});
          float y = (i - x) / ${numSlots.toFixed(8)};
          
          gl_FragColor = texture(
            uTex,
            vec2(0., 1. - 1./${numSlots.toFixed(8)}) +
              vec2(x, -y)/${numSlots.toFixed(8)} +
              vec2(1.-vUv.x, vUv.y)/${numSlots.toFixed(8)}
          );
          // gl_FragColor.r = 1.;
          // gl_FragColor.a = 1.;
          if (gl_FragColor.a < ${alphaTest}) {
            discard;
          }
          gl_FragColor.a = 1.;
        }
      `,
      transparent: true,
      // depthWrite: false,
      // polygonOffset: true,
      // polygonOffsetFactor: -2,
      // polygonOffsetUnits: 1,
      // side: THREE.DoubleSide,
    });
    super(planeWarpedGeometry, avatarSpriteMaterial);
    this.customPostMaterial = new AvatarSpriteDepthMaterial(undefined, {
      tex,
    });
    // return spriteAvatarMesh;

    this.lastSpriteSpecName = '';
    this.lastSpriteSpecTimestamp = 0;
  }
}
class SpriteMegaAvatarMesh extends THREE.Mesh {
  constructor(texs) {
    const tex = texs[0];
    const avatarMegaSpriteMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          type: 't',
          value: tex,
          needsUpdate: true,
        },
        uTime: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uY: {
          type: 'f',
          value: 0,
          needsUpdate: true,
        },
      },
      vertexShader: `\
        precision highp float;
        precision highp int;

        uniform vec4 uSelectRange;

        // attribute vec3 barycentric;
        attribute float ao;
        attribute float skyLight;
        attribute float torchLight;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // vViewPosition = -mvPosition.xyz;
          vUv = uv;
        }
      `,
      fragmentShader: `\
        precision highp float;
        precision highp int;

        #define PI 3.1415926535897932384626433832795

        // uniform float sunIntensity;
        uniform sampler2D uTex;
        // uniform vec3 uColor;
        uniform float uTime;
        uniform float uY;
        // uniform vec3 sunDirection;
        // uniform float distanceOffset;
        float parallaxScale = 0.3;
        float parallaxMinLayers = 50.;
        float parallaxMaxLayers = 50.;

        // varying vec3 vViewPosition;
        varying vec2 vUv;
        varying vec3 vBarycentric;
        varying float vAo;
        varying float vSkyLight;
        varying float vTorchLight;
        varying vec3 vSelectColor;
        varying vec2 vWorldUv;
        varying vec3 vPos;
        varying vec3 vNormal;

        float edgeFactor(vec2 uv) {
          float divisor = 0.5;
          float power = 0.5;
          return min(
            pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
            pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
          ) > 0.1 ? 0.0 : 1.0;
          /* return 1. - pow(abs(uv.x - round(uv.x/divisor)*divisor), power) *
            pow(abs(uv.y - round(uv.y/divisor)*divisor), power); */
        }

        vec3 getTriPlanarBlend(vec3 _wNorm){
          // in wNorm is the world-space normal of the fragment
          vec3 blending = abs( _wNorm );
          // blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
          // float b = (blending.x + blending.y + blending.z);
          // blending /= vec3(b, b, b);
          // return min(min(blending.x, blending.y), blending.z);
          blending = normalize(blending);
          return blending;
        }

        void main() {
          float angleIndex = floor(uY * ${numAngles.toFixed(8)});
          float animationIndex = floor(uTime * ${numFrames.toFixed(8)});
          float i = animationIndex + angleIndex * ${numFrames.toFixed(8)};
          float x = mod(i, ${numSlots.toFixed(8)});
          float y = (i - x) / ${numSlots.toFixed(8)};
          
          gl_FragColor = texture(
            uTex,
            vec2(0., 1. - 1./${numSlots.toFixed(8)}) +
              vec2(x, -y)/${numSlots.toFixed(8)} +
              vec2(1.-vUv.x, vUv.y)/${numSlots.toFixed(8)}
          );
          // gl_FragColor.r = 1.;
          // gl_FragColor.a = 1.;
          if (gl_FragColor.a < ${alphaTest}) {
            discard;
          }
          gl_FragColor.a = 1.;
        }
      `,
      transparent: true,
      // depthWrite: false,
      // polygonOffset: true,
      // polygonOffsetFactor: -2,
      // polygonOffsetUnits: 1,
      // side: THREE.DoubleSide,
    });
    super(planeWarpedGeometry2, avatarMegaSpriteMaterial);
    this.customPostMaterial = new AvatarSpriteDepthMaterial(undefined, {
      tex,
    });
    this.texs = texs;
  }
  setTexture(name) {
    const tex = this.texs.find(t => t.name === name);
    if (tex) {
      this.material.uniforms.uTex.value = tex;
      this.material.uniforms.uTex.needsUpdate = true;

      if (this.customPostMaterial.uniforms) {
        this.customPostMaterial.uniforms.uTex.value = tex;
        this.customPostMaterial.uniforms.uTex.needsUpdate = true;
      }
      
      return true;
    } else {
      return false;
    }
  }
  update(timestamp, timeDiff, {
    playerAvatar: avatar,
    camera,
  }) {
    const velocityScaleFactor = 1;

    if (preview) {
      for (const planeSpriteMesh of planeSpriteMeshes) {
        const {duration} = planeSpriteMesh.spriteSpec;
        const uTime = (timestamp/1000 % duration) / duration;
        [planeSpriteMesh.material, planeSpriteMesh.customPostMaterial].forEach(material => {
          if (material?.uniforms) {
            material.uniforms.uTime.value = uTime;
            material.uniforms.uTime.needsUpdate = true;
          }
        });
      }

      for (const spriteAvatarMesh of spriteAvatarMeshes) {
        const {duration} = spriteAvatarMesh.spriteSpec;
        const uTime = (timestamp/1000 % duration) / duration;

        {
          localQuaternion
            .setFromRotationMatrix(
              localMatrix.lookAt(
                spriteAvatarMesh.getWorldPosition(localVector),
                camera.position,
                localVector2.set(0, 1, 0)
              )
            )
            // .premultiply(app.quaternion.clone().invert());
          localEuler.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler.x = 0;
          localEuler.z = 0;
          spriteAvatarMesh.quaternion.setFromEuler(localEuler);
          spriteAvatarMesh.updateMatrixWorld();
        }

        [
          spriteAvatarMesh.material,
          spriteAvatarMesh.customPostMaterial,
        ].forEach(material => {
          if (material?.uniforms) {
            material.uniforms.uTime.value = uTime;
            material.uniforms.uTime.needsUpdate = true;

            material.uniforms.uY.value = mod(localEuler.y + Math.PI*2/numAngles/2, Math.PI*2) / (Math.PI*2);
            material.uniforms.uY.needsUpdate = true;
          }
        });
      }
    }

    // matrix transform
    this.position.copy(avatar.inputs.hmd.position);
    this.position.y -= avatar.height;

    localQuaternion
      .setFromRotationMatrix(
        localMatrix.lookAt(
          this.getWorldPosition(localVector),
          camera.position,
          localVector2.set(0, 1, 0)
        )
      )
    localEuler.setFromQuaternion(localQuaternion, 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;

    this.quaternion.setFromEuler(localEuler);
    this.updateMatrixWorld();

    // select the texture
    const spriteSpecName = (() => {
      const playerSide = _getPlayerSide();
      const currentSpeed = localVector.set(avatar.velocity.x * velocityScaleFactor, 0, avatar.velocity.z * velocityScaleFactor)
        .length();

      if (avatar.jumpState) {
        return 'jump';
      } else if (avatar.narutoRunState) {
        return 'naruto run';
      } else if (avatar.crouchTime === 0) {
        const crouchIdleSpeedDistance = currentSpeed;
        const crouchSpeedDistance = Math.abs(crouchSpeed - currentSpeed);
        const speedDistances = [
          {
            name: 'crouch idle',
            distance: crouchIdleSpeedDistance,
          },
          {
            name: 'crouch',
            distance: crouchSpeedDistance,
          },
        ].sort((a, b) => a.distance - b.distance);
        const closestSpeedDistance = speedDistances[0];
        const spriteSpecBaseName = closestSpeedDistance.name;

        if (spriteSpecBaseName === 'crouch idle') {
          return 'crouch idle';
        } else if (spriteSpecBaseName === 'crouch') {
          if (playerSide === 'forward') {
            return 'crouch walk';
          } else if (playerSide === 'backward') {
            return 'crouch walk backward';
          } else if (playerSide === 'left') {
            return 'crouch walk left';
          } else if (playerSide === 'right') {
            return 'crouch walk right';
          }
        }
      } else {
        const currentSpeed = localVector.set(avatar.velocity.x * velocityScaleFactor, 0, avatar.velocity.z * velocityScaleFactor)
          .length();
        const idleSpeedDistance = currentSpeed;
        const walkSpeedDistance = Math.abs(walkSpeed - currentSpeed);
        const runSpeedDistance = Math.abs(runSpeed - currentSpeed);
        const speedDistances = [
          {
            name: 'idle',
            distance: idleSpeedDistance,
          },
          {
            name: 'walk',
            distance: walkSpeedDistance,
          },
          {
            name: 'run',
            distance: runSpeedDistance,
          },
        ].sort((a, b) => a.distance - b.distance);
        const closestSpeedDistance = speedDistances[0];
        const spriteSpecBaseName = closestSpeedDistance.name;
        if (spriteSpecBaseName === 'idle') {
          return 'idle';
        } else if (spriteSpecBaseName === 'walk') {
          if (playerSide === 'forward') {
            return 'walk';
          } else if (playerSide === 'backward') {
            return 'walk backward';
          } else if (playerSide === 'left') {
            return 'walk left';
          } else if (playerSide === 'right') {
            return 'walk right';
          }
        } else if (spriteSpecBaseName === 'run') {
          if (playerSide === 'forward') {
            return 'run';
          } else if (playerSide === 'backward') {
            return 'run backward';
          } else if (playerSide === 'left') {
            return 'run left';
          } else if (playerSide === 'right') {
            return 'run right';
          }
        }

        throw new Error('unhandled case');
      }
    })();
    this.setTexture(spriteSpecName);

    if (spriteSpecName !== this.lastSpriteSpecName) {
      this.lastSpriteSpecName = spriteSpecName;
      this.lastSpriteSpecTimestamp = timestamp;
    }
    const timestampDelta = (spriteSpecName === 'jump' ? 300 : 0) + timestamp - this.lastSpriteSpecTimestamp;

    // general uniforms
    [
      this.material,
      this.customPostMaterial,
    ].forEach(material => {
      if (material?.uniforms) {
        const spriteSpec = spriteSpecs.find(s => s.name === spriteSpecName);
        const {duration} = spriteSpec;
        const uTime = (timestampDelta/1000 % duration) / duration;
        
        material.uniforms.uTime.value = uTime;
        material.uniforms.uTime.needsUpdate = true;

        localQuaternion
          .setFromRotationMatrix(
            localMatrix.lookAt(
              this.getWorldPosition(localVector),
              camera.position,
              localVector2.set(0, 1, 0)
            )
          )
        localEuler.setFromQuaternion(localQuaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;

        localEuler2.setFromQuaternion(avatar.inputs.hmd.quaternion, 'YXZ');
        localEuler2.x = 0;
        localEuler2.z = 0;

        material.uniforms.uY.value = mod(localEuler.y - localEuler2.y + Math.PI*2/numAngles/2, Math.PI*2) / (Math.PI*2);
        material.uniforms.uY.needsUpdate = true;
      }
    });
  }
}

function mod(a, n) {
  return ((a % n) + n) % n;
}
function angleDifference(angle1, angle2) {
  let a = angle2 - angle1;
  a = mod(a + Math.PI, Math.PI*2) - Math.PI;
  return a;
}
const animationAngles = [
  {name: 'left', angle: Math.PI/2},
  {name: 'right', angle: -Math.PI/2},

  {name: 'forward', angle: 0},
  {name: 'backward', angle: Math.PI},
];
const _getPlayerSide = () => {
  const localPlayer = metaversefile.useLocalPlayer();
  
  localEuler.setFromRotationMatrix(
    localMatrix.lookAt(
      localVector.set(0, 0, 0),
      localVector2.set(0, 0, -1)
        .applyQuaternion(localPlayer.quaternion),
      localVector3.set(0, 1, 0)
    ),
    'YXZ'
  );
  const forwardY = localEuler.y;
  
  localEuler.setFromRotationMatrix(
    localMatrix.lookAt(
      localVector.set(0, 0, 0),
      localVector2.copy(localPlayer.characterPhysics.velocity)
        .normalize(),
      localVector3.set(0, 1, 0)
    ),
    'YXZ'
  );
  const velocityY = localEuler.y;

  const angle = angleDifference(forwardY, velocityY);
  animationAngles.sort((a, b) => {
    const aDistance = Math.abs(angleDifference(angle, a.angle));
    const bDistance = Math.abs(angleDifference(angle, b.angle));
    return aDistance - bDistance;
  });
  const closest2AnimationAngle = animationAngles[0];
  return closest2AnimationAngle.name;
};

const planeGeometry = new DoubleSidedPlaneGeometry(worldSize, worldSize);
const planeWarpedGeometry = planeGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, worldSize/2 + (spriteScaleFactor-1)/2*worldSize - spriteFootFactor*worldSize, 0),
    new THREE.Quaternion(),
    new THREE.Vector3().setScalar(spriteScaleFactor),
  ));
const planeWarpedGeometry2 = planeGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(0, worldSize/2 + (spriteScaleFactor-1)/2*worldSize - spriteFootFactor*worldSize, 0),
    new THREE.Quaternion(),
    new THREE.Vector3().setScalar(spriteScaleFactor),
  ));

const camera2 = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
const scene2 = new THREE.Scene();
scene2.autoUpdate = false;
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
scene2.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
directionalLight.position.set(1, 2, 3);
scene2.add(directionalLight);

let spriteSpecs = null;
const getSpriteSpecs = () => {
  if (spriteSpecs === null) {
    const animations = Avatar.getAnimations();
    const walkAnimation = animations.find(a => a.name === 'walking.fbx');
    const walkBackwardAnimation = animations.find(a => a.name === 'walking backwards.fbx');
    const runAnimation = animations.find(a => a.name === 'Fast Run.fbx');
    const runBackwardAnimation = animations.find(a => a.name === 'running backwards.fbx');
    const leftStrafeRunAnimation = animations.find(a => a.name === 'left strafe.fbx');
    const rightStrafeRunAnimation = animations.find(a => a.name === 'right strafe.fbx');
    const idleAnimation = animations.find(a => a.name === 'idle.fbx');
    const crouchIdleAnimation = animations.find(a => a.name === 'Crouch Idle.fbx');
    const crouchWalkAnimation = animations.find(a => a.name === 'Sneaking Forward.fbx');
    const crouchWalkBackwardAnimation = animations.find(a => a.name === 'Sneaking Forward reverse.fbx');
    const narutoRunAnimation = animations.find(a => a.name === 'naruto run.fbx');
    const jumpAnimation = animations.find(a => a.name === 'jump.fbx');
    const leftStrafeWalkingAnimation = animations.find(a => a.name === 'left strafe walking.fbx');
    const rightStrafeWalkingAnimation = animations.find(a => a.name === 'right strafe walking.fbx');
    const crouchWalkLeftAnimation = animations.find(a => a.name === 'Crouched Sneaking Left.fbx');
    const crouchWalkRightAnimation = animations.find(a => a.name === 'Crouched Sneaking Right.fbx');
    spriteSpecs = [
      {
        name: 'idle',
        duration: idleAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              // positionOffset -= walkSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'walk',
        duration: walkAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset -= walkSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'walk left',
        duration: leftStrafeWalkingAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset -= walkSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(positionOffset, localRig.height*cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffset, localRig.height*cameraHeightFactor, 0));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'walk right',
        duration: rightStrafeWalkingAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset += walkSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(positionOffset, localRig.height*cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffset, localRig.height*cameraHeightFactor, 0));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'walk backward',
        duration: walkBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset += walkSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'run',
        duration: runAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset -= runSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'run left',
        duration: leftStrafeRunAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset -= runSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(positionOffset, localRig.height*cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffset, localRig.height*cameraHeightFactor, 0));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'run right',
        duration: rightStrafeRunAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset += runSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(positionOffset, localRig.height*cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffset, localRig.height*cameraHeightFactor, 0));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'run backward',
        duration: runBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            reset() {},
            update(timestamp, timeDiffMs) {
              positionOffset += runSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'crouch idle',
        duration: crouchIdleAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              // positionOffset -= crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {},
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      },
      {
        name: 'crouch walk',
        duration: crouchWalkAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              positionOffset -= crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {},
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      },
      {
        name: 'crouch walk left',
        duration: crouchWalkLeftAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              positionOffset -= crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(positionOffset, localRig.height*cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffset, localRig.height*cameraHeightFactor, 0));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {},
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      },
      {
        name: 'crouch walk right',
        duration: crouchWalkRightAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              positionOffset += crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(positionOffset, localRig.height*cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffset, localRig.height*cameraHeightFactor, 0));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {},
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      },
      {
        name: 'crouch walk backward',
        duration: crouchWalkBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              positionOffset += crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {},
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      },
      {
        name: 'naruto run',
        duration: narutoRunAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          let narutoRunTime = 0;
          // const narutoRunIncrementSpeed = 1000 * 4;
    
          return {
            update(timestamp, timeDiffMs) {
              positionOffset -= narutoRunSpeed/1000 * timeDiffMs * 10;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.narutoRunState = true;
              localRig.narutoRunTime = narutoRunTime;
    
              narutoRunTime += timeDiffMs;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {
              narutoRunTime = 0;
            },
            cleanup() {
              localRig.narutoRunState = false;
            },            
          };
        },
      },
      {
        name: 'jump',
        duration: jumpAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
    
          const defaultJumpTime = 0;
          let jumpTime = defaultJumpTime;
          // const jumpIncrementSpeed = 400;
    
          return {
            update(timestamp, timeDiffMs) {
              // const timeDiffMs = timeDiff/1000;
              // positionOffset -= walkSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              camera2.position.set(0, localRig.height*cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(0, localRig.height*cameraHeightFactor, positionOffset));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.jumpState = true;
              localRig.jumpTime = jumpTime;
    
              jumpTime += timeDiffMs;
              
              // console.log('got jump time', jumpTime, timeDiffMs, jumpIncrementSpeed);
    
              // console.log('local rig update', timeDiffMs);
              localRig.update(timestamp, timeDiffMs, false);
            },
            reset() {
              jumpTime = defaultJumpTime;
            },
            cleanup() {
              localRig.jumpState = false;
            },
          };
        },
      },
      /* {
        name: 'run backward left',
        duration: runBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff/1000;
              positionOffset += runSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              const positionOffsetDiff = positionOffset/Math.SQRT2;
              camera2.position.set(-positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(-positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(-positionOffsetDiff, localRig.height, positionOffsetDiff);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'run backward right',
        duration: runBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff/1000;
              positionOffset += runSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              const positionOffsetDiff = positionOffset/Math.SQRT2;
              camera2.position.set(positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffsetDiff, localRig.height, positionOffsetDiff);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'walk backward left',
        duration: walkBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff/1000;
              positionOffset += walkSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              const positionOffsetDiff = positionOffset/Math.SQRT2;
              camera2.position.set(-positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(-positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(-positionOffsetDiff, localRig.height, positionOffsetDiff);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'walk backward right',
        duration: walkBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff/1000;
              positionOffset += walkSpeed/1000 * timeDiffMs;
    
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              const positionOffsetDiff = positionOffset/Math.SQRT2;
              camera2.position.set(positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffsetDiff, localRig.height, positionOffsetDiff);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.update(timestamp, timeDiffMs, false);
            },
          };
        },
      },
      {
        name: 'crouch walk backward left',
        duration: crouchWalkBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff/1000;
              positionOffset += crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              const positionOffsetDiff = positionOffset/Math.SQRT2;
              camera2.position.set(-positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(-positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(-positionOffsetDiff, localRig.height, positionOffsetDiff);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      },
      {
        name: 'crouch walk backward right',
        duration: crouchWalkBackwardAnimation.duration,
        init({angle, avatar: localRig}) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiff) {
              const timeDiffMs = timeDiff/1000;
              positionOffset += crouchSpeed/1000 * timeDiffMs;
              
              const euler = new THREE.Euler(0, angle, 0, 'YXZ');
              const positionOffsetDiff = positionOffset/Math.SQRT2;
              camera2.position.set(positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(new THREE.Vector3(positionOffsetDiff, localRig.height*cameraHeightFactor, positionOffsetDiff));
              camera2.updateMatrixWorld();
              
              localRig.inputs.hmd.position.set(positionOffsetDiff, localRig.height, positionOffsetDiff);
              localRig.inputs.hmd.updateMatrixWorld();
    
              localRig.crouchTime = 0;
    
              localRig.update(timestamp, timeDiffMs, false);
            },
            cleanup() {
              localRig.crouchTime = maxCrouchTime;
            },
          };
        },
      }, */
    ];
  }
  return spriteSpecs;
};

const _addPlaneSpriteMaterialUniforms = (uniforms, tex, angleIndex) => {
  uniforms.uTex = {
    type: 't',
    value: tex,
    // needsUpdate: true,
  };
  uniforms.uTime = {
    type: 'f',
    value: 0,
    needsUpdate: true,
  };
  uniforms.uAngleIndex = {
    type: 'f',
    value: angleIndex,
    needsUpdate: true,
  };
  return uniforms;
};
class PlaneSpriteDepthMaterial extends THREE.MeshNormalMaterial {
  constructor(options = {}, options2 = {}) {
    super(options);
    // this.blending = THREE.NoBlending;
    this.transparent = true;

    this.uniforms = null;
    this.options2 = options2;
  }
  onBeforeCompile(parameters) {
    parameters.uniforms = _addPlaneSpriteMaterialUniforms(parameters.uniforms, this.options2.tex, this.options2.angleIndex);
    this.uniforms = parameters.uniforms;

    parameters.vertexShader = parameters.vertexShader.replace('void main() {\n', `\
      // attribute vec2 uv;
      varying vec2 vUv;
    ` + 'void main() {\n' + `\
      vUv = uv;
    `);
    parameters.fragmentShader = parameters.fragmentShader.replace('void main() {\n', `\
      uniform float uTime;
      uniform float uAngleIndex;
      uniform sampler2D uTex;
      varying vec2 vUv;
    ` + 'void main() {\n' + `\
      float animationIndex = floor(uTime * ${numFrames.toFixed(8)});
      float i = animationIndex + uAngleIndex;
      float x = mod(i, ${numSlots.toFixed(8)});
      float y = (i - x) / ${numSlots.toFixed(8)};
      
      vec4 tCol = texture(
        uTex,
        vec2(0., 1. - 1./${numSlots.toFixed(8)}) +
          vec2(x, -y)/${numSlots.toFixed(8)} +
          vec2(1.-vUv.x, vUv.y)/${numSlots.toFixed(8)}
      );
      if (tCol.a < ${alphaTest.toFixed(8)}) {
        discard;
      }
    `);
  }
}
const _addAvatarSpriteMaterialUniforms = (uniforms, tex) => {
  uniforms.uTex = {
    type: 't',
    value: tex,
    // needsUpdate: true,
  };
  uniforms.uTime = {
    type: 'f',
    value: 0,
    needsUpdate: true,
  };
  uniforms.uY = {
    type: 'f',
    value: 0,
    needsUpdate: true,
  };
  return uniforms;
};
class AvatarSpriteDepthMaterial extends THREE.MeshNormalMaterial {
  constructor(options = {}, options2 = {}) {
    super(options);
    // this.blending = THREE.NoBlending;
    this.transparent = true;

    this.uniforms = null;
    this.options2 = options2;
  }
  onBeforeCompile(parameters) {
    parameters.uniforms = _addAvatarSpriteMaterialUniforms(parameters.uniforms, this.options2.tex);
    this.uniforms = parameters.uniforms;

    parameters.vertexShader = parameters.vertexShader.replace('void main() {\n', `\
      // attribute vec2 uv;
      varying vec2 vUv;
    ` + 'void main() {\n' + `\
      vUv = uv;
    `);
    parameters.fragmentShader = parameters.fragmentShader.replace('void main() {\n', `\
      uniform float uTime;
      uniform float uY;
      uniform sampler2D uTex;
      varying vec2 vUv;
    ` + 'void main() {\n' + `\
      float angleIndex = floor(uY * ${numAngles.toFixed(8)});
      float animationIndex = floor(uTime * ${numFrames.toFixed(8)});
      float i = animationIndex + angleIndex * ${numFrames.toFixed(8)};
      float x = mod(i, ${numSlots.toFixed(8)});
      float y = (i - x) / ${numSlots.toFixed(8)};
      
      vec4 tCol = texture(
        uTex,
        vec2(0., 1. - 1./${numSlots.toFixed(8)}) +
          vec2(x, -y)/${numSlots.toFixed(8)} +
          vec2(1.-vUv.x, vUv.y)/${numSlots.toFixed(8)}
      );
      // gl_FragColor.r = 1.;
      // gl_FragColor.a = 1.;
      if (tCol.a < ${alphaTest}) {
        discard;
      }
     //  gl_FragColor.a = 1.;
    `);
  }
}

const _renderSpriteImages = skinnedVrm => {
  const localRig = new Avatar(skinnedVrm, {
    fingers: true,
    hair: true,
    visemes: true,
    debug: false,
  });
  for (let h = 0; h < 2; h++) {
    localRig.setHandEnabled(h, false);
  }
  localRig.setTopEnabled(false);
  localRig.setBottomEnabled(false);
  localRig.faceposes.push({
    emotion: "emotion-2",
    value: 1,
  });
  
  const skinnedModel = skinnedVrm.scene;
  skinnedModel.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });

  const skeleton = (() => {
    let skeleton = null;
    skinnedModel.traverse(o => {
      if (skeleton === null && o.isSkinnedMesh) {
        skeleton = o.skeleton;
      }
    });
    return skeleton;
  })();
  const rootBone = skeleton.bones.find(b => b.name === 'Root');

  const {renderer, scene} = metaversefile.useInternals();
  const pixelRatio = renderer.getPixelRatio();
  const _renderSpriteFrame = () => {
    const oldParent = skinnedModel.parent;
    scene2.add(skinnedModel);

    const rendererSize = renderer.getSize(localVector2D);
    if (rendererSize.x >= texSize && rendererSize.y >= texSize) {
      // push old renderer state
      const oldViewport = renderer.getViewport(localVector4D);
      const oldClearAlpha = renderer.getClearAlpha();
      
      renderer.setViewport(0, 0, texSize/pixelRatio, texSize/pixelRatio);
      renderer.setClearAlpha(0);
      renderer.clear();
      renderer.render(scene2, camera2);

      // pop old renderer state
      renderer.setViewport(oldViewport);
      renderer.setClearAlpha(oldClearAlpha);
    }

    if (oldParent) {
      oldParent.add(skinnedModel);
    } else {
      skinnedModel.parent.remove(skinnedModel);
    }
  };

  const spriteSpecs = getSpriteSpecs();
  let canvasIndex2 = 0;
  const spriteImages = [];
  // console.time('render');
  for (const spriteSpec of spriteSpecs) {
    const {name, duration} = spriteSpec;

    // console.log('spritesheet', name);

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    // canvas.style.cssText = `position: fixed; top: ${canvasIndex2*1024}px; left: 0; width: 1024px; height: 1024px; z-index: 10;`;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.Texture(canvas);
    tex.name = name;
    // tex.minFilter = THREE.NearestFilter;
    // tex.magFilter = THREE.NearestFilter;
    let canvasIndex = 0;
    
    // console.log('generate sprite', name);

    // const timeDiff = duration * 1000 / numFrames;
    const timeDiff = 1000/60; // 60 FPS
    // console.log('compute time diff', timeDiff);
    let angleIndex = 0;
    for (let angle = 0; angle < Math.PI*2; angle += Math.PI*2/numAngles) {
      // console.log('angle', angle/(Math.PI*2)*360);
      
      const durationS = duration * 1000;
      const _getCurrentFrame = timestamp => {
        const result = Math.min(Math.floor(timestamp / durationS * numFrames), numFrames);
        // console.log('current frame', name, timestamp, result, numFrames);
        return result;
      };

      // initialize sprite generator animation
      const spriteGenerator = spriteSpec.init({
        angle,
        avatar: localRig,
      });
      
      // pre-run the animation one cycle first, to stabilize the hair physics
      let now = 0;
      const startAngleIndex = angleIndex;
      // localRig.springBoneManager.reset();
      {
        const startNow = now;
        for (let j = 0; j < numFrames; j++) {
          while (_getCurrentFrame(now - startNow) < j) {
            spriteGenerator.update(now, timeDiff);
            now += timeDiff;
          }
        }
      }
      const initialPositionOffset = localRig.inputs.hmd.position.z;
      
      spriteGenerator.reset();

      // now perform the real capture
      const startNow = now;
      for (let j = 0; j < numFrames; j++, angleIndex++) {
        while (_getCurrentFrame(now - startNow) < j) {
          spriteGenerator.update(now, timeDiff);
          now += timeDiff;
        }

        _renderSpriteFrame();

        if (preview) {
          const positionOffset = localRig.inputs.hmd.position.z;
          rootBone.position.set(0, 0, positionOffset - initialPositionOffset);
          rootBone.updateMatrixWorld();

          cameraMesh.position.copy(camera2.position);
          cameraMesh.position.z -= initialPositionOffset;
          cameraMesh.quaternion.copy(camera2.quaternion);
          cameraMesh.updateMatrixWorld();
        }

        const x = angleIndex % numSlots;
        const y = (angleIndex - x) / numSlots;
        ctx.drawImage(
          renderer.domElement,
          0, renderer.domElement.height - texSize, texSize, texSize,
          x * texSize, y * texSize, texSize, texSize
        );
        tex.needsUpdate = true;

        // await _timeout(50);
      }

      if (preview) {
        const planeSpriteMesh = new SpritePlaneMesh(tex, {
          angleIndex: startAngleIndex,
        });
        planeSpriteMesh.position.set(-canvasIndex*worldSize, 2, -canvasIndex2*worldSize);
        planeSpriteMesh.updateMatrixWorld();
        planeSpriteMesh.spriteSpec = spriteSpec;
        scene.add(planeSpriteMesh);
        planeSpriteMeshes.push(planeSpriteMesh);
      }

      spriteGenerator.cleanup && spriteGenerator.cleanup();

      canvasIndex++;
    }

    if (preview) {
      const spriteAvatarMesh = new SpriteAvatarMesh(tex);
      spriteAvatarMesh.position.set(
        -canvasIndex*worldSize,
        0,
        -canvasIndex2*worldSize,
      );
      spriteAvatarMesh.updateMatrixWorld();
      spriteAvatarMesh.spriteSpec = spriteSpec;
      scene.add(spriteAvatarMesh); 
      spriteAvatarMeshes.push(spriteAvatarMesh);
    }
    
    canvasIndex2++;

    spriteImages.push(tex);
  }
  // console.timeEnd('render');

  return spriteImages;
};
function createSpriteMegaMesh(skinnedVrm) {
  const spriteImages = _renderSpriteImages(skinnedVrm);
  const spriteMegaAvatarMesh = new SpriteMegaAvatarMesh(spriteImages);
  return spriteMegaAvatarMesh;
}

export {
  createSpriteMegaMesh
};
