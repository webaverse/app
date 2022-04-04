import * as THREE from 'three';
import { terrainMaterial } from './toonMaterial.js';

export class TerrainManager {

	constructor(chunkSize, range, geometryUtils, renderer) {

		this.chunkRange = range;
		this.chunkSize = chunkSize;
		this.geometryUtils = geometryUtils;

		this.center = new THREE.Vector3();
		this.chunkCount = this.chunkRange * 2 + 1;

		this.targetChunkIds = this._calculateTargetChunks();
		this.currentChunks = this.targetChunkIds.map((v, i) => { return { slots: [i, i], chunkId: v } });

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

		let totalChunkCount = this.chunkCount ** 3;
		let cellCount = totalChunkCount * (this.segment ** 2);
		let maxVertexCount = cellCount * this.vertexBufferSizeParam;
		let maxIndexCount = cellCount * this.indexBufferSizeParam;

		this.bufferFactory = {};

		let buf = this.bufferFactory;

		buf.positions = new Float32Array(maxVertexCount * 3);
		buf.normals = new Float32Array(maxVertexCount * 3);
		buf.biomes = new Float32Array(maxVertexCount * 8);
		buf.indices = new Uint32Array(maxIndexCount * 3);
		buf.vertexRanges = new Int32Array(totalChunkCount * 2);
		buf.indexRanges = new Int32Array(totalChunkCount * 2);

		let output = await this.geometryUtils.generateTerrain(
			this.chunkSize, this.chunkCount, this.segment,
			this.vertexBufferSizeParam, this.indexBufferSizeParam,
			[buf.positions, buf.normals, buf.biomes, buf.indices, buf.vertexRanges, buf.indexRanges]
		);

		buf.positions = output.arrays[0];
		buf.normals = output.arrays[1];
		buf.biomes = output.arrays[2];
		buf.indices = output.arrays[3];
		buf.vertexRanges = output.arrays[4];
		buf.indexRanges = output.arrays[5];

		buf.positionBuffer =  output.buffers.positionBuffer,
		buf.normalBuffer =  output.buffers.normalBuffer,
		buf.biomeBuffer =  output.buffers.biomeBuffer,
		buf.indexBuffer =  output.buffers.indexBuffer,
		buf.chunkVertexRangeBuffer =  output.buffers.chunkVertexRangeBuffer,
		buf.vertexFreeRangeBuffer =  output.buffers.vertexFreeRangeBuffer,
		buf.chunkIndexRangeBuffer =  output.buffers.chunkIndexRangeBuffer,
		buf.indexFreeRangeBuffer =  output.buffers.indexFreeRangeBuffer

		this._generateBuffers();


	}

	_generateBuffers() {

		this.geometry = new THREE.BufferGeometry();

		this.indexAttribute = new THREE.Uint32BufferAttribute();
		this.indexAttribute.array = this.bufferFactory.indices;
		this.indexAttribute.itemSize = 1;
		this.indexAttribute.count = this.bufferFactory.indices.length;
		this.indexAttribute.setUsage( THREE.DynamicDrawUsage );

		this.positionAttribute = new THREE.Float32BufferAttribute();
		this.positionAttribute.array = this.bufferFactory.positions;
		this.positionAttribute.itemSize = 3;
		this.positionAttribute.count = this.bufferFactory.positions.length / 3;
		this.positionAttribute.setUsage( THREE.DynamicDrawUsage );

		this.normalAttribute = new THREE.Float32BufferAttribute();
		this.normalAttribute.array = this.bufferFactory.normals;
		this.normalAttribute.itemSize = 3;
		this.normalAttribute.count = this.bufferFactory.normals.length / 3;
		this.normalAttribute.setUsage( THREE.DynamicDrawUsage );

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
				this.bufferFactory.indexRanges[2 * i], this.bufferFactory.indexRanges[2 * i + 1], 0
			);
		}

		this.mesh = new THREE.Mesh(
			this.geometry, [terrainMaterial]
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

		return this.currentChunks.map(chunk => [chunk.chunkId, this.getChunkMesh(chunk.chunkId)]);
	}

	_calculateTargetChunks() {

		let centerChunkGridX = Math.floor(this.center.x / this.chunkSize);
		let centerChunkGridY = Math.floor(this.center.y / this.chunkSize);
		let centerChunkGridZ = Math.floor(this.center.z / this.chunkSize);

		let targetChunks = [];

		for (let i = centerChunkGridX - this.chunkRange; i < centerChunkGridX + this.chunkRange + 1; i++) {
			for (let j = centerChunkGridY - this.chunkRange; j < centerChunkGridY + this.chunkRange + 1; j++) {
				for (let k = centerChunkGridZ - this.chunkRange; k < centerChunkGridZ + this.chunkRange + 1; k++) {
					targetChunks.push(i + ':' + j + ':' + k);
				}
			}
		}

		return targetChunks;
	}

	updateCenter(pos) {

		this.center = pos;

		this.targetChunkIds = this._calculateTargetChunks();
	}

	async updateChunk() {

		const buf = this.bufferFactory;

		let chunkIdToAdd = this.targetChunkIds.filter(
			id => !this.currentChunks.map(v => v.chunkId).includes(id)
		).at(0);

		if (chunkIdToAdd === undefined) {
			return;
		}

		if (buf.positions.byteLength === 0) {
			return;
		}

		let chunksToRemove = this.currentChunks.filter(chunk => !this.targetChunkIds.includes(chunk.chunkId));

		for (let chunk of chunksToRemove) {
			if (buf.vertexRanges.byteLength !== 0) {
				const output = await this.geometryUtils.deallocateChunk(
					chunk.slots[0], chunk.slots[1], this.chunkCount ** 3,
					buf.chunkVertexRangeBuffer,
					buf.vertexFreeRangeBuffer,
					buf.chunkIndexRangeBuffer,
					buf.indexFreeRangeBuffer,
					[buf.vertexRanges, buf.indexRanges]
				);

				buf.vertexRanges = output.arrays[0];
				buf.indexRanges = output.arrays[1];

				this.currentChunks = this.currentChunks.filter(c => c !== chunk);
			}
		}

		// this.currentChunks = this.currentChunks.filter(chunk => this.targetChunkIds.includes(chunk.chunkId));

		if (!!chunkIdToAdd) {
			if (buf.vertexRanges.byteLength === 0) {
				return;
			}

			let gridId = chunkIdToAdd.split(':');

			this.geometryUtils.generateChunk(
				buf.positionBuffer, buf.normalBuffer, buf.biomeBuffer, buf.indexBuffer,
				buf.chunkVertexRangeBuffer,
				buf.vertexFreeRangeBuffer,
				buf.chunkIndexRangeBuffer,
				buf.indexFreeRangeBuffer,
				gridId[0] * this.chunkSize, gridId[1] * this.chunkSize, gridId[2] * this.chunkSize,
				this.chunkSize, this.segment, this.chunkCount ** 3,
				[buf.positions, buf.normals, buf.biomes, buf.indices, buf.vertexRanges, buf.indexRanges]
			).then(output => {
				buf.positions = output.arrays[0];
				buf.normals = output.arrays[1];
				buf.biomes = output.arrays[2];
				buf.indices = output.arrays[3];
				buf.vertexRanges = output.arrays[4];
				buf.indexRanges = output.arrays[5];

				this.positionAttribute.array = buf.positions;
				this.normalAttribute.array = buf.normals;
				this.biomeAttributeBuffer.array = buf.biomes;
				this.biomeWeightAttributeBuffer.array = buf.biomes;
				this.indexAttribute.array = buf.indices;

				this.currentChunks.push({ slots: output.slots, chunkId: chunkIdToAdd });

				this._updateChunkGeometry(output.slots);

				this.onAddChunk(chunkIdToAdd);
			});
		}
	}

	_updateChunkGeometry(slots) {

		const buf = this.bufferFactory;

		if (buf.vertexRanges[2 * slots[0] + 1] === 0) {
			return;
		}

		this.indexAttribute.updateRange = {
			offset: buf.indexRanges[slots[1] * 2],
			count: buf.indexRanges[slots[1] * 2 + 1]
		};
		// this.indexAttribute.needsUpdate = true;
		this.indexAttribute.version++;

		this.positionAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3,
		};
		// this.positionAttribute.needsUpdate = true;
		this.positionAttribute.version++;

		this.normalAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3,
		};
		// this.normalAttribute.needsUpdate = true;
		this.normalAttribute.version++;

		this.biomeAttributeBuffer.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 8,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 8,
		};
		// this.biomeAttribute.needsUpdate = true;
		this.biomeAttributeBuffer.version++;

		this.biomeWeightAttributeBuffer.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 8,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 8,
		};
		// this.biomeWeightAttribute.needsUpdate = true;
		this.biomeWeightAttributeBuffer.version++;

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount ** 3; i++) {
			this.geometry.addGroup(
				buf.indexRanges[i * 2],
				buf.indexRanges[i * 2 + 1],
				0
			);
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

		let slots = this.currentChunks.filter(chunk => chunk.chunkId == chunkId)[0].slots;

		if (buf.vertexRanges[2 * slots[0] + 1] === 0) {
			return null;
		}

		let geometry = new THREE.BufferGeometry();
		let positions = buf.positions.subarray(
			buf.vertexRanges[2 * slots[0]] * 3,
			buf.vertexRanges[2 * slots[0]] * 3 + buf.vertexRanges[2 * slots[0] + 1] * 3
		);

		let indices = buf.indices.slice(
			buf.indexRanges[2 * slots[1]],
			buf.indexRanges[2 * slots[1]] + buf.indexRanges[2 * slots[1] + 1]
		);

		for (let i = 0; i < indices.length; i++) {
			indices[i] -= buf.vertexRanges[2 * slots[0]];
		}

		geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
		geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));

		const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false }));

		return mesh;
	}

}
