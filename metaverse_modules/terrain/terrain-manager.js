import * as THREE from 'three';
import {
  terrainMaterial
} from './toonMaterial.js';

const VERTEX_BIOME_SIZE = 8; // using 8 values for verterx biomes, 4 biomes and their weights

export class TerrainManager {
  constructor(chunkSize, chunkCount, chunkCountHeight, geometryUtils, renderer) {
    this.chunkSize = chunkSize;
    this.geometryUtils = geometryUtils;
    this.center = new THREE.Vector3();
    this.halfChunkCountMinusOne = Number.parseInt(chunkCount / 2);
    this.chunkCount = this.halfChunkCountMinusOne * 2 + 1; // chunk count should be odd
    this.halfChunkCountMinusOneHeight = Number.parseInt(chunkCountHeight / 2);
    this.chunkCountHeight = this.halfChunkCountMinusOneHeight * 2 + 1; // chunk count should be odd
    this.totalChunkCount = (this.chunkCount ** 2) * this.chunkCountHeight;
    this.segment = 16;

    this.targetChunkIds = this._calculateTargetChunks();
    this.currentChunks = [];

    /*
     * if following parameters are too small, memory areas of chunks can be overlaid
     * if too big, memory will be over allocated;
     */
    this.vertexBufferSizeParam = 5;
    this.indexBufferSizeParam = 10;

    this.onAddChunk = () => {};
    this.onRemoveChunks = () => {};

    this.renderer = renderer;
    this.stagedChunkIds = [];

    this.init();
  }

  init() {
    const cellCount = this.totalChunkCount * (this.segment ** 3);
    const maxVertexCount = cellCount * this.vertexBufferSizeParam;
    const maxIndexCount = cellCount * this.indexBufferSizeParam;

    this.chunkVertexRanges = [];
    this.chunkIndexRanges = [];
    for (let i = 0; i < this.totalChunkCount; i++) {
      this.chunkVertexRanges.push({offset: -1, size: -1});
      this.chunkIndexRanges.push({offset: -1, size: -1});
    }

    this.vertexFreeRanges = [{offset: 0, size: maxVertexCount}];
    this.indexFreeRanges = [{offset: 0, size: maxIndexCount}];

    this.bufferFactory = {};

    this.bufferFactory.positions = new Float32Array(maxVertexCount * 3);
    this.bufferFactory.normals = new Float32Array(maxVertexCount * 3);
    this.bufferFactory.biomes = new Float32Array(maxVertexCount * VERTEX_BIOME_SIZE);
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
    this.biomeAttributeBuffer.stride = VERTEX_BIOME_SIZE;
    this.count = this.bufferFactory.biomes.length;
    this.biomeAttribute = new THREE.InterleavedBufferAttribute();
    this.biomeAttribute.data = this.biomeAttributeBuffer;
    this.biomeAttribute.offset = 0;
    this.biomeAttribute.itemSize = 4;

    this.biomeWeightAttributeBuffer = new THREE.InterleavedBuffer();
    this.biomeWeightAttributeBuffer.array = this.bufferFactory.biomes;
    this.biomeWeightAttributeBuffer.stride = VERTEX_BIOME_SIZE;
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

    for (let i = 0; i < this.totalChunkCount; i++) {
      this.geometry.addGroup(this.chunkIndexRanges[i].offset, this.chunkIndexRanges[i].size, 0);
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
  }

  _calculateTargetChunks() {
    // chunk id will be ox:oy:oz format

    const centerChunkGridX = Math.floor(this.center.x / this.chunkSize);
    const centerChunkGridY = Math.floor(this.center.y / this.chunkSize);
    const centerChunkGridZ = Math.floor(this.center.z / this.chunkSize);

    const targetChunks = [];

    for (let i = centerChunkGridX - this.halfChunkCountMinusOne; i < centerChunkGridX + this.halfChunkCountMinusOne + 1; i++) {
      for (let j = centerChunkGridY - this.halfChunkCountMinusOneHeight; j < centerChunkGridY + this.halfChunkCountMinusOneHeight + 1; j++) {
        for (let k = centerChunkGridZ - this.halfChunkCountMinusOne; k < centerChunkGridZ + this.halfChunkCountMinusOne + 1; k++) {
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
    // when the center is changed, we need to update the target chunks around the center
    this.targetChunkIds = this._calculateTargetChunks();
  }

  async updateChunk() {
    const chunkIdToAdd = this.targetChunkIds
      .filter(id => !this.currentChunks.map(v => v.chunkId).includes(id))
      .filter(id => !this.stagedChunkIds.includes(id))
      .at(0);

    if (chunkIdToAdd === undefined) {
      return;
    }

    const chunksToRemove = this.currentChunks.filter(chunk => !this.targetChunkIds.includes(chunk.chunkId));

    for (const chunk of chunksToRemove) {
      this.vertexFreeRanges = this._freeRange(this.vertexFreeRanges, this.chunkVertexRanges[chunk.rangeIndex]);
      this.indexFreeRanges = this._freeRange(this.indexFreeRanges, this.chunkIndexRanges[chunk.rangeIndex]);
      this.chunkVertexRanges[chunk.rangeIndex] = {offset: -1, size: -1};
      this.chunkIndexRanges[chunk.rangeIndex] = {offset: -1, size: -1};
      this.currentChunks = this.currentChunks.filter(c => c !== chunk);
    }

    // this.currentChunks = this.currentChunks.filter(chunk => this.targetChunkIds.includes(chunk.chunkId));

    if (chunkIdToAdd) {
      const [ox, oy, oz] = chunkIdToAdd.split(':');

      this.stagedChunkIds.push(chunkIdToAdd);

      this.geometryUtils.generateChunk(
        ox * this.chunkSize, oy * this.chunkSize, oz * this.chunkSize, this.chunkSize, this.segment
      ).then(output => {
        const rangeIndex = this.chunkVertexRanges.findIndex(r => r.size === -1);
        // const indexSlot = this.chunkIndexRanges.findIndex(r => r.size === -1);
        const vertexFreeRangeIndex = this.vertexFreeRanges.findIndex(r => r.size > output.positions.length);
        const vertexOffset = this.vertexFreeRanges[vertexFreeRangeIndex].offset;
        const indexFreeRangeIndex = this.indexFreeRanges.findIndex(r => r.size > output.indices.length);
        const indexOffset = this.indexFreeRanges[indexFreeRangeIndex].offset;

        // shift vertex indices
        for (let i = 0; i < output.indices.length; i++) {
          output.indices[i] += vertexOffset;
        }

        this.bufferFactory.positions.set(output.positions, vertexOffset * 3);
        this.bufferFactory.normals.set(output.normals, vertexOffset * 3);
        this.bufferFactory.biomes.set(output.biomes, vertexOffset * VERTEX_BIOME_SIZE);
        this.bufferFactory.indices.set(output.indices, indexOffset);

        this.chunkVertexRanges[rangeIndex] = {offset: vertexOffset, size: output.vertexCount};
        this.chunkIndexRanges[rangeIndex] = {offset: indexOffset, size: output.indexCount};

        this.vertexFreeRanges[vertexFreeRangeIndex].offset += output.vertexCount;
        this.vertexFreeRanges[vertexFreeRangeIndex].size -= output.vertexCount;
        this.indexFreeRanges[indexFreeRangeIndex].offset += output.indexCount;
        this.indexFreeRanges[indexFreeRangeIndex].size -= output.indexCount;

        this.currentChunks.push({rangeIndex: rangeIndex, chunkId: chunkIdToAdd});
        this.stagedChunkIds = this.stagedChunkIds.filter(id => id !== chunkIdToAdd);
        this._updateChunkGeometry(rangeIndex);
        this.onAddChunk(chunkIdToAdd);
      }).catch(error => {
        this.stagedChunkIds = this.stagedChunkIds.filter(id => id !== chunkIdToAdd);
        console.log('>>> error: ', error);
      });
    }
  }

  _updateChunkGeometry(rangeIndex) {
    if (this.chunkVertexRanges[rangeIndex].size === 0) {
      return;
    }

    this.indexAttribute.updateRange = {
      offset: this.chunkIndexRanges[rangeIndex].offset,
      count: this.chunkIndexRanges[rangeIndex].size,
    };
    this.indexAttribute.version++;

    this.positionAttribute.updateRange = {
      offset: this.chunkVertexRanges[rangeIndex].offset * 3,
      count: this.chunkVertexRanges[rangeIndex].size * 3,
    };
    this.positionAttribute.version++;

    this.normalAttribute.updateRange = {
      offset: this.chunkVertexRanges[rangeIndex].offset * 3,
      count: this.chunkVertexRanges[rangeIndex].size * 3,
    };
    this.normalAttribute.version++;

    this.biomeAttributeBuffer.updateRange = {
      offset: this.chunkVertexRanges[rangeIndex].offset * VERTEX_BIOME_SIZE,
      count: this.chunkVertexRanges[rangeIndex].size * VERTEX_BIOME_SIZE,
    };
    this.biomeAttributeBuffer.version++;

    this.biomeWeightAttributeBuffer.updateRange = {
      offset: this.chunkVertexRanges[rangeIndex].offset * VERTEX_BIOME_SIZE,
      count: this.chunkVertexRanges[rangeIndex].size * VERTEX_BIOME_SIZE,
    };
    this.biomeWeightAttributeBuffer.version++;

    this.geometry.clearGroups();
    for (let i = 0; i < this.totalChunkCount; i++) {
      this.geometry.addGroup(this.chunkIndexRanges[i].offset, this.chunkIndexRanges[i].size, 0);
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

    if (this.chunkVertexRanges[rangeIndex].size === 0) {
      return null;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = this.bufferFactory.positions.subarray(
      this.chunkVertexRanges[rangeIndex].offset * 3,
      this.chunkVertexRanges[rangeIndex].offset * 3 + this.chunkVertexRanges[rangeIndex].size * 3
    );

    const indices = this.bufferFactory.indices.slice(
      this.chunkIndexRanges[rangeIndex].offset,
      this.chunkIndexRanges[rangeIndex].offset + this.chunkIndexRanges[rangeIndex].size
    );

    for (let i = 0; i < indices.length; i++) {
      indices[i] -= this.chunkVertexRanges[rangeIndex].offset;
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
