import * as THREE from 'three';
import {scene, camera} from './renderer.js';
import {defaultChunkSize} from './constants.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();

const onesLodsArray = new Array(8).fill(1);

const nop = () => {};

class OctreeNode {
  constructor(min, lod, isLeaf) {
    this.min = min;
    this.lod = lod;
    this.isLeaf = isLeaf;
    this.lodArray = Array(8).fill(-1);

    this.children = Array(8).fill(null);
  }
  containsNode(p) {
    return p.min.x >= this.min.x && p.min.x < this.min.x + this.lod &&
      p.min.y >= this.min.y && p.min.y < this.min.y + this.lod &&
      p.min.z >= this.min.z && p.min.z < this.min.z + this.lod;
  }
  equalsNode(p) {
    return p.min.x === this.min.x && p.min.y === this.min.y && p.min.z === this.min.z &&
      p.lodArray.every((lod, i) => lod === this.lodArray[i]);
  }
}
/* const tempUint32Array = new Uint32Array(1);
const _toUint32 = value => {
  tempUint32Array[0] = value;
  return tempUint32Array[0];
} */
const _octreeNodeMinHash = (min, lod) => `${min.x},${min.y},${min.z}:${lod}`;
const constructOctreeForLeaf = (position, lod1Range, maxLod) => {
  const nodeMap = new Map();
  
  const _createNode = (min, lod, isLeaf = lod === 1) => {
    const node = new OctreeNode(min, lod, isLeaf);
    // node.stack = new Error().stack;
    const hash = _octreeNodeMinHash(min, lod);
    if (nodeMap.has(hash)) {
      throw new Error(`Node already exists: ${hash}`);
    }
    nodeMap.set(hash, node);
    return node;
  };
  const _getNode = (min, lod) => {
    const hash = _octreeNodeMinHash(min, lod);
    let node = nodeMap.get(hash);
    if (!node) {
      node = _createNode(min, lod);
    }
    return node;
  };
  const _ensureChildren = parentNode => {
    const lodMin = parentNode.min;
    const lod = parentNode.lod;
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dz = 0; dz < 2; dz++) {
           const childIndex = dx + 2 * (dy + 2 * dz);
           if (parentNode.children[childIndex] === null) {
              console.log('got node', parentNode, parentNode.children[childIndex], childIndex);
              parentNode.children[childIndex] = _createNode(
                lodMin.clone().add(
                  new THREE.Vector3(dx, dy, dz).multiplyScalar(lod / 2)
                ),
                lod / 2,
                true
              );
              parentNode.children[childIndex].parent = parentNode;
           }
        }
      }
    }
  };
  const _constructTreeUpwards = leafPosition => {
    let rootNode = _getNode(leafPosition, 1);
    for (let lod = 2; lod <= maxLod; lod *= 2) {
      const lodMin = rootNode.min.clone();
      lodMin.x = Math.floor(lodMin.x / lod) * lod;
      lodMin.y = Math.floor(lodMin.y / lod) * lod;
      lodMin.z = Math.floor(lodMin.z / lod) * lod;

      const lodCenter = lodMin.clone().addScalar(lod / 2);
      const childIndex = (rootNode.min.x < lodCenter.x ? 0 : 1) +
        (rootNode.min.y < lodCenter.y ? 0 : 2) +
        (rootNode.min.z < lodCenter.z ? 0 : 4);

      const parentNode = _getNode(lodMin, lod);
      parentNode.isLeaf = false;
      if (parentNode.children[childIndex] === null) { // children not set yet
        parentNode.children[childIndex] = rootNode;
        _ensureChildren(parentNode);
      }
      rootNode = parentNode;
    }
    return rootNode;
  };

  // build base leaf nodes
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const leafPosition = position.clone().add(
          new THREE.Vector3(dx, dy, dz).multiplyScalar(lod1Range)
        );
        leafPosition.x = Math.floor(leafPosition.x);
        leafPosition.y = Math.floor(leafPosition.y);
        leafPosition.z = Math.floor(leafPosition.z);
        _constructTreeUpwards(leafPosition);
      }
    }
  }

  // fill in missing children that are in the lod1Range
  const _ensureChildrenDownToLod1 = node => {
    const lodMin = node.min;
    const lod = node.lod;
    if (lod === 1) {
      return;
    }
    node.isLeaf = false;
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dz = 0; dz < 2; dz++) {
            const childIndex = dx + 2 * (dy + 2 * dz);
            if (node.children[childIndex] === null) {
              const childNode = _createNode(
                lodMin.clone().add(
                  new THREE.Vector3(dx, dy, dz).multiplyScalar(lod / 2)
                ),
                lod / 2,
                true
              );
              node.children[childIndex] = childNode;
              _ensureChildrenDownToLod1(childNode);
            }
        }
      }
    }
  };

  const rangeMin = position.clone()
    .sub(new THREE.Vector3(lod1Range, lod1Range, lod1Range));
  const rangeMax = position.clone()
    .add(new THREE.Vector3(lod1Range, lod1Range, lod1Range));
  for (let node of nodeMap.values()) {
    if (
      node.min.x >= rangeMin.x && node.min.x < rangeMax.x &&
      node.min.y >= rangeMin.y && node.min.y < rangeMax.y &&
      node.min.z >= rangeMin.z && node.min.z < rangeMax.z
    ) {
      _ensureChildrenDownToLod1(node);
    }
  }

  const rootNodes = [];
  for (const node of nodeMap.values()) {
    if (node.lod === maxLod) {
      rootNodes.push(node);
    }
  }

  const lod1Nodes = [];
  for (const node of nodeMap.values()) {
    if (node.lod === 1) {
      lod1Nodes.push(node);
    }
  }

  // sanity check lod1Nodes for duplicates
  {
    const lod1NodeMap = new Map();
    for (const node of lod1Nodes) {
      const hash = _octreeNodeMinHash(node.min, node.lod);
      if (lod1NodeMap.has(hash)) {
        throw new Error(`Duplicate lod1 node: ${hash}`);
      }
      lod1NodeMap.set(hash, node);
    }
  }

  const leafNodes = [];
  for (const node of nodeMap.values()) {
    if (node.isLeaf) {
      leafNodes.push(node);
    }
  }

  // sanity check that no leaf node contains another leaf node
  {
    for (const leafNode of leafNodes) {
      for (const childNode of leafNode.children) {
        if (childNode?.isLeaf) {
          throw new Error(`Leaf node contains another leaf node 1: ${leafNode.min.toArray().join(',')}`);
        }
      }
      for (const leafNode2 of leafNodes) {
        if (leafNode !== leafNode2 && leafNode.containsNode(leafNode2)) {
          throw new Error(`Leaf node contains another leaf node 2: ${leafNode.min.toArray().join(',')}`);
        }
      }
    }
  }

  // get the leaf node that contains a point
  const _getLeafNodeFromPoint = point => leafNodes.find(node => node.containsPoint(point));

  // assign lodArray for each node based on the minimum lod of the target point in the world
  // vm::ivec3(0, 0, 0),
  // vm::ivec3(1, 0, 0),
  // vm::ivec3(0, 0, 1),
  // vm::ivec3(1, 0, 1),
  // vm::ivec3(0, 1, 0),
  // vm::ivec3(1, 1, 0),
  // vm::ivec3(0, 1, 1),
  // vm::ivec3(1, 1, 1),
  for (const node of nodeMap.values()) {
    node.lodArray = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(1, 0, 1),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(0, 1, 1),
      new THREE.Vector3(1, 1, 1),
    ].map(offset => {
      const containingLeafNode = _getLeafNodeFromPoint(node.min.clone().add(offset.clone().multiplyScalar(node.lod)));
      if (containingLeafNode) {
        return containingLeafNode.lod;
      } else {
        return node.lod;
      }
    });
  }

  return {
    rootNodes,
    lod1Nodes,
    leafNodes,
  };
};
const _makeEmptyOctree = () => {
  return {
    rootNodes: [],
    lod1Nodes: [],
    leafNodes: [],
  };
};
class Task extends EventEmitter {
  constructor() {
    super();

    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    
    this.isTask = true;
  }
}
class AddTask extends Task {
  constructor(newNode, oldNodes) {
    super();
    
    this.newNode = newNode;
    this.oldNodes = oldNodes;

    this.isAddTask = true;
  }
}
class RemoveTask extends Task {
  constructor(oldNode) {
    super();
    
    this.oldNode = oldNode;

    this.isRemoveTask = true;
  }
}
const diffOctrees = (newOctree, oldOctree) => {
  const tasks = [];
  // add new node tasks that replace the old ones
  for (const newNode of newOctree.leafNodes) {
    const matchingOldNodes = oldOctree.leafNodes.filter(oldNode => {
      return newNode.containsNode(oldNode);
    });
    // add the task to the queue, as long as it's not the same exact task spec as we already had
    if (!(matchingOldNodes.length === 1 && matchingOldNodes[0].equalsNode(newNode))) {
      const task = new AddTask(newNode, matchingOldNodes);
      tasks.push(task);
    }
  }
  // remove old node tasks that are not in the new octree at all
  for (const oldNode of oldOctree.leafNodes) {
    // if no new node contains this old node, then it's a remove task
    if (!newOctree.leafNodes.some(newNode => {
      return newNode.containsNode(oldNode);
    })) {
      const task = new RemoveTask(oldNode);
      tasks.push(task);
    }
  }
  return tasks;
};
// sort tasks by distance to world position
const sortTasks = (tasks, worldPosition) => {
  const taskDistances = tasks.map(task => {
    const distance = localVector.copy(task.newNode.min)
      .add(localVector2.setScalar(task.newNode.lod / 2))
      .distanceToSquared(worldPosition);
    return {
      task,
      distance,
    };
  });
  taskDistances.sort((a, b) => {
    return a.distance - b.distance;
  });
  return taskDistances.map(taskDistance => taskDistance.task);
};

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
let lastOctree = _makeEmptyOctree();
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
      const octree = constructOctreeForLeaf(currentCoord, 1, 32);
      // console.log('got octree', currentCoord.toArray().join(','), octree);

      const tasks = diffOctrees(octree, lastOctree);
      sortTasks(tasks, camera.position);
      // console.log('got octree diff', currentCoord.toArray().join(','), octree, tasks);
      lastOctree = octree;

      for (const task of tasks) {
        this.dispatchEvent(new MessageEvent('chunkrelod', {
          data: {
            task,
          },
        }));
      }

      /* const neededChunks = neededChunkSpecs.map(({chunk}) => chunk);

      const addedChunks = [];
      const removedChunks = [];
      const reloddedChunks = [];
      for (const chunk of this.chunks) {
        const matchingNeededChunk = neededChunks.find(nc => nc.containsPoint(chunk));
        if (!matchingNeededChunk) {
          // console.log('remove chunk', chunk);
          removedChunks.push(chunk);
        }
      }
      for (const chunkSpec of neededChunkSpecs) {
        const {chunk} = chunkSpec;
        const matchingChunks = this.chunks.filter(chunk2 => chunk.containsPoint(chunk2));
        const isExactMatch = matchingChunks.length === 1 && matchingChunks[0].lod === chunk.lod;
        if (isExactMatch) {
          // nothing
        } else if (matchingChunks.length > 0) {
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
      } */
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