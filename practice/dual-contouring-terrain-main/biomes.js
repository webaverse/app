import * as THREE from 'three';
import biomeSpecs from './biomes.json';

// json

export {biomeSpecs};

// constants

export const mapNames = [
  'Base_Color',
  'Height',
  'Normal',
  'Roughness',
  'Emissive',
  'Ambient_Occlusion',
];
export const biomesPngTexturePrefix = `/images/stylized-textures/png/`;
export const biomesKtx2TexturePrefix = `https://webaverse.github.io/land-textures/`;

export const neededTexturePrefixes = (() => {
  const neededTexturePrefixesSet = new Set();
  for (const biomeSpec of biomeSpecs) {
    const textureName = biomeSpec[2];
    neededTexturePrefixesSet.add(textureName);
  }
  const neededTexturePrefixes = Array.from(neededTexturePrefixesSet);
  return neededTexturePrefixes;
})();
export const texturesPerRow = Math.ceil(Math.sqrt(neededTexturePrefixes.length));
export const biomeUvDataTexture = (() => { // this small texture maps biome indexes in the geometry to biome uvs in the atlas texture
  const data = new Uint8Array(256 * 4);
  for (let i = 0; i < biomeSpecs.length; i++) {
    const biomeSpec = biomeSpecs[i];
    const textureName = biomeSpec[2];

    const biomeAtlasIndex = neededTexturePrefixes.indexOf(textureName);
    if (biomeAtlasIndex === -1) {
      throw new Error('no such biome: ' + textureName);
    }

    const x = biomeAtlasIndex % texturesPerRow;
    const y = Math.floor(biomeAtlasIndex / texturesPerRow);

    data[i * 4] = (x / texturesPerRow) * 255;
    data[i * 4 + 1] = (y / texturesPerRow) * 255;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  return texture;
})();

const biomeUvs = (() => {
  // const data = new Float32Array(biomeSpecs.length * 2);
  const biomeUvs = Array(biomeSpecs.length);
  for (let i = 0; i < biomeSpecs.length; i++) {
    const biomeSpec = biomeSpecs[i];
    const biomeName = biomeSpec[0];
    const textureName = biomeSpec[2];

    const biomeAtlasIndex = neededTexturePrefixes.indexOf(textureName);
    if (biomeAtlasIndex === -1) {
      throw new Error('no such biome: ' + textureName);
    }

    const x = biomeAtlasIndex % texturesPerRow;
    const y = Math.floor(biomeAtlasIndex / texturesPerRow);

    biomeUvs[i] = {
      name: biomeName,
      uv: [x / texturesPerRow, y / texturesPerRow],
    };
  }
  return biomeUvs;
})();
const biomeUvsString = (() => {
  let result = '';
  for (let i = 0; i < biomeUvs.length; i++) {
    const {name, uv} = biomeUvs[i];
    result += `{${uv[0]}, ${uv[1]}}, // ${name}\n`;
  }
  return result;
})();
window.biomeUvsString = biomeUvsString;

// baking

const loadImage = (u) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err) => {
      if (/Emissive/i.test(u)) {
        const blankCanvas = document.createElement('canvas');
        blankCanvas.width = 1;
        blankCanvas.height = 1;
        resolve(blankCanvas);
      } else {
        reject(err);
      }
    };
    img.crossOrigin = 'Anonymous';
    img.src = u;
  });
function downloadFile(file, filename) {
  const blobURL = URL.createObjectURL(file);
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = blobURL;
  tempLink.setAttribute('download', filename);

  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
}
// this method generates a deduplicted texture atlas for the texture sets used in the mesh
// the output can be used by ./scripts/build-megatexture-atlas.sh to turn it into a KTX2 texture atlas
const bakeBiomesAtlas = async ({ size = 8 * 1024 } = {}) => {
  // const atlasTextures = [];
  const textureTileSize = size / texturesPerRow;
  const halfTextureTileSize = textureTileSize / 2;

  for (const mapName of mapNames) {
    const neededTextureNames = neededTexturePrefixes.map(
      (prefix) => `${prefix}${mapName}`
    );

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    document.body.appendChild(canvas);
    canvas.style.cssText = `\
      position: fixed;
      top: 0;
      left: 0;
      z-index: 100;
      width: 1024px;
      height: 1024px;
    `;

    let index = 0;
    for (const textureName of neededTextureNames) {
      const x = index % texturesPerRow;
      const y = Math.floor(index / texturesPerRow);

      const u = biomesPngTexturePrefix + textureName + '.png';
      const img = await loadImage(u);
      console.log('load u', u, textureName, img.width, img.height);

      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          ctx.drawImage(
            img,
            x * textureTileSize + halfTextureTileSize * dx,
            y * textureTileSize + halfTextureTileSize * dy,
            halfTextureTileSize,
            halfTextureTileSize
          );
        }
      }
      // atlasTextures.push({
      //   name: textureName,
      //   uv: [
      //     (x * textureTileSize) / size,
      //     (y * textureTileSize) / size,
      //     ((x + 1) * textureTileSize) / size,
      //     ((y + 1) * textureTileSize) / size,
      //   ],
      // });

      index++;
    }

    const canvasBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(resolve, 'image/png');
    });
    downloadFile(canvasBlob, `${mapName}.png`);

    document.body.removeChild(canvas);
  }

  // const atlasJson = {
  //   textures: atlasTextures,
  // };
  // const atlasJsonString = JSON.stringify(atlasJson, null, 2);
  // const atlasJsonBlob = new Blob([atlasJsonString], {type: 'application/json'});
  // downloadFile(atlasJsonBlob, `megatexture-atlas.json`);
};
// window.bakeBiomesAtlas = bakeBiomesAtlas;