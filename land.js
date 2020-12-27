import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';

const wallGeometry = (() => {
  const panelGeometries = [];
  for (let x = -1 / 2; x <= 1 / 2; x++) {
    panelGeometries.push(
      new THREE.BoxBufferGeometry(0.01, 1, 0.01)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(x, 0, -1/2)),
    );
  }
  for (let h = 0; h <= 1; h++) {
    panelGeometries.push(
      new THREE.BoxBufferGeometry(1, 0.01, 0.01)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, h -1/2, -1/2)),
    );
  }
  return BufferGeometryUtils.mergeBufferGeometries(panelGeometries);
})();
const topWallGeometry = wallGeometry.clone();
// .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const leftWallGeometry = wallGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2));
  // .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const rightWallGeometry = wallGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
  // .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const bottomWallGeometry = wallGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI));
  // .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const distanceFactor = 64;
export function GuardianMesh(extents, color) {
  const geometry = (() => {
    const geometries = [];
    const [x1, y1, z1, x2, y2, z2] = extents;
    const ax1 = (x1 + 0.5);
    const ay1 = (y1 + 0.5);
    const az1 = (z1 + 0.5);
    const ax2 = (x2 + 0.5);
    const ay2 = (y2 + 0.5);
    const az2 = (z2 + 0.5);
    for (let y = ay1; y < ay2; y++) {
      for (let x = ax1; x < ax2; x++) {
        geometries.push(
          topWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, az1)),
        );
        geometries.push(
          bottomWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, (az2 - 1))),
        );
      }
      for (let z = az1; z < az2; z++) {
        geometries.push(
          leftWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation(ax1, y, z)),
        );
        geometries.push(
          rightWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation((ax2 - 1), y, z)),
        );
      }
    }
    return BufferGeometryUtils.mergeBufferGeometries(geometries);
  })();
  const gridVsh = `
    // varying vec3 vWorldPos;
    // varying vec2 vUv;
    varying float vDepth;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      // vUv = uv;
      // vWorldPos = abs(position);
      vDepth = gl_Position.z / ${distanceFactor.toFixed(8)};
    }
  `;
  const gridFsh = `
    // uniform sampler2D uTex;
    uniform vec3 uColor;
    // uniform float uAnimation;
    // varying vec3 vWorldPos;
    varying float vDepth;
    void main() {
      gl_FragColor = vec4(uColor, (1.0-vDepth));
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: {
        type: 'c',
        value: new THREE.Color(color),
      },
    },
    vertexShader: gridVsh,
    fragmentShader: gridFsh,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.setColor = c => {
    mesh.material.uniforms.uColor.value.setHex(c);
  };
  return mesh;
}
