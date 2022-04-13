import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
import {getRenderer} from './renderer.js';

const defaultTextureSize = 4096;
const startAtlasSize = 512;

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();

const textureTypes = [
  'map',
  'emissiveMap',
  'normalMap',
];

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

const _getMergeableObjects = model => {
  const renderer = getRenderer();

  console.log('got model', model);

  const mergeables = new Map();
  model.traverse(o => {
    if (o.isMesh) {
      let type;
      if (o.isSkinnedMesh) {
        type = 'skinnedMesh';
      } else {
        type = 'mesh';
      }
      
      const objectGeometry = o.geometry;
      const morphTargetDictionary = o.morphTargetDictionary;
      const morphTargetInfluences = o.morphTargetInfluences;
      const objectMaterials = Array.isArray(o.material) ? o.material : [o.material];
      for (const objectMaterial of objectMaterials) {
        const {
          map = null,
          emissiveMap = null,
          normalMap = null,
          // shadeTexture = null,
        } = objectMaterial;
        // console.log('got material', objectMaterial);
        const skeleton = o.skeleton ?? null;

        const key = [
          type,
          renderer.getProgramCacheKey(o, objectMaterial),
        ].join(',');

        let m = mergeables.get(key);
        if (!m) {
          m = {
            type,
            material: objectMaterial,
            geometries: [],
            maps: [],
            emissiveMaps: [],
            normalMaps: [],
            // shadeTextures: [],
            skeletons: [],
            morphTargetDictionaryArray: [],
            morphTargetInfluencesArray: [],
          };
          mergeables.set(key, m);
        }

        m.geometries.push(objectGeometry);
        m.maps.push(map);
        m.emissiveMaps.push(emissiveMap);
        m.normalMaps.push(normalMap);
        // m.shadeTextures.push(shadeTexture);
        m.skeletons.push(skeleton);
        m.morphTargetDictionaryArray.push(morphTargetDictionary);
        m.morphTargetInfluencesArray.push(morphTargetInfluences);
      }
    }
  });
  return Array.from(mergeables.values());
};

const optimizeAvatarModel = (model, options = {}) => {
  const atlasTextures = !!(options.textures ?? true);
  const textureSize = options.textureSize ?? defaultTextureSize;

  const mergeables = _getMergeableObjects(model);
  console.log('got mergeables', mergeables);

  const _mergeMesh = (mergeable, mergeableIndex) => {
    const {
      type,
      material,
      geometries,
      maps,
      emissiveMaps,
      normalMaps,
      skeletons,
      morphTargetDictionaryArray,
      morphTargetInfluencesArray,
    } = mergeable;

    // compute texture sizes
    const textureSizes = maps.map((map, i) => {
      const emissiveMap = emissiveMaps[i];
      const normalMap = normalMaps[i];
      
      const maxSize = new THREE.Vector2(0, 0);
      if (map) {
        maxSize.x = Math.max(maxSize.x, map.image.width);
        maxSize.y = Math.max(maxSize.y, map.image.height);
      }
      if (emissiveMap) {
        maxSize.x = Math.max(maxSize.x, emissiveMap.image.width);
        maxSize.y = Math.max(maxSize.y, emissiveMap.image.height);
      }
      if (normalMap) {
        maxSize.x = Math.max(maxSize.x, normalMap.image.width);
        maxSize.y = Math.max(maxSize.y, normalMap.image.height);
      }
      return maxSize;
    });

    // generate atlas layouts
    const _packAtlases = () => {
      const _attemptPack = (textureSizes, atlasSize) => {
        const maxRectsPacker = new MaxRectsPacker(atlasSize, atlasSize, 1);
        const rects = textureSizes.map((textureSize, index) => {
          // const w = t.image.width;
          // const h = t.image.height;
          // const image = t.image;
          const {x: width, y: height} = textureSize;
          return {
            width,
            height,
            data: {
              index,
            },
          };
        });
        maxRectsPacker.addArray(rects);
        let oversized = maxRectsPacker.bins.length > 1;
        maxRectsPacker.bins.forEach(bin => {
          bin.rects.forEach(rect => {
            if (rect.oversized) {
              oversized = true;
            }
          });
        });
        if (!oversized) {
          return maxRectsPacker;
        } else {
          return null;
        }
      };
      const _makeEmptyAtlas = () => new MaxRectsPacker(0, 0, 1);
      
      const hasTextures = textureSizes.some(textureSize => textureSize.x > 0 || textureSize.y > 0);
      if (hasTextures) {
        let atlas;
        let atlasSize = startAtlasSize;
        while (!(atlas = _attemptPack(textureSizes, atlasSize))) {
          atlasSize *= 2;
        }
        return atlas;
      } else {
        return _makeEmptyAtlas();
      }
    };
    const atlas = atlasTextures ? _packAtlases() : null;

    // draw atlas images
    const _drawAtlasImages = atlas => {
      const _drawAtlasImage = textureType => {
        const canvas = document.createElement('canvas');
        const canvasSize = Math.min(atlas.width, textureSize);
        const canvasScale = canvasSize / atlas.width;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');

        atlas.bins.forEach(bin => {
          bin.rects.forEach(rect => {
            const {x, y, width: w, height: h, data: {index}} = rect;
            const textures = mergeable[`${textureType}s`];
            const texture = textures[index];
            if (texture) {
              const image = texture.image;

              // draw the image in the correct box on the canvas
              const tx = x * canvasScale;
              const ty = y * canvasScale;
              const tw = w * canvasScale;
              const th = h * canvasScale;
              ctx.drawImage(image, 0, 0, image.width, image.height, tx, ty, tw, th);
            }
          });
        });

        return canvas;
      };

      const atlasImages = {};
      for (const textureType of textureTypes) {
        const atlasImage = _drawAtlasImage(textureType);
        atlasImages[textureType] = atlasImage;
      }
      return atlasImages;
    };
    const atlasImages = atlasTextures ? _drawAtlasImages(atlas) : null;

    // XXX debug
    {
      const debugWidth = 300;
      let textureTypeIndex = 0;
      for (const textureType of textureTypes) {
        const atlasImage = atlasImages[textureType];
        atlasImage.style.cssText = `\
          position: fixed;
          top: ${mergeableIndex * debugWidth}px;
          left: ${textureTypeIndex * debugWidth}px;
          min-width: ${debugWidth}px;
          max-width: ${debugWidth}px;
          min-height: ${debugWidth}px;
          z-index: 100;
        `;
        document.body.appendChild(atlasImage);
        textureTypeIndex++;
      }
    }

    // build attribute layouts
    const _makeAttributeLayoutsFromGeometries = geometries => {
      const attributeLayouts = [];
      for (const g of geometries) {
        const attributes = g.attributes;
        for (const attributeName in attributes) {
          const attribute = attributes[attributeName];
          let layout = attributeLayouts.find(layout => layout.name === attributeName);
          if (layout) {
            // sanity check that item size is the same
            if (layout.itemSize !== attribute.itemSize) {
              throw new Error(`attribute ${attributeName} has different itemSize: ${layout.itemSize}, ${attribute.itemSize}`);
            }
          } else {
            layout = new AttributeLayout(
              attributeName,
              attribute.array.constructor,
              attribute.itemSize
            );
            attributeLayouts.push(layout);
          }
          
          layout.count += attribute.count * attribute.itemSize;
        }
      }
      return attributeLayouts;
    };
    const attributeLayouts = _makeAttributeLayoutsFromGeometries(geometries);

    const _makeMorphAttributeLayoutsFromGeometries = geometries => {
      // create morph layouts
      const morphAttributeLayouts = [];
      for (const g of geometries) {
        const morphAttributes = g.morphAttributes;
        for (const morphAttributeName in morphAttributes) {
          const morphAttribute = morphAttributes[morphAttributeName];
          let morphLayout = morphAttributeLayouts.find(l => l.name === morphAttributeName);
          if (!morphLayout) {
            morphLayout = new MorphAttributeLayout(
              morphAttributeName,
              morphAttribute[0].array.constructor,
              morphAttribute[0].itemSize,
              morphAttribute.length
            );
            morphAttributeLayouts.push(morphLayout);
          }

          morphLayout.count += morphAttribute[0].count * morphAttribute[0].itemSize;
        }
      }
      return morphAttributeLayouts;
    };
    const morphAttributeLayouts = _makeMorphAttributeLayoutsFromGeometries(geometries);
    console.log('got attribute layouts', attributeLayouts, morphAttributeLayouts);

    const _forceGeometriesAttributeLayouts = (attributeLayouts, geometries) => {
      for (const layout of attributeLayouts) {
        for (const g of geometries) {
          let gAttribute = g.attributes[layout.name];
          if (!gAttribute) {
            if (layout.name === 'skinIndex' || layout.name === 'skinWeight') {
              gAttribute = new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * layout.itemSize), layout.itemSize);
              g.setAttribute(layout.name, gAttribute);
            } else {
              throw new Error(`unknown layout ${layout.name}`);
            }
          }
        }
      }
    };
    const _mergeAttributes = (geometry, geometries, attributeLayouts) => {
      for (const layout of attributeLayouts) {
        const attributeData = new layout.TypedArrayConstructor(layout.count);
        const attribute = new THREE.BufferAttribute(attributeData, layout.itemSize);
        let attributeDataIndex = 0;
        for (const g of geometries) {
          const gAttribute = g.attributes[layout.name];
          attributeData.set(gAttribute.array, attributeDataIndex);
          attributeDataIndex += gAttribute.count * gAttribute.itemSize;
        }
        // sanity check
        if (attributeDataIndex !== layout.count) {
          console.warn('desynced morph data', layout.name, attributeDataIndex, layout.count);
        }
        geometry.setAttribute(layout.name, attribute);
      }
    };
    const _mergeMorphAttributes = (geometry, geometries, morphAttributeLayouts) => {
      for (const morphLayout of morphAttributeLayouts) {
        const morphsArray = Array(morphLayout.arraySize);
        for (let i = 0; i < morphLayout.arraySize; i++) {
          const morphData = new morphLayout.TypedArrayConstructor(morphLayout.count);
          const morphAttribute = new THREE.BufferAttribute(morphData, morphLayout.itemSize);
          morphsArray[i] = morphAttribute;
          let morphDataIndex = 0;
          for (const g of geometries) {
            let gMorphAttribute = g.morphAttributes[morphLayout.name];
            gMorphAttribute = gMorphAttribute?.[i];
            if (gMorphAttribute) {
              morphData.set(gMorphAttribute.array, morphDataIndex);
              morphDataIndex += gMorphAttribute.count * gMorphAttribute.itemSize;
            } else {
              const matchingAttribute = g.attributes[morphLayout.name];
              morphDataIndex += matchingAttribute.count * matchingAttribute.itemSize;
            }
          }
          // sanity check
          if (morphDataIndex !== morphLayout.count) {
            console.warn('desynced morph data', morphLayout.name, morphDataIndex, morphLayout.count);
          }
        }
        geometry.morphAttributes[morphLayout.name] = morphsArray;
      }
    };
    const _mergeIndices = (geometry, geometries) => {
      let indexCount = 0;
      for (const g of geometries) {
        indexCount += g.index.count;
      }
      const indexData = new Uint32Array(indexCount);

      let positionOffset = 0;
      let indexOffset = 0;
      for (const g of geometries) {
        const srcIndexData = g.index.array;
        for (let i = 0; i < srcIndexData.length; i++) {
          indexData[indexOffset++] = srcIndexData[i] + positionOffset;
        }
        positionOffset += g.attributes.position.count;
      }
      geometry.setIndex(new THREE.BufferAttribute(indexData, 1));
    };
    /* const _drawAtlases = () => {
      const seenUvIndexes = new Map();
      const _drawAtlas = atlas => {
        const canvas = document.createElement('canvas');
        const canvasSize = Math.min(atlas.width, textureSize);
        const canvasScale = canvasSize / atlas.width;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');

        atlas.bins.forEach(bin => {
          bin.rects.forEach(rect => {
            const {x, y, width: w, height: h, data: {image, groups}} = rect;
            // draw the image in the correct box on the canvas
            const tx = x * canvasScale;
            const ty = y * canvasScale;
            const tw = w * canvasScale;
            const th = h * canvasScale;
            ctx.drawImage(image, 0, 0, image.width, image.height, tx, ty, tw, th);

            // const testUv = new THREE.Vector2(Math.random(), Math.random());
            for (const group of groups) {
              const {startIndex, count} = group;
              for (let i = 0; i < count; i++) {
                const uvIndex = geometry.index.array[startIndex + i];

                // XXX NOTE: this code is slightly wrong. it will generate a unified uv map (first come first served to the uv index)
                // that means that the different maps might get the wrong uv.
                // the diffuse map takes priority so it looks ok.
                // the right way to do this is to have a separate uv map for each map.
                if (!seenUvIndexes.get(uvIndex)) {
                  seenUvIndexes.set(uvIndex, true);

                  localVector2D.fromArray(geometry.attributes.uv.array, uvIndex * 2);
                  localVector2D.multiply(
                    localVector2D2.set(tw/canvasSize, th/canvasSize)
                  ).add(
                    localVector2D2.set(tx/canvasSize, ty/canvasSize)
                  );
                  localVector2D.toArray(geometry.attributes.uv.array, uvIndex * 2);
                }
              }
            }
          });
        });
        atlas.image = canvas;
        
        return atlas;
      };

      // generate atlas for each map; they are all separate
      const result = {};
      {
        let canvasIndex = 0;
        for (const k of textureTypes) {
          const atlas = atlases[k];
          const atlas2 = _drawAtlas(atlas);

          result[k] = atlas2;

          canvasIndex++;
        }
      }
      return result;
    }; */
    const _remapGeometryUvs = (geometry, geometries) => {
      let uvIndex = 0;
      const geometryUvOffsets = geometries.map(g => {
        const start = uvIndex;
        const count = g.attributes.uv.count;
        uvIndex += count;
        return {
          start,
          count,
        };
      });

      const canvasSize = Math.min(atlas.width, textureSize);
      if (canvasSize > 0) {
        const canvasScale = canvasSize / atlas.width;
        // const seenUvIndexes = new Int32Array(geometry.attributes.uv.count).fill(-1);
        atlas.bins.forEach(bin => {
          bin.rects.forEach(rect => {
            const {x, y, width: w, height: h, data: {index}} = rect;

            if (w > 0 && h > 0) {
              const {start, count} = geometryUvOffsets[index];

              const tx = x * canvasScale;
              const ty = y * canvasScale;
              const tw = w * canvasScale;
              const th = h * canvasScale;

              for (let i = 0; i < count; i++) {
                const uvIndex = start + i;

                localVector2D.fromArray(geometry.attributes.uv.array, uvIndex * 2);
                localVector2D.multiply(
                  localVector2D2.set(tw/canvasSize, th/canvasSize)
                ).add(
                  localVector2D2.set(tx/canvasSize, ty/canvasSize)
                );
                localVector2D.toArray(geometry.attributes.uv.array, uvIndex * 2);
              }
            }
          });
        });
      }
    };
    const _mergeGeometries = geometries => {
      const geometry = new THREE.BufferGeometry();
      geometry.morphTargetsRelative = true;

      _forceGeometriesAttributeLayouts(attributeLayouts, geometries);
      _mergeAttributes(geometry, geometries, attributeLayouts);
      _mergeMorphAttributes(geometry, geometries, morphAttributeLayouts);
      _mergeIndices(geometry, geometries);
      _remapGeometryUvs(geometry, geometries);

      return geometry;
    };
    const geometry = _mergeGeometries(geometries);
    console.log('got geometry', geometry);

    /* const m = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
    }); */
    const m = material;
    const _updateMaterial = () => {
      if (atlasTextures) {
        for (const textureType of textureTypes) {
          const image = atlasImages[textureType];
          const t = new THREE.Texture(image);
          t.flipY = false;
          t.needsUpdate = true;
          m[textureType] = t;
          /* if (m[textureType] !== t) {
            throw new Error('texture update failed');
          } */
          if (m.uniforms) {
            m.uniforms[textureType].value = t;
            m.uniforms[textureType].needsUpdate = true;
          }
        }
      }
      // m.roughness = 1;
      // m.alphaTest = 0.1;
      // m.transparent = true;
      m.needsUpdate = true;
    };
    _updateMaterial();
    console.log('got material', m);

    const _makeMesh = () => {
      if (type === 'mesh') {
        const mesh = new THREE.Mesh(geometry, m);
        return mesh;
      } else if (type === 'skinnedMesh') {
        const skinnedMesh = new THREE.SkinnedMesh(geometry, m);
        skinnedMesh.skeleton = skeletons[0];
        skinnedMesh.morphTargetDictionary = morphTargetDictionaryArray[0];
        skinnedMesh.morphTargetInfluences = morphTargetInfluencesArray[0];
        return skinnedMesh;
      } else {
        throw new Error(`unknown type ${type}`);
      }
    };
    const mesh = _makeMesh();
    console.log('got mesh', mesh);

    return mesh;
  };
  const mergedMeshes = mergeables.map((mergeable, i) => _mergeMesh(mergeable, i));

  const object = new THREE.Object3D();
  for (const mesh of mergedMeshes) {
    object.add(mesh);
  }
  return object;

  const _collectObjects = () => {
    const meshes = [];
    const geometries = [];
    const materials = [];
    const textures = {};
    for (const textureType of textureTypes) {
      textures[textureType] = [];
    }
    let textureGroupsMap = new WeakMap();
    const skeletons = [];
    {
      let indexIndex = 0;
      model.traverse(node => {
        if (node.isMesh && !node.parent?.isBone) {
          meshes.push(node);
  
          const geometry = node.geometry;
          geometries.push(geometry);
  
          const startIndex = indexIndex;
          const count = geometry.index.count;
          const _pushMaterial = material => {
            materials.push(material);
            for (const k of textureTypes) {
              const texture = material[k];
              if (texture) {
                const texturesOfType = textures[k];
                if (!texturesOfType.includes(texture)) {
                  texturesOfType.push(texture);
                }
                let textureGroups = textureGroupsMap.get(texture);
                if (!textureGroups) {
                  textureGroups = [];
                  textureGroupsMap.set(texture, textureGroups);
                }
                textureGroups.push({
                  startIndex,
                  count,
                });
              }
            }
          };
  
          let material = node.material;
          if (Array.isArray(material)) {
            for (let i = 0; i < material.length; i++) {
              _pushMaterial(material[i]);
            }
          } else {
            _pushMaterial(material);
          }
  
          if (node.skeleton) {
            if (!skeletons.includes(node.skeleton)) {
              skeletons.push(node.skeleton);
            }
          }
  
          indexIndex += geometry.index.count;
        }
      });
    }
    return {
      meshes,
      geometries,
      materials,
      textures,
      textureGroupsMap,
      skeletons,
    };
  };

  // collect objects
  const {
    meshes,
    geometries,
    materials,
    textures,
    textureGroupsMap,
    skeletons,
  } = _collectObjects();

  const attributeLayouts = _makeAttributeLayoutsFromGeometries(geometries);
  const morphAttributeLayouts = _makeMorphAttributeLayoutsFromGeometries(geometries);

  // validate attribute layouts
  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    const geometry = mesh.geometry;
    if (!geometry.index) {
      console.log('no index', mesh);
    }
  }
  if (skeletons.length !== 1) {
    console.log('did not have single skeleton', skeletons);
  }
  
  

  // verify
  for (const layout of attributeLayouts) {
    if (layout.index !== layout.count) {
      console.log('bad layout count', layout.index, layout.count);
    }
  }
  if (indexOffset !== indexCount) {
    console.log('bad final index', indexOffset, indexCount);
  }

  // create material
  // const material = new THREE.MeshStandardMaterial();
  const material = new THREE.MeshBasicMaterial();
  if (atlasTextures) {
    for (const k of textureTypes) {
      const t = new THREE.Texture(textureAtlases[k].image);
      t.flipY = false;
      t.needsUpdate = true;
      material[k] = t;
    }
  }
  material.roughness = 1;
  material.alphaTest = 0.1;
  material.transparent = true;

  // create mesh
  const crunchedModel = new THREE.SkinnedMesh(geometry, material);
  crunchedModel.skeleton = skeletons[0];
  const deepestMorphMesh = meshes.find(m => (m.morphTargetInfluences ? m.morphTargetInfluences.length : 0) === morphAttributeLayouts[0].depth);
  crunchedModel.morphTargetDictionary = deepestMorphMesh.morphTargetDictionary;
  crunchedModel.morphTargetInfluences = deepestMorphMesh.morphTargetInfluences;

  return crunchedModel;
};

export {
  optimizeAvatarModel,
};