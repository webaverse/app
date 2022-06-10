import * as THREE from 'three';

export class BatchedMesh extends THREE.InstancedMesh {
  constructor(geometry, material, allocator) {
    super(geometry, material);
    
    this.isBatchedMesh = true;
    this.allocator = allocator;
  }
	getDrawSpec(multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts) {
    this.allocator.getDrawSpec(multiDrawStarts, multiDrawCounts, multiDrawInstanceCounts);
  }
}