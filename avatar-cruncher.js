import * as THREE from 'three';
import {
  getMergeableObjects,
  getBones,
  mergeGeometryTextureAtlas,
} from './avatar-optimizer.js';
import exporters from './exporters.js';

const defaultTextureSize = 4096;

const localVector = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localVector2 = new THREE.Vector3();

const textureTypes = ['map', 'emissiveMap', 'normalMap'];
const getObjectKey = () => '';

export const crunchAvatarModel = async (model, options = {}) => {
  const textureSize = options.textureSize ?? defaultTextureSize;

  const mergeables = getMergeableObjects(model, getObjectKey);

  const _mergeMesh = (mergeable, mergeableIndex) => {
    const {
      type,
      material,
      // geometries,
      // maps,
      // emissiveMaps,
      // normalMaps,
      skeletons,
      morphTargetDictionaryArray,
      morphTargetInfluencesArray,
    } = mergeable;
    const {
      // atlas,
      // atlasImages,
      // attributeLayouts,
      // morphAttributeLayouts,
      geometry,
      atlasTextures,
    } = mergeGeometryTextureAtlas(mergeable, textureSize);

    // const m = material;
    const m = new THREE.MeshBasicMaterial();
    m.roughness = 1;
    m.transparent = true;
    const _updateMaterial = () => {
      if (atlasTextures) {
        for (const textureType of textureTypes) {
          const atlasTexture = atlasTextures[textureType];

          if (atlasTexture) {
            m[textureType] = atlasTexture;
            if (m.uniforms) {
              m.uniforms[textureType].value = atlasTexture;
              m.uniforms[textureType].needsUpdate = true;
            }
          }
        }
      }
      m.needsUpdate = true;
    };
    _updateMaterial();

    const _makeMesh = () => {
      if (type === 'mesh') {
        const mesh = new THREE.Mesh(geometry, m);
        return mesh;
      } else if (type === 'skinnedMesh') {
        const skinnedMesh = new THREE.SkinnedMesh(geometry, m);
        skinnedMesh.skeleton = skeletons[0];
        skinnedMesh.morphTargetDictionary = morphTargetDictionaryArray[0];
        skinnedMesh.morphTargetInfluences = morphTargetInfluencesArray[0];
        // skinnedMesh.updateMorphTargets();
        return skinnedMesh;
      } else {
        throw new Error(`unknown type ${type}`);
      }
    };
    const mesh = _makeMesh();
    // console.log('got mesh', mesh);

    return mesh;
  };
  const mergedMeshes = mergeables.map((mergeable, i) =>
    _mergeMesh(mergeable, i),
  );

  // construct a new scene with the merged meshes
  const scene = new THREE.Scene();
  for (const mesh of mergedMeshes) {
    scene.add(mesh);
  }
  // also need to keep the bones
  const bones = getBones(model);
  for (const bone of bones) {
    // bake bone world transformation into local
    bone.matrixWorld.decompose(localVector, localQuaternion, localVector2);
    bone.position.copy(localVector);
    bone.quaternion.copy(localQuaternion);
    bone.scale.copy(localVector2);

    scene.add(bone);

    bone.updateMatrixWorld();
  }

  // XXX this should anti-index flattened index ranges for the multi-materials case

  // return object;

  const glbData = await new Promise((accept, reject) => {
    const {gltfExporter} = exporters;
    gltfExporter.parse(
      scene,
      function onCompleted(arrayBuffer) {
        accept(arrayBuffer);
      },
      function onError(error) {
        reject(error);
      },
      {
        binary: true,
        // onlyVisible: false,
        // forceIndices: true,
        // truncateDrawRange: false,
        includeCustomExtensions: true,
      },
    );
  });
  return glbData;
};
