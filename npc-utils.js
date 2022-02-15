
import * as THREE from 'three';
import {
  rootScene,
} from './renderer.js';
import physicsManager from './physics-manager.js';

const identityQuaternion = new THREE.Quaternion();

const localVector = new THREE.Vector3();
const localVoxel = new THREE.Object3D();

const colorIdle = new THREE.Color('rgb(221,213,213)');
const colorReached = new THREE.Color('rgb(171,163,163)');
const colorFrontier = new THREE.Color('rgb(92,133,214)');
const colorStart = new THREE.Color('rgb(0,255,255)');
const colorDest = new THREE.Color('rgb(255,255,0)');
const colorPath = new THREE.Color('rgb(149,64,191)');
const colorPathSimplified = new THREE.Color('rgb(69,0,98)');

class PathFinder {
  constructor({voxelHeight = 1.5, heightTolerance = 0.6, detectStep = 0.1, maxIterdetect = 1000, maxIterStep = 1000, maxVoxelCacheLen = 10000, debugRender = false}) {
    /* args:
      voxelHeight: Voxel height ( Y axis ) for collide detection, usually equal to npc's physical capsule height. X/Z axes sizes are hard-coded 1 now.
      heightTolerance: Used to check whether currentVoxel can go above to neighbor voxels.
      detectStep: How height every detecting step moving.
      maxIterdetect: How many steps can one voxel detecing iterate.
      maxIterStep: How many A* path-finding step can one getPath() iterate. One A* step can create up to 4 voxels, 0 ~ 4.
      maxVoxelCacheLen: How many detected voxels can be cached.
      debugRender: Whether show voxel boxes for debugging.
    */

    this.voxelHeight = voxelHeight;
    this.voxelHeightHalf = this.voxelHeight / 2;
    this.heightTolerance = heightTolerance;
    this.start = new THREE.Vector3();
    this.dest = new THREE.Vector3();
    this.debugRender = debugRender;
    this.detectStep = detectStep;
    this.iterDetect = 0;
    this.maxIterDetect = maxIterdetect;
    this.iterStep = 0;
    this.maxIterStep = maxIterStep;
    this.allowNearest = false;
    this.maxVoxelCacheLen = maxVoxelCacheLen;

    this.frontiers = [];
    this.voxels = new THREE.Group();
    this.voxels.name = 'voxels';

    this.voxelo = {};

    this.geometry = new THREE.BoxGeometry();
    this.geometry.scale(0.5, this.voxelHeight, 0.5);
    // this.geometry.scale(0.9, 0.1, 0.9);
    this.material = new THREE.MeshLambertMaterial({color: 0xffffff});
    this.maxDebugCount = this.maxVoxelCacheLen + this.maxIterStep * 4 + 1; // One step() can create up to 4 voxels. Add 1 startVoxel.
    this.debugMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxDebugCount);
    this.debugMesh.name = 'PathFinder debugMesh';
    this.debugMesh.setColorAt(0, colorIdle); // init instanceColor
    rootScene.add(this.debugMesh);

    this.waypointResult = [];
  }

  getPath(start, dest, allowNearest = false) {
    this.detectCount = 0;

    this.reset();
    if (this.voxels.children.length > this.maxVoxelCacheLen) this.disposeVoxelCache();

    this.start.set(
      Math.round(start.x),
      start.y,
      Math.round(start.z),
    );
    this.dest.set(
      Math.round(dest.x),
      dest.y,
      Math.round(dest.z),
    );

    this.allowNearest = allowNearest;

    this.startVoxel = this.createVoxel(this.start);
    this.startVoxel._isStart = true;
    this.startVoxel._isReached = true;
    // this.startVoxel._priority = start.manhattanDistanceTo(dest)
    this.startVoxel._priority = this.start.distanceTo(this.dest);
    this.startVoxel._costSoFar = 0;
    this.frontiers.push(this.startVoxel);

    this.destVoxel = this.createVoxel(this.dest);
    if (this.startVoxel === this.destVoxel) return;
    this.destVoxel._isDest = true;

    this.untilFound();
    if (this.isFound) {
      this.simplifyWaypointResultXZ(this.waypointResult[0]);
      this.simplifyWaypointResultXZ2(this.waypointResult[0]);
      this.simplifyWaypointResultX(this.waypointResult[0]);
      this.simplifyWaypointResultZ(this.waypointResult[0]);
      this.waypointResult.shift();
    }
    // console.log('waypointResult', this.waypointResult.length);

    if (this.debugRender) {
      // const len = this.waypointResult.length - 1;
      const len = this.waypointResult.length;
      for (let i = 0; i < len; i++) {
        const voxel = this.getVoxel(this.waypointResult[i].position);
        if (voxel) { // May already disposed.
          voxel._isPathSimplified = true;
        }
      }

      this.debugMesh.count = this.voxels.children.length;
      this.voxels.children.forEach((voxel, i) => {
        this.debugMesh.setMatrixAt(i, voxel.matrix);
        if (voxel._isStart) {
          this.debugMesh.setColorAt(i, colorStart);
        } else if (voxel._isDest) {
          this.debugMesh.setColorAt(i, colorDest);
        } else if (voxel._isPathSimplified) {
          this.debugMesh.setColorAt(i, colorPathSimplified);
        } else if (voxel._isPath) {
          this.debugMesh.setColorAt(i, colorPath);
        } else if (voxel._isFrontier) {
          this.debugMesh.setColorAt(i, colorFrontier);
        } else if (voxel._isReached) {
          this.debugMesh.setColorAt(i, colorReached);
        }
      });
      this.debugMesh.instanceMatrix.needsUpdate = true;
      this.debugMesh.instanceColor.needsUpdate = true;
    }

    console.log(this.detectCount);
    return this.isFound;
  }

  simplifyWaypointResultX(result) {
    if (result?._next?._next) {
      if (
        result.position.x === result._next._next.position.x && // check whether in one line
        Math.sign(result.position.z - result._next.position.z) === Math.sign(result._next.position.z - result._next._next.position.z) // check wheter in same direction ( will have different directions even in one line when on different layers). // TODO: simplifyWaypointResultXZ() should need check wheter in one layer too.
      ) {
        this.waypointResult.splice(this.waypointResult.indexOf(result._next), 1);
        result._next = result._next._next;
        result._next._prev = result;
        this.simplifyWaypointResultX(result);
      } else {
        this.simplifyWaypointResultX(result._next);
      }
    }
  }

  simplifyWaypointResultZ(result) {
    if (result?._next?._next) {
      if (
        result.position.z === result._next._next.position.z && // See simplifyWaypointResultX().
        Math.sign(result.position.x - result._next.position.x) === Math.sign(result._next.position.x - result._next._next.position.x) // See simplifyWaypointResultX().
      ) {
        this.waypointResult.splice(this.waypointResult.indexOf(result._next), 1);
        result._next = result._next._next;
        result._next._prev = result;
        this.simplifyWaypointResultZ(result);
      } else {
        this.simplifyWaypointResultZ(result._next);
      }
    }
  }

  simplifyWaypointResultXZ(result) {
    if (result?._next?._next?._next) {
      if (
        Math.abs(result._next._next.position.x - result.position.x) === Math.abs(result._next._next.position.z - result.position.z) &&
        (
          (result._prev && Math.abs(result._prev.position.x - result.position.x) === Math.abs(result._prev.position.z - result.position.z)) ||
          (
            result._next.position.x - result.position.x === result._next._next._next.position.x - result._next._next.position.x &&
            result._next.position.z - result.position.z === result._next._next._next.position.z - result._next._next.position.z
          )
        )
      ) {
        this.waypointResult.splice(this.waypointResult.indexOf(result._next), 1);
        result._next = result._next._next;
        result._next._prev = result;
      }
      this.simplifyWaypointResultXZ(result._next);
    } else if (result?._next?._next && !result._next._next._next) {
      if (Math.abs(result._next._next.position.x - result.position.x) === Math.abs(result._next._next.position.z - result.position.z)) {
        this.waypointResult.splice(this.waypointResult.indexOf(result._next), 1);
        result._next = result._next._next;
        result._next._prev = result;
      }
      this.simplifyWaypointResultXZ(result._next);
    }
  }

  simplifyWaypointResultXZ2(result) {
    if (result?._next?._next) {
      const xBias = Math.abs(result._next._next.position.x - result.position.x);
      const zBias = Math.abs(result._next._next.position.z - result.position.z);
      if (
        xBias === zBias &&
        xBias > 1 &&
        zBias > 1
      ) {
        this.waypointResult.splice(this.waypointResult.indexOf(result._next), 1);
        result._next = result._next._next;
        result._next._prev = result;
        this.simplifyWaypointResultXZ2(result);
      } else {
        this.simplifyWaypointResultXZ2(result._next);
      }
    }
  }

  resetVoxelDetect(voxel) {
    voxel._detectState = 'initial'; // 'initial', 'colliding', 'stopped'
    voxel._detectDir = null; // null, 1, -1
  }

  resetVoxelAStar(voxel) {
    voxel._isStart = false;
    voxel._isDest = false;
    voxel._isReached = false;
    voxel._priority = 0;
    voxel._costSoFar = 0;
    voxel._prev = null;
    voxel._next = null;
    voxel._isPath = false;
    voxel._isPathSimplified = false;
    voxel._isFrontier = false;
  }

  reset() {
    this.isFound = false;
    this.frontiers.length = 0;
    this.allowNearest = false;

    // // pure realtime, no any cache
    // this.voxels.children.length = 0;
    // this.voxelo = {};

    // simple cache
    this.voxels.children.forEach((voxel, i) => {
      this.resetVoxelAStar(voxel);
      if (this.debugRender) this.debugMesh.setColorAt(i, colorIdle);
    });
    if (this.debugRender) this.debugMesh.instanceColor.needsUpdate = true;
  }

  // disposeOld(maxVoxelsLen) {
  //   const currentLen = this.voxels.children.length;
  //   if (currentLen > maxVoxelsLen) {
  //     this.voxels.children = this.voxels.children.splice(currentLen - maxVoxelsLen);
  //     this.voxelo = {};
  //     this.voxels.children.forEach(voxel => {
  //       this.setVoxelo(voxel);
  //     });
  //   }
  // }

  // disposeOldFar() {} // TODO // Is needed? Just disposeOld() enough? I feel don't need, and even disposeOld() is not needed, just dispose all when reach maxVoxelsLen is ok.

  disposeVoxelCache() {
    this.voxels.children.length = 0;
    this.voxelo = {};
  }

  getVoxel(position) {
    return this.voxelo[`${position.x}_${position.y}_${position.z}`];
  }

  setVoxelo(voxel) {
    this.voxelo[`${voxel.position.x}_${voxel.position.y}_${voxel.position.z}`] = voxel;
  }

  createVoxel(position) {
    this.resetVoxelDetect(localVoxel);
    localVoxel.position.copy(position);
    localVoxel.position.y = Math.round(localVoxel.position.y * 10) / 10; // Round position.y to 0.1 because detectStep is 0.1; // Need round both input and output of `detect()`, because of float calc precision problem.
    this.iterDetect = 0;
    this.detect(localVoxel);
    localVoxel.position.y = Math.round(localVoxel.position.y * 10) / 10; // Round position.y to 0.1 because detectStep is 0.1; // Need round both input and output of `detect()`, because of float calc precision problem.

    let voxel = this.getVoxel(localVoxel.position);
    if (voxel) return voxel;

    voxel = new THREE.Object3D();
    this.voxels.add(voxel);
    this.resetVoxelAStar(voxel);

    voxel.position.copy(localVoxel.position);
    voxel.updateMatrixWorld();
    this.setVoxelo(voxel);

    return voxel;
  }

  detect(voxel) {
    this.detectCount++;
    if (this.iterDetect >= this.maxIterDetect) {
      console.warn('maxIterDetect reached! High probability created wrong redundant voxel with wrong position.y! Especially when localPlayer is flying.');
      // Use raycast first? No, raycast can only handle line not voxel.
      return;
    }
    this.iterDetect++;

    const overlapResult = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, voxel.position, identityQuaternion);
    let collide;
    if (overlapResult.objectIds.length === 1 && overlapResult.objectIds[0] === window.npcPlayer.physicsObject.physicsId) {
      collide = false;
    } else if (overlapResult.objectIds.length > 0) {
      collide = true;
    } else {
      collide = false;
    }

    if (voxel._detectState === 'initial') {
      if (collide) {
        voxel._detectDir = 1;
      } else {
        voxel._detectDir = -1;
      }
    }

    if (voxel._detectDir === 1) {
      if (voxel._detectState === 'initial' || voxel._detectState === 'colliding') {
        if (collide) {
          voxel._detectState = 'colliding';
        } else if (voxel._detectState === 'colliding') {
          voxel._detectState = 'stopped';
        }
      }
      if (voxel._detectState === 'stopped') {
        // do nothing, stop recur
      } else {
        voxel.position.y += voxel._detectDir * this.detectStep;
        this.detect(voxel);
      }
    } else if (voxel._detectDir === -1) {
      if (voxel._detectState === 'initial') {
        if (collide) {
          voxel._detectState = 'stopped';
        }
      }
      if (voxel._detectState === 'stopped') {
        voxel.position.y += -1 * voxel._detectDir * this.detectStep;
        // do nothing, stop recur
      } else {
        voxel.position.y += voxel._detectDir * this.detectStep;
        this.detect(voxel);
      }
    }
  }

  generateVoxelMapLeft(currentVoxel) {
    localVector.copy(currentVoxel.position);
    localVector.x += -1;
    const leftVoxel = this.createVoxel(localVector);
    if (leftVoxel.position.y - currentVoxel.position.y < this.heightTolerance) {
      currentVoxel._leftVoxel = leftVoxel;
    }
  }

  generateVoxelMapRight(currentVoxel) {
    localVector.copy(currentVoxel.position);
    localVector.x += 1;
    const rightVoxel = this.createVoxel(localVector);
    if (rightVoxel.position.y - currentVoxel.position.y < this.heightTolerance) {
      currentVoxel._rightVoxel = rightVoxel;
    }
  }

  generateVoxelMapBtm(currentVoxel) {
    localVector.copy(currentVoxel.position);
    localVector.z += -1;
    const btmVoxel = this.createVoxel(localVector);
    if (btmVoxel.position.y - currentVoxel.position.y < this.heightTolerance) {
      currentVoxel._btmVoxel = btmVoxel;
    }
  }

  generateVoxelMapTop(currentVoxel) {
    localVector.copy(currentVoxel.position);
    localVector.z += 1;
    const topVoxel = this.createVoxel(localVector);
    if (topVoxel.position.y - currentVoxel.position.y < this.heightTolerance) {
      currentVoxel._topVoxel = topVoxel;
    }
  }

  tenStep() {
    for (let i = 0; i < 10; i++) this.step();
  }

  untilFound() {
    this.iterStep = 0;
    while (this.frontiers.length > 0 && !this.isFound) {
      if (this.iterStep >= this.maxIterStep) {
        // console.log('maxIterDetect: untilFound');

        if (this.allowNearest) { // use nearest frontier, if not found.
          // // Use nearest frontier, if not found and npc reached dest.
          // // Check whether npc reached dest in such as npc repo, do not check here. Keep PathFinder as simple as possible.
          // const destResult = this.waypointResult[this.waypointResult.length - 1];
          // if (Math.abs(window.npcPlayer.position.x - destResult.position.x) < 0.5 && Math.abs(window.npcPlayer.position.z - destResult.position.z) < 0.5) {

          // // Wrong codes: highestPriorityFrontiers: Select shortest distance in lowest priority frontiers, it's wrong, totally random, sometimes even will select opposite direction frontier.
          // const highestPriorityFrontiers = this.frontiers.filter(frontier => frontier._priority === this.frontiers[0]._priority);

          let minDistanceSquared = Infinity;
          let minDistanceSquaredFrontier;
          // highestPriorityFrontiers.forEach(frontier => {
          this.frontiers.forEach(frontier => {
            const distanceSquared = frontier.position.distanceToSquared(this.dest);
            if (distanceSquared < minDistanceSquared) {
              minDistanceSquared = distanceSquared;
              minDistanceSquaredFrontier = frontier;
            }
          });
          this.found(minDistanceSquaredFrontier);

        // }
        }

        return;
      }
      this.iterStep++;

      this.step();
    }
  }

  recurSetPrev(voxel) {
    if (voxel) {
      voxel._isPath = true;
      if (voxel._prev) voxel._prev._next = voxel;

      this.recurSetPrev(voxel._prev);
    }
  }

  stepVoxel(voxel, prevVoxel) {
    const newCost = prevVoxel._costSoFar + 1;
    // if (voxel._isReached === false || newCost < voxel._costSoFar) {
    if (voxel._isReached === false) {
      // Seems no need `|| newCost < voxel._costSoFar` ? Need? http://disq.us/p/2mgpazs
      voxel._isReached = true;
      voxel._costSoFar = newCost;

      // voxel._priority = tmpVec2.set(voxel._x, voxel._z).manhattanDistanceTo(dest)
      // voxel._priority = tmpVec2.set(voxel._x, voxel._z).distanceToSquared(dest)
      voxel._priority = voxel.position.distanceTo(this.dest);
      voxel._priority += newCost;
      this.frontiers.push(voxel);
      this.frontiers.sort((a, b) => a._priority - b._priority);

      voxel._isFrontier = true;
      voxel._prev = prevVoxel;
      // prevVoxel._next = voxel; // Can't assign _next here, because one voxel will has multiple _next. Need use `recurSetPrev()`.

      if (voxel._isDest) {
        this.found(voxel);
      }
    }
  }

  found(voxel) {
    // if (this.debugRender) console.log('found');
    this.isFound = true;
    this.recurSetPrev(voxel);

    this.waypointResult.length = 0;
    let wayPoint = this.startVoxel; // wayPoint: voxel
    let result = new THREE.Object3D();
    result.position.copy(wayPoint.position);
    result._priority = wayPoint._priority;
    this.waypointResult.push(result);
    while (wayPoint._next) {
      wayPoint = wayPoint._next;

      result._next = new THREE.Object3D();
      result._next.position.copy(wayPoint.position);
      result._priority = wayPoint._priority;
      this.waypointResult.push(result._next);

      result._next._prev = result;

      result = result._next;
    }
  }

  step() {
    if (this.frontiers.length <= 0) {
      // if (this.debugRender) console.log('finish');
      return;
    }
    if (this.isFound) return;

    const currentVoxel = this.frontiers.shift();
    currentVoxel._isFrontier = false;

    this.generateVoxelMapLeft(currentVoxel);
    if (currentVoxel._leftVoxel) {
      this.stepVoxel(currentVoxel._leftVoxel, currentVoxel);
      if (this.isFound) return;
    }

    this.generateVoxelMapRight(currentVoxel);
    if (currentVoxel._rightVoxel) {
      this.stepVoxel(currentVoxel._rightVoxel, currentVoxel);
      if (this.isFound) return;
    }

    this.generateVoxelMapBtm(currentVoxel);
    if (currentVoxel._btmVoxel) {
      this.stepVoxel(currentVoxel._btmVoxel, currentVoxel);
      if (this.isFound) return;
    }

    this.generateVoxelMapTop(currentVoxel);
    if (currentVoxel._topVoxel) {
      this.stepVoxel(currentVoxel._topVoxel, currentVoxel);
      // if (this.isFound) return
    }
  }

  toggleDebugRender() {
    this.debugRender = !this.debugRender;
    this.debugMesh.visible = this.debugRender;
  }

  toggleDebugRenderWireframe() {
    this.material.wireframe = !this.material.wireframe;
  }

  moveDownVoxels() {
    this.voxels.position.y -= 0.5;
    this.voxels.updateMatrixWorld();
  }

  getHighestY() {
    let highestY = -Infinity;
    this.voxels.children.forEach(voxel => {
      if (voxel.position.y > highestY) highestY = voxel.position.y;
    });
    return highestY;
  }
}

export {PathFinder};
