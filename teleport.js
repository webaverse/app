import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {BufferGeometryUtils} from 'https://static.xrpackage.org/BufferGeometryUtils.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localEuler2 = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
const localRay = new THREE.Ray();

const floorPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0));
const geometries = (() => {
  const result = [];
  for (let i = 0; i < 200; i += 3) {
    result.push(new THREE.BoxBufferGeometry(1, 1, 1));
  }
  return result;
})();
const lineMeshGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

const makeLineMesh = () => {
  const geometry = lineMeshGeometry.clone();
  const targetVsh = `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
  `;
  const targetFsh = `
    uniform float uTime;
    void main() {
      gl_FragColor = vec4(${new THREE.Color(0x4fc3f7).toArray().map(n => n.toFixed(8)).join(', ')}, 1.0);
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: {
        type: 'f',
        value: 0,
      },
    },
    vertexShader: targetVsh,
    fragmentShader: targetFsh,
    side: THREE.DoubleSide,
    // transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  /* mesh.setEndpoints = (start, end) => {
    mesh.position.copy(start).add(end).divideScalar(2);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      end.clone().sub(start).normalize()
    );
    const s = start.distanceTo(end)*2;
    mesh.scale.set(s, s, s);
  }; */
  return mesh;
};
// lineMesh.setEndpoints(new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 2, 0));

const teleportGeometry = new THREE.TorusBufferGeometry(0.5, 0.15, 3, 5)
  .applyMatrix4(new THREE.Matrix4().makeRotationX(-(Math.PI / 2)))
  .applyMatrix4(new THREE.Matrix4().makeRotationY((1 / 20) * (Math.PI * 2)));
const teleportMaterial = new THREE.MeshBasicMaterial({
  color: 0x44c2ff,
});
const makeTeleportMesh = (lineMesh, index) => {
  const geometry = teleportGeometry;
  const material = teleportMaterial;

  const teleportMesh = new THREE.Mesh(geometry, material);
  teleportMesh.visible = false;
  teleportMesh.frustumCulled = false;
  teleportMesh.lineMesh = lineMesh;

  teleportMesh.update = (position, quaternion, visible, onTeleport) => {
    const wasVisible = teleportMesh.visible;
    teleportMesh.visible = false;
    lineMesh.visible = false;

    if (visible) {
      localVector.copy(position);
      localEuler.setFromQuaternion(quaternion, 'YXZ');

      let i;
      const maxSteps = 50;
      for (i = 0; i < maxSteps; i++, localVector.add(localVector2), localEuler.x = Math.max(localEuler.x - Math.PI*0.01, -Math.PI/2)) {
        localQuaternion.setFromEuler(localEuler);

        const positionsArray = lineMesh.geometry.attributes.position.array;
        const positions = new Float32Array(positionsArray.buffer, positionsArray.byteOffset + i*72 * Float32Array.BYTES_PER_ELEMENT, 72);
        const positionsSrcArray = lineMeshGeometry.attributes.position.array;
        localMatrix.compose(localVector, localQuaternion, localVector2.set(0.01, 0.01, 0.1));
        for (let i = 0; i < positions.length; i += 3) {
          localVector3.fromArray(positionsSrcArray, i)
            .applyMatrix4(localMatrix)
            .toArray(positions, i);
        }
        lineMesh.geometry.attributes.position.needsUpdate = true;

        localRay.set(localVector, localVector2.set(0, 0, -1).applyQuaternion(localQuaternion));
        localVector2.multiplyScalar(0.2);
        const intersection = localRay.intersectPlane(floorPlane, localVector3);
        if (intersection && intersection.distanceTo(localRay.origin) <= 1) {
          teleportMesh.position.copy(intersection);
          localEuler2.setFromQuaternion(localQuaternion, 'YXZ');
          localEuler2.x = 0;
          localEuler2.z = 0;
          teleportMesh.quaternion.setFromEuler(localEuler2);
          teleportMesh.visible = true;
          break;
        }
      }
      if (i < maxSteps) {
        lineMesh.geometry.setDrawRange(0, i*36);
        lineMesh.visible = true;
      }

      /* if (pad) {
        localVector.copy(vrCamera.position).applyMatrix4(localMatrix.getInverse(container.matrix));
        localEuler.setFromQuaternion(quaternion, 'YXZ');

        for (let i = 0; i < 20; i++, localVector.add(localVector2), localEuler.x = Math.max(localEuler.x - Math.PI*0.07, -Math.PI/2)) {
          localRay.set(localVector, localVector2.set(0, 0, -1).applyQuaternion(localQuaternion.setFromEuler(localEuler)));
          const intersection = localRay.intersectPlane(floorPlane, localVector3);
          if (intersection && intersection.distanceTo(localRay.origin) <= 1) {
            teleportMesh.position.copy(intersection);
            localEuler.setFromQuaternion(localQuaternion, 'YXZ');
            localEuler.x = 0;
            localEuler.z = 0;
            teleportMesh.quaternion.setFromEuler(localEuler);
            teleportMesh.visible = true;
            break;
          }
        }
      } else if (lastPad) {
        localVector.copy(teleportMesh.position).applyMatrix4(container.matrix).sub(vrCamera.position);
        localVector.y = 0;
        container.position.sub(localVector);
      }

      if (padX !== 0 || padY !== 0) {
        localVector.set(padX, 0, padY);
        const moveLength = localVector.length();
        if (moveLength > 1) {
          localVector.divideScalar(moveLength);
        }
        const hmdEuler = localEuler.setFromQuaternion(rig.inputs.hmd.quaternion, 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        container.position.sub(localVector.multiplyScalar(walkSpeed * timeDiff * (stick ? 3 : 1) * rig.height).applyEuler(hmdEuler));
      } */
    }

    if (wasVisible && !visible) {
      onTeleport(teleportMesh.position, teleportMesh.quaternion);
    }
  };

  return teleportMesh;
};

export {
  makeLineMesh,
  makeTeleportMesh,
};