import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
import {localPlayer} from './players.js';
import {alea} from './procgen/procgen.js';
// import {getRenderer} from './renderer.js';
import {mod, modUv, getNextPhysicsId} from './util.js';
import physicsManager from './physics-manager.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const bufferSize = 2 * 1024 * 1024;
const chunkWorldSize = 30;
const defaultTextureSize = 4096;
const startAtlasSize = 512;
const minObjectsPerChunk = 20;
const maxObjectPerChunk = 50;

const upVector = new THREE.Vector3(0, 1, 0);
// const rightVector = new THREE.Vector3(1, 0, 0);
const oneVector = new THREE.Vector3(1, 1, 1);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
// const localMatrix2 = new THREE.Matrix4();
const localMatrix3 = new THREE.Matrix4();

const textureTypes = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
];
const _colorCanvas = (canvas, fillStyle) => {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
const textureInitializers = {
  normal(canvas) {
    _colorCanvas(canvas, 'rgb(128, 128, 255)');
  },
  roughness(canvas) {
    _colorCanvas(canvas, 'rgb(255, 255, 255)');
  },
  /* metalness(canvas) {
    _colorCanvas(canvas, 'rgb(0, 0, 0)');
  }, */
};

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
    )

    const positions0 = res.outPositions.slice(0, res.numOutPositions[0])
    const positions1 = res.outPositions.slice(res.numOutPositions[0], res.numOutPositions[0] + res.numOutPositions[1])

    const normals0 = res.outNormals.slice(0, res.numOutNormals[0])
    const normals1 = res.outNormals.slice(res.numOutNormals[0], res.numOutNormals[0] + res.numOutNormals[1])

    const uvs0 = res.outUvs.slice(0, res.numOutUvs[0])
    const uvs1 = res.outUvs.slice(res.numOutUvs[0], res.numOutUvs[0] + res.numOutUvs[1])

    const geometry0 = new THREE.BufferGeometry()
    geometry0.setAttribute('position', new THREE.Float32BufferAttribute(positions0, 3))
    geometry0.setAttribute('normal', new THREE.Float32BufferAttribute(normals0, 3))
    geometry0.setAttribute('uv', new THREE.Float32BufferAttribute(uvs0, 2))
    geometry0.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs0.slice(), 2))

    const geometry1 = new THREE.BufferGeometry()
    geometry1.setAttribute('position', new THREE.Float32BufferAttribute(positions1, 3))
    geometry1.setAttribute('normal', new THREE.Float32BufferAttribute(normals1, 3))
    geometry1.setAttribute('uv', new THREE.Float32BufferAttribute(uvs1, 2))
    geometry1.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs1.slice(), 2))

    return [geometry0, geometry1];
  }

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
  geometry.attributes.position.updateRange.offset = positionStart;
  geometry.attributes.position.updateRange.count = positionCount;
  geometry.attributes.position.needsUpdate = true;
};

class LodChunk extends THREE.Vector3 {
  constructor(x, y, z, lod) {
    super(x, y, z);
    this.lod = lod;

    this.name = `chunk:${this.x}:${this.z}`;
    this.geometryBinding = null;
  }
  equals(chunk) {
    return this.x === chunk.x && this.y === chunk.y && this.z === chunk.z;
  }
}
class LodChunkTracker {
  constructor(generator) {
    this.generator = generator;

    this.chunks = [];
    this.lastUpdateCoord = new THREE.Vector2(NaN, NaN);
  }
  #getCurrentCoord(position, target) {
    const cx = Math.floor(position.x / chunkWorldSize);
    const cz = Math.floor(position.z / chunkWorldSize);
    return target.set(cx, cz);
  }
  update(position) {
    const currentCoord = this.#getCurrentCoord(position, localVector2D);

    const lod = 0;
    if (!currentCoord.equals(this.lastUpdateCoord)) {
      const neededChunks = [];
      for (let dcx = -1; dcx <= 1; dcx++) {
        for (let dcz = -1; dcz <= 1; dcz++) {
          const chunk = new LodChunk(currentCoord.x, 0, currentCoord.y, lod);
          neededChunks.push(chunk);
        }
      }

      const addedChunks = [];
      const removedChunks = [];
      const reloddedChunks = [];
      for (const chunk of this.chunks) {
        const matchingNeededChunk = neededChunks.find(nc => nc.equals(chunk));
        if (!matchingNeededChunk) {
          removedChunks.push(chunk);
        }
      }
      for (const chunk of neededChunks) {
        const matchingExistingChunk = this.chunks.find(ec => ec.equals(chunk));
        if (matchingExistingChunk) {
          if (matchingExistingChunk.lod !== chunk.lod) {
            reloddedChunks.push({
              oldChunk: matchingExistingChunk,
              newChunk: chunk,
            });
          }
        } else {
          addedChunks.push(chunk);
        }
      }

      for (const chunk of addedChunks) {
        this.generator.generateChunk(chunk);
        this.chunks.push(chunk);
      }

      // console.log('added removed', addedChunks.length, removedChunks.length, currentCoord.toArray(), this.lastUpdateCoord.toArray());
    
      this.lastUpdateCoord.copy(currentCoord);
    }
  }
}

class FreeListSlot {
  constructor(start, count, used) {
    this.start = start;
    this.count = count;
    this.used = used;
  }
  alloc(size) {
    this.used = true;
    if (size < this.count) {
      const newSlot = new FreeListSlot(this.start + size, this.count - size, false);
      this.count -= size;
      return [
        this,
        newSlot,
      ]
    } else if (this.size === this.count) {
      return [this];
    } else {
      throw new Error('could not allocate: ' + size + ' : ' + this.count);
    }
  }
  free() {
    this.used = false;
    return [this];
  }
}

class FreeList {
  constructor(length) {
    this.slots = [
      new FreeListSlot(0, this.length, false),
    ];
    this.length = length;
  }
  findFirstFreeSlotIndexWithSize(size) {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot.used && slot.count >= size) {
        return i;
      }
    }
    return -1;
  }
  alloc(size) {
    if (size >= 0) {
      const index = this.findFirstFreeSlotIndexWithSize(size);
      if (index !== -1) {
        const slot = this.slots[index];
        const replacement = slot.alloc(size);
        this.slots.splice.apply(index, [1].concat(replacement));
        return replacement;
      }
    } else {
      return null;
    }
  }
  free(slot) {
    const index = this.slots.indexOf(slot);
    if (index !== -1) {
      const replacement = slot.free();
      this.slots.splice.apply(index, [1].concat(replacement));
      this.#mergeAdjacentSlots();
    }
  }
  #mergeAdjacentSlots() {
    for (let i = this.slots.length - 2; i >= 0; i--) {
      const slot = this.slots[i];
      const nextSlot = this.slots[i + 1];
      if (!slot.used && !nextSlot.used) {
        slot.count += nextSlot.count;
        this.slots.splice(i + 1, 1);
      }
    }
  }
}

class GeometryBinding {
  constructor(positionFreeListEntry, indexFreeListEntry, geometry) {
    this.positionFreeListEntry = positionFreeListEntry;
    this.indexFreeListEntry = indexFreeListEntry;
    this.geometry = geometry;
  }
}

class GeometryAllocator { // XXX allocate from this
  constructor(attributeSpecs, {
    bufferSize,
  }) {
    {
      this.geometry = new THREE.BufferGeometry();
      for (const attributeSpec of attributeSpecs) {
        const {
          name,
          Type,
          itemSize,
        } = attributeSpec;

        const array = new Type(bufferSize * itemSize);
        this.geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
      }
      const indices = new Uint32Array(bufferSize);
      this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      this.geometry.setDrawRange(0, 0);
    }

    this.positionFreeList = new FreeList(bufferSize);
    this.indexFreeList = new FreeList(bufferSize);
  }
  alloc(numPositions, numIndices) {
    const positionFreeListEntry = this.positionFreeList.alloc(numPositions);
    const indexFreeListEntry = this.indexFreeList.alloc(numIndices);
    const geometryBinding = new GeometryBinding(positionFreeListEntry, indexFreeListEntry, this.geometry);
    return geometryBinding;
  }
  free(geometryBinding) {
    this.positionFreeList.free(geometryBinding.positionFreeListEntry);
    this.indexFreeList.free(geometryBinding.indexFreeListEntry);
  }
}

class LodChunkGenerator {
  constructor(parent) {
    // parameters
    this.parent = parent;

    // members
    this.itemRegistry = [];
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

    // mesh
    this.mesh = new THREE.Mesh(this.allocator.geometry, this.parent.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }
  getItemByPhysicsId(physicsId) {
    const physicsObjectIndex = this.physicsObjects.findIndex(p => p.physicsId === physicsId);
    if (physicsObjectIndex !== -1) {
      const item = this.itemRegistry[physicsObjectIndex];
      return item;
    } else {
      return null;
    }
  }
  deleteItem(item) {
    const index = this.itemRegistry.indexOf(item);
    if (index !== -1) {
      const item = this.itemRegistry[index];
      const {geometry} = this.mesh;
      _eraseVertices(
        geometry,
        item.attributes.position.start,
        item.attributes.position.count,
      );

      const physicsObject = this.physicsObjects[index];
      physicsManager.removeGeometry(physicsObject);
      
      this.itemRegistry.splice(index, 1);
      this.physicsObjects.splice(index, 1);
    }
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
  #getMeshIndex(mesh) {
    return this.parent.meshes.indexOf(mesh);
  }
  generateChunk(chunk) { // XXX finish this
    // console.log('generate chunk', chunk);

    const {geometry} = this.mesh;
    const atlas = this.#getAtlas();
    const names = this.#getContentIndexNames();
    const canvasSize = Math.min(atlas.width, defaultTextureSize);
    const canvasScale = canvasSize / atlas.width;
    
    const rng = alea(chunk.name);
    const numObjects = minObjectsPerChunk + Math.floor(rng() * (maxObjectPerChunk - minObjectsPerChunk));
    let positionIndex = 0;
    let indexIndex = 0;
    for (let i = 0; i < numObjects; i++) {
      const name = names[Math.floor(rng() * names.length)];
      const positionX = (chunk.x + rng()) * chunkWorldSize;
      const positionZ = (chunk.z + rng()) * chunkWorldSize;
      const rotationY = rng() * Math.PI * 2;

      const meshes = this.#getContent(name);
      const mesh = meshes[0];
      const g = mesh.geometry;
      const meshIndex = this.#getMeshIndex(mesh);
      const rect = atlas.rectIndexCache.get(meshIndex);
      const {x, y, width: w, height: h} = rect;
      const tx = x * canvasScale;
      const ty = y * canvasScale;
      const tw = w * canvasScale;
      const th = h * canvasScale;

      const _getMatrixWorld = target => {
        return _getMatrix(target)
          .premultiply(this.mesh.matrixWorld);
      };
      const _getMatrix = target => {
        return target.copy(mesh.matrixWorld)
          .premultiply(localMatrix3.makeRotationAxis(upVector, rotationY))
          .premultiply(localMatrix3.makeTranslation(positionX, 0, positionZ));
      };
      const matrixWorld = _getMatrixWorld(localMatrix);

      const _addPhysicsShape = () => {
        const shapeAddress = this.#getShapeAddress(name);
        matrixWorld.decompose(localVector, localQuaternion, localVector2);
        const position = localVector;
        const quaternion = localQuaternion;
        const scale = localVector2;
        const dynamic = false;
        const external = true;
        /* console.log('add physics shape', {
          shapeAddress,
          position,
          quaternion,
          scale,
          dynamic,
          external,
        }); */
        const physicsObject = physicsManager.addConvexShape(shapeAddress, position, quaternion, scale, dynamic, external);

        this.physicsObjects.push(physicsObject);
      };
      _addPhysicsShape();

      const _mapGeometryUvs = geometry => {
        _mapWarpedUvs(g.attributes.uv, geometry.attributes.uv, 0, g.attributes.uv.count);
        _mapWarpedUvs(g.attributes.uv2, geometry.attributes.uv2, 0, g.attributes.uv2.count);
      };
      const _makeItemMesh = geometry => {
        const {material} = this;
        const cloned = new THREE.Mesh(geometry, material);
        _getMatrixWorld(cloned.matrixWorld);
        cloned.matrix.copy(cloned.matrixWorld)
          .decompose(cloned.position, cloned.quaternion, cloned.scale);
        cloned.frustumCulled = false;
        return cloned;
      };

      const _addItemToRegistry = () => {
        const item = {
          position: new THREE.Vector3(positionX, 0, positionZ),
          quaternion: new THREE.Quaternion().setFromAxisAngle(upVector, rotationY),
          scale: oneVector,
          attributes: {
            position: {
              start: positionIndex * 3,
              count: g.attributes.position.count * 3,
            },
          },
          index: {
            start: indexIndex,
            count: g.index.count,
          },
          cloneItemDiceMesh: () => {
            let geometry = g.clone();
            _mapGeometryUvs(geometry);
            geometry = _diceGeometry(geometry);
            const mesh = _makeItemMesh(geometry);
            return mesh;
          },
          cloneItemMesh: () => {
            const geometry = g.clone();
            _mapGeometryUvs(geometry);
            const mesh = _makeItemMesh(geometry);
            return mesh;
          },
          clonePhysicsObject: () => {
            const shapeAddress = this.shapeAddresses[name];
            _getMatrixWorld(localMatrix)
              .decompose(localVector, localQuaternion, localVector2);
            const position = localVector;
            const quaternion = localQuaternion;
            const scale = localVector2;
            const dynamic = true;
            const external = true;
            const physicsObject = physicsManager.addConvexShape(shapeAddress, position, quaternion, scale, dynamic, external);
            return physicsObject;
          },
        };
        this.itemRegistry.push(item);
      };
      _addItemToRegistry();

      const _mapOffsettedPositions = (g, geometry) => {
        const count = g.attributes.position.count;

        const matrix = _getMatrix(localMatrix);

        for (let i = 0; i < count; i++) {
          const srcIndex = i;
          const dstIndex = positionIndex + i;

          localVector.fromArray(g.attributes.position.array, srcIndex * 3)
            .applyMatrix4(matrix)
            .toArray(geometry.attributes.position.array, dstIndex * 3);
        }
      };
      const _mapWarpedUvs = (src, dst, dstOffset, count) => {
        for (let i = 0; i < count; i++) {
          const srcIndex = i;
          const dstIndex = dstOffset + i;

          localVector2D.fromArray(src.array, srcIndex * 2);
          modUv(localVector2D);
          localVector2D
            .multiply(
              localVector2D2.set(tw/canvasSize, th/canvasSize)
            )
            .add(
              localVector2D2.set(tx/canvasSize, ty/canvasSize)
            );
          localVector2D.toArray(dst.array, dstIndex * 2);
        }
      };
      const _mapOffsettedIndices = (g, geometry) => {
        const count = g.index.count;
        for (let i = 0; i < count; i++) {
          geometry.index.array[indexIndex + i] = g.index.array[i] + positionIndex;
        }
      };

      _mapOffsettedPositions(g, geometry);
      geometry.attributes.normal.array.set(g.attributes.normal.array, positionIndex * 3);
      _mapWarpedUvs(g.attributes.uv, geometry.attributes.uv, positionIndex, g.attributes.uv.count);
      _mapWarpedUvs(g.attributes.uv2, geometry.attributes.uv2, positionIndex, g.attributes.uv2.count);
      _mapOffsettedIndices(g, geometry);

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.attributes.uv.needsUpdate = true;
      geometry.attributes.uv2.needsUpdate = true;
      geometry.index.needsUpdate = true;

      geometry.setAttribute('direction', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.array.length), 3));

      positionIndex += g.attributes.position.count;
      indexIndex += g.index.count;
    }

    geometry.setDrawRange(0, indexIndex);

    this.mesh.visible = true;
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
    this.tracker = new LodChunkTracker(this.generator);
  }
  registerLodMesh(name, shapeSpec) {
    const {
      type = 'object',
      lods = [],
    } = shapeSpec;

    /* const newMeshes = meshes.map(mesh => {
      const {geometry} = mesh;
      return mesh;
    }); */
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
  #getContentMergeable()  {
    /* const getObjectKey = (object, material) => {
      const renderer = getRenderer();
      return renderer.getProgramCacheKey(object, material);
    }; */
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
  
    // compute texture sizes
    const textureSizes = maps.map((map, i) => {
      const emissiveMap = emissiveMaps[i];
      const normalMap = normalMaps[i];
      const roughnessMap = roughnessMaps[i];
      const metalnessMap = metalnessMaps[i];
      
      const maxSize = new THREE.Vector2(0, 0);
      if (map) {
        maxSize.x = Math.max(maxSize.x, map.image.width);
        maxSize.y = Math.max(maxSize.y, map.image.height);
      }
      if (emissiveMap) {
        maxSize.x = Math.max(maxSize.x, emissiveMap.image.width);
        maxSize.y = Math.max(maxSize.y, emissiveMap.image.height);
      }
      if (normalMap) {
        maxSize.x = Math.max(maxSize.x, normalMap.image.width);
        maxSize.y = Math.max(maxSize.y, normalMap.image.height);
      }
      if (roughnessMap) {
        maxSize.x = Math.max(maxSize.x, roughnessMap.image.width);
        maxSize.y = Math.max(maxSize.y, roughnessMap.image.height);
      }
      if (metalnessMap) {
        maxSize.x = Math.max(maxSize.x, metalnessMap.image.width);
        maxSize.y = Math.max(maxSize.y, metalnessMap.image.height);
      }
      return maxSize;
    });
    const textureUuids = maps.map((map, i) => {
      const emissiveMap = emissiveMaps[i];
      const normalMap = normalMaps[i];
      const roughnessMap = roughnessMaps[i];
      const metalnessMap = metalnessMaps[i];

      const uuids = [];
      uuids.push(map ? map.uuid : null);
      uuids.push(emissiveMap ? emissiveMap.uuid : null);
      uuids.push(normalMap ? normalMap.uuid : null);
      uuids.push(roughnessMap ? roughnessMap.uuid : null);
      uuids.push(metalnessMap ? metalnessMap.uuid : null);
      return uuids.join(':');
    });
  
    // generate atlas layouts
    const _packAtlases = () => {
      const _attemptPack = (textureSizes, atlasSize) => {
        const maxRectsPacker = new MaxRectsPacker(atlasSize, atlasSize, 0);
        const rectUuidCache = new Map();
        const rectIndexCache = new Map();
        textureSizes.forEach((textureSize, index) => {
          const {x: width, y: height} = textureSize;
          const hash = textureUuids[index];
          
          let rect = rectUuidCache.get(hash);
          if (!rect) {
            rect = {
              width,
              height,
              data: {
                index,
              },
            };
            rectUuidCache.set(hash, rect);
          }
          rectIndexCache.set(index, rect);
        });
        const rects = Array.from(rectUuidCache.values());

        maxRectsPacker.addArray(rects);
        let oversized = maxRectsPacker.bins.length > 1;
        maxRectsPacker.bins.forEach(bin => {
          bin.rects.forEach(rect => {
            if (rect.oversized) {
              oversized = true;
            }
          });
        });
        if (!oversized) {
          maxRectsPacker.rectIndexCache = rectIndexCache;
          return maxRectsPacker;
        } else {
          return null;
        }
      };
      
      const hasTextures = textureSizes.some(textureSize => textureSize.x > 0 || textureSize.y > 0);
      if (hasTextures) {
        let atlas;
        let atlasSize = startAtlasSize;
        while (!(atlas = _attemptPack(textureSizes, atlasSize))) {
          atlasSize *= 2;
        }
        return atlas;
      } else {
        return null;
      }
    };
    const atlas = _packAtlases();
    this.atlas = atlas;

    // draw atlas images
    const _drawAtlasImages = atlas => {
      const _getTexturesKey = textures => textures.map(t => t ? t.uuid : '').join(',');
      const _drawAtlasImage = (textureType, textures) => {
        if (atlas && textures.some(t => t !== null)) {
          const canvasSize = Math.min(atlas.width, defaultTextureSize);
          const canvasScale = canvasSize / atlas.width;

          const canvas = document.createElement('canvas');
          canvas.width = canvasSize;
          canvas.height = canvasSize;

          const initializer = textureInitializers[textureType];
          if (initializer) {
            initializer(canvas);
          }

          const ctx = canvas.getContext('2d');
          atlas.bins.forEach(bin => {
            bin.rects.forEach(rect => {
              const {x, y, width: w, height: h, data: {index}} = rect;
              const texture = textures[index];
              if (texture) {
                const image = texture.image;

                // draw the image in the correct box on the canvas
                const tx = x * canvasScale;
                const ty = y * canvasScale;
                const tw = w * canvasScale;
                const th = h * canvasScale;
                ctx.drawImage(image, 0, 0, image.width, image.height, tx, ty, tw, th);
              }
            });
          });

          return canvas;
        } else {
          return null;
        }
      };

      const atlasImages = {};
      const atlasImagesMap = new Map(); // cache to alias identical textures
      for (const textureType of textureTypes) {
        const textures = mergeable[`${textureType}s`];
        const key = _getTexturesKey(textures);

        let atlasImage = atlasImagesMap.get(key);
        if (atlasImage === undefined) { // cache miss
          atlasImage = _drawAtlasImage(textureType, textures);
          if (atlasImage !== null) {
            atlasImage.key = key;
          }
          atlasImagesMap.set(key, atlasImage);
        }
        atlasImages[textureType] = atlasImage;
      }
      return atlasImages;
    };
    const atlasImages = _drawAtlasImages(atlas);

    const {material} = this;
    for (const textureType of textureTypes) {
      const atlasImage = atlasImages[textureType];
      if (atlasImage) {
        const texture = new THREE.Texture(atlasImage);
        texture.flipY = false;
        texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
        material[textureType] = texture;
      }
    }
    material.needsUpdate = true;

    this.meshes = meshes;

    this.compiled = true;
  }
  getChunks() {
    return this.generator.mesh;
  }
  getItemByPhysicsId(physicsId) {
    return this.generator.getItemByPhysicsId(physicsId);
  }
  deleteItem(item) {
    return this.generator.deleteItem(physicsId);
  }
  update() {
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