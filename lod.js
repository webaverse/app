import * as THREE from 'three';

const chunkWorldSize = 30;

const localVector2D = new THREE.Vector2();

export class LodChunk extends THREE.Vector3 {
  constructor(x, y, z, lod) {
    
    super(x, y, z);
    this.lod = lod;

    this.name = `chunk:${this.x}:${this.z}`;
    this.geometryBinding = null;
    this.items = [];
    this.physicsObjects = [];
  }
  equals(chunk) {
    return this.x === chunk.x && this.y === chunk.y && this.z === chunk.z;
  }
}
export class LodChunkTracker {
  constructor(generator) {
    this.generator = generator;

    this.chunks = [];
    this.lastUpdateCoord = new THREE.Vector2(NaN, NaN);
  }
  #getCurrentCoord(position, target) {
    const cx = Math.floor(position.x / chunkWorldSize);
    const cz = Math.floor(position.z / chunkWorldSize);
    return target.set(cx, cz);
  }
  update(position) {
    const currentCoord = this.#getCurrentCoord(position, localVector2D);

    if (!currentCoord.equals(this.lastUpdateCoord)) {
      // console.log('got current coord', [currentCoord.x, currentCoord.y]);
      const lod = 0;
      const neededChunks = [];
      for (let dcx = -1; dcx <= 1; dcx++) {
        for (let dcz = -1; dcz <= 1; dcz++) {
          const chunk = new LodChunk(currentCoord.x + dcx, 0, currentCoord.y + dcz, lod);
          neededChunks.push(chunk);
        }
      }

      const addedChunks = [];
      const removedChunks = [];
      const reloddedChunks = [];
      for (const chunk of this.chunks) {
        const matchingNeededChunk = neededChunks.find(nc => nc.equals(chunk));
        if (!matchingNeededChunk) {
          removedChunks.push(chunk);
        }
      }
      for (const chunk of neededChunks) {
        const matchingExistingChunk = this.chunks.find(ec => ec.equals(chunk));
        if (matchingExistingChunk) {
          if (matchingExistingChunk.lod !== chunk.lod) {
            reloddedChunks.push({
              oldChunk: matchingExistingChunk,
              newChunk: chunk,
            });
          }
        } else {
          addedChunks.push(chunk);
        }
      }

      for (const removedChunk of removedChunks) {
        this.generator.disposeChunk(removedChunk);
        const index = this.chunks.indexOf(removedChunk);
        this.chunks.splice(index, 1);
      }
      for (const addedChunk of addedChunks) {
        this.generator.generateChunk(addedChunk);
        this.chunks.push(addedChunk);
      }
    
      this.lastUpdateCoord.copy(currentCoord);
    }
  }
  destroy() {
    for (const chunk of this.chunks) {
      this.generator.disposeChunk(chunk);
    }
    this.chunks.length = 0;
  }
}