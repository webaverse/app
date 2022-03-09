
import * as THREE from 'three';
import {
  rootScene,
} from './renderer.js';
import physicsManager from './physics-manager.js';

window.domBtns.addEventListener('click', event => { // test
  event.stopPropagation();
});

const npcPlayerHeight = 1.518240094787793; // test
const localPlayerHeight = 1.2576430977951292; // test

const identityQuaternion = new THREE.Quaternion();

// const localVector = new THREE.Vector3();
// prevent temp/localVector trap if multi chained functions use them. Still need notice recur situation.
const localVectorGetPath = new THREE.Vector3();
const localVectorGenerateVoxelMap = new THREE.Vector3();
const localVectorInterpoWaypointResult = new THREE.Vector3();
const localVectorInterpoWaypointResult2 = new THREE.Vector3();
const localVectorDetect = new THREE.Vector3();
const localVectorStep = new THREE.Vector3();

const colorIdle = new THREE.Color('rgb(221,213,213)');
const colorReached = new THREE.Color('rgb(171,163,163)');
const colorFrontier = new THREE.Color('rgb(92,133,214)');
const colorStart = new THREE.Color('rgb(0,255,255)');
const colorDest = new THREE.Color('rgb(255,255,0)');
const colorPath = new THREE.Color('rgb(149,64,191)');
const colorPathSimplified = new THREE.Color('rgb(69,0,98)');

class PathFinder {
  constructor({voxelHeight = 1, heightTolerance = 0.5, maxIterStep = 1000, maxVoxelCacheLen = 10000, ignorePhysicsIds = [], debugRender = false}) {
    /* args:
      voxelHeight: Voxel height ( Y axis ) for collide detection, usually equal to npc's physical capsule height. X/Z axes sizes are hard-coded 1 now.
      heightTolerance: Used to check whether currentVoxel can go above to neighbor voxels.
      maxIterStep: How many A* path-finding step can one getPath() iterate. One A* step can create up to 4 voxels, 0 ~ 4.
      maxVoxelCacheLen: How many detected voxels can be cached.
      ignorePhysicsIds: physicsIds that voxel detect() ignored, usually npc CharacterController's capsule.
      debugRender: Whether show voxel boxes for debugging.
    */
    this.voxelHeight = 1.65; // todo: not hardecode.
    // note: tested that, for drake.vrm, 1.65 is suitable ( 1.6 & 1.7 not well ). https://github.com/webaverse/app/pull/2506#issuecomment-1062504495
    this.heightTolerance = 0.5; // Need let roundToHeightTolerance() compatible with this value/precision.
    this.maxIterStep = 10000;
    this.maxVoxelCacheLen = maxVoxelCacheLen;
    this.ignorePhysicsIds = ignorePhysicsIds;
    this.debugRender = true;

    // end args

    this.iterStep = 0;
    this.allowNearest = true;

    this.iterDetect = 0;
    this.maxIterDetect = 10000;

    // npc-local ( start-dest space )
    // all parameters, unless otherwise specified, are npc-local
    this.start = new THREE.Vector3();
    this.dest = new THREE.Vector3();

    // global sapce
    // todo: needs to be rounded, otherwise in narrow passages, will generate unstable voxels map, cause sometimes can go, sometimes can't, thus go back and forth.
    this.startGlobal = new THREE.Vector3();
    this.destGlobal = new THREE.Vector3();

    this.voxelHeightHalf = this.voxelHeight / 2;

    this.frontiers = [];
    this.voxels = new THREE.Group();
    this.voxels.name = 'voxels';

    this.voxelo = {};

    this.startDestQuaternion = new THREE.Quaternion();

    this.directions = ['left', 'right', 'btm', 'top', 'back', 'front'];
    this.directionsNoTop = ['left', 'right', 'btm', 'back', 'front'];
    this.directionsOnlyBtm = ['btm'];

    if (this.debugRender) {
      this.geometry = new THREE.BoxGeometry();
      this.geometry.scale(0.3, this.voxelHeight * 0.3, 0.3);
      // this.geometry.scale(0.5, this.voxelHeight * 0.5, 0.5);
      // this.geometry.scale(1, this.voxelHeight, 1);
      // this.geometry.scale(0.9, 0.1, 0.9);
      this.material = new THREE.MeshLambertMaterial({color: 0xffffff, wireframe: false});
      this.maxDebugCount = this.maxVoxelCacheLen + this.maxIterStep * 4 + 1 + 100; // One step() can create up to 4 voxels. Add 1 startVoxel. Add 100 for interpoed waypointResult.
      this.debugMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxDebugCount);
      this.debugMesh.name = 'PathFinder debugMesh';
      this.debugMesh.setColorAt(0, colorIdle); // init instanceColor
      rootScene.add(this.debugMesh);
    }

    this.waypointResult = [];
  }

  getPath(start, dest, isWalk = true) {
    this.isWalk = isWalk;

    this.startGlobal.copy(start);
    if (this.isWalk) {
      this.startGlobal.y -= npcPlayerHeight;
      this.startGlobal.y += this.voxelHeightHalf;
      this.startGlobal.y += 0.1;
    }
    this.destGlobal.copy(dest);
    if (this.isWalk) {
      this.detectDestGlobal(this.destGlobal, -1);
    }

    // this.debugMesh.quaternion.copy(this.startDestQuaternion);
    this.debugMesh.position.copy(this.startGlobal);
    if (this.isWalk) {
      this.debugMesh.lookAt(localVectorGetPath.copy(this.destGlobal).setY(this.startGlobal.y));
    } else {
      this.debugMesh.lookAt(this.destGlobal);
    }

    // this.startDestQuaternion.setFromUnitVectors(
    //   new THREE.Vector3(0, 0, 1),
    //   new THREE.Vector3().subVectors(this.destGlobal, this.startGlobal).normalize(),
    // );
    this.startDestQuaternion.copy(this.debugMesh.quaternion);

    this.reset();
    if (this.voxels.children.length > this.maxVoxelCacheLen) this.disposeVoxelCache();

    this.start.set(
      0,
      0,
      0,
    );
    if (this.isWalk) {
      this.dest.set(
        0,
        this.roundToHeightTolerance(this.destGlobal.y - this.startGlobal.y), // todo: need ceil?
        Math.round(localVectorGetPath.subVectors(this.destGlobal, this.startGlobal).setY(0).length()),
      );
    } else {
      this.dest.set(
        0,
        0,
        Math.round(localVectorGetPath.subVectors(this.destGlobal, this.startGlobal).length()),
      );
    }

    // note: start/destVoxel don't need detect, otherwise sometimes will cause no start/destVoxel error, eg: there's obstacle around npc/localPlayer's feet in the same voxel.
    // todo: but sometimes will cause start voxel can't step/expand problem, need combined with jump or up detect() etc.
    this.startVoxel = this.createVoxel(this.start);
    this.startVoxel._isStart = true;
    this.startVoxel._isReached = true;
    // this.startVoxel._priority = start.manhattanDistanceTo(dest)
    this.startVoxel._priority = this.start.distanceTo(this.dest);
    this.startVoxel._costSoFar = 0;
    this.frontiers.push(this.startVoxel);

    // todo: handle localPlayer in air situation.
    this.destVoxel = this.createVoxel(this.dest);
    this.destVoxel._isDest = true;
    // return;

    if (this.startVoxel === this.destVoxel) {
      this.found(this.destVoxel);
    } else {
      this.untilFound();
      if (this.isFound) {
        this.interpoWaypointResult();
        this.simplifyWaypointResult(this.waypointResult[0]);
        this.waypointResult.shift();
      }
      // console.log('waypointResult', this.waypointResult.length);
    }

    this.step(); // test: one more step() just for color the result path in debugRender.

    if (this.isFound) {
      this.waypointResult.forEach(result => {
        result.position.applyQuaternion(this.startDestQuaternion);
        result.position.add(this.startGlobal);
      });
    }

    if (this.debugRender) console.log('isFound:', this.isFound);
    return this.isFound ? this.waypointResult : null;
  }

  interpoWaypointResult() {
    let tempResult = this.waypointResult.shift();
    localVectorInterpoWaypointResult.copy(tempResult.position);
    while (tempResult._next) {
      localVectorInterpoWaypointResult2.copy(tempResult._next.position);

      tempResult._next.position.x += localVectorInterpoWaypointResult.x;
      tempResult._next.position.x /= 2;
      tempResult._next.position.y += localVectorInterpoWaypointResult.y;
      tempResult._next.position.y /= 2;
      tempResult._next.position.z += localVectorInterpoWaypointResult.z;
      tempResult._next.position.z /= 2;
      tempResult._next.updateMatrixWorld();

      tempResult = tempResult._next;
      localVectorInterpoWaypointResult.copy(localVectorInterpoWaypointResult2);
    }
  }

  simplifyWaypointResult(result) {
    if (result?._next?._next) {
      if (
        Math.sign(result._next._next.position.x - result._next.position.x) === Math.sign(result._next.position.x - result.position.x) &&
        Math.sign(result._next._next.position.y - result._next.position.y) === Math.sign(result._next.position.y - result.position.y) &&
        Math.sign(result._next._next.position.z - result._next.position.z) === Math.sign(result._next.position.z - result.position.z)
      ) {
        this.waypointResult.splice(this.waypointResult.indexOf(result._next), 1);
        result._next = result._next._next;
        result._next._prev = result;
        this.simplifyWaypointResult(result);
      } else {
        this.simplifyWaypointResult(result._next);
      }
    }
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
    voxel._isFrontier = false;
  }

  reset() {
    this.isFound = false;
    this.frontiers.length = 0;
    this.waypointResult = [];

    // pure realtime, no any cache
    this.voxels.children.length = 0;
    this.voxelo = {};

    // // simple cache
    // this.voxels.children.forEach((voxel, i) => {
    //   if (this.debugRender) this.debugMesh.setColorAt(i, colorIdle);
    // });

    if (this.debugRender) {
      for (let i = 0; i < this.maxDebugCount; i++) {
        this.debugMesh.setColorAt(i, colorIdle);
      }
      this.debugMesh.instanceColor.needsUpdate = true;
    }
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

  roundToHeightTolerance(y) {
    // return Math.round(y); // Round to 1 because heightTolerance is 1;
    return Math.round(y * 2) / 2; // Round to 0.5 because heightTolerance is 0.5;
  }

  createVoxel(position) {
    // localVector2.copy(position); // note: can't use localVector, because detect() will use too and change.
    // localVector2.y = this.roundToHeightTolerance(localVector2.y);

    // let voxel = this.getVoxel(localVector2);
    // if (voxel) return voxel;

    // const collide = this.detect(localVector2);
    // if (collide) return null;

    const voxel = new THREE.Object3D();
    this.voxels.add(voxel);
    this.resetVoxelAStar(voxel);

    voxel.position.copy(position);
    voxel.updateMatrixWorld();
    this.setVoxelo(voxel);

    return voxel;
  }

  detect(position, isGlobal = false) {
    let overlapResult;
    if (isGlobal) {
      localVectorDetect.copy(position);
      overlapResult = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, localVectorDetect, identityQuaternion);
    } else {
      localVectorDetect.copy(position);
      localVectorDetect.applyQuaternion(this.startDestQuaternion);
      localVectorDetect.add(this.startGlobal);
      overlapResult = physicsManager.overlapBox(0.5, this.voxelHeightHalf, 0.5, localVectorDetect, this.startDestQuaternion);
    }
    let collide;
    if (overlapResult.objectIds.length === 1 && this.ignorePhysicsIds.includes(overlapResult.objectIds[0])) {
      collide = false;
    } else if (overlapResult.objectIds.length > 0) {
      collide = true;
    } else {
      collide = false;
    }
    return collide;
  }

  detectDestGlobal(position, detectDir) {
    // this.detectCount++;
    if (this.iterDetect >= this.maxIterDetect) {
      console.warn('maxIterDetect reached! High probability created wrong destVoxel with wrong position.y!');
      // Use raycast first? No, raycast can only handle line not voxel.
      return;
    }
    this.iterDetect++;

    const collide = this.detect(position, true);

    if (detectDir === 0) {
      if (collide) {
        detectDir = 1;
      } else {
        detectDir = -1;
      }
    }

    if (detectDir === 1) {
      if (collide) {
        position.y += detectDir * this.heightTolerance;
        this.detectDestGlobal(position, detectDir);
      } else {
        // do nothing, stop recur
      }
    } else if (detectDir === -1) {
      if (collide) {
        position.y += this.heightTolerance;
        // do nothing, stop recur
      } else {
        position.y += detectDir * this.heightTolerance;
        this.detectDestGlobal(position, detectDir);
      }
    }
  }

  generateVoxelMap(currentVoxel, direction/*: string */) {
    localVectorGenerateVoxelMap.copy(currentVoxel.position);
    switch (direction) {
      case 'left':
        localVectorGenerateVoxelMap.x += -1;
        break;
      case 'right':
        localVectorGenerateVoxelMap.x += 1;
        break;
      case 'btm':
        localVectorGenerateVoxelMap.y += -this.heightTolerance;
        break;
      case 'top':
        localVectorGenerateVoxelMap.y += this.heightTolerance;
        break;
      case 'back':
        localVectorGenerateVoxelMap.z += -1;
        break;
      case 'front':
        localVectorGenerateVoxelMap.z += 1;
        break;
    }
    localVectorGenerateVoxelMap.y = this.roundToHeightTolerance(localVectorGenerateVoxelMap.y);

    let neighborVoxel = this.getVoxel(localVectorGenerateVoxelMap);
    if (!neighborVoxel) {
      const collide = this.detect(localVectorGenerateVoxelMap);
      if (!collide) {
        neighborVoxel = this.createVoxel(localVectorGenerateVoxelMap);
      }
    }

    if (neighborVoxel) {
      currentVoxel[`_${direction}Voxel`] = neighborVoxel;
      currentVoxel[`_can${this.capitalize(direction)}`] = true;
    }
  }

  tenStep() {
    for (let i = 0; i < 10; i++) this.step();
  }

  untilFound() {
    this.iterStep = 0;
    while (this.frontiers.length > 0 && !this.isFound) {
      if (this.iterStep >= this.maxIterStep) {
        if (this.allowNearest) { // use nearest frontier as mid-point dest, if not found real dest.
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
          if (minDistanceSquaredFrontier) { // May all frontiers disappeared because of enclosed by obstacles, thus no minDistanceSquaredFrontier.
            this.found(minDistanceSquaredFrontier);
          }

        // }
        }

        return;
      }
      this.iterStep++;

      this.step();
    }
  }

  setNextOfPathVoxel(voxel) {
    if (voxel) {
      voxel._isPath = true;
      if (voxel._prev) voxel._prev._next = voxel;

      this.setNextOfPathVoxel(voxel._prev);
    }
  }

  stepVoxel(voxel, prevVoxel) { // do A-Star.
    // const newCost = prevVoxel._costSoFar + 1;
    const newCost = prevVoxel._costSoFar + voxel.position.distanceTo(prevVoxel.position); // todo: performace: use already known direction instead of distanceTo().
    // console.log(voxel.position.distanceTo(prevVoxel.position));

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
      // prevVoxel._next = voxel; // Can't assign _next here, because one voxel will has multiple _next. Need use `setNextOfPathVoxel()`.

      if (voxel._isDest) {
        this.found(voxel);
      }
    }
  }

  found(voxel) {
    this.isFound = true;
    this.setNextOfPathVoxel(voxel);

    let wayPoint = this.startVoxel; // wayPoint: voxel
    let result = new THREE.Object3D();
    result.position.copy(wayPoint.position);
    this.waypointResult.push(result);
    while (wayPoint._next) {
      wayPoint = wayPoint._next;

      result._next = new THREE.Object3D();
      result._next.position.copy(wayPoint.position);
      this.waypointResult.push(result._next);

      result._next._prev = result;

      result = result._next;
    }
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  step() {
    if (this.debugRender) {
      // // Show all voxels & waypointResult
      // this.debugMesh.count = this.voxels.children.length + this.waypointResult.length;
      // this.voxels.children.forEach((voxel, i) => {
      //   this.debugMesh.setMatrixAt(i, voxel.matrix);
      //   if (voxel._isStart) {
      //     this.debugMesh.setColorAt(i, colorStart);
      //   } else if (voxel._isDest) {
      //     this.debugMesh.setColorAt(i, colorDest);
      //   } else if (voxel._isPath) {
      //     this.debugMesh.setColorAt(i, colorPath);
      //   } else if (voxel._isFrontier) {
      //     this.debugMesh.setColorAt(i, colorFrontier);
      //   } else if (voxel._isReached) {
      //     this.debugMesh.setColorAt(i, colorReached);
      //   }
      // });
      // this.waypointResult.forEach((result, i) => {
      //   this.debugMesh.setMatrixAt(this.voxels.children.length + i, result.matrix);
      //   this.debugMesh.setColorAt(this.voxels.children.length + i, colorPathSimplified);
      // });

      // // Show all voxels
      // this.debugMesh.count = this.voxels.children.length;
      // this.voxels.children.forEach((voxel, i) => {
      //   this.debugMesh.setMatrixAt(i, voxel.matrix);
      //   if (voxel._isStart) {
      //     this.debugMesh.setColorAt(i, colorStart);
      //   } else if (voxel._isDest) {
      //     this.debugMesh.setColorAt(i, colorDest);
      //   } else if (voxel._isPath) {
      //     this.debugMesh.setColorAt(i, colorPath);
      //   } else if (voxel._isFrontier) {
      //     this.debugMesh.setColorAt(i, colorFrontier);
      //   } else if (voxel._isReached) {
      //     this.debugMesh.setColorAt(i, colorReached);
      //   }
      // });

      // Only show path
      const paths = this.voxels.children.filter(voxel => voxel._isPath);
      this.debugMesh.count = paths.length;
      paths.forEach((result, i) => {
        this.debugMesh.setMatrixAt(i, result.matrix);
        this.debugMesh.setColorAt(i, colorPath);
      });

      // // Only show waypointResult
      // this.debugMesh.count = this.waypointResult.length;
      // this.waypointResult.forEach((result, i) => {
      //   this.debugMesh.setMatrixAt(i, result.matrix);
      //   this.debugMesh.setColorAt(i, colorPathSimplified);
      // });

      //

      this.debugMesh.instanceMatrix.needsUpdate = true;
      this.debugMesh.instanceColor.needsUpdate = true;

      this.debugMesh.updateMatrixWorld();
    }

    if (this.frontiers.length <= 0) {
      // if (this.debugRender) console.log('finish');
      return;
    }
    if (this.isFound) return;

    const currentVoxel = this.frontiers.shift();
    currentVoxel._isFrontier = false;

    // todo: add ._isGround.
    let directions;
    if (this.isWalk) {
      localVectorStep.copy(currentVoxel.position);
      localVectorStep.y -= this.heightTolerance;
      const canBtm = !this.detect(localVectorStep); // todo: performance: may not need detect() here.
      const btmVoxel = this.getVoxel(localVectorStep); // todo: performance: may not need getVoxel() here.
      if (canBtm) {
        if (btmVoxel && btmVoxel === currentVoxel._prev) {
          directions = this.directionsNoTop;
        } else {
          directions = this.directionsOnlyBtm;
        }
      } else {
        directions = this.directions;
      }
    } else {
      directions = this.directions;
    }

    for (const direction of directions) {
      if (!currentVoxel[`_${direction}Voxel`]) this.generateVoxelMap(currentVoxel, direction);
      if (currentVoxel[`_can${this.capitalize(direction)}`]) {
        this.stepVoxel(currentVoxel[`_${direction}Voxel`], currentVoxel);
        if (this.isFound) return;
      }
    }
  }

  setIgnorePhysicsIds(ignorePhysicsIds) {
    this.ignorePhysicsIds = ignorePhysicsIds;
  }

  // showAll() {
  //   this.voxels.children.forEach(voxel => { voxel.visible = true; });
  // }

  // toggleNonPath() {
  //   this.voxels.children.forEach(voxel => { if (!voxel._isPath) voxel.visible = !voxel.visible; });
  // }

  toggleDebugRender() {
    if (this.debugRender) {
      this.debugMesh.visible = !this.debugMesh.visible;
    }
  }

  toggleDebugRenderWireframe() {
    if (this.debugRender) {
      this.material.wireframe = !this.material.wireframe;
    }
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
