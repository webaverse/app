export const PARCEL_SIZE = 300;
export const SUBPARCEL_SIZE = 10;
export const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
export const SUBPARCEL_SIZE_P3 = SUBPARCEL_SIZE + 3;
export const NUM_PARCELS = PARCEL_SIZE/SUBPARCEL_SIZE;

export const chunkDistance = 3;

export const numSlices = (1+chunkDistance*2+1)**3;
export const slabRadius = Math.sqrt((SUBPARCEL_SIZE/2)*(SUBPARCEL_SIZE/2)*3);

export const slabTotalSize = 56 * 1024 * 1024;
export const slabNumAttributes = 7;
export const slabAttributeSize = slabTotalSize/slabNumAttributes;
export const slabSliceTris = Math.floor(slabAttributeSize/numSlices/9/Float32Array.BYTES_PER_ELEMENT);
export const slabSliceVertices = slabSliceTris * 3;

export const BUILD_SNAP = 2;

export const MAX_NAME_LENGTH = 32;
export const PLANET_OBJECT_SLOTS = 4;
export const PLANET_OBJECT_SIZE = (
  Uint32Array.BYTES_PER_ELEMENT + // id
  Uint32Array.BYTES_PER_ELEMENT + // type
  MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT + // build.name
  Float32Array.BYTES_PER_ELEMENT * 3 + // build.position
  Float32Array.BYTES_PER_ELEMENT * 4 // build.quaternion
);

let nextMeshId = 0;
export const getNextMeshId = () => ++nextMeshId;