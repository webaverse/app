import * as avatarSpriter from '../../avatar-spriter.js';
import * as avatarCruncher from '../../avatar-cruncher.js';
import * as avatarOptimizer from '../../avatar-optimizer.js';
import loaders from '../../loaders.js';

export async function createSpriteAvatarMesh({
  arrayBuffer,
  srcUrl,
}) {

  const textureCanvases = await avatarSpriter.renderSpriteImages(arrayBuffer, srcUrl);
  const textureImages = await Promise.all(textureCanvases.map(canvas => {
    return createImageBitmap(canvas, {
      imageOrientation: 'flipY',
    });
  }));
  return {
    textureImages,
  };
}

export async function crunchAvatarModel({
  arrayBuffer,
  srcUrl,
}) {
  const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
    const {gltfLoader} = loaders;
    gltfLoader.parse(arrayBuffer, srcUrl, object => {
      accept(object.scene);
    }, reject);
  });

  const model = await parseVrm(arrayBuffer, srcUrl);
  const glbData = await avatarCruncher.crunchAvatarModel(model);
  return {
    glbData,
  };
}

export async function optimizeAvatarModel({
  arrayBuffer,
  srcUrl,
}) {
  const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
    const {gltfLoader} = loaders;
    gltfLoader.parse(arrayBuffer, srcUrl, accept, reject);
  });

  const object = await parseVrm(arrayBuffer, srcUrl);

  const model = object.scene;
  const glbData = await avatarOptimizer.optimizeAvatarModel(model);
  return {
    glbData,
  };
}