import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';

const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
// const localVector4D = new THREE.Vector4();
// const localVector4D2 = new THREE.Vector4();

class AttributeLayout {
  constructor(name, TypedArrayConstructor, itemSize) {
    this.name = name;
    this.TypedArrayConstructor = TypedArrayConstructor;
    this.itemSize = itemSize;
    this.index = 0;
    this.count = 0;
    this.depth = 0;
  }
}
const crunchAvatarModel = model => {
  const _makeAttributeLayoutsFromGeometry = geometry => {
    const attributes = geometry.attributes;
    const attributeLayouts = [];
    for (const attributeName in attributes) {
      const attribute = attributes[attributeName];
      const layout = new AttributeLayout(attributeName, attribute.array.constructor, attribute.itemSize);
      attributeLayouts.push(layout);
    }
    return attributeLayouts;
  };
  const _makeMorphAttributeLayoutsFromGeometries = geometries => {
    // create morph layouts
    const morphAttributeLayouts = [];
    for (const geometry of geometries) {
      const morphAttributes = geometry.morphAttributes;
      for (const morphAttributeName in morphAttributes) {
        const morphAttribute = morphAttributes[morphAttributeName];
        let morphLayout = morphAttributeLayouts.find(l => l.name === morphAttributeName);
        if (!morphLayout) {
          morphLayout = new AttributeLayout(morphAttributeName, morphAttribute[0].array.constructor, morphAttribute[0].itemSize);
          morphLayout.depth = morphAttribute.length;
          morphAttributeLayouts.push(morphLayout);
        }
      }
    }

    // compute morph layouts sizes
    for (const morphLayout of morphAttributeLayouts) {
      for (const g of geometries) {
        const morphAttribute = g.morphAttributes[morphLayout.name];
        if (morphAttribute) {
          morphLayout.count += morphAttribute[0].count * morphAttribute[0].itemSize;
          // console.log('morph layout add 1', morphLayout.count, morphAttribute[0].count, morphAttribute[0].itemSize);
        } else {
          const matchingGeometryAttribute = g.attributes[morphLayout.name];
          if (matchingGeometryAttribute) {
            morphLayout.count += matchingGeometryAttribute.count * matchingGeometryAttribute.itemSize;
            // console.log('morph layout add 2', morphLayout.count, matchingGeometryAttribute.count, matchingGeometryAttribute.itemSize);
          } else {
            console.warn('geometry  attributes desynced with morph attributes', g.attributes, morphAttribute);
          }
        }
      }
    }
    return morphAttributeLayouts;
  };

  // collect objects
  const meshes = [];
  const geometries = [];
  const materials = [];
  const textures = {
    map: [],
    emissiveMap: [],
    normalMap: [],
  };
  const textureTypes = Object.keys(textures);
  const skeletons = [];
  const startAtlasSize = 512;
  const _pushMaterial = (material, startIndex, count) => {
    materials.push(material);
    for (const k of textureTypes) {
      const texture = material[k];
      if (texture) {
        const texturesOfType = textures[k];
        if (!texturesOfType.includes(texture)) {
          texturesOfType.push(texture);
        }
        if (!texture.groups) {
          texture.groups = [];
        }
        texture.groups.push({
          startIndex,
          count,
        });
      }
    }
  };
  {
    let indexIndex = 0;
    model.traverse(node => {
      if (node.isMesh && !node.parent?.isBone) {
        meshes.push(node);

        const geometry = node.geometry;
        geometries.push(geometry);

        let material = node.material;
        if (Array.isArray(material)) {
          for (let i = 0; i < material.length; i++) {
            _pushMaterial(material[i], indexIndex, geometry.index.count);
          }
        } else {
          _pushMaterial(material, indexIndex, geometry.index.count);
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

  const _packAtlases = () => {
    const _attempt = (k, atlasSize) => {
      const maxRectsPacker = new MaxRectsPacker(atlasSize, atlasSize, 1);
      maxRectsPacker.addArray(textures[k].map(t => {
        const w = t.image.width;
        const h = t.image.height;
        return {
          width: w,
          height: h,
          data: {
            image: t.image,
            groups: t.groups,
          },
        };
      }));
      let oversized = maxRectsPacker.bins.length !== 1;
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

    const atlases = {};
    for (const k of textureTypes) {
      let atlas;
      let atlasSize = startAtlasSize;
      while (!(atlas = _attempt(k, atlasSize))) {
        atlasSize *= 2;
      }
      atlases[k] = atlas;
    }
    return atlases;
  };
  const atlases = _packAtlases();

  // build and validate attribute layouts
  const attributeLayouts = _makeAttributeLayoutsFromGeometry(geometries[0]);
  const morphAttributeLayouts = _makeMorphAttributeLayoutsFromGeometries(geometries);
  let indexCount = 0;
  for (let i = 0; i < meshes.length; i++) {
    const mesh = meshes[i];
    const geometry = mesh.geometry;
    const attributes = geometry.attributes;
    const attributeNamesArray = Object.keys(attributes);

    if (attributeNamesArray.length !== attributeLayouts.length) {
      console.log('bad attributes length', mesh, attributeLayouts.length, attributeNamesArray.length, attributeLayouts, attributeNamesArray);
    }
    if (!geometry.index) {
      console.log('no index', mesh);
    }
    
    if (!mesh.skeleton) {
      console.log('no skeleton', mesh);;
    }
  }
  if (skeletons.length !== 1) {
    console.log('did not have single skeleton', skeletons);
  }

  for (const layout of attributeLayouts) {
    for (const g of geometries) {
      const gAttribute = g.attributes[layout.name];
      layout.count += gAttribute.count * gAttribute.itemSize;
    }
    
  }
  for (const g of geometries) {
    indexCount += g.index.count;
  }

  /* {
    let canvasOffsetX = 0;
    let canvasOffsetY = 0;
    for (const texture of textures.map) {
      // copy the texture to canvas and attach it to the DOM
      const canvas = document.createElement('canvas');
      canvas.width = texture.image.width;
      canvas.height = texture.image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(texture.image, 0, 0);
      const displaySize = texture.image.width / 16;
      canvas.style.cssText = `\
        position: fixed;
        top: ${canvasOffsetY}px;
        left: ${canvasOffsetX}px;
        width: ${displaySize}px;
        height: ${displaySize}px;
        z-index: 10;
      `;
      document.body.appendChild(canvas);
      canvasOffsetX += displaySize;
      if (canvasOffsetX >= 256) {
        canvasOffsetX = 0;
        canvasOffsetY += 128;
      }
    }
  } */

  // console.log('got avatar breakout', meshes, geometries, materials, textures, skeletons, morphAttributeLayouts);
  
  // build geometry
  const geometry = new THREE.BufferGeometry();
  for (const layout of attributeLayouts) {
    const attributeData = new layout.TypedArrayConstructor(layout.count);
    const attribute = new THREE.BufferAttribute(attributeData, layout.itemSize);
    for (const g of geometries) {
      const gAttribute = g.attributes[layout.name];
      attributeData.set(gAttribute.array, layout.index);
      layout.index += gAttribute.count * gAttribute.itemSize;
    }
    geometry.setAttribute(layout.name, attribute);
  }
  for (const morphLayout of morphAttributeLayouts) {
    const morphsArray = Array(morphLayout.depth);
    for (let i = 0; i < morphLayout.depth; i++) {
      const morphData = new morphLayout.TypedArrayConstructor(morphLayout.count);
      let morphDataIndex = 0;
      const morphAttribute = new THREE.BufferAttribute(morphData, morphLayout.itemSize);
      morphsArray[i] = morphAttribute;
      for (const g of geometries) {
        let gMorphAttribute = g.morphAttributes[morphLayout.name];
        gMorphAttribute = gMorphAttribute && gMorphAttribute[i];
        if (gMorphAttribute) {
          morphData.set(gMorphAttribute.array, morphDataIndex);
          morphDataIndex += gMorphAttribute.count * gMorphAttribute.itemSize;
          // console.log('new index 1', morphLayout.name, gMorphAttribute.array.some(n => n !== 0), morphDataIndex, gMorphAttribute.count, gMorphAttribute.itemSize);
        } else {
          const matchingAttribute = g.attributes[morphLayout.name];
          morphDataIndex += matchingAttribute.count * matchingAttribute.itemSize;
          // console.log('new index 2', g, morphDataIndex, matchingAttribute.count, matchingAttribute.itemSize);
        }
      }
      if (morphDataIndex !== morphLayout.count) {
        console.warn('desynced morph data', morphLayout.name, morphDataIndex, morphLayout.count);
      }
    }
    geometry.morphAttributes[morphLayout.name] = morphsArray;
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
  geometry.morphTargetsRelative = true;

  /* const uv3Data = new Float32Array(geometry.attributes.uv.count * 4);
  const uv3 = new THREE.BufferAttribute(uv3Data, 4);
  geometry.setAttribute('uv3', uv3); */

  /* // these uvs can be used to color code the mesh by material or texture
  const uv4Data = new Float32Array(geometry.attributes.uv.count * 4);
  const uv4 = new THREE.BufferAttribute(uv4Data, 4);
  geometry.setAttribute('uv4', uv4); */

  // verify
  for (const layout of attributeLayouts) {
    if (layout.index !== layout.count) {
      console.log('bad layout count', layout.index, layout.count);
    }
  }
  if (indexOffset !== indexCount) {
    console.log('bad index count', indexOffset, indexCount);
  }

  const seenUvIndexes = {};
  const _drawAtlases = () => {
    const _drawAtlas = atlas => {
      const canvas = document.createElement('canvas');
      canvas.width = atlas.width;
      canvas.height = atlas.height;
      const ctx = canvas.getContext('2d');

      atlas.bins.forEach(bin => {
        bin.rects.forEach(rect => {
          const {x, y, width: w, height: h, data: {image, groups}} = rect;
          // draw the image in the correct box on the canvas
          ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h);

          // const testUv = new THREE.Vector2(Math.random(), Math.random());
          for (const group of groups) {
            const {startIndex, count} = group;
            for (let i = 0; i < count; i++) {
              const uvIndex = geometry.index.array[startIndex + i];
              if (!seenUvIndexes[uvIndex]) {
                seenUvIndexes[uvIndex] = true;

                localVector2D.fromArray(geometry.attributes.uv.array, uvIndex * 2);
                localVector2D.multiply(
                  localVector2D2.set(w/atlas.width, h/atlas.height)
                ).add(
                  localVector2D2.set(x/atlas.width, y/atlas.height)
                );
                localVector2D.toArray(geometry.attributes.uv.array, uvIndex * 2);

                /* localVector4D.set(x/atlas.width, y/atlas.height, w/atlas.width, h/atlas.height);
                localVector4D.toArray(geometry.attributes.uv3.array, uvIndex * 4); */
                /* localVector4D.set(testUv.x, testUv.y, testUv.x, testUv.y);
                localVector4D.toArray(geometry.attributes.uv4.array, uvIndex * 4); */
              }
            }
          }
        });
      });
      atlas.image = canvas;
      
      return atlas;
    };
    const result = {};
    {
      let canvasIndex = 0;
      for (const k of textureTypes) {
        const atlas = atlases[k];
        const atlas2 = _drawAtlas(atlas);
        const {image} = atlas2;
        
        const displaySize = 256;
        image.style.cssText = `\
          position: fixed;
          top: 0;
          left: ${canvasIndex * displaySize}px;
          width: ${displaySize}px;
          height: ${displaySize}px;
          z-index: 10;
        `;
        document.body.appendChild(image);

        result[k] = atlas2;

        canvasIndex++;
      }
    }
    return result;
  };
  const textureAtlases = _drawAtlases();

  // return mesh
  // const material = new THREE.MeshStandardMaterial();
  const material = new THREE.MeshBasicMaterial();
  for (const k of textureTypes) {
    const t = new THREE.Texture(textureAtlases[k].image);
    t.flipY = false;
    t.needsUpdate = true;
    material[k] = t;
  }
  material.roughness = 1;
  material.alphaTest = 0.1;
  material.transparent = true;
  const crunchedModel = new THREE.SkinnedMesh(geometry, material);
  crunchedModel.skeleton = skeletons[0];
  const deepestMorphMesh = meshes.find(m => (m.morphTargetInfluences ? m.morphTargetInfluences.length : 0) === morphAttributeLayouts[0].depth);
  crunchedModel.morphTargetDictionary = deepestMorphMesh.morphTargetDictionary;
  crunchedModel.morphTargetInfluences = deepestMorphMesh.morphTargetInfluences;

  return crunchedModel;
};

export {crunchAvatarModel};