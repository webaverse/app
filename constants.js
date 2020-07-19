export const PARCEL_SIZE = 300;
export const SUBPARCEL_SIZE = 10;
export const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
export const NUM_PARCELS = PARCEL_SIZE/SUBPARCEL_SIZE;
export const slabTotalSize = 25 * 1024 * 1024;
export const slabNumAttributes = 4;
export const slabAttributeSize = slabTotalSize/slabNumAttributes;
export const numSlices = 150;
export const slabSliceTris = Math.floor(slabAttributeSize/numSlices/9/Float32Array.BYTES_PER_ELEMENT);
export const slabSliceVertices = slabSliceTris * 3;
export const chunkDistance = 2;
export const BUILD_SNAP = 2;
export const MAX_NAME_LENGTH = 32;
export const PLANET_BUILD_SLOTS = 64;
export const PLANET_PACKAGE_SLOTS = 16;
export const PLANET_BUILD_SIZE = (
  // Uint32Array.BYTES_PER_ELEMENT + // build.name.length
  MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT + // build.name
  Float32Array.BYTES_PER_ELEMENT * (3+4) // build.{position,quaternion}
);
export const PLANET_PACKAGE_SIZE = (
  // Uint32Array.BYTES_PER_ELEMENT + // package.name.length
  MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT + // package.name
  Float32Array.BYTES_PER_ELEMENT * (3+4) // package.{position,quaternion}
);