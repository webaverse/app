import * as THREE from 'three';
import {defaultChunkSize} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();

const onesLodsArray = new Array(8).fill(1);

const nop = () => {};

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
    this.lod = lodArray[0];
    this.lodArray = lodArray;

    this.name = `chunk:${this.x}:${this.z}`;
    this.binding = null;
    this.items = [];
    this.physicsObjects = [];
  }
  lodArrayEquals(chunk) {
    return this.lodArray.length === chunk.lodArray.length && this.lodArray.every((lod, i) => lod === chunk.lodArray[i]);
  }
}
export class LodChunkTracker extends EventTarget {
  constructor({
    chunkSize = defaultChunkSize,
    numLods = 1,
    trackY = false,
    relod = false,
    range = null,
  } = {}) {
    super();

    this.chunkSize = chunkSize;
    this.numLods = numLods;
    this.trackY = trackY;
    this.relod = relod;
    this.range = range;

    this.chunks = [];
    this.lastUpdateCoord = new THREE.Vector3(NaN, NaN, NaN);

    if (range) {
      this.#setRange(range);
    }
  }
  /* emitEvents(chunkadd) {
    if (this.updated) {
      console.log('emitting chunks', this.chunks.length);
      for (const chunk of this.chunks) {
        const e = new MessageEvent('chunkadd', {
          data: {
            chunk,
          },
        });
        chunkadd(e);
      }
    }
  } */
  async #setRange(range) {
    await Promise.resolve(); // wait for next tick to emit chunk events

    const waitPromises = [];
    const waitUntil = p => {
      waitPromises.push(p);
    };

    /* const _removeOldChunks = () => {
      for (const chunk of this.chunks) {
        this.dispatchEvent(new MessageEvent('chunkremove', {
          data: {
            chunk,
          },
        }));
      }
      this.chunks.length = 0;
    };
    _removeOldChunks(); */

    const _emitCoordUpdate = () => {
      const coord = localVector.copy(range.min)
        .divideScalar(this.chunkSize);
      this.dispatchEvent(new MessageEvent('coordupdate', {
        data: {
          coord,
          waitUntil,
        },
      }));
    };
    _emitCoordUpdate();

    const _addRangeChunks = () => {
      const minChunkX = Math.floor(range.min.x / this.chunkSize);
      const minChunkY = this.trackY ? Math.floor(range.min.y / this.chunkSize) : 0;
      const minChunkZ = Math.floor(range.min.z / this.chunkSize);

      const maxChunkX = Math.floor(range.max.x / this.chunkSize);
      const maxChunkY = this.trackY ? Math.floor(range.max.y / this.chunkSize) : 1;
      const maxChunkZ = Math.floor(range.max.z / this.chunkSize);

      for (let y = minChunkY; y < maxChunkY; y++) {
        for (let z = minChunkZ; z < maxChunkZ; z++) {
          for (let x = minChunkX; x < maxChunkX; x++) {
            const chunk = new LodChunk(x, y, z, onesLodsArray);
            this.dispatchEvent(new MessageEvent('chunkadd', {
              data: {
                chunk,
                waitUntil,
              },
            }));
            this.chunks.push(chunk);
          }
        }
      }
    };
    _addRangeChunks();

    (async () => {
      await Promise.all(waitPromises);
      this.dispatchEvent(new MessageEvent('update'));
    })();
  }
  #getCurrentCoord(position, target) {
    const cx = Math.floor(position.x / this.chunkSize);
    const cy = this.trackY ? Math.floor(position.y / this.chunkSize) : 0;
    const cz = Math.floor(position.z / this.chunkSize);
    return target.set(cx, cy, cz);
  }
  update(position) {
    if (this.range) throw new Error('lod tracker has range and cannot be updated manually');

    const waitPromises = [];
    const waitUntil = p => {
      waitPromises.push(p);
    };

    const currentCoord = this.#getCurrentCoord(position, localVector);

    // if we moved across a chunk boundary, update needed chunks
    if (!currentCoord.equals(this.lastUpdateCoord)) {
      // add LOD0 chunks
      const neededChunks = [];
      const seenMins = new Set();
      const mins2x = [];
      const minDcy = this.trackY ? -1 : 0;
      const maxDcy = this.trackY ? 1 : 0;
      for (let dcy = minDcy; dcy <= maxDcy; dcy += 2) {
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

      // dispatch event
      this.dispatchEvent(new MessageEvent('coordupdate', {
        data: {
          coord: min2xMin,
          waitUntil,
        },
      }));

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
              const lodArray = [
                1,
                (chunkPosition1x.x < min2xMax.x) ? 1 : 2,
                (chunkPosition1x.z < min2xMax.z) ? 1 : 2,
                (chunkPosition1x.x < min2xMax.x && chunkPosition1x.z < min2xMax.z) ? 1 : 2,
                (chunkPosition1x.y < min2xMax.y) ? 1 : 2,
                (chunkPosition1x.x < min2xMax.x && chunkPosition1x.y < min2xMax.y) ? 1 : 2,
                (chunkPosition1x.y < min2xMax.y && chunkPosition1x.z < min2xMax.z) ? 1 : 2,
                (chunkPosition1x.x < min2xMax.x && chunkPosition1x.y < min2xMax.y && chunkPosition1x.z < min2xMax.z) ? 1 : 2,
              ];
              // console.log('got lod array', lodArray, chunkPosition1x.toArray(), min2xMax.toArray());
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
        const matchingChunk = this.chunks.find(ec => ec.equals(chunk));
        if (matchingChunk) {
          if (!matchingChunk.lodArrayEquals(chunk)) {
            reloddedChunks.push({
              oldChunk: matchingChunk,
              newChunk: chunk,
            });
          }
        } else {
          addedChunks.push(chunk);
        }
      }

      for (const removedChunk of removedChunks) {
        this.dispatchEvent(new MessageEvent('chunkremove', {
          data: {
            chunk: removedChunk,
            waitUntil,
          },
        }));
        this.chunks.splice(this.chunks.indexOf(removedChunk), 1);
      }
      for (const addedChunk of addedChunks) {
        this.dispatchEvent(new MessageEvent('chunkadd', {
          data: {
            chunk: addedChunk,
            waitUntil,
          },
        }));
        this.chunks.push(addedChunk);
      }
      if (this.relod) {
        for (const reloddedChunk of reloddedChunks) {
          const {oldChunk, newChunk} = reloddedChunk;
          this.dispatchEvent(new MessageEvent('chunkrelod', {
            data: {
              oldChunk,
              newChunk,
              waitUntil,
            },
          }));
          this.chunks.splice(this.chunks.indexOf(oldChunk), 1);
          this.chunks.push(newChunk);
        }
      }
    
      this.lastUpdateCoord.copy(currentCoord);

      (async () => {
        await Promise.all(waitPromises);
        this.dispatchEvent(new MessageEvent('update'));
      })();
    }
  }
  destroy() {
    for (const chunk of this.chunks) {
      this.dispatchEvent(new MessageEvent('chunkremove', {
        data: {
          chunk,
          waitUntil: nop,
        },
      }));
    }
    this.chunks.length = 0;

    // this.dispatchEvent(new MessageEvent('destroy'));
  }
}