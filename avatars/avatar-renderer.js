/* this file implements avatar optimization and THREE.js Object management + rendering */
import * as THREE from 'three';
import * as avatarOptimizer from '../avatar-optimizer.js';
import * as avatarCruncher from '../avatar-cruncher.js';
import * as avatarSpriter from '../avatar-spriter.js';
import offscreenEngineManager from '../offscreen-engine-manager.js';
import loaders from '../loaders.js';
import exporters from '../exporters.js';
import {
  defaultAvatarQuality,
} from '../constants.js';
import { downloadFile } from '../util.js';

window.morphTargetDictionaries = [];
window.morphTargetInfluences = [];
window.srcMorphTargetDictionaries = [];
window.srcMorphTargetInfluences = [];

const avatarPlaceholderImagePromise = (async () => {
  const avatarPlaceholderImage = new Image();
  avatarPlaceholderImage.src = '/avatars/images/user.png';
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
  // console.log('bind skeleton', dstModel, srcObject);
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
      if (!srcSkeleton) {
        debugger;
      }
      o.skeleton = srcSkeleton;
    }
    if (o.isMesh) {
      // also bind the blend shapes
      // skinnedMesh.skeleton = skeletons[0];
      const skinnedMesh = _findSkinnedMeshInSrc();
      // console.log('map blend shapes', o, skinnedMesh);
      
      // o.morphTargetDictionary = skinnedMesh.morphTargetDictionary;
      // o.morphTargetInfluences = skinnedMesh.morphTargetInfluences;
      
      window.morphTargetDictionaries.push(o.morphTargetDictionary);
      window.morphTargetInfluences.push(o.morphTargetInfluences);
      window.srcMorphTargetDictionaries.push(skinnedMesh.morphTargetDictionary);
      window.srcMorphTargetInfluences.push(skinnedMesh.morphTargetInfluences);

      // o.geometry.morphAttributes = skinnedMesh.geometry.morphAttributes;
      // o.morphAttributes = skinnedMesh.morphAttributes;
      // o.morphAttributesRelative = skinnedMesh.morphAttributesRelative;

      /* o.geometry.morphAttributes.position.forEach(attr => {
        attr.onUploadCallback = () => {
          console.log('upload callback');
        };

        for (let i = 0; i < attr.array.length; i++) {
          // if ((attr.array[i]) != 0) {
            // attr.array[i] *= 10;
            // attr.array[i] = Math.random();
          // }
        }
      }); */

      // o.onBeforeRender = () => {debugger;}
      /* o.material.onBeforeCompile = (shader) => {
        console.log('compile avatar shader', shader);
      }; */
      // window.o = o;

      const _frame = () => {
        window.requestAnimationFrame(_frame);
      
        if (o.morphTargetInfluences.length !== skinnedMesh.morphTargetInfluences.length) {
          debugger;
        }
        for (let i = 0; i < o.morphTargetInfluences.length; i++) {
          // o.morphTargetInfluences[i] = skinnedMesh.morphTargetInfluences[i];
          o.morphTargetInfluences[i] = 1;
        }
      };
      _frame();
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
        if (!arrayBuffer) {
          debugger;
        }

        const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
          const { gltfLoader } = loaders;
          gltfLoader.parse(arrayBuffer, srcUrl, object => {
            accept(object.scene);
          }, reject);
        });

        const skinnedMesh = await parseVrm(arrayBuffer, srcUrl);
        if (!skinnedMesh) {
          debugger;
        }
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
        if (!arrayBuffer) {
          debugger;
        }

        const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
          const { gltfLoader } = loaders;
          gltfLoader.parse(arrayBuffer, srcUrl, object => {
            accept(object.scene);
          }, reject);
        });

        const model = await parseVrm(arrayBuffer, srcUrl);
        if (!model) {
          debugger;
        }
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
        if (!arrayBuffer) {
          debugger;
        }

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

    // console.log('set quality', quality, new Error().stack);

    switch (this.quality) {
      case 1: {
        if (!this.spriteAvatarMesh) {
          if (!this.object.arrayBuffer) {
            debugger;
          }
          const textureImages = await this.createSpriteAvatarMesh([this.object.arrayBuffer, this.object.srcUrl]);
          this.spriteAvatarMesh = avatarSpriter.createSpriteAvatarMeshFromTextures(textureImages);
          // this.spriteAvatarMesh.visible = false;
          // this.spriteAvatarMesh.enabled = true; // XXX
          this.scene.add(this.spriteAvatarMesh);
        }
        break;
      }
      case 2: {
        if (!this.crunchedModel) {
          if (!this.object.arrayBuffer) {
            debugger;
          }
          const glbData = await this.crunchAvatarModel([this.object.arrayBuffer, this.object.srcUrl]);
          const glb = await new Promise((accept, reject) => {
            const {gltfLoader} = loaders;
            gltfLoader.parse(glbData, this.object.srcUrl, object => {
              accept(object.scene);
            }, reject);
          });
          this.crunchedModel = glb;
          // this.crunchedModel.visible = false;
          // this.crunchedModel.enabled = true; // XXX
          this.scene.add(this.crunchedModel);
        }
        break;
      }
      case 3: {
        if (!this.optimizedModel) {
          this.optimizedModel = true;

          const glbData = await this.optimizeAvatarModel([this.object.arrayBuffer, this.object.srcUrl]);

          /* const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
            const { gltfLoader } = loaders;
            gltfLoader.parse(arrayBuffer, srcUrl, object => {
              accept(object);
            }, reject);
          });
          const object = await parseVrm(this.object.arrayBuffer, this.object.srcUrl);
          object.scene.updateMatrixWorld();
          const glbData = await new Promise((accept, reject) => {
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

          const glb = await new Promise((accept, reject) => {
            const {gltfLoader} = loaders;
            gltfLoader.parse(glbData, this.object.srcUrl, object => {
              // window.o15 = object;
              accept(object.scene);
            }, reject);
          });

          _bindSkeleton(glb, this.object);
          this.optimizedModel = glb;
          
          // object.scene.position.x = -10;
          // object.scene.updateMatrixWorld();
          // this.scene.add(object.scene);
          
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

    this.scene.remove(this.placeholderMesh);

    // this.#updateVisibility();
  }
  /* #updateVisibility() {
    this.object.visible = false;
    if (this.spriteAvatarMesh) {
      this.spriteAvatarMesh.visible = false;
    }
    if (this.crunchedModel) {
      this.crunchedModel.visible = false;
    }
    if (this.optimizedModel) {
      this.optimizedModel.visible = false;
    }

    switch (this.quality) {
      case 1: {
        if (this.spriteAvatarMesh && this.spriteAvatarMesh.enabled) {
          this.spriteAvatarMesh.visible = true;
        }
        break;
      }
      case 2: {
        if (this.crunchedModel && this.crunchedModel.enabled) {
          this.crunchedModel.visible = true;
        }
        break;
      }
      case 3: {
        if (this.optimizedModel && this.optimizedModel.enabled) {
          this.optimizedModel.visible = true;
        }
        break;
      }
      case 4: {
        this.object.visible = true;
        break;
      }
      default: {
        throw new Error('unknown avatar quality: ' + this.quality);
      }
    }
  } */
}