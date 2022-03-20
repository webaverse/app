import * as THREE from 'three';
import { terrainMaterial } from './material.js';

export class TerrainManager {

	constructor(chunkSize, range, geometryUtils) {

		this.chunkRange = range;
		this.chunkSize = chunkSize;
		this.geometryUtils = geometryUtils;

		this.center = new THREE.Vector3();
		this.chunkCount = this.chunkRange * 2 + 1;

		this.targetChunkIds = this._calculateTargetChunks();
		this.currentChunks = this.targetChunkIds.map((v, i) => { return { slots: [i, i], chunkId: v } });

		this.segment = 32;

		/*
		 * if following parameters are too small, memory areas of chunks can be overlaid
		 * if too big, memory will be over allocated;
		 */
		this.vertexBufferSizeParam = 20;
		this.indexBufferSizeParam = 20;

		this.onAddChunk = () => {};
		this.onRemoveChunks = () => {};

		this.init();
	}

	init() {

		this._generateBuffers();
	}

	_generateBuffers() {

		this.bufferFactory = this.geometryUtils.generateTerrain(
			this.chunkSize, this.chunkCount, this.segment,
			this.vertexBufferSizeParam, this.indexBufferSizeParam
		);

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

		this.biomeAttribute = new THREE.Float32BufferAttribute();
		this.biomeAttribute.array = this.bufferFactory.biomes;
		this.biomeAttribute.itemSize = 3;
		this.biomeAttribute.count = this.bufferFactory.biomes.length;
		this.biomeAttribute.setUsage( THREE.DynamicDrawUsage );

		this.geometry.setIndex(this.indexAttribute);
		this.geometry.setAttribute('position', this.positionAttribute);
		this.geometry.setAttribute('normal', this.normalAttribute);
		this.geometry.setAttribute('biome', this.biomeAttribute);

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

	updateChunk() {

		const buf = this.bufferFactory;

		let chunkIdToAdd = this.targetChunkIds.filter(
			id => !this.currentChunks.map(v => v.chunkId).includes(id)
		).at(0);

		if (chunkIdToAdd === undefined) {
			return;
		}

		// console.log(">>> vertex ranges before deallocate: ", buf.vertexRanges);
		// console.log(">>> free vertex ranges before deallocate: ", buf.freeVertexRanges);

		let chunksToRemove = this.currentChunks.filter(chunk => !this.targetChunkIds.includes(chunk.chunkId));

		chunksToRemove.forEach(chunk => {
			this.geometryUtils.deallocateChunk(
				chunk.slots[0], chunk.slots[1], this.chunkCount ** 3,
				buf.chunkVertexRangeBuffer,
				buf.vertexFreeRangeBuffer,
				buf.chunkIndexRangeBuffer,
				buf.indexFreeRangeBuffer
			);
		});

		if (chunksToRemove.length > 0) {
			this.onRemoveChunks(chunksToRemove.map(chunk => chunk.chunkId));
		}

		// console.log(">>> vertex ranges after deallocate: ", buf.vertexRanges);
		// console.log(">>> free vertex ranges after deallocate: ", buf.freeVertexRanges);

		this.currentChunks = this.currentChunks.filter(chunk => this.targetChunkIds.includes(chunk.chunkId));

		if (!!chunkIdToAdd) {
			let gridId = chunkIdToAdd.split(':');

			let slots = this.geometryUtils.generateChunk(
				buf.positionBuffer, buf.normalBuffer, buf.biomeBuffer, buf.indexBuffer,
				buf.chunkVertexRangeBuffer,
				buf.vertexFreeRangeBuffer,
				buf.chunkIndexRangeBuffer,
				buf.indexFreeRangeBuffer,
				gridId[0] * this.chunkSize, gridId[1] * this.chunkSize, gridId[2] * this.chunkSize,
				this.chunkSize, this.segment, this.chunkCount ** 3
			);

			this.currentChunks.push({ slots: slots, chunkId: chunkIdToAdd });

			this._updateChunkGeometry(slots);

			this.onAddChunk(chunkIdToAdd);
		}

		// console.log(">>> vertex ranges after allocate: ", buf.vertexRanges);
		// console.log(">>> free vertex ranges after allocate: ", buf.freeVertexRanges);
		// console.log("=====================================");
	}

	_updateChunkGeometry(slots) {

		const buf = this.bufferFactory;

		if (buf.vertexRanges[2 * slots[0] + 1] === 0) {
			return null;
		}

		this.indexAttribute.updateRange = {
			offset: buf.indexRanges[slots[1] * 2],
			count: buf.indexRanges[slots[1] * 2 + 1]
		};
		this.indexAttribute.needsUpdate = true;

		this.positionAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3,
		};
		this.positionAttribute.needsUpdate = true;

		this.normalAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3,
		};
		this.normalAttribute.needsUpdate = true;

		this.biomeAttribute.updateRange = {
			offset: buf.vertexRanges[slots[0] * 2] * 3,
			count: buf.vertexRanges[slots[0] * 2 + 1] * 3,
		};
		this.biomeAttribute.needsUpdate = true;

		this.geometry.clearGroups();

		for (let i = 0; i < this.chunkCount ** 3; i++) {
			this.geometry.addGroup(
				buf.indexRanges[i * 2],
				buf.indexRanges[i * 2 + 1],
				0
			);
		}
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
