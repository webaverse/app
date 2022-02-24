
import * as THREE from 'three';
import physicsManager from './physics-manager.js';

const identityPosition = new THREE.Vector3();
const identityQuaternion = new THREE.Quaternion();

class PathFinder {
  constructor({voxelHeight = 1.5, heightTolerance = 0.6, detectStep = 0.1, maxIterdetect = 1000, maxIterStep = 1000, maxVoxelCacheLen = 10000, ignorePhysicsIds = []}) {
    /* args:
      voxelHeight: Voxel height ( Y axis ) for collide detection, usually equal to npc's physical capsule height. X/Z axes sizes are hard-coded 1 now.
      heightTolerance: Used to check whether currentVoxel can go above to neighbor voxels.
      detectStep: How height every detecting step moving.
      maxIterdetect: How many steps can one voxel detecing iterate.
      maxIterStep: How many A* path-finding step can one getPath() iterate. One A* step can create up to 4 voxels, 0 ~ 4.
      maxVoxelCacheLen: How many detected voxels can be cached.
      ignorePhysicsIds: physicsIds that voxel detect() ignored, usually npc CharacterController's capsule.
    */

    this.voxelHeight = voxelHeight;
    this.voxelHeightHalf = this.voxelHeight / 2;
    this.heightTolerance = heightTolerance;
    this.detectStep = detectStep;
    this.maxIterDetect = maxIterdetect;
    this.maxIterStep = maxIterStep;
    this.maxVoxelCacheLen = maxVoxelCacheLen;
    this.ignorePhysicsIds = ignorePhysicsIds;
  }

  getPath(start, dest) {
    const positions = physicsManager.getPath(start, dest, this.voxelHeight, identityPosition, identityQuaternion, this.heightTolerance, this.detectStep, this.maxIterdetect, this.maxIterStep, this.maxVoxelCacheLen, this.ignorePhysicsIds);
    const isFound = positions.length > 0;
    const waypointResult = [];
    positions.forEach(position => {
      const result = new THREE.Object3D();
      result.position.copy(position);
      waypointResult.push(result);
    });
    waypointResult.forEach((result, i) => {
      const next = waypointResult[i + 1];
      if (next) {
        result._next = next;
      }
    });

    return isFound ? waypointResult : null;
  }

  setIgnorePhysicsIds(ignorePhysicsIds) {
    this.ignorePhysicsIds = ignorePhysicsIds;
  }
}

export {PathFinder};
