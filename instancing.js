import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {getRenderer} from './renderer.js';
// import { chunkMinForPosition, convertMeshToPhysicsMesh } from './util.js';
// import { PEEK_FACE_INDICES } from './constants.js';
import {ImmediateGLBufferAttribute} from './ImmediateGLBufferAttribute.js';
// import Module from './public/bin/geometry.js';
// import { Allocator } from './geometry-util.js';
// import { toHiraganaCase } from 'encoding-japanese';

const localVector2D = new THREE.Vector2();
// const localVector2D2 = new THREE.Vector2();
// const localVector3D = new THREE.Vector3();
const localVector3D2 = new THREE.Vector3();
const localVector3D3 = new THREE.Vector3();
const currentChunkMin = new THREE.Vector3();
const currentChunkMax = new THREE.Vector3();
const localMatrix = new THREE.Matrix4();
const localSphere = new THREE.Sphere();
const localBox = new THREE.Box3();
const localFrustum = new THREE.Frustum();
const localDataTexture = new THREE.DataTexture();

const PEEK_FACES = {
  FRONT : 0,
  BACK : 1,
  LEFT : 2,
  RIGHT : 3,
  TOP : 4,
  BOTTOM : 5,
  NONE : 6
};
/* const peekFaceSpecs = [
  [PEEK_FACES['BACK'], PEEK_FACES['FRONT'], 0, 0, -1],
  [PEEK_FACES['FRONT'], PEEK_FACES['BACK'], 0, 0, 1],
  [PEEK_FACES['LEFT'], PEEK_FACES['RIGHT'], -1, 0, 0],
  [PEEK_FACES['RIGHT'], PEEK_FACES['LEFT'], 1, 0, 0],
  [PEEK_FACES['TOP'], PEEK_FACES['BOTTOM'], 0, 1, 0],
  [PEEK_FACES['BOTTOM'], PEEK_FACES['TOP'], 0, -1, 0],
]; */

const maxNumDraws = 1024;

/* const isPointInPillar = (vector, min, max) => {
  return (vector.x >= min.x && vector.x < max.x) && (vector.z >= min.z && vector.z < max.z);
}; */

const _getBoundingSize = boundingType => {
  switch (boundingType) {
    case 'sphere': return 4;
    case 'box': return 6;
    default: return 0;
  }
};

// get the closes power of 2 that fits the given size
const _getClosestPowerOf2 = size => {
  return Math.ceil(Math.log2(size));
};

// align a memory address
const _align = (addr, n) => {
  const r = addr % n;
  return r === 0 ? addr : addr + (n - r);
};

// circular index buffer
const maxSlotEntries = 4096;
class FreeListArray {
  constructor(slotSize, parent) {
    this.slotSize = slotSize;
    this.parent = parent;
    
    this.startIndex = 0;
    this.endIndex = 0;
    this.entries = new Int32Array(maxSlotEntries);
    this.allocatedEntries = 0;
  }
  alloc() {
    if (this.allocatedEntries < maxSlotEntries) {
      if (this.startIndex === this.endIndex) {
        this.entries[this.endIndex] = this.parent.allocIndex(this.slotSize);
        this.endIndex = (this.endIndex + 1) % maxSlotEntries;
      }
      const index = this.entries[this.startIndex];
      this.startIndex = (this.startIndex + 1) % maxSlotEntries;
      this.allocatedEntries++;
      return index;
    } else {
      throw new Error('out of slots to allocate');
    }
  }
  free(index) {
    this.entries[this.endIndex] = index;
    this.endIndex = (this.endIndex + 1) % maxSlotEntries;
    this.allocatedEntries--;
  }
}
export class FreeList {
  constructor(size, alignment = 1) {
    this.freeStart = 0;
    this.freeEnd = size;
    this.alignment = alignment;

    this.slots = new Map(); // Map<slotSize, FreeListArray>
    this.slotSizes = new Map(); // Map<index, slotSize>
  }
  allocIndex(slotSize) {
    const allocSize = 1 << slotSize;
    let newFreeStart = this.freeStart + allocSize;
    newFreeStart = _align(newFreeStart, this.alignment);
    if (newFreeStart <= this.freeEnd) {
      const index = this.freeStart;
      this.freeStart = newFreeStart;
      return index;
    } else {
      throw new Error('out of memory to allocate to slot');
    }
  }
  alloc(size) {
    const slotSize = _getClosestPowerOf2(size);
    let slot = this.slots.get(slotSize);
    if (slot === undefined) {
      slot = new FreeListArray(slotSize, this);
      this.slots.set(slotSize, slot);
    }
    const index = slot.alloc();
    this.slotSizes.set(index, slotSize);
    return index;
  }
  free(index) {
    const slotSize = this.slotSizes.get(index);
    if (slotSize !== undefined) {
      const slot = this.slots.get(slotSize);
      if (slot !== undefined) {
        slot.free(index);
      } else {
        throw new Error('invalid free slot');
      }
    } else {
      throw new Error('invalid free index');
    }
  }
}

export class GeometryPositionIndexBinding {
  constructor(positionFreeListEntry, indexFreeListEntry, geometry) {
    this.positionFreeListEntry = positionFreeListEntry;
    this.indexFreeListEntry = indexFreeListEntry;
    this.geometry = geometry;
  }
  getAttributeOffset(name = 'position') {
    return this.positionFreeListEntry / 3 * this.geometry.attributes[name].itemSize;
  }
  getIndexOffset() {
    return this.indexFreeListEntry;
  }
}

const chunkAllocationDataSize =      // 35
  Int32Array.BYTES_PER_ELEMENT +     // id
  Int32Array.BYTES_PER_ELEMENT * 3 + // min
  Int32Array.BYTES_PER_ELEMENT +     // enterFace
  Uint8Array.BYTES_PER_ELEMENT * 15; // peeks

class ChunkAllocationData {
  constructor(id, min, enterFace, peeks) {
    this.id = id; // 4 bytes
    this.min = min; // 12 bytes
    this.enterFace = enterFace; // 4 bytes
    this.peeks = peeks; // 15 bytes
  }
  serialize(dataView, serializeId) {
    this.id = serializeId;

    let offset = serializeId * chunkAllocationDataSize;
    let localOffset = 0;

    
    dataView.setInt32(offset + localOffset, this.id, true);
    localOffset += Int32Array.BYTES_PER_ELEMENT;

    dataView.setInt32(offset + localOffset, this.min.x, true);
    localOffset += Int32Array.BYTES_PER_ELEMENT;

    dataView.setInt32(offset + localOffset, this.min.y, true);
    localOffset += Int32Array.BYTES_PER_ELEMENT;

    dataView.setInt32(offset + localOffset, this.min.z, true);
    localOffset += Int32Array.BYTES_PER_ELEMENT;

    dataView.setInt32(offset + localOffset, this.enterFace, true);
    localOffset += Int32Array.BYTES_PER_ELEMENT;

    for (let j = 0; j < 15; j++) {
      dataView.setUint8(offset + localOffset, this.peeks[j], true);
      localOffset += Uint8Array.BYTES_PER_ELEMENT;
    }
  }
}

function deserializeChunkAllocationData(dataView, serializeId) {
  let offset = serializeId * chunkAllocationDataSize;
  let localOffset = 0;
  const id = dataView.getInt32(offset + localOffset, true);
  localOffset += Int32Array.BYTES_PER_ELEMENT;

  const minX = dataView.getInt32(offset + localOffset, true);
  localOffset += Int32Array.BYTES_PER_ELEMENT;

  const minY = dataView.getInt32(offset + localOffset, true);
  localOffset += Int32Array.BYTES_PER_ELEMENT;

  const minZ = dataView.getInt32(offset + localOffset, true);
  localOffset += Int32Array.BYTES_PER_ELEMENT;

  const enterFace = dataView.getInt32(offset + localOffset, true);
  localOffset += Int32Array.BYTES_PER_ELEMENT;

  const peeks = new Uint8Array(15);

  for (let j = 0; j < 15; j++) {
    peeks.set([dataView.getUint8(offset + localOffset, true)], j);
    localOffset += Uint8Array.BYTES_PER_ELEMENT;
  }

  return new ChunkAllocationData(id, { x:minX, y:minY, z:minZ }, enterFace, peeks);
}

function deserializeDrawListBuffer(arrayBuffer, bufferAddress){
  const dataView = new DataView(arrayBuffer, bufferAddress);

  let index = 0;
  // DrawCalls
  const numDrawCalls = dataView.getUint32(index, true);
  index += Uint32Array.BYTES_PER_ELEMENT;
  const DrawCalls = new Int32Array(arrayBuffer, bufferAddress + index, numDrawCalls);
  index += Int32Array.BYTES_PER_ELEMENT * numDrawCalls;

  return DrawCalls;
}

export class GeometryAllocator {
  constructor(
    attributeSpecs,
    {
      bufferSize,
      boundingType = null,
      // hasOcclusionCulling = false,
    }
  ) {
    {
      this.geometry = new THREE.BufferGeometry();
      for (const attributeSpec of attributeSpecs) {
        const { name, Type, itemSize } = attributeSpec;

        const array = new Type(bufferSize * itemSize);
        this.geometry.setAttribute(
          name,
          new ImmediateGLBufferAttribute(array, itemSize, false)
        );
      }
      const indices = new Uint32Array(bufferSize);
      this.geometry.setIndex(new ImmediateGLBufferAttribute(indices, 1, true));
    }

    this.boundingType = boundingType;
    this.testBoundingFn = (() => {
      if (this.boundingType === 'sphere') {
        return (i, frustum) => {
          localSphere.center.fromArray(this.boundingData, i * 4);
          localSphere.radius = this.boundingData[i * 4 + 3];
          return frustum.intersectsSphere(localSphere)
            ? localSphere.center.distanceTo(camera.position)
            : false;
        };
      } else if (this.boundingType === 'box') {
        return (i, frustum) => {
          localBox.min.fromArray(this.boundingData, i * 6);
          localBox.max.fromArray(this.boundingData, i * 6 + 3);
          return frustum.intersectsBox(localBox);
        };
      } else {
        return null;
      }
    })();

    this.positionFreeList = new FreeList(bufferSize * 3, 3);
    this.indexFreeList = new FreeList(bufferSize);

    this.drawStarts = new Int32Array(maxNumDraws);
    this.drawCounts = new Int32Array(maxNumDraws);
    const boundingSize = _getBoundingSize(boundingType);
    this.boundingData = new Float32Array(maxNumDraws * boundingSize);
    this.minData = new Float32Array(maxNumDraws * 4);
    this.maxData = new Float32Array(maxNumDraws * 4);
    this.appMatrix = new THREE.Matrix4();
    // this.peeksArray = [];
    /* this.hasOcclusionCulling = hasOcclusionCulling;
    if (this.hasOcclusionCulling) {
      this.OCInstance = Module._initOcclusionCulling();
      const allocator = new Allocator(Module);
      const chunkAllocationBufferSize = maxNumDraws * chunkAllocationDataSize;
      this.chunkAllocationBuffer = allocator.alloc(
        Uint8Array,
        chunkAllocationBufferSize
      );
      // console.log(this.chunkAllocationBuffer.length);
      this.chunkAllocationArrayOffset = this.chunkAllocationBuffer.offset;
      this.chunkAllocationDataView = new DataView(
        Module.HEAP8.buffer,
        this.chunkAllocationArrayOffset,
        chunkAllocationBufferSize
      );
    } */
    this.numDraws = 0;
  }
  alloc(
    numPositions,
    numIndices,
    boundingObject,
    // minObject,
    // maxObject,
    // appMatrix,
    // peeks
  ) {
    const positionFreeListEntry = this.positionFreeList.alloc(numPositions);
    const indexFreeListEntry = this.indexFreeList.alloc(numIndices);
    const geometryBinding = new GeometryPositionIndexBinding(
      positionFreeListEntry,
      indexFreeListEntry,
      this.geometry
    );

    /* if (this.hasOcclusionCulling) {
      minObject.applyMatrix4(this.appMatrix);
      maxObject.applyMatrix4(this.appMatrix);

      const allocatedChunk = new ChunkAllocationData(
        this.numDraws,
        minObject,
        PEEK_FACES['NONE'],
        peeks
      );
      allocatedChunk.serialize(this.chunkAllocationDataView, this.numDraws);

      this.appMatrix = appMatrix;

      minObject.toArray(this.minData, this.numDraws * 4);
      maxObject.toArray(this.maxData, this.numDraws * 4);
    } */

    const slot = indexFreeListEntry;
    this.drawStarts[this.numDraws] =
      slot * this.geometry.index.array.BYTES_PER_ELEMENT;
    this.drawCounts[this.numDraws] = numIndices;
    if (this.boundingType === 'sphere') {
      boundingObject.center.toArray(this.boundingData, this.numDraws * 4);
      this.boundingData[this.numDraws * 4 + 3] = boundingObject.radius;
    } else if (this.boundingType === 'box') {
      boundingObject.min.toArray(this.boundingData, this.numDraws * 6);
      boundingObject.max.toArray(this.boundingData, this.numDraws * 6 + 3);
    }

    this.numDraws++;

    return geometryBinding;
  }
  free(geometryBinding) {
    const slot = geometryBinding.indexFreeListEntry;
    const expectedStartValue =
      slot * this.geometry.index.array.BYTES_PER_ELEMENT;
    // XXX using indexOf is slow. we can do better.
    const freeIndex = this.drawStarts.indexOf(expectedStartValue);

    if (this.numDraws >= 2) {
      const lastIndex = this.numDraws - 1;

      // copy the last index to the freed slot
      if (this.boundingType === 'sphere') {
        this.drawStarts[freeIndex] = this.drawStarts[lastIndex];
        this.drawCounts[freeIndex] = this.drawCounts[lastIndex];
        this.boundingData[freeIndex * 4] = this.boundingData[lastIndex * 4];
        this.boundingData[freeIndex * 4 + 1] =
          this.boundingData[lastIndex * 4 + 1];
        this.boundingData[freeIndex * 4 + 2] =
          this.boundingData[lastIndex * 4 + 2];
        this.boundingData[freeIndex * 4 + 3] =
          this.boundingData[lastIndex * 4 + 3];
      } else if (this.boundingType === 'box') {
        this.drawStarts[freeIndex] = this.drawStarts[lastIndex];
        this.drawCounts[freeIndex] = this.drawCounts[lastIndex];
        this.boundingData[freeIndex * 6] = this.boundingData[lastIndex * 6];
        this.boundingData[freeIndex * 6 + 1] =
          this.boundingData[lastIndex * 6 + 1];
        this.boundingData[freeIndex * 6 + 2] =
          this.boundingData[lastIndex * 6 + 2];
        this.boundingData[freeIndex * 6 + 3] =
          this.boundingData[lastIndex * 6 + 3];
        this.boundingData[freeIndex * 6 + 4] =
          this.boundingData[lastIndex * 6 + 4];
        this.boundingData[freeIndex * 6 + 5] =
          this.boundingData[lastIndex * 6 + 5];
      }

      if (this.hasOcclusionCulling) {
        this.minData[freeIndex * 4 + 0] = this.minData[lastIndex * 4 + 0];
        this.minData[freeIndex * 4 + 1] = this.minData[lastIndex * 4 + 1];
        this.minData[freeIndex * 4 + 2] = this.minData[lastIndex * 4 + 2];

        this.maxData[freeIndex * 4 + 0] = this.maxData[lastIndex * 4 + 0];
        this.maxData[freeIndex * 4 + 1] = this.maxData[lastIndex * 4 + 1];
        this.maxData[freeIndex * 4 + 2] = this.maxData[lastIndex * 4 + 2];

        const freeChunk = deserializeChunkAllocationData(
          this.chunkAllocationDataView,
          lastIndex
        );
        freeChunk.serialize(this.chunkAllocationDataView, freeIndex); // free
      }
    }

    this.numDraws--;

    this.positionFreeList.free(geometryBinding.positionFreeListEntry);
    this.indexFreeList.free(geometryBinding.indexFreeListEntry);
  }
  getDrawSpec(camera, drawStarts, drawCounts, distanceArray) {
    drawStarts.length = 0;
    drawCounts.length = 0;
    distanceArray.length = 0;

    for (let i = 0; i < this.numDraws; i++) {
      let frustumCullVisible = true;
      if (this.testBoundingFn) {
        // XXX this can be optimized by initializing the frustum only once per frame and passing it in
        const projScreenMatrix = localMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse
        );
        localFrustum.setFromProjectionMatrix(projScreenMatrix);

        frustumCullVisible = this.testBoundingFn(i, localFrustum);
      }
      if (frustumCullVisible) {
        drawStarts.push(this.drawStarts[i]);
        drawCounts.push(this.drawCounts[i]);
      }
    }

    /* if (this.hasOcclusionCulling) {
      const findSearchStartingChunk = () => {
        let foundId;
        let surfaceY = -Infinity;
        // find the chunk that the camera is inside of
        for (let i = 0; i < this.numDraws; i++) {
          localVector3D2.set(0, 0, 0);
          localVector3D3.set(0, 0, 0);

          const min = localVector3D2.fromArray(this.minData, i * 4); // min
          const max = localVector3D3.fromArray(this.maxData, i * 4); // max

          if (isPointInPillar(camera.position, min, max)) {
            // we pick the chunk that has the largest height between those who are in the correct range
            if (surfaceY < min.y && min.y <= 0 && min.y <= camera.position.y) {
              surfaceY = min.y;
              currentChunkMin.copy(min);
              currentChunkMax.copy(max);
              foundId = i;
            }
          }
        }
        return foundId;
      };

      const foundId = findSearchStartingChunk();
     

      if (foundId) {
        const cameraView = new THREE.Vector3();
        const drawListBuffer = Module._cullOcclusionCulling(
          this.OCInstance,
          this.chunkAllocationArrayOffset,
          foundId,
          currentChunkMin.x,
          currentChunkMin.y,
          currentChunkMin.z,
          currentChunkMax.x,
          currentChunkMax.y,
          currentChunkMax.z,
          camera.position.x,
          camera.position.y,
          camera.position.z,
          cameraView.x,
          cameraView.y,
          cameraView.z,
          this.numDraws
        );
        const drawCalls = deserializeDrawListBuffer(
          Module.HEAP8.buffer,
          Module.HEAP8.byteOffset + drawListBuffer
        );
        for (let i = 0; i < drawCalls.length; i++) {
          drawStarts.push(this.drawStarts[drawCalls[i]]);
          drawCounts.push(this.drawCounts[drawCalls[i]]);
        }
      } else {
        fullyDraw();
      }
    } else {
      fullyDraw();
    } */
  }
}

export class DrawCallBinding {
  constructor(geometryIndex, freeListEntry, allocator) {
    this.geometryIndex = geometryIndex;
    this.freeListEntry = freeListEntry;
    this.allocator = allocator;
  }
  getTexture(name) {
    return this.allocator.getTexture(name);
  }
  getTextureOffset(name) {
    const texture = this.getTexture(name);
    const {itemSize} = texture;
    return this.freeListEntry * this.allocator.maxInstancesPerDrawCall * itemSize;
  }
  getInstanceCount() {
    return this.allocator.getInstanceCount(this);
  }
  setInstanceCount(instanceCount) {
    this.allocator.setInstanceCount(this, instanceCount);
  }
  incrementInstanceCount() {
    return this.allocator.incrementInstanceCount(this);
  }
  decrementInstanceCount() {
    return this.allocator.decrementInstanceCount(this);
  }
  updateTexture(name, dataIndex, dataLength) {
    const texture = this.getTexture(name);

    let pixelIndex = dataIndex / texture.itemSize;
    let itemCount = dataLength / texture.itemSize;

    // update all pixels from pixelIndex to pixelIndex + itemCount
    // this requires up to 3 writes to the texture
    const renderer = getRenderer();

    let minX = pixelIndex % texture.image.width;
    let minY = Math.floor(pixelIndex / texture.image.width);
    let maxX = (pixelIndex + itemCount) % texture.image.width;
    let maxY = Math.floor((pixelIndex + itemCount) / texture.image.width);

    // top
    if (minX !== 0) {
      const x = minX;
      const y = minY;
      const w = Math.min(texture.image.width - x, itemCount);
      const h = 1;
      const position = localVector2D.set(x, y);
      const start = (x + y * texture.image.width) * texture.itemSize;
      const size = (w * h) * texture.itemSize;
      const data = texture.image.data.subarray(
        start,
        start + size
      );

      const srcTexture = localDataTexture;
      srcTexture.image.data = data;
      srcTexture.image.width = w;
      srcTexture.image.height = h;
      srcTexture.format = texture.format;
      srcTexture.type = texture.type;

      renderer.copyTextureToTexture(
        position,
        srcTexture,
        texture,
        0
      );

      srcTexture.image.data = null;

      minX = 0;
      minY++;

      pixelIndex += w * h; 
      itemCount -= w * h;
    }

    // middle
    if (minY < maxY) {
      const x = 0;
      const y = minY;
      const w = texture.image.width;
      const h = maxY - minY;
      const position = localVector2D.set(x, y);
      const start = (x + y * texture.image.width) * texture.itemSize;
      const size = (w * h) * texture.itemSize;
      const data = texture.image.data.subarray(
        start,
        start + size
      );

      const srcTexture = localDataTexture;
      srcTexture.image.data = data;
      srcTexture.image.width = w;
      srcTexture.image.height = h;
      srcTexture.format = texture.format;
      srcTexture.type = texture.type;

      renderer.copyTextureToTexture(
        position,
        srcTexture,
        texture,
      );

      srcTexture.image.data = null;

      minX = 0;
      minY = maxY;

      pixelIndex += w * h;
      itemCount -= w * h;
    }

    // bottom
    if (itemCount > 0) {
      const x = minX;
      const y = minY;
      const w = itemCount;
      const h = 1;
      const position = localVector2D.set(x, y);
      const start = (x + y * texture.image.width) * texture.itemSize;
      const size = (w * h) * texture.itemSize;
      const data = texture.image.data.subarray(
        start,
        start + size
      );

      const srcTexture = localDataTexture;
      srcTexture.image.data = data;
      srcTexture.image.width = w;
      srcTexture.image.height = h;
      srcTexture.format = texture.format;
      srcTexture.type = texture.type;

      renderer.copyTextureToTexture(
        position,
        srcTexture,
        texture,
      );

      srcTexture.image.data = null;
    }
  }
}

const _swapTextureAttributes = (texture, i, j, maxInstancesPerDrawCall) => {
  const {itemSize} = texture;
  const startOffset = i * maxInstancesPerDrawCall;
  const dstStart = (startOffset + j) * itemSize;
  const srcStart = (startOffset + maxInstancesPerDrawCall - 1) * itemSize;
  const count = itemSize;
  texture.image.data.copyWithin(
    dstStart,
    srcStart,
    srcStart + count
  );
};
const _swapBoundingDataSphere = (instanceBoundingData, i, j, maxInstancesPerDrawCall) => {
  const dstStart = (startOffset + j) * 4;
  const srcStart = (startOffset + maxInstancesPerDrawCall - 1) * 4;
  instanceBoundingData.copyWithin(
    dstStart,
    srcStart,
    srcStart + 4
  );
};
const _swapBoundingDataBox = (instanceBoundingData, i, j, maxInstancesPerDrawCall) => {
  const dstStart = (startOffset + j) * 6;
  const srcStart = (startOffset + maxInstancesPerDrawCall - 1) * 6;
  instanceBoundingData.copyWithin(
    dstStart,
    srcStart,
    srcStart + 6
  );
};
export class InstancedGeometryAllocator {
  constructor(geometries, instanceTextureSpecs, {
    maxInstancesPerDrawCall,
    maxDrawCallsPerGeometry,
    maxSlotsPerGeometry,
    boundingType = null,
    instanceBoundingType = null,
  }) {
    this.maxInstancesPerDrawCall = maxInstancesPerDrawCall;
    this.maxDrawCallsPerGeometry = maxDrawCallsPerGeometry;
    this.boundingType = boundingType;
    this.instanceBoundingType = instanceBoundingType;
    
    this.drawStarts = new Int32Array(geometries.length * maxDrawCallsPerGeometry);
    this.drawCounts = new Int32Array(geometries.length * maxDrawCallsPerGeometry);
    this.drawInstanceCounts = new Int32Array(geometries.length * maxDrawCallsPerGeometry);
    
    const boundingSize = _getBoundingSize(boundingType);
    this.boundingData = new Float32Array(geometries.length * maxDrawCallsPerGeometry * boundingSize);
    const instanceBoundingSize = _getBoundingSize(instanceBoundingType);
    this.instanceBoundingData = new Float32Array(geometries.length * maxDrawCallsPerGeometry * maxInstancesPerDrawCall * instanceBoundingSize);
 
    this.testBoundingFn = (() => {
      if (this.boundingType === 'sphere') {
        return (i, frustum) => {
          localSphere.center.fromArray(this.boundingData, i * 4);
          localSphere.radius = this.boundingData[i * 4 + 3];
          return frustum.intersectsSphere(localSphere);
        };
      } else if (this.boundingType === 'box') {
        return (i, frustum) => {
          localBox.min.fromArray(this.boundingData, i * 6);
          localBox.max.fromArray(this.boundingData, i * 6 + 3);
          return frustum.intersectsBox(localBox);
        };
      } else {
        return null;
      }
    })();
    this.swapBoundingDataFn = (() => {
      if (this.boundingType === 'sphere') {
        return _swapBoundingDataSphere;
      } else if (this.boundingType === 'box') {
        return _swapBoundingDataBox;
      } else {
        // throw new Error('Invalid bounding type: ' + this.boundingType);
        return null;
      }
    })();
    this.testInstanceBoundingFn = (() => {
      if (this.boundingType === 'sphere') {
        return (j, frustum) => {
          const sphereIndex = j;
          localSphere.center.fromArray(this.instanceBoundingData, sphereIndex * 4);
          localSphere.radius = this.instanceBoundingData[sphereIndex * 4 + 3];
          return frustum.intersectsSphere(localSphere);
        };
      } else if (this.boundingType === 'box') {
        return (j, frustum) => {
          const boxIndex = j;
          localBox.min.fromArray(this.boundingData, boxIndex * 6);
          localBox.max.fromArray(this.boundingData, boxIndex * 6 + 3);
          return frustum.intersectsBox(localBox);
        };
      } else {
        // throw new Error('Invalid bounding type: ' + this.boundingType);
        return null;
      }
    })();

    {
      const numGeometries = geometries.length;
      const geometryRegistry = Array(numGeometries);
      let positionIndex = 0;
      let indexIndex = 0;
      for (let i = 0; i < numGeometries; i++) {
        const geometry = geometries[i];

        const positionCount = geometry.attributes.position.count;
        const indexCount = geometry.index.count;
        const spec = {
          position: {
            start: positionIndex,
            count: positionCount,
          },
          index: {
            start: indexIndex,
            count: indexCount,
          },
        };
        geometryRegistry[i] = spec;

        positionIndex += positionCount;
        indexIndex += indexCount;
      }
      this.geometryRegistry = geometryRegistry;

      this.geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);

      this.texturesArray = instanceTextureSpecs.map(spec => {
        const {
          name,
          Type,
          itemSize,
          instanced = true
        } = spec;

        // compute the minimum size of a texture that can hold the data

        let itemCount = numGeometries * maxDrawCallsPerGeometry * maxInstancesPerDrawCall;
        if ( !instanced ) {
          itemCount = maxSlotsPerGeometry * numGeometries;
        }
        let neededItems4 = itemCount;
        if (itemSize > 4) {
          neededItems4 *= itemSize / 4;
        }
        const textureSizePx = Math.min(Math.max(Math.pow(2, Math.ceil(Math.log2(Math.sqrt(neededItems4)))), 16), 2048);
        const itemSizeSnap = itemSize > 4 ? 4 : itemSize;
        // console.log('textureSizePx', name, textureSizePx, itemCount);

        const format = (() => {
          if (itemSize === 1) {
            return THREE.RedFormat;
          } else if (itemSize === 2) {
            return THREE.RGFormat;
          } else if (itemSize === 3) {
            return THREE.RGBFormat;
          } else /*if (itemSize >= 4)*/ {
            return THREE.RGBAFormat;
          }
        })();
        const type = (() => {
          if (Type === Float32Array) {
            return THREE.FloatType;
          } else if (Type === Uint32Array) {
            return THREE.UnsignedIntType;
          } else if (Type === Int32Array) {
            return THREE.IntType;
          } else if (Type === Uint16Array) {
            return THREE.UnsignedShortType;
          } else if (Type === Int16Array) {
            return THREE.ShortType;
          } else if (Type === Uint8Array) {
            return THREE.UnsignedByteType;
          } else if (Type === Int8Array) {
            return THREE.ByteType;
          } else {
            throw new Error('unsupported type: ' + type);
          }
        })();

        const data = new Type(textureSizePx * textureSizePx * itemSizeSnap);
        const texture = new THREE.DataTexture(data, textureSizePx, textureSizePx, format, type);
        texture.name = name;
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        // texture.flipY = true;
        texture.needsUpdate = true;
        texture.itemSize = itemSize;
        return texture;
      });
      this.textures = {};
      for (let i = 0; i < this.texturesArray.length; i++) {
        const textureSpec = instanceTextureSpecs[i];
        const {name} = textureSpec;
        this.textures[name] = this.texturesArray[i];
      }
      this.textureIndexes = {};
      for (let i = 0; i < this.texturesArray.length; i++) {
        const textureSpec = instanceTextureSpecs[i];
        const {name} = textureSpec;
        this.textureIndexes[name] = i;
      }

      this.freeList = new FreeList(numGeometries * maxDrawCallsPerGeometry);
    }
  }
  allocDrawCall(geometryIndex, boundingObject) {
    const freeListEntry = this.freeList.alloc(1);
    const drawCall = new DrawCallBinding(geometryIndex, freeListEntry, this);

    const geometrySpec = this.geometryRegistry[geometryIndex];
    const {
      index: {
        start,
        count,
      },
    } = geometrySpec;

    this.drawStarts[freeListEntry] = start * this.geometry.index.array.BYTES_PER_ELEMENT;
    this.drawCounts[freeListEntry] = count;
    this.drawInstanceCounts[freeListEntry] = 0;
    if (this.boundingType === 'sphere') {
      boundingObject.center.toArray(this.boundingData, freeListEntry  * 4);
      this.boundingData[freeListEntry * 4 + 3] = boundingObject.radius;
    } else if (this.boundingType === 'box') {
      boundingObject.min.toArray(this.boundingData, freeListEntry * 6);
      boundingObject.max.toArray(this.boundingData, freeListEntry * 6 + 3);
    }
    
    return drawCall;
  }
  freeDrawCall(drawCall) {
    const {freeListEntry} = drawCall;

    this.drawStarts[freeListEntry] = 0;
    this.drawCounts[freeListEntry] = 0;
    this.drawInstanceCounts[freeListEntry] = 0;
    if (this.boundingType === 'sphere') {
      this.boundingData[freeListEntry * 4] = 0;
      this.boundingData[freeListEntry * 4 + 1] = 0;
      this.boundingData[freeListEntry * 4 + 2] = 0;
      this.boundingData[freeListEntry * 4 + 3] = 0;
    } else if (this.boundingType === 'box') {
      this.boundingData[freeListEntry * 6] = 0;
      this.boundingData[freeListEntry * 6 + 1] = 0;
      this.boundingData[freeListEntry * 6 + 2] = 0;
      this.boundingData[freeListEntry * 6 + 3] = 0;
      this.boundingData[freeListEntry * 6 + 4] = 0;
      this.boundingData[freeListEntry * 6 + 5] = 0;
    }

    this.freeList.free(freeListEntry);
  }
  getInstanceCount(drawCall) {
    return this.drawInstanceCounts[drawCall.freeListEntry];
  }
  setInstanceCount(drawCall, instanceCount) {
    this.drawInstanceCounts[drawCall.freeListEntry] = instanceCount;
  }
  incrementInstanceCount(drawCall) {
    this.drawInstanceCounts[drawCall.freeListEntry]++;
  }
  decrementInstanceCount(drawCall) {
    this.drawInstanceCounts[drawCall.freeListEntry]--;
  }
  getTexture(name) {
    return this.textures[name];
  }
  getDrawSpec(camera, multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts) {
    multiDrawStarts.length = this.drawStarts.length;
    multiDrawCounts.length = this.drawCounts.length;
    multiDrawInstanceCounts.length = this.drawInstanceCounts.length;

    if (this.testBoundingFn || this.testInstanceBoundingFn) {
      const projScreenMatrix = localMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      localFrustum.setFromProjectionMatrix(projScreenMatrix);
    }

    for (let i = 0; i < this.drawStarts.length; i++) {
      if (!this.testBoundingFn || this.testBoundingFn(i, localFrustum)) {
        multiDrawStarts[i] = this.drawStarts[i];
        multiDrawCounts[i] = this.drawCounts[i];
        
        if (this.instanceBoundingType) {
          const startOffset = i * this.maxInstancesPerDrawCall;

          // arrange the instanced draw list :
          // - apply per-instanse frustum culling
          // - swapping the bounding data into place
          // - accumulate the real instance draw count
          const maxDrawableInstances = this.drawInstanceCounts[i];
          let instancesToDraw = 0;
          for (let j = 0; j < maxDrawableInstances; j++) {
            if (!this.testInstanceBoundingFn || this.testInstanceBoundingFn(startOffset + j, localFrustum)) {
              instancesToDraw++;
            } else {
              // swap this instance with the last instance to remove it
              for (const texture of this.texturesArray) {
                _swapTextureAttributes(texture, i, j, this.maxInstancesPerDrawCall);
              }
              if (this.swapBoundingDataFn) {
                  this.swapBoundingDataFn(this.instanceBoundingData, i, j, this.maxInstancesPerDrawCall);
              }
            }
          }

          multiDrawInstanceCounts[i] = instancesToDraw;
        } else {
          multiDrawInstanceCounts[i] = this.drawInstanceCounts[i];
        }
      } else {
        multiDrawStarts[i] = 0;
        multiDrawCounts[i] = 0;
        multiDrawInstanceCounts[i] = 0;
      }
    }
  }
}

export class BatchedMesh extends THREE.Mesh {
  constructor(geometry, material, allocator) {
    super(geometry, material);
    
    this.isBatchedMesh = true;
    this.allocator = allocator;
    this.distanceArray = [];
  }
	getDrawSpec(camera, drawStarts, drawCounts) {
    this.allocator.getDrawSpec(camera, drawStarts, drawCounts, this.distanceArray);
  }
}

export class InstancedBatchedMesh extends THREE.InstancedMesh {
  constructor(geometry, material, allocator) {
    super(geometry, material);
    
    this.isBatchedMesh = true;
    this.allocator = allocator;
  }
	getDrawSpec(camera, multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts) {
    this.allocator.getDrawSpec(camera, multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts);
  }
}