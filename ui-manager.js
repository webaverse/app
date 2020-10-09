import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import geometryManager from './geometry-manager.js';
import weaponsManager from './weapons-manager.js';
import inventory from './inventory.js';
import runtime from './runtime.js';
import {onclickBindings} from './components/App.js';
import {makeInventoryMesh, makeTextMesh} from './vr-ui.js';
import {renderer, scene, camera} from './app-object.js';
import {WaitQueue} from './util.js';
import {makeDrawMaterial} from './shaders.js';
import {loginManager} from './login.js';
import {planet} from './planet.js';
import {makeColorsMesh, makeMenuMesh, makeDetailsMesh, makeTradeMesh, makePopupMesh, makeToolsMesh} from './vr-ui.js';
import {colors, storageHost} from './constants.js';

const uiManager = new EventTarget();

const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localColor = new THREE.Color();

const _makeInventoryContentsMesh = () => {
  const geometry = new THREE.BufferGeometry();
  const material = geometryManager.currentVegetationMesh.material[0];
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
        const mesh = await runtime.loadFile(blob);

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

geometryManager.waitForLoad().then(() => {
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
  scene.add(hpMesh);
  uiManager.hpMesh = hpMesh;

  const buildsMesh = makeInventoryMesh(weaponsManager.cubeMesh, async scrollFactor => {
    // nothing
  });
  buildsMesh.inventoryBuildsMesh = _makeInventoryBuildsMesh();
  buildsMesh.inventoryBuildsMesh.frustumCulled = false;
  buildsMesh.add(buildsMesh.inventoryBuildsMesh);
  buildsMesh.handleIconClick = (i, srcIndex) => {
    const dx = srcIndex%3;
    const dy = (srcIndex-dx)/3;
    weaponsManager.buildMode = ['wall', 'floor', 'stair'][dx];
    weaponsManager.buildMat = ['wood', 'stone', 'metal'][dy];
  };
  buildsMesh.visible = false;
  scene.add(buildsMesh);
  uiManager.buildsMesh = buildsMesh;

  const queue = new WaitQueue()
  const thingsMesh = makeInventoryMesh(weaponsManager.cubeMesh, async scrollFactor => {
    // await loadPromise;
    queue.clearQueue();
    await queue.lock();

    const geometryKeys = await geometryManager.geometryWorker.requestGetGeometryKeys(geometryManager.geometrySet);
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
    const newGeometry = await geometryManager.geometryWorker.requestGetGeometries(geometryManager.geometrySet, geometryRequests);
    thingsMesh.inventoryContentsMesh.geometry.setAttribute('position', newGeometry.attributes.position);
    thingsMesh.inventoryContentsMesh.geometry.setAttribute('uv', newGeometry.attributes.uv);
    thingsMesh.inventoryContentsMesh.geometry.setIndex(newGeometry.index);

    thingsMesh.geometryKeys = geometryKeys;
    thingsMesh.currentGeometryKeys = currentGeometryKeys;

    queue.unlock();
  });
  thingsMesh.inventoryContentsMesh = _makeInventoryContentsMesh();
  thingsMesh.inventoryContentsMesh.position.set(-0.1/2, 0, 0);
  thingsMesh.inventoryContentsMesh.frustumCulled = false;
  thingsMesh.add(thingsMesh.inventoryContentsMesh);
  thingsMesh.geometryKeys = null;
  thingsMesh.currentGeometryKeys = null;
  thingsMesh.handleIconClick = (i, srcIndex) => {
    if (srcIndex < thingsMesh.currentGeometryKeys.length) {
      const geometryKey = thingsMesh.currentGeometryKeys[srcIndex];
      (async () => {
        const geometry = await geometryWorker.requestGetGeometry(geometrySet, geometryKey);
        const material = geometryManager.currentVegetationMesh.material[0];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        meshComposer.setPlaceMesh(i, mesh);
      })();
    }
  };
  thingsMesh.visible = false;
  scene.add(thingsMesh);
  uiManager.thingsMesh = thingsMesh;

  const shapesMesh = makeInventoryMesh(weaponsManager.cubeMesh, async scrollFactor => {
    // nothing
  });
  shapesMesh.inventoryShapesMesh = _makeInventoryShapesMesh();
  shapesMesh.inventoryShapesMesh.frustumCulled = false;
  shapesMesh.add(shapesMesh.inventoryShapesMesh);
  shapesMesh.handleIconClick = (i, srcIndex) => {
    if (srcIndex < shapesMesh.inventoryShapesMesh.geometries.length) {
      const geometry = shapesMesh.inventoryShapesMesh.geometries[srcIndex];
      const material = shapesMesh.inventoryShapesMesh.material.clone();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      meshComposer.setPlaceMesh(i, mesh);
    }
  };
  shapesMesh.visible = false;
  scene.add(shapesMesh);
  uiManager.shapesMesh = shapesMesh;

  const inventoryMesh = makeInventoryMesh(weaponsManager.cubeMesh, () => {});
  inventoryMesh.inventoryItemsMesh = _makeInventoryItemsMesh();
  inventoryMesh.add(inventoryMesh.inventoryItemsMesh);
  inventoryMesh.visible = false;
  inventoryMesh.handleIconClick = async (i, srcIndex) => {
    const files = inventory.getOwnedFiles();
    const file = files[srcIndex];
    const {filename, hash} = file;
    const res = await fetch(`${storageHost}/${hash}`);
    const blob = await res.blob();
    blob.name = filename;

    const mesh = await runtime.loadFile(blob);
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
  uiManager.colorsMesh = colorsMesh;

  const menuMesh = makeMenuMesh(weaponsManager.cubeMesh, onclickBindings);
  menuMesh.visible = false;
  menuMesh.toggleOpen = () => {
    uiManager.menuMesh.visible = !uiManager.menuMesh.visible;
    if (uiManager.menuMesh.visible) {
      const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
      uiManager.menuMesh.position.copy(xrCamera.position)
        .add(new THREE.Vector3(0, 0, -2).applyQuaternion(xrCamera.quaternion));
      uiManager.menuMesh.quaternion.copy(xrCamera.quaternion);
    }
  };
  scene.add(menuMesh);
  uiManager.menuMesh = menuMesh;

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
    planet.removeObject(detailsMesh.target);

    detailsMesh.visible = false;

    /* meshComposer.cancel();
    detailsMesh.visible = false; */
  }, function onclose() {
    detailsMesh.visible = false;
  });
  detailsMesh.visible = false;
  detailsMesh.target = null;
  scene.add(detailsMesh);
  uiManager.detailsMesh = detailsMesh;

  const tradeMesh = makeTradeMesh(weaponsManager.cubeMesh, function ontrade(ftAmount) {
    loginManager.sendFt(loginManager.getAddress(), ftAmount); // XXX
  }, function onclose() {
    tradeMesh.visible = false;
  });
  tradeMesh.visible = false;
  tradeMesh.target = null;
  scene.add(tradeMesh);
  uiManager.tradeMesh = tradeMesh;

  const popupMesh = makePopupMesh();
  popupMesh.visible = false;
  scene.add(popupMesh);
  uiManager.popupMesh = popupMesh;

  uiManager.toolMenuMeshes = [
    uiManager.buildsMesh,
    uiManager.thingsMesh,
    uiManager.shapesMesh,
    uiManager.inventoryMesh,
    uiManager.colorsMesh,
  ];
  uiManager.menuMeshes = [
    uiManager.menuMesh,
  ].concat(uiManager.toolMenuMeshes);
  uiManager.infoMeshes = [
    uiManager.detailsMesh,
    uiManager.tradeMesh,
  ];
  uiManager.uiMeshes = uiManager.menuMeshes
    .concat(uiManager.infoMeshes);

  uiManager.toolsMesh = makeToolsMesh(weaponsManager.weapons.map(weapon => weapon.getAttribute('weapon')), newSelectedWeapon => {
    weaponsManager.setWeapon(newSelectedWeapon);
  }, () => {
    menuMesh.toggleOpen();
  });
  uiManager.toolsMesh.visible = false;
  scene.add(uiManager.toolsMesh);

  uiManager.openTradeMesh = (point, mesh) => {
    for (const infoMesh of uiManager.infoMeshes) {
      infoMesh.visible = false;
    }

    const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
    uiManager.tradeMesh.position.copy(point);
    localEuler.setFromQuaternion(localQuaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      uiManager.tradeMesh.position.clone().sub(xrCamera.position).normalize()
    ), 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;
    uiManager.tradeMesh.quaternion.setFromEuler(localEuler);
    uiManager.tradeMesh.visible = true;
    uiManager.tradeMesh.target = mesh;
  };
  uiManager.openDetailsMesh = (point, mesh) => {
    for (const infoMesh of uiManager.infoMeshes) {
      infoMesh.visible = false;
    }

    const xrCamera = renderer.xr.getSession() ? renderer.xr.getCamera(camera) : camera;
    uiManager.detailsMesh.position.copy(point);
    localEuler.setFromQuaternion(localQuaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      uiManager.detailsMesh.position.clone().sub(xrCamera.position).normalize()
    ), 'YXZ');
    localEuler.x = 0;
    localEuler.z = 0;
    uiManager.detailsMesh.quaternion.setFromEuler(localEuler);
    uiManager.detailsMesh.visible = true;
    uiManager.detailsMesh.target = mesh;
  };

  uiManager.update = () => {
    hpMesh.update();
    popupMesh.update();
  };
});

export default uiManager;