import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useCleanup, useLocalPlayer, usePhysics, useLoaders, useActivate, useAvatarInternal, useInternals} = metaversefile;

// const wearableScale = 1;

/* const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4(); */

// const z180Quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

export default e => {
  const app = useApp();
  
  const physics = usePhysics();
  const localPlayer = useLocalPlayer();

  const srcUrl = ${this.srcUrl};
  for (const {key, value} of components) {
    app.setComponent(key, value);
  }
  
  app.glb = null;
  const animationMixers = [];
  const uvScrolls = [];
  const physicsIds = [];
  app.physicsIds = physicsIds;
  
  // glb state
  let animations;
  
  // sit state
  let sitSpec = null;
  
  let activateCb = null;
  e.waitUntil((async () => {
    let o;
    try {
      o = await new Promise((accept, reject) => {
        const {gltfLoader} = useLoaders();
        gltfLoader.load(srcUrl, accept, function onprogress() {}, reject);
      });
    } catch(err) {
      console.warn(err);
    }
    // console.log('got o', o);
    if (o) {
      app.glb = o;
      const {parser} = o;
      animations = o.animations;
      // console.log('got animations', animations);
      o = o.scene;
      
      const _addAntialiasing = aaLevel => {
        o.traverse(o => {
          if (o.isMesh) {
            ['alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'map', 'metalnessMap', 'normalMap', 'roughnessMap'].forEach(mapType => {
              if (o.material[mapType]) {
                o.material[mapType].anisotropy = aaLevel;
              }
            });
            if (o.material.transmission !== undefined) {
              o.material.transmission = 0;
              o.material.opacity = 0.25;
            }
          }
        });
      };
      _addAntialiasing(16);
      
      const _loadHubsComponents = () => {
        const _loadAnimations = () => {
          const animationEnabled = !!(app.getComponent('animation') ?? true);
          if (animationEnabled) {
            o.traverse(o => {
              if (o.isMesh) {
                const idleAnimation = animations.find(a => a.name === 'idle');
                let clip = idleAnimation || animations[animationMixers.length];
                if (clip) {
                  const mixer = new THREE.AnimationMixer(o);
                  
                  const action = mixer.clipAction(clip);
                  action.play();

                  animationMixers.push(mixer);
                }
              }
            });
          }
        };
        const petComponent = app.getComponent('pet');
        if (!petComponent) {
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
      
      app.add(o);
      o.updateMatrixWorld();
      
      const _addPhysics = async physicsComponent => {
        let physicsId;
        switch (physicsComponent.type) {
          case 'triangleMesh': {
            physicsId = physics.addGeometry(o);
            break;
          }
          case 'convexMesh': {
            physicsId = physics.addConvexGeometry(o);
            break;
          }
          default: {
            physicsId = null;
            break;
          }
        }
        if (physicsId !== null) {
          physicsIds.push(physicsId);
        } else {
          console.warn('glb unknown physics component', physicsComponent);
        }
      };
      let physicsComponent = app.getComponent('physics');
      if (physicsComponent) {
        if (physicsComponent === true) {
          physicsComponent = {
            type: 'triangleMesh',
          };
        }
        _addPhysics(physicsComponent);
      }
      o.traverse(o => {
        if (o.isMesh) {
          o.frustumCulled = false;
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      
      activateCb = () => {
        if (
          app.getComponent('sit')
        ) {
          app.wear();
        }
      };
    }
  })());
  
  const _unwear = () => {
    if (sitSpec) {
      const sitAction = localPlayer.getAction('sit');
      if (sitAction) {
        localPlayer.removeAction('sit');
      }
    }
  };
  app.addEventListener('wearupdate', e => {
    if (e.wear) {
      if (app.glb) {
        // const {animations} = app.glb;

        sitSpec = app.getComponent('sit');
        if (sitSpec) {
          let rideMesh = null;
          app.glb.scene.traverse(o => {
            if (rideMesh === null && o.isSkinnedMesh) {
              rideMesh = o;
            }
          });

          const {instanceId} = app;
          const localPlayer = useLocalPlayer();

          const rideBone = sitSpec.sitBone ? rideMesh.skeleton.bones.find(bone => bone.name === sitSpec.sitBone) : null;
          const sitAction = {
            type: 'sit',
            time: 0,
            animation: sitSpec.subtype,
            controllingId: instanceId,
            controllingBone: rideBone,
          };
          localPlayer.setControlAction(sitAction);
        }
      }
    } else {
      _unwear();
    }
  });
  
  useFrame(({timestamp, timeDiff}) => {
    const _updateAnimation = () => {
      const deltaSeconds = timeDiff / 1000;
      for (const mixer of animationMixers) {
        mixer.update(deltaSeconds);
        app.updateMatrixWorld();
      }
    };
    _updateAnimation();
    
    const _updateUvScroll = () => {
      for (const uvScroll of uvScrolls) {
        uvScroll.update(timestamp);
      }
    };
    _updateUvScroll();
  });
  
  useActivate(() => {
    activateCb && activateCb();
  });
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    _unwear();
  });

  app.stop = () => {
    for (const mixer of animationMixers) {
      console.log('got mixer', mixer);
      mixer.stopAllAction();
    }
    animationMixers.length = 0;
  };
  
  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'glb';
export const components = ${this.components};