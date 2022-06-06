import * as THREE from 'three';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();

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
  constructor(x, y, z, lodArray) {
    
    super(x, y, z);
    this.lodArray = lodArray;

    this.name = `chunk:${this.x}:${this.z}`;
    this.binding = null;
    this.items = [];
    this.physicsObjects = [];
  }
  equals(chunk) {
    return super.equals(chunk) &&
      this.lodArray.length === chunk.lodArray.length && this.lodArray.every((lod, i) => lod === chunk.lodArray[i]);
  }
}
export class LodChunkTracker {
  constructor(generator, {
    chunkWorldSize = 10,
    numLods = 1,
    chunkHeight = 0,
  } = {}) {
    this.generator = generator;
    this.chunkWorldSize = chunkWorldSize;
    this.numLods = numLods;
    this.chunkHeight = chunkHeight;

    this.chunks = [];
    this.lastUpdateCoord = new THREE.Vector3(NaN, NaN, NaN);
  }
  #getCurrentCoord(position, target) {
    const cx = Math.floor(position.x / this.chunkWorldSize);
    const cy = this.chunkHeight !== 0 ? Math.floor(position.y / this.chunkHeight) : 0;
    const cz = Math.floor(position.z / this.chunkWorldSize);
    return target.set(cx, cy, cz);
  }
  update(position) {
    const currentCoord = this.#getCurrentCoord(position, localVector);

    // if we moved across a chunk boundary, update needed chunks
    if (!currentCoord.equals(this.lastUpdateCoord)) {
      // add LOD0 chunks
      const neededChunks = [];
      const seenMins = new Set();
      const mins2x = [];
      for (let dcy = -this.chunkHeight / this.chunkWorldSize; dcy <= this.chunkHeight / this.chunkWorldSize; dcy += 2) {
        for (let dcz = -1; dcz <= 1; dcz += 2) {
          for (let dcx = -1; dcx <= 1; dcx += 2) {
            const min = new THREE.Vector3(
              Math.floor((currentCoord.x + dcx) / 2) * 2,
              Math.floor((currentCoord.y + dcy) / 2) * 2,
              Math.floor((currentCoord.z + dcz) / 2) * 2
            );
            const key = min.toArray().join(',');
            if (!seenMins.has(key)) {
              seenMins.add(key);
              mins2x.push(min);
            }
          }
        }
      }
      const min2xMin = new THREE.Vector3(Infinity, Infinity, Infinity);
      const min2xMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      for (const min2x of mins2x) {
        min2xMin.min(min2x);
        min2xMax.max(
          localVector2.copy(min2x)
            .add(localVector3.set(1, 1, 1))
        );
      }

      // collect 1x chunks inside the 2x chunks
      for (const chunkPosition2x of mins2x) {
        for (let dy = 0; dy < 2; dy++) {
          for (let dz = 0; dz < 2; dz++) {
            for (let dx = 0; dx < 2; dx++) {
              const chunkPosition1x = localVector2.copy(chunkPosition2x)
                .add(localVector3.set(dx, dy, dz));
              /* vm::ivec3(0, 0, 0),
              vm::ivec3(1, 0, 0),
              vm::ivec3(0, 0, 1),
              vm::ivec3(1, 0, 1),
              vm::ivec3(0, 1, 0),
              vm::ivec3(1, 1, 0),
              vm::ivec3(0, 1, 1),
              vm::ivec3(1, 1, 1), */
              const lodArray = /* this.numLods > 1 ? [
                1,
                (chunkPosition1x.x + 1 < min2xMax.x) ? 1 : 2,
                (chunkPosition1x.z + 1 < min2xMax.z) ? 1 : 2,
                (chunkPosition1x.x + 1 < min2xMax.x && chunkPosition1x.z + 1 < min2xMax.z) ? 1 : 2,
                (chunkPosition1x.y + 1 < min2xMax.y) ? 1 : 2,
                (chunkPosition1x.x + 1 < min2xMax.x && chunkPosition1x.y + 1 < min2xMax.y) ? 1 : 2,
                (chunkPosition1x.y + 1 < min2xMax.y && chunkPosition1x.z + 1 < min2xMax.z) ? 1 : 2,
                (chunkPosition1x.x + 1 < min2xMax.x && chunkPosition1x.y + 1 < min2xMax.y && chunkPosition1x.z + 1 < min2xMax.z) ? 1 : 2,
              ] : */ Array(8).fill(1);
              const chunk = new LodChunk(chunkPosition1x.x, chunkPosition1x.y, chunkPosition1x.z, lodArray);
              neededChunks.push(chunk);
            }
          }
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