import * as THREE from 'three';
import {FreeList} from './geometry-util.js';
import {getBoundingSize} from './util.js';
import {ImmediateGLBufferAttribute} from './ImmediateGLBufferAttribute.js';

const localMatrix = new THREE.Matrix4();
const localSphere = new THREE.Sphere();
const localBox = new THREE.Box3();
const localFrustum = new THREE.Frustum();

const maxNumDraws = 1024;

export class GeometryPositionIndexBinding {
  constructor(positionFreeListEntry, indexFreeListEntry, geometry) {
    this.positionFreeListEntry = positionFreeListEntry;
    this.indexFreeListEntry = indexFreeListEntry;
    this.geometry = geometry;
  }

  getAttributeOffset(name = 'position') {
    return this.positionFreeListEntry / 3 * this.geometry.attributes[name].itemSize;
  }

  getIndexOffset() {
    return this.indexFreeListEntry;
  }
}

export class GeometryAllocator {
  constructor(
    attributeSpecs,
    {
      bufferSize,
      boundingType = null,
    },
  ) {
    {
      this.geometry = new THREE.BufferGeometry();
      for (const attributeSpec of attributeSpecs) {
        const {name, Type, itemSize} = attributeSpec;

        const array = new Type(bufferSize * itemSize);
        this.geometry.setAttribute(
          name,
          new ImmediateGLBufferAttribute(array, itemSize, false),
        );
      }
      const indices = new Uint32Array(bufferSize);
      this.geometry.setIndex(new ImmediateGLBufferAttribute(indices, 1, true));
    }

    this.boundingType = boundingType;
    this.testBoundingFn = (() => {
      if (this.boundingType === 'sphere') {
        return (i, frustum) => {
          localSphere.center.fromArray(this.boundingData, i * 4);
          localSphere.radius = this.boundingData[i * 4 + 3];
          return frustum.intersectsSphere(localSphere)
            ? localSphere.center.distanceTo(camera.position)
            : false;
        };
      } else if (this.boundingType === 'box') {
        return (i, frustum) => {
          localBox.min.fromArray(this.boundingData, i * 6);
          localBox.max.fromArray(this.boundingData, i * 6 + 3);
          return frustum.intersectsBox(localBox);
        };
      } else {
        return null;
      }
    })();

    this.positionFreeList = new FreeList(bufferSize * 3, 3);
    this.indexFreeList = new FreeList(bufferSize);

    this.drawStarts = new Int32Array(maxNumDraws);
    this.drawCounts = new Int32Array(maxNumDraws);
    const boundingSize = getBoundingSize(boundingType);
    this.boundingData = new Float32Array(maxNumDraws * boundingSize);
    this.numDraws = 0;
  }

  alloc(
    numPositions,
    numIndices,
    boundingObject,
  ) {
    const positionFreeListEntry = this.positionFreeList.alloc(numPositions);
    const indexFreeListEntry = this.indexFreeList.alloc(numIndices);
    const geometryBinding = new GeometryPositionIndexBinding(
      positionFreeListEntry,
      indexFreeListEntry,
      this.geometry,
    );

    const slot = indexFreeListEntry;
    this.drawStarts[this.numDraws] =
      slot * this.geometry.index.array.BYTES_PER_ELEMENT;
    this.drawCounts[this.numDraws] = numIndices;
    if (this.boundingType === 'sphere') {
      boundingObject.center.toArray(this.boundingData, this.numDraws * 4);
      this.boundingData[this.numDraws * 4 + 3] = boundingObject.radius;
    } else if (this.boundingType === 'box') {
      boundingObject.min.toArray(this.boundingData, this.numDraws * 6);
      boundingObject.max.toArray(this.boundingData, this.numDraws * 6 + 3);
    }

    this.numDraws++;

    return geometryBinding;
  }

  free(geometryBinding) {
    const slot = geometryBinding.indexFreeListEntry;
    const expectedStartValue =
      slot * this.geometry.index.array.BYTES_PER_ELEMENT;
    // XXX using indexOf is slow. we can do better.
    const freeIndex = this.drawStarts.indexOf(expectedStartValue);

    if (this.numDraws >= 2) {
      const lastIndex = this.numDraws - 1;

      // copy the last index to the freed slot
      this.drawStarts[freeIndex] = this.drawStarts[lastIndex];
      this.drawCounts[freeIndex] = this.drawCounts[lastIndex];
      if (this.boundingType === 'sphere') {
        this.boundingData[freeIndex * 4] = this.boundingData[lastIndex * 4];
        this.boundingData[freeIndex * 4 + 1] =
          this.boundingData[lastIndex * 4 + 1];
        this.boundingData[freeIndex * 4 + 2] =
          this.boundingData[lastIndex * 4 + 2];
        this.boundingData[freeIndex * 4 + 3] =
          this.boundingData[lastIndex * 4 + 3];
      } else if (this.boundingType === 'box') {
        this.boundingData[freeIndex * 6] = this.boundingData[lastIndex * 6];
        this.boundingData[freeIndex * 6 + 1] =
          this.boundingData[lastIndex * 6 + 1];
        this.boundingData[freeIndex * 6 + 2] =
          this.boundingData[lastIndex * 6 + 2];
        this.boundingData[freeIndex * 6 + 3] =
          this.boundingData[lastIndex * 6 + 3];
        this.boundingData[freeIndex * 6 + 4] =
          this.boundingData[lastIndex * 6 + 4];
        this.boundingData[freeIndex * 6 + 5] =
          this.boundingData[lastIndex * 6 + 5];
      }
    }

    this.numDraws--;

    this.positionFreeList.free(geometryBinding.positionFreeListEntry);
    this.indexFreeList.free(geometryBinding.indexFreeListEntry);
  }

  getDrawSpec(camera, drawStarts, drawCounts/*, distanceArray */) {
    drawStarts.length = 0;
    drawCounts.length = 0;
    // distanceArray.length = 0;

    for (let i = 0; i < this.numDraws; i++) {
      let frustumCullVisible = true;
      if (this.testBoundingFn) {
        // XXX this can be optimized by initializing the frustum only once per frame and passing it in
        const projScreenMatrix = localMatrix.multiplyMatrices(
          camera.projectionMatrix,
          camera.matrixWorldInverse,
        );
        localFrustum.setFromProjectionMatrix(projScreenMatrix);

        frustumCullVisible = this.testBoundingFn(i, localFrustum);
      }
      if (frustumCullVisible) {
        drawStarts.push(this.drawStarts[i]);
        drawCounts.push(this.drawCounts[i]);
      }
    }
  }
}

export class BufferedMesh extends THREE.Mesh {
  constructor(geometry, material, allocator) {
    super(geometry, material);

    this.isBatchedMesh = true;
    this.allocator = allocator;
    // this.distanceArray = [];
  }

  getDrawSpec(camera, drawStarts, drawCounts) {
    this.allocator.getDrawSpec(camera, drawStarts, drawCounts/*, this.distanceArray */);
  }
}
