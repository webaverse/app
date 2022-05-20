import * as THREE from 'three';

const localVector2D = new THREE.Vector2();

/*
note: the nunber of lods at each level can be computed with this function:

  getNumLodsAtLevel = n => n === 0 ? 1 : (2*n+1)**2-(getNumLodsAtLevel(n-1));

the total number of chunks with 3 lods is:
  > getNumLodsAtLevel(0) + getNumLodsAtLevel(1) + getNumLodsAtLevel(2) + getNumLodsAtLevel(3)
  < 58

---

the view range for a chunk size and given number of lods is:

  // 0, 1, 2 are our lods
  getViewRangeInternal = n => (n === 0 ? 1 : (3*getViewRangeInternal(n-1)));
  getViewRange = (n, chunkSize) => getViewRangeInternal(n) * chunkSize / 2;

for a chunkSize of 30, we have the view distance of each lod:

  getViewRange(1, 30) = 45 // LOD 0
  getViewRange(2, 30) = 135 // LOD 1
  getViewRange(3, 30) = 405 // LOD 2
---

for a million tris budget, the tris per chunk is:
  1,000,000 tri / 58 chunks rendered = 17241.379310344827586206896551724 tri

for a chunk size of 30 meters, the density of tris per uniform meters cubic is:
  > 17241.379310344827586206896551724 tri / (30**3 meters)
  < 0.6385696040868454 tri/m^3

per meters squared, it's 19.157088122605362 tri/m^2

---

using these results

- the tri budget can be scaled linearly with the results
- the chunk size can be changed to increase the view distance while decreasing the density, while keeping the tri budget the same
*/
export class LodChunk extends THREE.Vector3 {
  constructor(x, y, z, lod) {
    
    super(x, y, z);
    this.lod = lod;

    this.name = `chunk:${this.x}:${this.z}`;
    this.binding = null;
    this.items = [];
    this.physicsObjects = [];
  }
  equals(chunk) {
    return this.x === chunk.x && this.y === chunk.y && this.z === chunk.z;
  }
}
export class LodChunkTracker {
  constructor(generator, {
    chunkWorldSize = 10,
  } = {}) {
    this.generator = generator;
    this.chunkWorldSize = chunkWorldSize;

    this.chunks = [];
    this.lastUpdateCoord = new THREE.Vector2(NaN, NaN);
  }
  #getCurrentCoord(position, target) {
    const cx = Math.floor(position.x / this.chunkWorldSize);
    const cz = Math.floor(position.z / this.chunkWorldSize);
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