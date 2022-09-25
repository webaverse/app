import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
import {modUv} from './util.js';
import {startTextureAtlasSize, maxTextureAtlasSize} from './constants.js';

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
// const localVector4D = new THREE.Vector4();
// const localQuaternion = new THREE.Quaternion();
// const localMatrix = new THREE.Matrix4();

export const mapWarpedUvs = (src, srcOffset, dst, dstOffset, tx, ty, tw, th, canvasSize) => {
  const count = src.count;
  for (let i = 0; i < count; i++) {
    const srcIndex = srcOffset + i * 2;
    const localDstOffset = dstOffset + i * 2;

    localVector2D.fromArray(src.array, srcIndex);
    modUv(localVector2D);
    localVector2D
      .multiply(
        localVector2D2.set(tw/canvasSize, th/canvasSize)
      )
      .add(
        localVector2D2.set(tx/canvasSize, ty/canvasSize)
      );
    localVector2D.toArray(dst.array, localDstOffset);
  }
};

const generateTextureAtlas = textureSpecs => {
  const textureNames = Object.keys(textureSpecs);
  const firstTextureArray = textureSpecs[textureNames[0]];

  // compute texture sizes
  const textureSizes = firstTextureArray.map((firstTexture, i) => {
    /* const emissiveMap = emissiveMaps[i];
    const normalMap = normalMaps[i];
    const roughnessMap = roughnessMaps[i];
    const metalnessMap = metalnessMaps[i]; */

    const maxSize = new THREE.Vector2(0, 0);
    for (const textureName of textureNames) {
      const map = textureSpecs[textureName][i];
      if (map) {
        maxSize.x = Math.max(maxSize.x, map.image.width);
        maxSize.y = Math.max(maxSize.y, map.image.height);
      }
    }
    return maxSize;
  });
  const textureUuids = firstTextureArray.map((firstTexture, i) => {
    /* const emissiveMap = emissiveMaps[i];
    const normalMap = normalMaps[i];
    const roughnessMap = roughnessMaps[i];
    const metalnessMap = metalnessMaps[i]; */

    const uuids = [];
    for (const textureName of textureNames) {
      const map = textureSpecs[textureName][i];
      uuids.push(map ? map.uuid : null);
    }
    return uuids.join(':');
  });

  // generate atlas layouts
  const _packAtlases = () => {
    const _attemptPack = (textureSizes, atlasSize) => {
      const maxRectsPacker = new MaxRectsPacker(atlasSize, atlasSize, 0);
      const rectUuidCache = new Map();
      const rectIndexCache = new Map();
      textureSizes.forEach((textureSize, index) => {
        const {x: width, y: height} = textureSize;
        const hash = textureUuids[index];
        
        let rect = rectUuidCache.get(hash);
        if (!rect) {
          rect = {
            width,
            height,
            data: {
              index,
            },
          };
          rectUuidCache.set(hash, rect);
        }
        rectIndexCache.set(index, rect);
      });
      const rects = Array.from(rectUuidCache.values());

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
        maxRectsPacker.rectIndexCache = rectIndexCache;
        return maxRectsPacker;
      } else {
        return null;
      }
    };
    
    const hasTextures = textureSizes.some(textureSize => textureSize.x > 0 || textureSize.y > 0);
    if (hasTextures) {
      let atlas;
      let atlasSize = startTextureAtlasSize;
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
  const _drawAtlasImages = atlas => {
    const _getTexturesKey = textures => textures.map(t => t ? t.uuid : '').join(',');
    const _drawAtlasImage = (textureName, textures) => {
      if (atlas && textures.some(t => t !== null)) {
        const canvasSize = Math.min(atlas.width, maxTextureAtlasSize);
        const canvasScale = canvasSize / atlas.width;

        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const initializer = textureInitializers[textureName];
        if (initializer) {
          initializer(canvas);
        }

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
    for (const textureName of textureNames) {
      const textures = textureSpecs[textureName];
      const key = _getTexturesKey(textures);

      // const textureName2 = textureName.replace(/s$/, '');

      let atlasImage = atlasImagesMap.get(key);
      if (atlasImage === undefined) { // cache miss
        atlasImage = _drawAtlasImage(textureName, textures);
        if (atlasImage !== null) {
          atlasImage.key = key;
        }
        atlasImagesMap.set(key, atlasImage);
      }
      atlasImages[textureName] = atlasImage;
    }
    return atlasImages;
  };
  const atlasImages = _drawAtlasImages(atlas);

  return {
    atlas,
    atlasImages,
  };
};

/* const textureTypes = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
]; */
const _colorCanvas = (canvas, fillStyle) => {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
const textureInitializers = {
  normalMap(canvas) {
    _colorCanvas(canvas, 'rgb(128, 128, 255)');
  },
  roughnessMap(canvas) {
    _colorCanvas(canvas, 'rgb(255, 255, 255)');
  },
  /* metalness(canvas) {
    _colorCanvas(canvas, 'rgb(0, 0, 0)');
  }, */
};
export const createTextureAtlas = (meshes, {
  textures = ['map'],
  attributes = ['position', 'normal', 'uv'],
} = {}) => {
  const textureSpecs = {};
  for (const textureName of textures) {
    textureSpecs[textureName] = meshes.map(mesh => mesh.material[textureName]);
  }
  const {
    atlas,
    atlasImages,
  } = generateTextureAtlas(textureSpecs);

  const canvasSize = Math.min(atlas.width, maxTextureAtlasSize);
  const canvasScale = canvasSize / atlas.width;

  // geometry
  const geometries = meshes.map((m, i) => {
    const srcGeometry = m.geometry;

    const geometry = new THREE.BufferGeometry();
    for (const k of attributes) {
      const attr = srcGeometry.attributes[k];
      geometry.setAttribute(k, attr);
    }
    geometry.setIndex(srcGeometry.index);

    const rect = atlas.rectIndexCache.get(i);
    const {x, y, width: w, height: h} = rect;
    const tx = x * canvasScale;
    const ty = y * canvasScale;
    const tw = w * canvasScale;
    const th = h * canvasScale;

    mapWarpedUvs(geometry.attributes.uv, 0, geometry.attributes.uv, 0, tx, ty, tw, th, canvasSize);
  
    return geometry;
  });

  // material
  const material = new THREE.MeshStandardMaterial();
  for (const textureName of textures) {
    const atlasImage = atlasImages[textureName];
    if (atlasImage) {
      const texture = new THREE.Texture(atlasImage);
      texture.flipY = false;
      texture.encoding = THREE.sRGBEncoding;
      texture.needsUpdate = true;
      material[textureName] = texture;
    }
  }
  material.roughness = 1;
  material.side = THREE.DoubleSide;
  material.transparent = true;
  material.alphaTest = 0.5;
  // material.alphaToCoverage = true;

  // mesh
  const meshes2 = geometries.map(geometry => new THREE.Mesh(geometry, material));

  return {
    atlas,
    atlasImages,
    meshes: meshes2,
    textureNames: textures,
  };
};