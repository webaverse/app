import * as THREE from "three";
import metaversefile from "metaversefile";
import { DoubleSidedPlaneGeometry, CameraGeometry } from "./geometries.js";
import { WebaverseShaderMaterial } from "./materials.js";
import { getRenderer, scene, camera } from "./renderer.js";
import Avatar from "./avatars/avatars.js";
import { AvatarRenderer } from "./avatars/avatar-renderer.js";
import { mod, angleDifference, addDefaultLights } from "./util.js";
import { world } from "./world.js";
import {
  maxAvatarQuality,
  walkSpeed,
  runSpeed,
  crouchSpeed,
  narutoRunSpeed,
  crouchMaxTime,
} from "./constants.js";
import { emoteAnimations } from "./avatars/animationHelpers.js";

const preview = false; // whether to draw debug meshes

const cameraGeometry = new CameraGeometry();
const cameraMaterial = new THREE.MeshBasicMaterial({
  color: 0x333333,
});
const cameraMesh = new THREE.Mesh(cameraGeometry, cameraMaterial);

let eyeVector = new THREE.Vector3();
let targetVector = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

let rendererSize = new THREE.Vector2();
let rendererViewport = new THREE.Vector4();
let rendererClearAlpha = 0;

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
const frameTimeDiff = 1000 / 60; // 60 FPS

const cameraHeightFactor = 0.8; // the height of the camera in avatar space
const spriteScaleFactor = 1.2; // scale up the final sprite by this much in world space
const spriteFootFactor = 0.07; // offset down this factor in world space

// opacity factor for sprites
const alphaTest = 0.9;

const planeSpriteMeshes = [];
const spriteAvatarMeshes = [];

const animationAngles = [
  { name: "left", angle: Math.PI / 2 },
  { name: "right", angle: -Math.PI / 2 },

  { name: "forward", angle: 0 },
  { name: "backward", angle: Math.PI },
];

const globalUpdate = (timestamp, timeDiff, camera) => {
  if (preview) {
    for (const planeSpriteMesh of planeSpriteMeshes) {
      const { duration } = planeSpriteMesh.spriteSpec;
      const uTime = ((timestamp / 1000) % duration) / duration;
      if (isNaN(uTime)) {
        debugger;
      }
      [planeSpriteMesh.material, planeSpriteMesh.customPostMaterial].forEach((material) => {
        if (material?.uniforms) {
          material.uniforms.uTime.value = uTime;
          material.uniforms.uTime.needsUpdate = true;
        }
      });
    }

    for (const spriteAvatarMesh of spriteAvatarMeshes) {
      const { duration } = spriteAvatarMesh.spriteSpec;
      const uTime = ((timestamp / 1000) % duration) / duration;

      if (isNaN(uTime)) {
        debugger;
      }

      localQuaternion.setFromRotationMatrix(
        localMatrix.lookAt(
          spriteAvatarMesh.getWorldPosition(eyeVector),
          camera.position,
          targetVector.set(0, 1, 0)
        )
      );
      localEuler.setFromQuaternion(localQuaternion, "YXZ");
      localEuler.x = 0;
      localEuler.z = 0;
      spriteAvatarMesh.quaternion.setFromEuler(localEuler);
      spriteAvatarMesh.updateMatrixWorld();

      [spriteAvatarMesh.material, spriteAvatarMesh.customPostMaterial].forEach((material) => {
        if (material?.uniforms) {
          material.uniforms.uTime.value = uTime;
          material.uniforms.uTime.needsUpdate = true;

          material.uniforms.uY.value =
            mod(localEuler.y + (Math.PI * 2) / numAngles / 2, Math.PI * 2) / (Math.PI * 2);
          material.uniforms.uY.needsUpdate = true;
        }
      });
    }
  }
};
const _ensureScheduleGlobalUpdate = (() => {
  let scheduled = false;
  return () => {
    if (!scheduled) {
      scene.add(cameraMesh);
      world.appManager.addEventListener("frame", (e) => {
        const { timestamp, timeDiff } = e.data;
        globalUpdate(timestamp, timeDiff, camera);
      });
      scheduled = true;
    }
  };
})();

class SpriteAnimationPlaneMesh extends THREE.Mesh {
  constructor(tex, { angleIndex }) {
    const planeSpriteMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          // type: 't',
          value: tex,
          needsUpdate: true,
        },
        uTime: {
          // type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uAngleIndex: {
          // type: 'f',
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
class SpriteAnimation360Mesh extends THREE.Mesh {
  constructor(tex) {
    const avatarSpriteMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          type: "t",
          value: tex,
          // needsUpdate: true,
        },
        uTime: {
          type: "f",
          value: 0,
          needsUpdate: true,
        },
        uY: {
          type: "f",
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

    this.lastSpriteSpecName = "";
    this.lastSpriteSpecTimestamp = 0;
  }
}
class SpriteAvatarMesh extends THREE.Mesh {
  constructor(texs) {
    const tex = texs[0];
    const avatarMegaSpriteMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTex: {
          // type: 't',
          value: tex,
          needsUpdate: true,
        },
        uTime: {
          // type: 'f',
          value: 0,
          needsUpdate: true,
        },
        uY: {
          // type: 'f',
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

  /**
   * Set texture
   * @param {String} name
   * @returns
   */
  setTexture(name) {
    const spriteSpecs = getSpriteSpecs();
    const spriteSpecIndex = spriteSpecs.findIndex((spriteSpec) => spriteSpec.name === name);
    if (spriteSpecIndex >= 0) {
      const tex = this.texs[spriteSpecIndex];
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
  }

  update(timestamp, timeDiff, avatar, camera) {
    // matrix transform
    this.position.copy(avatar.inputs.hmd.position);
    this.position.y -= avatar.height;

    localQuaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        this.getWorldPosition(eyeVector),
        camera.position,
        targetVector.set(0, 1, 0)
      )
    );
    localEuler.setFromQuaternion(localQuaternion, "YXZ");
    localEuler.x = 0;
    localEuler.z = 0;

    this.quaternion.setFromEuler(localEuler);
    this.updateMatrixWorld();

    // select the texture
    const spriteSpecName = (() => {
      const playerSide = _getPlayerSide();
      const currentSpeed = eyeVector.set(avatar.velocity.x, 0, avatar.velocity.z).length();

      if (avatar.emoteAnimation !== "") {
        return avatar.emoteAnimation;
      } else if (avatar.jumpState) {
        return "jump";
      } else if (avatar.narutoRunState) {
        return "naruto run";
      } else if (avatar.crouchTime === 0) {
        const crouchIdleSpeedDistance = currentSpeed;
        const crouchSpeedDistance = Math.abs(crouchSpeed - currentSpeed);
        const speedDistances = [
          {
            name: "crouch idle",
            distance: crouchIdleSpeedDistance,
          },
          {
            name: "crouch",
            distance: crouchSpeedDistance,
          },
        ].sort((a, b) => a.distance - b.distance);
        const closestSpeedDistance = speedDistances[0];
        const spriteSpecBaseName = closestSpeedDistance.name;

        if (spriteSpecBaseName === "crouch idle") {
          return "crouch idle";
        } else if (spriteSpecBaseName === "crouch") {
          if (playerSide === "forward") {
            return "crouch walk";
          } else if (playerSide === "backward") {
            return "crouch walk backward";
          } else if (playerSide === "left") {
            return "crouch walk left";
          } else if (playerSide === "right") {
            return "crouch walk right";
          }
        }
      } else {
        const currentSpeed = eyeVector.set(avatar.velocity.x, 0, avatar.velocity.z).length();
        const idleSpeedDistance = currentSpeed;
        const walkSpeedDistance = Math.abs(walkSpeed - currentSpeed);
        const runSpeedDistance = Math.abs(runSpeed - currentSpeed);
        const speedDistances = [
          {
            name: "idle",
            distance: idleSpeedDistance,
          },
          {
            name: "walk",
            distance: walkSpeedDistance,
          },
          {
            name: "run",
            distance: runSpeedDistance,
          },
        ].sort((a, b) => a.distance - b.distance);
        const closestSpeedDistance = speedDistances[0];
        const spriteSpecBaseName = closestSpeedDistance.name;
        if (spriteSpecBaseName === "idle") {
          return "idle";
        } else if (spriteSpecBaseName === "walk") {
          if (playerSide === "forward") {
            return "walk";
          } else if (playerSide === "backward") {
            return "walk backward";
          } else if (playerSide === "left") {
            return "walk left";
          } else if (playerSide === "right") {
            return "walk right";
          }
        } else if (spriteSpecBaseName === "run") {
          if (playerSide === "forward") {
            return "run";
          } else if (playerSide === "backward") {
            return "run backward";
          } else if (playerSide === "left") {
            return "run left";
          } else if (playerSide === "right") {
            return "run right";
          }
        }

        throw new Error("unhandled case");
      }
    })();

    this.setTexture(spriteSpecName);

    if (spriteSpecName !== this.lastSpriteSpecName) {
      this.lastSpriteSpecName = spriteSpecName;
      this.lastSpriteSpecTimestamp = timestamp;
    }
    const timestampDelta =
      (spriteSpecName === "jump" ? 300 : 0) + timestamp - this.lastSpriteSpecTimestamp;

    // general uniforms
    [this.material, this.customPostMaterial].forEach((material) => {
      if (material?.uniforms) {
        const spriteSpec = _spriteSpecs.find((s) => s.name === spriteSpecName);
        if (spriteSpec) {
          const { duration } = spriteSpec;
          const uTime = ((timestampDelta / 1000) % duration) / duration;

          material.uniforms.uTime.value = uTime;
          material.uniforms.uTime.needsUpdate = true;

          localQuaternion.setFromRotationMatrix(
            localMatrix.lookAt(
              this.getWorldPosition(eyeVector),
              camera.position,
              targetVector.set(0, 1, 0)
            )
          );
          localEuler.setFromQuaternion(localQuaternion, "YXZ");
          localEuler.x = 0;
          localEuler.z = 0;

          localEuler2.setFromQuaternion(avatar.inputs.hmd.quaternion, "YXZ");
          localEuler2.x = 0;
          localEuler2.z = 0;

          material.uniforms.uY.value =
            mod(localEuler.y - localEuler2.y + (Math.PI * 2) / numAngles / 2, Math.PI * 2) /
            (Math.PI * 2);
          material.uniforms.uY.needsUpdate = true;
        }
      }
    });
  }
}

const _getPlayerSide = () => {
  const localPlayer = metaversefile.useLocalPlayer();

  localEuler.setFromRotationMatrix(
    localMatrix.lookAt(
      eyeVector.set(0, 0, 0),
      targetVector.set(0, 0, -1).applyQuaternion(localPlayer.quaternion),
      upVector
    ),
    "YXZ"
  );
  const forwardY = localEuler.y;

  localEuler.setFromRotationMatrix(
    localMatrix.lookAt(
      eyeVector.set(0, 0, 0),
      targetVector.copy(localPlayer.characterPhysics.velocity).normalize(),
      upVector
    ),
    "YXZ"
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
const planeWarpedGeometry = planeGeometry
  .clone()
  .applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(
        0,
        worldSize / 2 + ((spriteScaleFactor - 1) / 2) * worldSize - spriteFootFactor * worldSize,
        0
      ),
      new THREE.Quaternion(),
      new THREE.Vector3().setScalar(spriteScaleFactor)
    )
  );
const planeWarpedGeometry2 = planeGeometry
  .clone()
  .applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(
        0,
        worldSize / 2 + ((spriteScaleFactor - 1) / 2) * worldSize - spriteFootFactor * worldSize,
        0
      ),
      new THREE.Quaternion(),
      new THREE.Vector3().setScalar(spriteScaleFactor)
    )
  );
planeWarpedGeometry2.computeBoundingSphere();

const camera2 = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
const scene2 = new THREE.Scene();
scene2.autoUpdate = false;
addDefaultLights(scene2);

let _spriteSpecs = null;
const getSpriteSpecs = () => {
  if (_spriteSpecs === null) {
    const animations = Avatar.getAnimations();
    const walkAnimation = animations.find((a) => a.name === "walking.fbx");
    const walkBackwardAnimation = animations.find((a) => a.name === "walking backwards.fbx");
    const runAnimation = animations.find((a) => a.name === "Fast Run.fbx");
    const runBackwardAnimation = animations.find((a) => a.name === "running backwards.fbx");
    const leftStrafeRunAnimation = animations.find((a) => a.name === "left strafe.fbx");
    const rightStrafeRunAnimation = animations.find((a) => a.name === "right strafe.fbx");
    const idleAnimation = animations.find((a) => a.name === "idle.fbx");
    const crouchIdleAnimation = animations.find((a) => a.name === "Crouch Idle.fbx");
    const crouchWalkAnimation = animations.find((a) => a.name === "Sneaking Forward.fbx");
    const crouchWalkBackwardAnimation = animations.find(
      (a) => a.name === "Sneaking Forward reverse.fbx"
    );
    const narutoRunAnimation = animations.find((a) => a.name === "naruto run.fbx");
    const jumpAnimation = animations.find((a) => a.name === "jump.fbx");
    const leftStrafeWalkingAnimation = animations.find((a) => a.name === "left strafe walking.fbx");
    const rightStrafeWalkingAnimation = animations.find(
      (a) => a.name === "right strafe walking.fbx"
    );
    const crouchWalkLeftAnimation = animations.find((a) => a.name === "Crouched Sneaking Left.fbx");
    const crouchWalkRightAnimation = animations.find(
      (a) => a.name === "Crouched Sneaking Right.fbx"
    );

    _spriteSpecs = [
      {
        name: "idle",
        duration: idleAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity.set(0, 0, 0).divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "walk",
        duration: walkAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-walkSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              // console.log('update walk position offset', positionOffset, camera2.position.toArray().join(','));

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);

              // globalThis.localRig = localRig;
            },
          };
        },
      },
      {
        name: "walk left",
        duration: leftStrafeWalkingAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-walkSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(positionOffset, localRig.height * cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(positionOffset, localRig.height * cameraHeightFactor, 0)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(moveDistancePerFrame, 0, 0)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "walk right",
        duration: rightStrafeWalkingAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (walkSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(positionOffset, localRig.height * cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(positionOffset, localRig.height * cameraHeightFactor, 0)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(moveDistancePerFrame, 0, 0)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "walk backward",
        duration: walkBackwardAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (walkSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "run",
        duration: runAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-runSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "run left",
        duration: leftStrafeRunAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-runSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(positionOffset, localRig.height * cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(positionOffset, localRig.height * cameraHeightFactor, 0)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(moveDistancePerFrame, 0, 0)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "run right",
        duration: rightStrafeRunAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (runSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(positionOffset, localRig.height * cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(positionOffset, localRig.height * cameraHeightFactor, 0)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(moveDistancePerFrame, 0, 0)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "run backward",
        duration: runBackwardAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (runSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.update(timestamp, timeDiffMs);
            },
          };
        },
      },
      {
        name: "crouch idle",
        duration: crouchIdleAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              // positionOffset -= crouchSpeed/1000 * timeDiffMs;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity.set(0, 0, 0).divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.crouchTime = 0;

              localRig.update(timestamp, timeDiffMs);
            },
            cleanup() {
              localRig.crouchTime = crouchMaxTime;
            },
          };
        },
      },
      {
        name: "crouch walk",
        duration: crouchWalkAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-crouchSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.crouchTime = 0;

              localRig.update(timestamp, timeDiffMs);
            },
            cleanup() {
              localRig.crouchTime = crouchMaxTime;
            },
          };
        },
      },
      {
        name: "crouch walk left",
        duration: crouchWalkLeftAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-crouchSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(positionOffset, localRig.height * cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(positionOffset, localRig.height * cameraHeightFactor, 0)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(moveDistancePerFrame, 0, 0)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.crouchTime = 0;

              localRig.update(timestamp, timeDiffMs);
            },
            cleanup() {
              localRig.crouchTime = crouchMaxTime;
            },
          };
        },
      },
      {
        name: "crouch walk right",
        duration: crouchWalkRightAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (crouchSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(positionOffset, localRig.height * cameraHeightFactor, 0)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(positionOffset, localRig.height * cameraHeightFactor, 0)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(positionOffset, localRig.height, 0);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(moveDistancePerFrame, 0, 0)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.crouchTime = 0;

              localRig.update(timestamp, timeDiffMs);
            },
            cleanup() {
              localRig.crouchTime = crouchMaxTime;
            },
          };
        },
      },
      {
        name: "crouch walk backward",
        duration: crouchWalkBackwardAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (crouchSpeed / 1000) * timeDiffMs;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.crouchTime = 0;

              localRig.update(timestamp, timeDiffMs);
            },
            cleanup() {
              localRig.crouchTime = crouchMaxTime;
            },
          };
        },
      },
      {
        name: "naruto run",
        duration: narutoRunAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          let narutoRunTime = 0;
          // const narutoRunIncrementSpeed = 1000 * 4;

          return {
            update(timestamp, timeDiffMs) {
              const moveDistancePerFrame = (-narutoRunSpeed / 1000) * timeDiffMs * 10;
              positionOffset += moveDistancePerFrame;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity
                .set(0, 0, moveDistancePerFrame)
                .divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.narutoRunState = true;
              localRig.narutoRunTime = narutoRunTime;

              narutoRunTime += timeDiffMs;

              localRig.update(timestamp, timeDiffMs);
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
        name: "jump",
        duration: jumpAnimation.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;

          let jumpTime = 0;
          // const jumpIncrementSpeed = 400;

          return {
            update(timestamp, timeDiffMs) {
              // const timeDiffMs = timeDiff/1000;
              // positionOffset -= walkSpeed/1000 * timeDiffMs;

              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();

              localRig.inputs.hmd.position.set(0, localRig.height, positionOffset);
              localRig.inputs.hmd.updateMatrixWorld();

              localRig.velocity.set(0, 0, 0).divideScalar(Math.max(timeDiffMs / 1000, 0.001));

              localRig.jumpState = true;
              localRig.jumpTime = jumpTime;

              jumpTime += timeDiffMs;

              // console.log('got jump time', jumpTime, timeDiffMs, jumpIncrementSpeed);

              // console.log('local rig update', timeDiffMs);
              localRig.update(timestamp, timeDiffMs);
            },
            reset() {
              jumpTime = 0;
            },
            cleanup() {
              localRig.jumpState = false;
            },
          };
        },
      },
      {
        name: "angry",
        duration: emoteAnimations.angry.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "angry",
            value: 1,
          });
          localRig.emoteAnimation = "angry";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "alert",
        duration: emoteAnimations.alert.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "surprise",
            value: 1,
          });
          localRig.emoteAnimation = "alert";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "victory",
        duration: emoteAnimations.victory.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "joy",
            value: 1,
          });
          localRig.emoteAnimation = "victory";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "surprise",
        duration: emoteAnimations.surprise.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "surprise",
            value: 1,
          });
          localRig.emoteAnimation = "surprise";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "sad",
        duration: emoteAnimations.sad.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "sorrow",
            value: 1,
          });
          localRig.emoteAnimation = "sad";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "headShake",
        duration: emoteAnimations.headShake.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "sorrow",
            value: 1,
          });
          localRig.emoteAnimation = "headShake";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "headNod",
        duration: emoteAnimations.headNod.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "fun",
            value: 1,
          });
          localRig.emoteAnimation = "headNod";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
      {
        name: "embarrassed",
        duration: emoteAnimations.embarrassed.duration,
        init({ angle, avatar: localRig }) {
          let positionOffset = 0;
          localRig.faceposes.length = 0;
          localRig.faceposes.push({
            emotion: "sorrow",
            value: 1,
          });
          localRig.emoteAnimation = "embarrassed";
          localRig.emoteFactor = crouchMaxTime;
          localRig.update(0, 0);
          return {
            update(timestamp, timeDiffMs) {
              const euler = new THREE.Euler(0, angle, 0, "YXZ");
              camera2.position
                .set(0, localRig.height * cameraHeightFactor, positionOffset)
                .add(new THREE.Vector3(0, 0, -distance).applyEuler(euler));
              camera2.lookAt(
                new THREE.Vector3(0, localRig.height * cameraHeightFactor, positionOffset)
              );
              camera2.updateMatrixWorld();
              localRig.update(timestamp * 0.5, timeDiffMs);
            },
          };
        },
      },
    ];
  }
  return _spriteSpecs;
};

const _addPlaneSpriteMaterialUniforms = (uniforms, tex, angleIndex) => {
  uniforms.uTex = {
    type: "t",
    value: tex,
    // needsUpdate: true,
  };
  uniforms.uTime = {
    type: "f",
    value: 0,
    needsUpdate: true,
  };
  uniforms.uAngleIndex = {
    type: "f",
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
    parameters.uniforms = _addPlaneSpriteMaterialUniforms(
      parameters.uniforms,
      this.options2.tex,
      this.options2.angleIndex
    );
    this.uniforms = parameters.uniforms;

    parameters.vertexShader = parameters.vertexShader.replace(
      "void main() {\n",
      `\
      // attribute vec2 uv;
      varying vec2 vUv;
    ` +
        "void main() {\n" +
        `\
      vUv = uv;
    `
    );
    parameters.fragmentShader = parameters.fragmentShader.replace(
      "void main() {\n",
      `\
      uniform float uTime;
      uniform float uAngleIndex;
      uniform sampler2D uTex;
      varying vec2 vUv;
    ` +
        "void main() {\n" +
        `\
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
    `
    );
  }
}
const _addAvatarSpriteMaterialUniforms = (uniforms, tex) => {
  uniforms.uTex = {
    type: "t",
    value: tex,
    // needsUpdate: true,
  };
  uniforms.uTime = {
    type: "f",
    value: 0,
    needsUpdate: true,
  };
  uniforms.uY = {
    type: "f",
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

    parameters.vertexShader = parameters.vertexShader.replace(
      "void main() {\n",
      `\
      // attribute vec2 uv;
      varying vec2 vUv;
    ` +
        "void main() {\n" +
        `\
      vUv = uv;
    `
    );
    parameters.fragmentShader = parameters.fragmentShader.replace(
      "void main() {\n",
      `\
      uniform float uTime;
      uniform float uY;
      uniform sampler2D uTex;
      varying vec2 vUv;
    ` +
        "void main() {\n" +
        `\
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
    `
    );
  }
}

const _waitForIdle = () =>
  new Promise((resolve) => {
    requestIdleCallback(resolve);
  });

export const renderSpriteImages = async (arrayBuffer, srcUrl) => {
  const avatarRenderer = new AvatarRenderer({
    arrayBuffer,
    srcUrl,
    // camera: camera2, // do not frustum cull
    quality: maxAvatarQuality,
  });
  await avatarRenderer.waitForLoad();

  const localRig = new Avatar(avatarRenderer, {
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

  if (preview) {
    _ensureScheduleGlobalUpdate();
  }

  const model = avatarRenderer.scene;

  const renderer = getRenderer();
  const pixelRatio = renderer.getPixelRatio();
  // push old renderer state
  renderer.getSize(rendererSize);
  renderer.getViewport(rendererViewport);
  rendererClearAlpha = renderer.getClearAlpha();

  const _renderSpriteFrame = () => {
    scene2.add(model);

    if (rendererSize.x >= texSize && rendererSize.y >= texSize) {
      renderer.setViewport(0, 0, texSize / pixelRatio, texSize / pixelRatio);
      renderer.setClearAlpha(0);
      renderer.clear();
      renderer.render(scene2, camera2);

      // pop old renderer state
      renderer.setViewport(rendererViewport);
      renderer.setClearAlpha(rendererClearAlpha);
    }

    const oldParent = model.parent;
    if (oldParent) {
      oldParent.add(model);
    } else {
      model.parent.remove(model);
    }
  };

  const spriteSpecs = getSpriteSpecs();
  let canvasIndex2 = 0;
  const spriteImages = [];
  for (let i = 0; i < spriteSpecs.length; i++) {
    const spriteSpec = spriteSpecs[i];
    const { name, duration } = spriteSpec;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    /* document.body.appendChild(canvas);
    canvas.style.cssText = `\
      position: absolute;
      top: 0;
      left: 0;
      width: 512px;
      height: 512px;
      z-index: 1;
    `; */

    let tex;
    if (preview) {
      tex = new THREE.Texture(canvas);
      tex.name = name;
    }
    let canvasIndex = 0;

    // console.log('generate sprite', name);

    // console.log('compute time diff', timeDiff);
    let angleIndex = 0;
    for (let angle = 0; angle < Math.PI * 2; angle += (Math.PI * 2) / numAngles) {
      const durationS = duration * 1000;
      const _getCurrentFrame = (timestamp) => {
        const result = Math.min(Math.floor((timestamp / durationS) * numFrames), numFrames);
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
      {
        const startNow = now;
        for (let j = 0; j < numFrames; j++) {
          while (_getCurrentFrame(now - startNow) < j) {
            spriteGenerator.update(now, frameTimeDiff);
            now += frameTimeDiff;
          }
        }
      }
      // const initialPositionOffset = localRig.inputs.hmd.position.z;

      spriteGenerator.reset && spriteGenerator.reset();

      // now perform the real capture
      const startNow = now;
      for (let j = 0; j < numFrames; j++, angleIndex++) {
        while (_getCurrentFrame(now - startNow) < j) {
          spriteGenerator.update(now, frameTimeDiff);
          now += frameTimeDiff;
        }

        _renderSpriteFrame();

        const x = angleIndex % numSlots;
        const y = (angleIndex - x) / numSlots;
        ctx.drawImage(
          renderer.domElement,
          0,
          renderer.domElement.height - texSize,
          texSize,
          texSize,
          x * texSize,
          y * texSize,
          texSize,
          texSize
        );
        if (preview) {
          tex.needsUpdate = true;

          // const angleDegrees = angle/(Math.PI*2)*360;
          // console.log('frame', spriteSpec, angleDegrees);

          scene.add(model);

          cameraMesh.position.copy(camera2.position);
          // cameraMesh.position.z -= initialPositionOffset;
          cameraMesh.quaternion.copy(camera2.quaternion);
          cameraMesh.updateMatrixWorld();

          // globalThis.model = model;
          // globalThis.cameraMesh = cameraMesh;

          // pause for preview
          // await _waitForKey();
          await _waitForIdle();
        }
      }

      if (preview) {
        const planeSpriteMesh = new SpriteAnimationPlaneMesh(tex, {
          angleIndex: startAngleIndex,
        });
        planeSpriteMesh.position.set(-canvasIndex * worldSize, 2, -canvasIndex2 * worldSize);
        planeSpriteMesh.spriteSpec = spriteSpec;
        scene.add(planeSpriteMesh);
        planeSpriteMesh.updateMatrixWorld();
        planeSpriteMesh.frustumCulled = false;
        planeSpriteMeshes.push(planeSpriteMesh);

        console.log("add plane sprite mesh", planeSpriteMesh);
      }

      spriteGenerator.cleanup && spriteGenerator.cleanup();

      canvasIndex++;
    }

    if (preview) {
      const spriteAvatarMesh = new SpriteAnimation360Mesh(tex);
      spriteAvatarMesh.position.set(-canvasIndex * worldSize, 0, -canvasIndex2 * worldSize);
      spriteAvatarMesh.spriteSpec = spriteSpec;
      scene.add(spriteAvatarMesh);
      spriteAvatarMesh.updateMatrixWorld();
      spriteAvatarMesh.frustumCulled = false;
      spriteAvatarMeshes.push(spriteAvatarMesh);
    }

    canvasIndex2++;

    spriteImages.push(canvas);
  }

  return spriteImages;
};

export const createSpriteAvatarMeshFromTextures = (spriteImages) => {
  const spriteTextures = spriteImages.map((img) => {
    const t = new THREE.Texture(img);
    t.needsUpdate = true;
    return t;
  });
  const spriteAvatarMesh = new SpriteAvatarMesh(spriteTextures);
  spriteAvatarMesh.frustumCulled = false;
  return spriteAvatarMesh;
};
