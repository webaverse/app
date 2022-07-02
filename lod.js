import * as THREE from 'three';
import {scene} from './renderer.js';
import {defaultChunkSize} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

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
  constructor(x, y, z, lod, lodArray) {
    
    super(x, y, z);
    this.lod = lod;
    this.lodArray = lodArray;

    this.name = `chunk:${this.x}:${this.y}:${this.z}`;
    this.binding = null;
    this.items = [];
    this.physicsObjects = [];
  }
  lodEquals(chunk) {
    return this.lod === chunk.lod &&
      this.lodArray.length === chunk.lodArray.length && this.lodArray.every((lod, i) => lod === chunk.lodArray[i]);
  }
  containsPoint(p) {
    return p.x >= this.x && p.x < this.x + this.lod &&
      p.y >= this.y && p.y < this.y + this.lod &&
      p.z >= this.z && p.z < this.z + this.lod;
  }
}
export class LodChunkTracker extends EventTarget {
  constructor({
    chunkSize = defaultChunkSize,
    numLods = 1,
    trackY = false,
    relod = false,
    range = null,
    debug = false,
  } = {}) {
    super();

    this.chunkSize = chunkSize;
    this.numLods = numLods;
    this.trackY = trackY;
    this.relod = relod;
    this.range = range;
    // this.debug = debug;

    this.chunks = [];
    this.lastUpdateCoord = new THREE.Vector3(NaN, NaN, NaN);

    if (range) {
      this.#setRange(range);
    }

    if (debug) {      
      const maxChunks = 512;
      const instancedCubeGeometry = new THREE.InstancedBufferGeometry();
      {
        const cubeGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
        for (const k in cubeGeometry.attributes) {
          instancedCubeGeometry.setAttribute(k, cubeGeometry.attributes[k]);
        }
        instancedCubeGeometry.setIndex(cubeGeometry.index);
      }
      const redMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.1,
      });
      const debugMesh = new THREE.InstancedMesh(instancedCubeGeometry, redMaterial, maxChunks);
      debugMesh.count = 0;
      debugMesh.frustumCulled = false;
      scene.add(debugMesh);
      // window.debugMesh = debugMesh;

      {
        const localVector = new THREE.Vector3();
        const localVector2 = new THREE.Vector3();
        const localVector3 = new THREE.Vector3();
        const localQuaternion = new THREE.Quaternion();
        const localMatrix = new THREE.Matrix4();
        const localColor = new THREE.Color();

        const chunks = [];
        const _getChunkColorHex = chunk => {
          if (chunk.lod === 1) {
            return 0xFF0000;
          } else if (chunk.lod === 2) {
            return 0x00FF00;
          } else {
            return 0x0;
          }
        };
        const _flushChunks = () => {
          // console.log('update', chunks.length);
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            localMatrix.compose(
              localVector.copy(chunk)
                .multiplyScalar(this.chunkSize)
                .add(localVector2.set(0, -60, 0)),
              localQuaternion.identity(),
              localVector3.set(1, 1, 1)
                .multiplyScalar(this.chunkSize * 0.9)
            );
            localColor.setHex(_getChunkColorHex(chunk));
            debugMesh.setMatrixAt(i, localMatrix);
            debugMesh.setColorAt(i, localColor);
            // console.log('render chunk', chunk);
          }
          debugMesh.instanceMatrix.needsUpdate = true;
          debugMesh.instanceColor.needsUpdate = true;
          debugMesh.count = chunks.length;
        };
        this.addEventListener('chunkadd', e => {
          try {
            // console.log('got chunk add', e.data);
            const {chunk} = e.data;
            chunks.push(chunk);
            _flushChunks();
          } catch(err) {
            console.warn(err);
          }
        });
        this.addEventListener('chunkremove', e => {
          // try {
            const {chunk} = e.data;
            const index = chunks.indexOf(chunk);
            /* if (index === -1) {
              debugger;
            } */
            chunks.splice(index, 1);
            _flushChunks();
          /* } catch(err) {
            console.warn(err);
          } */
        });
        this.addEventListener('chunkrelod', e => {
          try {
            // console.log('relod', e.data);
            const {newChunk, oldChunks} = e.data;
            for (const oldChunk of oldChunks) {
              const index = chunks.indexOf(oldChunk);
              /* if (index === -1) {
                debugger;
              } */
              chunks.splice(index, 1);
            }
            chunks.push(newChunk);
            _flushChunks();
          } catch(err) {
            console.warn(err);
          }
        });
      }
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

      const lod = 1;
      for (let y = minChunkY; y < maxChunkY; y++) {
        for (let z = minChunkZ; z < maxChunkZ; z++) {
          for (let x = minChunkX; x < maxChunkX; x++) {
            const chunk = new LodChunk(x, y, z, lod, onesLodsArray);
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
      const neededChunkSpecs = [];
      const seenMins = new Set();
      const mins1x = [];
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
              mins1x.push(min);
            }
          }
        }
      }
      const min1xMin = new THREE.Vector3(Infinity, Infinity, Infinity);
      const min1xMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      for (const min1x of mins1x) {
        min1xMin.min(min1x);
        min1xMax.max(
          localVector2.copy(min1x)
            .add(localVector3.set(1, 1, 1))
        );
      }
      const min1xSize = min1xMax.clone()
        .sub(min1xMin)
        .add(localVector2.set(1, 1, 1));

      // dispatch event
      this.dispatchEvent(new MessageEvent('coordupdate', {
        data: {
          coord: min1xMin,
          waitUntil,
        },
      }));

      // lod1
      {
        const lod = 1;
        const maxDy = this.trackY ? 1 : 0;
        for (const chunkPosition2x of mins1x) {
          for (let dy = 0; dy <= maxDy; dy++) {
            for (let dz = 0; dz < 2; dz++) {
              for (let dx = 0; dx < 2; dx++) {
                const chunkPosition1x = localVector2.copy(chunkPosition2x)
                  .add(localVector3.set(dx, dy, dz));
                // vm::ivec3(0, 0, 0),
                // vm::ivec3(1, 0, 0),
                // vm::ivec3(0, 0, 1),
                // vm::ivec3(1, 0, 1),
                // vm::ivec3(0, 1, 0),
                // vm::ivec3(1, 1, 0),
                // vm::ivec3(0, 1, 1),
                // vm::ivec3(1, 1, 1),
                const lodArray = [
                  1,
                  (chunkPosition1x.x < min1xMax.x) ? 1 : 2,
                  (chunkPosition1x.z < min1xMax.z) ? 1 : 2,
                  (chunkPosition1x.x < min1xMax.x && chunkPosition1x.z < min1xMax.z) ? 1 : 2,
                  (chunkPosition1x.y < min1xMax.y) ? 1 : 2,
                  (chunkPosition1x.x < min1xMax.x && chunkPosition1x.y < min1xMax.y) ? 1 : 2,
                  (chunkPosition1x.y < min1xMax.y && chunkPosition1x.z < min1xMax.z) ? 1 : 2,
                  (chunkPosition1x.x < min1xMax.x && chunkPosition1x.y < min1xMax.y && chunkPosition1x.z < min1xMax.z) ? 1 : 2,
                ];
                const chunk = new LodChunk(chunkPosition1x.x, chunkPosition1x.y, chunkPosition1x.z, lod, lodArray);
                neededChunkSpecs.push({
                  chunk,
                  replacesChunks: [],
                });
              }
            }
          }
        }
      }

      // window.neededChunkSpecs = neededChunkSpecs;
      // window.min1xMin = min1xMin;
      // window.min1xMax = min1xMax;

      // lod2
      /* if (this.numLods >= 2) {
        const lod = 2;
        const min2xTileSize = min1xSize.clone().divideScalar(2);
        const min2xMin = min1xMin.clone().sub(min2xTileSize);
        const min2xMax = min1xMin.clone().add(min1xSize).add(min2xTileSize);
        
        for (let y = min2xMin.y * maxDcy; y <= min2xMax.y * maxDcy; y += min2xTileSize.y) {
          for (let z = min2xMin.z; z <= min2xMax.z; z += min2xTileSize.z) {
            for (let x = min2xMin.x; x <= min2xMax.x; x += min2xTileSize.x) {
              const chunkPosition2x = localVector3.set(
                x,
                y,
                z
              );
              
              const replacesChunks = [];
              for (let dy2 = 0; dy2 < 2; dy2++) {
                for (let dz2 = 0; dz2 < 2; dz2++) {
                  for (let dx2 = 0; dx2 < 2; dx2++) {
                    const chunkPosition1x = localVector4.copy(chunkPosition2x)
                      .add(localVector5.set(dx2, dy2, dz2));
                    const matchingChunkSpec = neededChunkSpecs.find(({chunk}) => {
                      return chunk.equals(chunkPosition1x);
                    });
                    if (matchingChunkSpec) {
                      for (const replacesChunk of matchingChunkSpec.replacesChunks) {
                        replacesChunks.push(replacesChunk);
                      }
                    }
                  }
                }
              }
              // vm::ivec3(0, 0, 0),
              // vm::ivec3(1, 0, 0),
              // vm::ivec3(0, 0, 1),
              // vm::ivec3(1, 0, 1),
              // vm::ivec3(0, 1, 0),
              // vm::ivec3(1, 1, 0),
              // vm::ivec3(0, 1, 1),
              // vm::ivec3(1, 1, 1),
              const lodArray = [
                2,
                (chunkPosition2x.x < min2xMax.x) ? 2 : 4,
                (chunkPosition2x.z < min2xMax.z) ? 2 : 4,
                (chunkPosition2x.x < min2xMax.x && chunkPosition2x.z < min2xMax.z) ? 2 : 4,
                (chunkPosition2x.y < min2xMax.y) ? 2 : 4,
                (chunkPosition2x.x < min2xMax.x && chunkPosition2x.y < min2xMax.y) ? 2 : 4,
                (chunkPosition2x.y < min2xMax.y && chunkPosition2x.z < min2xMax.z) ? 2 : 4,
                (chunkPosition2x.x < min2xMax.x && chunkPosition2x.y < min2xMax.y && chunkPosition2x.z < min2xMax.z) ? 2 : 4,
              ];
              const chunk = new LodChunk(chunkPosition2x.x, chunkPosition2x.y, chunkPosition2x.z, lod, lodArray);
              neededChunkSpecs.push({
                chunk,
                replacesChunks,
              });
            }
          }
        }
      } */














      /* // const neededChunks = neededChunkSpecs.map(({chunk}) => chunk);
      for (const chunk of this.chunks) {
        const matchingNeededChunk = neededChunkSpecs.find(ncs => ncs.chunk.equals(chunk));
        if (!matchingNeededChunk) {
          this.dispatchEvent(new MessageEvent('chunkremove', {
            data: {
              chunk,
              waitUntil,
            },
          }));
        }
      }
      for (const chunkSpec of neededChunkSpecs) {
        const {chunk, replacesChunks} = chunkSpec;
        if (replacesChunks.length > 0) {
          // this.dispatchEvent(new MessageEvent('chunkrelod', {
          //   data: {
          //     chunk,
          //     replacesChunks,
          //     waitUntil,
          //   },
          // }));
        } else {
          this.dispatchEvent(new MessageEvent('chunkadd', {
            data: {
              chunk,
              waitUntil,
            },
          }));
        }
      } */










      const neededChunks = neededChunkSpecs.map(({chunk}) => chunk);

      const addedChunks = [];
      const removedChunks = [];
      const reloddedChunks = [];
      for (const chunk of this.chunks) {
        const matchingNeededChunk = neededChunks.find(nc => nc.equals(chunk));
        if (!matchingNeededChunk) {
          removedChunks.push(chunk);
        }
      }
      for (const chunkSpec of neededChunkSpecs) {
        const {chunk} = chunkSpec;
        const matchingChunks = this.chunks.filter(chunk2 => {
          return chunk.containsPoint(chunk2);
        });
        if (
          matchingChunks.length > 0 && // replacing some chunk and
          !(matchingChunks.length === 1 && matchingChunks[0].equals(chunk) && matchingChunks[0].lodEquals(chunk)) // not just the same chunk
        ) {
          reloddedChunks.push({
            oldChunks: matchingChunks,
            newChunk: chunk,
          });
        } else {
          addedChunks.push(chunk);
        }
      }

      // emit updates
      // remove
      for (const removedChunk of removedChunks) {
        this.dispatchEvent(new MessageEvent('chunkremove', {
          data: {
            chunk: removedChunk,
            waitUntil,
          },
        }));
        this.chunks.splice(this.chunks.indexOf(removedChunk), 1);
      }

      // coord
      this.lastUpdateCoord.copy(currentCoord);
      (async () => {
        await Promise.all(waitPromises);
        this.dispatchEvent(new MessageEvent('update'));
      })();

      // relod
      if (this.relod) {
        for (const reloddedChunk of reloddedChunks) {
          const {oldChunks, newChunk} = reloddedChunk;
          this.dispatchEvent(new MessageEvent('chunkrelod', {
            data: {
              oldChunks,
              newChunk,
              waitUntil,
            },
          }));
          for (const oldChunk of oldChunks) {
            this.chunks.splice(this.chunks.indexOf(oldChunk), 1);
          }
          this.chunks.push(newChunk);
        }
      }

      // add
      for (const addedChunk of addedChunks) {
        this.dispatchEvent(new MessageEvent('chunkadd', {
          data: {
            chunk: addedChunk,
            waitUntil,
          },
        }));
        this.chunks.push(addedChunk);
      }
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