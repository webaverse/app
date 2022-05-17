import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
import {localPlayer} from './players.js';
import {alea} from './procgen/procgen.js';
import {getRenderer} from './renderer.js';
import {modUv} from './util.js';
import physicsManager from './physics-manager.js';
import {defaultMaxId} from './constants.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const bufferSize = 20 * 1024 * 1024;
const maxNumItems = defaultMaxId;
const chunkWorldSize = 30;
const defaultTextureSize = 4096;
const startAtlasSize = 512;
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
  const popUpdate = ExtendedGLBufferAttribute.pushUpdate();
  geometry.attributes.position.update(positionStart, positionCount);
  popUpdate();
};

class LodChunk extends THREE.Vector3 {
  constructor(x, y, z, lod) {
    super(x, y, z);
    this.lod = lod;

    this.name = `chunk:${this.x}:${this.z}`;
    this.geometryBinding = null;
    this.items = [];
    this.physicsObjects = [];
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

    if (!currentCoord.equals(this.lastUpdateCoord)) {
      // console.log('got current coord', [currentCoord.x, currentCoord.y]);
      const lod = 0;
      const neededChunks = [];
      for (let dcx = -1; dcx <= 1; dcx++) {
        for (let dcz = -1; dcz <= 1; dcz++) {
          const chunk = new LodChunk(currentCoord.x + dcx, 0, currentCoord.y + dcz, lod);
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

      for (const removedChunk of removedChunks) {
        this.generator.disposeChunk(removedChunk);
        const index = this.chunks.indexOf(removedChunk);
        this.chunks.splice(index, 1);
      }
      for (const addedChunk of addedChunks) {
        this.generator.generateChunk(addedChunk);
        this.chunks.push(addedChunk);
      }
    
      this.lastUpdateCoord.copy(currentCoord);
    }
  }
  destroy() {
    for (const chunk of this.chunks) {
      this.generator.disposeChunk(chunk);
    }
    this.chunks.length = 0;
  }
}

class FreeListSlot {
  constructor(start, count, used) {
    // array-relative indexing, not item-relative
    // start++ implies attribute.array[start++]
    this.start = start;
    this.count = count;
    this.used = used;
  }
  alloc(size) {
    if (size < this.count) {
      // console.log('alloc sub', size, this.count);
      this.used = true;
      const newSlot = new FreeListSlot(this.start + size, this.count - size, false);
      this.count = size;
      return [
        this,
        newSlot,
      ];
    } else if (size === this.count) {
      // console.log('alloc full', size, this.count);
      this.used = true;
      return [this];
    } else {
      throw new Error('could not allocate from self: ' + size + ' : ' + this.count);
      return null;
    }
  }
  free() {
    this.used = false;
    return [this];
  }
}

class FreeList {
  constructor(size) {
    this.slots = [
      new FreeListSlot(0, size, false),
    ];
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
    if (size > 0) {
      const index = this.findFirstFreeSlotIndexWithSize(size);
      if (index !== -1) {
        const slot = this.slots[index];
        const replacementArray = slot.alloc(size);
        this.slots.splice.apply(this.slots, [index, 1].concat(replacementArray));
        return replacementArray[0];
      } else {
        throw new Error('out of memory');
        return null;
      }
    } else {
      throw new Error('alloc size must be > 0');
      return null;
    }
  }
  free(slot) {
    const index = this.slots.indexOf(slot);
    if (index !== -1) {
      const replacementArray = slot.free();
      this.slots.splice.apply(this.slots, [index, 1].concat(replacementArray));
      // this.#mergeAdjacentSlots();
    } else {
      throw new Error('invalid free');
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
  getGeometryGroups() {
    const groups = [];
    for (const slot of this.slots) {
      if (slot.used) {
        groups.push({
          start: slot.start,
          count: slot.count,
          materialIndex: 0,
        });
      }
    }
    return groups;
  }
}

class GeometryBinding {
  constructor(positionFreeListEntry, indexFreeListEntry, geometry) {
    this.positionFreeListEntry = positionFreeListEntry;
    this.indexFreeListEntry = indexFreeListEntry;
    this.geometry = geometry;
  }
  getAttributeOffset(name = 'position') {
    return this.positionFreeListEntry.start / 3 * this.geometry.attributes[name].itemSize;
  }
  getIndexOffset() {
    return this.indexFreeListEntry.start;
  }
}

class GeometryAllocator {
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
        this.geometry.setAttribute(name, new ExtendedGLBufferAttribute(array, itemSize, false));
      }
      const indices = new Uint32Array(bufferSize);
      this.geometry.setIndex(new ExtendedGLBufferAttribute(indices, 1, true));
    }

    this.positionFreeList = new FreeList(bufferSize * 3);
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

const _getMatrixWorld = (rootMesh, contentMesh, target, positionX, positionZ, rotationY) => {
  return _getMatrix(contentMesh, target, positionX, positionZ, rotationY)
    .premultiply(rootMesh.matrixWorld);
};
const _getMatrix = (contentMesh, target, positionX, positionZ, rotationY) => {
  localVector.set(positionX, 0, positionZ)
  localQuaternion.setFromAxisAngle(upVector, rotationY)
  
  return target.copy(contentMesh.matrixWorld)
    .premultiply(localMatrix3.compose(localVector, localQuaternion, localVector2.set(1, 1, 1)));
};

const _mapGeometryUvs = (g, geometry, tx, ty, tw, th, canvasSize) => {
  _mapWarpedUvs(g.attributes.uv, geometry.attributes.uv, 0, tx, ty, tw, th, canvasSize);
  _mapWarpedUvs(g.attributes.uv2, geometry.attributes.uv2, 0, tx, ty, tw, th, canvasSize);
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
const _mapWarpedUvs = (src, dst, dstOffset, tx, ty, tw, th, canvasSize) => {
  const count = src.count;
  for (let i = 0; i < count; i++) {
    const srcIndex = i;
    const localDstOffset = dstOffset + i * 2;

    localVector2D.fromArray(src.array, srcIndex * 2);
    modUv(localVector2D);
    localVector2D
      .multiply(
        localVector2D2.set(tw/canvasSize, th/canvasSize)
      )
      .add(
        localVector2D2.set(tx/canvasSize, ty/canvasSize)
      );
    localVector2D.toArray(dst.array, localDstOffset);
  }
};
const _mapOffsettedIndices = (g, geometry, dstOffset, positionOffset) => {
  const count = g.index.count;
  const positionIndex = positionOffset / 3;
  for (let i = 0; i < count; i++) {
    geometry.index.array[dstOffset + i] = g.index.array[i] + positionIndex;
  }
};

class ExtendedGLBufferAttribute extends THREE.GLBufferAttribute {
  constructor(array, itemSize, isIndex = false) {
    const Type = array.constructor;
    let glType;
    switch (Type) {
      case Float32Array: {
        glType = WebGLRenderingContext.FLOAT;
        break;
      }
      case Uint16Array: {
        glType = WebGLRenderingContext.UNSIGNED_SHORT;
        break;
      }
      case Uint32Array: {
        glType = WebGLRenderingContext.UNSIGNED_INT;
        break;
      }
      default: {
        throw new Error(`Unsupported array type: ${Type}`);
      }
    }
    const renderer = getRenderer();
    const gl = renderer.getContext();
    const buffer = gl.createBuffer();
    const target = ExtendedGLBufferAttribute.getTarget(isIndex);
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, array.byteLength, gl.STATIC_DRAW);
    gl.bindBuffer(target, null);
    super(buffer, glType, itemSize, Type.BYTES_PER_ELEMENT, array.length / itemSize);
    
    this.array = array;
    this.isIndex = isIndex;
    /* this.updateRange = {
      offset: 0,
      count: -1,
    }; */
  }
  static getTarget(isIndex) {
    return isIndex ? WebGLRenderingContext.ELEMENT_ARRAY_BUFFER : WebGLRenderingContext.ARRAY_BUFFER;
  }
  getTarget() {
    return ExtendedGLBufferAttribute.getTarget(this.isIndex);
  }
  static getTargetBinding(isIndex) {
    return isIndex ? WebGLRenderingContext.ELEMENT_ARRAY_BUFFER_BINDING : WebGLRenderingContext.ARRAY_BUFFER_BINDING;
  }
  getTargetBinding() {
    return ExtendedGLBufferAttribute.getTargetBinding(this.isIndex);
  }
  pushed = false;
  static pushUpdate() {
    const renderer = getRenderer();
    const gl = renderer.getContext();
    
    const arrayBufferBinding = gl.getParameter(WebGLRenderingContext.ARRAY_BUFFER_BINDING);
    const elementArrayBufferBinding = gl.getParameter(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER_BINDING);
    this.pushed = true;

    const popUpdate = () => {
      gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, arrayBufferBinding);
      gl.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, elementArrayBufferBinding);
      this.pushed = false;
    };
    return popUpdate;
  }
  update(offset, count) {
    let popUpdate = null;
    if (!ExtendedGLBufferAttribute.pushed) {
      popUpdate = ExtendedGLBufferAttribute.pushUpdate();
    }
   
    {
      const renderer = getRenderer();
      const gl = renderer.getContext();
      const target = this.getTarget();
      
      gl.bindBuffer(target, this.buffer);
      gl.bufferSubData(
        target,
        offset * this.elementSize,
        this.array,
        offset,
        count
      );
    }

    popUpdate && popUpdate();
  }
}

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
    const result = this.parent.shapeAddresses[name];
    /* if (!result) {
      debugger;
    } */
    return result;
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
      let totalNumPositions = [];
      let totalNumIndices = [];
      
      const contentIndexNames = this.#getContentIndexNames();
      const numObjects = minObjectsPerChunk + Math.floor(rng() * (maxObjectPerChunk - minObjectsPerChunk));
      for (let i = 0; i < numObjects; i++) {
        const contentName = contentIndexNames[Math.floor(rng() * contentIndexNames.length)];
        const meshes = this.#getContent(contentName);

        let totalPositionsArray = [];
        let totalIndicesArray = [];
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

      const popUpdate = ExtendedGLBufferAttribute.pushUpdate();
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
            _mapWarpedUvs(g.attributes.uv, geometry.attributes.uv, uvOffset, tx, ty, tw, th, canvasSize);
            _mapWarpedUvs(g.attributes.uv2, geometry.attributes.uv2, uvOffset, tx, ty, tw, th, canvasSize);
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

    chunk.geometryBinding = geometryBinding;
    chunk.physicsObjects = physicsObjects;
    this.allocator.geometry.groups = this.allocator.indexFreeList.getGeometryGroups(); // XXX memory for this can be optimized
    this.mesh.visible = true;
  }
  disposeChunk(chunk) {
    this.allocator.free(chunk.geometryBinding);
    chunk.geometryBinding = null;

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
    this.tracker = new LodChunkTracker(this.generator);
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
  #getContentMergeable()  {
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