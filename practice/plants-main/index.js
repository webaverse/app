import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, usePhysics, useLocalPlayer, useFrame, useLoaders, useInstancing, useAtlasing, useCleanup, useWorld, useLodder, useDcWorkerManager, useGeometryAllocators, useMaterials} = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localBox = new THREE.Box3();

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
const glbSpecs = [
  /* {
    type: 'object',
    url: `${baseUrl}plants.glb`,
  },
  {
    type: 'object',
    url: `${baseUrl}rocks.glb`,
  }, */
  {
    type: 'plant',
    url: `${baseUrl}trees.glb`,
  },
];

const chunkWorldSize = 16;
const maxInstancesPerDrawCall = 128;
const maxDrawCallsPerGeometry = 32;
const numLods = 1;
const maxAnisotropy = 16;

//

const {InstancedBatchedMesh, InstancedGeometryAllocator} = useInstancing();
const {createTextureAtlas} = useAtlasing();
class VegetationMesh extends InstancedBatchedMesh {
  constructor({
    lodMeshes = [],
    shapeAddresses = [],
    physics = null,
  } = {}) {

    // instancing
    
    const {
      atlasTextures,
      geometries: lod0Geometries,
    } = createTextureAtlas(lodMeshes.map(lods => lods[0]), {
      textures: ['map', 'normalMap'],
      attributes: ['position', 'normal', 'uv'],
    });

    // allocator

    const allocator = new InstancedGeometryAllocator(lod0Geometries, [
      {
        name: 'p',
        Type: Float32Array,
        itemSize: 3,
      },
      {
        name: 'q',
        Type: Float32Array,
        itemSize: 4,
      },
    ], {
      maxInstancesPerDrawCall,
      maxDrawCallsPerGeometry,
      boundingType: 'box',
    });
    const {geometry, textures: attributeTextures} = allocator;
    for (const k in attributeTextures) {
      const texture = attributeTextures[k];
      texture.anisotropy = maxAnisotropy;
    }

    // material

    const material = new THREE.MeshStandardMaterial({
      map: atlasTextures.map,
      normalMap: atlasTextures.normalMap,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.5,
      onBeforeCompile: (shader) => {
        // console.log('on before compile', shader.fragmentShader);

        shader.uniforms.pTexture = {
          value: attributeTextures.p,
          needsUpdate: true,
        };
        shader.uniforms.qTexture = {
          value: attributeTextures.q,
          needsUpdate: true,
        };
        
        // vertex shader

        shader.vertexShader = shader.vertexShader.replace(`#include <uv_pars_vertex>`, `\
#undef USE_INSTANCING

#include <uv_pars_vertex>

uniform sampler2D pTexture;
uniform sampler2D qTexture;

vec3 rotate_vertex_position(vec3 position, vec4 q) { 
  return position + 2.0 * cross(q.xyz, cross(q.xyz, position) + q.w * position);
}
        `);
        shader.vertexShader = shader.vertexShader.replace(`#include <begin_vertex>`, `\
#include <begin_vertex>

int instanceIndex = gl_DrawID * ${maxInstancesPerDrawCall} + gl_InstanceID;
const float width = ${attributeTextures.p.image.width.toFixed(8)};
const float height = ${attributeTextures.p.image.height.toFixed(8)};
float x = mod(float(instanceIndex), width);
float y = floor(float(instanceIndex) / width);
vec2 pUv = (vec2(x, y) + 0.5) / vec2(width, height);
vec3 p = texture2D(pTexture, pUv).xyz;
vec4 q = texture2D(qTexture, pUv).xyzw;

// instance offset
{
  transformed = rotate_vertex_position(transformed, q);
  transformed += p;
}
/* {
  transformed.y += float(gl_DrawID) * 10.;
  transformed.x += float(gl_InstanceID) * 10.;
} */
        `);
        shader.fragmentShader = shader.fragmentShader.replace(`#include <uv_pars_fragment>`, `\
#undef USE_INSTANCING

#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif
        `);

        // fragment shader
        
        return shader;
      },
    });

    // mesh

    super(geometry, material, allocator);
    this.frustumCulled = false;
    
    this.meshes = lodMeshes;
    this.shapeAddresses = shapeAddresses;
    this.physics = physics;
    this.physicsObjects = [];
  }
  async addChunk(chunk, {
    signal,
  } = {}) {
    if (chunk.y === 0) {
      let live = true;
      signal.addEventListener('abort', e => {
        live = false;
      });
    
      const _getVegetationData = async () => {
        const dcWorkerManager = useDcWorkerManager();
        const lod = 1;
        const result = await dcWorkerManager.createVegetationSplat(chunk.x * chunkWorldSize, chunk.z * chunkWorldSize, lod);
        return result;
      };
      const result = await _getVegetationData();
      if (!live) return;

      const _renderVegetationGeometry = (drawCall, ps, qs, index) => {
        // geometry

        const pTexture = drawCall.getTexture('p');
        const pOffset = drawCall.getTextureOffset('p');
        const qTexture = drawCall.getTexture('q');
        const qOffset = drawCall.getTextureOffset('q');

        const instanceCount = drawCall.getInstanceCount();
        const px = ps[index * 3];
        const py = ps[index * 3 + 1];
        const pz = ps[index * 3 + 2];
        pTexture.image.data[pOffset + instanceCount * 3] = px;
        pTexture.image.data[pOffset + instanceCount * 3 + 1] = py;
        pTexture.image.data[pOffset + instanceCount * 3 + 2] = pz;

        const qx = qs[index * 4];
        const qy = qs[index * 4 + 1];
        const qz = qs[index * 4 + 2];
        const qw = qs[index * 4 + 3];
        qTexture.image.data[qOffset + instanceCount * 4] = qx;
        qTexture.image.data[qOffset + instanceCount * 4 + 1] = qy;
        qTexture.image.data[qOffset + instanceCount * 4 + 2] = qz;
        qTexture.image.data[qOffset + instanceCount * 4 + 3] = qw;

        drawCall.updateTexture('p', pOffset / 3 + instanceCount, 1);
        drawCall.updateTexture('q', qOffset / 4 + instanceCount, 1);

        drawCall.incrementInstanceCount();

        // physics
        const shapeAddress = this.#getShapeAddress(drawCall.geometryIndex);
        const physicsObject = this.#addPhysicsShape(shapeAddress, px, py, pz, qx, qy, qz, qw);
        this.physicsObjects.push(physicsObject);
      };

      const drawCalls = new Map();
      for (let i = 0; i < result.instances.length; i++) {
        const geometryNoise = result.instances[i];
        const geometryIndex = Math.floor(geometryNoise * this.meshes.length);
        
        let drawCall = drawCalls.get(geometryIndex);
        if (!drawCall) {
          localBox.setFromCenterAndSize(
            localVector.set(
              (chunk.x + 0.5) * chunkWorldSize,
              (chunk.y + 0.5) * chunkWorldSize,
              (chunk.z + 0.5) * chunkWorldSize
            ),
            localVector2.set(chunkWorldSize, chunkWorldSize * 256, chunkWorldSize)
          );
          drawCall = this.allocator.allocDrawCall(geometryIndex, localBox);
          drawCalls.set(geometryIndex, drawCall);
        }
        _renderVegetationGeometry(drawCall, result.ps, result.qs, i);
      }

      signal.addEventListener('abort', e => {
        for (const drawCall of drawCalls.values()) {
          this.allocator.freeDrawCall(drawCall);
        }
      });
    }
  }
  #getShapeAddress(geometryIndex) {
    return this.shapeAddresses[geometryIndex];
  }
  #addPhysicsShape(shapeAddress, px, py, pz, qx, qy, qz, qw) {    
    localVector.set(px, py, pz);
    localQuaternion.set(qx, qy, qz, qw);
    localVector2.set(1, 1, 1);
    localMatrix.compose(localVector, localQuaternion, localVector2)
      .premultiply(this.matrixWorld)
      .decompose(localVector, localQuaternion, localVector2);

    // const matrixWorld = _getMatrixWorld(this.mesh, contentMesh, localMatrix, positionX, positionZ, rotationY);
    // matrixWorld.decompose(localVector, localQuaternion, localVector2);
    const position = localVector;
    const quaternion = localQuaternion;
    const scale = localVector2;
    const dynamic = false;
    const external = true;
    const physicsObject = this.physics.addConvexShape(shapeAddress, position, quaternion, scale, dynamic, external);
  
    this.physicsObjects.push(physicsObject);

    return physicsObject;
  }
  getPhysicsObjects() {
    return this.physicsObjects;
  }
  update() {
    // nothing
  }
}

class VegetationChunkGenerator {
  constructor(parent, {
    lodMeshes = [],
    shapeAddresses = [],
    physics = null,
  } = {}) {
    // parameters
    this.parent = parent;

    // mesh
    this.mesh = new VegetationMesh({
      lodMeshes,
      shapeAddresses,
      physics,
    });
  }
  getChunks() {
    return this.mesh;
  }
  getPhysicsObjects() {
    return this.mesh.getPhysicsObjects();
  }
  generateChunk(chunk) {
    const abortController = new AbortController();
    const {signal} = abortController;
    
    (async () => {
      this.mesh.addChunk(chunk, {
        signal,
      });
    })();    

    chunk.binding = {
      abortController,
    };
  }
  disposeChunk(chunk) {
    const {abortController} = chunk.binding;
    abortController.abort();
    chunk.binding = null;
  }
  update(timestamp, timeDiff) {
    this.mesh.update(timestamp, timeDiff);
  }
  destroy() {
    // nothing; the owning lod tracker disposes of our contents
  }
}

export default () => {
  const app = useApp();
  const world = useWorld();
  const physics = usePhysics();
  const {LodChunkTracker} = useLodder();

  app.name = 'vegetation';

  const frameFns = [];
  useFrame(({timestamp, timeDiff}) => {
    for (const frameFn of frameFns) {
      frameFn(timestamp, timeDiff);
    }
  });

  const cleanupFns = [];
  useCleanup(() => {
    for (const cleanupFn of cleanupFns) {
      cleanupFn();
    }
  });

  let generator = null;
  let tracker = null;
  const specs = {};
  (async () => {
    await Promise.all(glbSpecs.map(async glbSpec => {
      const {type, url} = glbSpec;
      const u = url;
      let o = await new Promise((accept, reject) => {
        const {gltfLoader} = useLoaders();
        gltfLoader.load(u, accept, function onprogress() {}, reject);
      });
      o = o.scene;
      o.updateMatrixWorld();

      const meshes = [];
      o.traverse(o => {
        if (o.isMesh) {
          meshes.push(o);
        }
      });
      for (const o of meshes) {
        const match = o.name.match(/^(.+)_LOD([012])$/);
        if (match) {
          const name = match[1];
          const index = parseInt(match[2], 10);

          o.geometry.applyMatrix4(o.matrixWorld);
          o.parent.remove(o);

          o.position.set(0, 0, 0);
          o.quaternion.identity();
          o.scale.set(1, 1, 1);
          o.matrix.identity();
          o.matrixWorld.identity();

          let spec = specs[name];
          if (!spec) {
            spec = {
              type,
              lods: Array(3).fill(null),
            };
            specs[name] = spec;
          }
          spec.lods[index] = o;
        }
      }
    }));

    const lodMeshes = [];
    for (const name in specs) {
      const spec = specs[name];
      lodMeshes.push(spec.lods);
    }

    // physics

    const shapeAddresses = lodMeshes.map(lods => {
      const lastMesh = lods.findLast(lod => lod !== null);
      const buffer = physics.cookConvexGeometry(lastMesh);
      const shapeAddress = physics.createConvexShape(buffer);
      return shapeAddress;
    });

    // generator

    generator = new VegetationChunkGenerator(this, {
      lodMeshes,
      shapeAddresses,
      physics
    });
    tracker = new LodChunkTracker(generator, {
      chunkWorldSize,
      numLods,
    });

    const chunksMesh = generator.getChunks();
    app.add(chunksMesh);
    chunksMesh.updateMatrixWorld();

    cleanupFns.push(() => {
      tracker.destroy();
    });
  })();

  useFrame(({timestamp, timeDiff}) => {
    if (tracker) {
      const localPlayer = useLocalPlayer();
      tracker.update(localPlayer.position);
    }
    generator && generator.update(timestamp, timeDiff);
  });

  // callbacks

  app.getPhysicsObjects = () => generator ? generator.getPhysicsObjects() : [];

  return app;
};
