import * as THREE from './three.module.js';
import geometryManager from './geometry-manager.js';
import weaponsManager from './weapons-manager.js';
import {makeInventoryMesh} from './vr-ui.js';
import {scene} from './app-object.js';
import {WaitQueue} from './util.js';
import {makeDrawMaterial} from './shaders.js';
import {makeColorsMesh, makeDetailsMesh, makeToolsMesh} from './vr-ui.js';
import {colors} from './constants.js';

const uiManager = new EventTarget();

const _makeInventoryContentsMesh = () => {
  const geometry = new THREE.BufferGeometry();
  const material = currentVegetationMesh.material[0];
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};
const _makeInventoryBuildsMesh = () => {
  const scaleMatrix = new THREE.Matrix4().makeScale(0.1, 0.1, 0.1);
  const meshes = (() => {
    const result = Array(9);
    for (let i = 0; i < geometryManager.buildMeshes.walls.length; i++) {
      result[i*3] = geometryManager.buildMeshes.walls[i];
    }
    for (let i = 0; i < geometryManager.buildMeshes.platforms.length; i++) {
      result[i*3+1] = geometryManager.buildMeshes.platforms[i];
    }
    for (let i = 0; i < geometryManager.buildMeshes.ramps.length; i++) {
      result[i*3+2] = geometryManager.buildMeshes.ramps[i];
    }
    return result;
  })();
  const geometries = meshes.map(m => m.geometry);
  const material = geometryManager.buildMeshes.walls[0].material;

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
};
const _makeInventoryItemsMesh = () => {
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
        const res = await fetch(`${storageHost}/${hash}`);
        const blob = await res.blob();
        blob.name = filename;
        const mesh = await runtime.loadFileForWorld(blob);

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
};

geometryManager.addEventListener('load', () => {
  const buildsMesh = makeInventoryMesh(weaponsManager.cubeMesh, async scrollFactor => {
    await loadPromise;

    if (!buildsMesh.inventoryBuildsMesh) {
      buildsMesh.inventoryBuildsMesh = _makeInventoryBuildsMesh();
      buildsMesh.inventoryBuildsMesh.frustumCulled = false;
      buildsMesh.add(buildsMesh.inventoryBuildsMesh);
    }
  });
  buildsMesh.visible = false;
  buildsMesh.handleIconClick = (i, srcIndex) => {
    const dx = srcIndex%3;
    const dy = (srcIndex-dx)/3;
    buildMode = ['wall', 'floor', 'stair'][dx];
    buildMat = ['wood', 'stone', 'metal'][dy];
  };
  scene.add(buildsMesh);
  uiManager.buildsMesh = buildsMesh;

  const thingsMesh = makeInventoryMesh(weaponsManager.cubeMesh, async scrollFactor => {
    await loadPromise;
    thingsMesh.queue.clearQueue();
    await thingsMesh.queue.lock();

    if (!thingsMesh.inventoryContentsMesh) {
      thingsMesh.inventoryContentsMesh = _makeInventoryContentsMesh();
      thingsMesh.inventoryContentsMesh.position.set(-0.1/2, 0, 0);
      thingsMesh.inventoryContentsMesh.frustumCulled = false;
      thingsMesh.add(thingsMesh.inventoryContentsMesh);
    }

    const geometryKeys = await geometryWorker.requestGetGeometryKeys(geometrySet);
    const geometryRequests = [];

    const h = 0.1;
    const arrowW = h/10;
    const wrapInnerW = h - 2*arrowW;
    const w = wrapInnerW/3;

    const startIndex = Math.floor(scrollFactor*(geometryKeys.length-9)/3)*3;
    let i = 0;
    const currentGeometryKeys = [];
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        const srcIndex = startIndex + i;
        if (srcIndex < geometryKeys.length) {
          const name = geometryKeys[srcIndex];
          geometryRequests.push({
            name,
            position: new THREE.Vector3(-h/2 + w/2 + dx*w, h/2 - arrowW - w/2 - dy*w, w/2),
            quaternion: new THREE.Quaternion(),
            scale: new THREE.Vector3(w, w, w),
          });
          currentGeometryKeys.push(name);
          i++;
        }
      }
    }
    const newGeometry = await geometryWorker.requestGetGeometries(geometrySet, geometryRequests);
    thingsMesh.inventoryContentsMesh.geometry.setAttribute('position', newGeometry.attributes.position);
    thingsMesh.inventoryContentsMesh.geometry.setAttribute('uv', newGeometry.attributes.uv);
    thingsMesh.inventoryContentsMesh.geometry.setIndex(newGeometry.index);

    thingsMesh.geometryKeys = geometryKeys;
    thingsMesh.currentGeometryKeys = currentGeometryKeys;

    thingsMesh.queue.unlock();
  });
  thingsMesh.visible = false;
  thingsMesh.geometryKeys = null;
  thingsMesh.currentGeometryKeys = null;
  thingsMesh.inventoryContentsMesh = null;
  thingsMesh.queue = new WaitQueue();
  thingsMesh.handleIconClick = (i, srcIndex) => {
    if (srcIndex < thingsMesh.currentGeometryKeys.length) {
      const geometryKey = thingsMesh.currentGeometryKeys[srcIndex];
      (async () => {
        const geometry = await geometryWorker.requestGetGeometry(geometrySet, geometryKey);
        const material = currentVegetationMesh.material[0];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        meshComposer.setPlaceMesh(i, mesh);
      })();
    }
  };
  scene.add(thingsMesh);
  uiManager.thingsMesh = thingsMesh;

  const shapesMesh = makeInventoryMesh(weaponsManager.cubeMesh, async scrollFactor => {
    await loadPromise;

    if (!shapesMesh.inventoryShapesMesh) {
      shapesMesh.inventoryShapesMesh = _makeInventoryShapesMesh();
      shapesMesh.inventoryShapesMesh.frustumCulled = false;
      shapesMesh.add(shapesMesh.inventoryShapesMesh);
    }
  });
  shapesMesh.visible = false;
  shapesMesh.handleIconClick = (i, srcIndex) => {
    if (srcIndex < shapesMesh.inventoryShapesMesh.geometries.length) {
      const geometry = shapesMesh.inventoryShapesMesh.geometries[srcIndex];
      const material = shapesMesh.inventoryShapesMesh.material.clone();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      meshComposer.setPlaceMesh(i, mesh);
    }
  };
  scene.add(shapesMesh);
  uiManager.shapesMesh = shapesMesh;

  const inventoryMesh = makeInventoryMesh(weaponsManager.cubeMesh, () => {});
  inventoryMesh.inventoryItemsMesh = _makeInventoryItemsMesh();
  inventoryMesh.add(inventoryMesh.inventoryItemsMesh);
  inventoryMesh.visible = false;
  inventoryMesh.handleIconClick = async (i, srcIndex) => {
    const files = inventory.getFiles();
    const file = files[srcIndex];
    const {filename, hash} = file;
    const res = await fetch(`${storageHost}/${hash}`);
    const blob = await res.blob();
    blob.name = filename;

    const mesh = await runtime.loadFileForWorld(blob);
    mesh.run && mesh.run();
    mesh.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;
      }
    });
    meshComposer.setPlaceMesh(i, mesh);
  };
  scene.add(inventoryMesh);
  uiManager.inventoryMesh = inventoryMesh;

  let selectedColors;
  const colorsMesh = makeColorsMesh(weaponsManager.cubeMesh, colors, newSelectedColors => {
    selectedColors = newSelectedColors;
    shapesMesh.inventoryShapesMesh.setColors(selectedColors);
    meshDrawer.setColors(selectedColors);
  });
  colorsMesh.visible = false;
  scene.add(colorsMesh);

  const _bakeAndUploadComposerMesh = async () => {
    const mesh = meshComposer.commit();
    mesh.material = new THREE.MeshBasicMaterial({
      map: mesh.material.uniforms.map.value,
      side: THREE.DoubleSide,
      vertexColors: true,
      transparent: true,
    });
    mesh.userData.gltfExtensions = {
      EXT_aabb: mesh.geometry.boundingBox.min.toArray()
        .concat(mesh.geometry.boundingBox.max.toArray()),
    };
    const arrayBuffer = await new Promise((accept, reject) => {
      new GLTFExporter().parse(mesh, accept, {
        binary: true,
        includeCustomExtensions: true,
      });
    });
    arrayBuffer.name = 'object.glb';
    const {hash} = await inventory.uploadFile(arrayBuffer);
    return {mesh, hash};
  };
  const detailsMesh = makeDetailsMesh(weaponsManager.cubeMesh, function onrun(anchorSpec) {
    meshComposer.run();
  }, async function onbake(anchorSpec) {
    const {mesh, hash} = await _bakeAndUploadComposerMesh();
    const hashUint8Array = hex2Uint8Array(hash);

    const canvas = mesh.material.map.image;
    const texture = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    await geometryWorker.requestAddThingGeometry(tracker, geometrySet, hashUint8Array, mesh.geometry.attributes.position.array, mesh.geometry.attributes.uv.array, mesh.geometry.index.array, mesh.geometry.attributes.position.length, mesh.geometry.attributes.uv.array.length, mesh.geometry.index.array.length, texture);
    await geometryWorker.requestAddThing(tracker, geometrySet, hashUint8Array, mesh.position, mesh.quaternion, mesh.scale);

    detailsMesh.visible = false;
  }, async function onadd(anchorSpec) {
    await _bakeAndUploadComposerMesh();

    detailsMesh.visible = false;
  }, function onremove(anchorSpec) {
    // console.log('got remove', anchorSpec);
    meshComposer.cancel();
    detailsMesh.visible = false;
  }, function onclose() {
    detailsMesh.visible = false;
  });
  detailsMesh.visible = false;
  scene.add(detailsMesh);
  uiManager.colorsMesh = colorsMesh;

  uiManager.menuMeshes = [
    uiManager.buildsMesh,
    uiManager.thingsMesh,
    uiManager.shapesMesh,
    uiManager.inventoryMesh,
    uiManager.colorsMesh,
  ];
  uiManager.uiMeshes = uiManager.menuMeshes.concat([detailsMesh]);

  uiManager.toolsMesh = makeToolsMesh(weaponsManager.weapons.map(weapon => weapon.getAttribute('weapon')), newSelectedWeapon => {
    weaponsManager.setWeapon(newSelectedWeapon);
  });
  uiManager.toolsMesh.visible = false;
  scene.add(uiManager.toolsMesh);
});

export default uiManager;