
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
    this.voxels = new THREE.Group();
    this.voxels.name = 'voxels';
    rootScene.add(this.voxels);
    this.voxels2 = new THREE.Group();
    rootScene.add(this.voxels2);
    this.voxels2.name = 'voxels2';

    const geometry = new THREE.BoxGeometry();
    geometry.scale(0.9, 0.1, 0.9);
    // geometry.translate(0, -1.2, 0); //
    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const voxel = new THREE.Mesh(geometry, materialIdle);
        this.voxels.add(voxel);
        voxel.position.set(x, -0.1, z);
        voxel.updateMatrixWorld();
        voxel._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
        voxel.position.x = x;
        voxel.position.z = z;
        voxel._x = x;
        voxel._z = z;
        voxel._isAct = false;
      }
    }
    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const voxel = new THREE.Mesh(geometry, materialIdle);
        this.voxels2.add(voxel);
        voxel.position.set(x, -0.1, z);
        voxel.updateMatrixWorld();
        voxel._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
        voxel.position.x = x;
        voxel.position.z = z;
        voxel._x = x;
        voxel._z = z;
        voxel._isAct = false;
      }
    }

    this.resetStartDest(1, this.start.x, this.start.y, 2, this.dest.x, this.dest.y);
  }

  update() {
    if (this.isRising && this.voxels) { // mark: generate voxel map
      this.voxels.children.forEach((voxel, i) => {
        if (voxel._risingState === 'initial' || voxel._risingState === 'colliding') {
          voxel.position.y += 0.1;
          voxel.updateMatrixWorld();
          // const isCollide = physicsManager.collideCapsule(0.5, 1, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
          const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
          if (isCollide) {
            voxel._risingState = 'colliding';
          } else if (voxel._risingState === 'colliding') {
            voxel._risingState = 'stopped';
          }
        }
      });
    }
    if (this.isRising2 && this.voxels2) {
      this.voxels2.children.forEach((voxel, i) => {
        if (voxel._risingState === 'initial' || voxel._risingState === 'colliding') {
          voxel.position.y += 0.1;
          voxel.updateMatrixWorld();
          // const isCollide = physicsManager.collideCapsule(0.5, 1, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
          const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
          if (isCollide) {
            voxel._risingState = 'colliding';
          } else if (voxel._risingState === 'colliding') {
            voxel._risingState = 'stopped';
          }
        }
      });
    }
    if (window.petDestVoxel) { // pet auto go along the path found by A*.
      if (Math.abs(window.fox.position.x - window.petDestVoxel.position.x) < 0.5 && Math.abs(window.fox.position.z - window.petDestVoxel.position.z) < 0.5) {
        // debugger
        if (window.petDestVoxel._next) window.petDestVoxel = window.petDestVoxel._next;
      }
    }
    // fox auto follow avatar
    if (this.isGeneratedVoxelMap && localPlayer && (Math.abs(localPlayer.position.x - this.destVoxel.position.x) > 3 || Math.abs(localPlayer.position.z - this.destVoxel.position.z) > 3)) {
      this.foxFollowAvatar();
    }
  }

  generateVoxelMap() {
    this.isRising = false;
    this.isRising2 = false;

    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const currentVoxel = this.getVoxel(x, z);

        const leftVoxel2 = this.getVoxel2(x - 1, z);
        if (leftVoxel2) {
          const biasToLayer2 = leftVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._leftVoxel = leftVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const leftVoxel = this.getVoxel(x - 1, z);
            if (leftVoxel && leftVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._leftVoxel = leftVoxel;
            }
          }
        }

        const rightVoxel2 = this.getVoxel2(x + 1, z);
        if (rightVoxel2) {
          const biasToLayer2 = rightVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._rightVoxel = rightVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const rightVoxel = this.getVoxel(x + 1, z);
            if (rightVoxel && rightVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._rightVoxel = rightVoxel;
            }
          }
        }

        const btmVoxel2 = this.getVoxel2(x, z - 1);
        if (btmVoxel2) {
          const biasToLayer2 = btmVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._btmVoxel = btmVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const btmVoxel = this.getVoxel(x, z - 1);
            if (btmVoxel && btmVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._btmVoxel = btmVoxel;
            }
          }
        }

        const topVoxel2 = this.getVoxel2(x, z + 1);
        if (topVoxel2) {
          const biasToLayer2 = topVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._topVoxel = topVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough) {
            const topVoxel = this.getVoxel(x, z + 1);
            if (topVoxel && topVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._topVoxel = topVoxel;
            }
          }
        }
      }
    }
    for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
      for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
        const currentVoxel = this.getVoxel2(x, z);

        const leftVoxel2 = this.getVoxel2(x - 1, z);
        if (leftVoxel2) {
          const biasToLayer2 = leftVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._leftVoxel = leftVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const leftVoxel = this.getVoxel(x - 1, z);
            if (leftVoxel && leftVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._leftVoxel = leftVoxel;
            }
          }
        }

        const rightVoxel2 = this.getVoxel2(x + 1, z);
        if (rightVoxel2) {
          const biasToLayer2 = rightVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._rightVoxel = rightVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const rightVoxel = this.getVoxel(x + 1, z);
            if (rightVoxel && rightVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._rightVoxel = rightVoxel;
            }
          }
        }

        const btmVoxel2 = this.getVoxel2(x, z - 1);
        if (btmVoxel2) {
          const biasToLayer2 = btmVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._btmVoxel = btmVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const btmVoxel = this.getVoxel(x, z - 1);
            if (btmVoxel && btmVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._btmVoxel = btmVoxel;
            }
          }
        }

        const topVoxel2 = this.getVoxel2(x, z + 1);
        if (topVoxel2) {
          const biasToLayer2 = topVoxel2.position.y - currentVoxel.position.y;
          if (biasToLayer2 < heightTolerance) {
            currentVoxel._topVoxel = topVoxel2;
          } else if (biasToLayer2 > heightCanGoThrough2) {
            const topVoxel = this.getVoxel(x, z + 1);
            if (topVoxel && topVoxel.position.y - currentVoxel.position.y < heightTolerance) {
              currentVoxel._topVoxel = topVoxel;
            }
          }
        }
      }
    }

    // this.voxels.children.forEach((voxel, i) => {
    //   if (voxel.position.y > 3) {
    //     voxel._isObstacle = true
    //     voxel.material = materialObstacle
    //   }
    // })

    this.isGeneratedVoxelMap = true;
    console.log('generated voxel map');
  }

  resetStartDest(startLayer, startX, startZ, destLayer, destX, destZ) {
    this.isFound = false;
    this.frontiers.length = 0;

    this.voxels.children.forEach(voxel => {
      voxel._isStart = false;
      voxel._isDest = false;
      voxel._isAct = false;
      voxel._priority = 0;
      voxel._costSoFar = 0;
      voxel._prev = null;
      voxel._next = null;
      if (voxel.material !== materialObstacle) voxel.material = materialIdle;
    });

    this.voxels2.children.forEach(voxel => {
      voxel._isStart = false;
      voxel._isDest = false;
      voxel._isAct = false;
      voxel._priority = 0;
      voxel._costSoFar = 0;
      voxel._prev = null;
      voxel._next = null;
      if (voxel.material !== materialObstacle) voxel.material = materialIdle;
    });

    this.start.set(startX, startZ);
    this.dest.set(destX, destZ);

    if (startLayer === 1) {
      this.startVoxel = this.getVoxel(startX, startZ);
    } else if (startLayer === 2) {
      this.startVoxel = this.getVoxel2(startX, startZ);
    }
    this.startVoxel._isStart = true;
    this.startVoxel._isAct = true;
    // this.startVoxel._priority = start.manhattanDistanceTo(dest)
    this.startVoxel._priority = this.start.distanceTo(this.dest);
    this.startVoxel._costSoFar = 0;
    this.frontiers.push(this.startVoxel);
    this.startVoxel.material = materialStart;

    if (destLayer === 1) {
      this.destVoxel = this.getVoxel(destX, destZ);
    } else if (destLayer === 2) {
      this.destVoxel = this.getVoxel2(destX, destZ);
    }
    this.destVoxel._isDest = true;
    this.destVoxel.material = materialDest;
  }

  rise() {
    this.isRising = true;
  }

  riseAgain() {
    this.voxels.children.forEach(voxel => {
      voxel._risingState = 'initial';
    });
  }

  rise2() {
    // NOTE: Need rise to higher than heightCanGoThrough2.
    this.isRising = false;

    this.voxels2.children.forEach((voxel, i) => {
      voxel.position.y = this.voxels.children[i].position.y;
    });

    this.isRising2 = true;
  }

  getVoxel(x, y) {
    x += (this.width - 1) / 2;
    y += (this.height - 1) / 2;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.voxels.children[this.xyToSerial(this.width, {x, y})];
  }

  getVoxel2(x, y) {
    x += (this.width - 1) / 2;
    y += (this.height - 1) / 2;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.voxels2.children[this.xyToSerial(this.width, {x, y})];
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
    const startVoxel = this.getVoxel(foxX, foxZ);
    const startVoxel2 = this.getVoxel2(foxX, foxZ);
    const destVoxel = this.getVoxel(localPlayerX, localPlayerZ);
    const destVoxel2 = this.getVoxel2(localPlayerX, localPlayerZ);
    if (Math.abs(startVoxel.position.y - window.fox.position.y) < Math.abs(startVoxel2.position.y - window.fox.position.y)) {
      startLayer = 1;
    } else {
      startLayer = 2;
    }
    if (Math.abs(destVoxel.position.y - localPlayer.position.y) < Math.abs(destVoxel2.position.y - localPlayer.position.y)) {
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
    window.petDestVoxel = this.startVoxel;
  }

  xyToSerial(width, xy) { // :index
    return xy.y * width + xy.x;
  }

  stepVoxel(voxel, prevVoxel) {
    function recur(voxel) {
      if (voxel) {
        if (!voxel._isStart && !voxel._isDest) voxel.material = materialPath;
        if (voxel._prev) voxel._prev._next = voxel;
        recur(voxel._prev);
      }
    }
    if (!voxel) return;
    if (voxel._isObstacle) return;
    const newCost = prevVoxel._costSoFar + 1;
    // if (voxel._isAct === false || newCost < voxel._costSoFar) {
    if (voxel._isAct === false) {
      // Seems no need `|| newCost < voxel._costSoFar` ? Need? http://disq.us/p/2mgpazs
      voxel._isAct = true;
      voxel._costSoFar = newCost;

      // todo: use Vector2 instead of _x _z.
      // voxel._priority = tmpVec2.set(voxel._x, voxel._z).manhattanDistanceTo(dest)
      // voxel._priority = tmpVec2.set(voxel._x, voxel._z).distanceToSquared(dest)
      voxel._priority = tmpVec2.set(voxel._x, voxel._z).distanceTo(this.dest);
      voxel._priority += newCost;
      this.frontiers.push(voxel);
      this.frontiers.sort((a, b) => a._priority - b._priority);

      if (!voxel._isStart && !voxel._isDest) voxel.material = materialFrontier;
      voxel._prev = prevVoxel;
    }
    if (voxel._isDest) {
      console.log('found');
      this.isFound = true;
      recur(voxel);
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

    const currentVoxel = this.frontiers.shift();
    if (!currentVoxel._isStart) currentVoxel.material = materialAct;

    if (currentVoxel._leftVoxel) {
      this.stepVoxel(currentVoxel._leftVoxel, currentVoxel);
      if (this.isFound) return;
    }

    if (currentVoxel._rightVoxel) {
      this.stepVoxel(currentVoxel._rightVoxel, currentVoxel);
      if (this.isFound) return;
    }

    if (currentVoxel._btmVoxel) {
      this.stepVoxel(currentVoxel._btmVoxel, currentVoxel);
      if (this.isFound) return;
    }

    if (currentVoxel._topVoxel) {
      this.stepVoxel(currentVoxel._topVoxel, currentVoxel);
      // if (this.isFound) return
    }
  }
}

export {PathFinder};
