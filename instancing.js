import * as THREE from 'three';
import {ImmediateGLBufferAttribute} from './ImmediateGLBufferAttribute.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {getRenderer} from './renderer.js';

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localMatrix = new THREE.Matrix4();
const localSphere = new THREE.Sphere();
const localBox = new THREE.Box3();
const localFrustum = new THREE.Frustum();
const localDataTexture = new THREE.DataTexture();

const maxNumDraws = 1024;

const _getBoundingSize = boundingType => {
  switch (boundingType) {
    case 'sphere': return 4;
    case 'box': return 6;
    default: return 0;
  }
};

export class FreeListSlot {
  constructor(start, count, used) {
    // array-relative indexing, not item-relative
    // start++ implies attribute.array[start++]
    this.start = start;
    this.count = count;
    this.used = used;
  }
  alloc(size) {
    if (size < this.count) {
      this.used = true;
      const newSlot = new FreeListSlot(this.start + size, this.count - size, false);
      this.count = size;
      return [
        this,
        newSlot,
      ];
    } else if (size === this.count) {
      this.used = true;
      return [this];
    } else {
      throw new Error('could not allocate from self: ' + size + ' : ' + this.count);
    }
  }
  free() {
    this.used = false;
    return [this];
  }
}

export class FreeList {
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
      }
    } else {
      throw new Error('alloc size must be > 0');
    }
  }
  free(slot) {
    const index = this.slots.indexOf(slot);
    if (index !== -1) {
      const replacementArray = slot.free();
      this.slots.splice.apply(this.slots, [index, 1].concat(replacementArray));
      this.#mergeAdjacentSlots();
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
}

export class GeometryPositionIndexBinding {
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

export class GeometryAllocator {
  constructor(attributeSpecs, {
    bufferSize,
    boundingType = null,
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
        this.geometry.setAttribute(name, new ImmediateGLBufferAttribute(array, itemSize, false));
      }
      const indices = new Uint32Array(bufferSize);
      this.geometry.setIndex(new ImmediateGLBufferAttribute(indices, 1, true));
    }

    this.boundingType = boundingType;

    this.positionFreeList = new FreeList(bufferSize * 3);
    this.indexFreeList = new FreeList(bufferSize);

    this.drawStarts = new Int32Array(maxNumDraws);
    this.drawCounts = new Int32Array(maxNumDraws);
    const boundingSize = _getBoundingSize(boundingType);
    this.boundingData = new Float32Array(maxNumDraws * boundingSize);
    this.numDraws = 0;
  }
  alloc(numPositions, numIndices, boundingObject) {
    const positionFreeListEntry = this.positionFreeList.alloc(numPositions);
    const indexFreeListEntry = this.indexFreeList.alloc(numIndices);
    const geometryBinding = new GeometryPositionIndexBinding(positionFreeListEntry, indexFreeListEntry, this.geometry);

    const slot = indexFreeListEntry;
    this.drawStarts[this.numDraws] = slot.start * this.geometry.index.array.BYTES_PER_ELEMENT;
    this.drawCounts[this.numDraws] = slot.count;
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
    const expectedStartValue = slot.start * this.geometry.index.array.BYTES_PER_ELEMENT;
    const freeIndex = this.drawStarts.indexOf(expectedStartValue);

    if (this.numDraws >= 2) {
      const lastIndex = this.numDraws - 1;

      // copy the last index to the freed slot
      if (this.boundingType === 'sphere') {
        this.drawStarts[freeIndex] = this.drawStarts[lastIndex];
        this.drawCounts[freeIndex] = this.drawCounts[lastIndex];
        this.boundingData[freeIndex * 4] = this.boundingData[lastIndex * 4];
        this.boundingData[freeIndex * 4 + 1] = this.boundingData[lastIndex * 4 + 1];
        this.boundingData[freeIndex * 4 + 2] = this.boundingData[lastIndex * 4 + 2];
        this.boundingData[freeIndex * 4 + 3] = this.boundingData[lastIndex * 4 + 3];
      } else if (this.boundingType === 'box') {
        this.drawStarts[freeIndex] = this.drawStarts[lastIndex];
        this.drawCounts[freeIndex] = this.drawCounts[lastIndex];
        this.boundingData[freeIndex * 6] = this.boundingData[lastIndex * 6];
        this.boundingData[freeIndex * 6 + 1] = this.boundingData[lastIndex * 6 + 1];
        this.boundingData[freeIndex * 6 + 2] = this.boundingData[lastIndex * 6 + 2];
        this.boundingData[freeIndex * 6 + 3] = this.boundingData[lastIndex * 6 + 3];
        this.boundingData[freeIndex * 6 + 4] = this.boundingData[lastIndex * 6 + 4];
        this.boundingData[freeIndex * 6 + 5] = this.boundingData[lastIndex * 6 + 5];
      }
    }

    this.numDraws--;

    this.positionFreeList.free(geometryBinding.positionFreeListEntry);
    this.indexFreeList.free(geometryBinding.indexFreeListEntry);
  }
  getDrawSpec(camera, drawStarts, drawCounts, ds) {
    drawStarts.length = 0;
    drawCounts.length = 0;
    ds.length = 0;

    if (this.boundingType) {
      const projScreenMatrix = localMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      localFrustum.setFromProjectionMatrix(projScreenMatrix);
    }

    const testBoundingFn = (() => {
      if (this.boundingType === 'sphere') {
        return (i) => {
          localSphere.center.fromArray(this.boundingData, i * 4);
          localSphere.radius = this.boundingData[i * 4 + 3];
          return localFrustum.intersectsSphere(localSphere) ? localSphere.center.distanceTo(camera.position) : false;
        };
      } else if (this.boundingType === 'box') {
        return (i) => {
          localBox.min.fromArray(this.boundingData, i * 6);
          localBox.max.fromArray(this.boundingData, i * 6 + 3);
          return localFrustum.intersectsBox(localBox);
        };
      } else {
        return (i) => true;
      }
    })();
    for (let i = 0; i < this.numDraws; i++) {
      let test = testBoundingFn(i);
      if (test) {
        ds.push({distance: test, index: i})
      }
    }
    ds.sort((a, b) => {
        return b.distance - a.distance;
    });
    for(let i = 0; i < ds.length; i++){
      drawStarts.push(this.drawStarts[ds[i].index]);
      drawCounts.push(this.drawCounts[ds[i].index]);
    }
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
    return this.freeListEntry.start * this.allocator.maxInstancesPerDrawCall * itemSize;
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
  updateTexture(name, pixelIndex, itemCount) { // XXX optimize this
    const texture = this.getTexture(name);
    // const textureIndex = this.getTextureIndex(name);
    texture.needsUpdate = true;
    return;

    const renderer = getRenderer();
    
    const _getIndexUv = (index, target) => {
      const x = index % texture.width;
      const y = Math.floor(index / texture.width);
      return target.set(x, y);
    };

    // render start slice
    const startUv = _getIndexUv(pixelIndex, localVector2D);
    if (startUv.x > 0) {
      localDataTexture.image.width = texture.image.width - startUv.x;
      localDataTexture.image.height = 1;
      localDataTexture.image.data = texture.image.data.subarray(
        pixelIndex,
        pixelIndex + startUv.x
      );
      renderer.copyTextureToTexture(startUv, localDataTexture, texture, 0);

      startUv.x = 0;
      startUv.y++;
    }

    const endUv = _getIndexUv(pixelIndex + pixelCount, localVector2D2);
    if (endUv.y > startUv.y) {
      // render end slice
      if (endUv.x > 0) {
        localDataTexture.image.width = endUv.x;
        localDataTexture.image.height = 1;
        localDataTexture.image.data = texture.image.data.subarray(
          endUv.y * texture.image.width,
          endUv.y * texture.image.width + endUv.x
        );
        renderer.copyTextureToTexture(endUv, localDataTexture, texture, 0);

        endUv.x = 0;
        endUv.y--;
      }

      // render middle slice
      if (endUv.y > startUv.y) {
        localDataTexture.image.width = texture.image.width;
        localDataTexture.image.height = endUv.y - startUv.y;
        localDataTexture.image.data = texture.image.data.subarray(
          startUv.y * texture.image.width,
          endUv.y * texture.image.width
        );
        renderer.copyTextureToTexture(startUv, localDataTexture, texture, 0);
      }
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
        } = spec;

        // compute the minimum size of a texture that can hold the data
        let neededItems4 = numGeometries * maxDrawCallsPerGeometry * maxInstancesPerDrawCall;
        if (itemSize > 4) {
          neededItems4 *= itemSize / 4;
        }
        const textureSizePx = Math.max(Math.pow(2, Math.ceil(Math.log2(Math.sqrt(neededItems4)))), 16);
        const itemSizeSnap = itemSize > 4 ? 4 : itemSize;

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
        // texture.needsUpdate = true;
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

    this.drawStarts[freeListEntry.start] = start * this.geometry.index.array.BYTES_PER_ELEMENT;
    this.drawCounts[freeListEntry.start] = count;
    this.drawInstanceCounts[freeListEntry.start] = 0;
    if (this.boundingType === 'sphere') {
      boundingObject.center.toArray(this.boundingData, freeListEntry.start * 4);
      this.boundingData[freeListEntry.start * 4 + 3] = boundingObject.radius;
    } else if (this.boundingType === 'box') {
      boundingObject.min.toArray(this.boundingData, freeListEntry.start * 6);
      boundingObject.max.toArray(this.boundingData, freeListEntry.start * 6 + 3);
    }
    
    return drawCall;
  }
  freeDrawCall(drawCall) {
    const {freeListEntry} = drawCall;

    this.drawStarts[freeListEntry.start] = 0;
    this.drawCounts[freeListEntry.start] = 0;
    this.drawInstanceCounts[freeListEntry.start] = 0;
    if (this.boundingType === 'sphere') {
      this.boundingData[freeListEntry.start * 4] = 0;
      this.boundingData[freeListEntry.start * 4 + 1] = 0;
      this.boundingData[freeListEntry.start * 4 + 2] = 0;
      this.boundingData[freeListEntry.start * 4 + 3] = 0;
    } else if (this.boundingType === 'box') {
      this.boundingData[freeListEntry.start * 6] = 0;
      this.boundingData[freeListEntry.start * 6 + 1] = 0;
      this.boundingData[freeListEntry.start * 6 + 2] = 0;
      this.boundingData[freeListEntry.start * 6 + 3] = 0;
      this.boundingData[freeListEntry.start * 6 + 4] = 0;
      this.boundingData[freeListEntry.start * 6 + 5] = 0;
    }

    this.freeList.free(freeListEntry);
  }
  getInstanceCount(drawCall) {
    return this.drawInstanceCounts[drawCall.freeListEntry.start];
  }
  setInstanceCount(drawCall, instanceCount) {
    this.drawInstanceCounts[drawCall.freeListEntry.start] = instanceCount;
  }
  incrementInstanceCount(drawCall) {
    this.drawInstanceCounts[drawCall.freeListEntry.start]++;
  }
  decrementInstanceCount(drawCall) {
    this.drawInstanceCounts[drawCall.freeListEntry.start]--;
  }
  getTexture(name) {
    return this.textures[name];
  }
  getDrawSpec(camera, multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts) {
    multiDrawStarts.length = this.drawStarts.length;
    multiDrawCounts.length = this.drawCounts.length;
    multiDrawInstanceCounts.length = this.drawInstanceCounts.length;

    if (this.boundingType) {
      const projScreenMatrix = localMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      localFrustum.setFromProjectionMatrix(projScreenMatrix);
    }
    const testBoundingFn = (() => {
      if (this.boundingType === 'sphere') {
        return (i) => {
          localSphere.center.fromArray(this.boundingData, i * 4);
          localSphere.radius = this.boundingData[i * 4 + 3];
          return localFrustum.intersectsSphere(localSphere);
        };
      } else if (this.boundingType === 'box') {
        return (i) => {
          localBox.min.fromArray(this.boundingData, i * 6);
          localBox.max.fromArray(this.boundingData, i * 6 + 3);
          return localFrustum.intersectsBox(localBox);
        };
      } else {
        return (i) => true;
      }
    })();
    const swapBoundingDataFn = () => {
      if (this.boundingType === 'sphere') {
        return _swapBoundingDataSphere;
      } else if (this.boundingType === 'box') {
        return _swapBoundingDataBox;
      } else {
        throw new Error('Invalid bounding type: ' + this.boundingType);
      }
    };

    for (let i = 0; i < this.drawStarts.length; i++) {
      if (testBoundingFn(i)) {
        multiDrawStarts[i] = this.drawStarts[i];
        multiDrawCounts[i] = this.drawCounts[i];
        
        if (this.instanceBoundingType) {
          const startOffset = i * this.maxInstancesPerDrawCall;
          
          const testInstanceBoundingFn = (() => {
            if (this.boundingType === 'sphere') {
              return (j) => {
                const sphereIndex = startOffset + j;
                localSphere.center.fromArray(this.instanceBoundingData, sphereIndex * 4);
                localSphere.radius = this.instanceBoundingData[sphereIndex * 4 + 3];
                return localFrustum.intersectsSphere(localSphere);
              };
            } else if (this.boundingType === 'box') {
              return (j) => {
                const boxIndex = startOffset + j;
                localBox.min.fromArray(this.boundingData, boxIndex * 6);
                localBox.max.fromArray(this.boundingData, boxIndex * 6 + 3);
                return localFrustum.intersectsBox(localBox);
              };
            } else {
              throw new Error('Invalid bounding type: ' + this.boundingType);
            }
          })();

          // arrange the instanced draw list :
          // - apply per-instanse frustum culling
          // - swapping the bounding data into place
          // - accumulate the real instance draw count
          const maxDrawableInstances = this.drawInstanceCounts[i];
          let instancesToDraw = 0;
          for (let j = 0; j < maxDrawableInstances; j++) {
            if (testInstanceBoundingFn(j)) {
              instancesToDraw++;
            } else {
              // swap this instance with the last instance to remove it
              for (const texture of this.texturesArray) {
                _swapTextureAttributes(texture, i, j, this.maxInstancesPerDrawCall);
              }
              swapBoundingDataFn(this.instanceBoundingData, i, j, this.maxInstancesPerDrawCall);
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
  }
	getDrawSpec(camera, drawStarts, drawCounts, ds) {
    this.allocator.getDrawSpec(camera, drawStarts, drawCounts, ds);
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