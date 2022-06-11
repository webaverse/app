import * as THREE from 'three';
import {ImmediateGLBufferAttribute} from './ImmediateGLBufferAttribute.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {getRenderer} from './renderer.js';

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localDataTexture = new THREE.DataTexture();

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
      // return null;
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
        // return null;
      }
    } else {
      throw new Error('alloc size must be > 0');
      // return null;
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

    this.positionFreeList = new FreeList(bufferSize * 3);
    this.indexFreeList = new FreeList(bufferSize);
  }
  alloc(numPositions, numIndices) {
    const positionFreeListEntry = this.positionFreeList.alloc(numPositions);
    const indexFreeListEntry = this.indexFreeList.alloc(numIndices);
    const geometryBinding = new GeometryPositionIndexBinding(positionFreeListEntry, indexFreeListEntry, this.geometry);
    return geometryBinding;
  }
  free(geometryBinding) {
    this.positionFreeList.free(geometryBinding.positionFreeListEntry);
    this.indexFreeList.free(geometryBinding.indexFreeListEntry);
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

export class InstancedGeometryAllocator {
  constructor(geometries, instanceTextureSpecs, {
    maxInstancesPerDrawCall,
    maxDrawCallsPerGeometry,
  }) {
    this.maxInstancesPerDrawCall = maxInstancesPerDrawCall;
    this.maxDrawCallsPerGeometry = maxDrawCallsPerGeometry;
    this.drawStarts = new Int32Array(geometries.length * maxDrawCallsPerGeometry);
    this.drawCounts = new Int32Array(geometries.length * maxDrawCallsPerGeometry);
    this.drawInstanceCounts = new Int32Array(geometries.length * maxDrawCallsPerGeometry);

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
      // this.drawCalls = [];
    }
  }
  allocDrawCall(geometryIndex) {
    const freeListEntry = this.freeList.alloc(1);
    const drawCall = new DrawCallBinding(geometryIndex, freeListEntry, this);
    // this.drawCalls.push(drawCall);

    const geometrySpec = this.geometryRegistry[geometryIndex];
    const {
      /* position: {
        start,
        count,
      }, */
      index: {
        start,
        count,
      },
    } = geometrySpec;

    this.drawStarts[freeListEntry.start] = start * this.geometry.index.array.BYTES_PER_ELEMENT;
    this.drawCounts[freeListEntry.start] = count;
    this.drawInstanceCounts[freeListEntry.start] = 0;
    
    return drawCall;
  }
  freeDrawCall(drawCall) {
    const {freeListEntry} = drawCall;
    this.freeList.free(freeListEntry);
    // this.drawCalls.splice(this.drawCalls.indexOf(drawCall), 1);
  
    this.drawStarts[freeListEntry.start] = 0;
    this.drawCounts[freeListEntry.start] = 0;
    this.drawInstanceCounts[freeListEntry.start] = 0;
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
  getDrawSpec(multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts) {
    multiDrawStarts.length = this.drawStarts.length;
    multiDrawCounts.length = this.drawCounts.length;
    multiDrawInstanceCounts.length = this.drawInstanceCounts.length;

    for (let i = 0; i < this.drawStarts.length; i++) {
      multiDrawStarts[i] = this.drawStarts[i];
      multiDrawCounts[i] = this.drawCounts[i];
      multiDrawInstanceCounts[i] = this.drawInstanceCounts[i];
    }

    /* for (const drawCall of this.drawCalls) {
      const {geometryIndex, instanceCount} = drawCall;
      const geometrySpec = this.geometryRegistry[geometryIndex];
      const {
        index: {
          start,
          count,
        },
      } = geometrySpec;
      
      multiDrawStarts.push(start);
      multiDrawCounts.push(count);
      multiDrawInstanceCounts.push(instanceCount);
    } */
  }
}

export class BatchedMesh extends THREE.InstancedMesh {
  constructor(geometry, material, allocator) {
    super(geometry, material);
    
    this.isBatchedMesh = true;
    this.allocator = allocator;
  }
	getDrawSpec(multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts) {
    this.allocator.getDrawSpec(multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts);
  }
}