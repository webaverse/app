(() => {

const PARCEL_SIZE = 300;
const SUBPARCEL_SIZE = 10;
const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
const NUM_PARCELS = PARCEL_SIZE/SUBPARCEL_SIZE;
const slabTotalSize = 8 * 1024 * 1024;
const slabNumAttributes = 4;
const slabAttributeSize = slabTotalSize/slabNumAttributes;
const numSlices = 42;
const slabSliceTris = Math.floor(slabAttributeSize/numSlices/9/Float32Array.BYTES_PER_ELEMENT);
const slabSliceVertices = slabSliceTris * 3;
const BUILD_SNAP = 2;

globalThis.constants = {
  PARCEL_SIZE,
  SUBPARCEL_SIZE,
  SUBPARCEL_SIZE_P1,
  NUM_PARCELS,
  slabTotalSize,
  slabNumAttributes,
  slabAttributeSize,
  numSlices,
  slabSliceTris,
  slabSliceVertices,
  BUILD_SNAP,
};

})();