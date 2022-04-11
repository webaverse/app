import * as THREE from 'three';
import {
  terrainMaterial
} from './toonMaterial.js';

export class TerrainManager {
  constructor(chunkSize, range, geometryUtils, renderer) {
    this.chunkRange = range;
    this.chunkSize = chunkSize;
    this.geometryUtils = geometryUtils;

    this.center = new THREE.Vector3();
    this.chunkCount = this.chunkRange * 2 + 1;

    this.targetChunkIds = this._calculateTargetChunks();
    this.currentChunks = this.targetChunkIds.map((v, i) => {
      return {slots: [i, i], chunkId: v};
    });

    this.segment = 16;

    /*
     * if following parameters are too small, memory areas of chunks can be overlaid
     * if too big, memory will be over allocated;
     */
    this.vertexBufferSizeParam = 20;
    this.indexBufferSizeParam = 20;

    this.onAddChunk = () => {};
    this.onRemoveChunks = () => {};

    this.renderer = renderer;
    // this.init();
  }

  async init() {
    const totalChunkCount = this.chunkCount ** 3;
    const cellCount = totalChunkCount * (this.segment ** 2);
    const maxVertexCount = cellCount * this.vertexBufferSizeParam;
    const maxIndexCount = cellCount * this.indexBufferSizeParam;

    this.bufferFactory = {};

    const buf = this.bufferFactory;

    buf.positions = new Float32Array(maxVertexCount * 3);
    buf.normals = new Float32Array(maxVertexCount * 3);
    buf.biomes = new Float32Array(maxVertexCount * 8);
    buf.indices = new Uint32Array(maxIndexCount);
    buf.vertexRanges = new Int32Array(totalChunkCount * 2);
    buf.indexRanges = new Int32Array(totalChunkCount * 2);

    const output = await this.geometryUtils.generateTerrain(
      this.chunkSize, this.chunkCount, this.segment,
      this.vertexBufferSizeParam, this.indexBufferSizeParam,
      [buf.positions, buf.normals, buf.biomes, buf.indices, buf.vertexRanges, buf.indexRanges]
    );

    buf.positions = output.arrays[0];
    buf.normals = output.arrays[1];
    buf.biomes = output.arrays[2];
    buf.indices = output.arrays[3];
    buf.vertexRanges = this._makeRanges(output.arrays[4]);
    buf.indexRanges = this._makeRanges(output.arrays[5]);

    // buf.positionBuffer = output.buffers.positionBuffer,
    //   buf.normalBuffer = output.buffers.normalBuffer,
    //   buf.biomeBuffer = output.buffers.biomeBuffer,
    //   buf.indexBuffer = output.buffers.indexBuffer,

    //   buf.chunkVertexRangeBuffer = this._makeRanges(output.buffers.chunkVertexRangeBuffer);
    // buf.vertexFreeRangeBuffer = this._makeRanges(output.buffers.vertexFreeRangeBuffer);
    // buf.chunkIndexRangeBuffer = this._makeRanges(output.buffers.chunkIndexRangeBuffer);
    // buf.indexFreeRangeBuffer = this._makeRanges(output.buffers.indexFreeRangeBuffer);

    let totalVertexCount = 0;
    let totalIndexCount = 0;
    buf.vertexRanges.forEach(r => { totalVertexCount += r.size; });
    buf.indexRanges.forEach(r => { totalIndexCount += r.size; });

    buf.vertexFreeRanges = [{
      offset: totalVertexCount,
      size: maxVertexCount - totalVertexCount
    }];
    buf.indexFreeRanges = [{
      offset: totalIndexCount,
      size: maxIndexCount - totalIndexCount
    }];

    this._generateBuffers();

    this.chunkGenerated = true;
  }

  _makeRanges(buffer) {
    const ranges = [];

    for (let i = 0; i < buffer.length / 2; i++) {
      ranges.push({offset: buffer[2 * i], size: buffer[2 * i + 1]});
    }

    return ranges;
  }

  _generateBuffers() {
    this.geometry = new THREE.BufferGeometry();

    this.indexAttribute = new THREE.Uint32BufferAttribute();
    this.indexAttribute.array = this.bufferFactory.indices;
    this.indexAttribute.itemSize = 1;
    this.indexAttribute.count = this.bufferFactory.indices.length;
    this.indexAttribute.setUsage(THREE.DynamicDrawUsage);

    this.positionAttribute = new THREE.Float32BufferAttribute();
    this.positionAttribute.array = this.bufferFactory.positions;
    this.positionAttribute.itemSize = 3;
    this.positionAttribute.count = this.bufferFactory.positions.length / 3;
    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);

    this.normalAttribute = new THREE.Float32BufferAttribute();
    this.normalAttribute.array = this.bufferFactory.normals;
    this.normalAttribute.itemSize = 3;
    this.normalAttribute.count = this.bufferFactory.normals.length / 3;
    this.normalAttribute.setUsage(THREE.DynamicDrawUsage);

    this.biomeAttributeBuffer = new THREE.InterleavedBuffer();
    this.biomeAttributeBuffer.array = this.bufferFactory.biomes;
    this.biomeAttributeBuffer.stride = 8;
    this.count = this.bufferFactory.biomes.length;
    this.biomeAttribute = new THREE.InterleavedBufferAttribute();
    this.biomeAttribute.data = this.biomeAttributeBuffer;
    this.biomeAttribute.offset = 0;
    this.biomeAttribute.itemSize = 4;

    this.biomeWeightAttributeBuffer = new THREE.InterleavedBuffer();
    this.biomeWeightAttributeBuffer.array = this.bufferFactory.biomes;
    this.biomeWeightAttributeBuffer.stride = 8;
    this.count = this.bufferFactory.biomes.length;
    this.biomeWeightAttribute = new THREE.InterleavedBufferAttribute();
    this.biomeWeightAttribute.data = this.biomeWeightAttributeBuffer;
    this.biomeWeightAttribute.offset = 4;
    this.biomeWeightAttribute.itemSize = 4;

    this.geometry.setIndex(this.indexAttribute);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('normal', this.normalAttribute);
    this.geometry.setAttribute('biome', this.biomeAttribute);
    this.geometry.setAttribute('biomeWeight', this.biomeWeightAttribute);

    this.geometry.clearGroups();

    for (let i = 0; i < this.chunkCount ** 3; i++) {
      this.geometry.addGroup(
        this.bufferFactory.indexRanges[i].offset, this.bufferFactory.indexRanges[i].size, 0
      );
    }

    this.mesh = new THREE.Mesh(
      this.geometry, [new THREE.MeshPhongMaterial({color: 0x00ff00})] // [terrainMaterial]
    );

    this.mesh.frustumCulled = false;

    const arrayBufferType = this.renderer.getContext().ARRAY_BUFFER;
    const elementBufferType = this.renderer.getContext().ELEMENT_ARRAY_BUFFER;

    this.renderer.getWebGLAttributes().update(this.positionAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.normalAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.biomeAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.indexAttribute, elementBufferType);
  }

  getInitialChunkMeshes() {
    return [];
    // return this.currentChunks.map(chunk => [chunk.chunkId, this.getChunkMesh(chunk.chunkId)]);
  }

  _calculateTargetChunks() {
    const centerChunkGridX = Math.floor(this.center.x / this.chunkSize);
    const centerChunkGridY = Math.floor(this.center.y / this.chunkSize);
    const centerChunkGridZ = Math.floor(this.center.z / this.chunkSize);

    const targetChunks = [];

    for (let i = centerChunkGridX - this.chunkRange; i < centerChunkGridX + this.chunkRange + 1; i++) {
      for (let j = centerChunkGridY - this.chunkRange; j < centerChunkGridY + this.chunkRange + 1; j++) {
        for (let k = centerChunkGridZ - this.chunkRange; k < centerChunkGridZ + this.chunkRange + 1; k++) {
          targetChunks.push(i + ':' + j + ':' + k);
        }
      }
    }

    return targetChunks;
  }

  _freeRangeBuffer(ranges, range) {
    ranges.push(range);
    ranges.sort((a, b) => a.offset - b.offset);

    for (let i = 0; i < ranges.length - 1; i++) {
      if (ranges[i].size === 0) {
        continue;
      }
      for (let j = i + 1; j < ranges.length; j++) {
        if (ranges[j].size === 0) {
          continue;
        }
        if (ranges[i].offset + ranges[i].size === ranges[j].offset) {
          ranges[i].size += ranges[j].size;
          ranges[j].size = 0;
        }
      }
    }

    return ranges.filter(r => r.size !== 0);
  }

  updateCenter(pos) {
    this.center = pos;
    this.targetChunkIds = this._calculateTargetChunks();
  }

  async updateChunk() {
    const buf = this.bufferFactory;

    const chunkIdToAdd = this.targetChunkIds.filter(
      id => !this.currentChunks.map(v => v.chunkId).includes(id)
    ).at(0);

    if (chunkIdToAdd === undefined) {
      return;
    }

    // if (buf.positions.byteLength === 0) {
    //   return;
    // }

    const chunksToRemove = this.currentChunks.filter(chunk => !this.targetChunkIds.includes(chunk.chunkId));

    for (const chunk of chunksToRemove) {
      if (buf.vertexRanges.byteLength !== 0) {
        // const output = await this.geometryUtils.deallocateChunk(
        //  chunk.slots[0], chunk.slots[1], this.chunkCount ** 3,
        //  buf.chunkVertexRangeBuffer,
        //  buf.vertexFreeRangeBuffer,
        //  buf.chunkIndexRangeBuffer,
        //  buf.indexFreeRangeBuffer,
        //  [buf.vertexRanges, buf.indexRanges]
        // );

        // buf.vertexRanges = output.arrays[0];
        // buf.indexRanges = output.arrays[1];
        buf.vertexFreeRanges = this._freeRangeBuffer(buf.vertexFreeRanges, buf.vertexRanges[chunk.slots[0]]);
        buf.indexFreeRanges = this._freeRangeBuffer(buf.indexFreeRanges, buf.indexRanges[chunk.slots[1]]);
        buf.vertexRanges[chunk.slots[0]] = {offset: -1, size: -1};
        buf.indexRanges[chunk.slots[1]] = {offset: -1, size: -1};
        this.currentChunks = this.currentChunks.filter(c => c !== chunk);
      }
    }

    // this.currentChunks = this.currentChunks.filter(chunk => this.targetChunkIds.includes(chunk.chunkId));

    if (chunkIdToAdd) {
      if (!this.chunkGenerated) {
        return;
      }

      // if (buf.vertexRanges.byteLength === 0) {
      //  return;
      // }

      const gridId = chunkIdToAdd.split(':');

      // this.geometryUtils.generateAndAllocateChunk(
      //  buf.positionBuffer, buf.normalBuffer, buf.biomeBuffer, buf.indexBuffer,
      //  buf.chunkVertexRangeBuffer,
      //  buf.vertexFreeRangeBuffer,
      //  buf.chunkIndexRangeBuffer,
      //  buf.indexFreeRangeBuffer,
      //  gridId[0] * this.chunkSize, gridId[1] * this.chunkSize, gridId[2] * this.chunkSize,
      //  this.chunkSize, this.segment, this.chunkCount ** 3,
      //  [buf.positions, buf.normals, buf.biomes, buf.indices, buf.vertexRanges, buf.indexRanges]
      // ).then(output => {
      //  buf.positions = output.arrays[0];
      //  buf.normals = output.arrays[1];
      //  buf.biomes = output.arrays[2];
      //  buf.indices = output.arrays[3];
      //  buf.vertexRanges = output.arrays[4];
      //  buf.indexRanges = output.arrays[5];

      //  this.positionAttribute.array = buf.positions;
      //  this.normalAttribute.array = buf.normals;
      //  this.biomeAttributeBuffer.array = buf.biomes;
      //  this.biomeWeightAttributeBuffer.array = buf.biomes;
      //  this.indexAttribute.array = buf.indices;

      //  this.currentChunks.push({ slots: output.slots, chunkId: chunkIdToAdd });

      //  this._updateChunkGeometry(output.slots);

      //  this.onAddChunk(chunkIdToAdd);
      // });

      this.chunkGenerated = false;

      this.geometryUtils.generateChunk(
        gridId[0] * this.chunkSize, gridId[1] * this.chunkSize, gridId[2] * this.chunkSize,
        this.chunkSize, this.segment
      ).then(output => {
        const vertexSlot = buf.vertexRanges.findIndex(r => r.size === -1);
        const indexSlot = buf.indexRanges.findIndex(r => r.size === -1);
        const vertexFreeRangeIndex = buf.vertexFreeRanges.findIndex(r => r.size > output.positions.length);
        const vertexOffset = buf.vertexFreeRanges[vertexFreeRangeIndex].offset;
        const indexFreeRangeIndex = buf.indexFreeRanges.findIndex(r => r.size > output.indices.length);
        const indexOffset = buf.indexFreeRanges[indexFreeRangeIndex].offset;
        if (vertexFreeRangeIndex === -1 || indexFreeRangeIndex === -1) {
          // debugger
        }

        // shift vertex indices
        for (let i = 0; i < output.indices.length; i++) {
          output.indices[i] += vertexOffset;
        }

        buf.positions.set(output.positions, vertexOffset * 3);
        buf.normals.set(output.normals, vertexOffset * 3);
        buf.biomes.set(output.biomes, vertexOffset * 8);
        buf.indices.set(output.indices, indexOffset);

        buf.vertexRanges[vertexSlot] = {offset: vertexOffset, size: output.positionCount};
        buf.indexRanges[indexSlot] = {offset: indexOffset, size: output.indexCount};

        buf.vertexFreeRanges[vertexFreeRangeIndex].offset += output.positionCount;
        buf.vertexFreeRanges[vertexFreeRangeIndex].size -= output.positionCount;
        buf.indexFreeRanges[indexFreeRangeIndex].offset += output.indexCount;
        buf.indexFreeRanges[indexFreeRangeIndex].size -= output.indexCount;

        this.currentChunks.push({slots: [vertexSlot, indexSlot], chunkId: chunkIdToAdd});
        this._updateChunkGeometry([vertexSlot, indexSlot]);
        this.chunkGenerated = true;
        // this.onAddChunk(chunkIdToAdd);
      });
    }
  }

  _updateChunkGeometry(slots) {
    const buf = this.bufferFactory;

    if (buf.vertexRanges[slots[0]].size === 0) {
      return;
    }

    this.indexAttribute.updateRange = {
      offset: buf.indexRanges[slots[1]].offset,
      count: buf.indexRanges[slots[1]].size,
    };
    // this.indexAttribute.needsUpdate = true;
    this.indexAttribute.version++;

    this.positionAttribute.updateRange = {
      offset: buf.vertexRanges[slots[0]].offset * 3,
      count: buf.vertexRanges[slots[0]].size * 3,
    };
    // this.positionAttribute.needsUpdate = true;
    this.positionAttribute.version++;

    this.normalAttribute.updateRange = {
      offset: buf.vertexRanges[slots[0]].offset * 3,
      count: buf.vertexRanges[slots[0]].size * 3,
    };
    // this.normalAttribute.needsUpdate = true;
    this.normalAttribute.version++;

    this.biomeAttributeBuffer.updateRange = {
      offset: buf.vertexRanges[slots[0]].offset * 8,
      count: buf.vertexRanges[slots[0]].size * 8,
    };
    // this.biomeAttribute.needsUpdate = true;
    this.biomeAttributeBuffer.version++;

    this.biomeWeightAttributeBuffer.updateRange = {
      offset: buf.vertexRanges[slots[0]].offset * 8,
      count: buf.vertexRanges[slots[0]].size * 8,
    };
    // this.biomeWeightAttribute.needsUpdate = true;
    this.biomeWeightAttributeBuffer.version++;

    this.geometry.clearGroups();

    for (let i = 0; i < this.chunkCount ** 3; i++) {
      this.geometry.addGroup(buf.indexRanges[i].offset, buf.indexRanges[i].size, 0);
    }

    const arrayBufferType = this.renderer.getContext().ARRAY_BUFFER;
    const elementBufferType = this.renderer.getContext().ELEMENT_ARRAY_BUFFER;

    this.renderer.getWebGLAttributes().update(this.positionAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.normalAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.biomeAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.biomeWeightAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.indexAttribute, elementBufferType);
  }

  getChunkMesh(chunkId) {
    const buf = this.bufferFactory;
    const slots = this.currentChunks.filter(chunk => chunk.chunkId === chunkId)[0].slots;

    if (buf.vertexRanges[slots[0]].size === 0) {
      return null;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = buf.positions.subarray(
      buf.vertexRanges[slots[0]].offset * 3,
      buf.vertexRanges[slots[0]].offset * 3 + buf.vertexRanges[slots[0]].size * 3
    );

    const indices = buf.indices.slice(
      buf.indexRanges[slots[1]].offset,
      buf.indexRanges[slots[1]].offset + buf.indexRanges[slots[1]].size
    );

    for (let i = 0; i < indices.length; i++) {
      indices[i] -= buf.vertexRanges[slots[0]].offset;
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));

    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: false,
    }));

    return mesh;
  }
}
