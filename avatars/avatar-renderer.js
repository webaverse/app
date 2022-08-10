/* this file implements avatar optimization and THREE.js Object management + rendering */
import * as THREE from 'three';
import * as avatarOptimizer from '../avatar-optimizer.js';
import * as avatarCruncher from '../avatar-cruncher.js';
import * as avatarSpriter from '../avatar-spriter.js';
import offscreenEngineManager from '../offscreen-engine-manager.js';
import loaders from '../loaders.js';
// import exporters from '../exporters.js';
import {abortError} from '../lock-manager.js';
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
// const updateEvent = new MessageEvent('update');

const _unfrustumCull = o => {
  o.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });
};

export class AvatarRenderer /* extends EventTarget */ {
  constructor(object, {
    quality = defaultAvatarQuality,
  } = {})	{
    // super();
    
    //

    this.object = object;
    this.quality = quality;
    
    //

    this.scene = new THREE.Object3D();
    this.placeholderMesh = _makeAvatarPlaceholderMesh();

    //

    this.spriteAvatarMeshPromise = null;
    this.crunchedModelPromise = null;
    this.optimizedModelPromise = null;

    this.spriteAvatarMesh = null;
    this.crunchedModel = null;
    this.optimizedModel = null;

    //

    this.abortController = new AbortController();

    //
    
    // XXX add frustum culling in update()
    // XXX integrate more cleanly with totum VRM type (do not double-parse)
    // XXX unlock avatar icon
    this.createSpriteAvatarMesh = offscreenEngineManager.createFunction([
      `\
      import * as THREE from 'three';
      import * as avatarSpriter from './avatar-spriter.js';
      import loaders from './loaders.js';

      `,
      async function(arrayBuffer, srcUrl) {
        const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
          const {gltfLoader} = loaders;
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
          const {gltfLoader} = loaders;
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
          const {gltfLoader} = loaders;
          gltfLoader.parse(arrayBuffer, srcUrl, accept, reject);
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
    this.loadPromise = null;

    this.setQuality(quality);
  }
  getCurrentMesh() {
    switch (this.quality) {
      case 1: {
        return this.spriteAvatarMesh;
      }
      case 2: {
        return this.crunchedModel;
      }
      case 3: {
        return this.optimizedModel;
      }
      /* case 4: {
        break;
      } */
      default: {
        return null;
        // throw new Error('unknown avatar quality: ' + this.quality);
      }
    }
  }
  async setQuality(quality) {
    this.quality = quality;

    // XXX destroy old avatars?
    this.scene.clear();
    this.scene.add(this.placeholderMesh);

    this.loadPromise = (async () => {
      switch (this.quality) {
        case 1: {
          if (!this.spriteAvatarMeshPromise) {
            this.spriteAvatarMeshPromise = (async () => {
              const textureImages = await this.createSpriteAvatarMesh([this.object.arrayBuffer, this.object.srcUrl], {
                signal: this.abortController.signal,
              });
              const glb = avatarSpriter.createSpriteAvatarMeshFromTextures(textureImages);
              _unfrustumCull(glb);
              this.spriteAvatarMesh = glb;
            })();
          }
          await this.spriteAvatarMeshPromise;
          break;
        }
        case 2: {
          if (!this.crunchedModelPromise) {
            this.crunchedModelPromise = (async () => {
              const glbData = await this.crunchAvatarModel([this.object.arrayBuffer, this.object.srcUrl], {
                signal: this.abortController.signal,
              });
              const object = await new Promise((accept, reject) => {
                const {gltfLoader} = loaders;
                gltfLoader.parse(glbData, this.object.srcUrl, accept, reject);
              });
              const glb = object.scene;
              _unfrustumCull(glb);

              _bindSkeleton(glb, this.object);
              this.crunchedModel = glb;
            })();
          }
          await this.crunchedModelPromise;
          break;
        }
        case 3: {
          if (!this.optimizedModelPromise) {
            this.optimizedModelPromise = (async () => {
              const glbData = await this.optimizeAvatarModel([this.object.arrayBuffer, this.object.srcUrl], {
                signal: this.abortController.signal,
              });
              const object = await new Promise((accept, reject) => {
                const {gltfLoader} = loaders;
                gltfLoader.parse(glbData, this.object.srcUrl, accept, reject);
              });
              const glb = object.scene;
              _unfrustumCull(glb);

              _bindSkeleton(glb, this.object);
              this.optimizedModel = glb;
              // this.optimizedModel.updateMatrixWorld();
            })();
          }
          await this.optimizedModelPromise;
          break;
        }
        case 4: {
          break;
        }
        default: {
          throw new Error('unknown avatar quality: ' + this.quality);
        }
      }
    })();

    await this.loadPromise;

    // remove the old placeholder mesh
    this.scene.remove(this.placeholderMesh);
    // add the new avatar mesh
    const currentMesh = this.getCurrentMesh();
    this.scene.add(currentMesh);

    // this.dispatchEvent(updateEvent);
  }
  update() {
    
  }
  waitForLoad() {
    return this.loadPromise;
  }
  destroy() {
    this.abortController.abort(abortError);
  }
}