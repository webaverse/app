
import * as THREE from 'three';
import {
  rootScene,
} from './renderer.js';
import physicsManager from './physics-manager.js';

const colorIdle = new THREE.Color('rgb(221,213,213)');
const colorReached = new THREE.Color('rgb(171,163,163)');
const colorFrontier = new THREE.Color('rgb(92,133,214)');
const colorStart = new THREE.Color('rgb(0,255,255)');
const colorDest = new THREE.Color('rgb(255,255,0)');
const colorPath = new THREE.Color('rgb(149,64,191)');
const colorPathSimplified = new THREE.Color('rgb(69,0,98)');

class PathFinder {
  constructor({voxelHeight = 1.5, heightTolerance = 0.6, maxIterDetect = 1000, maxIterStep = 1000, ignorePhysicsIds = [], debugRender = false}) {
    /* args:
      voxelHeight: Voxel height ( Y axis ) for collide detection, usually equal to npc's physical capsule height. X/Z axes sizes are hard-coded 1 now.
      heightTolerance: Used to check whether currentVoxel can go above to neighbor voxels.
      maxIterDetect: How many steps can one voxel detecing iterate.
      maxIterStep: How many A* path-finding step can one getPath() iterate. One A* step can create up to 4 voxels, 0 ~ 4.
      ignorePhysicsIds: physicsIds that voxel detect() ignored, usually npc CharacterController's capsule.
      debugRender: Whether show voxel boxes for debugging.
    */

    this.voxelHeight = voxelHeight;
    this.hy = this.voxelHeight / 2;
    this.heightTolerance = heightTolerance;
    this.maxIterDetect = maxIterDetect;
    this.maxIterStep = maxIterStep;
    this.ignorePhysicsIds = ignorePhysicsIds;
    this.waypointResult = [];
    this.debugRender = true;

    if (this.debugRender) {
      this.geometry = new THREE.BoxGeometry();
      this.geometry.scale(0.3, this.voxelHeight * 0.3, 0.3);
      // this.geometry.scale(0.9, 0.1, 0.9);
      this.material = new THREE.MeshLambertMaterial({color: 'white', wireframe: false});
      this.maxDebugCount = 100000;
      this.debugMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxDebugCount);
      this.debugMesh.name = 'PathFinder debugMesh';
      rootScene.add(this.debugMesh);
    }
  }

  getPath(start, dest) {
    this.waypointResult = [];
    const positions = physicsManager.getPath(start, dest, this.hy, this.heightTolerance, this.maxIterDetect, this.maxIterStep, this.ignorePhysicsIds);
    const isFound = positions.length > 0;
    positions.forEach(position => {
      const result = new THREE.Object3D();
      result.position.copy(position);
      this.waypointResult.push(result);
    });
    this.waypointResult.forEach((result, i) => {
      const next = this.waypointResult[i + 1];
      if (next) {
        result._next = next;
      }
    });

    if (this.debugRender) {
      for (let i = 0; i < this.maxDebugCount; i++) {
        this.debugMesh.setColorAt(i, colorIdle);
      }

      //

      this.debugMesh.count = this.waypointResult.length;
      this.waypointResult.forEach((result, i) => {
        result.updateMatrixWorld();
        this.debugMesh.setMatrixAt(i, result.matrix);
        this.debugMesh.setColorAt(i, colorPath);
      });

      // this.debugMesh.count += window.voxels.length;
      // window.voxels.forEach((voxel, i) => {
      //   voxel.scale.setScalar(0.5);
      //   voxel.updateMatrixWorld();
      //   this.debugMesh.setMatrixAt(this.waypointResult.length + i, voxel.matrix);
      //   this.debugMesh.setColorAt(this.waypointResult.length + i, colorIdle);
      // });

      //

      this.debugMesh.instanceMatrix.needsUpdate = true;
      this.debugMesh.instanceColor.needsUpdate = true;
    }

    return isFound ? this.waypointResult : null;
  }

  setIgnorePhysicsIds(ignorePhysicsIds) {
    this.ignorePhysicsIds = ignorePhysicsIds;
  }
}

export {PathFinder};
