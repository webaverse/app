
import * as THREE from 'three';
import {
  rootScene,
} from './renderer.js';
import physicsManager from './physics-manager.js';

class PathFinder {
  constructor({voxelHeight = 1.5, heightTolerance = 0.6, detectStep = 0.1, maxIterdetect = 1000, maxIterStep = 1000, maxVoxelCacheLen = 10000, ignorePhysicsIds = [], debugRender = false}) {
    /* args:
      voxelHeight: Voxel height ( Y axis ) for collide detection, usually equal to npc's physical capsule height. X/Z axes sizes are hard-coded 1 now.
      heightTolerance: Used to check whether currentVoxel can go above to neighbor voxels.
      detectStep: How height every detecting step moving.
      maxIterdetect: How many steps can one voxel detecing iterate.
      maxIterStep: How many A* path-finding step can one getPath() iterate. One A* step can create up to 4 voxels, 0 ~ 4.
      maxVoxelCacheLen: How many detected voxels can be cached.
      ignorePhysicsIds: physicsIds that voxel detect() ignored, usually npc CharacterController's capsule.
      debugRender: Whether show voxel boxes for debugging.
    */

    this.voxelHeight = voxelHeight;
    this.hy = this.voxelHeight / 2;
    this.heightTolerance = heightTolerance;
    this.detectStep = detectStep;
    this.maxIterDetect = maxIterdetect;
    this.maxIterStep = maxIterStep;
    this.maxVoxelCacheLen = maxVoxelCacheLen;
    this.ignorePhysicsIds = ignorePhysicsIds;
    this.waypointResult = [];
    this.debugRender = debugRender;
    this.colorPathSimplified = new THREE.Color('rgb(69,0,98)');

    if (this.debugRender) {
      this.geometry = new THREE.BoxGeometry();
      this.geometry.scale(0.5, this.voxelHeight, 0.5);
      // this.geometry.scale(0.9, 0.1, 0.9);
      this.material = new THREE.MeshLambertMaterial({color: this.colorPathSimplified, wireframe: true});
      this.maxDebugCount = 100;
      this.debugMesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxDebugCount);
      this.debugMesh.name = 'PathFinder debugMesh';
      rootScene.add(this.debugMesh);
    }
  }

  getPath(start, dest) {
    this.waypointResult = [];
    const positions = physicsManager.getPath(start, dest, this.hy, this.heightTolerance, this.detectStep, this.maxIterdetect, this.maxIterStep, this.maxVoxelCacheLen, this.ignorePhysicsIds);
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
      this.debugMesh.count = this.waypointResult.length;
      this.waypointResult.forEach((result, i) => {
        result.updateMatrixWorld();
        this.debugMesh.setMatrixAt(i, result.matrix);
        // this.debugMesh.setColorAt(i, this.colorPathSimplified);
      });
      this.debugMesh.instanceMatrix.needsUpdate = true;
      // this.debugMesh.instanceColor.needsUpdate = true;
    }

    return isFound ? this.waypointResult : null;
  }

  setIgnorePhysicsIds(ignorePhysicsIds) {
    this.ignorePhysicsIds = ignorePhysicsIds;
  }
}

export {PathFinder};
