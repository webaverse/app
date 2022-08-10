/* this file implements avatar optimization and THREE.js Object management + rendering */
import * as THREE from 'three';
import * as avatarOptimizer from '../avatar-optimizer.js';
import * as avatarCruncher from '../avatar-cruncher.js';
import * as avatarSpriter from '../avatar-spriter.js';
import offscreenEngineManager from '../offscreen-engine-manager.js';
import loaders from '../loaders.js';
// import exporters from '../exporters.js';
import {
  defaultAvatarQuality,
} from '../constants.js';
// import { downloadFile } from '../util.js';

const avatarPlaceholderImagePromise = (async () => {
  const avatarPlaceholderImage = new Image();
  avatarPlaceholderImage.src = '/images/user.png';
  await new Promise((accept, reject) => {
    avatarPlaceholderImage.onload = accept;
    avatarPlaceholderImage.onerror = reject;
  });
  return avatarPlaceholderImage;
})();
const waitForAvatarPlaceholderImage = () => avatarPlaceholderImagePromise;
const avatarPlaceholderTexture = new THREE.Texture();
(async() => {
  const avatarPlaceholderImage = await waitForAvatarPlaceholderImage();
  avatarPlaceholderTexture.image = avatarPlaceholderImage;
  avatarPlaceholderTexture.needsUpdate = true;
})();
const geometry = new THREE.PlaneBufferGeometry(0.1, 0.1);
const material = new THREE.MeshBasicMaterial({
  map: avatarPlaceholderTexture,
});
const _makeAvatarPlaceholderMesh = () => {
  const mesh = new THREE.Mesh(geometry, material);
  return mesh; 
};
const _bindSkeleton = (dstModel, srcObject) => {
  const srcModel = srcObject.scene;
  
  const _findBoneInSrc = (srcBoneName) => {
    let result = null;
    const _recurse = o => {
      if (o.isBone && o.name === srcBoneName) {
        result = o;
        return false;
      }
      for (const child of o.children) {
        if (_recurse(child) === false) {
          return false;
        }
      }
      return true;
    };
    _recurse(srcModel);
    return result;
  };
  const _findSrcSkeletonFromBoneName = (boneName) => {
    let skeleton = null;

    const bone = _findBoneInSrc(boneName);
    if (bone !== null) {
      const _recurse = o => {
        if (o.isSkinnedMesh) {
          if (o.skeleton.bones.includes(bone)) {
            skeleton = o.skeleton;
            return false;
          }
        }
        for (const child of o.children) {
          if (_recurse(child) === false) {
            return false;
          }
        }
        return true;
      };
      _recurse(srcModel);
    }

    return skeleton;
  };
  const _findSrcSkeletonFromDstSkeleton = skeleton => {
    return _findSrcSkeletonFromBoneName(skeleton.bones[0].name);
  };
  const _findSkinnedMeshInSrc = () => {
    let result = null;
    const _recurse = o => {
      if (o.isSkinnedMesh) {
        result = o;
        return false;
      }
      for (const child of o.children) {
        if (_recurse(child) === false) {
          return false;
        }
      }
      return true;
    };
    _recurse(srcModel);
    return result;
  };
  dstModel.traverse(o => {
    if (o.isSkinnedMesh) {
      // bind the skeleton
      const {skeleton: dstSkeleton} = o;
      const srcSkeleton = _findSrcSkeletonFromDstSkeleton(dstSkeleton);
      o.skeleton = srcSkeleton;
    }
    if (o.isMesh) {
      // bind the blend shapes
      const skinnedMesh = _findSkinnedMeshInSrc();
      o.morphTargetDictionary = skinnedMesh.morphTargetDictionary;
      o.morphTargetInfluences = skinnedMesh.morphTargetInfluences;
    }
  });
};

export class AvatarRenderer {
  constructor(object, {
    quality = defaultAvatarQuality,
  } = {})	{
    this.object = object;
    this.quality = quality;
    
    //

    this.scene = new THREE.Object3D();
    this.placeholderMesh = _makeAvatarPlaceholderMesh();

    //
    
    this.createSpriteAvatarMesh = offscreenEngineManager.createFunction([
      `\
      import * as THREE from 'three';
      import * as avatarSpriter from './avatar-spriter.js';
      import loaders from './loaders.js';

      `,
      async function(arrayBuffer, srcUrl) {
        const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
          const { gltfLoader } = loaders;
          gltfLoader.parse(arrayBuffer, srcUrl, object => {
            accept(object.scene);
          }, reject);
        });

        const skinnedMesh = await parseVrm(arrayBuffer, srcUrl);
        const textureImages = avatarSpriter.renderSpriteImages(skinnedMesh);
        return textureImages;
      }
    ]);
    this.crunchAvatarModel = offscreenEngineManager.createFunction([
      `\
      import * as THREE from 'three';
      import * as avatarCruncher from './avatar-cruncher.js';
      import loaders from './loaders.js';

      `,
      async function(arrayBuffer, srcUrl) {
        const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
          const { gltfLoader } = loaders;
          gltfLoader.parse(arrayBuffer, srcUrl, object => {
            accept(object.scene);
          }, reject);
        });

        const model = await parseVrm(arrayBuffer, srcUrl);
        const glbData = await avatarCruncher.crunchAvatarModel(model);
        return glbData;
      }
    ]);
    this.optimizeAvatarModel = offscreenEngineManager.createFunction([
      `\
      import * as THREE from 'three';
      import * as avatarOptimizer from './avatar-optimizer.js';
      import loaders from './loaders.js';
      import exporters from './exporters.js';

      `,
      async function(arrayBuffer, srcUrl) {
        const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
          const { gltfLoader } = loaders;
          gltfLoader.parse(arrayBuffer, srcUrl, object => {
            accept(object);
          }, reject);
        });

        const object = await parseVrm(arrayBuffer, srcUrl);
        
        const model = object.scene;
        const glbData = await avatarOptimizer.optimizeAvatarModel(model);

        /* const glbData = await new Promise((accept, reject) => {
          const {gltfExporter} = exporters;
          gltfExporter.parse(
            object.scene,
            function onCompleted(arrayBuffer) {
              accept(arrayBuffer);
            }, function onError(error) {
              reject(error);
            },
            {
              binary: true,
              includeCustomExtensions: true,
            },
          );
        }); */

        // const parsedObject = await parseVrm(glbData, srcUrl);
        // console.log('compare skeletons', object, parsedObject);

        return glbData;
      }
    ]);

    this.setQuality(quality);
  }
  async setQuality(quality) {
    this.quality = quality;

    // XXX destroy the old avatars?
    this.scene.clear();
    this.scene.add(this.placeholderMesh);

    switch (this.quality) {
      case 1: {
        if (!this.spriteAvatarMesh) {
          this.spriteAvatarMesh = {};

          const textureImages = await this.createSpriteAvatarMesh([this.object.arrayBuffer, this.object.srcUrl]);
          this.spriteAvatarMesh = avatarSpriter.createSpriteAvatarMeshFromTextures(textureImages);
          this.scene.add(this.spriteAvatarMesh);
        }
        break;
      }
      case 2: {
        if (!this.crunchedModel) {
          this.crunchedModel = {};

          const glbData = await this.crunchAvatarModel([this.object.arrayBuffer, this.object.srcUrl]);
          const glb = await new Promise((accept, reject) => {
            const {gltfLoader} = loaders;
            gltfLoader.parse(glbData, this.object.srcUrl, object => {
              accept(object.scene);
            }, reject);
          });
          this.crunchedModel = glb;
          this.scene.add(this.crunchedModel);
        }
        break;
      }
      case 3: {
        if (!this.optimizedModel) {
          this.optimizedModel = {};

          const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
            const {gltfLoader} = loaders;
            gltfLoader.parse(arrayBuffer, srcUrl, accept, reject);
          });
          const object = await parseVrm(this.object.arrayBuffer, this.object.srcUrl);

          const glb = await avatarOptimizer.optimizeAvatarModel(object.scene);

          _bindSkeleton(glb, this.object);
          this.optimizedModel = glb;

          this.optimizedModel.updateMatrixWorld();
          this.scene.add(this.optimizedModel);
        }
        break;
      }
      case 4: {
        break;
      }
      default: {
        throw new Error('unknown avatar quality: ' + this.quality);
      }
    }

    // remove the old placeholder mesh
    this.scene.remove(this.placeholderMesh);
    // add the new avatar mesh
    switch (this.quality) {
      case 1: {
        this.scene.add(this.spriteAvatarMesh);
        break;
      }
      case 2: {
        this.scene.add(this.crunchedModel);
        break;
      }
      case 3: {
        this.scene.add(this.optimizedModel);
        break;
      }
      case 4: {
        break;
      }
      default: {
        throw new Error('unknown avatar quality: ' + this.quality);
      }
    }
  }
}