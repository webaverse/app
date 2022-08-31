/*
physx wasm integration.
*/

import * as THREE from 'three';
// import {makePromise} from './util.js';
// import { getRenderer } from './renderer.js'
import Module from './public/bin/geometry.js';
import {Allocator, ScratchStack} from './geometry-util.js';

const localVector = new THREE.Vector3()
const localVector2 = new THREE.Vector3()
const localQuaternion = new THREE.Quaternion()

const capsuleUpQuaternion = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 0, 1),
  Math.PI / 2
)
// const textEncoder = new TextEncoder();
// const textDecoder = new TextDecoder();

const physx = {};

let loadPromise = null;
let scratchStack = null;
physx.loaded = false;
physx.waitForLoad =  () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      await Module.waitForLoad();

      Module._initialize();

      const scratchStackSize = 1024 * 1024;
      scratchStack = new ScratchStack(Module, scratchStackSize);

      physx.loaded = true;

      // console.log('module called run', Module.calledRun);
      /* if (Module.calledRun) {
        // Module.onRuntimeInitialized()
        Module.postRun()
      } */
    })();
  }
  return loadPromise;
};

const physxWorker = (() => {
  /* const maxNumMessageArgs = 32
  const messageSize =
    Int32Array.BYTES_PER_ELEMENT + // id
    Int32Array.BYTES_PER_ELEMENT + // method
    Int32Array.BYTES_PER_ELEMENT + // priority
    maxNumMessageArgs * Uint32Array.BYTES_PER_ELEMENT // args
  const maxNumMessages = 1024
  const callStackSize = maxNumMessages * messageSize */
  /* class CallStackMessage {
    constructor(ptr) {
      this.dataView = new DataView(
        Module.HEAP8.buffer,
        ptr,
        messageSize
      )
      this.offset = 3 * Uint32Array.BYTES_PER_ELEMENT
    }
    getId() {
      return this.dataView.getInt32(0, true)
    }
    getMethod() {
      return this.dataView.getInt32(Uint32Array.BYTES_PER_ELEMENT, true)
    }
    getPriority() {
      return this.dataView.getInt32(2 * Uint32Array.BYTES_PER_ELEMENT, true)
    }
    setId(v) {
      this.dataView.setInt32(0, v, true)
    }
    setMethod(v) {
      this.dataView.setInt32(Uint32Array.BYTES_PER_ELEMENT, v, true)
    }
    setPriority(v) {
      this.dataView.setInt32(2 * Uint32Array.BYTES_PER_ELEMENT, v, true)
    }
    pullU8Array(length) {
      const { offset } = this
      this.offset += length
      return new Uint8Array(
        this.dataView.buffer,
        this.dataView.byteOffset + offset,
        length
      )
    }
    pullF32Array(length) {
      const { offset } = this
      this.offset += length * Float32Array.BYTES_PER_ELEMENT
      return new Float32Array(
        this.dataView.buffer,
        this.dataView.byteOffset + offset,
        length
      )
    }
    pullI32() {
      const { offset } = this
      this.offset += Int32Array.BYTES_PER_ELEMENT
      return this.dataView.getInt32(offset, true)
    }
    pullU32() {
      const { offset } = this
      this.offset += Uint32Array.BYTES_PER_ELEMENT
      return this.dataView.getUint32(offset, true)
    }
    pullF32() {
      const { offset } = this
      this.offset += Float32Array.BYTES_PER_ELEMENT
      return this.dataView.getFloat32(offset, true)
    }
    pushU8Array(uint8Array) {
      new Uint8Array(
        this.dataView.buffer,
        this.dataView.byteOffset + this.offset,
        uint8Array.length
      ).set(uint8Array)
      this.offset += uint8Array.byteLength
    }
    pushF32Array(float32Array) {
      new Float32Array(
        this.dataView.buffer,
        this.dataView.byteOffset + this.offset,
        float32Array.length
      ).set(float32Array)
      this.offset += float32Array.byteLength
    }
    pushI32(v) {
      this.dataView.setInt32(this.offset, v, true)
      this.offset += Int32Array.BYTES_PER_ELEMENT
    }
    pushU32(v) {
      this.dataView.setUint32(this.offset, v, true)
      this.offset += Uint32Array.BYTES_PER_ELEMENT
    }
    pushF32(v) {
      this.dataView.setFloat32(this.offset, v, true)
      this.offset += Float32Array.BYTES_PER_ELEMENT
    } */
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
  // }
  /* class CallStack {
    constructor() {
      this.ptr = Module._malloc(
        callStackSize * 2 + Uint32Array.BYTES_PER_ELEMENT
      )
      this.dataView = new DataView(
        Module.HEAP8.buffer,
        this.ptr,
        callStackSize
      )

      this.outPtr = this.ptr + callStackSize
      this.outDataView = new DataView(
        Module.HEAP8.buffer,
        this.ptr + callStackSize,
        callStackSize
      )

      this.outNumEntriesPtr = this.ptr + callStackSize * 2
      this.outNumEntriesU32 = new Uint32Array(
        Module.HEAP8.buffer,
        this.outNumEntriesPtr,
        1
      )

      this.numEntries = 0
      this.nextCbId = 0
    }

    allocRequest(method, prio, startCb, endCb) {
      const index = this.numEntries++
      const offset = index * messageSize
      const startMessage = new CallStackMessage(this.ptr + offset)

      const id = ++this.nextCbId
      startMessage.setId(id)
      startMessage.setMethod(method)
      startMessage.setPriority(+prio)

      startCb(startMessage)
      cbIndex.set(id, endCb)
    }

    reset() {
      this.numEntries = 0
    }
  } */

  // const modulePromise = makePromise();
  /* const INITIAL_INITIAL_MEMORY = 52428800;
  const WASM_PAGE_SIZE = 65536;
  const wasmMemory = new WebAssembly.Memory({
    "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
    "maximum": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
    "shared": true,
  }); */

  // let methodIndex = 0
  // const cbIndex = new Map()
  const w = {}
  w.alloc = (constructor, count) => {
    if (count > 0) {
      const size = constructor.BYTES_PER_ELEMENT * count
      const ptr = Module._doMalloc(size)
      return new constructor(Module.HEAP8.buffer, ptr, count)
    } else {
      return new constructor(Module.HEAP8.buffer, 0, 0)
    }
  };
  w.free = (ptr) => {
    Module._doFree(ptr)
  };
  /* w.makeArenaAllocator = size => {
    const ptr = Module._makeArenaAllocator(size);
    const offset = Module.HEAP32[ptr / Uint32Array.BYTES_PER_ELEMENT];
    return {
      ptr,
      getAs(constructor) {
        return new constructor(Module.HEAP8.buffer, offset, size / constructor.BYTES_PER_ELEMENT);
      },
    };
  };
  w.makeGeometrySet = () => Module._makeGeometrySet();
  w.requestLoadBake = async (geometrySet, url) => {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const dataOffset = Module._malloc(uint8Array.length);
    const data = Module.HEAPU8.subarray(dataOffset, dataOffset + uint8Array.length);
    data.set(uint8Array);

    Module._loadBake(
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

    Module._getGeometry(
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
      new THREE.Vector3().fromArray(Module.HEAPF32.subarray(aabbOffset/Float32Array.BYTES_PER_ELEMENT, aabbOffset/Float32Array.BYTES_PER_ELEMENT + 3)),
      new THREE.Vector3().fromArray(Module.HEAPF32.subarray(aabbOffset/Float32Array.BYTES_PER_ELEMENT + 3, aabbOffset/Float32Array.BYTES_PER_ELEMENT + 6)),
    );

    const positions = new Float32Array(Module.HEAP8.buffer, positionsOffset, numPositions);
    const uvs = new Float32Array(Module.HEAP8.buffer, uvsOffset, numUvs);
    const indices = new Uint32Array(Module.HEAP8.buffer, indicesOffset, numIndices);

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
      geometryRequestsOffset = Module._malloc(geometryRequestSize * geometryRequests.length);
      
      for (let i = 0; i < geometryRequests.length; i++) {
        const geometryRequest = geometryRequests[i];
        const {name, position, quaternion, scale} = geometryRequest;
        const geometryRequestOffset = geometryRequestsOffset + i*geometryRequestSize;

        const srcNameUint8Array = textEncoder.encode(name);
        const dstNameUint8Array = Module.HEAPU8.subarray(geometryRequestOffset, geometryRequestOffset + MAX_NAME_LENGTH);
        dstNameUint8Array.set(srcNameUint8Array);
        dstNameUint8Array[srcNameUint8Array.length] = 0;

        position.toArray(Module.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT);
        quaternion.toArray(Module.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT + 3);
        scale.toArray(Module.HEAPF32, geometryRequestOffset/Float32Array.BYTES_PER_ELEMENT + MAX_NAME_LENGTH/Float32Array.BYTES_PER_ELEMENT + 7);
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

      const positions = new Float32Array(Module.HEAP8.buffer, positionsOffset, numPositions);
      const uvs = new Float32Array(Module.HEAP8.buffer, uvsOffset, numUvs);
      // const colors = new Float32Array(Module.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(Module.HEAP8.buffer, indicesOffset, numIndices);

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
            if (Module.HEAPU8[nameOffset+j] === 0) {
              break;
            }
          }
          return j;
        })();
        const name = textDecoder.decode(Module.HEAPU8.slice(nameOffset, nameOffset + nameLength));
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

      const positions = new Float32Array(Module.HEAP8.buffer, positionsOffset, numPositions);
      const colors = new Uint8Array(Module.HEAP8.buffer, colorsOffset, numColors);
      const indices = new Uint32Array(Module.HEAP8.buffer, indicesOffset, numIndices);
      const heads = new Float32Array(Module.HEAP8.buffer, headsOffset, numHeads);
      const legs = new Float32Array(Module.HEAP8.buffer, legsOffset, numLegs);

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
    return Module._doGetHeight(
      hash,
      x,
      y,
      z,
      baseHeight
    );
  };
  w.makeTracker = function() {
    return Module._makeTracker.apply(Module, arguments);
  }; */
  w.initialize = () => Module._initialize()
  w.makeScene = () => Module._makePhysics()
  w.simulatePhysics = (physics, updates, elapsedTime) => {
    const maxNumUpdates = 256;
    /* if (updates.length > maxNumUpdates) {
      throw new Error('too many updates to simulate step: ' + updates.length + ' (max: ' + maxNumUpdates + ')');
    } */

    let index = 0
    const ids = scratchStack.u32.subarray(index, index + maxNumUpdates)
    index += maxNumUpdates
    const positions = scratchStack.f32.subarray(
      index,
      index + maxNumUpdates * 3
    )
    index += maxNumUpdates * 3
    const quaternions = scratchStack.f32.subarray(
      index,
      index + maxNumUpdates * 4
    )
    index += maxNumUpdates * 4
    const scales = scratchStack.f32.subarray(index, index + maxNumUpdates * 3)
    index += maxNumUpdates * 3
    const bitfields = scratchStack.u32.subarray(index, index + maxNumUpdates)
    index += maxNumUpdates

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      ids[i] = update.id
      update.position.toArray(positions, i * 3)
      update.quaternion.toArray(quaternions, i * 4)
      update.scale.toArray(scales, i * 3)
    }

    /* console.log('simulate', {
      physics,
      ids: ids.byteOffset,
      positions: positions.byteOffset,
      quaternions: quaternions.byteOffset,
      scales: scales.byteOffset,
      bitfields: bitfields.byteOffset,
      updates: updates.length,
      elapsedTime: elapsedTime,
    }); */
    const numNewUpdates = Module._simulatePhysics(
      physics,
      ids.byteOffset,
      positions.byteOffset,
      quaternions.byteOffset,
      scales.byteOffset,
      bitfields.byteOffset,
      updates.length,
      elapsedTime
    )

    const newUpdates = Array(numNewUpdates)
    for (let i = 0; i < numNewUpdates; i++) {
      newUpdates[i] = {
        id: ids[i],
        position: new THREE.Vector3().fromArray(positions, i * 3),
        quaternion: new THREE.Quaternion().fromArray(quaternions, i * 4),
        scale: new THREE.Vector3().fromArray(scales, i * 3),
        collided: !!(bitfields[i] & 0x1),
        grounded: !!(bitfields[i] & 0x2),
      }
    }
    /* if (updates.length > 0) {
      console.log('updates', updates.slice());
    } */

    return newUpdates
  }
  w.setTriggerPhysics = (physics, id) => {
    return Module._setTriggerPhysics(
      physics, id,
    )
  }
  w.getTriggerEventsPhysics = (physics) => {
    const triggerCount = Module._getTriggerEventsPhysics(
      physics,
      scratchStack.ptr,
    )
    const triggerEvents = [];
    if (triggerCount > 0) {
      for (let i = 0; i < triggerCount; i++) {
        const status = scratchStack.u32[i * 3 + 0];
        const triggerPhysicsId = scratchStack.u32[i * 3 + 1];
        const otherPhysicsId = scratchStack.u32[i * 3 + 2];
        triggerEvents.push({status, triggerPhysicsId, otherPhysicsId});
      }
    }
    return triggerEvents;
  }

  w.createMaterial = (physics, mat) => {
    const material = scratchStack.f32.subarray(0, 3);
    material.set(mat);

    const materialByteOffset = scratchStack.f32.byteOffset;

    const materialAddress = Module._createMaterialPhysics(
      physics,
      materialByteOffset,
    );
    return materialAddress;
  };
  w.destroyMaterial = (physics, materialAddress) => {
    Module._destroyMaterialPhysics(physics, materialAddress);
  };
  w.getDefaultMaterial = (() => {
    let defaultMaterial = null;
    const defaultMaterialParams = [0.5, 0.5, 0.1];
    
    return physics => {
      if (defaultMaterial === null) {
        defaultMaterial = w.createMaterial(physics, defaultMaterialParams);
      }
      return defaultMaterial;
    };
  })();
  w.getZeroMaterial = (() => {
    let zeroMaterial = null;
    const zeroMaterialParams = [0, 0, 0];
    
    return physics => {
      if (zeroMaterial === null) {
        zeroMaterial = w.createMaterial(physics, zeroMaterialParams);
      }
      return zeroMaterial;
    };
  })();

  w.raycastPhysics = (physics, p, q) => {
    if (physics) {
      p.toArray(scratchStack.f32, 0)
      localVector.set(0, 0, -1).applyQuaternion(q).toArray(scratchStack.f32, 3)
      // physx.currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
      // localVector.set(0, 0, 0).toArray(scratchStack.f32, 6);
      // localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 9);

      const originOffset = scratchStack.f32.byteOffset
      const directionOffset =
        scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
      // const meshPositionOffset = scratchStack.f32.byteOffset + 6 * Float32Array.BYTES_PER_ELEMENT;
      // const meshQuaternionOffset = scratchStack.f32.byteOffset + 9 * Float32Array.BYTES_PER_ELEMENT;

      const hitOffset =
        scratchStack.f32.byteOffset + 6 * Float32Array.BYTES_PER_ELEMENT
      const pointOffset =
        scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
      const normalOffset =
        scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT
      const distanceOffset =
        scratchStack.f32.byteOffset + 13 * Float32Array.BYTES_PER_ELEMENT
      const objectIdOffset =
        scratchStack.u32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT
      const faceIndexOffset =
        scratchStack.u32.byteOffset + 15 * Float32Array.BYTES_PER_ELEMENT
      // const positionOffset = scratchStack.u32.byteOffset + 16 * Float32Array.BYTES_PER_ELEMENT;
      // const quaternionOffset = scratchStack.u32.byteOffset + 19 * Float32Array.BYTES_PER_ELEMENT;

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

      const maxDist = 1000
      Module._raycastPhysics(
        physics,
        originOffset,
        directionOffset,
        maxDist,
        // meshPositionOffset,
        // meshQuaternionOffset,
        hitOffset,
        pointOffset,
        normalOffset,
        distanceOffset,
        objectIdOffset,
        faceIndexOffset
        // positionOffset,
        // quaternionOffset,
      )
      const objectId = scratchStack.u32[14]
      const faceIndex = scratchStack.u32[15]
      // const objectPosition = scratchStack.f32.slice(16, 19);
      // const objectQuaternion = scratchStack.f32.slice(19, 23);

      return scratchStack.u32[13]
        ? {
            point: scratchStack.f32.slice(7, 10),
            normal: scratchStack.f32.slice(10, 13),
            distance: scratchStack.f32[13],
            meshId: scratchStack.u32[14],
            objectId,
            faceIndex,
            // objectPosition,
            // objectQuaternion,
          }
        : null
    }
  }
  w.raycastPhysicsArray = (physics, p, q, n) => {
    if (physics && n > 0 && n < 1000) {
      const positions = new Float32Array(
        scratchStack.f32.buffer,
        scratchStack.f32.byteOffset,
        n * 3
      )
      const directions = new Float32Array(
        scratchStack.f32.buffer,
        scratchStack.f32.byteOffset + n * 3 * 4,
        n * 3
      )
      // const meshPositions = new Float32Array(scratchStack.f32.buffer, scratchStack.f32.byteOffset + (n * 6 * 4), n * 3);
      // const meshQuaternions = new Float32Array(scratchStack.f32.buffer, scratchStack.f32.byteOffset + (n * 9 * 4), n * 4);

      // Input parameters
      for (let i = 0; i < n; i++) {
        // Position
        p[i].toArray(positions, i * 3)

        // Directions
        localVector
          .set(0, 0, -1)
          .applyQuaternion(q[i])
          .toArray(directions, i * 3)

        // meshPosition
        // localVector.set(0, 0, 0).toArray(meshPositions, (i * 3));

        // meshQuaternion
        // localQuaternion.set(0, 0, 0, 1).toArray(meshQuaternions, (i * 4));
      }

      // Output
      const originOffset = scratchStack.f32.byteOffset
      const directionOffset =
        scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT * n
      // const meshPositionOffset = scratchStack.f32.byteOffset + (6 * Float32Array.BYTES_PER_ELEMENT) * n;
      // const meshQuaternionOffset = scratchStack.f32.byteOffset + (9 * Float32Array.BYTES_PER_ELEMENT) * n;

      const hitOffset =
        scratchStack.f32.byteOffset + 13 * Float32Array.BYTES_PER_ELEMENT * n
      const pointOffset =
        scratchStack.f32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT * n
      const normalOffset =
        scratchStack.f32.byteOffset + 17 * Float32Array.BYTES_PER_ELEMENT * n
      const distanceOffset =
        scratchStack.f32.byteOffset + 20 * Float32Array.BYTES_PER_ELEMENT * n
      const objectIdOffset =
        scratchStack.u32.byteOffset + 21 * Float32Array.BYTES_PER_ELEMENT * n
      const faceIndexOffset =
        scratchStack.u32.byteOffset + 22 * Float32Array.BYTES_PER_ELEMENT * n
      // const positionOffset = scratchStack.u32.byteOffset + (23 * Float32Array.BYTES_PER_ELEMENT) * n;
      // const quaternionOffset = scratchStack.u32.byteOffset + (26 * Float32Array.BYTES_PER_ELEMENT) * n;

      const maxDist = 1000
      Module._raycastPhysicsArray(
        n,
        physics,
        originOffset,
        directionOffset,
        maxDist,
        // meshPositionOffset,
        // meshQuaternionOffset,
        hitOffset,
        pointOffset,
        normalOffset,
        distanceOffset,
        objectIdOffset,
        faceIndexOffset
        // positionOffset,
        // quaternionOffset,
      )

      return {
        hit: scratchStack.u32.slice(13 * n, 14 * n),
        distance: scratchStack.f32.slice(20 * n, 21 * n),
        point: scratchStack.f32.slice(14 * n, 17 * n),
        normal: scratchStack.f32.slice(17 * n, 20 * n),
        meshId: scratchStack.u32.slice(21 * n, 22 * n),
        objectId: scratchStack.u32.slice(21 * n, 22 * n),
        faceIndex: scratchStack.u32.slice(22 * n, 23 * n),
        // objectPosition: scratchStack.f32.slice(23 * n, 26 * n),
        // objectQuaternion: scratchStack.f32.slice(26 * n, 30 * n)
      }
    } else {
      throw new Error('raycastPhysicsArray error')
    }
  }

  w.doCut = (
    positions,
    numPositions,
    normals,
    numNormals,
    uvs,
    numUvs,
    faces, // Set to falsy to indicate that this is an non-indexed geometry
    numFaces,

    planeNormal, // normalized vector3 array
    planeDistance, // number
  ) => {
    const allocator = new Allocator(Module)

    const positionsTypedArray = allocator.alloc(Float32Array, numPositions)
    positionsTypedArray.set(positions)

    const normalsTypedArray = allocator.alloc(Float32Array, numNormals)
    normalsTypedArray.set(normals)

    const uvsTypedArray = allocator.alloc(Float32Array, numUvs)
    uvsTypedArray.set(uvs)

    let facesTypedArray;
    if (faces) {
      facesTypedArray = allocator.alloc(Uint32Array, numFaces)
      facesTypedArray.set(faces)
    }

    const planeNormalTypedArray = allocator.alloc(Float32Array, 3)
    planeNormalTypedArray.set(planeNormal)

    const outputBufferOffset = Module._doCut(
      positionsTypedArray.byteOffset,
      numPositions,
      normalsTypedArray.byteOffset,
      numNormals,
      uvsTypedArray.byteOffset,
      numUvs,
      faces ? facesTypedArray.byteOffset : null,
      faces ? numFaces : null,

      planeNormalTypedArray.byteOffset,
      planeDistance,
    )
    allocator.freeAll()

    let head = outputBufferOffset / 4
    let tail = head + 2
    const numOutPositionsTypedArray = Module.HEAPF32.slice(head, tail)
    head = tail
    tail = head + 2
    const numOutNormalsTypedArray = Module.HEAPF32.slice(head, tail)
    head = tail
    tail = head + 2
    const numOutUvsTypedArray = Module.HEAPF32.slice(head, tail)
    head = tail
    tail = head + (numOutPositionsTypedArray[0] + numOutPositionsTypedArray[1])
    const outPositions = Module.HEAPF32.slice(head, tail)
    head = tail
    tail = head + (numOutNormalsTypedArray[0] + numOutNormalsTypedArray[1])
    const outNormals = Module.HEAPF32.slice(head, tail)
    head = tail
    tail = head + (numOutUvsTypedArray[0] + numOutUvsTypedArray[1])
    const outUvs = Module.HEAPF32.slice(head, tail)

    Module._doFree(outputBufferOffset)

    const output = {
      numOutPositions: numOutPositionsTypedArray,
      outPositions,
      numOutNormals: numOutNormalsTypedArray,
      outNormals,
      numOutUvs: numOutUvsTypedArray,
      outUvs,
    }
    return output
  }
  w.setLinearLockFlags = (physics, physicsId, x, y, z) => {
    Module._setLinearLockFlagsPhysics(physics, physicsId, x, y, z)
  }
  w.setAngularLockFlags = (physics, physicsId, x, y, z) => {
    Module._setAngularLockFlagsPhysics(physics, physicsId, x, y, z)
  }

  w.sweepBox = (
    physics,
    origin,
    quaternion,
    halfExtents,
    direction,
    sweepDistance,
    maxHits,
  ) => {
    const allocator = new Allocator(Module);
    
    // inputs
    const originBuf = allocator.alloc(
      Float32Array,
      3
    );
    origin.toArray(originBuf);
    const quaternionBuf = allocator.alloc(
      Float32Array,
      4
    );
    quaternion.toArray(quaternionBuf);
    const halfExtentsBuf = allocator.alloc(
      Float32Array,
      3
    );
    halfExtents.toArray(halfExtentsBuf);
    const directionBuf = allocator.alloc(
      Float32Array,
      3
    );
    direction.toArray(directionBuf);

    // outputs
    const numHitsBuf = allocator.alloc(
      Uint32Array,
      1
    );
    const positionBuf = allocator.alloc(
      Float32Array,
      maxHits * 3
    );
    const normalBuf = allocator.alloc(
      Float32Array,
      maxHits * 3
    );
    const distanceBuf = allocator.alloc(
      Float32Array,
      maxHits * 1
    );
    const objectIdBuf = allocator.alloc(
      Uint32Array,
      maxHits * 1
    );
    const faceIndexBuf = allocator.alloc(
      Uint32Array,
      maxHits * 1
    );

    Module._sweepBox(
      physics,
      originBuf.byteOffset,
      quaternionBuf.byteOffset,
      halfExtentsBuf.byteOffset,
      directionBuf.byteOffset,
      sweepDistance,
      maxHits,
      numHitsBuf.byteOffset,
      positionBuf.byteOffset,
      normalBuf.byteOffset,
      distanceBuf.byteOffset,
      objectIdBuf.byteOffset,
      faceIndexBuf.byteOffset,
    );

    const numHits = numHitsBuf[0];
    let result = Array(numHits);
    for (let i = 0; i < numHits; i++) {
      const object = {
        position: new THREE.Vector3().fromArray(positionBuf, i * 3),
        normal: new THREE.Vector3().fromArray(normalBuf, i * 3),
        distance: distanceBuf[i],
        objectId: objectIdBuf[i],
        faceIndex: faceIndexBuf[i],
      };
      result[i] = object;
    }

    allocator.freeAll();

    return result
  };
  w.sweepConvexShape = (
    physics,
    shapeAddress,
    origin,
    quaternion,
    direction,
    sweepDistance,
    maxHits,
  ) => {
    const allocator = new Allocator(Module);
    
    // inputs
    const originBuf = allocator.alloc(
      Float32Array,
      3
    );
    origin.toArray(originBuf);
    const quaternionBuf = allocator.alloc(
      Float32Array,
      4
    );
    quaternion.toArray(quaternionBuf);
    const directionBuf = allocator.alloc(
      Float32Array,
      3
    );
    direction.toArray(directionBuf);

    // outputs
    const numHitsBuf = allocator.alloc(
      Uint32Array,
      1
    );
    const positionBuf = allocator.alloc(
      Float32Array,
      maxHits * 3
    );
    const normalBuf = allocator.alloc(
      Float32Array,
      maxHits * 3
    );
    const distanceBuf = allocator.alloc(
      Float32Array,
      maxHits * 1
    );
    const objectIdBuf = allocator.alloc(
      Uint32Array,
      maxHits * 1
    );
    const faceIndexBuf = allocator.alloc(
      Uint32Array,
      maxHits * 1
    );

    Module._sweepConvexShape(
      physics,
      shapeAddress,
      originBuf.byteOffset,
      quaternionBuf.byteOffset,
      directionBuf.byteOffset,
      sweepDistance,
      maxHits,
      numHitsBuf.byteOffset,
      positionBuf.byteOffset,
      normalBuf.byteOffset,
      distanceBuf.byteOffset,
      objectIdBuf.byteOffset,
      faceIndexBuf.byteOffset,
    );

    const numHits = numHitsBuf[0];
    let result = Array(numHits);
    for (let i = 0; i < numHits; i++) {
      const object = {
        position: new THREE.Vector3().fromArray(positionBuf, i * 3),
        normal: new THREE.Vector3().fromArray(normalBuf, i * 3),
        distance: distanceBuf[i],
        objectId: objectIdBuf[i],
        faceIndex: faceIndexBuf[i],
      };
      result[i] = object;
    }

    allocator.freeAll();

    return result
  };

  w.getPathPhysics = (
    physics,
    start,
    dest,
    isWalk,
    hy,
    heightTolerance,
    maxIterDetect,
    maxIterStep,
    ignorePhysicsIds
  ) => {
    start.toArray(scratchStack.f32, 0)
    dest.toArray(scratchStack.f32, 3)

    const startOffset =
      scratchStack.f32.byteOffset + 0 * Float32Array.BYTES_PER_ELEMENT
    const destOffset =
      scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
    const ignorePhysicsIdsOffset =
      scratchStack.u32.byteOffset + 6 * Float32Array.BYTES_PER_ELEMENT

    ignorePhysicsIds.forEach((id, i) => {
      scratchStack.u32[6 + i] = ignorePhysicsIds[i]
    })

    const outputBufferOffset = Module._getPathPhysics(
      physics,
      startOffset,
      destOffset,
      isWalk,
      hy,
      heightTolerance,
      maxIterDetect,
      maxIterStep,
      ignorePhysicsIds.length,
      ignorePhysicsIdsOffset
    )

    const head = outputBufferOffset / Float32Array.BYTES_PER_ELEMENT
    const numWaypointResult = Module.HEAPF32[head + 0]
    const waypointResult = []
    for (let i = 0; i < numWaypointResult; i++) {
      const result = new THREE.Object3D()
      result.position.x = Module.HEAPF32[head + i * 3 + 1]
      result.position.y = Module.HEAPF32[head + i * 3 + 2]
      result.position.z = Module.HEAPF32[head + i * 3 + 3]
      waypointResult.push(result)
    }
    waypointResult.forEach((result, i) => {
      const next = waypointResult[i + 1]
      if (next) {
        result._next = next
      }
    })

    Module._doFree(outputBufferOffset)

    return waypointResult
  }

  w.overlapBoxPhysics = (physics, hx, hy, hz, p, q) => {
    p.toArray(scratchStack.f32, 0)
    localQuaternion.copy(q).toArray(scratchStack.f32, 3)
    // physx.currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    localVector.set(0, 0, 0).toArray(scratchStack.f32, 7)
    localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 10)

    const positionOffset = scratchStack.f32.byteOffset
    const quaternionOffset =
      scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
    const meshPositionOffset =
      scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    const meshQuaternionOffset =
      scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT

    const outputBufferOffset = Module._overlapBoxPhysics(
      physics,
      hx,
      hy,
      hz,
      positionOffset,
      quaternionOffset,
      meshPositionOffset,
      meshQuaternionOffset
    )

    let head = outputBufferOffset / Float32Array.BYTES_PER_ELEMENT
    let tail = head + 1
    const numOutIds = Module.HEAPF32[head]
    head = tail
    tail = head + numOutIds
    const outIds = Module.HEAPF32.slice(head, tail)

    Module._doFree(outputBufferOffset)

    return {
      objectIds: outIds,
    }
  }
  w.overlapCapsulePhysics = (physics, radius, halfHeight, p, q) => {
    p.toArray(scratchStack.f32, 0)
    localQuaternion
      .copy(q)
      .premultiply(capsuleUpQuaternion)
      .toArray(scratchStack.f32, 3)
    // localVector.set(0, 0, 0).toArray(scratchStack.f32, 7)
    // localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 10)

    const positionOffset = scratchStack.f32.byteOffset
    const quaternionOffset =
      scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
    // const meshPositionOffset =
    //   scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    // const meshQuaternionOffset =
    //   scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT

    const outputBufferOffset = Module._overlapCapsulePhysics(
      physics,
      radius,
      halfHeight,
      positionOffset,
      quaternionOffset,
      // meshPositionOffset,
      // meshQuaternionOffset
    )

    let head = outputBufferOffset / Float32Array.BYTES_PER_ELEMENT
    let tail = head + 1
    const numOutIds = Module.HEAPF32[head]
    head = tail
    tail = head + numOutIds
    const outIds = Module.HEAPF32.slice(head, tail)

    Module._doFree(outputBufferOffset)

    return {
      objectIds: outIds,
    }
  }
  w.collideBoxPhysics = (physics, hx, hy, hz, p, q, maxIter) => {
    p.toArray(scratchStack.f32, 0)
    localQuaternion.copy(q).toArray(scratchStack.f32, 3)
    // localVector.set(0, 0, 0).toArray(scratchStack.f32, 7)
    // localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 10)

    const positionOffset = scratchStack.f32.byteOffset
    const quaternionOffset =
      scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
    /* const meshPositionOffset =
      scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    const meshQuaternionOffset =
      scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT; */

    const hitOffset =
      scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    const directionOffset =
      scratchStack.f32.byteOffset + 8 * Float32Array.BYTES_PER_ELEMENT
    const groundedOffset =
      scratchStack.f32.byteOffset + 11 * Float32Array.BYTES_PER_ELEMENT
    const idOffset =
      scratchStack.f32.byteOffset + 12 * Float32Array.BYTES_PER_ELEMENT

    Module._collideBoxPhysics(
      physics,
      hx,
      hy,
      hz,
      positionOffset,
      quaternionOffset,
      // meshPositionOffset,
      // meshQuaternionOffset,
      maxIter,
      hitOffset,
      directionOffset,
      groundedOffset,
      idOffset
    )

    return scratchStack.u32[14]
      ? {
          direction: scratchStack.f32.slice(15, 18),
          grounded: !!scratchStack.u32[18],
          objectId: scratchStack.u32[19],
        }
      : null
  }
  w.collideCapsulePhysics = (physics, radius, halfHeight, p, q, maxIter) => {
    p.toArray(scratchStack.f32, 0)
    localQuaternion
      .copy(q)
      .premultiply(capsuleUpQuaternion)
      .toArray(scratchStack.f32, 3)
    // physx.currentChunkMesh.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    localVector.set(0, 0, 0).toArray(scratchStack.f32, 7)
    localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 10)

    const positionOffset = scratchStack.f32.byteOffset
    const quaternionOffset =
      scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
    // const meshPositionOffset =
    //   scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    // const meshQuaternionOffset =
    //   scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT

    const hitOffset =
      scratchStack.f32.byteOffset + 14 * Float32Array.BYTES_PER_ELEMENT
    const directionOffset =
      scratchStack.f32.byteOffset + 15 * Float32Array.BYTES_PER_ELEMENT
    const groundedOffset =
      scratchStack.f32.byteOffset + 18 * Float32Array.BYTES_PER_ELEMENT
    const idOffset =
      scratchStack.f32.byteOffset + 19 * Float32Array.BYTES_PER_ELEMENT

    Module._collideCapsulePhysics(
      physics,
      radius,
      halfHeight,
      positionOffset,
      quaternionOffset,
      // meshPositionOffset,
      // meshQuaternionOffset,
      maxIter,
      hitOffset,
      directionOffset,
      groundedOffset,
      idOffset
    )

    return scratchStack.u32[14]
      ? {
          direction: scratchStack.f32.slice(15, 18),
          grounded: !!scratchStack.u32[18],
          objectId: scratchStack.u32[19],
        }
      : null
  }
  w.getCollisionObjectPhysics = (physics, radius, halfHeight, p, q) => {
    p.toArray(scratchStack.f32, 0)
    localQuaternion
      .copy(q)
      .premultiply(capsuleUpQuaternion)
      .toArray(scratchStack.f32, 3)
    // localVector.set(0, 0, 0).toArray(scratchStack.f32, 7)
    // localQuaternion.set(0, 0, 0, 1).toArray(scratchStack.f32, 10)

    const positionOffset = scratchStack.f32.byteOffset
    const quaternionOffset =
      scratchStack.f32.byteOffset + 3 * Float32Array.BYTES_PER_ELEMENT
    const directionOffset =
      scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    // const meshPositionOffset =
    //   scratchStack.f32.byteOffset + 7 * Float32Array.BYTES_PER_ELEMENT
    // const meshQuaternionOffset =
    //   scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT

    const hitOffset =
      scratchStack.f32.byteOffset + 10 * Float32Array.BYTES_PER_ELEMENT
    const idOffset =
      scratchStack.f32.byteOffset + 11 * Float32Array.BYTES_PER_ELEMENT

    Module._getCollisionObjectPhysics(
      physics,
      radius,
      halfHeight,
      positionOffset,
      quaternionOffset,
      directionOffset,
      // meshPositionOffset,
      // meshQuaternionOffset,
      hitOffset,
      idOffset
    )

    return scratchStack.u32[10]
      ? {
          objectId: scratchStack.u32[11],
        }
      : null
  }

  w.addGeometryPhysics = (physics, mesh, id) => {
    const { geometry } = mesh

    const allocator = new Allocator(Module)
    const positions = allocator.alloc(
      Float32Array,
      geometry.attributes.position.count * 3
    )
    positions.set(geometry.attributes.position.array)
    const indices = geometry.index
      ? allocator.alloc(Uint32Array, geometry.index.count)
      : null
    indices && indices.set(geometry.index.array)
    Module._cookGeometryPhysics(
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
    )
    allocator.freeAll()

    const dataPtr = scratchStack.u32[0]
    const dataLength = scratchStack.u32[1]
    const streamPtr = scratchStack.u32[2]

    const shape = Module._createShapePhysics(
      physics,
      dataPtr,
      dataLength,
      streamPtr,
    )

    const positionBuffer = scratchStack.f32.subarray(3, 6)
    mesh.getWorldPosition(localVector).toArray(positionBuffer)
    const quaternionBuffer = scratchStack.f32.subarray(6, 10)
    mesh.getWorldQuaternion(localQuaternion).toArray(quaternionBuffer)
    const scaleBuffer = scratchStack.f32.subarray(10, 13)
    mesh.getWorldScale(localVector2).toArray(scaleBuffer)
    /* const mat = scratchStack.f32.subarray(13, 16)
    mat[0] = physicsMaterial[0]
    mat[1] = physicsMaterial[1]
    mat[2] = physicsMaterial[2] */

    const materialAddress = w.getDefaultMaterial(physics)

    const external = false;
    Module._addGeometryPhysics(
      physics,
      shape,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      materialAddress,
      +external,
      shape
    )
  }
  w.cookGeometryPhysics = (mesh) => {
    mesh.updateMatrixWorld()
    const { geometry } = mesh

    const allocator = new Allocator(Module)
    const positions = allocator.alloc(
      Float32Array,
      geometry.attributes.position.count * 3
    )
    positions.set(geometry.attributes.position.array)
    const indices = geometry.index
      ? allocator.alloc(Uint32Array, geometry.index.count)
      : null
    indices && indices.set(geometry.index.array)
    Module._cookGeometryPhysics(
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
    )

    const dataPtr = scratchStack.u32[0]
    const dataLength = scratchStack.u32[1]
    const streamPtr = scratchStack.u32[2] // XXX delete if it will not be deleted

    const result = Module.HEAPU8.slice(dataPtr, dataPtr + dataLength);
    allocator.freeAll()
    return result
  }
  w.addCookedGeometryPhysics = (
    physics,
    buffer,
    position,
    quaternion,
    scale,
    id
  ) => {
    const allocator = new Allocator(Module)
    const buffer2 = allocator.alloc(Uint8Array, buffer.length)
    buffer2.set(buffer)

    const positionBuffer = scratchStack.f32.subarray(0, 3)
    position.toArray(positionBuffer)
    const quaternionBuffer = scratchStack.f32.subarray(3, 7)
    quaternion.toArray(quaternionBuffer)
    const scaleBuffer = scratchStack.f32.subarray(7, 10)
    scale.toArray(scaleBuffer)

    const shape = Module._createShapePhysics(
      physics,
      buffer2.byteOffset,
      buffer2.byteLength,
      0,
    );

    const materialAddress = w.getDefaultMaterial(physics)

    const external = false;
    Module._addGeometryPhysics(
      physics,
      shape,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      materialAddress,
      +external,
      0
    )
    allocator.freeAll()
  }

  w.addConvexGeometryPhysics = (physics, mesh, dynamic, external, id) => {
    mesh.updateMatrixWorld()
    const { geometry } = mesh

    const allocator = new Allocator(Module)
    const positions = allocator.alloc(
      Float32Array,
      geometry.attributes.position.count * 3
    )
    positions.set(geometry.attributes.position.array)
    const indices = geometry.index
      ? allocator.alloc(Uint32Array, geometry.index.count)
      : null
    indices && indices.set(geometry.index.array)
    Module._cookConvexGeometryPhysics(
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
    )
    allocator.freeAll()

    const dataPtr = scratchStack.u32[0]
    const dataLength = scratchStack.u32[1]
    const streamPtr = scratchStack.u32[2]

    const shape = Module._createConvexShapePhysics(
      physics,
      dataPtr,
      dataLength,
      streamPtr,
    )

    const positionBuffer = scratchStack.f32.subarray(3, 6)
    mesh.getWorldPosition(localVector).toArray(positionBuffer)
    const quaternionBuffer = scratchStack.f32.subarray(6, 10)
    mesh.getWorldQuaternion(localQuaternion).toArray(quaternionBuffer)
    const scaleBuffer = scratchStack.f32.subarray(10, 13)
    mesh.getWorldScale(localVector2).toArray(scaleBuffer)
    /* const mat = scratchStack.f32.subarray(13, 16)
    mat[0] = physicsMaterial[0]
    mat[1] = physicsMaterial[1]
    mat[2] = physicsMaterial[2] */

    const materialAddress = w.getDefaultMaterial(physics);

    Module._addConvexGeometryPhysics(
      physics,
      shape,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      materialAddress,
      +dynamic,
      +external,
      shape,
    )
  }
  w.cookConvexGeometryPhysics = (physics, mesh) => {
    mesh.updateMatrixWorld()
    const { geometry } = mesh

    const allocator = new Allocator(Module)
    const positions = allocator.alloc(
      Float32Array,
      geometry.attributes.position.count * 3
    )
    positions.set(geometry.attributes.position.array)
    const indices = geometry.index
      ? allocator.alloc(Uint32Array, geometry.index.count)
      : null
    indices && indices.set(geometry.index.array)
    Module._cookConvexGeometryPhysics(
      positions.byteOffset,
      indices ? indices.byteOffset : 0,
      positions.length,
      indices ? indices.length : 0,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
    )

    const dataPtr = scratchStack.u32[0]
    const dataLength = scratchStack.u32[1]
    const streamPtr = scratchStack.u32[2] // XXX delete if it will not be deleted

    const result = Module.HEAPU8.slice(dataPtr, dataPtr + dataLength);
    allocator.freeAll()
    return result
  }
  w.addCookedConvexGeometryPhysics = (
    physics,
    buffer,
    position,
    quaternion,
    scale,
    dynamic,
    external,
    id
  ) => {
    const allocator = new Allocator(Module)
    const buffer2 = allocator.alloc(Uint8Array, buffer.length)
    buffer2.set(buffer)

    const positionBuffer = scratchStack.f32.subarray(0, 3)
    position.toArray(positionBuffer)
    const quaternionBuffer = scratchStack.f32.subarray(3, 7)
    quaternion.toArray(quaternionBuffer)
    const scaleBuffer = scratchStack.f32.subarray(7, 10)
    scale.toArray(scaleBuffer)

    const shape = Module._createConvexShapePhysics(
      physics,
      buffer2.byteOffset,
      buffer2.byteLength,
      0,
    )

    const materialAddress = w.getDefaultMaterial(physics)

    Module._addConvexGeometryPhysics(
      physics,
      shape,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      materialAddress,
      +dynamic,
      +external,
      0,
    )
    allocator.freeAll()
  }

  w.addConvexShapePhysics = (physics, shape, position, quaternion, scale, dynamic, external, id) => {
    const positionBuffer = scratchStack.f32.subarray(3, 6)
    position.toArray(positionBuffer)
    const quaternionBuffer = scratchStack.f32.subarray(6, 10)
    quaternion.toArray(quaternionBuffer)
    const scaleBuffer = scratchStack.f32.subarray(10, 13)
    scale.toArray(scaleBuffer)

    const materialAddress = w.getDefaultMaterial(physics);

    Module._addConvexGeometryPhysics(
      physics,
      shape,
      positionBuffer.byteOffset,
      quaternionBuffer.byteOffset,
      scaleBuffer.byteOffset,
      id,
      materialAddress,
      +dynamic,
      +external,
      shape
    )
  }

  w.createShapePhysics = (physics, buffer) => {
    const allocator = new Allocator(Module)
    const buffer2 = allocator.alloc(Uint8Array, buffer.length)
    buffer2.set(buffer)

    const shapeAddress = Module._createShapePhysics(
      physics,
      buffer2.byteOffset,
      buffer2.byteLength,
      0,
    );
    allocator.freeAll();
    return shapeAddress;
  };
  w.createConvexShapePhysics = (physics, buffer) => {
    const allocator = new Allocator(Module)
    const buffer2 = allocator.alloc(Uint8Array, buffer.length)
    buffer2.set(buffer)

    const shapeAddress = Module._createConvexShapePhysics(
      physics,
      buffer2.byteOffset,
      buffer2.byteLength,
      0,
    );
    allocator.freeAll();
    return shapeAddress;
  };

  w.addHeightFieldGeometryPhysics = (physics, numRows, numColumns, heights, heightScale, rowScale, columnScale, dynamic, external, id) => {
    // numRows and numColumns must int.

    // mesh.updateMatrixWorld()

    // heights
    const numVerts = numRows * numColumns;
    for (let i = 0; i < numVerts; i++) {
      scratchStack.u32[i] = heights[i];
    }

    Module._cookHeightFieldGeometryPhysics(
      numRows,
      numColumns,
      scratchStack.ptr,
      scratchStack.u32.byteOffset,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT,
      scratchStack.u32.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2
    )

    const dataPtr = scratchStack.u32[0]
    const dataLength = scratchStack.u32[1]
    const streamPtr = scratchStack.u32[2]

    const heightField = Module._createHeightFieldPhysics(
      physics,
      dataPtr,
      dataLength,
      streamPtr,
    )

    // return heightField;

    // const positionBuffer = scratchStack.f32.subarray(3, 6)
    // mesh.getWorldPosition(localVector).toArray(positionBuffer)
    // const quaternionBuffer = scratchStack.f32.subarray(6, 10)
    // mesh.getWorldQuaternion(localQuaternion).toArray(quaternionBuffer)
    // const scaleBuffer = scratchStack.f32.subarray(10, 13)
    // mesh.getWorldScale(localVector2).toArray(scaleBuffer)
    // /* const mat = scratchStack.f32.subarray(13, 16)
    // mat[0] = physicsMaterial[0]
    // mat[1] = physicsMaterial[1]
    // mat[2] = physicsMaterial[2] */

    const materialAddress = w.getDefaultMaterial(physics);

    Module._addHeightFieldGeometryPhysics(
      physics,
      heightField,
      heightScale,
      rowScale,
      columnScale,
      id,
      materialAddress,
      +dynamic,
      +external,
      heightField,
    )
  }

  w.getGeometryPhysics = (physics, id) => {
    const allocator = new Allocator(Module)
    const positionsBuffer = allocator.alloc(Float32Array, 1024 * 1024 * 2)
    const numPositions = allocator.alloc(Uint32Array, 1)
    const indicesBuffer = allocator.alloc(Uint32Array, 1024 * 1024 * 2)
    const numIndices = allocator.alloc(Uint32Array, 1)
    const boundsBuffer = allocator.alloc(Float32Array, 6)

    const ok = Module._getGeometryPhysics(
      physics,
      id,
      positionsBuffer.byteOffset,
      numPositions.byteOffset,
      indicesBuffer.byteOffset,
      numIndices.byteOffset,
      boundsBuffer.byteOffset
    )

    if (ok) {
      const positions = positionsBuffer.slice(0, numPositions[0])
      const indices = indicesBuffer.slice(0, numIndices[0])
      const bounds = boundsBuffer.slice()

      allocator.freeAll()

      return {
        positions,
        indices,
        bounds,
      }
    } else {
      allocator.freeAll()
      return null
    }
  }
  w.getBoundsPhysics = (physics, id, box) => {
    const allocator = new Allocator(Module)
    const boundsBuffer = allocator.alloc(Float32Array, 6)

    const ok = Module._getBoundsPhysics(
      physics,
      id,
      boundsBuffer.byteOffset
    )

    if (ok) {
      box.min.fromArray(boundsBuffer, 0)
      box.max.fromArray(boundsBuffer, 3)

      allocator.freeAll()

      return box
    } else {
      allocator.freeAll()
      return null
    }
  }

  w.enableActorPhysics = (physics, id) => {
    Module._enableActorPhysics(physics, id)
  }
  w.disableActorPhysics = (physics, id) => {
    Module._disableActorPhysics(physics, id)
  }
  w.disableGeometryPhysics = (physics, id) => {
    Module._disableGeometryPhysics(physics, id)
  }
  w.enableGeometryPhysics = (physics, id) => {
    Module._enableGeometryPhysics(physics, id)
  }
  w.disableGeometryQueriesPhysics = (physics, id) => {
    Module._disableGeometryQueriesPhysics(physics, id)
  }
  w.enableGeometryQueriesPhysics = (physics, id) => {
    Module._enableGeometryQueriesPhysics(physics, id)
  }
  w.setMassAndInertiaPhysics = (physics, id, mass, inertia) => {
    const allocator = new Allocator(Module)
    const inrt = allocator.alloc(Float32Array, 3)
    inertia.toArray(inrt)

    Module._setMassAndInertiaPhysics(physics, id, mass, inrt)
    allocator.freeAll()
  }
  w.setGravityEnabledPhysics = (physics, id, enabled) => {
    Module._setGravityEnabledPhysics(physics, id, enabled)
  }
  w.removeGeometryPhysics = (physics, id) => {
    Module._removeGeometryPhysics(physics, id)
  }
  w.getGlobalPositionPhysics = (physics, id, position) => {
    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)

    Module._getGlobalPositionPhysics(physics, id, p.byteOffset)

    position.fromArray(p)

    allocator.freeAll()
  }
  w.getLinearVelocityPhysics = (physics, id, velocity) => {
    const allocator = new Allocator(Module)
    const v = allocator.alloc(Float32Array, 3)

    Module._getLinearVelocityPhysics(physics, id, v.byteOffset)

    velocity.fromArray(v)

    allocator.freeAll()
  }
  w.getAngularVelocityPhysics = (physics, id, velocity) => {
    const allocator = new Allocator(Module)
    const v = allocator.alloc(Float32Array, 3)

    Module._getAngularVelocityPhysics(physics, id, v.byteOffset)

    velocity.fromArray(v)

    allocator.freeAll()
  }
  w.addForceAtPosPhysics = (physics, id, velocity, position, autoWake) => {
    const allocator = new Allocator(Module);
    const vel = allocator.alloc(Float32Array, 3);
    velocity.toArray(vel);
    const pos = allocator.alloc(Float32Array, 3);
    position.toArray(pos);

    autoWake = autoWake ?? false;

    Module._addForceAtPosPhysics(physics, id, vel.byteOffset, pos.byteOffset, autoWake);
    allocator.freeAll();
  }
  w.addLocalForceAtPosPhysics = (physics, id, velocity, position, autoWake) => {
    const allocator = new Allocator(Module);
    const vel = allocator.alloc(Float32Array, 3);
    velocity.toArray(vel);
    const pos = allocator.alloc(Float32Array, 3);
    position.toArray(pos);

    autoWake = autoWake ?? false;

    Module._addLocalForceAtPosPhysics(physics, id, vel.byteOffset, pos.byteOffset, autoWake);
    allocator.freeAll();
  }
  w.addLocalForceAtLocalPosPhysics = (physics, id, velocity, position, autoWake) => {
    const allocator = new Allocator(Module);
    const vel = allocator.alloc(Float32Array, 3);
    velocity.toArray(vel);
    const pos = allocator.alloc(Float32Array, 3);
    position.toArray(pos);

    autoWake = autoWake ?? false;

    Module._addLocalForceAtLocalPosPhysics(physics, id, vel.byteOffset, pos.byteOffset, autoWake);
    allocator.freeAll();
  }
  w.addForceAtLocalPosPhysics = (physics, id, velocity, position, autoWake) => {
    const allocator = new Allocator(Module);
    const vel = allocator.alloc(Float32Array, 3);
    velocity.toArray(vel);
    const pos = allocator.alloc(Float32Array, 3);
    position.toArray(pos);

    autoWake = autoWake ?? false;

    Module._addForceAtLocalPosPhysics(physics, id, vel.byteOffset, pos.byteOffset, autoWake);
    allocator.freeAll();
  }
  w.addForcePhysics = (physics, id, velocity, autoWake) => {
    const allocator = new Allocator(Module);
    const vel = allocator.alloc(Float32Array, 3);
    velocity.toArray(vel);

    autoWake = autoWake ?? false;

    Module._addForcePhysics(physics, id, vel.byteOffset, autoWake);
    allocator.freeAll();
  }
  w.addTorquePhysics = (physics, id, velocity, autoWake) => {
    const allocator = new Allocator(Module);
    const vel = allocator.alloc(Float32Array, 3);
    velocity.toArray(vel);

    autoWake = autoWake ?? false;

    Module._addTorquePhysics(physics, id, vel.byteOffset, autoWake);
    allocator.freeAll();
  }
  w.setVelocityPhysics = (physics, id, velocity, autoWake) => {
    const allocator = new Allocator(Module)
    const vel = allocator.alloc(Float32Array, 3)
    velocity.toArray(vel)

    autoWake = autoWake ?? false

    Module._setVelocityPhysics(physics, id, vel.byteOffset, autoWake)
    allocator.freeAll()
  }
  w.setAngularVelocityPhysics = (physics, id, velocity, autoWake) => {
    const allocator = new Allocator(Module)
    const vel = allocator.alloc(Float32Array, 3)
    velocity.toArray(vel)

    autoWake = autoWake ?? false

    Module._setAngularVelocityPhysics(
      physics,
      id,
      vel.byteOffset,
      autoWake
    )
    allocator.freeAll()
  }
  w.setGeometryScale = (
    physics,
    id,
    scale,
  ) => {
    const allocator = new Allocator(Module)
    const s = allocator.alloc(Float32Array, 3)
    scale.toArray(s)
    Module._setGeometryScalePhysics(
        physics,
        id,
        s.byteOffset
    )
    allocator.freeAll()
  }
  w.setTransformPhysics = (
    physics,
    id,
    position,
    quaternion,
    scale,
    autoWake
  ) => {
    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)
    const q = allocator.alloc(Float32Array, 4)
    const s = allocator.alloc(Float32Array, 3)

    position.toArray(p)
    quaternion.toArray(q)
    scale.toArray(s)

    autoWake = autoWake ?? false

    Module._setTransformPhysics(
      physics,
      id,
      p.byteOffset,
      q.byteOffset,
      s.byteOffset,
      autoWake
    )
    allocator.freeAll()
  }
  w.getTransformPhysics = (physics, updates) => {
    if (updates.length > maxNumUpdates) {
      throw new Error(
        'too many updates to simulate step: ' +
          updates.length +
          ' (max: ' +
          maxNumUpdates +
          ')'
      )
    }

    let index = 0
    const ids = scratchStack.u32.subarray(index, index + maxNumUpdates)
    index += maxNumUpdates
    const positions = scratchStack.f32.subarray(
      index,
      index + maxNumUpdates * 3
    )
    index += maxNumUpdates * 3
    const quaternions = scratchStack.f32.subarray(
      index,
      index + maxNumUpdates * 4
    )
    index += maxNumUpdates * 4
    const scales = scratchStack.f32.subarray(index, index + maxNumUpdates * 3)
    index += maxNumUpdates * 3

    //console.log(updates);

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      ids[i] = update.id
      update.position.toArray(positions, i * 3)
      update.quaternion.toArray(quaternions, i * 4)
      update.scale.toArray(scales, i * 3)
    }

    const numNewUpdates = Module._getTransformPhysics(
      physics,
      ids.byteOffset,
      positions.byteOffset,
      quaternions.byteOffset,
      scales.byteOffset
    )

    const newUpdates = Array(numNewUpdates)
    //console.log(numNewUpdates);
    for (let i = 0; i < numNewUpdates; i++) {
      newUpdates[i] = {
        id: ids[i],
        position: new THREE.Vector3().fromArray(positions, i * 3),
        quaternion: new THREE.Quaternion().fromArray(quaternions, i * 4),
        scale: new THREE.Vector3().fromArray(scales, i * 3),
      }
    }

    // console.log(newUpdates, "new ID");

    //console.log(newUpdates);
    return newUpdates
  }
  w.addCapsuleGeometryPhysics = (
    physics,
    position,
    quaternion,
    radius,
    halfHeight,
    materialAddress,
    id,
    dynamic,
    flags = {}
  ) => {
    /* if (typeof materialAddress !== 'number') {
      debugger;
    } */

    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)
    const q = allocator.alloc(Float32Array, 4)

    position.toArray(p)
    quaternion.toArray(q)

    const flagsInt = (+flags.physics << 0) | (+flags.ccd << 1)
    Module._addCapsuleGeometryPhysics(
      physics,
      p.byteOffset,
      q.byteOffset,
      radius,
      halfHeight,
      materialAddress,
      id,
      +dynamic,
      flagsInt
    )
    allocator.freeAll()
  }
  w.addPlaneGeometryPhysics = (
    physics,
    position,
    quaternion,
    id,
    dynamic,
  ) => {
    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)
    const q = allocator.alloc(Float32Array, 4)

    position.toArray(p)
    quaternion.toArray(q)

    const materialAddress = w.getDefaultMaterial(physics);

    Module._addPlaneGeometryPhysics(
      physics,
      p.byteOffset,
      q.byteOffset,
      id,
      materialAddress,
      +dynamic,
    )
    allocator.freeAll()
  }
  w.addBoxGeometryPhysics = (
    physics,
    position,
    quaternion,
    size,
    id,
    dynamic,
    groupId = -1 // if not equal to -1, this BoxGeometry will not collide with CharacterController.
  ) => {
    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)
    const q = allocator.alloc(Float32Array, 4)
    const s = allocator.alloc(Float32Array, 3)

    position.toArray(p)
    quaternion.toArray(q)
    size.toArray(s)

    const materialAddress = w.getDefaultMaterial(physics);

    Module._addBoxGeometryPhysics(
      physics,
      p.byteOffset,
      q.byteOffset,
      s.byteOffset,
      id,
      materialAddress,
      +dynamic,
      groupId,
    )
    allocator.freeAll()
  }
  w.createCharacterControllerPhysics = (
    physics,
    radius,
    height,
    contactOffset,
    stepOffset,
    position,
    id
  ) => {
    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)

    position.toArray(p)

    const zeroMaterial = w.getZeroMaterial(physics);

    const characterController =
      Module._createCharacterControllerPhysics(
        physics,
        radius,
        height,
        contactOffset,
        stepOffset,
        p.byteOffset,
        zeroMaterial,
        id
      )
    allocator.freeAll()

    return characterController
  }
  w.destroyCharacterControllerPhysics = (physics, characterController) => {
    Module._destroyCharacterControllerPhysics(
      physics,
      characterController
    )
  }
  w.moveCharacterControllerPhysics = (
    physics,
    characterController,
    displacement,
    minDist,
    elapsedTime,
    outPosition
  ) => {
    const allocator = new Allocator(Module)
    const disp = allocator.alloc(Float32Array, 3)
    const outPositions = allocator.alloc(Float32Array, 3)

    displacement.toArray(disp)

    const flags = Module._moveCharacterControllerPhysics(
      physics,
      characterController,
      disp.byteOffset,
      minDist,
      elapsedTime,
      outPositions.byteOffset
    )
    outPosition.fromArray(outPositions)

    // console.log('got flags', flags);

    allocator.freeAll()

    return flags
  }
  w.setCharacterControllerPositionPhysics = (
    physics,
    characterController,
    position
  ) => {
    const allocator = new Allocator(Module)
    const p = allocator.alloc(Float32Array, 3)

    position.toArray(p)

    Module._setCharacterControllerPositionPhysics(
      physics,
      characterController,
      p.byteOffset
    )
    allocator.freeAll()
  }

  //

  w.marchingCubes = (dims, potential, shift, scale) => {
    let allocator = new Allocator(Module)

    const dimsTypedArray = allocator.alloc(Int32Array, 3)
    dimsTypedArray.set(dims)

    const potentialTypedArray = allocator.alloc(Float32Array, potential.length)
    potentialTypedArray.set(potential)

    const shiftTypedArray = allocator.alloc(Float32Array, 3)
    shiftTypedArray.set(shift)

    const scaleTypedArray = allocator.alloc(Float32Array, 3)
    scaleTypedArray.set(scale)

    const outputBufferOffset = Module._doMarchingCubes(
      dimsTypedArray.byteOffset,
      potentialTypedArray.byteOffset,
      shiftTypedArray.byteOffset,
      scaleTypedArray.byteOffset
    )

    allocator.freeAll()

    const head = outputBufferOffset / 4

    const positionCount = Module.HEAP32[head]
    const faceCount = Module.HEAP32[head + 1]
    const positions = Module.HEAPF32.slice(
      head + 2,
      head + 2 + positionCount
    )
    const faces = Module.HEAPU32.slice(
      head + 2 + positionCount,
      head + 2 + positionCount + faceCount
    )

    Module._doFree(outputBufferOffset)

    return {
      positionCount: positionCount,
      faceCount: faceCount,
      positions: positions,
      faces: faces,
    }
  }

  return w;
})()

physx.physxWorker = physxWorker

const _updateGeometry = () => {
  physx.crosshairMesh.update()

  physxWorker.update()
}
physx.update = _updateGeometry

export default physx
