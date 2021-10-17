import * as THREE from 'three';
// import {makePromise} from './util.js';
import {getRenderer} from './renderer.js';
import Module from './public/bin/geometry.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();

const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const physx = {};

physx.waitForLoad = Module.waitForLoad;

const physxWorker = (() => {
  class Allocator {
    constructor() {
      this.offsets = [];
    }

    alloc(constructor, size) {
      if (size > 0) {
        const offset = moduleInstance._malloc(size * constructor.BYTES_PER_ELEMENT);
        const b = new constructor(moduleInstance.HEAP8.buffer, moduleInstance.HEAP8.byteOffset + offset, size);
        b.offset = offset;
        this.offsets.push(offset);
        return b;
      } else {
        return new constructor(moduleInstance.HEAP8.buffer, 0, 0);
      }
    }

    freeAll() {
      for (let i = 0; i < this.offsets.length; i++) {
        moduleInstance._doFree(this.offsets[i]);
      }
      this.offsets.length = 0;
    }
  }

  const maxNumMessageArgs = 32;
  const messageSize =
    Int32Array.BYTES_PER_ELEMENT + // id
    Int32Array.BYTES_PER_ELEMENT + // method
    Int32Array.BYTES_PER_ELEMENT + // priority
    maxNumMessageArgs*Uint32Array.BYTES_PER_ELEMENT; // args
  const maxNumMessages = 1024;
  const callStackSize = maxNumMessages * messageSize;
  class CallStackMessage {
    constructor(ptr) {
      this.dataView = new DataView(moduleInstance.HEAP8.buffer, ptr, messageSize);
      this.offset = 3*Uint32Array.BYTES_PER_ELEMENT;
    }
    getId() {
      return this.dataView.getInt32(0, true);
    }
    getMethod() {
      return this.dataView.getInt32(Uint32Array.BYTES_PER_ELEMENT, true);
    }
    getPriority() {
      return this.dataView.getInt32(2*Uint32Array.BYTES_PER_ELEMENT, true);
    }
    setId(v) {
      this.dataView.setInt32(0, v, true);
    }
    setMethod(v) {
      this.dataView.setInt32(Uint32Array.BYTES_PER_ELEMENT, v, true);
    }
    setPriority(v) {
      this.dataView.setInt32(2*Uint32Array.BYTES_PER_ELEMENT, v, true);
    }
    pullU8Array(length) {
      const {offset} = this;
      this.offset += length;
      return new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);;
    }
    pullF32Array(length) {
      const {offset} = this;
      this.offset += length*Float32Array.BYTES_PER_ELEMENT;
      return new Float32Array(this.dataView.buffer, this.dataView.byteOffset + offset, length);
    }
    pullI32() {
      const {offset} = this;
      this.offset += Int32Array.BYTES_PER_ELEMENT;
      return this.dataView.getInt32(offset, true);;
    }
    pullU32() {
      const {offset} = this;
      this.offset += Uint32Array.BYTES_PER_ELEMENT;
      return this.dataView.getUint32(offset, true);;
    }
    pullF32() {
      const {offset} = this;
      this.offset += Float32Array.BYTES_PER_ELEMENT;
      return this.dataView.getFloat32(offset, true);
    }
    pushU8Array(uint8Array) {
      new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, uint8Array.length).set(uint8Array);
      this.offset += uint8Array.byteLength;
    }
    pushF32Array(float32Array) {
      new Float32Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, float32Array.length).set(float32Array);
      this.offset += float32Array.byteLength;
    }
    pushI32(v) {
      this.dataView.setInt32(this.offset, v, true);
      this.offset += Int32Array.BYTES_PER_ELEMENT;
    }
    pushU32(v) {
      this.dataView.setUint32(this.offset, v, true);
      this.offset += Uint32Array.BYTES_PER_ELEMENT;
    }
    pushF32(v) {
      this.dataView.setFloat32(this.offset, v, true);
      this.offset += Float32Array.BYTES_PER_ELEMENT;
    }
    /* pullU8Array(length) {
      if (this.offset + length <= messageSize) {
        const result = new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, length);
        this.offset += length;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullF32Array(length) {
      if (this.offset + length*Float32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = new Float32Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, length);
        this.offset += length*Float32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullI32() {
      if (this.offset + Int32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = this.dataView.getInt32(this.offset, true);
        this.offset += Int32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullU32() {
      if (this.offset + Uint32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = this.dataView.getUint32(this.offset, true);
        this.offset += Uint32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pullF32() {
      if (this.offset + Float32Array.BYTES_PER_ELEMENT <= messageSize) {
        const result = this.dataView.getFloat32(this.offset, true);
        this.offset += Float32Array.BYTES_PER_ELEMENT;
        return result;
      } else {
        throw new Error('message overflow');
      }
    }
    pushU8Array(uint8Array) {
      if (this.offset + uint8Array.byteLength <= messageSize) {
        new Uint8Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, uint8Array.length).set(uint8Array);
        this.offset += uint8Array.byteLength;
      } else {
        throw new Error('message overflow');
      }
    }
    pushF32Array(float32Array) {
      if (this.offset + float32Array.byteLength <= messageSize) {
        new Float32Array(this.dataView.buffer, this.dataView.byteOffset + this.offset, float32Array.length).set(float32Array);
        this.offset += float32Array.byteLength;
      } else {
        throw new Error('message overflow');
      }
    }
    pushI32(v) {
      if (this.offset + Int32Array.BYTES_PER_ELEMENT <= messageSize) {
        this.dataView.setInt32(this.offset, v, true);
        this.offset += Int32Array.BYTES_PER_ELEMENT;
      } else {
        throw new Error('message overflow');
      }
    }
    pushU32(v) {
      if (this.offset + Uint32Array.BYTES_PER_ELEMENT <= messageSize) {
        this.dataView.setUint32(this.offset, v, true);
        this.offset += Uint32Array.BYTES_PER_ELEMENT;
      } else {
        throw new Error('message overflow');
      }
    }
    pushF32(v) {
      if (this.offset + Float32Array.BYTES_PER_ELEMENT <= messageSize) {
        this.dataView.setFloat32(this.offset, v, true);
        this.offset += Float32Array.BYTES_PER_ELEMENT;
      } else {
        throw new Error('message overflow');
      }
    } */
  }
  class CallStack {
    constructor() {
      this.ptr = moduleInstance._malloc(callStackSize * 2 + Uint32Array.BYTES_PER_ELEMENT);
      this.dataView = new DataView(moduleInstance.HEAP8.buffer, this.ptr, callStackSize);

      this.outPtr = this.ptr + callStackSize;
      this.outDataView = new DataView(moduleInstance.HEAP8.buffer, this.ptr + callStackSize, callStackSize);

      this.outNumEntriesPtr = this.ptr + callStackSize * 2;
      this.outNumEntriesU32 = new Uint32Array(moduleInstance.HEAP8.buffer, this.outNumEntriesPtr, 1);

      this.numEntries = 0;
      this.nextCbId = 0;
    }

    allocRequest(method, prio, startCb, endCb) {
      const index = this.numEntries++;
      const offset = index * messageSize;
      const startMessage = new CallStackMessage(this.ptr + offset);

      const id = ++this.nextCbId;
      startMessage.setId(id);
      startMessage.setMethod(method);
      startMessage.setPriority(+prio);
      
      startCb(startMessage);
      cbIndex.set(id, endCb);
    }

    reset() {
      this.numEntries = 0;
    }
  }
  class ScratchStack {
    constructor() {
      const size = 1024*1024;
      this.ptr = moduleInstance._malloc(size);

      this.u8 = new Uint8Array(moduleInstance.HEAP8.buffer, this.ptr, size);
      this.u32 = new Uint32Array(moduleInstance.HEAP8.buffer, this.ptr, size/4);
      this.i32 = new Int32Array(moduleInstance.HEAP8.buffer, this.ptr, size/4);
      this.f32 = new Float32Array(moduleInstance.HEAP8.buffer, this.ptr, size/4);
    }
  }
  
  // const modulePromise = makePromise();
  /* const INITIAL_INITIAL_MEMORY = 52428800;
  const WASM_PAGE_SIZE = 65536;
  const wasmMemory = new WebAssembly.Memory({
    "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
    "maximum": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
    "shared": true,
  }); */
  let moduleInstance = null;
  let scratchStack;
  
  (async () => {
    await Module.waitForLoad();

    moduleInstance = Module;
    scratchStack = new ScratchStack();
    physx.physics = physxWorker.makePhysics();
  })();

  let methodIndex = 0;
  const cbIndex = new Map();
  const w = {};
  w.alloc = (constructor, count) => {
    if (count > 0) {
      const size = constructor.BYTES_PER_ELEMENT * count;
      const ptr = moduleInstance._doMalloc(size);
      return new constructor(moduleInstance.HEAP8.buffer, ptr, count);
    } else {
      return new constructor(moduleInstance.HEAP8.buffer, 0, 0);
    }
  };
  w.free = ptr => {
    moduleInstance._doFree(ptr);
  };
  w.makeArenaAllocator = size => {
    const ptr = moduleInstance._makeArenaAllocator(size);
    const offset = moduleInstance.HEAP32[ptr / Uint32Array.BYTES_PER_ELEMENT];
    return {
      ptr,
      getAs(constructor) {
        return new constructor(moduleInstance.HEAP8.buffer, offset, size / constructor.BYTES_PER_ELEMENT);
      },
    };
  };
  w.makeGeometrySet = () => moduleInstance._makeGeometrySet();
  w.requestLoadBake = async (geometrySet, url) => {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const dataOffset = moduleInstance._malloc(uint8Array.length);
    const data = moduleInstance.HEAPU8.subarray(dataOffset, dataOffset + uint8Array.length);
    data.set(uint8Array);

    moduleInstance._loadBake(
      geometrySet,
      data.byteOffset,
      data.byteLength
    );

    w.free(data.byteOffset);
  };
  w.getGeometry = (geometrySet, name) => {
    const srcNameUint8Array = textEncoder.encode(name);
    const dstNameUint8Array = w.alloc(Uint8Array, srcNameUint8Array.byteLength);
    dstNameUint8Array.set(srcNameUint8Array);

    scratchStack.u32[0] = dstNameUint8Array.byteOffset,

    moduleInstance._getGeometry(
      geometrySet,
      dstNameUint8Array.byteOffset,
      dstNameUint8Array.byteLength,
      scratchStack.u32.byteOffset + 0*Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 1*Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 2*Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 3*Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 4*Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 5*Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + 6*Uint32Array.BYTES_PER_ELEMENT
    );

    const positionsOffset = scratchStack.u32[0];
    const uvsOffset = scratchStack.u32[1];
    const indicesOffset = scratchStack.u32[2];
    const numPositions = scratchStack.u32[3];
    const numUvs = scratchStack.u32[4];
    const numIndices = scratchStack.u32[5];
    const aabbOffset = scratchStack.u32[6];
 
    const boundingBox = new THREE.Box3(
      new THREE.Vector3().fromArray(moduleInstance.HEAPF32.subarray(aabbOffset/Float32Array.BYTES_PER_ELEMENT, aabbOffset/Float32Array.BYTES_PER_ELEMENT + 3)),
      new THREE.Vector3().fromArray(moduleInstance.HEAPF32.subarray(aabbOffset/Float32Array.BYTES_PER_ELEMENT + 3, aabbOffset/Float32Array.BYTES_PER_ELEMENT + 6)),
    );

    const positions = new Float32Array(moduleInstance.HEAP8.buffer, positionsOffset, numPositions);
    const uvs = new Float32Array(moduleInstance.HEAP8.buffer, uvsOffset, numUvs);
    const indices = new Uint32Array(moduleInstance.HEAP8.buffer, indicesOffset, numIndices);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const renderer = getRenderer();
    renderer.geometries.update(geometry);

    geometry.boundingBox = boundingBox;
    
    w.free(dstNameUint8Array.byteOffset);
    
    return geometry;
  };
  w.requestGetGeometries = (geometrySet, geometryRequests) => new Promise((accept, reject) => {
    let geometryRequestsOffset;
    callStack.allocRequest(METHODS.getGeometries, true, m => {
      m.pushU32(geometrySet);
      
      const geometryRequestSize = MAX_NAME_LENGTH + 10*Float32Array.BYTES_PER_ELEMENT;
      geometryRequestsOffset = moduleInstance._malloc(geometryRequestSize * geometryRequests.length);
      
      for (let i = 0; i < geometryRequests.length; i++) {
        const geometryRequest = geometryRequests[i];
        const {name, position, quaternion, scale} = geometryRequest;
        const geometryRequestOffset = geometryRequestsOffset + i*geometryRequestSize;

        const srcNameUint8Array = textEncoder.encode(name);
        const dstNameUint8Array = moduleInstance.HEAPU8.subarray(geometryRequestOffset, geometryRequestOffset + MAX_NAME_LENGTH);
        dstNameUint8Array.set(srcNameUint8Array);
        dstNameUint8Array[srcNameUint8Array.length] = 0;

        position.toArray(moduleInstance.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT);
        quaternion.toArray(moduleInstance.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT + 3);
        scale.toArray(moduleInstance.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT + 7);
      }
      
      m.pushU32(geometryRequestsOffset);
      m.pushU32(geometryRequests.length);
    }, m => {
      const positionsOffset = m.pullU32();
      const uvsOffset = m.pullU32();
      // const colorsOffset = m.pullU32();
      const indicesOffset = m.pullU32();
      const numPositions = m.pullU32();
      const numUvs = m.pullU32();
      // const numColors = m.pullU32();
      const numIndices = m.pullU32();

      const positions = new Float32Array(moduleInstance.HEAP8.buffer, positionsOffset, numPositions);
      const uvs = new Float32Array(moduleInstance.HEAP8.buffer, uvsOffset, numUvs);
      // const colors = new Float32Array(moduleInstance.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(moduleInstance.HEAP8.buffer, indicesOffset, numIndices);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      // geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3, true));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const renderer = getRenderer();
      renderer.geometries.update(geometry);

      w.free(positionsOffset);
      w.free(uvsOffset);
      // w.free(colorsOffset);
      w.free(indicesOffset);

      accept(geometry);
    });
  });
  w.requestGetGeometryKeys = geometrySet => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.getGeometryKeys, true, m => {
      m.pushU32(geometrySet);
    }, m => {
      const namesOffset = m.pullU32();
      const numNames = m.pullU32();
      
      const result = [];
      for (let i = 0; i < numNames; i++) {
        const nameOffset = namesOffset + i*MAX_NAME_LENGTH;
        const nameLength = (() => {
          let j;
          for (j = 0; j < MAX_NAME_LENGTH; j++) {
            if (moduleInstance.HEAPU8[nameOffset+j] === 0) {
              break;
            }
          }
          return j;
        })();
        const name = textDecoder.decode(moduleInstance.HEAPU8.slice(nameOffset, nameOffset + nameLength));
        result.push(name);
      }

      w.free(namesOffset);

      accept(result);
    });
  });
  w.requestAnimalGeometry = hash => new Promise((accept, reject) => {
    callStack.allocRequest(METHODS.getAnimalGeometry, false, m => {
      m.pushU32(geometrySet);
      m.pushU32(hash);
    }, m => {
      const positionsOffset = m.pullU32();
      const colorsOffset = m.pullU32();
      const indicesOffset = m.pullU32();
      const headsOffset = m.pullU32();
      const legsOffset = m.pullU32();
      const numPositions = m.pullU32();
      const numColors = m.pullU32();
      const numIndices = m.pullU32();
      const numHeads = m.pullU32();
      const numLegs = m.pullU32();
      const headPivot = m.pullF32Array(3);
      const aabb = m.pullF32Array(6);

      const positions = new Float32Array(moduleInstance.HEAP8.buffer, positionsOffset, numPositions);
      const colors = new Uint8Array(moduleInstance.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(moduleInstance.HEAP8.buffer, indicesOffset, numIndices);
      const heads = new Float32Array(moduleInstance.HEAP8.buffer, headsOffset, numHeads);
      const legs = new Float32Array(moduleInstance.HEAP8.buffer, legsOffset, numLegs);

      accept({
        positions,
        colors,
        indices,
        heads,
        legs,
        headPivot,
        aabb,
      });
    });
  });
  w.getHeight = (hash, x, y, z, baseHeight) => {
    return moduleInstance._doGetHeight(
      hash,
      x,
      y,
      z,
      baseHeight
    );
  };
  w.makeTracker = function() {
    return moduleInstance._makeTracker.apply(moduleInstance, arguments);
  };
  w.makePhysics = () => moduleInstance._makePhysics();
  w.simulatePhysics = (physics, updates, elapsedTime) => {
    const maxNumUpdates = 10;
    let index = 0;
    const ids = scratchStack.u32.subarray(index, index + maxNumUpdates);
    index += maxNumUpdates;
    const positions = scratchStack.f32.subarray(index, index + maxNumUpdates*3);
    index += maxNumUpdates*3;
    const quaternions = scratchStack.f32.subarray(index, index + maxNumUpdates*4);
    index += maxNumUpdates*4;
    const scales = scratchStack.f32.subarray(index, index + maxNumUpdates*3);
    index += maxNumUpdates*7;

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      ids[i] = update.id;
      update.position.toArray(positions, i*3);
      update.quaternion.toArray(quaternions, i*4);
      update.scale.toArray(scales, i*3);
    }

    const numNewUpdates = moduleInstance._simulatePhysics(
      physics,
      ids.byteOffset,
      positions.byteOffset,
      quaternions.byteOffset,
      scales.byteOffset,
      updates.length,
      elapsedTime
    );
    
    const newUpdates = Array(numNewUpdates);
    for (let i = 0; i < numNewUpdates; i++) {
      newUpdates[i] = {
        id: ids[i],
        position: new THREE.Vector3().fromArray(positions, i*3),
        quaternion: new THREE.Quaternion().fromArray(quaternions, i*4),
        scale: new THREE.Vector3().fromArray(scales, i*3),
      };
    }
    
    return newUpdates;
  };
  w.raycastPhysics = (physics, p, q) => {
    if (physics) {
      p.toArray(scratchStack.f32, 0);
      localVector.set(0, 0, -1)
        .applyQuaternion(q)
        .toArray(scratchStack.f32, 3);
      // physx.currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      localVector.set(0, 0, 0).toArray(scratchStack.f32, 6);
      localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 9);

      const originOffset = scratchStack.f32.byteOffset;
      const directionOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
      const meshPositionOffset = scratchStack.f32.byteOffset + 6 * Float32Array.BYTES_PER_ELEMENT;
      const meshQuaternionOffset = scratchStack.f32.byteOffset + 9 * Float32Array.BYTES_PER_ELEMENT;

      const hitOffset = scratchStack.f32.byteOffset + 13 * Float32Array.BYTES_PER_ELEMENT;
      const pointOffset = scratchStack.f32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT;
      const normalOffset = scratchStack.f32.byteOffset + 17 * Float32Array.BYTES_PER_ELEMENT;
      const distanceOffset = scratchStack.f32.byteOffset + 20 * Float32Array.BYTES_PER_ELEMENT;
      const objectIdOffset = scratchStack.u32.byteOffset + 21 * Float32Array.BYTES_PER_ELEMENT;
      const faceIndexOffset = scratchStack.u32.byteOffset + 22 * Float32Array.BYTES_PER_ELEMENT;
      const positionOffset = scratchStack.u32.byteOffset + 23 * Float32Array.BYTES_PER_ELEMENT;
      const quaternionOffset = scratchStack.u32.byteOffset + 26 * Float32Array.BYTES_PER_ELEMENT;

      /* const raycastArgs = {
        origin: allocator.alloc(Float32Array, 3),
        direction: allocator.alloc(Float32Array, 3),
        meshPosition: allocator.alloc(Float32Array, 3),
        meshQuaternion: allocator.alloc(Float32Array, 4),
        hit: allocator.alloc(Uint32Array, 1),
        point: allocator.alloc(Float32Array, 3),
        normal: allocator.alloc(Float32Array, 3),
        distance: allocator.alloc(Float32Array, 1),
        meshId: allocator.alloc(Uint32Array, 1),
        faceIndex: allocator.alloc(Uint32Array, 1),
      }; */

      moduleInstance._raycastPhysics(
        physics,
        originOffset,
        directionOffset,
        meshPositionOffset,
        meshQuaternionOffset,
        hitOffset,
        pointOffset,
        normalOffset,
        distanceOffset,
        objectIdOffset,
        faceIndexOffset,
        positionOffset,
        quaternionOffset,
      );
      const objectId = scratchStack.u32[21];
      const faceIndex = scratchStack.u32[22];
      const objectPosition = scratchStack.f32.slice(23, 26);
      const objectQuaternion = scratchStack.f32.slice(26, 30);

      return scratchStack.u32[13] ? {
        point: scratchStack.f32.slice(14, 17),
        normal: scratchStack.f32.slice(17, 20),
        distance: scratchStack.f32[20],
        meshId: scratchStack.u32[21],
        objectId,
        faceIndex,
        objectPosition,
        objectQuaternion,
      } : null;
    }
  };
  w.collidePhysics = (physics, radius, halfHeight, p, q, maxIter) => {
    p.toArray(scratchStack.f32, 0);
    localQuaternion.copy(q)
      .premultiply(capsuleUpQuaternion)
      .toArray(scratchStack.f32, 3);
    // physx.currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    localVector.set(0, 0, 0).toArray(scratchStack.f32, 7);
    localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 10);

    const positionOffset = scratchStack.f32.byteOffset;
    const quaternionOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
    const meshPositionOffset = scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT;
    const meshQuaternionOffset = scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT;

    const hitOffset = scratchStack.f32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT;
    const directionOffset = scratchStack.f32.byteOffset + 15 * Float32Array.BYTES_PER_ELEMENT;
    const groundedOffset = scratchStack.f32.byteOffset + 18 * Float32Array.BYTES_PER_ELEMENT;
    const idOffset = scratchStack.f32.byteOffset + 19 * Float32Array.BYTES_PER_ELEMENT;

    /* const collideArgs = {
      position: allocator.alloc(Float32Array, 3),
      quaternion: allocator.alloc(Float32Array, 4),
      meshPosition: allocator.alloc(Float32Array, 3),
      meshQuaternion: allocator.alloc(Float32Array, 4),
      hit: allocator.alloc(Uint32Array, 1),
      direction: allocator.alloc(Float32Array, 3),
      grounded: allocator.alloc(Uint32Array, 1),
    }; */
    
    /* console.log('collide physics', [physics,
      radius,
      halfHeight,
      positionOffset,
      quaternionOffset,
      meshPositionOffset,
      meshQuaternionOffset,
      maxIter,
      hitOffset,
      directionOffset,
      groundedOffset]); */

    moduleInstance._collidePhysics(
      physics,
      radius,
      halfHeight,
      positionOffset,
      quaternionOffset,
      meshPositionOffset,
      meshQuaternionOffset,
      maxIter,
      hitOffset,
      directionOffset,
      groundedOffset,
      idOffset,
    );

    return scratchStack.u32[14] ? {
      direction: scratchStack.f32.slice(15, 18),
      grounded: !!scratchStack.u32[18],
      objectId: scratchStack.u32[19],
    } : null;
  };

  w.addGeometryPhysics = (physics, mesh, id) => {
    const {geometry} = mesh;

    const allocator = new Allocator();
    const positions = allocator.alloc(Float32Array, geometry.attributes.position.count * 3);
    positions.set(geometry.attributes.position.array);
    const indices = geometry.index ? allocator.alloc(Uint32Array, geometry.index.count) : null;
    indices && indices.set(geometry.index.array);
    moduleInstance._cookGeometryPhysics(
      physics,
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT*2,
    );
    allocator.freeAll();

    const dataPtr = scratchStack.u32[0];
    const dataLength = scratchStack.u32[1];
    const streamPtr = scratchStack.u32[2];

    const positionBuffer = scratchStack.f32.subarray(3, 6);
    mesh.getWorldPosition(localVector).toArray(positionBuffer);
    const quaternionBuffer = scratchStack.f32.subarray(6, 10);
    mesh.getWorldQuaternion(localQuaternion).toArray(quaternionBuffer);
    const scaleBuffer = scratchStack.f32.subarray(10, 13);
    mesh.getWorldScale(localVector2).toArray(scaleBuffer);

    moduleInstance._addGeometryPhysics(
      physics,
      dataPtr,
      dataLength,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      streamPtr,
    );
  };
  w.cookGeometryPhysics = (physics, mesh) => {
    mesh.updateMatrixWorld();
    const {geometry} = mesh;

    const allocator = new Allocator();
    const positions = allocator.alloc(Float32Array, geometry.attributes.position.count * 3);
    positions.set(geometry.attributes.position.array);
    const indices = geometry.index ? allocator.alloc(Uint32Array, geometry.index.count) : null;
    indices && indices.set(geometry.index.array);
    moduleInstance._cookGeometryPhysics(
      physics,
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT*2,
    );

    const dataPtr = scratchStack.u32[0];
    const dataLength = scratchStack.u32[1];
    const streamPtr = scratchStack.u32[2]; // XXX delete if it will not be deleted

    const result = new Uint8Array(dataLength);
    result.set(new Uint8Array(moduleInstance.HEAP8.buffer, dataPtr, dataLength));
    allocator.freeAll();
    return result;
  };
  w.addCookedGeometryPhysics = (physics, buffer, position, quaternion, scale, id) => {
    const allocator = new Allocator();
    const buffer2 = allocator.alloc(Uint8Array, buffer.length);
    buffer2.set(buffer);

    const positionBuffer = scratchStack.f32.subarray(0, 3);
    position.toArray(positionBuffer);
    const quaternionBuffer = scratchStack.f32.subarray(3, 7);
    quaternion.toArray(quaternionBuffer);
    const scaleBuffer = scratchStack.f32.subarray(7, 10);
    scale.toArray(scaleBuffer);

    moduleInstance._addGeometryPhysics(
      physics,
      buffer2.byteOffset,
      buffer2.byteLength,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      0,
    );
    allocator.freeAll();
  };

  w.addConvexGeometryPhysics = (physics, mesh, id) => {
    mesh.updateMatrixWorld();
    const {geometry} = mesh;

    const allocator = new Allocator();
    const positions = allocator.alloc(Float32Array, geometry.attributes.position.count * 3);
    positions.set(geometry.attributes.position.array);
    const indices = geometry.index ? allocator.alloc(Uint32Array, geometry.index.count) : null;
    indices && indices.set(geometry.index.array);
    moduleInstance._cookConvexGeometryPhysics(
      physics,
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT*2,
    );
    allocator.freeAll();

    const dataPtr = scratchStack.u32[0];
    const dataLength = scratchStack.u32[1];
    const streamPtr = scratchStack.u32[2];

    const positionBuffer = scratchStack.f32.subarray(3, 6);
    mesh.getWorldPosition(localVector).toArray(positionBuffer);
    const quaternionBuffer = scratchStack.f32.subarray(6, 10);
    mesh.getWorldQuaternion(localQuaternion).toArray(quaternionBuffer);
    const scaleBuffer = scratchStack.f32.subarray(10, 13);
    mesh.getWorldScale(localVector2).toArray(scaleBuffer);

    moduleInstance._addConvexGeometryPhysics(
      physics,
      dataPtr,
      dataLength,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      streamPtr,
    );
  };  
  w.cookConvexGeometryPhysics = (physics, mesh) => {
    mesh.updateMatrixWorld();
    const {geometry} = mesh;

    const allocator = new Allocator();
    const positions = allocator.alloc(Float32Array, geometry.attributes.position.count * 3);
    positions.set(geometry.attributes.position.array);
    const indices = geometry.index ? allocator.alloc(Uint32Array, geometry.index.count) : null;
    indices && indices.set(geometry.index.array);
    moduleInstance._cookConvexGeometryPhysics(
      physics,
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT*2,
    );

    const dataPtr = scratchStack.u32[0];
    const dataLength = scratchStack.u32[1];
    const streamPtr = scratchStack.u32[2];
    
    const result = new Uint8Array(dataLength);
    result.set(new Uint8Array(moduleInstance.HEAP8.buffer, dataPtr, dataLength));
    allocator.freeAll();
    return result;
  };
  w.addCookedConvexGeometryPhysics = (physics, buffer, position, quaternion, scale, id) => {
    const allocator = new Allocator();
    const buffer2 = allocator.alloc(Uint8Array, buffer.length);
    buffer2.set(buffer);

    const positionBuffer = scratchStack.f32.subarray(0, 3);
    position.toArray(positionBuffer);
    const quaternionBuffer = scratchStack.f32.subarray(3, 7);
    quaternion.toArray(quaternionBuffer);
    const scaleBuffer = scratchStack.f32.subarray(7, 10);
    scale.toArray(scaleBuffer);

    moduleInstance._addConvexGeometryPhysics(
      physics,
      buffer2.byteOffset,
      buffer2.byteLength,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      0,
    );
    allocator.freeAll();
  };

  w.getGeometryPhysics = (physics, id) => {
    const allocator = new Allocator();
    const positionsBuffer = allocator.alloc(Float32Array, 1024 * 1024);
    const numPositions = allocator.alloc(Uint32Array, 1);
    const indicesBuffer = allocator.alloc(Uint32Array, 1024 * 1024);
    const numIndices = allocator.alloc(Uint32Array, 1);

    const ok = moduleInstance._getGeometryPhysics(
      physics,
      id,
      positionsBuffer.byteOffset,
      numPositions.byteOffset,
      indicesBuffer.byteOffset,
      numIndices.byteOffset,
    );
    /* const objectId = scratchStack.u32[21];
    const faceIndex = scratchStack.u32[22];
    const objectPosition = scratchStack.f32.slice(23, 26);
    const objectQuaternion = scratchStack.f32.slice(26, 30); */

    if (ok) {
      const positions = positionsBuffer.slice(0, numPositions[0]);
      const indices = indicesBuffer.slice(0, numIndices[0]);

      allocator.freeAll();

      return {
        positions,
        indices,
      };
    } else {
      allocator.freeAll();
      return null;
    }
  };

  w.disableGeometryPhysics = (physics, id) => {
    moduleInstance._disableGeometryPhysics(physics, id);
  };
  w.enableGeometryPhysics = (physics, id) => {
    moduleInstance._enableGeometryPhysics(physics, id);
  };
  w.disableGeometryQueriesPhysics = (physics, id) => {
    moduleInstance._disableGeometryQueriesPhysics(physics, id);
  };
  w.enableGeometryQueriesPhysics = (physics, id) => {
    moduleInstance._enableGeometryQueriesPhysics(physics, id);
  };
  w.removeGeometryPhysics = (physics, id) => {
    moduleInstance._removeGeometryPhysics(physics, id);
  };

  /* w.earcut = (tracker, ps, holes, holeCounts, points, z, zs, objectId, position, quaternion) => {
    const inPs = w.alloc(Float32Array, ps.length);
    inPs.set(ps);
    const inHoles = w.alloc(Float32Array, holes.length);
    inHoles.set(holes);
    const inHoleCounts = w.alloc(Uint32Array, holeCounts.length);
    inHoleCounts.set(holeCounts);
    const inPoints = w.alloc(Float32Array, points.length);
    inPoints.set(points);
    const inZs = w.alloc(Float32Array, zs.length);
    inZs.set(zs);
    position.toArray(scratchStack.f32, 0);
    const positionOffset = scratchStack.f32.byteOffset;
    quaternion.toArray(scratchStack.f32, 3);
    const quaternionOffset = scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT;
    const resultOffset = moduleInstance._earcut(tracker, inPs.byteOffset, inPs.length / 2, inHoles.byteOffset, inHoleCounts.byteOffset, inHoleCounts.length, inPoints.byteOffset, inPoints.length, z, inZs.byteOffset, objectId, positionOffset, quaternionOffset);

    const outPositionsOffset = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT];
    const outNumPositions = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 1];
    const outUvsOffset = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 2];
    const outNumUvs = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 3];
    const outIndicesOffset = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 4];
    const outNumIndices = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 5];
    const trianglePhysicsGeometry = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 6];
    const convexPhysicsGeometry = moduleInstance.HEAPU32[resultOffset / Uint32Array.BYTES_PER_ELEMENT + 7];

    const positions = moduleInstance.HEAPF32.subarray(outPositionsOffset / Float32Array.BYTES_PER_ELEMENT, outPositionsOffset / Float32Array.BYTES_PER_ELEMENT + outNumPositions);
    const uvs = moduleInstance.HEAPF32.subarray(outUvsOffset / Float32Array.BYTES_PER_ELEMENT, outUvsOffset / Float32Array.BYTES_PER_ELEMENT + outNumUvs);
    const indices = moduleInstance.HEAPU32.subarray(outIndicesOffset / Uint32Array.BYTES_PER_ELEMENT, outIndicesOffset / Uint32Array.BYTES_PER_ELEMENT + outNumIndices);

    w.free(inPs.byteOffset);
    w.free(inHoles.byteOffset);
    w.free(inHoleCounts.byteOffset);
    w.free(inPoints.byteOffset);
    w.free(inZs.byteOffset);

    return {
      resultOffset,

      positions,
      uvs,
      indices,
      trianglePhysicsGeometry,
      convexPhysicsGeometry,

      destroy() {
        moduleInstance._deleteEarcutResult(tracker, resultOffset);
      },
    };
  }; */
  w.addBoxGeometryPhysics = (physics, position, quaternion, size, id, dynamic) => {
    const allocator = new Allocator();
    const p = allocator.alloc(Float32Array, 3);
    const q = allocator.alloc(Float32Array, 4);
    const s = allocator.alloc(Float32Array, 3);
    
    position.toArray(p);
    quaternion.toArray(q);
    size.toArray(s);
    
    moduleInstance._addBoxGeometryPhysics(
      physics,
      p.byteOffset,
      q.byteOffset,
      s.byteOffset,
      id,
      +dynamic,
    );
    allocator.freeAll();
  };
  return w;
})();
physx.physxWorker = physxWorker;

const _updateGeometry = () => {
  physx.crosshairMesh.update();
  
  physxWorker.update();
};
physx.update = _updateGeometry;

const _initModule = () => {
  if (Module.calledRun) {
    Module.onRuntimeInitialized();
    Module.postRun();
  }
};
_initModule();

export default physx;