
import * as THREE from 'three';
import {
  rootScene,
} from './renderer.js';
import physicsManager from './physics-manager.js';

const identityQuaternion = new THREE.Quaternion();

const heightTolerance = 0.6;
const tmpVec2 = new THREE.Vector2();

const materialIdle = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(221,213,213)')});
const materialReached = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(171,163,163)')});
const materialIdle2 = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(121,213,113)')});
const materialReached2 = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(71,163,63)')});
const materialFrontier = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(92,133,214)')});
const materialFrontier2 = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(42,83,164)')});
const materialStart = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(191,64,64)')});
const materialDest = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(191,64,170)')});
const materialPath = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(149,64,191)')});
const materialPath2 = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(99,14,141)')});
const materialObstacle = new THREE.MeshStandardMaterial({color: new THREE.Color('rgb(134,134,121)')});

class PathFinder {
  constructor({width = 15, height = 15, voxelHeight = 2, lowestY = 0.1, highestY = 15, highestY2 = 30, debugRender = false}) {
    this.isStart = false;
    this.isRising = false;
    this.isRising2 = false;
    this.isGeneratedVoxelMap = false;
    this.width = (width % 2 === 0) ? (width + 1) : (width);
    this.height = (height % 2 === 0) ? (height + 1) : (height);
    this.voxelHeight = voxelHeight;
    this.voxelHeightHalf = this.voxelHeight / 2;
    this.start = new THREE.Vector2(0, 3);
    this.dest = new THREE.Vector2(13, 3);
    this.lowestY = lowestY;
    this.highestY = highestY;
    this.highestY2 = highestY2;
    this.voxelsY = this.lowestY;
    this.voxelsY2 = this.lowestY;
    this.isAutoInit = false;
    this.debugRender = debugRender;

    this.frontiers = [];
    this.voxels = new THREE.Group();
    this.voxels.name = 'voxels';
    this.voxels.visible = debugRender;
    rootScene.add(this.voxels);
    this.voxels2 = new THREE.Group();
    rootScene.add(this.voxels2);
    this.voxels2.name = 'voxels2';
    this.voxels2.visible = debugRender;

    this.voxelo = {};
    this.voxelo2 = {};

    // const geometry = new THREE.BoxGeometry();
    this.geometry = new THREE.BoxGeometry();
    // geometry.translate(0, -1.2, 0); //
    // geometry.scale(0.9, 0.1, 0.9);
    // geometry.scale(0.1, this.voxelHeight, 0.1);
    // geometry.scale(0.9, 0.1, 0.9);
    // this.geometry.scale(0.9, 0.1, 0.9);
    this.geometry.scale(0.9, 1, 0.9);
    // for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
    //   for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
    //     const voxel = new THREE.Mesh(geometry, materialIdle);
    //     this.voxels.add(voxel);
    //     voxel.position.set(x, this.lowestY, z);
    //     voxel.updateMatrixWorld();
    //     voxel._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
    //     voxel.position.x = x;
    //     voxel.position.z = z;
    //     voxel._x = x;
    //     voxel._z = z;
    //     voxel._isReached = false;
    //   }
    // }
    // for (let z = -(this.height - 1) / 2; z < this.height / 2; z++) {
    //   for (let x = -(this.width - 1) / 2; x < this.width / 2; x++) {
    //     const voxel = new THREE.Mesh(geometry, materialIdle2);
    //     this.voxels2.add(voxel);
    //     voxel.position.set(x, this.lowestY, z);
    //     voxel.updateMatrixWorld();
    //     voxel._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
    //     voxel.position.x = x;
    //     voxel.position.z = z;
    //     voxel._x = x;
    //     voxel._z = z;
    //     voxel._isReached = false;
    //   }
    // }

    // this.resetStartDest(1, this.start.x, this.start.y, 2, this.dest.x, this.dest.y);
  }

  getPath(start, dest, range, waypointResult) {
    // test
    start = new THREE.Vector3().copy(window.npcPlayer.position);
    // start.x += 1;
    // test end
    start.x = Math.round(start.x);
    start.z = Math.round(start.z);
    // window.test = this.createVoxel(start.x, start.z);

    let startLayer;
    const {voxel: startVoxel, voxel2: startVoxel2} = this.createVoxelAnd2(start.x, start.z);
    if (Math.abs(startVoxel.position.y - window.npcPlayer.position.y) < Math.abs(startVoxel2.position.y - window.npcPlayer.position.y)) {
      startLayer = 1;
    } else {
      startLayer = 2;
    }
    if (startLayer === 1) {
      this.startVoxel = startVoxel;
    } else if (startLayer === 2) {
      this.startVoxel = startVoxel2;
    }
    this.startVoxel._isStart = true;
    this.startVoxel._isReached = true;
    // this.startVoxel._priority = start.manhattanDistanceTo(dest)
    this.startVoxel._priority = this.start.distanceTo(this.dest);
    this.startVoxel._costSoFar = 0;
    this.frontiers.push(this.startVoxel);
    this.startVoxel.material = materialStart;

    this.step();
  }

  createVoxelAnd2(x, z) {
    const voxel = new THREE.Mesh(this.geometry, materialIdle);
    this.voxels.add(voxel);
    voxel.position.set(x, this.lowestY, z);
    voxel._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
    voxel._isStart = false;
    voxel._isDest = false;
    voxel._isReached = false;
    voxel._priority = 0;
    voxel._costSoFar = 0;
    voxel._prev = null;
    voxel._next = null;

    this.detect(voxel);
    voxel.updateMatrixWorld();
    this.voxelo[`${x}_${z}`] = voxel;

    //

    const voxel2 = new THREE.Mesh(this.geometry, materialIdle2);
    this.voxels2.add(voxel2);
    voxel2.position.copy(voxel.position);
    voxel2._risingState = 'initial'; // 'initial', 'colliding', 'stopped'
    voxel2._isStart = false;
    voxel2._isDest = false;
    voxel2._isReached = false;
    voxel2._priority = 0;
    voxel2._costSoFar = 0;
    voxel2._prev = null;
    voxel2._next = null;

    this.detect2(voxel2);
    voxel2.updateMatrixWorld();
    this.voxelo2[`${x}_${z}`] = voxel2;

    return {voxel, voxel2};
  }

  detect(voxel) {
    if (voxel._risingState === 'initial' || voxel._risingState === 'colliding') {
      const isCollide = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, voxel.position, identityQuaternion);
      if (isCollide) {
        voxel._risingState = 'colliding';
      } else if (voxel._risingState === 'colliding') {
        voxel._risingState = 'stopped';
      }
    }
    if (voxel.position.y >= this.highestY || voxel._risingState === 'stopped') {
      // do nothing, stop recur
    } else {
      voxel.position.y += 0.1;
      this.detect(voxel);
    }
  }

  detect2(voxel2) {
    if (voxel2._risingState === 'initial' || voxel2._risingState === 'colliding') {
      const isCollide = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, voxel2.position, identityQuaternion);
      if (isCollide) {
        voxel2._risingState = 'colliding';
      } else if (voxel2._risingState === 'colliding') {
        voxel2._risingState = 'stopped';
      }
    }
    if (voxel2.position.y >= this.highestY || voxel2._risingState === 'stopped') {
      // do nothing, stop recur
    } else {
      voxel2.position.y += 0.1;
      this.detect2(voxel2);
    }
  }

  async init() { // Use highestY and highestY2, to auto rise() -> rise2() -> generateVoxelMap().
    const re = await new Promise(resolve => {
      this.resolveInit = resolve;

      this.isAutoInit = true;
      this.rise();
      this.update();
    });
    if (re === true) console.log('PathFinder auto inited.');
  }

  update() {
    // console.log('update');
    // if (this.isRising && this.voxels) { // mark: generate voxel map
    //   this.voxels.children.forEach((voxel, i) => {
    //     if (voxel._risingState === 'initial' || voxel._risingState === 'colliding') {
    //       voxel.position.y += 0.1;
    //       voxel.updateMatrixWorld();
    //       // const isCollide = physicsManager.collideCapsule(0.5, 1, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
    //       // const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
    //       const isCollide = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, voxel.position, localQuaternion.set(0, 0, 0, 1));
    //       if (isCollide) {
    //         voxel._risingState = 'colliding';
    //       } else if (voxel._risingState === 'colliding') {
    //         voxel._risingState = 'stopped';
    //       }
    //     }
    //   });
    //   this.voxelsY += 0.1;
    //   if (this.voxelsY > this.highestY) {
    //     this.rise2();
    //   } else {
    //     if (this.isAutoInit) this.update();
    //   }
    // }
    // if (this.isRising2 && this.voxels2) {
    //   // if (this.debugRender) console.log(this.getVoxel2(0, 0).position.y);
    //   this.voxels2.children.forEach((voxel, i) => {
    //     if (voxel._risingState === 'initial' || voxel._risingState === 'colliding') {
    //       voxel.position.y += 0.1;
    //       voxel.updateMatrixWorld();
    //       // const isCollide = physicsManager.collideCapsule(0.5, 1, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
    //       // const isCollide = physicsManager.collideBox(0.5, 0.05, 0.5, voxel.position, localQuaternion.set(0, 0, 0, 1), 1);
    //       const isCollide = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, voxel.position, localQuaternion.set(0, 0, 0, 1));
    //       if (isCollide) {
    //         voxel._risingState = 'colliding';
    //       } else if (voxel._risingState === 'colliding') {
    //         voxel._risingState = 'stopped';
    //       }
    //     }
    //   });
    //   this.voxelsY2 += 0.1;
    //   if (this.voxelsY2 > this.highestY2) {
    //     this.generateVoxelMap();
    //     this.resolveInit(true);
    //   } else {
    //     if (this.isAutoInit) this.update();
    //   }
    // }
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
          } else if (biasToLayer2 > this.voxelHeight) {
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
    if (this.debugRender) console.log('generated voxel map');
  }

  resetStartDest(startLayer, startX, startZ, destLayer, destX, destZ) {
    this.isFound = false;
    this.frontiers.length = 0;

    this.voxels.children.forEach(voxel => {
      voxel._isStart = false;
      voxel._isDest = false;
      voxel._isReached = false;
      voxel._priority = 0;
      voxel._costSoFar = 0;
      voxel._prev = null;
      voxel._next = null;
      if (voxel.material !== materialObstacle) voxel.material = materialIdle;
    });

    this.voxels2.children.forEach(voxel => {
      voxel._isStart = false;
      voxel._isDest = false;
      voxel._isReached = false;
      voxel._priority = 0;
      voxel._costSoFar = 0;
      voxel._prev = null;
      voxel._next = null;
      if (voxel.material !== materialObstacle) voxel.material = materialIdle2;
    });

    this.start.set(startX, startZ);
    this.dest.set(destX, destZ);

    if (startLayer === 1) {
      this.startVoxel = this.getVoxel(startX, startZ);
    } else if (startLayer === 2) {
      this.startVoxel = this.getVoxel2(startX, startZ);
    }
    this.startVoxel._isStart = true;
    this.startVoxel._isReached = true;
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

  // riseAgain() {
  //   this.voxels.children.forEach(voxel => {
  //     voxel._risingState = 'initial';
  //   });
  // }

  rise2() {
    this.isRising = false;

    this.voxels2.children.forEach((voxel, i) => {
      voxel.position.y = this.voxels.children[i].position.y;
    });

    this.isRising2 = true;
  }

  getVoxel(x, z) {
    // x += (this.width - 1) / 2;
    // y += (this.height - 1) / 2;
    // if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    // return this.voxels.children[this.xyToSerial(this.width, {x, y})];
    return this.voxelo[`${x}_${z}`];
  }

  getVoxel2(x, z) {
    // x += (this.width - 1) / 2;
    // y += (this.height - 1) / 2;
    // if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    // return this.voxels2.children[this.xyToSerial(this.width, {x, y})];
    return this.voxelo2[`${x}_${z}`];
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

  xyToSerial(width, xy) { // :index
    return xy.y * width + xy.x;
  }

  recur(voxel) {
    if (voxel) {
      if (!voxel._isStart && !voxel._isDest) { // todo: Don't run if !this.debugRender.
        if (voxel.parent === this.voxels) {
          voxel.material = materialPath;
        } else {
          voxel.material = materialPath2;
        }
      }
      if (voxel._prev) voxel._prev._next = voxel;
      this.recur(voxel._prev);
    }
  }

  stepVoxel(voxel, prevVoxel) {
    if (!voxel) return;
    if (voxel._isObstacle) return;
    const newCost = prevVoxel._costSoFar + 1;
    // if (voxel._isReached === false || newCost < voxel._costSoFar) {
    if (voxel._isReached === false) {
      // Seems no need `|| newCost < voxel._costSoFar` ? Need? http://disq.us/p/2mgpazs
      voxel._isReached = true;
      voxel._costSoFar = newCost;

      // todo: use Vector2 instead of _x _z.
      // voxel._priority = tmpVec2.set(voxel._x, voxel._z).manhattanDistanceTo(dest)
      // voxel._priority = tmpVec2.set(voxel._x, voxel._z).distanceToSquared(dest)
      voxel._priority = tmpVec2.set(voxel.position.x, voxel.poxition.z).distanceTo(this.dest);
      voxel._priority += newCost;
      this.frontiers.push(voxel);
      this.frontiers.sort((a, b) => a._priority - b._priority);

      if (!voxel._isStart && !voxel._isDest) {
        if (voxel.parent === this.voxels) {
          voxel.material = materialFrontier;
        } else {
          voxel.material = materialFrontier2;
        }
      }
      voxel._prev = prevVoxel;
    }
    if (voxel._isDest) {
      // if (this.debugRender) console.log('found');
      this.isFound = true;
      this.recur(voxel);
    }
  }

  step() {
    // if (this.debugRender) console.log('step');
    // debugger
    // if (!this.isGeneratedVoxelMap) {
    //   console.warn('voxel map not generated.');
    //   return;
    // }
    if (this.frontiers.length <= 0) {
      if (this.debugRender) console.log('finish');
      return;
    }
    if (this.isFound) return;

    const currentVoxel = this.frontiers.shift();
    if (!currentVoxel._isStart) {
      if (currentVoxel.parent === this.voxels) {
        currentVoxel.material = materialReached;
      } else {
        currentVoxel.material = materialReached2;
      }
    }

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

  toggleVoxelsVisible() {
    this.voxels.visible = !this.voxels.visible;
  }

  toggleVoxels2Visible() {
    this.voxels2.visible = !this.voxels2.visible;
  }

  toggleVoxelsWireframe() {
    materialIdle.wireframe = !materialIdle.wireframe;
  }

  toggleVoxels2Wireframe() {
    materialIdle2.wireframe = !materialIdle2.wireframe;
  }

  moveDownVoxels() {
    this.voxels.position.y -= 0.5;
    this.voxels.updateMatrixWorld();
  }

  moveDownVoxels2() {
    this.voxels2.position.y -= 0.5;
    this.voxels2.updateMatrixWorld();
  }

  getHighestY() {
    let highestY = -Infinity;
    this.voxels.children.forEach(voxel => {
      if (voxel.position.y > highestY) highestY = voxel.position.y;
    });
    return highestY;
  }

  getHighestY2() {
    let highestY = -Infinity;
    this.voxels2.children.forEach(voxel => {
      if (voxel.position.y > highestY) highestY = voxel.position.y;
    });
    return highestY;
  }
}

export {PathFinder};
