export const PARCEL_SIZE = 300;
export const SUBPARCEL_SIZE = 10;
export const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
export const NUM_PARCELS = PARCEL_SIZE/SUBPARCEL_SIZE;
export const slabTotalSize = 25 * 1024 * 1024;
export const slabNumAttributes = 4;
export const slabAttributeSize = slabTotalSize/slabNumAttributes;
export const numSlices = 160;
export const slabSliceTris = Math.floor(slabAttributeSize/numSlices/9/Float32Array.BYTES_PER_ELEMENT);
export const slabSliceVertices = slabSliceTris * 3;
export const slabRadius = Math.sqrt((SUBPARCEL_SIZE/2)*(SUBPARCEL_SIZE/2)*3);
export const chunkDistance = 2;
export const BUILD_SNAP = 2;
export const MAX_NAME_LENGTH = 32;
export const PLANET_OBJECT_SLOTS = 64;
export const PLANET_OBJECT_SIZE = (
  Uint32Array.BYTES_PER_ELEMENT + // id
  Uint32Array.BYTES_PER_ELEMENT + // type
  MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT + // build.name
  Float32Array.BYTES_PER_ELEMENT * 3 + // build.position
  Float32Array.BYTES_PER_ELEMENT * 4 // build.quaternion
);