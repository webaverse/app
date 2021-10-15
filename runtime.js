throw new Error('dead code');
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {VOXLoader} from './VOXLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import React from 'react';
import * as ReactThreeFiber from '@react-three/fiber';
// import {KTX2Loader} from './KTX2Loader.js';
// import {CSS3DObject} from './CSS3DRenderer.js';
import {MeshoptDecoder} from './meshopt_decoder.module.js';
// import {BasisTextureLoader} from './BasisTextureLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
import {getExt, mergeMeshes, convertMeshToPhysicsMesh, flipGeomeryUvs} from './util.js';
// import {bake} from './bakeUtils.js';
// import geometryManager from './geometry-manager.js';
// import buildTool from './build-tool.js';
import * as popovers from './popovers.js';
import {rigManager} from './rig.js';
// import {loginManager} from './login.js';
import {makeTextMesh} from './vr-ui.js';
import {getRenderer, scene, camera, sceneHighPriority} from './app-object.js';
// import wbn from './wbn.js';
import {portalMaterial} from './shaders.js';
import fx from './fx.js';
import {GIFLoader} from './GIFLoader.js';
import hpManager from './hp-manager.js';
// import npcManager from './npc-manager.js';
import {ShadertoyRenderer} from './shadertoy.js';
// import GIF from './gif.js';
// import * as GifuctJs from './gifuct-js.js';
import {baseUnit, rarityColors} from './constants.js';
import metaversefileApi from './metaversefile-api.js';
const {useLocalPlayer} = metaversefileApi;

// import R3FDemo from 'ipfs://Qme9Cb4r1crEPwi4x823yZZAZFM4ZXvhSX9wNdXABA2pYF?.jsx';
// console.log('got app', R3FDemo({}));

// import R3FDemo2 from './lol.jsx';
// console.log('got app 2', R3FDemo2({}));

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localBox = new THREE.Box3();
const boxGeometry = new THREE.BoxBufferGeometry(1, 1, 1);

const gcFiles = true;
const runtime = {};

let geometryManager = null;
let physicsManager = null;
let world = null;
runtime.injectDependencies = (newGeometryManager, newPhysicsManager, newWorld) => {
  geometryManager = newGeometryManager;
  physicsManager = newPhysicsManager;
  world = newWorld;
};

const textDecoder = new TextDecoder();
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
// const basisLoader = new BasisTextureLoader();
// const ktx2Loader = new KTX2Loader();
// basisLoader.detectSupport(renderer);
// window.gltfLoader = gltfLoader;
// gltfLoader.setBasisLoader(basisLoader);
// basisLoader.detectSupport(renderer);

const startMonetization = (instanceId, monetizationPointer, ownerAddress) => {
  if (!monetizationPointer) {
    return;
  }

  let monetization = document[`monetization${instanceId}`];
  if (!monetization) {
    document[`monetization${instanceId}`] = new EventTarget();
    monetization = document[`monetization${instanceId}`];
  }

  const ethereumAddress = loginManager.getAddress();
  if (ethereumAddress && ethereumAddress === ownerAddress) {
    monetization.dispatchEvent(new Event('monetizationstart'));
    monetization.state = "started";
  } else if (document.monetization && monetizationPointer) {
    monetization.dispatchEvent(new Event('monetizationstart'));
    monetization.state = "started";
  }
}

const _clone = o => JSON.parse(JSON.stringify(o));
const _makeFilesProxy = srcUrl => new Proxy({}, {
  get(target, p) {
    return new URL(p, srcUrl).href;
  },
});
const _isResolvableUrl = u => !/^https?:/.test(u);
const _dotifyUrl = u => /^(?:[a-z]+:|\.)/.test(u) ? u : ('./' + u);

const componentHandlers = {
  use: {
    trigger(o, componentIndex, rigAux) {
      physicsManager.startUse();

      const component = o.getComponents()[componentIndex];
      if (component.subtype === 'swing' || component.subtype === 'combo') {
        appManager.using = true;
      } else if (component.subtype === 'gun') {
        const effect = new THREE.Object3D();
        effect.position.copy(o.position)
          .add(localVector.set(0, 0, -1).applyQuaternion(o.quaternion));
        effect.quaternion.copy(o.quaternion);
        fx.add('bullet', effect);
      }
    },
    untrigger(o, componentIndex, rigAux) {
      physicsManager.stopUse();
      appManager.using = false;
    },
  },
  wear: {
    load(o, componentIndex, rigAux) {
      const auxPose = rigAux.getPose();
      const wearable = {
        id: rigAux.getNextId(),
        contentId: o.contentId,
        componentIndex,
      };
      auxPose.wearables.push(wearable);
      rigAux.setPose(auxPose);
      return () => {
        const auxPose = rigAux.getPose();
        auxPose.wearables = auxPose.wearables.filter(w => w.id !== wearable.id);
        rigAux.setPose(auxPose);
      };
    },
  },
  sit: {
    load(o, componentIndex, rigAux) {
      const auxPose = rigAux.getPose();
      auxPose.sittables.length = 0;
      const sittable = {
        id: rigAux.getNextId(),
        contentId: o.contentId,
        componentIndex,
      };
      auxPose.sittables.push(sittable);
      rigAux.setPose(auxPose);
      return () => {
        const auxPose = rigAux.getPose();
        auxPose.sittables = auxPose.sittables.filter(w => w.id !== sittable.id);
        rigAux.setPose(auxPose);
      };
    },
  },
  pet: {
    load(o, componentIndex, rigAux) {
      const auxPose = rigAux.getPose();
      auxPose.pets.length = 0;
      const pet = {
        id: rigAux.getNextId(),
        contentId: o.contentId,
        componentIndex,
      };
      auxPose.pets.push(pet);
      rigAux.setPose(auxPose);
      return () => {
        const auxPose = rigAux.getPose();
        auxPose.pets = auxPose.pets.filter(w => w.id !== pet.id);
        rigAux.setPose(auxPose);
      };
    },
  },
  npc: {
    load(o, componentIndex, rigAux) {
      npcManager.addNpc(o, componentIndex);
      return () => {
        /* let npcs = npcManager.getNpcs();
        npcs = auxPose.pets.filter(w => w.id !== npc.id);
        npcManager.setNpcs(npcs); */
      };
    },
  },
  effect: {
    run(o, componentIndex) {
      const component = o.getComponents()[componentIndex];
      const {effects = []} = component;
      const effectInstances = effects.map(effect => {
        const {type, position = [0, 0, 0], quaternion = [0, 0, 0, 1]} = effect;
        const object = new THREE.Object3D();
        object.position.fromArray(position);
        object.quaternion.fromArray(quaternion);
        return fx.add(type, object, o);
      });
      return () => {
        for (const e of effectInstances) {
          fx.remove(e);
        }
      };
    },
  },
};
const triggerComponentTypes = [
  'use',
];
const loadComponentTypes = [
  'wear',
  'sit',
  'pet',
  'npc',
];
const runComponentTypes = [
  'effect',
];

const _loadMetaversefile = async (file, {contentId = null, instanceId = null, autoScale = true, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  
  const res = await fetch(srcUrl);
  const j = await res.json();
  let {start_url, physics, physics_url, components} = j;
  if (typeof j.autoScale === 'boolean') {
    autoScale = j.autoScale;
  }
  
  /* if (/^\./.test(srcUrl)) {
    srcUrl = new URL(srcUrl, location.href).href;
  } */
  
  return await runtime.loadFile({
    url: start_url,
    name: start_url,
  }, {
    // files,
    parentUrl: srcUrl,
    physics,
    physics_url,
    components,
    autoScale,
    contentId,
    instanceId,
    ownerAddress,
    monetizationPointer,
  });
};
const _loadRtfjs = async (file, {contentId = null, instanceId = null, parentUrl = null, autoScale = true, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);

  const u = new URL(srcUrl, parentUrl).href;

  // console.log('got start url', start_url);
  
  const m = await import(u);
  const fn = m.default;
  // console.log('got fn', fn);
  
  const o = new THREE.Object3D();
  o.contentId = contentId;
  o.isRtfjs = true;
  o.getPhysicsIds = () => app.physicsIds;
  o.destroy = () => {
    appManager.destroyApp(appId);
    
    (async () => {
      const roots = ReactThreeFiber._roots;
      const root = roots.get(rootDiv);
      const fiber = root?.fiber
      if (fiber) {
        const state = root?.store.getState()
        if (state) state.internal.active = false
        await new Promise((accept, reject) => {
          ReactThreeFiber.reconciler.updateContainer(null, fiber, null, () => {
            if (state) {
              // setTimeout(() => {
                state.events.disconnect?.()
                // state.gl?.renderLists?.dispose?.()
                // state.gl?.forceContextLoss?.()
                ReactThreeFiber.dispose(state)
                roots.delete(canvas)
                // if (callback) callback(canvas)
              // }, 500)
            }
            accept();
          });
        });
      }
    })();
  };
  
  const renderer = getRenderer();
  const sizeVector = renderer.getSize(new THREE.Vector2());
  const rootDiv = document.createElement('div');
  let rtfScene = null;
  const _render = () => {
    const renderer2 = Object.create(renderer);
    renderer2.render = () => {
      // nothing
      // console.log('elide render');
    };
    renderer2.setSize = () => {
      // nothing
    };
    renderer2.setPixelRatio = () => {
      // nothing
    };
    
    ReactThreeFiber.render(
      React.createElement(ErrorBoundary, {}, [
        React.createElement(fn, {
          app: appContextObject,
          key: 0,
        }),
      ]),
      rootDiv,
      {
        gl: renderer2,
        camera,
        size: {
          width: sizeVector.x,
          height: sizeVector.y,
        },
        events: createPointerEvents,
        onCreated: state => {
          // state = newState;
          // scene.add(state.scene);
          console.log('got state', state);
          const {scene: newRtfScene} = state;
          if (newRtfScene !== rtfScene) {
            if (rtfScene) {
              o.remove(rtfScene);
              rtfScene = null;
            }
            rtfScene = newRtfScene;
            o.add(rtfScene);
          }
        },
        frameloop: 'demand',
      }
    );
  };
  
  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    _render();
  });
  app.rootObject = o;
  const appContextObject = makeAppContextObject(app);
  
  return o;
};

const _loadTjs = async (file, {contentId = null, instanceId = null, parentUrl = null, autoScale = true, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);

  const u = new URL(srcUrl, parentUrl || window.location.href).href;

  // console.log('got start url', u);
  
  const m = await import(u);
  const fn = m.default;
  // console.log('got fn', fn);
  
  const o = new THREE.Object3D();
  o.contentId = contentId;
  o.isTjs = true;
  o.getPhysicsIds = () => app.physicsIds;
  o.destroy = () => {
    if (userObject.destroy) {
      userObject.destroy();
    }
    appManager.destroyApp(appId);
  };
  
  let userObject = null;
  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    if (userObject?.update) {
      userObject.update();
    }
  });
  app.rootObject = o;
  const appContextObject = makeAppContextObject(app);
  userObject = await fn(appContextObject);
  if (userObject) {
    o.add(userObject);
  }
  
  return o;
};

const _loadGltf = async (file, {optimize = false, physics = false, physics_url = false, components = [], dynamic = false, autoScale = true, files = null, parentUrl = null, contentId = null, instanceId = null, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, parentUrl || location.href).href;
  }

  let o;
  try {
    o = await new Promise((accept, reject) => {
      gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
    });
    startMonetization(instanceId, monetizationPointer, ownerAddress);
  } catch(err) {
    console.warn(err);
  } finally {
    if (/^blob:/.test(srcUrl)) {
      gcFiles && URL.revokeObjectURL(srcUrl);
    }
  }
  const {parser, animations} = o;
  o = o.scene;
  const animationMixers = [];
  const uvScrolls = [];
  const _loadHubsComponents = () => {
    const _loadAnimations = () => {
      o.traverse(o => {
        if (o.isMesh) {
          const idleAnimation = animations.find(a => a.name === 'idle');
          let clip = idleAnimation || animations[animationMixers.length];
          if (clip) {
            const mesh = o;
            const mixer = new THREE.AnimationMixer(mesh);
            
            const action = mixer.clipAction(clip);
            action.play();

            let lastTimestamp = Date.now();
            const update = now => {
              const timeDiff = now - lastTimestamp;
              const deltaSeconds = timeDiff / 1000;
              mixer.update(deltaSeconds);
              lastTimestamp = now;
            };

            animationMixers.push({
              update,
            });
          }
        }
      });
    };
    if (!components.some(c => ['sit', 'pet', 'npc'].includes(c.type))) {
      _loadAnimations();
    }

    const _loadLightmaps = () => {
      const _loadLightmap = async (parser, materialIndex) => {
        const lightmapDef = parser.json.materials[materialIndex].extensions.MOZ_lightmap;
        const [material, lightMap] = await Promise.all([
          parser.getDependency("material", materialIndex),
          parser.getDependency("texture", lightmapDef.index)
        ]);
        material.lightMap = lightMap;
        material.lightMapIntensity = lightmapDef.intensity !== undefined ? lightmapDef.intensity : 1;
        material.needsUpdate = true;
        return lightMap;
      };
      if (parser.json.materials) {
        for (let i = 0; i < parser.json.materials.length; i++) {
          const materialNode = parser.json.materials[i];

          if (!materialNode.extensions) continue;

          if (materialNode.extensions.MOZ_lightmap) {
            _loadLightmap(parser, i);
          }
        }
      }
    };
    _loadLightmaps();
    
    const _loadUvScroll = o => {
      const textureToData = new Map();
      const registeredTextures = [];
      o.traverse(o => {
        if (o.isMesh && o?.userData?.gltfExtensions?.MOZ_hubs_components?.['uv-scroll']) {
          const uvScrollSpec = o.userData.gltfExtensions.MOZ_hubs_components['uv-scroll'];
          const {increment, speed} = uvScrollSpec;
          
          const mesh = o; // this.el.getObject3D("mesh") || this.el.getObject3D("skinnedmesh");
          const {material} = mesh;
          if (material) {
            const spec = {
              data: {
                increment,
                speed,
              },
            };

            // We store mesh here instead of the material directly because we end up swapping out the material in injectCustomShaderChunks.
            // We need material in the first place because of MobileStandardMaterial
            const instance = { component: spec, mesh };

            spec.instance = instance;
            spec.map = material.map || material.emissiveMap;

            if (spec.map && !textureToData.has(spec.map)) {
              textureToData.set(spec.map, {
                offset: new THREE.Vector2(),
                instances: [instance]
              });
              registeredTextures.push(spec.map);
            } else if (!spec.map) {
              console.warn("Ignoring uv-scroll added to mesh with no scrollable texture.");
            } else {
              console.warn(
                "Multiple uv-scroll instances added to objects sharing a texture, only the speed/increment from the first one will have any effect"
              );
              textureToData.get(spec.map).instances.push(instance);
            }
          }
          let lastTimestamp = Date.now();
          const update = now => {
            const dt = now - lastTimestamp;
            for (let i = 0; i < registeredTextures.length; i++) {
              const map = registeredTextures[i];
              const { offset, instances } = textureToData.get(map);
              const { component } = instances[0];

              offset.addScaledVector(component.data.speed, dt / 1000);

              offset.x = offset.x % 1.0;
              offset.y = offset.y % 1.0;

              const increment = component.data.increment;
              map.offset.x = increment.x ? offset.x - (offset.x % increment.x) : offset.x;
              map.offset.y = increment.y ? offset.y - (offset.y % increment.y) : offset.y;
            }
            lastTimestamp = now;
          };
          uvScrolls.push({
            update,
          });
        }
      });
    };
    _loadUvScroll(o);
  };
  _loadHubsComponents();

  const gltfObject = (() => {
    if (optimize) {
      const specs = [];
      o.traverse(o => {
        if (o.isMesh) {
          const mesh = o;
          const {geometry} = o;
          let texture;
          if (o.material.map) {
            texture = o.material.map;
          } else if (o.material.emissiveMap) {
            texture = o.material.emissiveMap;
          } else {
            texture = null;
          }
          specs.push({
            mesh,
            geometry,
            texture,
          });
        }
      });
      specs.sort((a, b) => +a.mesh.material.transparent - +b.mesh.material.transparent);
      const meshes = specs.map(spec => spec.mesh);
      const geometries = specs.map(spec => spec.geometry);
      const textures = specs.map(spec => spec.texture);

      const mesh = mergeMeshes(meshes, geometries, textures);
      mesh.userData.gltfExtensions = {
        EXT_aabb: mesh.geometry.boundingBox.min.toArray()
          .concat(mesh.geometry.boundingBox.max.toArray()),
        // EXT_hash: hash,
      };
      return mesh;
    } else {
      return o;
    }
  })();

  const mesh = new THREE.Object3D();
  const jitterObject = hpManager.makeHitTracker();
  mesh.add(jitterObject);
  jitterObject.add(gltfObject);
  jitterObject.addEventListener('hit', e => {
    mesh.dispatchEvent(e);
  });
  jitterObject.addEventListener('die', e => {
    mesh.dispatchEvent(e);
  });

  /* if (dynamic && autoScale) {
    localBox.setFromObject(o);
    const size = localBox.getSize(localVector);
    const maxSizeDim = Math.max(size.x, size.y, size.z);
    if (maxSizeDim > 4) {
      o.scale.multiplyScalar(4/maxSizeDim);
    }
  } */

  let physicsIds = [];
  let staticPhysicsIds = [];
  mesh.contentId = contentId;
  mesh.run = async () => {
    let physicsMesh = null;
    let physicsBuffer = null;
    if (physics_url) {
      if (files && _isResolvableUrl(physics_url)) {
        physics_url = files[_dotifyUrl(physics_url)];
      }
      const res = await fetch(physics_url);
      const arrayBuffer = await res.arrayBuffer();
      physicsBuffer = new Uint8Array(arrayBuffer);
    } else {
      mesh.updateMatrixWorld();
      physicsMesh = convertMeshToPhysicsMesh(gltfObject);
      physicsMesh.position.copy(mesh.position);
      physicsMesh.quaternion.copy(mesh.quaternion);
      physicsMesh.scale.copy(mesh.scale);
    }
    
    if (physicsMesh) {
      const physicsId = physicsManager.addGeometry(physicsMesh);
      physicsIds.push(physicsId);
      staticPhysicsIds.push(physicsId);
    }
    if (physicsBuffer) {
      const physicsId = physicsManager.addCookedGeometry(physicsBuffer, mesh.position, mesh.quaternion, mesh.scale);
      physicsIds.push(physicsId);
      staticPhysicsIds.push(physicsId);
    }
    for (const componentType of runComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        const unloadFn = componentHandler.run(mesh, componentIndex);
        componentUnloadFns.push(unloadFn);
      }
    }
  };
  mesh.triggerAux = rigAux => {
    let used = false;
    for (const componentType of triggerComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        componentHandler.trigger(mesh, componentIndex, rigAux);
        used = true;
      }
    }
    return used;
  };
  mesh.untriggerAux = rigAux => {
    let used = false;
    for (const componentType of triggerComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        componentHandler.untrigger(mesh, componentIndex, rigAux);
        used = true;
      }
    }
    return used;
  };
  const componentUnloadFns = [];
  mesh.useAux = rigAux => {
    let used = false;
    for (const componentType of loadComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        const unloadFn = componentHandler.load(mesh, componentIndex, rigAux);
        componentUnloadFns.push(unloadFn);
        used = true;
      }
    }
    return used;
  };
  mesh.destroy = () => {
    appManager.destroyApp(appId);
    
    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
    
    for (const fn of componentUnloadFns) {
      fn();
    }
    componentUnloadFns.length = 0;
  };
  mesh.getPhysicsIds = () => physicsIds;
  mesh.getStaticPhysicsIds = () => staticPhysicsIds;
  mesh.getAnimations = () => animations;
  mesh.getComponents = () => components;
  mesh.hit = jitterObject.hit;

  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    const now = Date.now();
    const _updateAnimations = () => {
      for (const mixer of animationMixers) {
        mixer.update(now);
      }
    };
    _updateAnimations();
    const _updateUvScroll = () => {
      for (const uvScroll of uvScrolls) {
        uvScroll.update(now);
      }
    };
    _updateUvScroll();

    jitterObject.update(e.data.timeDiff);
  });
  
  return mesh;
};
const _loadVrm = async (file, {files = null, parentUrl = null, components = [], contentId = null, instanceId = null, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, parentUrl || location.href).href;
  }

  let vrmObject;
  try {
    vrmObject = await new Promise((accept, reject) => {
      gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
    });
    startMonetization(instanceId, monetizationPointer, ownerAddress);
  } catch(err) {
    console.warn(err);
  } finally {
    if (/^blob:/.test(srcUrl)) {
      gcFiles && URL.revokeObjectURL(srcUrl);
    }
  }

  const o = new THREE.Object3D();
  o.raw = vrmObject;
  const jitterObject = hpManager.makeHitTracker();
  o.add(jitterObject);
  jitterObject.add(vrmObject.scene);
  jitterObject.addEventListener('hit', e => {
    mesh.dispatchEvent(e);
  });
  jitterObject.addEventListener('die', e => {
    o.dispatchEvent(e);
  });

  o.isVrm = true;
  o.contentId = contentId;
  o.traverse(o => {
    if (o.isMesh) {
      o.frustumCulled = false;
    }
  });

  let physicsIds = [];
  let staticPhysicsIds = [];
  o.run = async () => {
    const physicsId = physicsManager.addBoxGeometry(
      o.position.clone()
        .add(
          new THREE.Vector3(0, 1.5/2, 0)
            .applyQuaternion(o.quaternion)
        ),
        o.quaternion,
        new THREE.Vector3(0.3, 1.5/2, 0.3),
        false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
    
    // elide expensive bone updates; this should not be called if wearing the avatar
    const skinnedMeshes = [];
    o.traverse(o => {
      if (o.isSkinnedMesh) {
        skinnedMeshes.push(o);
      }
    });
    for (const skinnedMesh of skinnedMeshes) {
      const {geometry, material, position, quaternion, scale, matrix, matrixWorld, visible, parent} = skinnedMesh;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.quaternion.copy(quaternion);
      mesh.scale.copy(scale);
      mesh.matrix.copy(matrix);
      mesh.matrixWorld.copy(matrixWorld);
      mesh.visible = visible;
      mesh.parent = parent;
      const index = parent ? parent.children.indexOf(skinnedMesh) : -1;
      if (index !== -1) {
        parent.children.splice(index, 1, mesh);
      }
    }
  };
  o.destroy = () => {
    appManager.destroyApp(appId);
    
    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
  };
  o.getPhysicsIds = () => physicsIds;
  o.getStaticPhysicsIds = () => staticPhysicsIds;
  o.getComponents = () => components;
  o.hit = jitterObject.hit;
  o.geometry = {
    boundingBox: new THREE.Box3().setFromObject(o),
  };
  
  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    jitterObject.update(e.data.timeDiff);
  });
  
  return o;
};
const _loadVox = async (file, {files = null, contentId = null, parentUrl = null, instanceId = null, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, parentUrl || location.href).href;
  }

  let o;
  try {
    o = await new Promise((accept, reject) => {
      new VOXLoader({
        scale: 0.01,
      }).load(srcUrl, accept, function onprogress() {}, reject);
    });
    startMonetization(instanceId, monetizationPointer, ownerAddress);
  } catch(err) {
    console.warn(err);
  }
  o.contentId = contentId;
  o.hit = () => {
    console.log('hit', o); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  return o;
};
const _loadImg = async (file, {files = null, contentId = null, instanceId = null, monetizationPointer = null, ownerAddress = null} = {}) => {
  const img = new Image();
  await new Promise((accept, reject) => {
    let u = file.url || URL.createObjectURL(file);
    if (files && _isResolvableUrl(u)) {
      u = files[_dotifyUrl(u)];
    }
    img.onload = () => {
      accept();
      startMonetization(instanceId, monetizationPointer, ownerAddress);
      _cleanup();
    };
    img.onerror = err => {
      reject(err);
      _cleanup();
    }
    const _cleanup = () => {
      gcFiles && URL.revokeObjectURL(u);
    };
    img.crossOrigin = '';
    img.src = u;
  });
  let {width, height} = img;
  if (width >= height) {
    height /= width;
    width = 1;
  }
  if (height >= width) {
    width /= height;
    height = 1;
  }
  const geometry = new THREE.PlaneBufferGeometry(width, height);
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-width/2, -height/2, -0.1),
    new THREE.Vector3(width/2, height/2, 0.1),
  );
  const colors = new Float32Array(geometry.attributes.position.array.length);
  colors.fill(1, 0, colors.length);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const texture = new THREE.Texture(img);
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.5,
  });
  /* const material = meshComposer.material.clone();
  material.uniforms.map.value = texture;
  material.uniforms.map.needsUpdate = true; */

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.contentId = contentId;
  let physicsIds = [];
  let staticPhysicsIds = [];
  mesh.run = async () => {
    const physicsId = physicsManager.addBoxGeometry(
      mesh.position,        
      mesh.quaternion,
      new THREE.Vector3(width/2, height/2, 0.01),
      false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
  };
  mesh.destroy = () => {
    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
  };
  mesh.getPhysicsIds = () => physicsIds;
  mesh.getStaticPhysicsIds = () => staticPhysicsIds;
  mesh.hit = () => {
    console.log('hit', mesh); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  return mesh;
};
let gifLoader = null;
const _loadGif = async (file, {files = null, contentId = null, instanceId = null, monetizationPointer = null, ownerAddress = null} = {}) => {
  if (!gifLoader) {
    gifLoader = new GIFLoader();
  }
  
  let u = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(u)) {
    u = files[_dotifyUrl(u)];
  }

  const geometry = new THREE.PlaneBufferGeometry(1, 1);
  /* geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(-worldWidth/2, -worldHeight/2, -0.1),
    new THREE.Vector3(worldWidth/2, worldHeight/2, 0.1),
  ); */
  flipGeomeryUvs(geometry);
  const colors = new Float32Array(geometry.attributes.position.array.length);
  colors.fill(1, 0, colors.length);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.MeshBasicMaterial({
    map: new THREE.Texture(),
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
    alphaTest: 0.5,
  });
  const model = new THREE.Mesh(geometry, material);
  model.frustumCulled = false;
  
  const mesh = new THREE.Object3D();
  mesh.add(model);
  mesh.contentId = contentId;
  let textures;
  let physicsIds = [];
  let staticPhysicsIds = [];
  mesh.run = async () => {
    const gifId = await gifLoader.createGif(u);
    const frames = await gifLoader.renderFrames(gifId);
    gifLoader.destroyGif(gifId);
    textures = frames.map(frame => {
      const t = new THREE.Texture(frame);
      t.anisotropy = 16;
      t.needsUpdate = true;
      return t;
    });
    
    // set scale
    const frame = frames[0];
    const {width, height} = frame;
    let worldWidth = width;
    let worldHeight = height;
    if (worldWidth >= worldHeight) {
      worldHeight /= worldWidth;
      worldWidth = 1;
    }
    if (worldHeight >= worldWidth) {
      worldWidth /= worldHeight;
      worldHeight = 1;
    }
    model.scale.set(worldWidth, worldHeight, 1);
    
    // add physics mesh
    const physicsId = physicsManager.addBoxGeometry(
      mesh.position,
      mesh.quaternion,
      new THREE.Vector3(worldWidth/2, worldHeight/2, 0.01),
      false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
  };
  mesh.destroy = () => {
    appManager.destroyApp(appId);

    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
  };
  mesh.getPhysicsIds = () => physicsIds;
  mesh.getStaticPhysicsIds = () => staticPhysicsIds;
  mesh.update = () => {
    if (textures) {
      const now = Date.now();
      const f = (now % 2000) / 2000;
      const frameIndex = Math.floor(f * textures.length);
      material.map = textures[frameIndex];
    }
  };
  mesh.hit = () => {
    console.log('hit', mesh); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  
  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', () => {
    mesh.update();
  });
  
  return mesh;
};
/* const _makeAppUrl = appId => {
  const s = `\
    import {getRenderer, scene, camera, appManager} from ${JSON.stringify(importMap.app)};
    import * as THREE from ${JSON.stringify(importMap.three)};
    import runtime from ${JSON.stringify(importMap.runtime)};
    import {world} from ${JSON.stringify(importMap.world)};
    import * as universe from ${JSON.stringify(importMap.universe)};
    import _physics from ${JSON.stringify(importMap.physicsManager)};
    import {rigManager as rig} from ${JSON.stringify(importMap.rig)};
    import * as ui from ${JSON.stringify(importMap.vrUi)};
    import * as notifications from ${JSON.stringify(importMap.notifications)};
    import * as _popovers from ${JSON.stringify(importMap.popovers)};
    import * as crypto from ${JSON.stringify(importMap.crypto)};
    import procgen from ${JSON.stringify(importMap.procgen)};
    import drop from ${JSON.stringify(importMap.drop)};
    import npc from ${JSON.stringify(importMap.npc)};
    import * as constants from ${JSON.stringify(importMap.constants)};

    const _renderer = getRenderer();
    const renderer = Object.create(_renderer);
    renderer.setAnimationLoop = null;

    const physics = {};
    for (const k in _physics) {
      physics[k] = _physics[k];
    }
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localQuaternion = new THREE.Quaternion();
    const localMatrix = new THREE.Matrix4();
    const localMatrix2 = new THREE.Matrix4();
    physics.addBoxGeometry = (addBoxGeometry => function(position, quaternion, size, dynamic) {
      app.rootObject.updateMatrixWorld();
      localMatrix
        .compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(app.rootObject.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
      position = localVector;
      quaternion = localQuaternion;
      const physicsId = addBoxGeometry.call(this, position, quaternion, size, dynamic);
      app.physicsIds.push(physicsId);
      return physicsId;
    })(physics.addBoxGeometry);
    physics.addGeometry = (addGeometry => function(mesh) {
      const physicsId = addGeometry.apply(this, arguments);
      app.physicsIds.push(physicsId);
      return physicsId;
    })(physics.addGeometry);
    physics.addCookedGeometry = (addCookedGeometry => function(buffer, position, quaternion, scale) {
      const physicsId = addCookedGeometry.apply(this, arguments);
      app.physicsIds.push(physicsId);
      return physicsId;
    })(physics.addCookedGeometry);
    physics.addConvexGeometry = (addConvexGeometry => function(mesh) {
      const physicsId = addConvexGeometry.apply(this, arguments);
      app.physicsIds.push(physicsId);
      return physicsId;
    })(physics.addConvexGeometry);
    physics.addCookedConvexGeometry = (addCookedConvexGeometry => function(buffer, position, quaternion, scale) {
      const physicsId = addCookedConvexGeometry.apply(this, arguments);
      app.physicsIds.push(physicsId);
      return physicsId;
    })(physics.addCookedConvexGeometry);
    physics.getPhysicsTransform = (getPhysicsTransform => function(physicsId) {
      const transform = getPhysicsTransform.apply(this, arguments);
      const {position, quaternion} = transform;
      app.rootObject.updateMatrixWorld();
      localMatrix
        .compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(localMatrix2.copy(app.rootObject.matrixWorld).invert())
        .decompose(position, quaternion, localVector2);
      return transform;
    })(physics.getPhysicsTransform);
    physics.setPhysicsTransform = (setPhysicsTransform => function(physicsId, position, quaternion, scale) {
      app.rootObject.updateMatrixWorld();
      localMatrix
        .compose(position, quaternion, scale)
        .premultiply(app.rootObject.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
      position = localVector;
      quaternion = localQuaternion;
      return setPhysicsTransform.call(this, physicsId, position, quaternion);
    })(physics.setPhysicsTransform);
    physics.removeGeometry = (removeGeometry => function(physicsId) {
      removeGeometry.apply(this, arguments);
      const index = app.physicsIds.indexOf(physicsId);
      if (index !== -1) {
        app.physicsIds.splice(index);
      }
    })(physics.removeGeometry);

    const popovers = {};
    for (const k in _popovers) {
      popovers[k] = _popovers[k];
    }
    popovers.addPopover = (addPopover => function() {
      const popover = addPopover.apply(this, arguments);
      app.popovers.push(popover);
    })(popovers.addPopover);
    popovers.removePopover = (removePopover => function() {
      removePopover.apply(this, arguments);
      const index = app.popovers.indexOf(physicsId);
      if (index !== -1) {
        app.popovers.splice(index);
      }
    })(popovers.removePopover);

    const app = appManager.getApp(${appId});
    app.specification = procgen(app.contentId)[0];
    let recursion = 0;
    app.onBeforeRender = () => {
      recursion++;
      if (recursion === 1) {
        // scene.directionalLight.castShadow = false;
        if (rig.localRig) {
          rig.localRig.model.visible = true;
        }
      }
    };
    app.onAfterRender = () => {
      recursion--;
      if (recursion === 0) {
        // scene.directionalLight.castShadow = true;
        if (rig.localRig) {
          rig.localRig.model.visible = false;
        }
      }
    };
    export {renderer, scene, camera, runtime, world, universe, physics, ui, notifications, popovers, crypto, drop, npc, constants, rig, app, appManager};
  `;
  const b = new Blob([s], {
    type: 'application/javascript',
  });
  return URL.createObjectURL(b);
}; */
const _loadScript = async (file, {files = null, parentUrl = null, contentId = null, instanceId = null, components = [], monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, parentUrl || location.href).href;
  }
  if (!_isResolvableUrl(srcUrl)) { // if the script is hard-rooted, create a new files context
    files = null;
  }

  const appId = appManager.getNextAppId();
  const mesh = new THREE.Object3D();
  mesh.run = () => {
    throw new Error('not implemented');
    /* return import(u)
      .then(async () => {
        let userPromise = null;
        const e = new MessageEvent('load');
        e.waitUntil = p => {
          userPromise = p;
        };
        app.dispatchEvent(e);
        await userPromise;
      })
      .then(() => {
        startMonetization(instanceId, monetizationPointer, ownerAddress);
      })
      .catch(err => {
        console.error('load script failed: ' + JSON.stringify({srcUrl, contentId, u, error: err.stack}));
        debugger;
      })
      .finally(() => {
        for (const u of cachedUrls) {
          gcFiles && URL.revokeObjectURL(u);
        }
      }); */
  };
  mesh.triggerAux = rigAux => {
    let used = false;
    for (const componentType of triggerComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        componentHandler.trigger(mesh, componentIndex, rigAux);
        used = true;
      }
    }
    return used;
  };
  mesh.untriggerAux = rigAux => {
    let used = false;
    for (const componentType of triggerComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        componentHandler.untrigger(mesh, componentIndex, rigAux);
        used = true;
      }
    }
    return used;
  };
  mesh.destroy = () => {
    appManager.destroyApp(appId);

    const localPhysicsIds = app.physicsIds.slice();
    for (const physicsId of localPhysicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    app.physicsIds.length = 0;
    
    const localPopovers = app.popovers.slice();
    for (const popover of localPopovers) {
      popovers.removePopover(popover);
    }
    app.popovers.length = 0;
  };
  mesh.getPhysicsIds = () => app.physicsIds;
  mesh.getComponents = () => components;
  mesh.getApp = () => app;
  
  const jitterObject = hpManager.makeHitTracker();
  mesh.add(jitterObject);
  const appObject = new THREE.Object3D();
  jitterObject.add(appObject);
  jitterObject.addEventListener('hit', e => {
    mesh.dispatchEvent(e);
  });
  jitterObject.addEventListener('die', e => {
    mesh.dispatchEvent(e);
  });
  
  mesh.hit = jitterObject.hit;

  const app = appManager.createApp(appId);
  app.rootObject = mesh;
  app.jitterObject = jitterObject;
  app.object = appObject;
  app.contentId = contentId;
  // const localImportMap = _clone(importMap);
  // localImportMap.app = _makeAppUrl(appId);
  app.files = files || _makeFilesProxy(srcUrl);

  /* (async () => {
    
  })(); */

  app.addEventListener('frame', e => {
    jitterObject.update(e.data.timeDiff);
  });

  return mesh;
};
const _loadManifestJson = async (file, {files = null, contentId = null, instanceId = null, autoScale = true, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }

  if (!files && /^https?:/.test(srcUrl)) {
    files = _makeFilesProxy(srcUrl);
  }

  const res = await fetch(srcUrl);
  const j = await res.json();
  let {start_url, physics, physics_url, components} = j;
  if (typeof j.autoScale === 'boolean') {
    autoScale = j.autoScale;
  }

  /* if (physics_url) {
    if (files && _isResolvableUrl(physics_url)) {
      physics_url = files[_dotifyUrl(physics_url)];
    }
  } */

  if (/^\./.test(srcUrl)) {
    srcUrl = new URL(srcUrl, location.href).href;
  }

  const u = _dotifyUrl(start_url);
  return await runtime.loadFile({
    url: u,
    name: u,
  }, {
    files,
    parentUrl: srcUrl,
    physics,
    physics_url,
    components,
    autoScale,
    contentId,
    instanceId,
    ownerAddress,
    monetizationPointer,
  });
};

const _loadWebBundle = async (file, {contentId = null, instanceId = null, autoScale = true, monetizationPointer = null, ownerAddress = null} = {}) => {
  let arrayBuffer;

  if (file.url) {
    const res = await fetch(file.url);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = await new Promise((accept, reject) => {
      const fr = new FileReader();
      fr.onload = function() {
        accept(this.result);
      };
      fr.onerror = reject;
      fr.readAsArrayBuffer(file);
    });
  }

  const files = {};
  const bundle = new wbn.Bundle(arrayBuffer);
  const {urls} = bundle;

  for (const u of urls) {
    const response = bundle.getResponse(u);
    const {headers} = response;
    const contentType = headers['content-type'] || 'application/octet-stream';
    const b = new Blob([response.body], {
      type: contentType,
    });
    const blobUrl = URL.createObjectURL(b);
    const {pathname} = new URL(u);
    files['.' + pathname] = blobUrl;
  }
  const u = './manifest.json';
  return await runtime.loadFile({
    url: u,
    name: u,
  }, {
    files,
    contentId,
    instanceId,
    autoScale,
    ownerAddress,
    monetizationPointer,
  });
};
const _loadScene = async (file, {contentId = null, files = null}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }
  if (/^\.+\//.test(srcUrl)) {
    srcUrl = new URL(srcUrl, location.href).href;
  }
  
  const res = await fetch(srcUrl);
  const j = await res.json();
  const {objects} = j;
  
  const scene = new THREE.Object3D();
  scene.contentId = contentId;

  const promises = objects.map(async object => {
    let {name, position = [0, 0, 0], quaternion = [0, 0, 0, 1], scale = [1, 1, 1], start_url, filename, content, physics_url = null, optimize = false, physics = false} = object;
    const parentId = null;
    position = new THREE.Vector3().fromArray(position);
    quaternion = new THREE.Quaternion().fromArray(quaternion);
    scale = new THREE.Vector3().fromArray(scale);
    if (start_url) {
      // start_url = new URL(start_url, location.href).href;
      // start_url = _dotifyUrl(start_url);
      filename = start_url;
    } else if (filename && content) {
      const blob = new Blob([content], {
        type: 'application/octet-stream',
      });
      start_url = URL.createObjectURL(blob);
    } else {
      console.warn('cannot load contentless object', object);
      return;
    }

    const mesh = await runtime.loadFile({
      url: start_url,
      name: filename,
    }, {
      optimize,
      physics,
      physics_url,
      files,
      contentId: start_url,
    });
    mesh.position.copy(position);
    mesh.quaternion.copy(quaternion);
    mesh.scale.copy(scale);
    scene.add(mesh);
  });
  await Promise.all(promises);
  scene.run = async () => {
    await Promise.all(scene.children.map(async child => {
      child.run && await child.run();
    }));
  };
  scene.destroy = () => {
    for (const child of scene.children) {
      child.destroy && child.destroy();
    }
  };
  scene.hit = () => {
    console.log('hit', scene); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  return scene;
};
const _loadPortal = async (file, {contentId = null}) => {
  let json;
  if (file.url) {
    const res = await fetch(file.url);
    json = await res.json();
  } else {
    json = await file.json();
  }

  /* const geometry = new THREE.CircleBufferGeometry(1, 32)
    .applyMatrix4(new THREE.Matrix4().makeScale(0.5, 1, 1))
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 1, 0));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      iTime: {value: 0, needsUpdate: true},
    },
    vertexShader: `\
      varying vec2 uvs;
      void main() {
        uvs = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `\
      #define PI 3.1415926535897932384626433832795

      uniform float iTime;
      varying vec2 uvs;

      const vec3 c = vec3(${new THREE.Color(0x1565c0).toArray().join(', ')});

      void main() {
        vec2 uv = uvs;

        const vec3 c = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});

        vec2 distanceVector = abs(uv - 0.5)*2.;
        float a = pow(length(distanceVector), 5.);
        vec2 normalizedDistanceVector = normalize(distanceVector);
        float angle = atan(normalizedDistanceVector.y, normalizedDistanceVector.x) + iTime*PI*2.;
        float skirt = pow(sin(angle*50.) * cos(angle*20.), 5.) * 0.2;
        a += skirt;
        gl_FragColor = vec4(c, a);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const portalMesh = new THREE.Mesh(geometry, material);
  portalMesh.update = () => {
    const portalRate = 30000;
    portalMesh.material.uniforms.iTime.value = (Date.now()/portalRate) % 1;
    portalMesh.material.uniforms.iTime.needsUpdate = true;
  };
  portalMesh.destroy = () => {
    appManager.destroyApp(appId);
  };
  // portalMesh.position.y = 1;
  // scene.add(portalMesh);

  const textMesh = makeTextMesh(href.slice(0, 80), undefined, 0.2, 'center', 'middle');
  textMesh.position.y = 2.2;
  textMesh.color = 0xCCCCCC;
  portalMesh.add(textMesh);

  let inRangeStart = null;

  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  appManager.setAnimationLoop(appId, () => {
    portalMesh.update();

    const distance = rigManager.localRig.inputs.hmd.position.distanceTo(
      localVector.copy(portalMesh.position)
        .add(localVector2.set(0, 1, 0).applyQuaternion(portalMesh.quaternion))
    );
    if (distance < 1) {
      const now = Date.now();
      if (inRangeStart !== null) {
        const timeDiff = now - inRangeStart;
        if (timeDiff >= 2000) {
          renderer.setAnimationLoop(null);
          window.location.href = href;
        }
      } else {
        inRangeStart = now;
      }
    } else {
      inRangeStart = null;
    }
  }); */

  const extents = Array.isArray(json.extents) ? json.extents : [
    [
      -2,
      0,
      -2
    ],
    [
      2,
      4,
      2
    ]
  ];
  const center = new THREE.Vector3((extents[1][0] + extents[0][0]) / 2, (extents[1][1] + extents[0][1]) / 2, (extents[1][2] + extents[0][2]) / 2);
  const size = new THREE.Vector3(extents[1][0] - extents[0][0], extents[1][1] - extents[0][1], extents[1][2] - extents[0][2]);
  const color = (rarityColors[json.rarity] || rarityColors.legendary)[0];

  const geometries = [];

  const w = baseUnit;
  const planeGeometry = new THREE.PlaneBufferGeometry(size.x, size.z, size.x, size.z)
    .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)))
    .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z));
  for (let i = 0; i < planeGeometry.attributes.position.array.length; i += 3) {
    planeGeometry.attributes.position.array[i+1] = Math.random() * 0.2;
  }
  planeGeometry.setAttribute('particle', new THREE.BufferAttribute(new Float32Array(planeGeometry.attributes.position.array.length/3), 1));
  planeGeometry.setAttribute('bar', new THREE.BufferAttribute(new Float32Array(planeGeometry.attributes.position.array.length/3), 1));
  geometries.push(planeGeometry);

  /* const numBars = 8;
  // xz
  for (let dx = 1; dx < size.x/w*numBars; dx++) {
    for (let dz = 1; dz < size.z/w*numBars; dz++) {
      const g = boxGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeScale(0.01, w, 0.01))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x - w/2 + dx/numBars * w, center.y + w/2, center.z - w/2 + dz/numBars * w));
      g.setAttribute('particle', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length/3), 1));
      g.setAttribute('bar', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length/3).fill(1), 1));
      geometries.push(g);
    }
  }
  // xy
  for (let dx = 1; dx < size.x/w*numBars; dx++) {
    for (let dy = 1; dy < size.y/w*numBars; dy++) {
      const g = boxGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeScale(0.01, 0.01, w))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x - w/2 + dx/numBars * w, center.y + dy/numBars * w, center.z));
      g.setAttribute('particle', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length/3), 1));
      g.setAttribute('bar', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length/3).fill(1), 1));
      geometries.push(g);
    }
  }
  // yz
  for (let dy = 1; dy < size.x/w*numBars; dy++) {
    for (let dz = 1; dz < size.z/w*numBars; dz++) {
      const g = boxGeometry.clone()
        .applyMatrix4(new THREE.Matrix4().makeScale(w, 0.01, 0.01))
        .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x, center.y + dy/numBars * w, center.z - w/2 + dz/numBars * w));
      g.setAttribute('particle', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length/3), 1));
      g.setAttribute('bar', new THREE.BufferAttribute(new Float32Array(boxGeometry.attributes.position.array.length/3).fill(1), 1));
      geometries.push(g);
    }
  } */

  for (let i = 0; i < 20; i++) {
    const width = 0.02;
    const height = 0.2;
    const g = boxGeometry.clone()
      .applyMatrix4(new THREE.Matrix4().makeScale(width, height, width))
      .applyMatrix4(new THREE.Matrix4().makeTranslation(center.x + width/2 + (-1/2 + Math.random()) * w * (1-width/2), 0.3/2 + Math.random() * (1-width/2), center.z + height/2 + (-1/2 + Math.random()) * w * (1-width/2)));
    g.setAttribute('particle', new THREE.BufferAttribute(new Float32Array(g.attributes.position.array.length/3).fill(1), 1));
    g.setAttribute('bar', new THREE.BufferAttribute(new Float32Array(g.attributes.position.array.length/3), 1));
    geometries.push(g);
  }

  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  const material = portalMaterial.clone();
  if (color) {
    material.uniforms.uColor.value.setHex(color);
  }
  const portalMesh = new THREE.Mesh(geometry, material);
  portalMesh.boundingBox = new THREE.Box3(
    new THREE.Vector3(extents[0][0], extents[0][1], extents[0][2]),
    new THREE.Vector3(extents[1][0], extents[1][1], extents[1][2]),
  );
  portalMesh.frustumCulled = false;
  
  const o = new THREE.Object3D();
  o.add(portalMesh);
  o.contentId = contentId;
  o.json = json;
  o.isPortal = true;
  o.update = () => {
    const {position} = useLocalPlayer();

    const now = Date.now();
    portalMesh.material.uniforms.uTime.value = (now%500)/500;
    portalMesh.material.uniforms.uDistance.value = localBox.copy(portalMesh.boundingBox)
      .applyMatrix4(portalMesh.matrixWorld)
      .distanceToPoint(position);
    portalMesh.material.uniforms.uUserPosition.value.copy(position);
  };
  o.destroy = () => {
    appManager.destroyApp(appId);
  };
  o.hit = () => {
    console.log('hit', o); // XXX
    return {
      hit: false,
      died: false,
    };
  };

  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', () => {
    o.update();
  });

  return o;
};
class IFrameMesh extends THREE.Mesh {
  constructor({
    iframe,
    width,
    height,
  }) {
    const geometry = new THREE.PlaneBufferGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
      // colorWrite: false,
      // depthWrite: true,
      opacity: 0,
      transparent: true,
    });
    super(geometry, material);

    this.iframe = iframe;
  }
  
  /* onBeforeRender(renderer, scene, camera, geometry, material, group) {
    super.onBeforeRender && super.onBeforeRender.apply(this, arguments);
    
    console.log('before render', this.iframe);
  } */
}
const _loadHtml = async (file, {contentId = null}) => {
  let href;
  if (file.url) {
    href = file.url;
  } else {
    href = file;
  }
  // href = href.replace(/(\/[^\/]*\/)(?:[^\/]*)$/, '/ipfs$1');

  const f = 1;
  const s = 5;
  const width = 600 * f;
  const height = 400 * f;
  const scale = Math.min(1/width, 1/height) * s;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('width', width); 
  iframe.setAttribute('height', height); 
  iframe.style.width = width + 'px';
  iframe.style.height = height + 'px';
  // iframe.style.opacity = 0.75;
  iframe.style.background = 'white';
  iframe.style.border = '0';
  // iframe.style.transformOrigin = '50% 50%';
  // iframe.style.backfaceVisibility = 'visible';
  // iframe.src = href;
  // iframe.src = 'https://threejs.org/examples/webgl_materials_channels.html';
  iframe.src = href;
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  
  let fov = 0;
  const _updateSize = () => {
    fov = iframeContainer.getFov();
    
    // console.log('got fov', innerWidth, innerHeight, width, height);
    /* `
      translate(
        ${innerWidth > innerHeight ? -height*scale : height*scale}px,
        ${height*scale/2}px
      )
      scale(${scale}, ${-scale})
    `; */
    // iframe.style.position = 'absolute';
    // iframe.style.left = `${window.innerWidth/2 - width/2}px`;
    // iframe.style.top = `${window.innerHeight/2 - height/2}px`;
    // iframe.style.border = '0';
    // iframe.style.transformStyle = 'preserve-3d';
    
    iframe.style.transform = `translate(${window.innerWidth/2 - width/2}px, ${window.innerHeight/2 - height/2}px)` + getObjectCSSMatrix(
      localMatrix.compose(
        localVector.set(0, 0, 0),
        localQuaternion.set(0, 0, 0, 1),
        localVector2.setScalar(scale)
      )
    );
  };
  _updateSize();

  const object2 = new IFrameMesh({
    iframe,
    width: width * scale,
    height: height * scale,
  });
  object2.frustumCulled = false;

  function epsilon(value) {
		return value;
    // return Math.abs(value) < 1e-10 ? 0 : value;
	}
  function getObjectCSSMatrix( matrix, cameraCSSMatrix ) {
		var elements = matrix.elements;
		var matrix3d = 'matrix3d(' +
			epsilon( elements[ 0 ] ) + ',' +
			epsilon( elements[ 1 ] ) + ',' +
			epsilon( elements[ 2 ] ) + ',' +
			epsilon( elements[ 3 ] ) + ',' +
			epsilon( - elements[ 4 ] ) + ',' +
			epsilon( - elements[ 5 ] ) + ',' +
			epsilon( - elements[ 6 ] ) + ',' +
			epsilon( - elements[ 7 ] ) + ',' +
			epsilon( elements[ 8 ] ) + ',' +
			epsilon( elements[ 9 ] ) + ',' +
			epsilon( elements[ 10 ] ) + ',' +
			epsilon( elements[ 11 ] ) + ',' +
			epsilon( elements[ 12 ] ) + ',' +
			epsilon( elements[ 13 ] ) + ',' +
			epsilon( elements[ 14 ] ) + ',' +
			epsilon( elements[ 15 ] ) +
		')';

		/* if ( isIE ) {

			return 'translate(-50%,-50%)' +
				'translate(' + _widthHalf + 'px,' + _heightHalf + 'px)' +
				cameraCSSMatrix +
				matrix3d;

		} */

		return matrix3d;
	}
  function getCameraCSSMatrix( matrix ) {
    const {elements} = matrix;
		return 'matrix3d(' +
			epsilon( elements[ 0 ] ) + ',' +
			epsilon( - elements[ 1 ] ) + ',' +
			epsilon( elements[ 2 ] ) + ',' +
			epsilon( elements[ 3 ] ) + ',' +
			epsilon( elements[ 4 ] ) + ',' +
			epsilon( - elements[ 5 ] ) + ',' +
			epsilon( elements[ 6 ] ) + ',' +
			epsilon( elements[ 7 ] ) + ',' +
			epsilon( elements[ 8 ] ) + ',' +
			epsilon( - elements[ 9 ] ) + ',' +
			epsilon( elements[ 10 ] ) + ',' +
			epsilon( elements[ 11 ] ) + ',' +
			epsilon( elements[ 12 ] ) + ',' +
			epsilon( - elements[ 13 ] ) + ',' +
			epsilon( elements[ 14 ] ) + ',' +
			epsilon( elements[ 15 ] ) +
		')';

	}
  object2.onBeforeRender = (renderer) => {
    const context = renderer.getContext();
    context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };
  object2.onAfterRender = (renderer) => {
    const context = renderer.getContext();
    context.enable(context.SAMPLE_ALPHA_TO_COVERAGE);
  };

  const object = new THREE.Mesh();
  object.contentId = contentId;
  object.frustumCulled = false;
  object.isHtml = true;
  let physicsIds = [];
  let staticPhysicsIds = [];
  object.run = async () => {
    const physicsId = physicsManager.addBoxGeometry(
      object.position,
      object.quaternion,
      new THREE.Vector3(width * scale / 2, height * scale / 2, 0.1),
      false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
    
    iframeContainer2.appendChild(iframe);
    sceneHighPriority.add(object2);
  };
  object.destroy = () => {
    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
    
    iframeContainer2.removeChild(iframe);
    sceneHighPriority.remove(object2);
    
    appManager.destroyApp(appId);
  };
  object.getPhysicsIds = () => physicsIds;
  object.getStaticPhysicsIds = () => staticPhysicsIds;
  object.hit = () => {
    console.log('hit', object); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  
  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    object2.position.copy(object.position);
    object2.quaternion.copy(object.quaternion);
    object2.scale.copy(object.scale);
    // object2.matrix.copy(object.matrix);
    // object2.matrixWorld.copy(object.matrixWorld);
    
    const cameraCSSMatrix =
      // 'translateZ(' + fov + 'px) ' +
      // `scale(${1/window.innerWidth}, ${1/window.innerHeight}) ` +
      getCameraCSSMatrix(
        localMatrix.copy(camera.matrixWorldInverse)
          // .invert()
          .premultiply(
            localMatrix2.makeTranslation(0, 0, fov)
          )
          .multiply(
            object.matrixWorld
          )
          /* .premultiply(
            localMatrix2.makeScale(1/window.innerWidth, -1/window.innerHeight, 1)
              .invert()
          ) */
          // .invert()
      );
    iframeContainer2.style.transform = cameraCSSMatrix;
  });
  object.resize = _updateSize;
  
  return object;
};
const _loadGlfs = async (file, {contentId = null}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  
  const res = await fetch(srcUrl);
  const text = await res.text();
  const shader = JSON.parse(text);
  
  const fullscreenShader = new FullscreenShader(shader);

  const o = new THREE.Object3D();
  o.contentId = contentId;
  o.useAux = rigAux => {
    compositor.add(fullscreenShader);
  };
  o.destroy = () => {
    compositor.remove(fullscreenShader);
    appManager.destroyApp(appId);
  };
  
  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    fullscreenShader.pass.enabled = !!o.parent;
  });
  
  return o;
};
const _loadGlbb = async (file, {parentUrl = null, contentId = null}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (/^\.+\//.test(srcUrl)) {
    // console.log('base url', parentUrl);
    srcUrl = new URL(srcUrl, parentUrl || location.href).href;
  }

  const res = await fetch(srcUrl);
  const shader = await res.json();

  const size = 1024;
  const worldSize = 2;

  const shadertoyRenderer = new ShadertoyRenderer(
    shader,
    {
      size: 1024,
      worldSize: 2,
    }
  );
  let loaded = false;
  (async () => {
    await shadertoyRenderer.waitForLoad();
    loaded = true;
  })();
  const o = shadertoyRenderer.mesh;
  o.contentId = contentId;
  // o.frustumCulled = false;
  
  let physicsIds = [];
  let staticPhysicsIds = [];
  o.run = async () => {
    const physicsId = physicsManager.addBoxGeometry(
      o.position,        
      o.quaternion,
      new THREE.Vector3(worldSize/2, worldSize/2, 0.01),
      false
    );
    physicsIds.push(physicsId);
    staticPhysicsIds.push(physicsId);
  };
  o.destroy = () => {
    appManager.destroyApp(appId);

    for (const physicsId of physicsIds) {
      physicsManager.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
    staticPhysicsIds.length = 0;
  };
  o.getPhysicsIds = () => physicsIds;
  o.getStaticPhysicsIds = () => staticPhysicsIds;

  const appId = appManager.getNextAppId();
  const app = appManager.createApp(appId);
  app.addEventListener('frame', e => {
    if (loaded) {
      shadertoyRenderer.update(e.data.timeDiff/1000);
    }
  });

  return o;
};
/* const _loadGlom = async (file, {files = null, components = [], contentId = null}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  if (files && _isResolvableUrl(srcUrl)) {
    srcUrl = files[_dotifyUrl(srcUrl)];
  }
  
  const res = await fetch(srcUrl);
  const text = await res.text();
  const shader = JSON.parse(text);
  const {vertexShader, fragmentShader} = shader;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      opacity: {
        value: 1,
        needsUpdate: true,
      },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  material.skinning = true;
  material.morphTargets = true;

  const o = new THREE.Object3D();
  o.contentId = contentId;
  o.material = material;
  const componentUnloadFns = [];
  o.useAux = rigAux => {
    let used = false;
    for (const componentType of loadComponentTypes) {
      const componentIndex = components.findIndex(component => component.type === componentType);
      if (componentIndex !== -1) {
        const component = components[componentIndex];
        const componentHandler = componentHandlers[component.type];
        const unloadFn = componentHandler.load(o, componentIndex, rigAux);
        componentUnloadFns.push(unloadFn);
        used = true;
      }
    }
    return used;
  };
  o.destroy = () => {
    // appManager.destroyApp(appId);
    
    for (const fn of componentUnloadFns) {
      fn();
    }
    componentUnloadFns.length = 0;
  };
  
  return o;
}; */
/* const _loadMediaStream = async (file, {contentId = null}) => {
  let spec;
  if (file.url) {
    const res = await fetch(file.url);
    spec = await res.json();
  } else {
    spec = await file.json();
  }

  const object = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
    }),
  );
  object.contentId = contentId;
  object.hit = () => {
    console.log('hit', object); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  return object;
}; */

const _loadAudio = async (file, {contentId = null, instanceId = null, monetizationPointer = null, ownerAddress = null} = {}) => {
  let srcUrl = file.url || URL.createObjectURL(file);
  
  const audio = document.createElement('audio');
  audio.src = srcUrl;
  audio.loop = true;

  const object = new THREE.Object3D();
  object.contentId = contentId;
  object.run = async () => {
    audio.play();
    startMonetization(instanceId, monetizationPointer, ownerAddress);
  };
  object.destroy = () => {
    audio.pause();
  };
  object.hit = () => {
    console.log('hit', object); // XXX
    return {
      hit: false,
      died: false,
    };
  };
  return object;
};

const _loadVideo = () => {
  throw new Error('not implemented');
};

const _loadGeo = async (file, {contentId = null}) => {
  const object = buildTool.makeShapeMesh();
  object.contentId = contentId;
  return object;
};

/* const typeHandlers = {
  'metaversefile': _loadMetaversefile,
  'rtf.js': _loadRtfjs,
  't.js': _loadTjs,
  'gltf': _loadGltf,
  'glb': _loadGltf,
  'vrm': _loadVrm,
  'vox': _loadVox,
  'png': _loadImg,
  'gif': _loadGif,
  'jpeg': _loadImg,
  'jpg': _loadImg,
  'js': _loadScript,
  'json': _loadManifestJson,
  'wbn': _loadWebBundle,
  'scn': _loadScene,
  'url': _loadPortal,
  'html': _loadHtml,
  'glfs': _loadGlfs,
  'glbb': _loadGlbb,
  // 'glom': _loadGlom,
  // 'mediastream': _loadMediaStream,
  'geo': _loadGeo,
  'mp3': _loadAudio,
  'mp4': _loadVideo,
};
runtime.typeHandlers = typeHandlers; */

/* runtime.loadFile = async (contentId, opts) => {
  const object = await (async () => {
    const ext = file.ext || getExt(file.name) || 'html';
    const handler = typeHandlers[ext];
    console.log('runtime load file', file.name, file.ext, !!handler);
    if (handler) {
      return await handler(file, opts);
    } else {
      throw new Error('unknown file type: ' + ext);
    }
  })();
  object.rotation.order = 'YXZ';
  object.savedRotation = object.rotation.clone();
  object.startQuaternion = object.quaternion.clone();
  return object;
}; */

export default runtime;
