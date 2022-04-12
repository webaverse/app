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
    // this.currentChunks = this.targetChunkIds.map((v, i) => {
    //   return {rangeIndex: [i, i], chunkId: v};
    // });

    this.currentChunks = [];

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
    this.stagedChunkIds = [];
    // this.init();
  }

  async init() {
    const totalChunkCount = this.chunkCount ** 3;
    const cellCount = totalChunkCount * (this.segment ** 2);
    const maxVertexCount = cellCount * this.vertexBufferSizeParam;
    const maxIndexCount = cellCount * this.indexBufferSizeParam;

    this.vertexRanges = [];
    this.indexRanges = [];
    for (let i = 0; i < totalChunkCount; i++) {
      this.vertexRanges.push({offset: -1, size: -1});
      this.indexRanges.push({offset: -1, size: -1});
    }

    this.vertexFreeRanges = [{offset: 0, size: maxVertexCount}];
    this.indexFreeRanges = [{offset: 0, size: maxIndexCount}];

    this.bufferFactory = {};

    this.bufferFactory.positions = new Float32Array(maxVertexCount * 3);
    this.bufferFactory.normals = new Float32Array(maxVertexCount * 3);
    this.bufferFactory.biomes = new Float32Array(maxVertexCount * 8);
    this.bufferFactory.indices = new Uint32Array(maxIndexCount);

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
      this.geometry.addGroup(this.indexRanges[i].offset, this.indexRanges[i].size, 0);
    }

    const arrayBufferType = this.renderer.getContext().ARRAY_BUFFER;
    const elementBufferType = this.renderer.getContext().ELEMENT_ARRAY_BUFFER;

    this.renderer.getWebGLAttributes().update(this.positionAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.normalAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.biomeAttribute, arrayBufferType);
    this.renderer.getWebGLAttributes().update(this.indexAttribute, elementBufferType);

    this.mesh = new THREE.Mesh(
      this.geometry, [new THREE.MeshPhongMaterial({color: 0x00ff00})] // [terrainMaterial]
    );
    this.mesh.frustumCulled = false;

    // const output = await this.geometryUtils.generateTerrain(
    //   this.chunkSize, this.chunkCount, this.segment,
    //   this.vertexBufferSizeParam, this.indexBufferSizeParam,
    //   [buf.positions, buf.normals, buf.biomes, buf.indices, buf.vertexRanges, buf.indexRanges]
    // );

    // buf.positions = output.arrays[0];
    // buf.normals = output.arrays[1];
    // buf.biomes = output.arrays[2];
    // buf.indices = output.arrays[3];
    // buf.vertexRanges = this._makeRanges(output.arrays[4]);
    // buf.indexRanges = this._makeRanges(output.arrays[5]);

    // let totalVertexCount = 0;
    // let totalIndexCount = 0;
    // buf.vertexRanges.forEach(r => { totalVertexCount += r.size; });
    // buf.indexRanges.forEach(r => { totalIndexCount += r.size; });

    // buf.vertexFreeRanges = [{
    //   offset: totalVertexCount,
    //   size: maxVertexCount - totalVertexCount
    // }];
    // buf.indexFreeRanges = [{
    //   offset: totalIndexCount,
    //   size: maxIndexCount - totalIndexCount
    // }];

    // this._initGeometry();
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

  _freeRange(ranges, range) {
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

    const chunkIdToAdd = this.targetChunkIds
      .filter(id => !this.currentChunks.map(v => v.chunkId).includes(id))
      .filter(id => !this.stagedChunkIds.includes(id))
      .at(0);

    if (chunkIdToAdd === undefined) {
      return;
    }

    const chunksToRemove = this.currentChunks.filter(chunk => !this.targetChunkIds.includes(chunk.chunkId));

    for (const chunk of chunksToRemove) {
      this.vertexFreeRanges = this._freeRange(this.vertexFreeRanges, this.vertexRanges[chunk.rangeIndex]);
      this.indexFreeRanges = this._freeRange(this.indexFreeRanges, this.indexRanges[chunk.rangeIndex]);
      this.vertexRanges[chunk.rangeIndex] = {offset: -1, size: -1};
      this.indexRanges[chunk.rangeIndex] = {offset: -1, size: -1};
      this.currentChunks = this.currentChunks.filter(c => c !== chunk);
    }

    // this.currentChunks = this.currentChunks.filter(chunk => this.targetChunkIds.includes(chunk.chunkId));

    if (chunkIdToAdd) {
      const gridId = chunkIdToAdd.split(':');

      this.stagedChunkIds.push(chunkIdToAdd);

      this.geometryUtils.generateChunk(
        gridId[0] * this.chunkSize, gridId[1] * this.chunkSize, gridId[2] * this.chunkSize,
        this.chunkSize, this.segment
      ).then(output => {
        const rangeIndex = this.vertexRanges.findIndex(r => r.size === -1);
        // const indexSlot = this.indexRanges.findIndex(r => r.size === -1);
        const vertexFreeRangeIndex = this.vertexFreeRanges.findIndex(r => r.size > output.positions.length);
        const vertexOffset = this.vertexFreeRanges[vertexFreeRangeIndex].offset;
        const indexFreeRangeIndex = this.indexFreeRanges.findIndex(r => r.size > output.indices.length);
        const indexOffset = this.indexFreeRanges[indexFreeRangeIndex].offset;

        // shift vertex indices
        for (let i = 0; i < output.indices.length; i++) {
          output.indices[i] += vertexOffset;
        }

        buf.positions.set(output.positions, vertexOffset * 3);
        buf.normals.set(output.normals, vertexOffset * 3);
        buf.biomes.set(output.biomes, vertexOffset * 8);
        buf.indices.set(output.indices, indexOffset);

        this.vertexRanges[rangeIndex] = {offset: vertexOffset, size: output.positionCount};
        this.indexRanges[rangeIndex] = {offset: indexOffset, size: output.indexCount};

        this.vertexFreeRanges[vertexFreeRangeIndex].offset += output.positionCount;
        this.vertexFreeRanges[vertexFreeRangeIndex].size -= output.positionCount;
        this.indexFreeRanges[indexFreeRangeIndex].offset += output.indexCount;
        this.indexFreeRanges[indexFreeRangeIndex].size -= output.indexCount;

        this.currentChunks.push({rangeIndex: rangeIndex, chunkId: chunkIdToAdd});
        this.stagedChunkIds = this.stagedChunkIds.filter(id => id !== chunkIdToAdd);
        this._updateChunkGeometry(rangeIndex);
        this.onAddChunk(chunkIdToAdd);
      }, error => {
        console.log('>>> error: ', error);
      });
    }
  }

  _updateChunkGeometry(rangeIndex) {
    if (this.vertexRanges[rangeIndex].size === 0) {
      return;
    }

    this.indexAttribute.updateRange = {
      offset: this.indexRanges[rangeIndex].offset,
      count: this.indexRanges[rangeIndex].size,
    };
    this.indexAttribute.version++;

    this.positionAttribute.updateRange = {
      offset: this.vertexRanges[rangeIndex].offset * 3,
      count: this.vertexRanges[rangeIndex].size * 3,
    };
    this.positionAttribute.version++;

    this.normalAttribute.updateRange = {
      offset: this.vertexRanges[rangeIndex].offset * 3,
      count: this.vertexRanges[rangeIndex].size * 3,
    };
    this.normalAttribute.version++;

    this.biomeAttributeBuffer.updateRange = {
      offset: this.vertexRanges[rangeIndex].offset * 8,
      count: this.vertexRanges[rangeIndex].size * 8,
    };
    this.biomeAttributeBuffer.version++;

    this.biomeWeightAttributeBuffer.updateRange = {
      offset: this.vertexRanges[rangeIndex].offset * 8,
      count: this.vertexRanges[rangeIndex].size * 8,
    };
    this.biomeWeightAttributeBuffer.version++;

    this.geometry.clearGroups();
    for (let i = 0; i < this.chunkCount ** 3; i++) {
      this.geometry.addGroup(this.indexRanges[i].offset, this.indexRanges[i].size, 0);
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
    const rangeIndex = this.currentChunks.filter(chunk => chunk.chunkId === chunkId)[0].rangeIndex;

    if (this.vertexRanges[rangeIndex].size === 0) {
      return null;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = this.bufferFactory.positions.subarray(
      this.vertexRanges[rangeIndex].offset * 3,
      this.vertexRanges[rangeIndex].offset * 3 + this.vertexRanges[rangeIndex].size * 3
    );

    const indices = this.bufferFactory.indices.slice(
      this.indexRanges[rangeIndex].offset,
      this.indexRanges[rangeIndex].offset + this.indexRanges[rangeIndex].size
    );

    for (let i = 0; i < indices.length; i++) {
      indices[i] -= this.vertexRanges[rangeIndex].offset;
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
