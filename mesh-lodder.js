import * as THREE from 'three';
import {MaxRectsPacker} from 'maxrects-packer';
// import {localPlayer} from './players.js';
import {alea} from './procgen/procgen.js';
// import {getRenderer} from './renderer.js';
import {mod, modUv, getNextPhysicsId} from './util.js';
import physicsManager from './physics-manager.js';

const bufferSize = 2 * 1024 * 1024;
const chunkWorldSize = 30;
const defaultTextureSize = 4096;
const startAtlasSize = 512;
const minObjectsPerChunk = 20;
const maxObjectPerChunk = 50;

const upVector = new THREE.Vector3(0, 1, 0);
const oneVector = new THREE.Vector3(1, 1, 1);

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localVector2D2 = new THREE.Vector2();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();

const textureTypes = [
  'map',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
];
const _colorCanvas = (canvas, fillStyle) => {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = fillStyle;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
const textureInitializers = {
  normal(canvas) {
    _colorCanvas(canvas, 'rgb(128, 128, 255)');
  },
  roughness(canvas) {
    _colorCanvas(canvas, 'rgb(255, 255, 255)');
  },
  /* metalness(canvas) {
    _colorCanvas(canvas, 'rgb(0, 0, 0)');
  }, */
};

const _eraseVertices = (geometry, positionStart, positionCount/*, indexStart, indexCount*/) => {
  // console.log('erase vertices', geometry, positionStart, positionCount/*, indexStart, indexCount*/);
  for (let i = 0; i < positionCount; i++) {
    geometry.attributes.position.array[positionStart + i] = 0;
    geometry.attributes.position.needsUpdate = true; // XXX needs to use update range
  }
  /* for (let i = 0; i < indexCount; i++) {
    geometry.index.array[indexStart + i] = 0;
  } */
};

const meshLodders = [];
let ids = 0;
class MeshLodder {
  constructor() {
    this.id = ++ids;

    const positions = new Float32Array(bufferSize * 3);
    const normals = new Float32Array(bufferSize * 3);
    const uvs = new Float32Array(bufferSize * 2);
    const uvs2 = new Float32Array(bufferSize * 2);
    const geometry = new THREE.BufferGeometry();
    const indices = new Uint32Array(bufferSize);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setAttribute('uv2', new THREE.BufferAttribute(uvs2, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setDrawRange(0, 0);
    this.geometry = geometry;

    const material = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      alphaTest: 0.1,
      transparent: true,
    });
    this.material = material;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.frustumCulled = false;

    this.contentIndex = {};
    this.itemRegistry = [];
    this.shapeAddresses = {};
    this.physicsObjects = [];
    this.compiled = false;
    this.lastChunkCoord = new THREE.Vector2(NaN, NaN);

    meshLodders.push(this);
  }
  registerLodMesh(name, meshes) {
    // console.log('register lod mesh', name, meshes);

    const newMeshes = meshes.map(mesh => {
      const {geometry} = mesh;
      
      const uvs = geometry.attributes.uv.array.slice();
      geometry.setAttribute('originalUv', new THREE.BufferAttribute(uvs, 2));
      const uvs2 = geometry.attributes.uv2 ? geometry.attributes.uv2.array.slice() : geometry.attributes.uv.array.slice();
      geometry.setAttribute('originalUv2', new THREE.BufferAttribute(uvs2, 2));

      return mesh;
    });
    this.contentIndex[name] = newMeshes;

    const lastMesh = newMeshes[newMeshes.length - 1];
    const buffer = physicsManager.cookConvexGeometry(lastMesh);
    const shapeAddress = physicsManager.createConvexShape(buffer);
    this.shapeAddresses[name] = shapeAddress;
  }
  getPhysicsObjects() {
    return this.physicsObjects;
  }
  #getContentMergeable()  {
    /* const getObjectKey = (object, material) => {
      const renderer = getRenderer();
      return renderer.getProgramCacheKey(object, material);
    }; */
    const getObjectKey = () => '';

    const mergeables = new Map();

    for (const name in this.contentIndex) {
      const meshes = this.contentIndex[name];

      for (const mesh of meshes) {
        mesh.traverse(o => {
          if (o.isMesh && o.geometry.type === 'BufferGeometry') {
            const objectGeometry = o.geometry;
            // const morphTargetDictionary = o.morphTargetDictionary;
            // const morphTargetInfluences = o.morphTargetInfluences;
            const objectMaterials = Array.isArray(o.material) ? o.material : [o.material];
            for (const objectMaterial of objectMaterials) {
              const {
                map = null,
                emissiveMap = null,
                normalMap = null,
                roughnessMap = null,
                metalnessMap = null,
                // shadeTexture = null,
              } = objectMaterial;
              // const skeleton = o.skeleton ?? null;
      
              const key = getObjectKey(o, objectMaterial);
      
              let m = mergeables.get(key);
              if (!m) {
                m = {
                  material: objectMaterial,
                  meshes: [],
                  geometries: [],
                  materials: [],
                  maps: [],
                  emissiveMaps: [],
                  normalMaps: [],
                  roughnessMaps: [],
                  metalnessMaps: [],
                  // shadeTextures: [],
                  // skeletons: [],
                  // morphTargetDictionaryArray: [],
                  // morphTargetInfluencesArray: [],
                };
                mergeables.set(key, m);
              }
      
              m.meshes.push(o);
              m.geometries.push(objectGeometry);
              m.materials.push(objectMaterial);
              m.maps.push(map);
              m.emissiveMaps.push(emissiveMap);
              m.normalMaps.push(normalMap);
              m.roughnessMaps.push(roughnessMap);
              m.metalnessMaps.push(metalnessMap);
              // m.shadeTextures.push(shadeTexture);
              // m.skeletons.push(skeleton);
              // m.morphTargetDictionaryArray.push(morphTargetDictionary);
              // m.morphTargetInfluencesArray.push(morphTargetInfluences);
            }
          }
        });
      }
    }

    return Array.from(mergeables.values())[0];
  }
  compile() {
    const mergeable = this.#getContentMergeable();
    const {
      // type,
      // material,
      meshes,
      geometries,
      materials,
      maps,
      emissiveMaps,
      normalMaps,
      roughnessMaps,
      metalnessMaps,
      // skeletons,
      // morphTargetDictionaryArray,
      // morphTargetInfluencesArray,
    } = mergeable;
  
    // compute texture sizes
    const textureSizes = maps.map((map, i) => {
      const emissiveMap = emissiveMaps[i];
      const normalMap = normalMaps[i];
      const roughnessMap = roughnessMaps[i];
      const metalnessMap = metalnessMaps[i];
      
      const maxSize = new THREE.Vector2(0, 0);
      if (map) {
        maxSize.x = Math.max(maxSize.x, map.image.width);
        maxSize.y = Math.max(maxSize.y, map.image.height);
      }
      if (emissiveMap) {
        maxSize.x = Math.max(maxSize.x, emissiveMap.image.width);
        maxSize.y = Math.max(maxSize.y, emissiveMap.image.height);
      }
      if (normalMap) {
        maxSize.x = Math.max(maxSize.x, normalMap.image.width);
        maxSize.y = Math.max(maxSize.y, normalMap.image.height);
      }
      if (roughnessMap) {
        maxSize.x = Math.max(maxSize.x, roughnessMap.image.width);
        maxSize.y = Math.max(maxSize.y, roughnessMap.image.height);
      }
      if (metalnessMap) {
        maxSize.x = Math.max(maxSize.x, metalnessMap.image.width);
        maxSize.y = Math.max(maxSize.y, metalnessMap.image.height);
      }
      return maxSize;
    });
    const textureUuids = maps.map((map, i) => {
      const emissiveMap = emissiveMaps[i];
      const normalMap = normalMaps[i];
      const roughnessMap = roughnessMaps[i];
      const metalnessMap = metalnessMaps[i];

      const uuids = [];
      uuids.push(map ? map.uuid : null);
      uuids.push(emissiveMap ? emissiveMap.uuid : null);
      uuids.push(normalMap ? normalMap.uuid : null);
      uuids.push(roughnessMap ? roughnessMap.uuid : null);
      uuids.push(metalnessMap ? metalnessMap.uuid : null);
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
        let atlasSize = startAtlasSize;
        while (!(atlas = _attemptPack(textureSizes, atlasSize))) {
          atlasSize *= 2;
        }
        return atlas;
      } else {
        return null;
      }
    };
    const atlas = _packAtlases();
    this.atlas = atlas;

    // draw atlas images
    const _drawAtlasImages = atlas => {
      const _getTexturesKey = textures => textures.map(t => t ? t.uuid : '').join(',');
      const _drawAtlasImage = (textureType, textures) => {
        if (atlas && textures.some(t => t !== null)) {
          const canvasSize = Math.min(atlas.width, defaultTextureSize);
          const canvasScale = canvasSize / atlas.width;

          const canvas = document.createElement('canvas');
          canvas.width = canvasSize;
          canvas.height = canvasSize;

          const initializer = textureInitializers[textureType];
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
      for (const textureType of textureTypes) {
        const textures = mergeable[`${textureType}s`];
        const key = _getTexturesKey(textures);

        let atlasImage = atlasImagesMap.get(key);
        if (atlasImage === undefined) { // cache miss
          atlasImage = _drawAtlasImage(textureType, textures);
          if (atlasImage !== null) {
            atlasImage.key = key;
          }
          atlasImagesMap.set(key, atlasImage);
        }
        atlasImages[textureType] = atlasImage;
      }
      return atlasImages;
    };
    const atlasImages = _drawAtlasImages(atlas);

    const {material} = this;
    for (const textureType of textureTypes) {
      const atlasImage = atlasImages[textureType];
      if (atlasImage) {
        const texture = new THREE.Texture(atlasImage);
        texture.flipY = false;
        texture.needsUpdate = true;
        material[textureType] = texture;
      }
    }
    material.needsUpdate = true;

    this.meshes = meshes;

    this.compiled = true;
  }
  getChunks() {
    return this.mesh;
  }
  #getCurrentCoord(target) {
    return target.set(0, 0);
  }
  #getContentIndexNames() {
    return Object.keys(this.contentIndex).sort();
  }
  getItemByPhysicsId(physicsId) {
    const physicsObjectIndex = this.physicsObjects.findIndex(p => p.physicsId === physicsId);
    if (physicsObjectIndex !== -1) {
      const item = this.itemRegistry[physicsObjectIndex];
      return item;
    } else {
      return null;
    }
  }
  deleteItem(item) {
    const index = this.itemRegistry.indexOf(item);
    if (index !== -1) {
      const item = this.itemRegistry[index];
      const {geometry} = this.mesh;
      _eraseVertices(
        geometry,
        item.attributes.position.start,
        item.attributes.position.count,
        // item.index.start,
        // item.index.count,
      );

      const physicsObject = this.physicsObjects[index];
      physicsManager.removeGeometry(physicsObject);
      
      this.itemRegistry.splice(index, 1);
      this.physicsObjects.splice(index, 1);
    }
  }
  update() {
    if (this.compiled) {
      const currentCoord = this.#getCurrentCoord(localVector2D);
      
      if (!currentCoord.equals(this.lastChunkCoord)) {
        this.lastChunkCoord.copy(currentCoord);

        const {geometry} = this.mesh;
        const {atlas} = this;
        const names = this.#getContentIndexNames();
        const canvasSize = Math.min(atlas.width, defaultTextureSize);
        const canvasScale = canvasSize / atlas.width;
        
        const rng = alea(`mesh-lodder:${currentCoord.x}:${currentCoord.y}`);
        const numObjects = minObjectsPerChunk + Math.floor(rng() * (maxObjectPerChunk - minObjectsPerChunk));
        let positionIndex = 0;
        let indexIndex = 0;
        for (let i = 0; i < numObjects; i++) {
          const name = names[Math.floor(rng() * names.length)];
          const positionX = rng() * chunkWorldSize;
          const positionZ = rng() * chunkWorldSize;
          const rotationY = rng() * Math.PI * 2;

          const meshes = this.contentIndex[name];
          const mesh = meshes[0];
          const g = mesh.geometry;
          const meshIndex = this.meshes.indexOf(mesh);
          const rect = atlas.rectIndexCache.get(meshIndex);
          const {x, y, width: w, height: h} = rect;
          const tx = x * canvasScale;
          const ty = y * canvasScale;
          const tw = w * canvasScale;
          const th = h * canvasScale;

          const matrixWorld = localMatrix.copy(mesh.matrixWorld)
            .premultiply(localMatrix2.makeRotationAxis(upVector, rotationY))
            .premultiply(localMatrix2.makeTranslation(positionX, 0, positionZ))
            .premultiply(this.mesh.matrixWorld);

          const _addPhysicsShape = () => {
            const shapeAddress = this.shapeAddresses[name];
            matrixWorld.decompose(localVector, localQuaternion, localVector2);
            const position = localVector;
            const quaternion = localQuaternion;
            const scale = localVector2;
            const shape = physicsManager.addConvexShape(shapeAddress, position, quaternion, scale, false, true);

            this.physicsObjects.push(shape);

            // return shape;
          };
          // const physicsObject = _addPhysicsShape();
          _addPhysicsShape();

          const _addItemToRegistry = () => {
            const item = {
              position: new THREE.Vector3(positionX, 2, positionZ),
              quaternion: new THREE.Quaternion().setFromAxisAngle(upVector, rotationY),
              scale: oneVector,
              attributes: {
                position: {
                  start: positionIndex * 3,
                  count: g.attributes.position.count * 3,
                },
              },
              index: {
                start: indexIndex,
                count: g.index.count,
              },
              cloneApp: () => {
                const geometry = g.clone();

                _mapUvs(g, geometry, 'originalUv', 'uv', 0, g.attributes.originalUv.count);
                _mapUvs(g, geometry, 'originalUv2', 'uv2', 0, g.attributes.originalUv2.count);

                const {material} = this;
                const cloned = new THREE.Mesh(geometry, material);
                cloned.matrixWorld.copy(mesh.matrixWorld)
                  .premultiply(localMatrix2.makeRotationAxis(upVector, rotationY))
                  .premultiply(localMatrix2.makeTranslation(positionX, 0, positionZ))
                  .premultiply(this.mesh.matrixWorld);
                cloned.matrix.copy(cloned.matrixWorld)
                  .decompose(cloned.position, cloned.quaternion, cloned.scale);
                cloned.frustumCulled = false;
                return cloned;
              },
            };
            this.itemRegistry.push(item);
          };
          _addItemToRegistry();

          const _mapPositions = (g, geometry) => {
            const count = g.attributes.position.count;

            const matrix = localMatrix.copy(mesh.matrixWorld)
              .premultiply(localMatrix2.makeRotationAxis(upVector, rotationY))
              .premultiply(localMatrix2.makeTranslation(positionX, 0, positionZ));

            for (let i = 0; i < count; i++) {
              const srcIndex = i;
              const dstIndex = positionIndex + i;

              localVector.fromArray(g.attributes.position.array, srcIndex * 3)
                .applyMatrix4(matrix)
                .toArray(geometry.attributes.position.array, dstIndex * 3);
            }
          };
          const _mapUvs = (g, geometry, srcKey, dstKey, dstOffset, count) => {
            for (let i = 0; i < count; i++) {
              const srcIndex = i;
              const dstIndex = dstOffset + i;

              localVector2D.fromArray(g.attributes[srcKey].array, srcIndex * 2);
              modUv(localVector2D);
              localVector2D
                .multiply(
                  localVector2D2.set(tw/canvasSize, th/canvasSize)
                )
                .add(
                  localVector2D2.set(tx/canvasSize, ty/canvasSize)
                );
              localVector2D.toArray(geometry.attributes[dstKey].array, dstIndex * 2);
            }
          };
          const _mapIndices = (g, geometry) => {
            const count = g.index.count;
            for (let i = 0; i < count; i++) {
              geometry.index.array[indexIndex + i] = g.index.array[i] + positionIndex;
            }
          };

          _mapPositions(g, geometry);
          geometry.attributes.normal.array.set(g.attributes.normal.array, positionIndex * 3);
          _mapUvs(g, geometry, 'originalUv', 'uv', positionIndex, g.attributes.originalUv.count);
          _mapUvs(g, geometry, 'originalUv2', 'uv2', positionIndex, g.attributes.originalUv2.count);
          _mapIndices(g, geometry);

          geometry.attributes.position.needsUpdate = true;
          geometry.attributes.normal.needsUpdate = true;
          geometry.attributes.uv.needsUpdate = true;
          geometry.attributes.uv2.needsUpdate = true;
          geometry.index.needsUpdate = true;

          positionIndex += g.attributes.position.count;
          indexIndex += g.index.count;
        }

        geometry.setDrawRange(0, indexIndex);
      }
    }
  }
  destroy() {
    meshLodders.splice(meshLodders.indexOf(this), 1);
  }
}

const meshLodManager = {
  createMeshLodder() {
    return new MeshLodder();
  },
  getMeshLodder(id) {
    return meshLodders.find(meshLod => meshLod.id === id) ?? null;
  },
};
export default meshLodManager;