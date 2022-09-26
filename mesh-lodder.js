import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {playersManager} from './players-manager.js';
import {alea} from './procgen/procgen.js';
import physicsManager from './physics-manager.js';
import {defaultMaxId} from './constants.js';
import {LodChunkTracker} from './lod.js';
import {GeometryAllocator} from './instancing.js';
import {mapWarpedUvs, generateTextureAtlas} from './atlasing.js';
import {ImmediateGLBufferAttribute} from './ImmediateGLBufferAttribute.js';

const defaultTextureSize = 4096;
const bufferSize = 20 * 1024 * 1024;
const maxNumItems = defaultMaxId;
const chunkWorldSize = 30;
const minObjectsPerChunk = 20;
const maxObjectPerChunk = 50;

const upVector = new THREE.Vector3(0, 1, 0);
// const rightVector = new THREE.Vector3(1, 0, 0);
// const oneVector = new THREE.Vector3(1, 1, 1);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localVector4D = new THREE.Vector4();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

const _diceGeometry = g => {
  const geometryToBeCut = g;

  const getCutGeometries = (geometry, plane) => {
    const res = physicsManager.cutMesh(
      geometry.attributes.position.array,
      geometry.attributes.position.count * 3,
      geometry.attributes.normal.array,
      geometry.attributes.normal.count * 3,
      geometry.attributes.uv.array,
      geometry.attributes.uv.count * 2,
      geometry.index?.array,
      geometry.index?.count,

      plane.normal.toArray(),
      plane.constant,
    );

    const positions0 = res.outPositions.slice(0, res.numOutPositions[0]);
    const positions1 = res.outPositions.slice(res.numOutPositions[0], res.numOutPositions[0] + res.numOutPositions[1]);

    const normals0 = res.outNormals.slice(0, res.numOutNormals[0]);
    const normals1 = res.outNormals.slice(res.numOutNormals[0], res.numOutNormals[0] + res.numOutNormals[1]);

    const uvs0 = res.outUvs.slice(0, res.numOutUvs[0]);
    const uvs1 = res.outUvs.slice(res.numOutUvs[0], res.numOutUvs[0] + res.numOutUvs[1]);

    const geometry0 = new THREE.BufferGeometry();
    geometry0.setAttribute('position', new THREE.Float32BufferAttribute(positions0, 3));
    geometry0.setAttribute('normal', new THREE.Float32BufferAttribute(normals0, 3));
    geometry0.setAttribute('uv', new THREE.Float32BufferAttribute(uvs0, 2));
    geometry0.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs0.slice(), 2));

    const geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute('position', new THREE.Float32BufferAttribute(positions1, 3));
    geometry1.setAttribute('normal', new THREE.Float32BufferAttribute(normals1, 3));
    geometry1.setAttribute('uv', new THREE.Float32BufferAttribute(uvs1, 2));
    geometry1.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs1.slice(), 2));

    return [geometry0, geometry1];
  };

  const geometries2Parts = getCutGeometries(geometryToBeCut, new THREE.Plane(
    new THREE.Vector3(1, 0, 0).normalize(),
    0,
  ));

  const geometries4Parts = [];
  geometries2Parts.forEach(geometryToBeCut => {
    const geometries = getCutGeometries(geometryToBeCut, new THREE.Plane(
      new THREE.Vector3(0, 1, 0).normalize(),
      0,
    ));
    geometries4Parts.push(...geometries);
  });

  const geometries8Parts = [];
  geometries4Parts.forEach(geometryToBeCut => {
    const geometries = getCutGeometries(geometryToBeCut, new THREE.Plane(
      new THREE.Vector3(0, 0, 1).normalize(),
      0,
    ));
    geometries8Parts.push(...geometries);
  });

  //

  geometries8Parts.forEach((geometry, i) => {
    const x = i < 4 ? -0.5 : 0.5;
    const y = i % 4 < 2 ? -0.5 : 0.5;
    const z = i % 2 < 1 ? -0.5 : 0.5;
    geometry.translate(x, y, z);
  });
  return BufferGeometryUtils.mergeBufferGeometries(geometries8Parts);
};
const _eraseVertices = (geometry, positionStart, positionCount) => {
  for (let i = 0; i < positionCount; i++) {
    geometry.attributes.position.array[positionStart + i] = 0;
  }
  const popUpdate = ImmediateGLBufferAttribute.pushUpdate();
  geometry.attributes.position.update(positionStart, positionCount);
  popUpdate();
};

const _getMatrixWorld = (rootMesh, contentMesh, target, positionX, positionZ, rotationY) => {
  return _getMatrix(contentMesh, target, positionX, positionZ, rotationY)
    .premultiply(rootMesh.matrixWorld);
};
const _getMatrix = (contentMesh, target, positionX, positionZ, rotationY) => {
  localVector.set(positionX, 0, positionZ);
  localQuaternion.setFromAxisAngle(upVector, rotationY);

  return target.copy(contentMesh.matrixWorld)
    .premultiply(localMatrix3.compose(localVector, localQuaternion, localVector2.set(1, 1, 1)));
};

const _mapGeometryUvs = (g, geometry, tx, ty, tw, th, canvasSize) => {
  mapWarpedUvs(g.attributes.uv, 0, geometry.attributes.uv, 0, tx, ty, tw, th, canvasSize);
  mapWarpedUvs(g.attributes.uv2, 0, geometry.attributes.uv2, 0, tx, ty, tw, th, canvasSize);
};
const _makeItemMesh = (rootMesh, contentMesh, geometry, material, positionX, positionZ, rotationY) => {
  const cloned = new THREE.Mesh(geometry, material);
  _getMatrixWorld(rootMesh, contentMesh, cloned.matrixWorld, positionX, positionZ, rotationY);
  cloned.matrix.copy(cloned.matrixWorld)
    .decompose(cloned.position, cloned.quaternion, cloned.scale);
  cloned.frustumCulled = false;
  return cloned;
};

const _mapOffsettedPositions = (g, geometry, dstOffset, positionX, positionZ, rotationY, contentMesh) => {
  const count = g.attributes.position.count;

  const matrix = _getMatrix(contentMesh, localMatrix, positionX, positionZ, rotationY);

  for (let i = 0; i < count; i++) {
    const srcIndex = i;
    const localDstOffset = dstOffset + i * 3;

    localVector.fromArray(g.attributes.position.array, srcIndex * 3)
      .applyMatrix4(matrix)
      .toArray(geometry.attributes.position.array, localDstOffset);
  }
};
const _mapOffsettedIndices = (g, geometry, dstOffset, positionOffset) => {
  const count = g.index.count;
  const positionIndex = positionOffset / 3;
  for (let i = 0; i < count; i++) {
    geometry.index.array[dstOffset + i] = g.index.array[i] + positionIndex;
  }
};

class LodChunkGenerator {
  constructor(parent) {
    // parameters
    this.parent = parent;

    // members
    this.physicsObjects = [];
    this.allocator = new GeometryAllocator([
      {
        name: 'position',
        Type: Float32Array,
        itemSize: 3,
      },
      {
        name: 'normal',
        Type: Float32Array,
        itemSize: 3,
      },
      {
        name: 'uv',
        Type: Float32Array,
        itemSize: 2,
      },
      {
        name: 'uv2',
        Type: Float32Array,
        itemSize: 2,
      },
    ], {
      bufferSize,
    });
    this.itemContentMeshes = Array(maxNumItems).fill(null);
    this.itemPositions = new Float32Array(maxNumItems * 3);
    this.itemQuaternions = new Float32Array(maxNumItems * 4);
    this.itemPositionOffsets = new Uint32Array(maxNumItems);
    this.itemPositionCounts = new Uint32Array(maxNumItems);
    this.itemRects = new Uint32Array(maxNumItems * 4);
    this.itemShapeAddresses = new Uint32Array(maxNumItems);
    this.itemPositionsXZY = new Float32Array(maxNumItems * 3);

    // mesh
    this.mesh = new THREE.Mesh(this.allocator.geometry, [this.parent.material]);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /* getItemIdByPhysicsId(physicsId) {
    return this.physicsObjects.findIndex(o => o.physicsId === physicsId);
  } */
  getItemTransformByItemId(itemId, p, q, s) {
    p.fromArray(this.itemPositions, itemId * 3);
    q.fromArray(this.itemQuaternions, itemId * 4);
    s.set(1, 1, 1);
  }

  deleteItem(itemId) {
    _eraseVertices(
      this.allocator.geometry,
      this.itemPositionOffsets[itemId],
      this.itemPositionCounts[itemId],
    );

    const index = this.physicsObjects.findIndex(po => po.physicsId === itemId);
    const physicsObject = this.physicsObjects[index];
    physicsManager.removeGeometry(physicsObject);
    this.physicsObjects.splice(index, 1);
  }

  #getContentIndexNames() {
    return Object.keys(this.parent.contentIndex).sort();
  }

  #getAtlas() {
    return this.parent.atlas;
  }

  #getContent(name) {
    return this.parent.contentIndex[name];
  }

  #getShapeAddress(name) {
    return this.parent.shapeAddresses[name];
  }

  #getContentMeshIndex(mesh) {
    return this.parent.meshes.indexOf(mesh);
  }

  #addPhysicsShape(shapeAddress, contentMesh, positionX, positionZ, rotationY) {
    const matrixWorld = _getMatrixWorld(this.mesh, contentMesh, localMatrix, positionX, positionZ, rotationY);
    matrixWorld.decompose(localVector, localQuaternion, localVector2);
    const position = localVector;
    const quaternion = localQuaternion;
    const scale = localVector2;
    const dynamic = false;
    const external = true;
    const physicsObject = physicsManager.addConvexShape(shapeAddress, position, quaternion, scale, dynamic, external);

    this.physicsObjects.push(physicsObject);

    return physicsObject;
  }

  cloneItemDiceMesh(itemId) {
    localVector4D.fromArray(this.itemRects, itemId * 4);
    const tx = localVector4D.x;
    const ty = localVector4D.y;
    const tw = localVector4D.z;
    const th = localVector4D.w;

    const positionX = this.itemPositionsXZY[itemId * 3];
    const positionZ = this.itemPositionsXZY[itemId * 3 + 1];
    const rotationY = this.itemPositionsXZY[itemId * 3 + 2];

    const atlas = this.#getAtlas();
    const canvasSize = Math.min(atlas.width, defaultTextureSize);

    const contentMesh = this.itemContentMeshes[itemId];
    const g = contentMesh.geometry;
    let geometry = g.clone();
    _mapGeometryUvs(g, geometry, tx, ty, tw, th, canvasSize);
    geometry = _diceGeometry(geometry);
    const itemMesh = _makeItemMesh(this.mesh, contentMesh, geometry, this.parent.material, positionX, positionZ, rotationY);
    return itemMesh;
  }

  cloneItemMesh(itemId) {
    localVector4D.fromArray(this.itemRects, itemId * 4);
    const tx = localVector4D.x;
    const ty = localVector4D.y;
    const tw = localVector4D.z;
    const th = localVector4D.w;

    const positionX = this.itemPositionsXZY[itemId * 3];
    const positionZ = this.itemPositionsXZY[itemId * 3 + 1];
    const rotationY = this.itemPositionsXZY[itemId * 3 + 2];

    const atlas = this.#getAtlas();
    const canvasSize = Math.min(atlas.width, defaultTextureSize);

    const contentMesh = this.itemContentMeshes[itemId];
    const g = contentMesh.geometry;
    const geometry = g.clone();
    _mapGeometryUvs(g, geometry, tx, ty, tw, th, canvasSize);
    const itemMesh = _makeItemMesh(this.mesh, contentMesh, geometry, this.parent.material, positionX, positionZ, rotationY);
    return itemMesh;
  }

  clonePhysicsObject(itemId) {
    const positionX = this.itemPositionsXZY[itemId * 3];
    const positionZ = this.itemPositionsXZY[itemId * 3 + 1];
    const rotationY = this.itemPositionsXZY[itemId * 3 + 2];

    const contentMesh = this.itemContentMeshes[itemId];
    const shapeAddress = this.itemShapeAddresses[itemId];

    _getMatrixWorld(this.mesh, contentMesh, localMatrix, positionX, positionZ, rotationY)
      .decompose(localVector, localQuaternion, localVector2);
    const position = localVector;
    const quaternion = localQuaternion;
    const scale = localVector2;
    const dynamic = true;
    const external = true;
    const physicsObject = physicsManager.addConvexShape(shapeAddress, position, quaternion, scale, dynamic, external);
    return physicsObject;
  }

  #addItemToRegistry(contentName, contentMesh, physicsId, positionOffset, positionCount, positionX, positionZ, rotationY, tx, ty, tw, th) {
    this.itemContentMeshes[physicsId] = contentMesh;
    localVector.set(positionX, 0, positionZ)
      .toArray(this.itemPositions, physicsId * 3);
    localQuaternion.setFromAxisAngle(upVector, rotationY)
      .toArray(this.itemQuaternions, physicsId * 4);
    this.itemPositionOffsets[physicsId] = positionOffset;
    this.itemPositionCounts[physicsId] = positionCount;
    localVector4D.set(tx, ty, tw, th)
      .toArray(this.itemRects, physicsId * 4);
    this.itemShapeAddresses[physicsId] = this.parent.shapeAddresses[contentName];

    this.itemPositionsXZY[physicsId * 3] = positionX;
    this.itemPositionsXZY[physicsId * 3 + 1] = positionZ;
    this.itemPositionsXZY[physicsId * 3 + 2] = rotationY;
  }

  generateChunk(chunk) {
    const _collectContentsRenderList = () => {
      const contentNames = [];
      const contents = [];
      const totalNumPositions = [];
      const totalNumIndices = [];

      const contentIndexNames = this.#getContentIndexNames();
      const numObjects = minObjectsPerChunk + Math.floor(rng() * (maxObjectPerChunk - minObjectsPerChunk));
      for (let i = 0; i < numObjects; i++) {
        const contentName = contentIndexNames[Math.floor(rng() * contentIndexNames.length)];
        const meshes = this.#getContent(contentName);

        const totalPositionsArray = [];
        const totalIndicesArray = [];
        for (let lod = 0; lod < meshes.length; lod++) {
          const mesh = meshes[lod];
          if (mesh) {
            totalPositionsArray.push(mesh.geometry.attributes.position.count * mesh.geometry.attributes.position.itemSize);
            totalIndicesArray.push(mesh.geometry.index.count);
          } else {
            totalPositionsArray.push(0);
            totalIndicesArray.push(0);
          }
        }

        contentNames.push(contentName);
        contents.push(meshes);
        totalNumPositions.push(totalPositionsArray);
        totalNumIndices.push(totalIndicesArray);
      }

      return {
        contentNames,
        contents,
        totalNumPositions,
        totalNumIndices,
      };
    };
    const _renderContentsRenderList = (contentMeshes, contentNames, geometry, geometryBinding) => {
      const physicsObjects = [];

      const popUpdate = ImmediateGLBufferAttribute.pushUpdate();
      {
        let positionOffset = geometryBinding.getAttributeOffset('position');
        let uvOffset = geometryBinding.getAttributeOffset('uv');
        let indexOffset = geometryBinding.getIndexOffset();

        // render geometries to allocated geometry binding
        for (let i = 0; i < contentMeshes.length; i++) {
          const contentMesh = contentMeshes[i];
          const contentName = contentNames[i];
          const positionX = (chunk.x + 1 + rng()) * chunkWorldSize;
          const positionZ = (chunk.z + 1 + rng()) * chunkWorldSize;
          const rotationY = rng() * Math.PI * 2;

          const g = contentMesh.geometry;
          const contentMeshIndex = this.#getContentMeshIndex(contentMesh);
          const rect = atlas.rectIndexCache.get(contentMeshIndex);
          const {x, y, width: w, height: h} = rect;
          const tx = x * canvasScale;
          const ty = y * canvasScale;
          const tw = w * canvasScale;
          const th = h * canvasScale;

          // render geometry
          {
            _mapOffsettedPositions(g, geometry, positionOffset, positionX, positionZ, rotationY, contentMesh);
            geometry.attributes.normal.array.set(g.attributes.normal.array, positionOffset);
            mapWarpedUvs(g.attributes.uv, 0, geometry.attributes.uv, uvOffset, tx, ty, tw, th, canvasSize);
            mapWarpedUvs(g.attributes.uv2, 0, geometry.attributes.uv2, uvOffset, tx, ty, tw, th, canvasSize);
            _mapOffsettedIndices(g, geometry, indexOffset, positionOffset);
            geometry.setAttribute('direction', new THREE.BufferAttribute(new Float32Array(g.attributes.position.array.length), 3));
          }

          // upload geometry
          {
            geometry.attributes.position.update(positionOffset, g.attributes.position.count * g.attributes.position.itemSize);
            geometry.attributes.normal.update(positionOffset, g.attributes.normal.count * g.attributes.normal.itemSize);
            geometry.attributes.uv.update(uvOffset, g.attributes.uv.count * g.attributes.uv.itemSize);
            geometry.attributes.uv2.update(uvOffset, g.attributes.uv2.count * g.attributes.uv.itemSize);
            geometry.index.update(indexOffset, g.index.count);
          }

          {
            // physics
            const shapeAddress = this.#getShapeAddress(contentName);
            const physicsObject = this.#addPhysicsShape(shapeAddress, contentMesh, positionX, positionZ, rotationY);
            physicsObjects.push(physicsObject);

            // tracking
            const positionCount = g.attributes.position.count * g.attributes.position.itemSize;
            this.#addItemToRegistry(contentName, contentMesh, physicsObject.physicsId, positionOffset, positionCount, positionX, positionZ, rotationY, tx, ty, tw, th);
          }

          positionOffset += g.attributes.position.count * g.attributes.position.itemSize;
          uvOffset += g.attributes.uv.count * g.attributes.uv.itemSize;
          indexOffset += g.index.count;
        }
      }
      popUpdate();

      return {
        physicsObjects,
      };
    };

    const atlas = this.#getAtlas();
    const canvasSize = Math.min(atlas.width, defaultTextureSize);
    const canvasScale = canvasSize / atlas.width;

    const rng = alea(chunk.name);
    const {
      contentNames,
      contents,
      totalNumPositions,
      totalNumIndices,
    } = _collectContentsRenderList();
    const contentsLod0 = contents.map(meshes => meshes[0]);
    const totalNumPositionsLod0 = totalNumPositions.reduce((a, b) => a + b[0], 0);
    const totalNumIndicesLod0 = totalNumIndices.reduce((a, b) => a + b[0], 0);
    const geometryBinding = this.allocator.alloc(totalNumPositionsLod0, totalNumIndicesLod0);
    const {
      physicsObjects,
    } = _renderContentsRenderList(contentsLod0, contentNames, this.allocator.geometry, geometryBinding);

    chunk.binding = geometryBinding;
    chunk.physicsObjects = physicsObjects;
    this.allocator.geometry.groups = this.allocator.indexFreeList.getGeometryGroups(); // XXX memory for this can be optimized
    this.mesh.visible = true;
  }

  disposeChunk(chunk) {
    this.allocator.free(chunk.binding);
    chunk.binding = null;

    for (const physicsObject of chunk.physicsObjects) {
      physicsManager.removeGeometry(physicsObject);

      const index = this.physicsObjects.findIndex(po => po.physicsId === physicsObject.physicsId);
      this.physicsObjects.splice(index, 1);
    }
    chunk.physicsObjects.length = 0;
  }

  destroy() {
    // nothing; the owning lod tracker disposes of our contents
  }
}

const meshLodders = [];
let ids = 0;
class MeshLodManager {
  constructor() {
    this.id = ++ids;

    const material = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      transparent: true,
      onBeforeCompile: shader => {
        shader.vertexShader.replace('#include <common>\n', `\
          #include <common>
          attribute vec3 direction;
        `);
        shader.vertexShader.replace('#include <begin_vertex>\n', `\
          #include <begin_vertex>
          transformed += direction;
        `);
        return shader;
      },
    });
    this.material = material;

    this.contentIndex = {};
    this.shapeSpecs = {};
    this.shapeAddresses = {};
    this.compiled = false;

    meshLodders.push(this);

    this.generator = new LodChunkGenerator(this);
    this.tracker = new LodChunkTracker(this.generator, {
      chunkWorldSize,
    });
  }

  registerLodMesh(name, shapeSpec) {
    const {
      type = 'object',
      lods = [],
    } = shapeSpec;

    this.contentIndex[name] = lods;

    const lastMesh = lods.findLast(lod => lod !== null) ?? null;
    const buffer = physicsManager.cookConvexGeometry(lastMesh);
    const shapeAddress = physicsManager.createConvexShape(buffer);
    this.shapeAddresses[name] = shapeAddress;

    this.shapeSpecs[name] = shapeSpec;
  }

  getPhysicsObjects() {
    return this.generator.physicsObjects;
  }

  #getContentMergeable() {
    const getObjectKey = () => '';

    const mergeables = new Map();

    for (const name in this.contentIndex) {
      const meshes = this.contentIndex[name];

      for (const mesh of meshes) {
        mesh && mesh.traverse(o => {
          if (o.isMesh && o.geometry.type === 'BufferGeometry') {
            const objectGeometry = o.geometry;
            // const morphTargetDictionary = o.morphTargetDictionary;
            // const morphTargetInfluences = o.morphTargetInfluences;
            const objectMaterials = Array.isArray(o.material) ? o.material : [o.material];
            for (const objectMaterial of objectMaterials) {
              const {
                map = null,
                emissiveMap = null,
                normalMap = null,
                roughnessMap = null,
                metalnessMap = null,
                // shadeTexture = null,
              } = objectMaterial;
              // const skeleton = o.skeleton ?? null;

              const key = getObjectKey(o, objectMaterial);

              let m = mergeables.get(key);
              if (!m) {
                m = {
                  material: objectMaterial,
                  meshes: [],
                  geometries: [],
                  materials: [],
                  maps: [],
                  emissiveMaps: [],
                  normalMaps: [],
                  roughnessMaps: [],
                  metalnessMaps: [],
                  // shadeTextures: [],
                  // skeletons: [],
                  // morphTargetDictionaryArray: [],
                  // morphTargetInfluencesArray: [],
                };
                mergeables.set(key, m);
              }

              m.meshes.push(o);
              m.geometries.push(objectGeometry);
              m.materials.push(objectMaterial);
              m.maps.push(map);
              m.emissiveMaps.push(emissiveMap);
              m.normalMaps.push(normalMap);
              m.roughnessMaps.push(roughnessMap);
              m.metalnessMaps.push(metalnessMap);
              // m.shadeTextures.push(shadeTexture);
              // m.skeletons.push(skeleton);
              // m.morphTargetDictionaryArray.push(morphTargetDictionary);
              // m.morphTargetInfluencesArray.push(morphTargetInfluences);
            }
          }
        });
      }
    }

    return Array.from(mergeables.values())[0];
  }

  compile() {
    const mergeable = this.#getContentMergeable();
    const {
      // type,
      // material,
      meshes,
      geometries,
      materials,
      maps,
      emissiveMaps,
      normalMaps,
      roughnessMaps,
      metalnessMaps,
      // skeletons,
      // morphTargetDictionaryArray,
      // morphTargetInfluencesArray,
    } = mergeable;

    const textureSpecs = {
      map: maps,
      emissiveMap: emissiveMaps,
      normalMap: normalMaps,
      roughnessMap: roughnessMaps,
      metalnessMap: metalnessMaps,
    };
    const {
      atlas,
      atlasImages,
      atlasTextures,
    } = generateTextureAtlas(textureSpecs);

    this.atlas = atlas;

    const {material} = this;
    const textureNames = Object.keys(textureSpecs);
    for (const textureName of textureNames) {
      const texture = atlasTextures[textureName];
      if (texture) {
        material[textureName] = texture;
      }
    }
    material.needsUpdate = true;

    this.meshes = meshes;

    this.compiled = true;
  }

  getChunks() {
    return this.generator.mesh;
  }

  /* getItemIdByPhysicsId(physicsId) {
    return this.generator.getItemIdByPhysicsId(physicsId);
  } */
  getItemTransformByItemId() {
    return this.generator.getItemTransformByItemId.apply(this.generator, arguments);
  }

  cloneItemDiceMesh() {
    return this.generator.cloneItemDiceMesh.apply(this.generator, arguments);
  }

  cloneItemMesh() {
    return this.generator.cloneItemMesh.apply(this.generator, arguments);
  }

  clonePhysicsObject() {
    return this.generator.clonePhysicsObject.apply(this.generator, arguments);
  }

  deleteItem(itemId) {
    return this.generator.deleteItem(itemId);
  }

  update() {
    const localPlayer = playersManager.getLocalPlayer();
    if (this.compiled) {
      this.tracker.update(localPlayer.position);
    }
  }

  destroy() {
    meshLodders.splice(meshLodders.indexOf(this), 1);
  }
}

const meshLodManager = {
  createMeshLodder() {
    return new MeshLodManager();
  },
  getMeshLodder(id) {
    return meshLodders.find(meshLod => meshLod.id === id) ?? null;
  },
};
export default meshLodManager;
