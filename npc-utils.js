
import * as THREE from 'three';
import {
  rootScene,
} from './renderer.js';
import metaversefileApi from 'metaversefile';
import physicsManager from './physics-manager.js';

const localPlayer = metaversefileApi.useLocalPlayer();
const localQuaternion = new THREE.Quaternion();

const heightTolerance = 0.6;
const heightCanGoThrough = 1.5;
const heightCanGoThrough2 = 30;
const tmpVec2 = new THREE.Vector2();

const materialIdle = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(221,213,213)')});
const materialAct = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(204,191,179)')});
const materialFrontier = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(92,133,214)')});
const materialStart = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(191,64,64)')});
const materialDest = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(191,64,170)')});
const materialPath = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(149,64,191)')});
const materialObstacle = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(134,134,121)')});

class PathFinder {
  constructor() {
    this.isStart = false;
    this.isRising = false;
    this.isRising2 = false;
    this.isGeneratedVoxelMap = false;
    this.width = 71;
    this.height = 71;
    this.start = new THREE.Vector2(0, 3);
    this.dest = new THREE.Vector2(13, 3);

    this.frontiers = [];
    this.blocks = new THREE.Group();
    this.blocks.name = 'blocks';
    rootScene.add(this.blocks);
    this.blocks2 = new THREE.Group();
    rootScene.add(this.blocks2);
    this.blocks2.name = 'blocks2';

    const geometry = new THREE.BoxGeometry();
    geometry.scale(0.9, 0.1, 0.9);
    // geometry.translate(0, -1.2, 0); //
    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const block = new THREE.Mesh(geometry, materialIdle);
        this.blocks.add(block);
        block.position.set(x, -0.1, z);
        block.updateMatrixWorld();
        block._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
        block.position.x = x;
        block.position.z = z;
        block._x = x;
        block._z = z;
        block._isAct = false;
      }
    }
    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const block = new THREE.Mesh(geometry, materialIdle);
        this.blocks2.add(block);
        block.position.set(x, -0.1, z);
        block.updateMatrixWorld();
        block._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
        block.position.x = x;
        block.position.z = z;
        block._x = x;
        block._z = z;
        block._isAct = false;
      }
    }

    this.resetStartDest(1, this.start.x, this.start.y, 2, this.dest.x, this.dest.y);
  }

  update() {
    if (this.isRising && this.blocks) { // mark: generate voxel map
      this.blocks.children.forEach((block, i) => {
        if (block._risingState === 'initial' || block._risingState === 'colliding') {
          block.position.y += 0.1;
          block.updateMatrixWorld();
          // const isCollide = physicsManager.collideCapsule(0.5, 1, block.position, localQuaternion.set(0, 0, 0, 1), 1);
          const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, block.position, localQuaternion.set(0, 0, 0, 1), 1);
          if (isCollide) {
            block._risingState = 'colliding';
          } else if (block._risingState === 'colliding') {
            block._risingState = 'stopped';
          }
        }
      });
    }
    if (this.isRising2 && this.blocks2) {
      this.blocks2.children.forEach((block, i) => {
        if (block._risingState === 'initial' || block._risingState === 'colliding') {
          block.position.y += 0.1;
          block.updateMatrixWorld();
          // const isCollide = physicsManager.collideCapsule(0.5, 1, block.position, localQuaternion.set(0, 0, 0, 1), 1);
          const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, block.position, localQuaternion.set(0, 0, 0, 1), 1);
          if (isCollide) {
            block._risingState = 'colliding';
          } else if (block._risingState === 'colliding') {
            block._risingState = 'stopped';
          }
        }
      });
    }
    if (window.petDestBlock) { // pet auto go along the path found by A*.
      if (Math.abs(window.fox.position.x - window.petDestBlock.position.x) < 0.5 && Math.abs(window.fox.position.z - window.petDestBlock.position.z) < 0.5) {
        // debugger
        if (window.petDestBlock._next) window.petDestBlock = window.petDestBlock._next;
      }
    }
    // fox auto follow avatar
    if (this.isGeneratedVoxelMap && localPlayer && (Math.abs(localPlayer.position.x - this.destBlock.position.x) > 3 || Math.abs(localPlayer.position.z - this.destBlock.position.z) > 3)) {
      this.foxFollowAvatar();
    }
  }

  generateVoxelMap() {
    this.isRising = false;
    this.isRising2 = false;

    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const currentBlock = this.getBlock(x, z);

        const leftBlock2 = this.getBlock2(x - 1, z);
        if (leftBlock2) {
          const biasToLayer2 = leftBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._leftBlock = leftBlock2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const leftBlock = this.getBlock(x - 1, z);
            if (leftBlock && leftBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._leftBlock = leftBlock;
            }
          }
        }

        const rightBlock2 = this.getBlock2(x + 1, z);
        if (rightBlock2) {
          const biasToLayer2 = rightBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._rightBlock = rightBlock2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const rightBlock = this.getBlock(x + 1, z);
            if (rightBlock && rightBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._rightBlock = rightBlock;
            }
          }
        }

        const btmBlock2 = this.getBlock2(x, z - 1);
        if (btmBlock2) {
          const biasToLayer2 = btmBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._btmBlock = btmBlock2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const btmBlock = this.getBlock(x, z - 1);
            if (btmBlock && btmBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._btmBlock = btmBlock;
            }
          }
        }

        const topBlock2 = this.getBlock2(x, z + 1);
        if (topBlock2) {
          const biasToLayer2 = topBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._topBlock = topBlock2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const topBlock = this.getBlock(x, z + 1);
            if (topBlock && topBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._topBlock = topBlock;
            }
          }
        }
      }
    }
    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const currentBlock = this.getBlock2(x, z);

        const leftBlock2 = this.getBlock2(x - 1, z);
        if (leftBlock2) {
          const biasToLayer2 = leftBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._leftBlock = leftBlock2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const leftBlock = this.getBlock(x - 1, z);
            if (leftBlock && leftBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._leftBlock = leftBlock;
            }
          }
        }

        const rightBlock2 = this.getBlock2(x + 1, z);
        if (rightBlock2) {
          const biasToLayer2 = rightBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._rightBlock = rightBlock2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const rightBlock = this.getBlock(x + 1, z);
            if (rightBlock && rightBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._rightBlock = rightBlock;
            }
          }
        }

        const btmBlock2 = this.getBlock2(x, z - 1);
        if (btmBlock2) {
          const biasToLayer2 = btmBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._btmBlock = btmBlock2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const btmBlock = this.getBlock(x, z - 1);
            if (btmBlock && btmBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._btmBlock = btmBlock;
            }
          }
        }

        const topBlock2 = this.getBlock2(x, z + 1);
        if (topBlock2) {
          const biasToLayer2 = topBlock2.position.y - currentBlock.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentBlock._topBlock = topBlock2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const topBlock = this.getBlock(x, z + 1);
            if (topBlock && topBlock.position.y - currentBlock.position.y < heightTolerance) {
              currentBlock._topBlock = topBlock;
            }
          }
        }
      }
    }

    // this.blocks.children.forEach((block, i) => {
    //   if (block.position.y > 3) {
    //     block._isObstacle = true
    //     block.material = materialObstacle
    //   }
    // })

    this.isGeneratedVoxelMap = true;
    console.log('generated voxel map');
  }

  resetStartDest(startLayer, startX, startZ, destLayer, destX, destZ) {
    this.isFound = false;
    this.frontiers.length = 0;

    this.blocks.children.forEach(block => {
      block._isStart = false;
      block._isDest = false;
      block._isAct = false;
      block._priority = 0;
      block._costSoFar = 0;
      block._prev = null;
      block._next = null;
      if (block.material !== materialObstacle) block.material = materialIdle;
    });

    this.blocks2.children.forEach(block => {
      block._isStart = false;
      block._isDest = false;
      block._isAct = false;
      block._priority = 0;
      block._costSoFar = 0;
      block._prev = null;
      block._next = null;
      if (block.material !== materialObstacle) block.material = materialIdle;
    });

    this.start.set(startX, startZ);
    this.dest.set(destX, destZ);

    if (startLayer === 1) {
      this.startBlock = this.getBlock(startX, startZ);
    } else if (startLayer === 2) {
      this.startBlock = this.getBlock2(startX, startZ);
    }
    this.startBlock._isStart = true;
    this.startBlock._isAct = true;
    // this.startBlock._priority = start.manhattanDistanceTo(dest)
    this.startBlock._priority = this.start.distanceTo(this.dest);
    this.startBlock._costSoFar = 0;
    this.frontiers.push(this.startBlock);
    this.startBlock.material = materialStart;

    if (destLayer === 1) {
      this.destBlock = this.getBlock(destX, destZ);
    } else if (destLayer === 2) {
      this.destBlock = this.getBlock2(destX, destZ);
    }
    this.destBlock._isDest = true;
    this.destBlock.material = materialDest;
  }

  rise() {
    this.isRising = true;
  }

  riseAgain() {
    this.blocks.children.forEach(block => {
      block._risingState = 'initial';
    });
  }

  rise2() {
    // NOTE: Need rise to higher than heightCanGoThrough2.
    this.isRising = false;

    this.blocks2.children.forEach((block, i) => {
      block.position.y = this.blocks.children[i].position.y;
    });

    this.isRising2 = true;
  }

  getBlock(x, y) {
    x += (this.width - 1) / 2;
    y += (this.height - 1) / 2;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.blocks.children[this.xyToSerial(this.width, {x, y})];
  }

  getBlock2(x, y) {
    x += (this.width - 1) / 2;
    y += (this.height - 1) / 2;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.blocks2.children[this.xyToSerial(this.width, {x, y})];
  }

  swapStartDest() {
    tmpVec2.copy(this.start);
    this.start.copy(this.dest);
    this.dest.copy(tmpVec2);
  }

  tenStep() {
    if (!this.isGeneratedVoxelMap) {
      console.warn('voxel map not generated.');
      return;
    }
    for (let i = 0; i < 10; i++) this.step();
  }

  untilFound() {
    if (!this.isGeneratedVoxelMap) {
      console.warn('voxel map not generated.');
      return;
    }
    while (this.frontiers.length > 0 && !this.isFound) this.step();
  }

  foxFollowAvatar() { // run after: rise(), generateVoxelMap(), and "E" activated the fox.
    const foxX = Math.round(window.fox.position.x);
    const foxZ = Math.round(window.fox.position.z);
    const localPlayerX = Math.round(localPlayer.position.x);
    const localPlayerZ = Math.round(localPlayer.position.z);

    let startLayer, destLayer;
    const startBlock = this.getBlock(foxX, foxZ);
    const startBlock2 = this.getBlock2(foxX, foxZ);
    const destBlock = this.getBlock(localPlayerX, localPlayerZ);
    const destBlock2 = this.getBlock2(localPlayerX, localPlayerZ);
    if (Math.abs(startBlock.position.y - window.fox.position.y) < Math.abs(startBlock2.position.y - window.fox.position.y)) {
      startLayer = 1;
    } else {
      startLayer = 2;
    }
    if (Math.abs(destBlock.position.y - localPlayer.position.y) < Math.abs(destBlock2.position.y - localPlayer.position.y)) {
      destLayer = 1;
    } else {
      destLayer = 2;
    }

    this.resetStartDest(
      startLayer,
      foxX,
      foxZ,
      destLayer,
      localPlayerX,
      localPlayerZ,
    );
    this.untilFound();
    window.petDestBlock = this.startBlock;
  }

  xyToSerial(width, xy) { // :index
    return xy.y * width + xy.x;
  }

  stepBlock(block, prevBlock) {
    function recur(block) {
      if (block) {
        if (!block._isStart && !block._isDest) block.material = materialPath;
        if (block._prev) block._prev._next = block;
        recur(block._prev);
      }
    }
    if (!block) return;
    if (block._isObstacle) return;
    const newCost = prevBlock._costSoFar + 1;
    // if (block._isAct === false || newCost < block._costSoFar) {
    if (block._isAct === false) {
      // Seems no need `|| newCost < block._costSoFar` ? Need? http://disq.us/p/2mgpazs
      block._isAct = true;
      block._costSoFar = newCost;

      // todo: use Vector2 instead of _x _z.
      // block._priority = tmpVec2.set(block._x, block._z).manhattanDistanceTo(dest)
      // block._priority = tmpVec2.set(block._x, block._z).distanceToSquared(dest)
      block._priority = tmpVec2.set(block._x, block._z).distanceTo(this.dest);
      block._priority += newCost;
      this.frontiers.push(block);
      this.frontiers.sort((a, b) => a._priority - b._priority);

      if (!block._isStart && !block._isDest) block.material = materialFrontier;
      block._prev = prevBlock;
    }
    if (block._isDest) {
      console.log('found');
      this.isFound = true;
      recur(block);
    }
  }

  step() {
    console.log('step');
    // debugger
    if (!this.isGeneratedVoxelMap) {
      console.warn('voxel map not generated.');
      return;
    }
    if (this.frontiers.length <= 0) {
      console.log('finish');
      return;
    }
    if (this.isFound) return;

    const currentBlock = this.frontiers.shift();
    if (!currentBlock._isStart) currentBlock.material = materialAct;

    if (currentBlock._leftBlock) {
      this.stepBlock(currentBlock._leftBlock, currentBlock);
      if (this.isFound) return;
    }

    if (currentBlock._rightBlock) {
      this.stepBlock(currentBlock._rightBlock, currentBlock);
      if (this.isFound) return;
    }

    if (currentBlock._btmBlock) {
      this.stepBlock(currentBlock._btmBlock, currentBlock);
      if (this.isFound) return;
    }

    if (currentBlock._topBlock) {
      this.stepBlock(currentBlock._topBlock, currentBlock);
      // if (this.isFound) return
    }
  }
}

export {PathFinder};
