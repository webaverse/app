import * as THREE from './three.module.js';
import {getNextMeshId} from './util.js';

const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
const animalShader = {
  vertexShader: `\
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    attribute vec3 color;
    attribute vec3 head;
    attribute vec4 leg;

    uniform vec4 headRotation;
    uniform float walkFactor;
    uniform float walkCycle;
    uniform float hitFactor;
    varying vec3 vColor;

    vec4 quat_from_axis_angle(vec3 axis, float angle)
    {
      vec4 qr;
      float half_angle = angle * 0.5;
      float s = sin(half_angle);
      qr.x = axis.x * s;
      qr.y = axis.y * s;
      qr.z = axis.z * s;
      qr.w = cos(half_angle);
      return qr;
    }
    vec3 multiply_vq(vec3 v, vec4 q) {
      return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
    }
    vec3 rotate_vertex_position(vec3 position, vec3 axis, float angle)
    {
      vec4 q = quat_from_axis_angle(axis, angle);
      return multiply_vq(position, q);
    }

    void main() {
      vec3 p = position;
      p.y += sin(hitFactor*PI);
      if (head.y != 0.) {
        // p = vec3(0.);
        p -= head.xyz;
        p += multiply_vq(head, headRotation);
      }
      if (leg.y != 0.) {
        p -= leg.xyz;
        p += rotate_vertex_position(leg.xyz, vec3(leg.w, 0., 0.), sin(walkCycle*PI*2.)*PI/2.*walkFactor);
      }
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      vColor = color;
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    uniform float hitFactor;
    varying vec3 vColor;

    /* float pixelDepth = 16.;
    vec3 pixelize(vec3 c) {
      return vec3(
        floor(c.r*pixelDepth)/pixelDepth,
        floor(c.g*pixelDepth)/pixelDepth,
        floor(c.b*pixelDepth)/pixelDepth
      );
    } */

    void main() {
      // gl_FragColor = vec4(pixelize(vColor), 1.0);
      gl_FragColor = vec4(vColor, 1.0);
      if (hitFactor > 0.) {
        gl_FragColor.rgb += vec3(${new THREE.Color(0xef5350).toArray().map(n => n.toFixed(8)).join(', ')});
      }
    }
  `,
};
export const makeAnimalFactory = geometryWorker => (position, hash, onRemove) => {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      headRotation: {
        type: 'v4',
        value: new THREE.Quaternion(),
        needsUpdate: true,
      },
      walkFactor: {
        type: 'f',
        value: 1,
        needsUpdate: true,
      },
      walkCycle: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      hitFactor: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: animalShader.vertexShader,
    fragmentShader: animalShader.fragmentShader,
  });
  const animal = new THREE.Mesh(geometry, material);
  animal.position.copy(position);
  animal.visible = false;
  animal.frustumCulled = false;

  const meshId = getNextMeshId();
  const physxGeometry = geometryWorker.registerCapsuleGeometry(meshId, position, capsuleUpQuaternion, 0.5, 1);
  animal.isAnimalMesh = true;
  animal.meshId = meshId;
  animal.lookAt = () => {};
  animal.update = () => {};
  animal.isHeadAnimating = () => false;
  animal.hit = () => {};
  animal.destroy = () => {
    geometryWorker.unregisterGeometry(physxGeometry);
  };

  (async () => {
    const animalSpec = await geometryWorker.requestAnimalGeometry(hash);
    geometry.setAttribute('position', new THREE.BufferAttribute(animalSpec.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(animalSpec.colors, 3, true));
    geometry.setIndex(new THREE.BufferAttribute(animalSpec.indices, 1));
    geometry.setAttribute('head', new THREE.BufferAttribute(animalSpec.heads, 3));
    geometry.setAttribute('leg', new THREE.BufferAttribute(animalSpec.legs, 4));

    const headPivot = new THREE.Vector3().fromArray(animalSpec.headPivot);
    // const aabb = new THREE.Box3(new THREE.Vector3().fromArray(animalSpec.aabb, 0), new THREE.Vector3().fromArray(animalSpec.aabb, 3));

    let headAnimation = null;
    animal.lookAt = p => {
      const startTime = Date.now();
      const endTime = startTime + 300;
      const startQuaternion = material.uniforms.headRotation.value.clone();
      const endQuaternion = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          headPivot.clone().applyMatrix4(animal.matrixWorld),
          p,
          new THREE.Vector3(0, 1, 0),
        ),
      );
      headAnimation = {
        update() {
          const now = Date.now();
          const factor = (now - startTime) / (endTime - startTime);
          if (factor < 1) {
            material.uniforms.headRotation.value.copy(startQuaternion).slerp(endQuaternion, factor);
          } else {
            material.uniforms.headRotation.value.copy(endQuaternion);
            headAnimation = null;
          }
          material.uniforms.headRotation.needsUpdate = true;
        },
      };
    };
    let hp = 100;
    let hitAnimation = null;
    animal.hit = dmg => {
      hp = Math.max(hp - dmg, 0);

      if (hp > 0) {
        const startTime = Date.now();
        const endTime = startTime + 300;
        hitAnimation = {
          update() {
            const now = Date.now();
            material.uniforms.hitFactor.value = (now - startTime) / (endTime - startTime);
            if (material.uniforms.hitFactor.value >= 1) {
              material.uniforms.hitFactor.value = 0;
              hitAnimation = null;
            }
            material.uniforms.hitFactor.needsUpdate = true;
          },
        };
      } else {
        onRemove();
      }
    };
    animal.update = () => {
      headAnimation && headAnimation.update();
      hitAnimation && hitAnimation.update();

      // animal.material.uniforms.headRotation.value.setFromEuler(localEuler.set(-0.2, 0.2, 0, 'YXZ'));
      // animal.material.uniforms.headRotation.needsUpdate = true;
      // animal.material.uniforms.walkFactor.value = 1;
      // animal.material.uniforms.walkFactor.needsUpdate = true;
      material.uniforms.walkCycle.value = (Date.now() % 2000) / 2000;
      material.uniforms.walkCycle.needsUpdate = true;
    };
    animal.isHeadAnimating = () => !!headAnimation;
    animal.visible = true;
  })();

  return animal;
};
