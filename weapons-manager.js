import * as THREE from './three.module.js';
import {BufferGeometryUtils} from './BufferGeometryUtils.js';
import {makeCubeMesh, makeRayMesh} from './vr-ui.js';
import geometryManager /* {
  geometrySet,
  tracker,
  landAllocators,
  landBufferAttributes,
  vegetationAllocators,
  vegetationBufferAttributes,
  thingAllocators,
  thingBufferAttributes,
  geometryWorker,
} */ from './geometry-manager.js';
import uiManager from './ui-manager.js';
import ioManager from './io-manager.js';
import {rigManager} from './rig.js';
import {teleportMeshes} from './teleport.js';
import {renderer, scene} from './app-object.js';

let selectedWeapon = 'hand';
let lastSelectedWeapon = selectedWeapon;
const weapons = Array.from(document.querySelectorAll('.weapon'));
for (let i = 0; i < weapons.length; i++) {
  const weapon = document.getElementById('weapon-' + (i + 1));
  weapon.addEventListener('click', e => {
    for (let i = 0; i < weapons.length; i++) {
      weapons[i].classList.remove('selected');
    }
    weapon.classList.add('selected');

    selectedWeapon = weapon.getAttribute('weapon');
  });
}
let raycastChunkSpec = null;
let anchorSpecs = [null, null];

const rayMesh = makeRayMesh();
rayMesh.visible = false;
scene.add(rayMesh);

const cubeMesh = makeCubeMesh();
scene.add(cubeMesh);

const addMesh = (() => {
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
  ]);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0000FF,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
})();
addMesh.visible = false;
scene.add(addMesh);

const removeMesh = (() => {
  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
  ]);
  const material = new THREE.MeshBasicMaterial({
    color: 0xFF0000,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
})();
removeMesh.visible = false;
scene.add(removeMesh);

const _updateTools = () => {
  for (let i = 0; i < 2; i++) {
    anchorSpecs[i] = null;
  }
  raycastChunkSpec = null;
  rayMesh.visible = false;

  const _raycastWeapon = () => {
    if (['build', 'things', 'shapes', 'inventory', 'colors', 'select'].includes(selectedWeapon)) {
      const [{position, quaternion}] = _getRigTransforms();
      raycaster.ray.origin.copy(position);
      raycaster.ray.direction.set(0, 0, -1).applyQuaternion(quaternion);
      anchorSpecs[0] = intersectUi(raycaster, uiMeshes) || meshComposer.intersect(raycaster);

      if (anchorSpecs[0]) {
        rayMesh.position.copy(position);
        rayMesh.quaternion.copy(quaternion);
        rayMesh.scale.set(1, 1, position.distanceTo(anchorSpecs[0].point));
        rayMesh.visible = true;
      }
    }
    if (!anchorSpecs[0]) {
      const result = geometryManager.geometryWorker.raycast(geometryManager.tracker, rigManager.localRig.inputs.leftGamepad.position, rigManager.localRig.inputs.leftGamepad.quaternion);
      raycastChunkSpec = result;
      if (raycastChunkSpec) {
        raycastChunkSpec.point = new THREE.Vector3().fromArray(raycastChunkSpec.point);
        raycastChunkSpec.normal = new THREE.Vector3().fromArray(raycastChunkSpec.normal);
        raycastChunkSpec.objectPosition = new THREE.Vector3().fromArray(raycastChunkSpec.objectPosition);
        raycastChunkSpec.objectQuaternion = new THREE.Quaternion().fromArray(raycastChunkSpec.objectQuaternion);
        cubeMesh.position.copy(raycastChunkSpec.point);
      }
    }
  };
  _raycastWeapon();

  const _selectWeapon = () => {
    [
      geometryManager.assaultRifleMesh,
      geometryManager.grenadeMesh,
      geometryManager.crosshairMesh,
      geometryManager.plansMesh,
      geometryManager.pencilMesh,
      geometryManager.pickaxeMesh,
      geometryManager.paintBrushMesh,
    ].forEach(weaponMesh => {
      if (weaponMesh) {
        weaponMesh.visible = false;
      }
    });
    const selectedWeaponModel = (() => {
      switch (selectedWeapon) {
        case 'rifle': {
          return {
            weapon: geometryManager.assaultRifleMesh,
            crosshair: geometryManager.crosshairMesh,
          };
        }
        case 'grenade': {
          return {
            weapon: geometryManager.grenadeMesh,
            crosshair: geometryManager.crosshairMesh,
          };
        }
        case 'pickaxe': {
          return geometryManager.pickaxeMesh;
        }
        case 'shovel': {
          return geometryManager.pickaxeMesh;
        }
        case 'build': {
          return [geometryManager.plansMesh, geometryManager.pencilMesh];
        }
        case 'things': {
          return geometryManager.pencilMesh;
        }
        case 'shapes': {
          return geometryManager.pencilMesh;
        }
        case 'light': {
          return geometryManager.paintBrushMesh;
        }
        case 'pencil': {
          return geometryManager.pencilMesh;
        }
        case 'paintbrush': {
          return geometryManager.paintBrushMesh;
        }
        case 'select': {
          return geometryManager.pencilMesh;
        }
        case 'physics': {
          return geometryManager.pencilMesh;
        }
        default: {
          return null;
        }
      }
    })();
    if (selectedWeaponModel) {
      if (!selectedWeaponModel.isMesh) {
        if (Array.isArray(selectedWeaponModel)) {
          // const pose2 = frame.getPose(session.inputSources[0].targetRaySpace, referenceSpace);
          // localMatrix.fromArray(pose.transform.matrix)
          // .decompose(localVector3, localQuaternion2, localVector4);

          selectedWeaponModel.forEach((weaponMesh, i) => {
            if (weaponMesh) {
              if (i === 0) {
                weaponMesh.position.copy(rightGamepad.position);
                weaponMesh.quaternion.copy(rightGamepad.quaternion);
                weaponMesh.visible = true;
              } else if (i === 1) {
                weaponMesh.position.copy(leftGamepad.position);
                weaponMesh.quaternion.copy(leftGamepad.quaternion);
                weaponMesh.visible = true;
              }
            }
          });
        } else {
          const {weapon, crosshair} = selectedWeaponModel;
          if (weapon) {
            weapon.position.copy(rightGamepad.position);
            weapon.quaternion.copy(rightGamepad.quaternion);
            weapon.visible = true;
          }
          if (crosshair) {
            crosshair.visible = true;
          }
        }
      } else {
        selectedWeaponModel.position.copy(rightGamepad.position);
        selectedWeaponModel.quaternion.copy(rightGamepad.quaternion);
        selectedWeaponModel.visible = true;
      }
    }
    addMesh.visible = false;
    removeMesh.visible = false;
    switch (selectedWeapon) {
      case 'rifle':
      case 'grenade':
      {
        if (crosshairMesh) {
          crosshairMesh.position.copy(rightGamepad.position)
            .add(localVector2.set(0, 0, -500).applyQuaternion(rightGamepad.quaternion));
          crosshairMesh.quaternion.copy(rightGamepad.quaternion);
          crosshairMesh.visible = true;
        }
        break;
      }
      case 'pickaxe':
      case 'shovel': {
        if (raycastChunkSpec) {
          removeMesh.position.copy(raycastChunkSpec.point);
          removeMesh.quaternion.setFromUnitVectors(localVector2.set(0, 1, 0), raycastChunkSpec.normal);
          removeMesh.visible = true;
        }
        break;
      }
      case 'build': {
        addMesh.position.copy(rightGamepad.position)
          .add(localVector2.set(0, 0, -2).applyQuaternion(rightGamepad.quaternion));
        addMesh.quaternion.copy(rightGamepad.quaternion);
        addMesh.visible = true;
        break;
      }
    }
  };
  _selectWeapon();

  const _handleBuild = () => {
    for (const k in geometryManager.buildMeshes) {
      for (const buildMesh of geometryManager.buildMeshes[k]) {
        buildMesh.parent && buildMesh.parent.remove(buildMesh);
      }
    }
    if (selectedWeapon === 'build') {
      const buildMesh = (() => {
        const buildMatIndex = ['wood', 'stone', 'metal'].indexOf(buildMat);
        switch (buildMode) {
          case 'wall': return buildMeshes.walls[buildMatIndex];
          case 'floor': return buildMeshes.platforms[buildMatIndex];
          case 'stair': return buildMeshes.ramps[buildMatIndex];
          default: return null;
        }
      })();

      buildMesh.position.copy(rightGamepad.position)
        .add(localVector3.set(0, 0, -BUILD_SNAP).applyQuaternion(rightGamepad.quaternion))
        .add(localVector3.set(0, -BUILD_SNAP / 2, 0));
      buildMesh.quaternion.copy(rightGamepad.quaternion);

      buildMesh.matrix.compose(buildMesh.position, buildMesh.quaternion, buildMesh.scale)
        .premultiply(localMatrix2.getInverse(currentChunkMesh.matrixWorld))
        .decompose(buildMesh.position, buildMesh.quaternion, buildMesh.scale);
      _snapBuildPosition(buildMesh.position);

      localVector3.set(0, 1, 0).applyQuaternion(buildMesh.quaternion);
      if (Math.abs(localVector3.x) > Math.abs(localVector3.y) && Math.abs(localVector3.x) > Math.abs(localVector3.z)) {
        localVector3.set(Math.sign(localVector3.x), 0, 0);
      } else if (Math.abs(localVector3.y) > Math.abs(localVector3.x) && Math.abs(localVector3.y) > Math.abs(localVector3.z)) {
        localVector3.set(0, Math.sign(localVector3.y), 0);
      } else {
        localVector3.set(0, 0, Math.sign(localVector3.z));
      }
      localVector4.set(0, 0, -1).applyQuaternion(buildMesh.quaternion);
      if (Math.abs(localVector4.x) > Math.abs(localVector4.y) && Math.abs(localVector4.x) > Math.abs(localVector4.z)) {
        localVector4.set(Math.sign(localVector4.x), 0, 0);
      } else if (Math.abs(localVector4.y) > Math.abs(localVector4.x) && Math.abs(localVector4.y) > Math.abs(localVector4.z)) {
        localVector4.set(0, Math.sign(localVector4.y), 0);
      } else {
        localVector4.set(0, 0, Math.sign(localVector4.z));
      }
      buildMesh.quaternion.setFromRotationMatrix(localMatrix2.lookAt(
        localVector2.set(0, 0, 0),
        localVector4,
        localVector3,
      ));

      const hasBuildMesh = (() => {
        for (const index in currentChunkMesh.vegetationMeshes) {
          const subparcelBuildMeshesSpec = currentChunkMesh.vegetationMeshes[index];
          if (subparcelBuildMeshesSpec && subparcelBuildMeshesSpec.meshes.some(m => _meshEquals(m, buildMesh))) {
            return true;
          }
        }
        return false;
      })();
      if (!hasBuildMesh) {
        buildMesh.traverse(o => {
          if (o.isMesh && o.originalMaterial) {
            o.material = o.originalMaterial;
            o.originalMaterial = null;
          }
        });
      } else {
        buildMesh.traverse(o => {
          if (o.isMesh && !o.originalMaterial) {
            o.originalMaterial = o.material;
            o.material = redBuildMeshMaterial;
          }
        });
      }

      currentChunkMesh.add(buildMesh);
    }
  };
  _handleBuild();

  const _handleDown = () => {
    if (ioManager.currentWeaponDown && !ioManager.lastWeaponDown) { // XXX make this dual handed
      // place
      for (let i = 0; i < 2; i++) {
        const placeMesh = meshComposer.getPlaceMesh(i);
        if (placeMesh) {
          meshComposer.trigger(i);
          return;
        }
      }
      // else
      const _applyLightfieldDelta = async (position, delta) => {
        localVector2.copy(position)
          .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
        localVector2.x = Math.floor(localVector2.x);
        localVector2.y = Math.floor(localVector2.y);
        localVector2.z = Math.floor(localVector2.z);

        const mineSpecs = _applyMineSpec(localVector2, delta, 'lightfield', SUBPARCEL_SIZE_P1, planet.getFieldIndex, delta);
        await _mine(mineSpecs, null);
      };
      const _applyHit = delta => {
        if (raycastChunkSpec) {
          if (raycastChunkSpec.objectId === 0) {
            localVector2.copy(raycastChunkSpec.point)
              .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));

            geometryManager.geometryWorker.requestMine(geometryManager.tracker, localVector2, delta);
          } else {
            currentVegetationMesh.hitTracker.hit(raycastChunkSpec.objectId, raycastChunkSpec.objectPosition, raycastChunkSpec.objectQuaternion, 30);
          }
        }
      };
      const _hit = () => _applyHit(-0.3);
      const _unhit = () => _applyHit(0.3);
      const _light = () => {
        if (raycastChunkSpec) {
          localVector2.copy(raycastChunkSpec.point)
            .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));

          geometryManager.geometryWorker.requestLight(geometryManager.tracker, localVector2, 4);

          /* if (raycastChunkSpec.mesh.isChunkMesh || raycastChunkSpec.mesh.isVegetationMesh) {
            _applyLightfieldDelta(raycastChunkSpec.point, 4);

            localVector2.copy(raycastChunkSpec.point)
              .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
            localVector2.x = Math.floor(localVector2.x / SUBPARCEL_SIZE);
            localVector2.y = Math.floor(localVector2.y / SUBPARCEL_SIZE);
            localVector2.z = Math.floor(localVector2.z / SUBPARCEL_SIZE);
            currentChunkMesh.updateSlab(localVector2.x, localVector2.y, localVector2.z);
          } */
        }
      };
      const _explode = (position, quaternion) => {
        const explosionMesh = _makeExplosionMesh();
        explosionMesh.position.copy(position);
        explosionMesh.quaternion.copy(quaternion);
        scene.add(explosionMesh);
        explosionMeshes.push(explosionMesh);
      };
      const _damage = dmg => {
        hpMesh.damage(dmg);
      };
      const _openDetailsMesh = (point, mesh) => {
        detailsMesh.position.copy(point);
        localEuler.setFromQuaternion(localQuaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, -1),
          detailsMesh.position.clone().sub(xrCamera.position).normalize()
        ), 'YXZ');
        localEuler.x = 0;
        localEuler.z = 0;
        detailsMesh.quaternion.setFromEuler(localEuler);
        detailsMesh.visible = true;
      };
      const _triggerAnchor = mesh => {
        for (let i = 0; i < 2; i++) {
          const anchorSpec = anchorSpecs[i];
          if (anchorSpec) {
            let match;
            if (match = anchorSpec.anchor && anchorSpec.anchor.id.match(/^icon-([0-9]+)$/)) { // menu icon
              const srcIndex = parseInt(match[1], 10);
              mesh.handleIconClick(i, srcIndex);
            } else {
              if (anchorSpec.object.click) { // menu non-icon
                anchorSpec.object.click(anchorSpec);
              } else { // non-menu
                _openDetailsMesh(anchorSpec.point, anchorSpec.object);
              }
            }
          }
        }
      };
      switch (selectedWeapon) {
        case 'rifle': {
          _hit();
          localVector2.copy(assaultRifleMesh.position)
            .add(localVector3.set(0, 0.09, -0.7).applyQuaternion(assaultRifleMesh.quaternion));
          _explode(localVector2, assaultRifleMesh.quaternion);
          crosshairMesh.trigger();
          break;
        }
        case 'grenade': {
          if (currentChunkMesh) {
            const pxMesh = grenadeMesh.clone();

            localVector2.copy(grenadeMesh.position)
              .applyMatrix4(localMatrix.getInverse(currentChunkMesh.matrixWorld));
            localQuaternion2.copy(grenadeMesh.quaternion)
              .premultiply(currentChunkMesh.getWorldQuaternion(localQuaternion3).inverse());
            pxMesh.position.copy(localVector2);
            pxMesh.velocity = new THREE.Vector3(0, 0, -10)
              .applyQuaternion(localQuaternion2);
            pxMesh.angularVelocity = new THREE.Vector3((-1 + Math.random() * 2) * Math.PI * 2 * 0.01, (-1 + Math.random() * 2) * Math.PI * 2 * 0.01, (-1 + Math.random() * 2) * Math.PI * 2 * 0.01);
            pxMesh.isBuildMesh = true;
            const startTime = Date.now();
            const endTime = startTime + 3000;
            pxMesh.update = () => {
              if (Date.now() < endTime) {
                return true;
              } else {
                pxMesh.getWorldPosition(localVector2);
                pxMesh.getWorldQuaternion(localQuaternion2);
                _explode(localVector2, localQuaternion2);
                _damage(15);
                return false;
              }
            };
            currentChunkMesh.add(pxMesh);
            pxMeshes.push(pxMesh);
          }
          break;
        }
        case 'pickaxe': {
          _hit();
          break;
        }
        case 'shovel': {
          _unhit();
          break;
        }
        case 'light': {
          _light();
          break;
        }
        case 'build': {
          if (anchorSpecs[0]) {
            _triggerAnchor(buildsMesh);
          } else {
            const buildMesh = (() => {
              const buildMatIndex = ['wood', 'stone', 'metal'].indexOf(buildMat);
              switch (buildMode) {
                case 'wall': return buildMeshes.walls[buildMatIndex];
                case 'floor': return buildMeshes.platforms[buildMatIndex];
                case 'stair': return buildMeshes.ramps[buildMatIndex];
                default: return null;
              }
            })();
            const hasBuildMesh = (() => {
              for (const index in currentChunkMesh.vegetationMeshes) {
                const subparcelBuildMeshesSpec = currentChunkMesh.vegetationMeshes[index];
                if (subparcelBuildMeshesSpec && subparcelBuildMeshesSpec.meshes.some(m => _meshEquals(m, buildMesh))) {
                  return true;
                }
              }
              return false;
            })();
            if (!hasBuildMesh) {
              geometryManager.geometryWorker.requestAddObject(geometryManager.tracker, geometrySet, buildMesh.vegetationType, buildMesh.position, buildMesh.quaternion);
            }
          }
          break;
        }
        case 'things': {
          _triggerAnchor(thingsMesh);
          break;
        }
        case 'shapes': {
          _triggerAnchor(shapesMesh);
          break;
        }
        case 'inventory': {
          _triggerAnchor(inventoryMesh);
          break;
        }
        case 'colors': {
          _triggerAnchor(colorsMesh);
          break;
        }
        case 'select': {
          _triggerAnchor();
          if (!anchorSpecs[0] && raycastChunkSpec) {
            if (raycastChunkSpec.objectId !== 0) {
              _openDetailsMesh(raycastChunkSpec.point, raycastChunkSpec.mesh);
            }
          }
          break;
        }
      }
    }
    if (ioManager.currentWeaponValue >= 0.01) {
      switch (selectedWeapon) {
        case 'pencil': {
          let value;
          if (currentSession) {
            localVector2.copy(rightGamepad.position);
            localQuaternion2.copy(rightGamepad.quaternion);
            value = ioManager.currentWeaponValue * 0.1;
          } else {
            localVector2.copy(pencilMesh.position)
              .add(localVector3.set(0, 0, -0.5).applyQuaternion(pencilMesh.quaternion));
            value = 0.1;
          }
          localMatrix2.compose(localVector2, localQuaternion2, localVector3.set(1, 1, 1))
            .premultiply(localMatrix3.getInverse(meshDrawer.mesh.parent.matrixWorld))
            .decompose(localVector2, localQuaternion2, localVector3);

          if (lastWeaponValue < 0.01) {
            meshDrawer.start(localVector2, localQuaternion2, value);
          }
          meshDrawer.update(localVector2, localQuaternion2, value);
          break;
        }
      }
    }
    if (ioManager.currentWeaponDown) {
      switch (selectedWeapon) {
        case 'paintbrush': {
          console.log('click paintbrush 1');

          if (raycastChunkSpec && raycastChunkSpec.objectId !== 0) {
            const index = meshDrawer.thingSources.findIndex(thingSource => thingSource.objectId === raycastChunkSpec.objectId);
            if (index !== -1) {
              const thingSource = meshDrawer.thingSources[index];
              const thingMesh = meshDrawer.thingMeshes[index];

              const {point, faceIndex} = raycastChunkSpec;
              const {geometryData: {positions, uvs, indices}} = thingSource;
              const ai = indices[faceIndex * 3];
              const bi = indices[faceIndex * 3 + 1];
              const ci = indices[faceIndex * 3 + 2];
              const tri = new THREE.Triangle(
                new THREE.Vector3().fromArray(positions, ai * 3).applyMatrix4(thingSource.matrixWorld),
                new THREE.Vector3().fromArray(positions, bi * 3).applyMatrix4(thingSource.matrixWorld),
                new THREE.Vector3().fromArray(positions, ci * 3).applyMatrix4(thingSource.matrixWorld),
              );
              const uva = new THREE.Vector2().fromArray(uvs, ai * 3);
              const uvb = new THREE.Vector2().fromArray(uvs, bi * 3);
              const uvc = new THREE.Vector2().fromArray(uvs, ci * 3);
              const uv = THREE.Triangle.getUV(point, tri.a, tri.b, tri.c, uva, uvb, uvc, new THREE.Vector2());
              // console.log('painting', currentChunkMesh, raycastChunkSpec, thingSource, tri, point.toArray(), uv.toArray());
              const f = 10;
              const canvas = thingMesh.material.uniforms.tex.value.image;
              canvas.ctx.fillStyle = '#000';
              canvas.ctx.fillRect(uv.x * canvas.width - f / 2, (1 - uv.y) * canvas.height - f / 2, f, f);
              thingMesh.material.uniforms.tex.value.needsUpdate = true;
            }
          }
          break;
        }
        case 'physics': {
          console.log('click physics 1');
          break;
        }
      }
    }
    if (ioManager.lastWeaponValue >= 0.01 && ioManager.currentWeaponValue < 0.01) {
      switch (selectedWeapon) {
        case 'pencil': {
          let value;
          if (currentSession) {
            localVector2.copy(rightGamepad.position);
            localQuaternion2.copy(rightGamepad.quaternion);
            value = ioManager.currentWeaponValue * 0.1;
          } else {
            localVector2.copy(pencilMesh.position)
              .add(localVector3.set(0, 0, -0.5).applyQuaternion(pencilMesh.quaternion));
            value = 0.1;
          }
          localMatrix2.compose(localVector2, localQuaternion2, localVector3.set(1, 1, 1))
            .premultiply(localMatrix3.getInverse(meshDrawer.mesh.parent.matrixWorld))
            .decompose(localVector2, localQuaternion2, localVector3);

          meshDrawer.end(localVector2, localQuaternion2, value);
          break;
        }
      }
    }
    if (ioManager.lastWeaponDown && !ioManager.currentWeaponDown) {
      switch (selectedWeapon) {
        case 'paintbrush': {
          console.log('click paintbrush 2');
          break;
        }
        case 'physics': {
          console.log('click physics 2');
          break;
        }
      }
    }
  };
  _handleDown();

  const _handleGrab = () => {
    for (let i = 0; i < 2; i++) {
      if (ioManager.currentWeaponGrabs[i] && !ioManager.lastWeaponGrabs[i]) {
        meshComposer.grab(i);
      }
      if (!ioManager.currentWeaponGrabs[i] && ioManager.lastWeaponGrabs[i]) {
        meshComposer.ungrab(i);
      }
    }
  };
  _handleGrab();

  // select
  const _handleSelect = () => {
    for (const material of geometryManager.currentChunkMesh.material) {
      material.uniforms.uSelectRange.value.set(NaN, NaN, NaN, NaN);
      material.uniforms.uSelectRange.needsUpdate = true;
    }
    geometryManager.currentVegetationMesh.material[0].uniforms.uSelectId.value = -1;
    geometryManager.currentVegetationMesh.material[0].uniforms.uSelectId.needsUpdate = true;
    geometryManager.currentThingMesh.material[0].uniforms.uSelectId.value = -1;
    geometryManager.currentThingMesh.material[0].uniforms.uSelectId.needsUpdate = true;
    /* for (const drawThingMesh of meshDrawer.thingMeshes) {
      drawThingMesh.material.uniforms.uSelectColor.value.setHex(0xFFFFFF);
      drawThingMesh.material.uniforms.uSelectColor.needsUpdate = true;
    } */
    switch (selectedWeapon) {
      case 'select': {
        if (raycastChunkSpec) {
          if (raycastChunkSpec.objectId === 0) {
            for (const material of currentChunkMesh.material) {
              const minX = Math.floor(raycastChunkSpec.point.x / SUBPARCEL_SIZE);
              const minY = Math.floor(raycastChunkSpec.point.z / SUBPARCEL_SIZE);
              const maxX = minX + 1;
              const maxY = minY + 1;
              material.uniforms.uSelectRange.value.set(minX, minY, maxX, maxY).multiplyScalar(SUBPARCEL_SIZE);
              material.uniforms.uSelectRange.needsUpdate = true;
            }
          } else {
            currentVegetationMesh.material[0].uniforms.uSelectId.value = raycastChunkSpec.objectId;
            currentVegetationMesh.material[0].uniforms.uSelectId.needsUpdate = true;
            currentThingMesh.material[0].uniforms.uSelectId.value = raycastChunkSpec.objectId;
            currentThingMesh.material[0].uniforms.uSelectId.needsUpdate = true;

            /* const index = meshDrawer.thingSources.findIndex(thingSource => thingSource.objectId === raycastChunkSpec.objectId);
            if (index !== -1) {
              const drawThingMesh = meshDrawer.thingMeshes[index];
              drawThingMesh.material.uniforms.uSelectColor.value.setHex(0x29b6f6);
              drawThingMesh.material.uniforms.uSelectColor.needsUpdate = true;
            } */
          }
        }
        break;
      }
    }
  };
  _handleSelect();
  
  const _handleMenu = () => {
    for (const menuMesh of uiManager.menuMeshes) {
      menuMesh.visible = false;
    }

    const selectedMenuMesh = (() => {
      switch (selectedWeapon) {
        case 'build': return geometryManager.buildsMesh;
        case 'things': return geometryManager.thingsMesh;
        case 'shapes': return geometryManager.shapesMesh;
        case 'inventory': return geometryManager.inventoryMesh;
        case 'colors': return geometryManager.colorsMesh;
        default: return null;
      }
    })();

    if (renderer.xr.getSession()) {
      if (selectedMenuMesh) {
        selectedMenuMesh.position.copy(leftGamepad.position)
          .add(localVector.set(0.1, 0.1, 0).applyQuaternion(leftGamepad.quaternion));
        selectedMenuMesh.quaternion.copy(leftGamepad.quaternion);
        selectedMenuMesh.scale.setScalar(1, 1, 1);
        selectedMenuMesh.visible = true;
      }
    } else {
      if (selectedMenuMesh && menuExpanded) {
        if (!lastMenuExpanded || selectedWeapon !== lastSelectedWeapon) {
          localMatrix.copy(rigManager.localRigMatrixEnabled ? rigManager.localRigMatrix : camera.matrixWorld)
            .multiply(localMatrix2.makeTranslation(0, 0, -3))
            .decompose(selectedMenuMesh.position, selectedMenuMesh.quaternion, selectedMenuMesh.scale);
          selectedMenuMesh.scale.setScalar(20);
        }
        selectedMenuMesh.visible = true;
      }
    }
  };
  _handleMenu();

  /* const currentParcel = _getCurrentParcel(localVector);
  if (!currentParcel.equals(lastParcel)) {
    if (currentParcel.x !== lastParcel.x) {
      currentParcel.z = lastParcel.z;
    } else if (currentParcel.z !== lastParcel.z) {
      currentParcel.x = lastParcel.x;
    }
    planetAnimation && _tickPlanetAnimation(1);
    const sub = lastParcel.clone().sub(currentParcel);
    const pivot = currentParcel.clone().add(lastParcel).multiplyScalar(10/2);
    _animatePlanet(planetContainer.matrix.clone(), pivot, new THREE.Quaternion(), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), sub));
    lastParcel = currentParcel;
  } */

  const _handleTeleport = () => {
    const _teleportTo = (position, quaternion) => {
      // console.log(position, quaternion, pose, avatar)
      /* localMatrix.fromArray(rigManager.localRig.model.matrix)
        .decompose(localVector2, localQuaternion2, localVector3); */

      if (currentSession) {
        localMatrix.copy(xrCamera.matrix)
          .premultiply(dolly.matrix)
          .decompose(localVector2, localQuaternion2, localVector3);
        dolly.matrix
          .premultiply(localMatrix.makeTranslation(position.x - localVector2.x, position.y - localVector2.y, position.z - localVector2.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, _getFullAvatarHeight(), 0))
          .decompose(dolly.position, dolly.quaternion, dolly.scale);
      } else {
        camera.matrix
          .premultiply(localMatrix.makeTranslation(position.x - camera.position.x, position.y - camera.position.y, position.z - camera.position.z))
          // .premultiply(localMatrix.makeRotationFromQuaternion(localQuaternion3.copy(quaternion).inverse()))
          // .premultiply(localMatrix.makeTranslation(localVector2.x, localVector2.y, localVector2.z))
          .premultiply(localMatrix.makeTranslation(0, _getFullAvatarHeight(), 0))
          .decompose(camera.position, camera.quaternion, camera.scale);
      }

      velocity.set(0, 0, 0);
    };

    teleportMeshes[1].update(rigManager.localRig.inputs.leftGamepad.position, rigManager.localRig.inputs.leftGamepad.quaternion, ioManager.currentTeleport, (p, q) => geometryManager.geometryWorker.raycast(geometryManager.tracker, p, q), (position, quaternion) => {
      _teleportTo(position, localQuaternion.set(0, 0, 0, 1));
    });
  };
  _handleTeleport();
};

renderer.domElement.addEventListener('wheel', e => {
  if (document.pointerLockElement) {
    if (anchorSpecs[0] && [thingsMesh, inventoryMesh].includes(anchorSpecs[0].object)) {
      anchorSpecs[0].object.scrollY(e.deltaY);
    }
  }
});

const weaponsManager = {
  weapons,
  cubeMesh,
  getWeapon() {
    return selectedWeapon;
  },
  setWeapon(newSelectedWeapon) {
    selectedWeapon = selectedWeapon;
  },
  update() {
    _updateTools();
  },
};
export default weaponsManager;