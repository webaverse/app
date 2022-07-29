import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
import {getRenderer} from './renderer.js';
import {modUv} from './util.js';
import exporters from './exporters.js';

const defaultTextureSize = 4096;
const startAtlasSize = 512;

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();

const textureTypes = [
  'map',
  'emissiveMap',
  'normalMap',
  'shadeTexture',
];

class AttributeLayout {
  constructor(name, TypedArrayConstructor, itemSize) {
    this.name = name;
    this.TypedArrayConstructor = TypedArrayConstructor;
    this.itemSize = itemSize;

    this.count = 0;
  }
  makeDefault(g) {
    return new THREE.BufferAttribute(
      new this.TypedArrayConstructor(g.attributes.position.count * this.itemSize),
      this.itemSize
    );
  }
}
class MorphAttributeLayout extends AttributeLayout {
  constructor(name, TypedArrayConstructor, itemSize, arraySize) {
    super(name, TypedArrayConstructor, itemSize);
    this.arraySize = arraySize;
  }
  makeDefault(g) {
    return Array(this.arraySize).fill(super.makeDefault(g));
  }
}

const getObjectKeyDefault = (type, object, material) => {
  const renderer = getRenderer();
  return [
    type,
    renderer.getProgramCacheKey(object, material),
  ].join(',');
};
export const getSkeletons = (object) => {
  const skeletons = [];
  object.traverse((o) => {
    if (o.isSkeleton) {
      skeletons.push(o);
    }
  });
  return skeletons;
};
export const getBones = (object) => {
  const bones = [];
  object.traverse((o) => {
    if (o.isBone) {
      bones.push(o);
    }
  });
  return bones;
}
export const getMergeableObjects = (model, getObjectKey = getObjectKeyDefault) => {
  const mergeables = new Map();
  model.traverse(o => {
    if (o.isMesh && o.geometry.type === 'BufferGeometry') {
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
          shadeTexture = null,
        } = objectMaterial;
        const skeleton = o.skeleton ?? null;

        const key = getObjectKey(type, o, objectMaterial);

        let m = mergeables.get(key);
        if (!m) {
          m = {
            type,
            material: objectMaterial,
            objects: [],
            geometries: [],
            maps: [],
            emissiveMaps: [],
            normalMaps: [],
            shadeTextures: [],
            skeletons: [],
            morphTargetDictionaryArray: [],
            morphTargetInfluencesArray: [],
          };
          mergeables.set(key, m);
        }

        m.objects.push(o);
        m.geometries.push(objectGeometry);
        m.maps.push(map);
        m.emissiveMaps.push(emissiveMap);
        m.normalMaps.push(normalMap);
        m.shadeTextures.push(shadeTexture);
        m.skeletons.push(skeleton);
        m.morphTargetDictionaryArray.push(morphTargetDictionary);
        m.morphTargetInfluencesArray.push(morphTargetInfluences);
      }
    }
  });
  return Array.from(mergeables.values());
};

export const mergeGeometryTextureAtlas = (mergeable, textureSize) => {
  const {
    // type,
    // material,
    objects,
    geometries,
    maps,
    emissiveMaps,
    normalMaps,
    // skeletons,
    // morphTargetDictionaryArray,
    // morphTargetInfluencesArray,
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
    
    const hasTextures = textureSizes.some(textureSize => textureSize.x > 0 || textureSize.y > 0);
    if (hasTextures) {
      let atlas;
      let atlasSize = startAtlasSize;
      while (!(atlas = _attemptPack(textureSizes, atlasSize))) {
        atlasSize *= 2;
      }
      return atlas;
    } else {
      return null;
    }
  };
  const atlas = _packAtlases();

  // draw atlas images
  const originalTextures = new Map(); // map of canvas to the texture that generated it
  const _drawAtlasImages = atlas => {
    const _getTexturesKey = textures => textures.map(t => t ? t.uuid : '').join(',');
    const _drawAtlasImage = textures => {
      if (atlas && textures.some(t => t !== null)) {
        const canvasSize = Math.min(atlas.width, textureSize);
        const canvasScale = canvasSize / atlas.width;

        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');

        atlas.bins.forEach(bin => {
          bin.rects.forEach(rect => {
            const {x, y, width: w, height: h, data: {index}} = rect;
            const texture = textures[index];
            if (texture) {
              const image = texture.image;

              // draw the image in the correct box on the canvas
              const tx = x * canvasScale;
              const ty = y * canvasScale;
              const tw = w * canvasScale;
              const th = h * canvasScale;
              ctx.drawImage(image, 0, 0, image.width, image.height, tx, ty, tw, th);

              if (!originalTextures.has(canvas)) {
                originalTextures.set(canvas, texture);
              }
            }
          });
        });

        return canvas;
      } else {
        return null;
      }
    };

    const atlasImages = {};
    const atlasImagesMap = new Map(); // cache to alias identical textures
    for (const textureType of textureTypes) {
      const textures = mergeable[`${textureType}s`];
      const key = _getTexturesKey(textures);

      let atlasImage = atlasImagesMap.get(key);
      if (atlasImage === undefined) { // cache miss
        atlasImage = _drawAtlasImage(textures);
        if (atlasImage !== null) {
          atlasImage.key = key;
        }
        atlasImagesMap.set(key, atlasImage);
      }
      atlasImages[textureType] = atlasImage;
    }
    return atlasImages;
  };
  const atlasImages = _drawAtlasImages(atlas);

  /* // XXX debug
  {
    const debugWidth = 300;
    let textureTypeIndex = 0;
    for (const textureType of textureTypes) {
      const atlasImage = atlasImages[textureType];
      if (atlasImage) {
        atlasImage.style.cssText = `\
          position: fixed;
          top: ${mergeableIndex * debugWidth}px;
          left: ${textureTypeIndex * debugWidth}px;
          min-width: ${debugWidth}px;
          max-width: ${debugWidth}px;
          min-height: ${debugWidth}px;
          z-index: 100;
        `;
        atlasImage.setAttribute('type', textureType);
        document.body.appendChild(atlasImage);
        textureTypeIndex++;
      }
    }
  } */

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
    // console.log('got geomtries', geometries);
    /* for (const geometry of geometries) {
      geometry.
    } */
    
    // create morph layouts
    const morphAttributeLayouts = [];
    for (const g of geometries) {
      const morphAttributes = g.morphAttributes;
      // console.log('got keys', Object.keys(morphAttributes));
      for (const morphAttributeName in morphAttributes) {
        const morphAttribute = morphAttributes[morphAttributeName];
        let morphLayout = morphAttributeLayouts.find(l => l.name === morphAttributeName);
        if (!morphLayout) {
          // console.log('missing morph layout', morphAttributeName, morphAttribute);
          morphLayout = new MorphAttributeLayout(
            morphAttributeName,
            morphAttribute[0].array.constructor,
            morphAttribute[0].itemSize,
            morphAttribute.length
          );
          morphAttributeLayouts.push(morphLayout);
        }

        for (let i = 1; i < morphAttribute.length; i++) {
          const attribute = morphAttribute[i];
          if (attribute.count !== morphAttribute[0].count) {
            debugger;
          }
          if (attribute.itemSize !== morphAttribute[0].itemSize) {
            debugger;
          }
          if (attribute.array.constructor !== morphAttribute[0].array.constructor) {
            debugger;
          }
        }

        morphLayout.count += morphAttribute[0].count * morphAttribute[0].itemSize;
      }
    }

    for (let i = 0; i < geometries.length; i++) {
      const g = geometries[i];
      for (const k in g.morphAttributes) {
        const morphAttribute = g.morphAttributes[k];
        console.log('got morph attr', i, k, morphAttribute);
      }
    }

    return morphAttributeLayouts;
  };
  const morphAttributeLayouts = _makeMorphAttributeLayoutsFromGeometries(geometries);
  // console.log('got attribute layouts', attributeLayouts, morphAttributeLayouts);

  const _forceGeometriesAttributeLayouts = (attributeLayouts, geometries) => {
    for (const layout of attributeLayouts) {
      for (const g of geometries) {
        let gAttribute = g.attributes[layout.name];
        if (!gAttribute) {
          if (layout.name === 'skinIndex' || layout.name === 'skinWeight') {
            console.log('force layout', layout);
            debugger;

            gAttribute = layout.makeDefault(g);
            g.setAttribute(layout.name, gAttribute);

            layout.count += gAttribute.count * gAttribute.itemSize;
          } else {
            throw new Error(`unknown layout ${layout.name}`);
          }
        }
      }
    }

    for (const morphLayout of morphAttributeLayouts) {
      for (const g of geometries) {
        let morphAttribute = g.morphAttributes[morphLayout.name];
        if (!morphAttribute) {
          console.log('missing morph attribute', morphLayout, morphAttribute);
          debugger;

          morphAttribute = morphLayout.makeDefault(g);
          g.morphAttributes[morphLayout.name] = morphAttribute;

          morphLayout.count += morphAttribute[0].count * morphAttribute[0].itemSize;

          /* if (layout.name === 'skinIndex' || layout.name === 'skinWeight') {
            gAttribute = new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * layout.itemSize), layout.itemSize);
            g.setAttribute(layout.name, gAttribute);
          } else {
            throw new Error(`unknown layout ${layout.name}`);
          } */
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
        console.warn('desynced attribute data 1', layout.name, attributeDataIndex, layout.count);
        debugger;
      }
      geometry.setAttribute(layout.name, attribute);
    }
  };
  /* function mergeBufferAttributes( attributes ) {

    let TypedArray;
    let itemSize;
    let normalized;
    let arrayLength = 0;
  
    for ( let i = 0; i < attributes.length; ++ i ) {
  
      const attribute = attributes[ i ];
  
      if ( attribute.isInterleavedBufferAttribute ) {
  
        console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported.' );
        return null;
  
      }
  
      if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
      if ( TypedArray !== attribute.array.constructor ) {
  
        console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.' );
        return null;
  
      }
  
      if ( itemSize === undefined ) itemSize = attribute.itemSize;
      if ( itemSize !== attribute.itemSize ) {
  
        console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.' );
        return null;
  
      }
  
      if ( normalized === undefined ) normalized = attribute.normalized;
      if ( normalized !== attribute.normalized ) {
  
        console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.' );
        return null;
  
      }
  
      arrayLength += attribute.array.length;
  
    }
  
    const array = new TypedArray( arrayLength );
    let offset = 0;
  
    for ( let i = 0; i < attributes.length; ++ i ) {
  
      array.set( attributes[ i ].array, offset );
  
      offset += attributes[ i ].array.length;
  
    }
  
    return new THREE.BufferAttribute( array, itemSize, normalized );
  
  }
  const _mergeMorphAttributes = (geometry, geometries, objects, morphAttributeLayouts) => {
    // collect
    const morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );
    const morphAttributes = {};
    for (const geometry of geometries) {
      for ( const name in geometry.morphAttributes ) {

        if ( ! morphAttributesUsed.has( name ) ) {

          console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.' );
          return null;

        }

        if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

        morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

      }
    }

    // merge
    for ( const name in morphAttributes ) {

      const numMorphTargets = morphAttributes[ name ][ 0 ].length;
  
      if ( numMorphTargets === 0 ) break;
  
      geometry.morphAttributes = geometry.morphAttributes || {};
      geometry.morphAttributes[ name ] = [];
  
      for ( let i = 0; i < numMorphTargets; ++ i ) {
  
        const morphAttributesToMerge = [];
  
        for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {
  
          morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );
  
        }
  
        const mergedMorphAttribute = mergeBufferAttributes( morphAttributesToMerge );
  
        if ( ! mergedMorphAttribute ) {
  
          console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' morphAttribute.' );
          return null;
  
        }
  
        geometry.morphAttributes[ name ].push( mergedMorphAttribute );
  
      }
  
    }
  }; */
  const _mergeMorphAttributes = (geometry, geometries, objects, morphAttributeLayouts) => {
    // console.log('morphAttributeLayouts', morphAttributeLayouts);
    // globalThis.morphAttributeLayouts = morphAttributeLayouts;

    for (const morphLayout of morphAttributeLayouts) {
      const morphsArray = Array(morphLayout.arraySize);
      for (let i = 0; i < morphLayout.arraySize; i++) {
        const morphData = new morphLayout.TypedArrayConstructor(morphLayout.count);
        const morphAttribute = new THREE.BufferAttribute(morphData, morphLayout.itemSize);
        morphsArray[i] = morphAttribute;
        let morphDataIndex = 0;
        
        /* const geometries2 = geometries.slice();
        // randomize the order of geometries2
        for (let j = 0; j < geometries2.length; j++) {
          const j2 = Math.floor(Math.random() * geometries2.length);
          const tmp = geometries2[j];
          geometries2[j] = geometries2[j2];
          geometries2[j2] = tmp;
        } */

        console.log('num geos', geometries);
        
        let first = 0;
        for (let j = 0; j < geometries.length; j++) {
          // const object = objects[i];
          const g = geometries[j];
          
          // const r = Math.random();

          let gMorphAttribute = g.morphAttributes[morphLayout.name];
          if (gMorphAttribute.length !== morphsArray.length) {
            debugger;
          }
          gMorphAttribute = gMorphAttribute?.[i];
          if (gMorphAttribute.count !== g.attributes.position.count) {
            debugger;
          }
          if (gMorphAttribute) {
            // console.log('src', first, g, gMorphAttribute, morphAttribute, object);
            morphData.set(gMorphAttribute.array, morphDataIndex);
            
            const nz = gMorphAttribute.array.filter(n => Math.abs(n) >= 0.01);
            console.log('case 1', first, nz.length);
            
            /* if (first === 2 || first === 1) {
              for (let i = 0; i < gMorphAttribute.array.length; i++) {
                // morphData[morphDataIndex + i] = r;
                // morphData[morphDataIndex + i] *= 100;
              }
            } */

            /* for (let i = 0; i < morphData.length; i++) {
              morphData[i] = Math.random();
            } */
            if ((gMorphAttribute.count * gMorphAttribute.itemSize) !== gMorphAttribute.array.length) {
              debugger;
            }
            morphDataIndex += gMorphAttribute.count * gMorphAttribute.itemSize;
          } else {
            console.log('case 2');
            debugger;
            const matchingAttribute = g.attributes[morphLayout.name];
            morphDataIndex += matchingAttribute.count * matchingAttribute.itemSize;
          }

          first++;
        }
        // sanity check
        if (morphDataIndex !== morphLayout.count) {
          console.warn('desynced morph data 2', morphLayout.name, morphDataIndex, morphLayout.count);
          debugger;
        }
      }
      geometry.morphAttributes[morphLayout.name] = morphsArray;
      // geometry.morphTargetsRelative = true;
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
      if (g.attributes.position.count !== g.morphAttributes.position[0].count) {
        debugger;
      }
      positionOffset += g.attributes.position.count;
    }
    geometry.setIndex(new THREE.BufferAttribute(indexData, 1));
  };
  const _remapGeometryUvs = (geometry, geometries) => {
    if (atlas) {
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
      const canvasScale = canvasSize / atlas.width;
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
              modUv(localVector2D);
              localVector2D
                .multiply(
                  localVector2D2.set(tw/canvasSize, th/canvasSize)
                )
                .add(
                  localVector2D2.set(tx/canvasSize, ty/canvasSize)
                );
              localVector2D.toArray(geometry.attributes.uv.array, uvIndex * 2);
            }
          }
        });
      });
    }
  };
  const _mergeGeometries = (geometries, objects) => {
    const geometry = new THREE.BufferGeometry();
    geometry.morphTargetsRelative = true;

    _forceGeometriesAttributeLayouts(attributeLayouts, geometries);
    _mergeAttributes(geometry, geometries, attributeLayouts);
    _mergeMorphAttributes(geometry, geometries, objects, morphAttributeLayouts);
    _mergeIndices(geometry, geometries);
    _remapGeometryUvs(geometry, geometries);

    return geometry;
  };
  const geometry = _mergeGeometries(geometries, objects);
  // console.log('got geometry', geometry);

  const _makeAtlasTextures = atlasImages => {
    const _makeAtlasTexture = atlasImage => {
      const originalTexture = originalTextures.get(atlasImage);
      
      const t = new THREE.Texture(atlasImage);
      t.minFilter = originalTexture.minFilter;
      t.magFilter = originalTexture.magFilter;
      t.wrapS = originalTexture.wrapS;
      t.wrapT = originalTexture.wrapT;
      t.mapping = originalTexture.mapping;
      // t.encoding = originalTexture.encoding;

      t.flipY = false;
      t.needsUpdate = true;
      
      return t;
    };

    const result = {};
    const textureMap = new Map(); // cache to alias identical textures
    for (const textureType of textureTypes) {
      const atlasImage = atlasImages[textureType];

      if (atlasImage) {
        let atlasTexture = textureMap.get(atlasImage.key);
        if (atlasTexture === undefined) { // cache miss
          atlasTexture = _makeAtlasTexture(atlasImage);
          textureMap.set(atlasImage.key, atlasTexture);
        }
        result[textureType] = atlasTexture;
      } else {
        result[textureType] = null;
      }
    }
    return result;
  };
  const atlasTextures = atlasImages ? _makeAtlasTextures(atlasImages) : null;

  return {
    atlas,
    atlasImages,
    attributeLayouts,
    morphAttributeLayouts,
    geometry,
    atlasTextures,
  };
};

export const optimizeAvatarModel = async (model, options = {}) => {
  /* if (!model) {
    debugger;
  }
  if (!model.traverse) {
    debugger;
  } */
  const textureSize = options.textureSize ?? defaultTextureSize;

  const mergeables = getMergeableObjects(model);

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

    /* const m = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
    }); */
    const m = material;
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
    // console.log('got material', m);

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
        // console.log('got influences', skinnedMesh.morphTargetInfluences);
        return skinnedMesh;
      } else {
        throw new Error(`unknown type ${type}`);
      }
    };
    const mesh = _makeMesh();
    // console.log('got mesh', mesh);

    return mesh;
  };
  const mergedMeshes = mergeables.map((mergeable, i) => _mergeMesh(mergeable, i));

  const object = new THREE.Object3D();
  for (const mesh of mergedMeshes) {
    object.add(mesh);
  }

  /* // also need skeletons or else the parse will crash
  const skeletons = getSkeletons(model);
  for (const skeleton of skeletons) {
    object.add(skeleton);
  } */

  // same as above, but for bones
  const bones = getBones(model);
  for (const bone of bones) {
    object.add(bone);
  }
  // console.log('got bones', model, bones);

  // XXX this should anti-index flattened index ranges for the multi-materials case

  return object;

  /* const glbData = await new Promise((accept, reject) => {
    const {gltfExporter} = exporters;
    gltfExporter.parse(
      object,
      function onCompleted(arrayBuffer) {
        accept(arrayBuffer);
      }, function onError(error) {
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
  return glbData; */
};