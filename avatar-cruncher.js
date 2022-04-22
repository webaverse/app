import * as THREE from 'three';

import {getMergeableObjects, mergeGeometryTextureAtlas} from './geometry-texture-atlas.js';

const defaultTextureSize = 4096;

export const crunchAvatarModel = (model, options = {}) => {
  const textureSize = options.textureSize ?? defaultTextureSize;

  const textureTypes = [
    'map',
    'emissiveMap',
    'normalMap',
  ];

  const getObjectKey = () => '';
  const mergeables = getMergeableObjects(model, getObjectKey);
  const mergeable = mergeables[0];
  const {
    skeletons,
    morphTargetDictionaryArray,
    morphTargetInfluencesArray,
  } = mergeable;
  const {
    atlas,
    atlasImages,
    attributeLayouts,
    morphAttributeLayouts,
    geometry,
    atlasTextures,
  } = mergeGeometryTextureAtlas(mergeable, textureSize);

  // create material
  const material = new THREE.MeshBasicMaterial();
  for (const k of textureTypes) {
    const t = atlasTextures[k];
    material[k] = t;
  }
  material.roughness = 1;
  material.alphaTest = 0.1;
  material.transparent = true;

  // create mesh
  const crunchedModel = new THREE.SkinnedMesh(geometry, material);
  crunchedModel.skeleton = skeletons[0];
  crunchedModel.morphTargetDictionary = morphTargetDictionaryArray[0];
  crunchedModel.morphTargetInfluences = morphTargetInfluencesArray[0];
  crunchedModel.frustumCulled = false;
  return crunchedModel;
};