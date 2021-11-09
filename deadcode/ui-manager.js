throw new Error('lol');

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import physx from './physx.js';
// import inventory from './inventory.js';
// import runtime from './runtime.js';
import {makeTextMesh, makePopupMesh} from './vr-ui.js';
import {scene, camera} from './renderer.js';
// import {WaitQueue} from './util.js';
// import {loginManager} from './login.js';
import {world} from './world.js';
import {/*colors, */storageHost} from './constants.js';

const uiManager = new EventTarget();

const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localColor = new THREE.Color();

/* const _makeInventoryContentsMesh = () => {
  const geometry = new THREE.BufferGeometry();
  const material = physx.currentVegetationMesh.material[0];
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};
const _makeInventoryBuildsMesh = () => {
  const scaleMatrix = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
  const meshes = (() => {
    const result = Array(9);
    for (let i = 0; i < physx.buildMeshes.walls.length; i++) {
      result[i*3] = physx.buildMeshes.walls[i];
    }
    for (let i = 0; i < physx.buildMeshes.platforms.length; i++) {
      result[i*3+1] = physx.buildMeshes.platforms[i];
    }
    for (let i = 0; i < physx.buildMeshes.ramps.length; i++) {
      result[i*3+2] = physx.buildMeshes.ramps[i];
    }
    return result;
  })();
  const geometries = meshes.map(m => m.geometry);
  const material = physx.buildMeshes.walls[0].material;

  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;

  const _compileGeometry = () => BufferGeometryUtils.mergeBufferGeometries(geometries.map((geometry, i) => {
    const dx = i%3;
    const dy = (i-dx)/3;
    return geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(w*2 * 0.1, w*2 * 0.1, w*2 * 0.1))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-h + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/4));
  }));
  const geometry = _compileGeometry();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.meshes = meshes;
  return mesh;
};
const _makeInventoryShapesMesh = () => {
  const boxMesh = new THREE.BoxBufferGeometry()
  const coneMesh = new THREE.ConeBufferGeometry();
  const cylinderMesh = new THREE.CylinderBufferGeometry();
  const dodecahedronMesh = new THREE.DodecahedronBufferGeometry();
  const icosahedronMesh = new THREE.IcosahedronBufferGeometry();
  const octahedronMesh = new THREE.OctahedronBufferGeometry();
  const sphereMesh = new THREE.SphereBufferGeometry();
  const tetrahedronMesh = new THREE.TetrahedronBufferGeometry();
  const torusMesh = new THREE.TorusBufferGeometry();
  const geometries = [
    boxMesh,
    coneMesh,
    cylinderMesh,
    dodecahedronMesh,
    icosahedronMesh,
    octahedronMesh,
    sphereMesh,
    tetrahedronMesh,
    torusMesh,
  ];
  const material = makeDrawMaterial(localColor.setStyle('#' + colors[0]).getHex(), localColor.setStyle('#' + colors[1]).getHex(), 1);
  const scaleMatrix = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
  for (const geometry of geometries) {
    geometry.applyMatrix4(scaleMatrix);
    geometry.boundingBox = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
    
    if (!geometry.index) {
      const indices = new Uint16Array(geometry.attributes.position.array.length/3);
      for (let i = 0; i < indices.length; i++) {
        indices[i] = i;
      }
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
  }

  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;

  const _compileGeometry = () => BufferGeometryUtils.mergeBufferGeometries(geometries.map((geometry, i) => {
    const dx = i%3;
    const dy = (i-dx)/3;
    return geometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(w*2, w*2, w*2))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(-h + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/4));
  }));
  const geometry = _compileGeometry();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.geometries = geometries;
  mesh.setColors = selectedColors => {
    mesh.material.uniforms.color1.value.setStyle('#' + colors[selectedColors[0]]);
    mesh.material.uniforms.color1.needsUpdate = true;
    mesh.material.uniforms.color2.value.setStyle('#' + colors[selectedColors[1]]);
    mesh.material.uniforms.color2.needsUpdate = true;
  };
  return mesh;
}; */
/* const _makeInventoryItemsMesh = () => {
  const h = 0.1;
  const arrowW = h/10;
  const wrapInnerW = h - 2*arrowW;
  const w = wrapInnerW/3;
  
  const object = new THREE.Object3D();
  object.update = async files => {
    for (let i = 0; i < files.length; i++) {
      const {filename, hash} = files[i];
      const dx = i%3;
      const dy = (i-dx)/3;

      {
        const u = `${storageHost}/${hash}`;
        const res = await fetch(u);
        const blob = await res.blob();
        blob.name = filename;
        const mesh = await runtime.loadFile(blob, {
          contentId: u,
        });

        mesh.position.set(-h + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/4);
        mesh.scale.set(w*2 * 0.1, w*2 * 0.1, w*2 * 0.1);
        object.add(mesh);
      }

      const textMesh = makeTextMesh(filename, './Bangers-Regular.ttf', 0.003, 'left', 'bottom');
      textMesh.position.set(-h + 0.004 + dx*w, h/2 - arrowW - w - dy*w, 0.001);
      object.add(textMesh);
    }
  };
  return object;
}; */

/* physx.waitForLoad().then(() => {
  const hpMesh = (() => {
    const mesh = new THREE.Object3D();

    let hp = 37;
    let animation = null;
    mesh.damage = dmg => {
      hp -= dmg;
      hp = Math.max(hp, 0);
      textMesh.text = _getText();
      textMesh.sync();
      barMesh.scale.x = _getBar();

      const startTime = Date.now();
      const endTime = startTime + 500;
      animation = {
        update() {
          const now = Date.now();
          const factor = (now - startTime) / (endTime - startTime);
          if (factor < 1) {
            frameMesh.position.set(0, 0, 0)
              .add(localVector2.set(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).multiplyScalar((1 - factor) * 0.02));
          } else {
            animation.end();
            animation = null;
          }
        },
        end() {
          frameMesh.position.set(0, 0, 0);
          material.color.setHex(0x000000);
        },
      };
      material.color.setHex(0xb71c1c);
    };
    mesh.update = () => {
      animation && animation.update();
    };

    const geometry = BufferGeometryUtils.mergeBufferGeometries([
      new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.02, 0)),
      new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(0, -0.02, 0)),
      new THREE.PlaneBufferGeometry(0.02, 0.04).applyMatrix4(new THREE.Matrix4().makeTranslation(-1 / 2, 0, 0)),
      new THREE.PlaneBufferGeometry(0.02, 0.04).applyMatrix4(new THREE.Matrix4().makeTranslation(1 / 2, 0, 0)),
    ]);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const frameMesh = new THREE.Mesh(geometry, material);
    frameMesh.frustumCulled = false;
    mesh.add(frameMesh);

    const geometry2 = new THREE.PlaneBufferGeometry(1, 0.02).applyMatrix4(new THREE.Matrix4().makeTranslation(1 / 2, 0, 0));
    const material2 = new THREE.MeshBasicMaterial({
      color: 0x81c784,
    });
    const barMesh = new THREE.Mesh(geometry2, material2);
    barMesh.position.x = -1 / 2;
    barMesh.position.z = -0.001;
    const _getBar = () => hp / 100;
    barMesh.scale.x = _getBar();
    barMesh.frustumCulled = false;
    frameMesh.add(barMesh);

    const _getText = () => `HP ${hp}/100`;
    const textMesh = makeTextMesh(_getText(), './Bangers-Regular.ttf', 0.05, 'left', 'bottom');
    textMesh.position.x = -1 / 2;
    textMesh.position.y = 0.05;
    mesh.add(textMesh);

    return mesh;
  })();
  // scene.add(hpMesh);
  uiManager.hpMesh = hpMesh;
}); */

const popupMesh = makePopupMesh();
popupMesh.visible = false;
scene.add(popupMesh);
uiManager.popupMesh = popupMesh;

export default uiManager;