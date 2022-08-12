/* this file implements avatar optimization and THREE.js Object management + rendering */
import * as THREE from 'three';
import {VRMMaterialImporter/*, MToonMaterial*/} from '@pixiv/three-vrm/lib/three-vrm.module';
import * as avatarOptimizer from '../avatar-optimizer.js';
import * as avatarCruncher from '../avatar-cruncher.js';
import * as avatarSpriter from '../avatar-spriter.js';
import offscreenEngineManager from '../offscreen-engine-manager.js';
import loaders from '../loaders.js';
// import exporters from '../exporters.js';
import {abortError} from '../lock-manager.js';
import {/*defaultAvatarQuality,*/ minAvatarQuality, maxAvatarQuality} from '../constants.js';
const defaultAvatarQuality = 1;
// import {downloadFile} from '../util.js';

// const localBox = new THREE.Box3();
const localSphere = new THREE.Sphere();

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
const _makeAvatarPlaceholderMesh = () => new THREE.Mesh(geometry, material);
const parseVrm = (arrayBuffer, srcUrl) => new Promise((accept, reject) => {
  const {gltfLoader} = loaders;
  gltfLoader.parse(arrayBuffer, srcUrl, accept, reject);
});
const _cloneVrm = async () => {
  const vrm = await parseVrm(arrayBuffer, srcUrl);
  vrm.cloneVrm = _cloneVrm;
  vrm.arrayBuffer = arrayBuffer;
  vrm.srcUrl = srcUrl;
  return vrm;
};
const _unfrustumCull = o => {
  if (o.isMesh) {
    o.frustumCulled = false;
  }
};
const _toonShaderify = async o => {
  await new VRMMaterialImporter().convertGLTFMaterials(o);
};
const _prepVrm = (vrm) => {
  // app.add(vrm);
  // vrm.updateMatrixWorld();
  _forAllMeshes(vrm, o => {
    _addAnisotropy(o, 16);
    // _limitShadeColor(o);
    _unfrustumCull(o);
  });
};

const mapTypes = [
  'alphaMap',
  'aoMap',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'envMap',
  'lightMap',
  'map',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
];
const _addAnisotropy = (o, anisotropyLevel) => {
  for (const mapType of mapTypes) {
    if (o.material[mapType]) {
      o.material[mapType].anisotropy = anisotropyLevel;
    }
  }
};
const _forAllMeshes = (o, fn) => {
  o.traverse(o => {
    if (o.isMesh) {
      fn(o);
    }
  });
};

const _bindSkeleton = (dstModel, srcObject) => {
  console.log('bind skeleton', {dstModel, srcObject});

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
    // bind skinned meshes to skeletons
    if (o.isSkinnedMesh) {
      const {skeleton: dstSkeleton} = o;
      const srcSkeleton = _findSrcSkeletonFromDstSkeleton(dstSkeleton);
      o.skeleton = srcSkeleton;
    }
    // bind blend shapes to controls
    if (o.isMesh) {
      const skinnedMesh = _findSkinnedMeshInSrc();
      o.morphTargetDictionary = skinnedMesh.morphTargetDictionary;
      o.morphTargetInfluences = skinnedMesh.morphTargetInfluences;
    }
  });
};
// const updateEvent = new MessageEvent('update');

/* const _getMergedBoundingBox = o => {
  const box = new THREE.Box3();
  o.updateMatrixWorld();
  o.traverse(o => {
    if (o.isMesh) {
      if (!o.geometry.boundingBox) {
        debugger;
      }
      if (!o.geometry.boundingSphere) {
        debugger;
      }
      box.expandByObject(o);
    }
  });
  return box;
}; */
const _getMergedBoundingSphere = o => {
  const sphere = new THREE.Sphere();
  o.updateMatrixWorld();
  o.traverse(o => {
    if (o.isMesh) {
      sphere.union(
        localSphere.copy(o.geometry.boundingSphere)
          .applyMatrix4(o.matrixWorld)
      );
    }
  });
  return sphere;
};

export class AvatarRenderer /* extends EventTarget */ {
  constructor({
    arrayBuffer,
    srcUrl,
    quality = defaultAvatarQuality,
  } = {})	{
    // super();
    
    //

    this.arrayBuffer = arrayBuffer;
    this.srcUrl = srcUrl;
    this.quality = quality;
    
    //

    this.scene = new THREE.Object3D();
    this.scene.name = 'avatarRendererScene';
    this.placeholderMesh = _makeAvatarPlaceholderMesh();

    //

    this.spriteAvatarMeshPromise = null;
    this.crunchedModelPromise = null;
    this.optimizedModelPromise = null;
    this.meshPromise = null;

    this.spriteAvatarMesh = null;
    this.crunchedModel = null;
    this.optimizedModel = null;
    this.mesh = null;

    //

    this.controlObject = null;
    this.controlObjectLoaded = false;

    //

    this.abortController = new AbortController();

    //

    this.skeletonBindingsMap = new Map();

    //
    
    // XXX add frustum culling in update()
    // XXX integrate more cleanly with totum VRM type (do not double-parse)
    // XXX unlock avatar icon
    this.createSpriteAvatarMeshFn = null;
    this.crunchAvatarModelFn = null;
    this.optimizeAvatarModelFn = null;
    this.loadPromise = null;

    this.setQuality(quality);
  }
  createSpriteAvatarMesh() {
    if (!this.createSpriteAvatarMeshFn) {
      this.createSpriteAvatarMeshFn = offscreenEngineManager.createFunction([
        `\
        import * as THREE from 'three';
        import * as avatarSpriter from './avatar-spriter.js';
        import loaders from './loaders.js';
        import {maxAvatarQuality} from './constants.js';
        import {AvatarRenderer} from './avatars/avatar-renderer.js';
  
        `,
        async function({
          arrayBuffer,
          srcUrl,
        }) {
          const avatarRenderer = new AvatarRenderer({
            arrayBuffer,
            srcUrl,
            quality: maxAvatarQuality,
          });
          await avatarRenderer.waitForLoad();
  
          const textureCanvases = avatarSpriter.renderSpriteImages(avatarRenderer);
          const textureImages = await Promise.all(textureCanvases.map(canvas => {
            return createImageBitmap(canvas);
          }));
          return {
            textureImages,
          };
        }
      ]);
    }
    return this.createSpriteAvatarMeshFn.apply(this, arguments);
  }
  crunchAvatarModel() {
    if (!this.crunchAvatarModelFn) {
      this.crunchAvatarModelFn = offscreenEngineManager.createFunction([
        `\
        import * as THREE from 'three';
        import * as avatarCruncher from './avatar-cruncher.js';
        import loaders from './loaders.js';
  
        `,
        async function({
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
      ]);
    }
    return this.crunchAvatarModelFn.apply(this, arguments);
  }
  optimizeAvatarModel() {
    if (!this.optimizeAvatarModelFn) {
      this.optimizeAvatarModelFn = offscreenEngineManager.createFunction([
        `\
        import * as THREE from 'three';
        import * as avatarOptimizer from './avatar-optimizer.js';
        import loaders from './loaders.js';
        import exporters from './exporters.js';
  
        `,
        async function({
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
      ]);
    }
    return this.optimizeAvatarModelFn.apply(this, arguments);
  }
  #getCurrentMesh() {
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
      case 4: {
        return this.mesh;
      }
      default: {
        return null;
      }
    }
  }
  async #ensureControlObject() {
    if (!this.controlObjectLoaded) {
      this.controlObjectLoaded = true;
      this.controlObject = await parseVrm(this.arrayBuffer, this.srcUrl);
    }
  }
  #bindControlObject() {
    for (const glb of [
      this.spriteAvatarMesh,
      this.crunchedModel,
      this.optimizedModel,
      this.mesh,
    ]) {
      if (!!glb && !this.skeletonBindingsMap.has(glb)) {
        _bindSkeleton(glb, this.controlObject);
        this.skeletonBindingsMap.set(glb, true);
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
              await Promise.all([
                (async () => {
                  const {
                    textureImages,
                  } = await this.createSpriteAvatarMesh([
                    {
                      arrayBuffer: this.arrayBuffer,
                      srcUrl: this.srcUrl,
                    }
                  ], {
                    signal: this.abortController.signal,
                  });
                  const glb = avatarSpriter.createSpriteAvatarMeshFromTextures(textureImages);
                  _forAllMeshes(glb, _unfrustumCull);
                  glb.boundingSphere = _getMergedBoundingSphere(glb);

                  // console.log('got texture images glb', {textureImages, glb});
                  const canvasesPerRow = 4;
                  const canvasSize = 256;
                  for (let i = 0; i < textureImages.length; i++) {
                    const textureImage = textureImages[i];
                    const x = i % canvasesPerRow;
                    const y = Math.floor(i / canvasesPerRow);

                    const canvas = document.createElement('canvas');
                    canvas.width = textureImage.width;
                    canvas.height = textureImage.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(textureImage, 0, 0);
                    canvas.style.cssText = `\
                      position: absolute;
                      top: ${y * canvasSize}px;
                      left: ${x * canvasSize}px;
                      width: ${canvasSize}px;
                      height: ${canvasSize}px;
                      z-index: 1;
                    `;
                    document.body.appendChild(canvas);
                  }
    
                  this.spriteAvatarMesh = glb;
                })(),
                this.#ensureControlObject(),
              ]);
              this.#bindControlObject();
            })();
          }
          await this.spriteAvatarMeshPromise;
          break;
        }
        case 2: {
          if (!this.crunchedModelPromise) {
            this.crunchedModelPromise = (async () => {
              await Promise.all([
                (async () => {
                  const {
                    glbData,
                  } = await this.crunchAvatarModel([
                    {
                      arrayBuffer: this.arrayBuffer,
                      srcUrl: this.srcUrl,
                    },
                  ], {
                    signal: this.abortController.signal,
                  });
                  const object = await new Promise((accept, reject) => {
                    const {gltfLoader} = loaders;
                    gltfLoader.parse(glbData, this.srcUrl, accept, reject);
                  });
                  const glb = object.scene;
                  _forAllMeshes(glb, _unfrustumCull);
                  glb.boundingSphere = _getMergedBoundingSphere(glb);
  
                  this.crunchedModel = glb;
                })(),
                this.#ensureControlObject(),
              ]);
              this.#bindControlObject();
            })();
          }
          await this.crunchedModelPromise;
          break;
        }
        case 3: {
          if (!this.optimizedModelPromise) {
            this.optimizedModelPromise = (async () => {
              await Promise.all([
                (async () => {
                  const {
                    glbData,
                  } = await this.optimizeAvatarModel([
                    {
                      arrayBuffer: this.arrayBuffer,
                      srcUrl: this.srcUrl,
                    },
                  ], {
                    signal: this.abortController.signal,
                  });
                  const object = await new Promise((accept, reject) => {
                    const {gltfLoader} = loaders;
                    gltfLoader.parse(glbData, this.srcUrl, accept, reject);
                  });
                  const glb = object.scene;
                  _forAllMeshes(glb, _unfrustumCull);
                  glb.boundingSphere = _getMergedBoundingSphere(glb);

                  this.optimizedModel = glb;
                })(),
                this.#ensureControlObject(),
              ]);
              this.#bindControlObject();
            })();
          }
          await this.optimizedModelPromise;
          break;
        }
        case 4: {
          if (!this.meshPromise) {
            this.meshPromise = (async () => {
              await Promise.all([
                (async () => {
                  const glbData = this.arrayBuffer;
                  const object = await new Promise((accept, reject) => {
                    const {gltfLoader} = loaders;
                    gltfLoader.parse(glbData, this.srcUrl, accept, reject);
                  });
                  const glb = object.scene;

                  await _toonShaderify(object);
                  _prepVrm(object.scene);
                  _forAllMeshes(glb, _unfrustumCull);

                  glb.boundingSphere = _getMergedBoundingSphere(glb);

                  this.mesh = glb;
                })(),
                this.#ensureControlObject(),
              ]);
              this.#bindControlObject();
            })();
          }
          await this.meshPromise;
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
    const currentMesh = this.#getCurrentMesh();
    if (!currentMesh) {
      debugger;
    }
    this.scene.add(currentMesh);

    // this.dispatchEvent(updateEvent);
  }
  adjustQuality(delta) {
    const newQuality = Math.min(Math.max(this.quality + delta, minAvatarQuality), maxAvatarQuality);
    if (newQuality !== this.quality) {
      this.setQuality(newQuality);
    }
  }
  updateFrustumCull(matrix, frustum) {
    const currentMesh = this.#getCurrentMesh();
    if (currentMesh) {
      const boundingSphere = localSphere.copy(currentMesh.boundingSphere)
        .applyMatrix4(matrix);

      const inFrustum = frustum.intersectsSphere(boundingSphere);
      this.scene.visible = inFrustum;
    }
  }
  waitForLoad() {
    return this.loadPromise;
  }
  destroy() {
    this.abortController.abort(abortError);
  }
}