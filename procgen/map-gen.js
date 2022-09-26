import * as THREE from 'three';
// import alea from './alea.js';
import {
  makeRng,
} from './misc-gen.js';
import placeNames from './placeNames.js';
import {shuffle} from '../util.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

export const numBlocksPerChunk = 32;
export const voxelPixelSize = 3;
export const voxelWorldSize = 4;
export const chunkWorldSize = numBlocksPerChunk * voxelWorldSize;
export const chunkScreenSize = numBlocksPerChunk * voxelPixelSize;
export {placeNames};

const sides = [
  'left',
  'right',
  'up',
  'down',
];
/* const sideDeltas = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
}; */
const sideOffsets = {
  left: [0, 0],
  right: [1, 0],
  up: [0, 0],
  down: [0, 1],
};
const sideCrossAxes = {
  left: [0, 1],
  right: [0, 1],
  up: [1, 0],
  down: [1, 0],
};

export class MapBlock extends THREE.Vector3 {
  constructor(x, y) {
    super(x, y, 0);

    this.exitTarget = false;
    this.centerTarget = false;
    this.path = false;
    this.splinePoint = false;
    this.neighbors = [];
  }

  static TYPE_INDICES = (() => {
    let iota = 0;
    return {
      exit: ++iota,
      center: ++iota,
      spline: ++iota,
      path: ++iota,
    };
  })();

  static COLORS = {
    exit: '#00F',
    center: '#F00',
    spline: '#080',
    path: '#666',
    default: '#000',
  };

  /* static INDEX_COLOR_MAP = (() => {
    let map = {};
    for (let key in MapBlock.COLORS) {
      map[Block.TYPE_INDICES[key]] = MapBlock.COLORS[key];
    }
    return map;
  })(); */
  getLocalPosition(target) {
    return target.set(this.x * voxelWorldSize, 0, this.y * voxelWorldSize);
  }

  getType() {
    if (this.exitTarget) {
      return 'exit';
    } else if (this.centerTarget) {
      return 'exit';
    } else if (this.splinePoint) {
      return 'spline';
    } else if (this.path) {
      return 'path';
    } else {
      return 'default';
    }
  }

  toColorString() {
    const type = this.getType();
    return MapBlock.COLORS[type] ?? MapBlock.COLORS.default;
  }

  toUint8() {
    const type = this.getType();
    return MapBlock.TYPE_INDICES[type];
  }
}
export class MapChunk {
  constructor(blocks, x, y, width, height) {
    this.blocks = blocks;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getWorldPosition(target) {
    return target.set(this.x * numBlocksPerChunk * voxelWorldSize, 0, this.y * numBlocksPerChunk * voxelWorldSize);
  }

  getExitBlocks() {
    return this.blocks.filter(block => block.exitTarget);
  }
}

export const createMapChunk = (seed = 'map', x = 0, y = 0) => {
  const width = numBlocksPerChunk;
  const height = numBlocksPerChunk;

  // generate blocks
  const blocks = new Array(width * height);

  const rng = makeRng(seed, x, y);
  const r = () => -1 + 2 * rng();

  // blocks
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = x + y * width;
      const block = new MapBlock(x, y);
      blocks[index] = block;
    }
  }

  // exits
  const pathCandidates = [];
  const numExits = 2 + Math.floor(rng() * (2 + 1));
  const localExits = shuffle(sides.slice(), rng).slice(0, numExits);
  for (const side of localExits) {
    let [ox, oy] = sideOffsets[side];
    ox *= width - 1;
    oy *= height - 1;

    const [cx, cy] = sideCrossAxes[side];
    const vx = Math.floor(rng() * width);
    const vy = Math.floor(rng() * height);

    const x = ox + vx * cx;
    const y = oy + vy * cy;

    const block = blocks[x + y * width];
    block.exitTarget = true;

    pathCandidates.push(block);
  }

  // centers
  const numCenters = Math.floor(rng() * (2 + 1));
  for (let i = 0; i < numCenters; i++) {
    const x = 1 + Math.floor(rng() * (width - 2));
    const y = 1 + Math.floor(rng() * (height - 2));

    const block = blocks[x + y * width];
    block.centerTarget = true;

    pathCandidates.push(block);
  }

  const _connectBlocks = (block1, block2) => {
    const distance = Math.ceil(block1.distanceTo(block2));
    const numSplinePoints = Math.max(Math.floor(distance * 0.2), 3);
    const splinePoints = Array(numSplinePoints);

    localQuaternion.setFromRotationMatrix(
      localMatrix.lookAt(
        block1,
        block2,
        localVector.set(0, 1, 0),
      ),
    );

    for (let i = 0; i < numSplinePoints; i++) {
      const v = i / (numSplinePoints - 1);

      const point = localVector
        .copy(
          localVector2.set(block1.x, 0, block1.y),
        )
        .lerp(
          localVector3.set(block2.x, 0, block2.y),
          v,
        );

      const minDistance = Math.min(
        point.distanceTo(localVector2),
        point.distanceTo(localVector3),
      );

      localVector2.set(r() * minDistance, 0, 0);
      point.add(
        localVector2
          .applyQuaternion(localQuaternion),
      );

      const x = Math.round(point.x);
      const y = Math.round(point.z);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        splinePoints[i] = point.clone();

        const index = x + y * width;
        const block = blocks[index];
        block.splinePoint = true;
      } else {
        i--;
        continue;
      }

      block1.neighbors.push(block2);
      block2.neighbors.push(block1);
    }
    const curve = new THREE.CatmullRomCurve3(splinePoints);
    const lengths = curve.getLengths(numSplinePoints);
    let lengthSum = 0;
    for (let i = 0; i < lengths.length; i++) {
      lengthSum += lengths[i];
    }
    const curveLength = lengthSum;

    const numPoints = Math.ceil(curveLength) * 3;
    const points = curve.getPoints(numPoints);
    for (let i = 0; i < numPoints; i++) {
      const point = points[i];

      for (const dx of [-1, 1]) {
        const x = Math.round(point.x);
        const y = Math.round(point.z);
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const index = x + y * width;
          const block = blocks[index];
          block.path = true;
        }
      }
    }
  };

  const _getUnconnectedExitTargetSpecs = () => {
    return pathCandidates.map(block => {
      const map = new Map();
      const startEntry = {
        block,
        depth: 0,
      };
      map.set(block, startEntry);
      let foundExit = false;
      let deepestEntry = startEntry;

      const _recurse = (block, depth = 0) => {
        for (const neighbor of block.neighbors) {
          if (!map.has(neighbor)) {
            const neighborEntry = {
              block: neighbor,
              depth,
            };
            map.set(neighbor, neighborEntry);

            if (neighbor.exitTarget) {
              foundExit = true;
            }
            if (depth > deepestEntry.depth) {
              deepestEntry = map.get(neighbor);
            }
            _recurse(neighbor, depth + 1);
          }
        }
      };
      _recurse(block);

      if (!foundExit) {
        return {
          map,
          startEntry,
          deepestEntry,
        };
      } else {
        return null;
      }
    }).filter(m => m !== null);
  };
  let unconnectedExitTargetCandidates;
  while ((unconnectedExitTargetCandidates = _getUnconnectedExitTargetSpecs()).length > 0) {
    const exitTargetCandidateIndex = Math.floor(rng() * unconnectedExitTargetCandidates.length);
    const {map, startEntry, deepestEntry} = unconnectedExitTargetCandidates[exitTargetCandidateIndex];

    const unseenPathCandidates = pathCandidates.filter(pathCandidate => {
      return !map.has(pathCandidate);
    }).sort((a, b) => {
      return a.distanceTo(deepestEntry.block) - b.distanceTo(deepestEntry.block);
    });
    _connectBlocks(deepestEntry.block, unseenPathCandidates[0]);
  }

  const chunk = new MapChunk(blocks, x, y, width, height);
  return chunk;
};
