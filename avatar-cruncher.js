import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
import {modUv} from './util.js';

import {getMergeableObjects, mergeGeometryTextureAtlas} from './avatar-optimizer.js';

const defaultTextureSize = 4096;
const startAtlasSize = 512;

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
// const localVector4D = new THREE.Vector4();
// const localVector4D2 = new THREE.Vector4();

class AttributeLayout {
  constructor(name, TypedArrayConstructor, itemSize) {
    this.name = name;
    this.TypedArrayConstructor = TypedArrayConstructor;
    this.itemSize = itemSize;

    this.count = 0;
  }
}
class MorphAttributeLayout extends AttributeLayout {
  constructor(name, TypedArrayConstructor, itemSize, arraySize) {
    super(name, TypedArrayConstructor, itemSize);
    this.arraySize = arraySize;
  }
}

export const crunchAvatarModel = (model, options = {}) => {
  // const atlasTexturesEnabled = !!(options.textures ?? true);
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
  /* console.log('got atlas', {
    atlas,
    atlasImages,
    attributeLayouts,
    morphAttributeLayouts,
    geometry,
    atlasTextures,
  }); */

  // create material
  // const material = new THREE.MeshStandardMaterial();
  const material = new THREE.MeshBasicMaterial();
  // if (atlasTextures) {
    for (const k of textureTypes) {
      /* const t = new THREE.Texture(textureAtlases[k].image);
      t.flipY = false;
      t.needsUpdate = true; */
      const t = atlasTextures[k];
      material[k] = t;
    }
  // }
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