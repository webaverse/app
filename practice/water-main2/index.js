import metaversefile from 'metaversefile';
// import { useSyncExternalStore } from 'react';
import * as THREE from 'three';
// import { terrainVertex, terrainFragment } from './shaders/terrainShader.js';
// import biomeSpecs from './biomes.js';

const {
  useApp,
  useLocalPlayer,
  // useScene,
  // useRenderer,
  useFrame,
  // useMaterials,
  useCleanup,
  usePhysics,
  useLoaders,
  useInstancing,
  useProcGenManager,
  useInternals,
  useRenderSettings,
  // useLodder,
} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
const textureLoader = new THREE.TextureLoader();
const bubbleTexture1 = textureLoader.load(`${baseUrl}/textures/Bubble3.png`);
const noiseCircleTexture = textureLoader.load(`${baseUrl}/textures/noiseCircle.png`);
const noiseTexture = textureLoader.load(`${baseUrl}/textures/perlin-noise.jpg`);
const noiseTexture2 = textureLoader.load(`${baseUrl}/textures/noise.jpg`);
const noiseMap = textureLoader.load(`${baseUrl}/textures/noise.jpg`);
noiseMap.wrapS = noiseMap.wrapT = THREE.RepeatWrapping;
const noiseMap3 = textureLoader.load(`${baseUrl}/textures/noise3.png`);
const splashTexture = textureLoader.load(`${baseUrl}/textures/splash1.png`);
const splashTexture2 = textureLoader.load(`${baseUrl}/textures/splash2.png`);
const splashTexture4 = textureLoader.load(`${baseUrl}/textures/splash.png`);
const rippleTexture = textureLoader.load(`${baseUrl}/textures/ripple3.png`);
rippleTexture.wrapS = rippleTexture.wrapT = THREE.RepeatWrapping;

const waterNormalTexture1 = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`);
waterNormalTexture1.wrapS = waterNormalTexture1.wrapT = THREE.RepeatWrapping;
const waterNormalTexture2 = textureLoader.load(`${baseUrl}/textures/waterNormal3.png`);
waterNormalTexture2.wrapS = waterNormalTexture2.wrapT = THREE.RepeatWrapping;


const waterDerivativeHeightTexture = textureLoader.load(`${baseUrl}/textures/water-derivative-height.png`);
waterDerivativeHeightTexture.wrapS = waterDerivativeHeightTexture.wrapT = THREE.RepeatWrapping;
const waterNormalTexture = textureLoader.load(`${baseUrl}/textures/water-normal.png`);
waterNormalTexture.wrapS = waterNormalTexture.wrapT = THREE.RepeatWrapping;
const waterNoiseTexture = textureLoader.load(`${baseUrl}/textures/perlin-noise.jpg`);
waterNoiseTexture.wrapS = waterNoiseTexture.wrapT = THREE.RepeatWrapping;
const flowmapTexture = textureLoader.load(`${baseUrl}/textures/flowmap.png`);
flowmapTexture.wrapS = flowmapTexture.wrapT = THREE.RepeatWrapping;
//
const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
// const localColor = new THREE.Color();
const localSphere = new THREE.Sphere();
// const localBox = new THREE.Box3();

// const zeroVector = new THREE.Vector3();

//

const procGenManager = useProcGenManager();
const chunkWorldSize = procGenManager.chunkSize;
const terrainSize = chunkWorldSize * 4;
const chunkRadius = Math.sqrt(chunkWorldSize * chunkWorldSize * 3);
const numLods = 1;
const bufferSize = 20 * 1024 * 1024;

// const textureLoader = new THREE.TextureLoader();
const abortError = new Error('chunk disposed');
abortError.isAbortError = true;
const fakeMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
});

class ChunkRenderData {
  constructor(meshData, geometryBuffer) {
    this.meshData = meshData;
    this.geometryBuffer = geometryBuffer;
  }
}

//

const textureUrls = {
  Base_Color: `${baseUrl}Vol_36_3_Water_Base_Color.png`,
};
const textureNames = Object.keys(textureUrls);
/* const biomesPngTexturePrefix = `/images/stylized-textures/png/`;
const biomesKtx2TexturePrefix = `/images/land-textures/`;
const neededTexturePrefixes = (() => {
  const neededTexturePrefixesSet = new Set();
  for (const biomeSpec of biomeSpecs) {
    const [name, colorHex, textureName] = biomeSpec;
    neededTexturePrefixesSet.add(textureName);
  }
  const neededTexturePrefixes = Array.from(neededTexturePrefixesSet);
  return neededTexturePrefixes;
})();
const texturesPerRow = Math.ceil(Math.sqrt(neededTexturePrefixes.length)); */

const { BatchedMesh, GeometryAllocator } = useInstancing();
class WaterMesh extends BatchedMesh {
  constructor({ procGenInstance, physics, biomeUvDataTexture, textures }) {
    const allocator = new GeometryAllocator(
      [
        {
          name: 'position',
          Type: Float32Array,
          itemSize: 3,
        },
        {
          name: 'normal',
          Type: Float32Array,
          itemSize: 3,
        },
        {
          name: 'biome',
          Type: Int32Array,
          itemSize: 1,
        },
      ],
      {
        bufferSize,
        boundingType: 'sphere',
      }
    );
    const {geometry} = allocator;

    const lightMapper = procGenInstance.getLightMapper();
    // lightMapper.addEventListener('update', e => {
    //   const {coord} = e.data;
    //   material.uniforms.uLightBasePosition.value.copy(coord);
    //   material.uniforms.uLightBasePosition.needsUpdate = true;
    // });

    const material = new THREE.MeshStandardMaterial( { color: 0xff0000, side: THREE.DoubleSide, transparent:true, opacity:0.9, depthWrite:false, blending:THREE.AdditiveBlending} );
    super(geometry, material, allocator);
    this.frustumCulled = false;

    this.procGenInstance = procGenInstance;
    this.physics = physics;
    this.allocator = allocator;
    this.physicsObjects = [];

    this.lightMapper = lightMapper;

    this.localVector5 = new THREE.Vector3();
  }
  async addChunk(chunk, { signal }) {
    const renderData = await this.getChunkRenderData(chunk, signal);
    this.drawChunk(chunk, renderData, signal);
  }
  async getChunkRenderData(chunk, signal) {
    const meshData =
      await this.procGenInstance.dcWorkerManager.generateLiquidChunk(
        chunk,
        chunk.lodArray,
        {
          signal,
        }
      );
    if (meshData) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(meshData.positions, 3)
      );
      geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));


      const physicsMesh = new THREE.Mesh(geometry, fakeMaterial);

      const geometryBuffer = await this.physics.cookGeometryAsync(physicsMesh, {
        signal,
      });
      return new ChunkRenderData(meshData, geometryBuffer);
    } else {
      return null;
    }
  }
  drawChunk(chunk, renderData, signal) {
    if (renderData) {
      // non-empty chunk
      const { meshData, geometryBuffer } = renderData;
      const _mapOffsettedIndices = (
        srcIndices,
        dstIndices,
        dstOffset,
        positionOffset
      ) => {
        const positionIndex = positionOffset / 3;
        for (let i = 0; i < srcIndices.length; i++) {
          dstIndices[dstOffset + i] = srcIndices[i] + positionIndex;
        }
      };
      const _renderMeshDataToGeometry = (
        meshData,
        geometry,
        geometryBinding
      ) => {
        let positionOffset = geometryBinding.getAttributeOffset('position');
        let normalOffset = geometryBinding.getAttributeOffset('normal');
        let biomeOffset = geometryBinding.getAttributeOffset('biome');
        let indexOffset = geometryBinding.getIndexOffset();

        _mapOffsettedIndices(
          meshData.indices,
          geometry.index.array,
          indexOffset,
          positionOffset
        );

        geometry.attributes.position.update(
          positionOffset,
          meshData.positions.length,
          meshData.positions,
          0
        );
        geometry.attributes.normal.update(
          normalOffset,
          meshData.normals.length,
          meshData.normals,
          0
        );
        geometry.attributes.biome.update(
          biomeOffset,
          meshData.biomes.length,
          meshData.biomes,
          0
        );
        geometry.index.update(indexOffset, meshData.indices.length);
      };
      const _handleMesh = () => {
        localSphere.center
          .set(
            (chunk.x + 0.5) * chunkWorldSize,
            (chunk.y + 0.5) * chunkWorldSize,
            (chunk.z + 0.5) * chunkWorldSize
          )
          .applyMatrix4(this.matrixWorld);
        localSphere.radius = chunkRadius;
        const geometryBinding = this.allocator.alloc(
          meshData.positions.length,
          meshData.indices.length,
          localSphere
        );
        _renderMeshDataToGeometry(
          meshData,
          this.allocator.geometry,
          geometryBinding
        );

        // signal.addEventListener('abort', (e) => {
        //   this.allocator.free(geometryBinding);
        // });
      };
      _handleMesh();

      const _handlePhysics = async () => {
        this.matrixWorld.decompose(localVector, localQuaternion, localVector2);
        const physicsObject = this.physics.addCookedGeometry(
          geometryBuffer,
          localVector,
          localQuaternion,
          localVector2
        );
        this.physicsObjects.push(physicsObject);


        this.physics.disableGeometryQueries(physicsObject);
        physicsObject.coord = chunk;
        physicsObject.positions = meshData.positions;
        physicsObject.center = new THREE.Vector3().set(
          (chunk.x + 0.5) * chunkWorldSize,
          (chunk.y + 0.5) * chunkWorldSize,
          (chunk.z + 0.5) * chunkWorldSize
        ).applyMatrix4(this.matrixWorld);

        
        signal.addEventListener('abort', (e) => {
          this.physics.removeGeometry(physicsObject);
          this.physicsObjects.splice(
            this.physicsObjects.indexOf(physicsObject),
            1
          );
        });
      };
      _handlePhysics();
    }
  }
  updateCoord(min2xCoord) {
    // XXX only do this on light mapper update
    // XXX needs to apply to the terrain mesh too, though the terrain mesh is driving the lighting (maybe rethink this)
    // XXX create a new lighting app which tracks the lighting only
    // XXX maybe do the same for hte heightfield?
    if (this.lightMapper.updateCoord(min2xCoord)) {
      this.material.uniforms.uLightBasePosition.value.copy(
        this.lightMapper.lightBasePosition
      );
      this.material.uniforms.uLightBasePosition.needsUpdate = true;
    }
  }
}

class WaterChunkGenerator {
  constructor({
    procGenInstance,
    physics,
    // biomeUvDataTexture,
    textures,
  } = {}) {
    // parameters
    this.procGenInstance = procGenInstance;
    this.physics = physics;
    // this.biomeUvDataTexture = biomeUvDataTexture;
    this.textures = textures;

    // mesh
    this.object = new THREE.Group();
    this.object.name = 'water';

    this.waterMesh = new WaterMesh({
      procGenInstance: this.procGenInstance,
      physics: this.physics,
      // biomeUvDataTexture: this.biomeUvDataTexture,
      textures: this.textures,
    });
    this.object.add(this.waterMesh);
  }

  getMeshes() {
    return this.object.children;
  }
  getPhysicsObjects() {
    return this.waterMesh.physicsObjects;
  }

  async generateChunk(chunk) {
    const signal = this.bindChunk(chunk);

    try {
      await this.waterMesh.addChunk(chunk, {
        signal,
      });
    } catch (err) {
      if (!err?.isAbortError) {
        console.warn(err);
      }
    }
  }
  disposeChunk(chunk) {
    const binding = chunk.binding;
    if (binding) {
      const { abortController } = binding;
      abortController.abort(abortError);

      chunk.binding = null;
    }
  }
  async relodChunk(oldChunk, newChunk) {
    // console.log('relod chunk', oldChunk, newChunk);

    try {
      const oldAbortController = oldChunk.binding.abortController;
      const newSignal = this.bindChunk(newChunk);

      const abortOldChunk = (e) => {
        oldAbortController.abort(abortError);
      };
      newSignal.addEventListener('abort', abortOldChunk);

      const renderData = await this.waterMesh.getChunkRenderData(
        newChunk,
        newSignal
      );

      newSignal.removeEventListener('abort', abortOldChunk);

      this.disposeChunk(oldChunk);
      this.waterMesh.drawChunk(newChunk, renderData, newSignal);
    } catch (err) {
      if (err !== abortError) {
        console.warn(err);
      }
    }
  }

  bindChunk(chunk) {
    const abortController = new AbortController();
    const { signal } = abortController;

    chunk.binding = {
      abortController,
    };

    return signal;
  }

  update(timestamp, timeDiff) {
    for (const mesh of this.getMeshes()) {
      //console.log(mesh.physicsObjects)
      //mesh.update(timestamp, timeDiff);
    }
  }

  destroy() {
    // nothing; the owning lod tracker disposes of our contents
  }
}

export default (e) => {
  const app = useApp();
  const {renderer, camera, scene, rootScene} = useInternals();
  const localPlayer = useLocalPlayer();
  const renderSettings = useRenderSettings();
  const physics = usePhysics();
  const procGenManager = useProcGenManager();

  const seed = app.getComponent('seed') ?? null;
  let range = app.getComponent('range') ?? null;
  const wait = app.getComponent('wait') ?? false;
  if (range) {
    range = new THREE.Box3(
      new THREE.Vector3(range[0][0], range[0][1], range[0][2]),
      new THREE.Vector3(range[1][0], range[1][1], range[1][2])
    );
  }

  app.name = 'water';

  let water = null;
  let waterPhysicsId = null;
  const waterSurfacePos = new THREE.Vector3(0, 10000, 0);
  const cameraWaterSurfacePos = new THREE.Vector3(0, 10000, 0);
  let contactWater = false;
  //let wholeBelowwWater = false;
  let floatOnWater = false;
  let cameraDir = new THREE.Vector3();
  let playerDir = new THREE.Vector3();
  const playerHeadPos = new THREE.Vector3();
  let currentSpeed = 0;
  let fallindSpeed = 0;

  //############################################################# trace camera player direction and speed ########################################################################
  {
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    useFrame(() => {
        localVector.set(0, 0, -1);
        cameraDir = localVector.applyQuaternion( camera.quaternion );
        cameraDir.normalize();

        localVector2.set(0, 0, -1);
        playerDir = localVector2.applyQuaternion( localPlayer.quaternion );
        playerDir.normalize();
        
        fallindSpeed= 0 - localPlayer.characterPhysics.velocity.y;
        if(localPlayer.avatar){
            currentSpeed = localVector.set(localPlayer.avatar.velocity.x, 0, localPlayer.avatar.velocity.z).length();
            playerHeadPos.setFromMatrixPosition(localPlayer.avatar.modelBoneOutputs.Head.matrixWorld);
        }
            
        
    });
  }

  {
    let live = true;
    let generator = null;
    let tracker = null;
    e.waitUntil(
      (async () => {
        const texturesArray = await Promise.all(textureNames.map(async k => {
          const u = textureUrls[k];
          const img = new Image();
          await new Promise((accept, reject) => {
            img.onload = () => {
              accept();
            };
            img.onerror = reject;
            img.crossOrigin = 'Anonymous';
            img.src = u;
          });
          const texture = new THREE.Texture(img);
          texture.transparent = true;
          return texture;
        }));
        if (!live) return;
  
        const textures = {};
        for (let i = 0; i < textureNames.length; i++) {
          textures[textureNames[i]] = texturesArray[i];
        }
        const procGenInstance = procGenManager.getInstance(seed, range);
  
        generator = new WaterChunkGenerator({
          procGenInstance,
          physics,
          // biomeUvDataTexture,
          textures,
        });
        tracker = procGenInstance.getChunkTracker({
          numLods,
          trackY: true,
          relod: true,
        });
  
        tracker.addEventListener('coordupdate', coordupdate);
        tracker.addEventListener('chunkadd', chunkadd);
        tracker.addEventListener('chunkremove', chunkremove);
        tracker.addEventListener('chunkrelod', chunkrelod);
  
        if (wait) {
          await new Promise((accept, reject) => {
            tracker.addEventListener('update', () => {
              accept();
            }, {
              once: true,
            });
          });
        }
        app.add(generator.object);
        generator.object.updateMatrixWorld();
      })()
    );
  
    // app.getPhysicsObjects = () => generator ? generator.getPhysicsObjects() : [];
  
    const coordupdate = (e) => {
      const {coord} = e.data;
      generator.waterMesh.updateCoord(coord);
    };
    const chunkadd = (e) => {
      const {chunk, waitUntil} = e.data;
      waitUntil(generator.generateChunk(chunk));
    };
    const chunkremove = (e) => {
      const {chunk} = e.data;
      generator.disposeChunk(chunk);
    };
    const chunkrelod = (e) => {
      const {oldChunk, newChunk} = e.data;
      generator.relodChunk(oldChunk, newChunk);
    };
  
    
  
    const localVector01 = new THREE.Vector3();
    const localVector02 = new THREE.Vector3();
    const localVector03 = new THREE.Vector3();
    
  
    let qt = new THREE.Quaternion();
    let mx = new THREE.Matrix4();
    let qt2 = new THREE.Quaternion();
    let mx2 = new THREE.Matrix4();
    let upVector = new THREE.Vector3(0, 1, 0);
    let tempPos = new THREE.Vector3();
    let tempIndex = new THREE.Vector3();
    let tempPhysics = null;
  
    const downVector = new THREE.Quaternion();
    downVector.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -Math.PI / 2 );
  
    useFrame(({timestamp, timeDiff}) => {
      if (!!tracker && !range) {
        localMatrix
          .copy(localPlayer.matrixWorld)
          .premultiply(localMatrix2.copy(app.matrixWorld).invert())
          .decompose(localVector, localQuaternion, localVector2);
        tracker.update(localVector);
  
        if(generator && localPlayer.avatar){
          let isOnSurface = false;
          let min = null;
          tempPhysics = null;
          localVector02.set(localPlayer.position.x, localPlayer.position.y - localPlayer.avatar.height, localPlayer.position.z);
          
          for(const physicsId of generator.getPhysicsObjects()){ 
            if(!isOnSurface){
                generator.physics.enableGeometryQueries(physicsId);
                localVector03.set(localPlayer.position.x, localPlayer.position.y, localPlayer.position.z);
                const result3 = physics.raycast(localVector03, downVector);
                if(result3){
                  if(result3.objectId === physicsId.physicsId && result3.distance <= localPlayer.avatar.height){
                    waterSurfacePos.set(result3.point[0], result3.point[1], result3.point[2]);
                    cameraWaterSurfacePos.set(result3.point[0], result3.point[1], result3.point[2]);
                    isOnSurface = true;
                  }
                }
                generator.physics.disableGeometryQueries(physicsId);
            }
            
            //if(physicsId.center.distanceTo(localPlayer.position) <= chunkRadius){
              for(let i = 0; i < physicsId.positions.length; i++){
                tempPos.set(physicsId.positions[i * 3 + 0], physicsId.positions[i * 3 + 1], physicsId.positions[i * 3 + 2]);
                if(!min || tempPos.distanceTo(localVector02) < min){
                  min = tempPos.distanceTo(localVector02);
                  tempIndex.set(tempPos.x, tempPos.y, tempPos.z);
                  tempPhysics = physicsId;
                }
              }
            //}
          }
  
          contactWater = true;
          if(generator.getPhysicsObjects().length < 1){
            //console.log('outside')
            contactWater = false;
          }
          else if(tempPhysics){
            generator.physics.enableGeometryQueries(tempPhysics);

            localVector01.set(tempIndex.x, tempIndex.y, tempIndex.z);

            mx.lookAt(localVector02, localVector01, upVector);
            qt.setFromRotationMatrix(mx);
            let result = generator.physics.raycast(localVector02, qt);

            mx2.lookAt(localVector01, localVector02, upVector);
            qt2.setFromRotationMatrix(mx2);
            let result2 = generator.physics.raycast(localVector01, qt2);

            if(result){
                //console.log(result.objectId, tempPhysics.physicsId)
                if(result2){
                  //console.log('outside', result2.objectId)
                  contactWater = false;
                }
            }
            else{
                contactWater = false;
            }
  
            generator.physics.disableGeometryQueries(tempPhysics);
          }
          
  
          if(!contactWater){
              if(localPlayer.hasAction('swim')){
                  //console.log('remove');
                  localPlayer.removeAction('swim');
              }
          }
          else{
              if(waterSurfacePos.y >= localPlayer.position.y - localPlayer.avatar.height + localPlayer.avatar.height * 0.8){
                  if(!localPlayer.hasAction('swim')){
                      //console.log('add');
                      const swimAction = {
                          type: 'swim',
                          onSurface: false,
                      };
                      localPlayer.setControlAction(swimAction);
                  }
  
                  if(waterSurfacePos.y < localPlayer.position.y - localPlayer.avatar.height + localPlayer.avatar.height * 0.85){
                      if(localPlayer.hasAction('swim'))
                          localPlayer.getAction('swim').onSurface = true;
                      
                  }
                  else{
                      if(localPlayer.hasAction('swim'))
                          localPlayer.getAction('swim').onSurface = false;
                  }
              }
              else{
                  if(localPlayer.hasAction('swim')){
                      //console.log('remove');
                      localPlayer.removeAction('swim');
                  }
              }
          }
          if(!localPlayer.hasAction('swim') && !isOnSurface){
            contactWater = false;
            if(localPlayer.hasAction('swim')){
                //console.log('remove');
                localPlayer.removeAction('swim');
            }
          }
        }
      }
    });
  
    useCleanup(() => {
      live = false;
      if (tracker) {
        tracker.destroy();
      }
    });
  }
 //#################################################################### underwater mask ###################################################################
 {
        
    // const color = 0xFF0000;
    // const density = 0.1;
    // rootScene.fog = new THREE.FogExp2(color, 1);
    // rootScene.updateMatrixWorld();
    
    //rootScene.fog = new THREE.FogExp2(new THREE.Color(0/255, 5/255, 10/255).getHex(), 0.1);
    
    
    
    
    const geometry = new THREE.PlaneGeometry( 2, 2 );
    const material= new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            cameraWaterSurfacePos:{
                value: new THREE.Vector3()
            },
            contactWater:{
                value: false
            }
        },
        vertexShader: `\
            
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
            uniform float uTime;
            
            varying vec2 vUv;
            varying vec3 vPos;
            
            void main() {
                vUv = uv;
              
                
                vec3 pos = position;
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
        
                gl_Position = projectionPosition;
                vPos = modelPosition.xyz;
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `\
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform float uTime;
            uniform bool contactWater;
            //uniform sampler2D sphereTexture;
            uniform vec3 cameraWaterSurfacePos;
            
            varying vec2 vUv;
            varying vec3 vPos;
            

            void main() {
                gl_FragColor = vec4(0.1, 0.15, 0.2, 0.8);
                if(!contactWater || vPos.y > cameraWaterSurfacePos.y)
                    gl_FragColor.a = 0.;
            ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        //blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const mask = new THREE.Mesh( geometry, material );
    //app.add( mask );
    camera.add(mask);

    useFrame(({timestamp}) => {
      
        // mask.position.set(camera.position.x + cameraDir.x * 0.4, camera.position.y, camera.position.z + cameraDir.z * 0.4); 
        // mask.rotation.copy(camera.rotation);  
        mask.position.set(0, 0, -0.2);
        mask.material.uniforms.uTime.value = timestamp / 1000;
        mask.material.uniforms.cameraWaterSurfacePos.value.copy(cameraWaterSurfacePos);
        mask.material.uniforms.contactWater.value = contactWater;
        if(camera.position.y < cameraWaterSurfacePos.y && contactWater){
            if(renderSettings.findRenderSettings(scene))
                renderSettings.findRenderSettings(scene).fog.density = 0.07;
        }
        else{
            if(renderSettings.findRenderSettings(scene))
                renderSettings.findRenderSettings(scene).fog.density = 0;
        }
        app.updateMatrixWorld();
    
    });
  }
  //################################################################ bubble ###########################################################
  {
    const particleCount = 40;
    let info = {
        velocity: [particleCount],
        offset: [particleCount],
        lastTime:[particleCount]
    }
    
    const _getGeometry = geometry => {
        //console.log(geometry)
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
        geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(particleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);

        const color = new Float32Array(particleCount * 3);
        const colorAttribute = new THREE.InstancedBufferAttribute(color, 3);
        geometry2.setAttribute('color', colorAttribute);
        // const quaternions = new Float32Array(particleCount * 4);
        // for (let i = 0; i < particleCount; i++) {
        //   identityQuaternion.toArray(quaternions, i * 4);
        // }
        // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
        // geometry2.setAttribute('quaternions', quaternionsAttribute);

        const scales = new Float32Array(particleCount);
        const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
        geometry2.setAttribute('scales', scalesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const startTimeAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        startTimeAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('startTime', startTimeAttribute);
    
        
        const offset = new Float32Array(particleCount * 2);
        const offsetAttribute = new THREE.InstancedBufferAttribute(offset, 2);
        geometry2.setAttribute('offset', offsetAttribute);
        

        return geometry2;
    };

    const material= new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            cameraBillboardQuaternion: {
                value: new THREE.Quaternion(),
            },
            bubbleTexture1: {
                value: bubbleTexture1,
            },
        },
        vertexShader: `\
            
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
            
            uniform float uTime;
            uniform vec4 cameraBillboardQuaternion;
            
            
            varying vec2 vUv;
            varying vec3 vPos;
            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vOffset;
            

            attribute vec3 positions;
            attribute vec3 color;
            attribute float scales;
            attribute float opacity;
            attribute vec2 offset;
            

            vec3 rotateVecQuat(vec3 position, vec4 q) {
                vec3 v = position.xyz;
                return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
            }
            void main() {
                vUv = uv;
                vPos = position;
                // vOpacity = opacity;
                // vColor = color;
                vOffset = offset;
                vec3 pos = position;
                pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                pos*=scales;
                pos+=positions;
                //pos = qtransform(pos, quaternions);
                //pos.y=cos(uTime/100.);
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
        
                gl_Position = projectionPosition;
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `\
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform float uTime;
            uniform sampler2D bubbleTexture1;
            varying vec2 vUv;
            varying vec3 vPos;
            varying vec3 vColor;
            varying float vOpacity;
            varying vec2 vOffset;

            void main() {
                vec4 bubble = texture2D(
                                bubbleTexture1,
                                vec2(
                                    vUv.x / 6. + vOffset.x,
                                    vUv.y / 5. + vOffset.y
                                )
                );
                gl_FragColor = bubble;
                gl_FragColor.a *= 0.5;
            ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        //blending: 1,

    });
    let mesh = null;
    function addInstancedMesh() {
        const geometry2 = new THREE.PlaneGeometry( .02, .02 );
        const geometry = _getGeometry(geometry2);
        mesh = new THREE.InstancedMesh(geometry, material, particleCount);
        const positionsAttribute = mesh.geometry.getAttribute('positions');
        for (let i = 0; i < particleCount; i++) {
            positionsAttribute.setXYZ(i, localPlayer.position.x + Math.random() * 5, localPlayer.position.y + Math.random() * 5, localPlayer.position.z + Math.random() * 5);
            info.velocity[i] = new THREE.Vector3();
            
        }
        positionsAttribute.needsUpdate = true;
        app.add(mesh);
    }
    addInstancedMesh();
        
    const bubblePos = new THREE.Vector3();
    
    const localVector = new THREE.Vector3();
    let maxEmmit = 5;
    let lastEmmitTime = 0;
    useFrame(({timestamp}) => {
        if (mesh && localPlayer.avatar) {
            let currentEmmit = 0;
            //console.log(Math.floor(currentSpeed * 10 + 1))
            const opacityAttribute = mesh.geometry.getAttribute('opacity');
            const offsetAttribute = mesh.geometry.getAttribute('offset');
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            const scalesAttribute = mesh.geometry.getAttribute('scales');
            const startTimeAttribute = mesh.geometry.getAttribute('startTime');
            const colorAttribute = mesh.geometry.getAttribute('color');
            if(timestamp - lastEmmitTime > 100 && contactWater){
                for (let i = 0; i < Math.floor(currentSpeed * 10 + 1) * 5; i++){
                    bubblePos.set(positionsAttribute.getX(i), positionsAttribute.getY(i), positionsAttribute.getZ(i));
                    if(scalesAttribute.getX(i) <= 0){
                        
                        if(currentSpeed > 0.1){
                            // playerHeadPos.x += -playerDir.x * 0.25;
                            // playerHeadPos.z += -playerDir.z * 0.25;
                            playerHeadPos.x += (Math.random() - 0.5) * 0.5;
                            playerHeadPos.y + (Math.random() - 0.5) * 0.2;
                            playerHeadPos.z += (Math.random() - 0.5) * 0.5;
                            info.velocity[i].x = -playerDir.x * 0.005;
                            info.velocity[i].y = 0.0025 + Math.random() * 0.0025;
                            info.velocity[i].z = -playerDir.z * 0.005;
                        }
                        else{
                            playerHeadPos.x += -playerDir.x * 0.25;
                            playerHeadPos.z += -playerDir.z * 0.25;
                            playerHeadPos.x += (Math.random() - 0.5) * 0.5;
                            playerHeadPos.z += (Math.random() - 0.5) * 0.5;
                            playerHeadPos.y -= localPlayer.avatar.height * 0.6;
                            playerHeadPos.y += (Math.random()) * 0.2
                            info.velocity[i].x = 0;
                            info.velocity[i].y = 0.0025 + Math.random() * 0.0025;
                            info.velocity[i].z = 0;
                            
                        }
                        if(playerHeadPos.y > waterSurfacePos.y)
                            playerHeadPos.y = waterSurfacePos.y;
                        positionsAttribute.setXYZ(i, playerHeadPos.x , playerHeadPos.y, playerHeadPos.z);
                        
                        
                        

                        info.offset[i] = Math.floor(Math.random() * 29);
                        info.lastTime[i] = (50 + Math.random() * 50);
                        startTimeAttribute.setX(i, 0);
                        scalesAttribute.setX(i, Math.random());
                        if(currentSpeed <= 0.1 && !localPlayer.hasAction('swim')){
                            scalesAttribute.setX(i, 0);
                        }
                        currentEmmit++;
                    }
                    if(currentEmmit > maxEmmit){
                        lastEmmitTime = timestamp;
                        break;
                    }
                    
                }
            }
            
            for (let i = 0; i < particleCount; i++){
                if(positionsAttribute.getY(i) >= waterSurfacePos.y - 0.01){
                    info.velocity[i].y = 0;
                }
                positionsAttribute.setXYZ(  i, 
                                            positionsAttribute.getX(i)+info.velocity[i].x,
                                            positionsAttribute.getY(i)+info.velocity[i].y,
                                            positionsAttribute.getZ(i)+info.velocity[i].z
                );
                
                startTimeAttribute.setX(i, startTimeAttribute.getX(i) + 1);
                if(startTimeAttribute.getX(i) % 2 === 0)
                    info.offset[i] += 1;
                if(info.offset[i] >= 30){
                    info.offset[i] = 0;
                }
                offsetAttribute.setXY(i, (5 / 6) - Math.floor(info.offset[i] / 6) * (1. / 6.), Math.floor(info.offset[i] % 5) * 0.2);
                if(scalesAttribute.getX(i) > 0)
                    scalesAttribute.setX(i, scalesAttribute.getX(i) + 0.01);
                if(startTimeAttribute.getX(i) > info.lastTime[i] || positionsAttribute.getY(i) > waterSurfacePos.y){
                    scalesAttribute.setX(i, 0);
                }
            }
            
            mesh.instanceMatrix.needsUpdate = true;
            positionsAttribute.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            startTimeAttribute.needsUpdate = true;
            offsetAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
            
            
            mesh.material.uniforms.uTime.value=timestamp/1000;
            mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
            
            

        }
        app.updateMatrixWorld();
    
    });
  }
  //################################################################ half circle follow player ###########################################################
  {
    const particleCount = 30;
    //##################################################### get circle geometry #####################################################
    const identityQuaternion = new THREE.Quaternion();
    const _getCircleGeometry = geometry => {
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(particleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);
        const quaternions = new Float32Array(particleCount * 4);
        for (let i = 0; i < particleCount; i++) {
          identityQuaternion.toArray(quaternions, i * 4);
        }
        const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
        geometry2.setAttribute('quaternions', quaternionsAttribute);

        const textureRotation = new Float32Array(particleCount);
        const textureRotAttribute = new THREE.InstancedBufferAttribute(textureRotation, 1);
        geometry2.setAttribute('textureRotation', textureRotAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);

        const scales = new Float32Array(particleCount);
        const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
        geometry2.setAttribute('scales', scaleAttribute);

        const playerRotation = new Float32Array(particleCount);
        const playerRotAttribute = new THREE.InstancedBufferAttribute(playerRotation, 1);
        geometry2.setAttribute('playerRotation', playerRotAttribute);

        const speed = new Float32Array(particleCount);
        const speedAttribute = new THREE.InstancedBufferAttribute(speed, 1);
        geometry2.setAttribute('speed', speedAttribute);

        const rand = new Float32Array(particleCount);
        const randAttribute = new THREE.InstancedBufferAttribute(rand, 1);
        geometry2.setAttribute('random', randAttribute);
    
        return geometry2;
    };

    //##################################################### material #####################################################
    const splashMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            noiseMap:{
                value: noiseMap3
            },
            noiseMap2:{
                value: noiseMap
            },
            noiseCircleTexture: {
                value: noiseCircleTexture,
            },
        },
        vertexShader: `\
            
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
        
            uniform float uTime;
    
            varying vec2 vUv;
            varying vec3 vPos;
            varying float vBroken;
            varying float vOpacity;
            varying float vSpeed;
            varying float vRand;
            varying float vTextureRotation;

            attribute float textureRotation;
            attribute vec3 positions;
            attribute float scales;
            attribute float random;
            attribute float opacity;
            attribute vec4 quaternions;
            attribute float broken;
            attribute float speed;
            attribute float playerRotation;
            vec3 qtransform(vec3 v, vec4 q) { 
              return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
            }
        
            void main() {
                mat3 rotY =
                    mat3(cos(playerRotation), 0.0, -sin(playerRotation), 0.0, 1.0, 0.0, sin(playerRotation), 0.0, cos(playerRotation));
             
            vTextureRotation = textureRotation;    
            vOpacity=opacity;
            vBroken=broken;
            vSpeed=speed;
            vRand=random;
            vUv=uv;
            vPos=position;
            vec3 pos = position;
            pos = qtransform(pos, quaternions);
            pos*=rotY;
            pos*=scales;
            pos+=positions;
            
            vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectionPosition = projectionMatrix * viewPosition;
    
            gl_Position = projectionPosition;
            ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `\
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform float uTime;
            varying float vBroken;
            varying float vOpacity;
            varying float vSpeed;
            varying float vRand;
            varying vec2 vUv;
            varying vec3 vPos;
            varying float vTextureRotation;
            uniform sampler2D noiseMap;
            uniform sampler2D noiseMap2;
            uniform sampler2D noiseCircleTexture;
            //#define PI 3.1415926
            const float rFrequency = 10.0; 
            const float rSpeed = .08;
            const float rThickness = 50.0;
            const float radiusEnd = .45;
            const float radiusStart = .08;
            const float PI = 3.1415926535897932384626433832795;
            //Noise that moves radially outwards via polar coordinates
            float radialNoise(vec2 uv){ 
                //Matches sampling to speed of ripples 
                uv.y -= rSpeed*uTime;

                
                
                const int octaves = 2;
                //Increasing scale makes noise more fine-grained
                const float scale = .15;
                //Increasing power makes noise more 'solid' at outer ripple edge    
                float power = 2.2;
                float total = 0.0;
                for(int i = 0; i<octaves; i++){
                    total += texture2D(noiseMap,uv*(power*scale)+vRand).r*(1.0/power);
                    power *=2.0;
                }
                return total;
            }
            
            void main() {
                vec2 uv = vUv;
                
                vec2 center= vec2(.5, .5);
                
                
                vec2 toCenter = uv-center;
                float dist = length(toCenter);
                
                float distScalar = max(0.0,1.0 - dist/radiusEnd);
                float ripple = sin((dist-rSpeed)*rFrequency);
                ripple = max(0.0,ripple);
                ripple = pow(ripple,rThickness);
                ripple = (dist>radiusStart) ? ripple*distScalar : 0.0;
                
                
                float angle = atan(toCenter.x,toCenter.y);
                angle = (angle + PI) / (2.0 * PI);
                float noise = radialNoise(vec2(angle,dist));
                
                
                float total = ripple;
                total -= noise;
                total = total < vRand/10. ? 0.0 : 1.0;
                
                gl_FragColor = vec4(total);

                float mid = 0.5;
                vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) * 1.1 - sin(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + mid,
                            cos(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + sin(vTextureRotation*PI) * (vUv.x - mid) * 1.1 + mid);
                if(vSpeed>0.1){
                    if(vUv.y<0.45){
                        gl_FragColor.a=0.;
                    }
                }
                gl_FragColor.a*=vOpacity;     
               
                vec3 noise2 = texture2D(
                                    noiseMap2,
                                    rotated
                ).rgb;
                
                
                float broken = abs( sin( 1.0 - vBroken ) ) - noise2.g;
                if ( broken < 0.0001 ) discard;
                
            ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        
    });
    
   

    

    //##################################################### object #####################################################
    let rippleMesh=null;
    let quaternion = new THREE.Quaternion();
    
    const addInstancedMesh2=()=>{
        const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
        const geometry =_getCircleGeometry(geometry2)
        rippleMesh = new THREE.InstancedMesh(
            geometry,
            splashMaterial,
            particleCount
        );
        //dropletRipplegroup.add(rippleMesh);
        app.add(rippleMesh);
        
        const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
        for (let i = 0; i < particleCount; i++) {
            quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
            quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
        }
        quaternionsAttribute.needsUpdate = true;
    }
    addInstancedMesh2();
    app.updateMatrixWorld();
   
    let currentIndex=0;
    let lastEmmitTime=0;
    let localVector = new THREE.Vector3();
    useFrame(({timestamp}) => {
        
        if(currentIndex>=particleCount){
            currentIndex=0;
        }
        
        
        if (rippleMesh) {
            const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
            const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
            const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
            const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
            const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
            const speedAttribute = rippleMesh.geometry.getAttribute('speed');
            const playerRotationAttribute = rippleMesh.geometry.getAttribute('playerRotation');
            const randAttribute = rippleMesh.geometry.getAttribute('random');
            const textureRotationAttribute = rippleMesh.geometry.getAttribute('textureRotation');
            for (let i = 0; i < particleCount; i++) {
                if(brokenAttribute.getX(i) < 0.15){
                    const opacityOfCircle = currentSpeed > 0.3 ? 0.1 : 0.04;
                    opacityAttribute.setX(i,opacityAttribute.getX(i) + opacityOfCircle);
                }
                else{
                    opacityAttribute.setX(i,opacityAttribute.getX(i)-0.013);
                }
                
                scalesAttribute.setX(i,scalesAttribute.getX(i)+0.1*(currentSpeed+0.3));
                if(brokenAttribute.getX(i)<1)
                    brokenAttribute.setX(i, brokenAttribute.getX(i)+0.01);
                

            }
            if(timestamp - lastEmmitTime > 150 * Math.pow((1.1-currentSpeed),0.3)  && currentSpeed>0.005 && contactWater){
                if(
                    (localPlayer.hasAction('swim') && localPlayer.getAction('swim').onSurface)
                    ||(!localPlayer.hasAction('swim') && waterSurfacePos.y >= localPlayer.position.y - localPlayer.avatar.height + localPlayer.avatar.height * 0.3)
                ){
                    if(localPlayer.rotation.x!==0){
                        playerRotationAttribute.setX(currentIndex,Math.PI+localPlayer.rotation.y);
                    }
                    else{
                        playerRotationAttribute.setX(currentIndex,-localPlayer.rotation.y);
                    }
                    speedAttribute.setX(currentIndex,currentSpeed);
                    brokenAttribute.setX(currentIndex,0.1);
                    scalesAttribute.setX(currentIndex,1.5+Math.random()*0.1);
                    opacityAttribute.setX(currentIndex, 0.1);
                    if(currentSpeed > 0.1){
                        positionsAttribute.setXYZ(
                            currentIndex,
                            localPlayer.position.x + 0.25 * playerDir.x + (Math.random() - 0.5) * 0.1, 
                            waterSurfacePos.y, 
                            localPlayer.position.z + 0.25 * playerDir.z + (Math.random() - 0.5) * 0.1
                        );
                    }
                    else{
                        positionsAttribute.setXYZ(
                            currentIndex,
                            localPlayer.position.x - 0.05 * playerDir.x, 
                            waterSurfacePos.y, 
                            localPlayer.position.z - 0.05 * playerDir.z
                        );
                    }
                    
                    randAttribute.setX(currentIndex, Math.random() * 0.5);
                    textureRotationAttribute.setX(currentIndex, Math.random() * 2);
                    currentIndex++;
                    lastEmmitTime=timestamp;
                }
                
            }
            
            positionsAttribute.needsUpdate = true;
            randAttribute.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            speedAttribute.needsUpdate = true;
            brokenAttribute.needsUpdate = true;
            textureRotationAttribute.needsUpdate = true;
            quaternionsAttribute.needsUpdate = true;
            playerRotationAttribute.needsUpdate = true;
            rippleMesh.material.uniforms.uTime.value=timestamp/1000;

        }
        app.updateMatrixWorld();
        
    });
  }
  //###################################################################### floating splash follow player ######################################################################
  {
    const particleCount = 30;
    //##################################################### get splash geometry #####################################################
    const identityQuaternion = new THREE.Quaternion();
    const _getSplashGeometry = geometry => {
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(particleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);
        const quaternions = new Float32Array(particleCount * 4);
        for (let i = 0; i < particleCount; i++) {
          identityQuaternion.toArray(quaternions, i * 4);
        }
        const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
        geometry2.setAttribute('quaternions', quaternionsAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);

        const scales = new Float32Array(particleCount);
        const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
        geometry2.setAttribute('scales', scaleAttribute);

        const textureRotation = new Float32Array(particleCount);
        const textureRotAttribute = new THREE.InstancedBufferAttribute(textureRotation, 1);
        geometry2.setAttribute('textureRotation', textureRotAttribute);

        return geometry2;
    };

    //##################################################### material #####################################################
    const splashMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            noiseMap:{
                value: noiseMap
            },
            perlinnoise:{
                value: splashTexture
            }
        },
        vertexShader: `\
            
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
        
            uniform float uTime;
    
            varying vec2 vUv;
            varying vec3 vPos;
            varying float vBroken;
            varying float vOpacity;
            varying float vTextureRotation;

            attribute float textureRotation;
            attribute vec3 positions;
            attribute float scales;
            attribute float opacity;
            attribute vec4 quaternions;
            attribute float broken;

            vec3 qtransform(vec3 v, vec4 q) { 
              return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
            }
        
            void main() {
                vTextureRotation = textureRotation;  
                vOpacity=opacity;
                vBroken=broken;
                vUv=uv;
                vPos=position;
                vec3 pos = position;
                pos = qtransform(pos, quaternions);
                //pos*=rotY;
                pos*=scales;
                pos+=positions;
                //pos*=rotX;
                
                
                
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
        
                gl_Position = projectionPosition;
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `\
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform float uTime;
            varying float vBroken;
            varying float vOpacity;
            varying vec2 vUv;
            varying vec3 vPos;
            varying float vTextureRotation;
            uniform sampler2D noiseMap;
            uniform sampler2D perlinnoise;
            #define PI 3.1415926
            void main() {
                float mid = 0.5;
                vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) * 1.1 - sin(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + mid,
                            cos(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + sin(vTextureRotation*PI) * (vUv.x - mid) * 1.1 + mid);
                vec4 splash = texture2D(
                    perlinnoise,
                    rotated
                );
                if(splash.r>0.1){
                    gl_FragColor = vec4(1.0);
                }
                
                gl_FragColor.a*=vOpacity;
                
                
                //float broken = abs( sin( 1.0 - vBroken ) ) - noise2.g;
                float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, rotated ).g;
                if ( broken < 0.0001 ) discard;
                
            ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        //blending: THREE.AdditiveBlending,
        
    });
    
    //##################################################### object #####################################################
    let rippleMesh=null;
    let quaternion = new THREE.Quaternion();
    
    const addInstancedMesh2=()=>{
        const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
        const geometry =_getSplashGeometry(geometry2)
        rippleMesh = new THREE.InstancedMesh(
            geometry,
            splashMaterial,
            particleCount
        );
        app.add(rippleMesh);
        
        const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
        for (let i = 0; i < particleCount; i++) {
            quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
            quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
        }
        quaternionsAttribute.needsUpdate = true;
    }
    addInstancedMesh2();
    app.updateMatrixWorld();
   
   
    let currentIndex=0;
    let lastEmmitTime=0;
    useFrame(({timestamp}) => {
        
        if(currentIndex>=particleCount){
            currentIndex=0;
        }
        
        if (rippleMesh) {
            const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
            const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
            const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
            const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
            const textureRotationAttribute = rippleMesh.geometry.getAttribute('textureRotation');
            for (let i = 0; i < particleCount; i++) {
                scalesAttribute.setX(i,scalesAttribute.getX(i)+0.05*(currentSpeed+0.3));
                if(brokenAttribute.getX(i)<1)
                    brokenAttribute.setX(i, brokenAttribute.getX(i)+0.005);
                

            }
            const emmitDelay = currentSpeed > 0.3 ? 100 : 200;
            if(timestamp - lastEmmitTime > emmitDelay * Math.pow((1.1 - currentSpeed), 0.3)  && currentSpeed > 0.1){
                if(
                    (localPlayer.hasAction('swim') && localPlayer.getAction('swim').onSurface)
                    ||(!localPlayer.hasAction('swim') && contactWater)
                ){
                    const brokenDegree = currentSpeed > 0.3 ? 0.3 + 0.2 * Math.random() : 0.4 + 0.3 * Math.random();
                    brokenAttribute.setX(currentIndex, brokenDegree);
                    scalesAttribute.setX(currentIndex,1.2+Math.random()*0.1);
                    opacityAttribute.setX(currentIndex,0.1);
                    positionsAttribute.setXYZ(
                        currentIndex,
                        localPlayer.position.x + 0.2 * playerDir.x + (Math.random() - 0.5) * 0.1, 
                        waterSurfacePos.y, 
                        localPlayer.position.z + 0.2 * playerDir.z + (Math.random() - 0.5) * 0.1
                    );
                    textureRotationAttribute.setX(currentIndex, Math.random() * 2);
                    currentIndex++;
                    lastEmmitTime=timestamp;
                }
            }
            
            
            positionsAttribute.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            brokenAttribute.needsUpdate = true;
            textureRotationAttribute.needsUpdate = true;
            rippleMesh.material.uniforms.uTime.value=timestamp/1000;

        }
        app.updateMatrixWorld();
        
    });
  }
  //################################################################ freestyle swimming splash ###########################################################
  {
        
    const particleCount = 50;
    let info = {
        velocity: [particleCount],
        acc: [particleCount]
    }
    const group = new THREE.Group();
    //const acc = new THREE.Vector3(0, -0.001, 0);
    
    const _getGeometry = geometry => {
        //console.log(geometry)
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
        geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(particleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);

        const color = new Float32Array(particleCount * 3);
        const colorAttribute = new THREE.InstancedBufferAttribute(color, 3);
        geometry2.setAttribute('color', colorAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);
        
        // const quaternions = new Float32Array(particleCount * 4);
        // for (let i = 0; i < particleCount; i++) {
        //   identityQuaternion.toArray(quaternions, i * 4);
        // }
        // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
        // geometry2.setAttribute('quaternions', quaternionsAttribute);

        const scales = new Float32Array(particleCount);
        const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
        geometry2.setAttribute('scales', scalesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const startTimeAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        startTimeAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('startTime', startTimeAttribute);
    
        const textureRotation = new Float32Array(particleCount);
        const textureRotAttribute = new THREE.InstancedBufferAttribute(textureRotation, 1);
        geometry2.setAttribute('textureRotation', textureRotAttribute);

        return geometry2;
    };

    const material= new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            cameraBillboardQuaternion: {
                value: new THREE.Quaternion(),
            },
            splashTexture: {
                value: splashTexture2,
            },
            waterSurfacePos: {
                value: new THREE.Vector3(),
            },
            noiseMap:{
                value: noiseMap
            },
        },
        vertexShader: `\
            
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
            
            uniform float uTime;
            uniform vec4 cameraBillboardQuaternion;
            
            
            varying vec2 vUv;
            varying vec3 vPos;
            varying vec3 vColor;
            varying float vOpacity;
            varying float vBroken;
            varying float vTextureRotation;

            attribute float textureRotation;
            attribute float broken;
            attribute vec3 positions;
            attribute vec3 color;
            attribute float scales;
            attribute float opacity;
            
            

            vec3 rotateVecQuat(vec3 position, vec4 q) {
                vec3 v = position.xyz;
                return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
            }
            void main() {
                vUv = uv;
                vBroken = broken;
                vTextureRotation = textureRotation;  
                // vOpacity = opacity;
                // vColor = color;
                
                vec3 pos = position;
                pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                pos *= scales;
                pos += positions;
                
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                vPos = modelPosition.xyz;
                gl_Position = projectionPosition;
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `\
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform float uTime;
            uniform sampler2D splashTexture;
            uniform sampler2D noiseMap;
            uniform vec3 waterSurfacePos;
            varying vec2 vUv;
            varying vec3 vPos;
            varying vec3 vColor;
            varying float vOpacity;
            varying float vTextureRotation;
            varying float vBroken;
            #define PI 3.1415926

            void main() {
                float mid = 0.5;
                vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) * 1.1 - sin(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + mid,
                            cos(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + sin(vTextureRotation*PI) * (vUv.x - mid) * 1.1 + mid);
                vec4 splash = texture2D(
                                splashTexture,
                                rotated
                );
                if(splash.r > 0.1){
                    gl_FragColor = vec4(0.6, 0.6, 0.6, 1.0);
                }
                if(vPos.y < waterSurfacePos.y){
                    gl_FragColor.a = 0.;
                }
                //gl_FragColor.a *= 0.5;
                float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, rotated * 0.8 ).g;
                if ( broken < 0.0001 ) discard;
            ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        //blending: THREE.AdditiveBlending,
        depthWrite: false,
        //blending: 1,

    });
    let mesh = null;
    function addInstancedMesh() {
        const geometry2 = new THREE.PlaneGeometry( 0.1, 0.1 );
        const geometry = _getGeometry(geometry2);
        mesh = new THREE.InstancedMesh(geometry, material, particleCount);
        for(let i = 0; i < particleCount; i++){
            info.velocity[i] = new THREE.Vector3();
        }
        app.add(mesh);
    }
    addInstancedMesh();
        
    
    let playEffectSw = 0;
    const localVector2 = new THREE.Vector3();
    let rotateY = new THREE.Quaternion();
    rotateY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    useFrame(({timestamp}) => {
        localVector2.set(playerDir.x, playerDir.y, playerDir.z).applyQuaternion(rotateY);

        if (contactWater){
            if(playEffectSw===0)
                playEffectSw=1;
        }
        else{
            if(playEffectSw=2)
                playEffectSw=0;
        }

        if (mesh) {
            //console.log(Math.floor(currentSpeed * 10 + 1))
            const brokenAttribute = mesh.geometry.getAttribute('broken');
            const opacityAttribute = mesh.geometry.getAttribute('opacity');
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            const scalesAttribute = mesh.geometry.getAttribute('scales');
            const startTimeAttribute = mesh.geometry.getAttribute('startTime');
            const colorAttribute = mesh.geometry.getAttribute('color');
            const textureRotationAttribute = mesh.geometry.getAttribute('textureRotation');
            
            if(
                localPlayer.hasAction('swim')
                && localPlayer.getAction('swim').onSurface
                && currentSpeed > 0.3
            ){
                let currentEmmit = 0;
                for(let i = 0; i < particleCount; i++){
                    if(brokenAttribute.getX(i) >= 1){
                        info.velocity[i].x = localVector2.x * (Math.random() - 0.5) * 0.25 + playerDir.x * 0.05;
                        info.velocity[i].y = 0.05 + Math.random() * 0.1;
                        info.velocity[i].z = localVector2.z * (Math.random() - 0.5) * 0.25 + playerDir.z * 0.05;
                        positionsAttribute.setXYZ(  i, 
                                                    localPlayer.position.x + info.velocity[i].x * 1. + playerDir.x * 0.25,
                                                    waterSurfacePos.y - 0.1 * Math.random(),
                                                    localPlayer.position.z + info.velocity[i].z * 1. + playerDir.z * 0.25
                        );
                        info.velocity[i].divideScalar(5);
                        info.acc[i] = -0.001 - currentSpeed * 0.0015;
                        scalesAttribute.setX(i, 1.5 + Math.random() * 3.5);
                        brokenAttribute.setX(i, Math.random());
                        textureRotationAttribute.setX(i, Math.random() * 2);
                        currentEmmit++;
                    }
                    if(currentEmmit >= 5){
                        break;
                    }
                }
                    
                
            }
            for (let i = 0; i < particleCount; i++){
                positionsAttribute.setXYZ(  i, 
                                            positionsAttribute.getX(i) + info.velocity[i].x,
                                            positionsAttribute.getY(i) + info.velocity[i].y,
                                            positionsAttribute.getZ(i) + info.velocity[i].z
                );
                if(brokenAttribute.getX(i) < 1){
                    //if(info.velocity[i].y < 0)
                        brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.025 * (1 + currentSpeed));
                        scalesAttribute.setX(i, scalesAttribute.getX(i) + 0.02 * (1 + currentSpeed));
                    // else{
                    //     brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.005);
                    // }
                }
                info.velocity[i].y += info.acc[i];
            }
            
            
            mesh.instanceMatrix.needsUpdate = true;
            brokenAttribute.needsUpdate = true;
            positionsAttribute.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            startTimeAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
            textureRotationAttribute.needsUpdate = true;
            
            mesh.material.uniforms.uTime.value=timestamp/1000;
            mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
            mesh.material.uniforms.waterSurfacePos.value.copy(waterSurfacePos);

            if(playEffectSw === 1){
                playEffectSw=2;
            }

        }
        app.updateMatrixWorld();
    
    });
  }
  //################################################################ walking splash ###########################################################
  {
        
    const particleCount = 30;
    let info = {
        velocity: [particleCount],
        acc: [particleCount]
    }
    //const acc = new THREE.Vector3(0, -0.001, 0);
    
    const _getGeometry = geometry => {
        //console.log(geometry)
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
        geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
        
        const positions = new Float32Array(particleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);

        const color = new Float32Array(particleCount * 3);
        const colorAttribute = new THREE.InstancedBufferAttribute(color, 3);
        geometry2.setAttribute('color', colorAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);
        
        // const quaternions = new Float32Array(particleCount * 4);
        // for (let i = 0; i < particleCount; i++) {
        //   identityQuaternion.toArray(quaternions, i * 4);
        // }
        // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
        // geometry2.setAttribute('quaternions', quaternionsAttribute);

        const scales = new Float32Array(particleCount);
        const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
        geometry2.setAttribute('scales', scalesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const startTimeAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        startTimeAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('startTime', startTimeAttribute);
    
        const textureRotation = new Float32Array(particleCount);
        const textureRotAttribute = new THREE.InstancedBufferAttribute(textureRotation, 1);
        geometry2.setAttribute('textureRotation', textureRotAttribute);

        return geometry2;
    };

    const material= new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            cameraBillboardQuaternion: {
                value: new THREE.Quaternion(),
            },
            splashTexture: {
                value: splashTexture2,
            },
            waterSurfacePos: {
                value: new THREE.Vector3(),
            },
            noiseMap:{
                value: noiseMap
            },
        },
        vertexShader: `\
            
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
            
            uniform float uTime;
            uniform vec4 cameraBillboardQuaternion;
            
            
            varying vec2 vUv;
            varying vec3 vPos;
            varying vec3 vColor;
            varying float vOpacity;
            varying float vBroken;
            varying float vTextureRotation;

            attribute float textureRotation;
            attribute float broken;
            attribute vec3 positions;
            attribute vec3 color;
            attribute float scales;
            attribute float opacity;
            
            

            vec3 rotateVecQuat(vec3 position, vec4 q) {
                vec3 v = position.xyz;
                return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
            }
            void main() {
                vUv = uv;
                vBroken = broken;
                vTextureRotation = textureRotation;  
                // vOpacity = opacity;
                // vColor = color;
                
                vec3 pos = position;
                pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                pos *= scales;
                pos += positions;
                
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                vPos = modelPosition.xyz;
                gl_Position = projectionPosition;
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `\
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform float uTime;
            uniform sampler2D splashTexture;
            uniform sampler2D noiseMap;
            uniform vec3 waterSurfacePos;
            varying vec2 vUv;
            varying vec3 vPos;
            varying vec3 vColor;
            varying float vOpacity;
            varying float vTextureRotation;
            varying float vBroken;
            #define PI 3.1415926

            void main() {
                float mid = 0.5;
                vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) * 1.1 - sin(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + mid,
                            cos(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + sin(vTextureRotation*PI) * (vUv.x - mid) * 1.1 + mid);
                vec4 splash = texture2D(
                                splashTexture,
                                rotated
                );
                if(splash.r > 0.1){
                    gl_FragColor = vec4(0.6, 0.6, 0.6, 1.0);
                }
                if(vPos.y < waterSurfacePos.y){
                    gl_FragColor.a = 0.;
                }
                //gl_FragColor.a *= 0.5;
                float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, rotated * 0.8 ).g;
                if ( broken < 0.0001 ) discard;
            ${THREE.ShaderChunk.logdepthbuf_fragment}
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        //blending: THREE.AdditiveBlending,
        depthWrite: false,
        //blending: 1,

    });
    let mesh = null;
    function addInstancedMesh() {
        const geometry2 = new THREE.PlaneGeometry( 0.2, 0.2 );
        const geometry = _getGeometry(geometry2);
        mesh = new THREE.InstancedMesh(geometry, material, particleCount);
        for(let i = 0; i < particleCount; i++){
            info.velocity[i] = new THREE.Vector3();
        }
        app.add(mesh);
    }
    addInstancedMesh();
        
    
    let playEffectSw = 0;
    let lastStep = null;
    const localVector2 = new THREE.Vector3();
    let rotateY = new THREE.Quaternion();
    rotateY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    useFrame(({timestamp}) => {
        localVector2.set(playerDir.x, playerDir.y, playerDir.z).applyQuaternion(rotateY);
        if (contactWater){
            if(playEffectSw===0)
                playEffectSw=1;
        }
        else{
            if(playEffectSw=2)
                playEffectSw=0;
        }

        if (mesh) {
            //console.log(Math.floor(currentSpeed * 10 + 1))
            const brokenAttribute = mesh.geometry.getAttribute('broken');
            const opacityAttribute = mesh.geometry.getAttribute('opacity');
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            const scalesAttribute = mesh.geometry.getAttribute('scales');
            const startTimeAttribute = mesh.geometry.getAttribute('startTime');
            const colorAttribute = mesh.geometry.getAttribute('color');
            const textureRotationAttribute = mesh.geometry.getAttribute('textureRotation');
            if(contactWater){
                if(playEffectSw === 1 && fallindSpeed <= 6){
                    let currentEmmit = 0;
                    for(let i = 0; i < particleCount; i++){
                        if(brokenAttribute.getX(i) >= 1){
                            info.velocity[i].x = (Math.random() - 0.5) * 0.1 * 1.5;
                            info.velocity[i].y = 0.2 * 1.5;
                            info.velocity[i].z = (Math.random() - 0.5) * 0.1 * 1.5;
                            positionsAttribute.setXYZ(  i, 
                                                        localPlayer.position.x + info.velocity[i].x,
                                                        waterSurfacePos.y - 0.1 * Math.random(),
                                                        localPlayer.position.z + info.velocity[i].z
                            );
                            info.velocity[i].divideScalar(10);
                            info.acc[i] = -0.0015;
                            scalesAttribute.setX(i, (1.5));
                            brokenAttribute.setX(i, 0.25 + Math.random() * 0.2);
                            textureRotationAttribute.setX(i, Math.random() * 2);
                            currentEmmit++;
                        }
                        if(currentEmmit >= 10){
                            break;
                        }
                        
                    }
                }
                else if(
                    localPlayer.characterSfx.currentStep !== lastStep 
                    && !localPlayer.hasAction('swim')
                    && contactWater 
                    && (
                        (currentSpeed <= 0.5 && waterSurfacePos.y < localPlayer.position.y - localPlayer.avatar.height + localPlayer.avatar.height * 0.3)
                        || (currentSpeed > 0.5 && waterSurfacePos.y < localPlayer.position.y - localPlayer.avatar.height + localPlayer.avatar.height * 0.4)
                    )
                ){
                    //console.log(localPlayer.characterSfx.currentStep);
                    
                    if(localPlayer.characterSfx.currentStep === 'right'){
                        let currentEmmit = 0;
                        for(let i = 0; i < particleCount; i++){
                            if(brokenAttribute.getX(i) >= 1){
                                info.velocity[i].x = (Math.random() - 0.5) * 0.1 * (1 + currentSpeed);
                                info.velocity[i].y = 0.2 * (1 + currentSpeed);
                                info.velocity[i].z = (Math.random() - 0.5) * 0.1 * (1 + currentSpeed);
                                positionsAttribute.setXYZ(  i, 
                                                            localPlayer.position.x + localVector2.x * 0.05 + info.velocity[i].x + playerDir.x * 0.35,
                                                            waterSurfacePos.y - 0.1 * Math.random(),
                                                            localPlayer.position.z + localVector2.z * 0.05 + info.velocity[i].z + playerDir.z * 0.35
                                );
                                info.velocity[i].divideScalar(10);
                                info.acc[i] = -0.001 - currentSpeed * 0.0015;
                                scalesAttribute.setX(i, (1 + currentSpeed));
                                brokenAttribute.setX(i, 0.25 + Math.random() * 0.2);
                                textureRotationAttribute.setX(i, Math.random() * 2);
                                currentEmmit++;
                            }
                            if(currentEmmit >= 10){
                                break;
                            }
                        }
                        
                    }
                    else{
                        let currentEmmit = 0;
                        for(let i = 0; i < particleCount; i++){
                            if(brokenAttribute.getX(i) >= 1){
                                info.velocity[i].x = (Math.random() - 0.5) * 0.1 * (1 + currentSpeed);
                                info.velocity[i].y = 0.2 * (1 + currentSpeed);
                                info.velocity[i].z = (Math.random() - 0.5) * 0.1 * (1 + currentSpeed);
                                positionsAttribute.setXYZ(  i, 
                                                            localPlayer.position.x - localVector2.x * 0.05 + info.velocity[i].x + playerDir.x * 0.35,
                                                            waterSurfacePos.y - 0.1 * Math.random(),
                                                            localPlayer.position.z - localVector2.z * 0.05 + info.velocity[i].z + playerDir.z * 0.35
                                );
                                info.velocity[i].divideScalar(10);
                                info.acc[i] = -0.001 - currentSpeed * 0.0015;
                                scalesAttribute.setX(i, (1 + currentSpeed));
                                brokenAttribute.setX(i, 0.25 + Math.random() * 0.2);
                                textureRotationAttribute.setX(i, Math.random() * 2);
                                currentEmmit++;
                            }
                            if(currentEmmit >= 10){
                                break;
                            }
                            
                        }
                        
                    }
                    
                    lastStep = localPlayer.characterSfx.currentStep;
                }
            }
            
            for (let i = 0; i < particleCount; i++){
                positionsAttribute.setXYZ(  i, 
                                            positionsAttribute.getX(i) + info.velocity[i].x,
                                            positionsAttribute.getY(i) + info.velocity[i].y,
                                            positionsAttribute.getZ(i) + info.velocity[i].z
                );
                if(brokenAttribute.getX(i) < 1){
                    //if(info.velocity[i].y < 0)
                        brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.01 * (1 + currentSpeed));
                        scalesAttribute.setX(i, scalesAttribute.getX(i) + 0.01 * (1 + currentSpeed));
                    // else{
                    //     brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.005);
                    // }
                }
                info.velocity[i].y += info.acc[i];
            }
            
            
            mesh.instanceMatrix.needsUpdate = true;
            brokenAttribute.needsUpdate = true;
            positionsAttribute.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            startTimeAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
            textureRotationAttribute.needsUpdate = true;
            
            mesh.material.uniforms.uTime.value=timestamp/1000;
            mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
            mesh.material.uniforms.waterSurfacePos.value.copy(waterSurfacePos);

            if(playEffectSw === 1){
                playEffectSw=2;
            }

        }
        app.updateMatrixWorld();
    
    });
  }
  //################################################################ lower splash ###########################################################
  let secondSplash = 2;
  const secondSplashPos = new THREE.Vector3();
  {
      const particleCount = 12;
      let info = {
          velocity: [particleCount],
      }
      const acc = new THREE.Vector3(0, -0.002, 0);
      
      const _getGeometry = geometry => {
          //console.log(geometry)
          const geometry2 = new THREE.BufferGeometry();
          ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
          });
          geometry2.setIndex(geometry.index);
          
          const positions = new Float32Array(particleCount * 3);
          const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
          geometry2.setAttribute('positions', positionsAttribute);

          const color = new Float32Array(particleCount * 3);
          const colorAttribute = new THREE.InstancedBufferAttribute(color, 3);
          geometry2.setAttribute('color', colorAttribute);

          const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          brokenAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('broken', brokenAttribute);
          
          // const quaternions = new Float32Array(particleCount * 4);
          // for (let i = 0; i < particleCount; i++) {
          //   identityQuaternion.toArray(quaternions, i * 4);
          // }
          // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
          // geometry2.setAttribute('quaternions', quaternionsAttribute);

          const scales = new Float32Array(particleCount);
          const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
          geometry2.setAttribute('scales', scalesAttribute);

          const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          opacityAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('opacity', opacityAttribute);

          const startTimeAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          startTimeAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('startTime', startTimeAttribute);
      
          const textureRotation = new Float32Array(particleCount);
          const textureRotAttribute = new THREE.InstancedBufferAttribute(textureRotation, 1);
          geometry2.setAttribute('textureRotation', textureRotAttribute);

          return geometry2;
      };

      const material= new THREE.ShaderMaterial({
          uniforms: {
              uTime: {
                  value: 0,
              },
              cameraBillboardQuaternion: {
                  value: new THREE.Quaternion(),
              },
              splashTexture: {
                  value: splashTexture2,
              },
              waterSurfacePos: {
                  value: new THREE.Vector3(),
              },
              noiseMap:{
                  value: noiseMap
              },
          },
          vertexShader: `\
              
              ${THREE.ShaderChunk.common}
              ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
          
              
              uniform float uTime;
              uniform vec4 cameraBillboardQuaternion;
              
              
              varying vec2 vUv;
              varying vec3 vPos;
              varying vec3 vColor;
              varying float vOpacity;
              varying float vBroken;
              varying float vTextureRotation;
  
              attribute float textureRotation;
              attribute float broken;
              attribute vec3 positions;
              attribute vec3 color;
              attribute float scales;
              attribute float opacity;
              
              

              vec3 rotateVecQuat(vec3 position, vec4 q) {
                  vec3 v = position.xyz;
                  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
              }
              void main() {
                  vUv = uv;
                  vBroken = broken;
                  vTextureRotation = textureRotation;  
                  // vOpacity = opacity;
                  // vColor = color;
                  
                  vec3 pos = position;
                  pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                  pos*=scales;
                  pos+=positions;
                  //pos = qtransform(pos, quaternions);
                  //pos.y=cos(uTime/100.);
                  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                  vec4 viewPosition = viewMatrix * modelPosition;
                  vec4 projectionPosition = projectionMatrix * viewPosition;
                  vPos = modelPosition.xyz;
                  gl_Position = projectionPosition;
                  ${THREE.ShaderChunk.logdepthbuf_vertex}
              }
          `,
          fragmentShader: `\
              ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
              uniform float uTime;
              uniform sampler2D splashTexture;
              uniform sampler2D noiseMap;
              uniform vec3 waterSurfacePos;
              varying vec2 vUv;
              varying vec3 vPos;
              varying vec3 vColor;
              varying float vOpacity;
              varying float vTextureRotation;
              varying float vBroken;
              #define PI 3.1415926

              void main() {
                  float mid = 0.5;
                  vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) * 1.1 - sin(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + mid,
                              cos(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + sin(vTextureRotation*PI) * (vUv.x - mid) * 1.1 + mid);
                  vec4 splash = texture2D(
                                  splashTexture,
                                  rotated
                  );
                  if(splash.r > 0.1){
                      gl_FragColor = vec4(0.6, 0.6, 0.6, 1.0);
                  }
                  if(vPos.y < waterSurfacePos.y){
                      gl_FragColor.a = 0.;
                  }
                  //gl_FragColor.a *= 0.5;
                  float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, rotated * 2.5 ).g;
                  if ( broken < 0.0001 ) discard;
              ${THREE.ShaderChunk.logdepthbuf_fragment}
              }
          `,
          side: THREE.DoubleSide,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          //blending: 1,

      });
      let mesh = null;
      function addInstancedMesh() {
          const geometry2 = new THREE.PlaneGeometry( 0.3, 0.3 );
          const geometry = _getGeometry(geometry2);
          mesh = new THREE.InstancedMesh(geometry, material, particleCount);
          for(let i = 0; i < particleCount; i++){
              info.velocity[i] = new THREE.Vector3();
          }
          app.add(mesh);
      }
      addInstancedMesh();
          
      
      let playEffectSw=0;
      useFrame(({timestamp}) => {
          if (contactWater){
              if(playEffectSw===0)
                  playEffectSw=1;
          }
          else{
              if(playEffectSw=2)
                  playEffectSw=0;
          }

          if (mesh) {
              //console.log(Math.floor(currentSpeed * 10 + 1))
              const brokenAttribute = mesh.geometry.getAttribute('broken');
              const opacityAttribute = mesh.geometry.getAttribute('opacity');
              const positionsAttribute = mesh.geometry.getAttribute('positions');
              const scalesAttribute = mesh.geometry.getAttribute('scales');
              const startTimeAttribute = mesh.geometry.getAttribute('startTime');
              const colorAttribute = mesh.geometry.getAttribute('color');
              const textureRotationAttribute = mesh.geometry.getAttribute('textureRotation');
              
              for (let i = 0; i < particleCount; i++){
                  if(playEffectSw === 1 && fallindSpeed > 6){
                      info.velocity[i].x = Math.sin(i) * .1 + (Math.random() - 0.5) * 0.01;
                      info.velocity[i].y = 0.15 * Math.random();
                      info.velocity[i].z = Math.cos(i) * .1 + (Math.random() - 0.5) * 0.01;
                      positionsAttribute.setXYZ(  i, 
                                                  waterSurfacePos.x + info.velocity[i].x,
                                                  waterSurfacePos.y + 0.1 * Math.random(),
                                                  waterSurfacePos.z + info.velocity[i].z
                      );
                      info.velocity[i].divideScalar(5);
                      scalesAttribute.setX(i, 0.8);
                      textureRotationAttribute.setX(i, Math.random() * 2);
                      brokenAttribute.setX(i, 0.1 + Math.random() * 0.2);
                      if(secondSplash === 2){
                          secondSplash = 0;
                          secondSplashPos.set(waterSurfacePos.x, waterSurfacePos.y, waterSurfacePos.z);
                      }
                  }
                  if(scalesAttribute.getX(i) >= 0.8 &&  scalesAttribute.getX(i) < 2.5){
                      scalesAttribute.setX(i, scalesAttribute.getX(i) + 0.2);
                  }
                  if(scalesAttribute.getX(i) >= 2.5){
                      if(brokenAttribute.getX(i) < 1){
                          brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.03);
                          positionsAttribute.setXYZ(  i, 
                                                      positionsAttribute.getX(i) + info.velocity[i].x,
                                                      positionsAttribute.getY(i) + info.velocity[i].y,
                                                      positionsAttribute.getZ(i) + info.velocity[i].z
                          );
                          info.velocity[i].add(acc);
                          if(secondSplash === 0){
                              secondSplash = 1;
                          }
                      }
                  }
              }
              
              mesh.instanceMatrix.needsUpdate = true;
              brokenAttribute.needsUpdate = true;
              positionsAttribute.needsUpdate = true;
              opacityAttribute.needsUpdate = true;
              scalesAttribute.needsUpdate = true;
              startTimeAttribute.needsUpdate = true;
              colorAttribute.needsUpdate = true;
              textureRotationAttribute.needsUpdate = true;
              
              mesh.material.uniforms.uTime.value=timestamp/1000;
              mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
              mesh.material.uniforms.waterSurfacePos.value.copy(waterSurfacePos);

              if(playEffectSw === 1){
                  playEffectSw=2;
              }

          }
          app.updateMatrixWorld();
      
      });
  }
  //################################################################ higher splash ###########################################################
  {
      const particleCount = 10;
      let info = {
          velocity: [particleCount],
      }
      const acc = new THREE.Vector3(0, -0.0024, 0);
      
      const _getGeometry = geometry => {
          //console.log(geometry)
          const geometry2 = new THREE.BufferGeometry();
          ['position', 'normal', 'uv'].forEach(k => {
          geometry2.setAttribute(k, geometry.attributes[k]);
          });
          geometry2.setIndex(geometry.index);
          
          const positions = new Float32Array(particleCount * 3);
          const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
          geometry2.setAttribute('positions', positionsAttribute);

          const color = new Float32Array(particleCount * 3);
          const colorAttribute = new THREE.InstancedBufferAttribute(color, 3);
          geometry2.setAttribute('color', colorAttribute);

          const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          brokenAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('broken', brokenAttribute);
          
          // const quaternions = new Float32Array(particleCount * 4);
          // for (let i = 0; i < particleCount; i++) {
          //   identityQuaternion.toArray(quaternions, i * 4);
          // }
          // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
          // geometry2.setAttribute('quaternions', quaternionsAttribute);

          const scales = new Float32Array(particleCount);
          const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
          geometry2.setAttribute('scales', scalesAttribute);

          const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          opacityAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('opacity', opacityAttribute);

          const startTimeAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          startTimeAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('startTime', startTimeAttribute);
      
          const textureRotation = new Float32Array(particleCount);
          const textureRotAttribute = new THREE.InstancedBufferAttribute(textureRotation, 1);
          geometry2.setAttribute('textureRotation', textureRotAttribute);

          return geometry2;
      };

      const material= new THREE.ShaderMaterial({
          uniforms: {
              uTime: {
                  value: 0,
              },
              cameraBillboardQuaternion: {
                  value: new THREE.Quaternion(),
              },
              splashTexture: {
                  value: splashTexture2,
              },
              waterSurfacePos: {
                  value: new THREE.Vector3(),
              },
              noiseMap:{
                  value: noiseMap
              },
          },
          vertexShader: `\
              
              ${THREE.ShaderChunk.common}
              ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
          
              
              uniform float uTime;
              uniform vec4 cameraBillboardQuaternion;
              
              
              varying vec2 vUv;
              varying vec3 vPos;
              varying vec3 vColor;
              varying float vOpacity;
              varying float vBroken;
              varying float vTextureRotation;
  
              attribute float textureRotation;
              attribute float broken;
              attribute vec3 positions;
              attribute vec3 color;
              attribute float scales;
              attribute float opacity;
              
              

              vec3 rotateVecQuat(vec3 position, vec4 q) {
                  vec3 v = position.xyz;
                  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
              }
              void main() {
                  vUv = uv;
                  vBroken = broken;
                  vTextureRotation = textureRotation;  
                  // vOpacity = opacity;
                  // vColor = color;
                  
                  vec3 pos = position;
                  pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                  pos*=scales;
                  pos+=positions;
                  //pos = qtransform(pos, quaternions);
                  //pos.y=cos(uTime/100.);
                  vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                  vec4 viewPosition = viewMatrix * modelPosition;
                  vec4 projectionPosition = projectionMatrix * viewPosition;
                  vPos = modelPosition.xyz;
                  gl_Position = projectionPosition;
                  ${THREE.ShaderChunk.logdepthbuf_vertex}
              }
          `,
          fragmentShader: `\
              ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
              uniform float uTime;
              uniform sampler2D splashTexture;
              uniform sampler2D noiseMap;
              uniform vec3 waterSurfacePos;
              varying vec2 vUv;
              varying vec3 vPos;
              varying vec3 vColor;
              varying float vOpacity;
              varying float vTextureRotation;
              varying float vBroken;
              #define PI 3.1415926

              void main() {
                  float mid = 0.5;
                  vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) * 1.1 - sin(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + mid,
                              cos(vTextureRotation*PI) * (vUv.y - mid) * 1.1 + sin(vTextureRotation*PI) * (vUv.x - mid) * 1.1 + mid);
                  vec4 splash = texture2D(
                                  splashTexture,
                                  rotated
                  );
                  if(splash.r > vBroken){
                      gl_FragColor = vec4(0.9, 0.9, 0.9, 1.0);
                  }
                  else{
                      discard;
                  }
                  if(vPos.y < waterSurfacePos.y){
                      gl_FragColor.a = 0.;
                  }
                  //gl_FragColor.a *= 0.5;
                  // float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, rotated * 1. ).g;
                  // if ( broken < 0.0001 ) discard;
              ${THREE.ShaderChunk.logdepthbuf_fragment}
              }
          `,
          side: THREE.DoubleSide,
          transparent: true,
          //blending: THREE.AdditiveBlending,
          depthWrite: false,
          //blending: 1,

      });
      let mesh = null;
      function addInstancedMesh() {
          const geometry2 = new THREE.PlaneGeometry( 0.4, 0.4 );
          const geometry = _getGeometry(geometry2);
          mesh = new THREE.InstancedMesh(geometry, material, particleCount);
          for(let i = 0; i < particleCount; i++){
              info.velocity[i] = new THREE.Vector3();
          }
          app.add(mesh);
      }
      addInstancedMesh();
          
      
      
      useFrame(({timestamp}) => {
          
          if (mesh) {
              //console.log(Math.floor(currentSpeed * 10 + 1))
              const brokenAttribute = mesh.geometry.getAttribute('broken');
              const opacityAttribute = mesh.geometry.getAttribute('opacity');
              const positionsAttribute = mesh.geometry.getAttribute('positions');
              const scalesAttribute = mesh.geometry.getAttribute('scales');
              const startTimeAttribute = mesh.geometry.getAttribute('startTime');
              const colorAttribute = mesh.geometry.getAttribute('color');
              const textureRotationAttribute = mesh.geometry.getAttribute('textureRotation');
              
              for (let i = 0; i < particleCount; i++){
                  if(secondSplash === 1){
                      info.velocity[i].x = 0;
                      info.velocity[i].y = 0.13;
                      info.velocity[i].z = 0;
                      info.velocity[i].divideScalar(5);

                      positionsAttribute.setXYZ(  i, 
                                                  secondSplashPos.x + (Math.random() - 0.5) * 0.1,
                                                  secondSplashPos.y + (i * 0.18) / 7,
                                                  secondSplashPos.z + (Math.random() - 0.5) * 0.1
                      );
                      
                      scalesAttribute.setX(i, (0.8 +  (2 - i * 0.18)) / 7);
                      textureRotationAttribute.setX(i, Math.random() * 2);
                      brokenAttribute.setX(i, Math.random() * 0.5);
                  }
                  if(scalesAttribute.getX(i) < 0.8 +  (2 - i * 0.18)){
                      scalesAttribute.setX(i, scalesAttribute.getX(i) * 1.05);
                      positionsAttribute.setXYZ(  i, 
                                                  positionsAttribute.getX(i),
                                                  secondSplashPos.y + (positionsAttribute.getY(i) - secondSplashPos.y) * 1.05,
                                                  positionsAttribute.getZ(i)
                      );
                      
                  }
                  if(scalesAttribute.getX(i) > (0.8 +  (2 - i * 0.18)) / 3){
                      if(brokenAttribute.getX(i) < 1)
                          brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.03 * (2 - i * 0.1));
                      
                  }
                  positionsAttribute.setXYZ(  i, 
                                          positionsAttribute.getX(i) + info.velocity[i].x,
                                          positionsAttribute.getY(i) + info.velocity[i].y,
                                          positionsAttribute.getZ(i) + info.velocity[i].z
                  );
                  info.velocity[i].add(acc);
                  
                  
                  
                  // if(scalesAttribute.getX(i) >= 2.5){
                  //     if(brokenAttribute.getX(i) < 1){
                  //         brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.03);
                  //         positionsAttribute.setXYZ(  i, 
                  //                                     positionsAttribute.getX(i) + info.velocity[i].x,
                  //                                     positionsAttribute.getY(i) + info.velocity[i].y,
                  //                                     positionsAttribute.getZ(i) + info.velocity[i].z
                  //         );
                  //         info.velocity[i].add(acc);
                  //     }
                  // }
              }
              
              mesh.instanceMatrix.needsUpdate = true;
              brokenAttribute.needsUpdate = true;
              positionsAttribute.needsUpdate = true;
              opacityAttribute.needsUpdate = true;
              scalesAttribute.needsUpdate = true;
              startTimeAttribute.needsUpdate = true;
              colorAttribute.needsUpdate = true;
              textureRotationAttribute.needsUpdate = true;
              
              mesh.material.uniforms.uTime.value=timestamp/1000;
              mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
              mesh.material.uniforms.waterSurfacePos.value.copy(waterSurfacePos);

              if(secondSplash === 1){
                  secondSplash = 2;
              }

          }
          app.updateMatrixWorld();
      
      });
  }
  //#################################################################### droplet particle ########################################################################
  {
      const dropletgroup = new THREE.Group();
      const dropletRipplegroup=new THREE.Group();
      const particleCount = 50;
      let info = {
          velocity: [particleCount],
          alreadyHaveRipple: [particleCount]
      }
      const acc = new THREE.Vector3(0, -0.002, 0);


      //##################################################### get ripple geometry #####################################################
      const identityQuaternion = new THREE.Quaternion();
      const _getRippleGeometry = geometry => {
          const geometry2 = new THREE.BufferGeometry();
          ['position', 'normal', 'uv'].forEach(k => {
            geometry2.setAttribute(k, geometry.attributes[k]);
          });
          geometry2.setIndex(geometry.index);
          
          const positions = new Float32Array(particleCount * 3);
          const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
          geometry2.setAttribute('positions', positionsAttribute);
          const quaternions = new Float32Array(particleCount * 4);
          for (let i = 0; i < particleCount; i++) {
            identityQuaternion.toArray(quaternions, i * 4);
          }
          const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
          geometry2.setAttribute('quaternions', quaternionsAttribute);
  
          const waveFreq = new Float32Array(particleCount);
          const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
          geometry2.setAttribute('waveFreq', waveFreqAttribute);
  
          const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          opacityAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('opacity', opacityAttribute);
  
          const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
          brokenAttribute.setUsage(THREE.DynamicDrawUsage);
          geometry2.setAttribute('broken', brokenAttribute);

          const scales = new Float32Array(particleCount);
          const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
          geometry2.setAttribute('scales', scaleAttribute);
      
          return geometry2;
      };
      //##################################################### ripple material #####################################################
      const rippleMaterial = new THREE.ShaderMaterial({
          uniforms: {
              uTime: {
                  value: 0,
              },
              noiseMap:{
                  value: noiseMap
              }
          },
          vertexShader: `\
              
              ${THREE.ShaderChunk.common}
              ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
          
          
              uniform float uTime;
      
              varying vec2 vUv;
              varying vec3 vPos;
              varying float vBroken;
              varying float vOpacity;
              varying float vWaveFreq;
              attribute vec3 positions;
              attribute float scales;
              attribute float opacity;
              attribute float waveFreq;
              attribute vec4 quaternions;
              attribute float broken;
              vec3 qtransform(vec3 v, vec4 q) { 
                return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
              }
          
              void main() {
              vOpacity=opacity;
              vBroken=broken;
              vWaveFreq=waveFreq;
              vUv=uv;
              vPos=position;
              vec3 pos = position;
              pos = qtransform(pos, quaternions);
              pos*=scales;
              pos+=positions;
              
              vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectionPosition = projectionMatrix * viewPosition;
      
              gl_Position = projectionPosition;
              ${THREE.ShaderChunk.logdepthbuf_vertex}
              }
          `,
          fragmentShader: `\
              ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
              uniform float uTime;
              varying float vWaveFreq;
              varying float vBroken;
              varying float vOpacity;
              varying vec2 vUv;
              varying vec3 vPos;
              uniform sampler2D noiseMap;
              
              void main() {
                  
                  vec2 wavedUv = vec2(
                      vUv.x,
                      vUv.y + sin(vUv.x * (2.+vWaveFreq) * cos(uTime*2.)) * 0.05
                  );
                  float strength = 1.0 - step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25));

                  gl_FragColor = vec4(vec3(strength), 1.0);
                  gl_FragColor.a*=vOpacity;

                  float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                  if ( broken < 0.0001 ) discard;
              ${THREE.ShaderChunk.logdepthbuf_fragment}
              }
          `,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          
      });

  
      //################################################################ droplet object #########################################################
      let dropletMesh = null;
      let dummy = new THREE.Object3D();
      let matrix = new THREE.Matrix4();
  
      function addInstancedMesh() {
          dropletMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({map:splashTexture4, color: 0xffffff, transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending}), particleCount);
          dropletgroup.add(dropletMesh);
          app.add(dropletgroup);
          setInstancedMeshPositions(dropletMesh);
      }
      function setInstancedMeshPositions(mesh1) {
          for (let i = 0; i < mesh1.count; i++) {
              dropletMesh.getMatrixAt(i, matrix);
              matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
              dummy.position.y=-500;
              info.velocity[i] = (new THREE.Vector3(
                  (Math.random() - 0.5)*3.,
                  Math.random() * 1.,
                  (Math.random() - 0.5)*3.));
              info.velocity[i].divideScalar(20);
              info.alreadyHaveRipple[i] =false;
              dummy.updateMatrix();
              mesh1.setMatrixAt(i, dummy.matrix);
          }
          mesh1.instanceMatrix.needsUpdate = true;
      }
      addInstancedMesh();

      //################################################################ ripple object #########################################################
      let rippleMesh=null;
      let quaternion = new THREE.Quaternion();
      
      let euler = new THREE.Euler();
      const addInstancedMesh2=()=>{
          const geometry2 = new THREE.PlaneGeometry( 0.45, 0.45 );
          const geometry =_getRippleGeometry(geometry2)
          rippleMesh = new THREE.InstancedMesh(
              geometry,
              rippleMaterial,
              particleCount
          );
          dropletRipplegroup.add(rippleMesh);
          app.add(dropletRipplegroup);
          const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
          const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
          
          for (let i = 0; i < particleCount; i++) {
             
              positionsAttribute.setXYZ(i,.1* Math.random(), .1* Math.random(), 0);
              
            
              euler.x=-Math.PI/2;
              euler.y=0;
              euler.z=0;
              quaternion.setFromEuler(euler);
              quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
          }
          positionsAttribute.needsUpdate = true;
          quaternionsAttribute.needsUpdate = true;
      }
      addInstancedMesh2();




      
      
      let alreadyPlaySplash = false;
      let lastTimePlaySplash = 0;
      let v=0;
  
      let jumpSw=0;
      
      useFrame(({timestamp}) => {
          if (contactWater){
              if(jumpSw===0)
                  jumpSw=1;
          }
          else{
              if(jumpSw=2)
                  jumpSw=0;
          }
          // if(currentRise===1 && !belowWater && !alreadyPlaySplash && contactWater && localPlayer.characterPhysics.velocity.y>1.5){
          //     v = localPlayer.characterPhysics.velocity.y;
          //     alreadyPlaySplash = true;
          //     lastTimePlaySplash=timestamp;
          //     //console.log(v);
          // }
          // if(currentRise===0 || (currentRise===-1 && timestamp-lastTimePlaySplash>1000)){
          //     v=-1;
          //     alreadyPlaySplash=false;
          // }
        if (dropletMesh && rippleMesh) {
          const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
          const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
          const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
          const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
          const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
          
          let falling = fallindSpeed>10?10:fallindSpeed;
          let dropletNum = particleCount*(falling/10);
          dropletNum /= 3;
          falling=falling<5?7:falling;
          for (let i = 0; i < particleCount; i++) {
              dropletMesh.getMatrixAt(i, matrix);
              matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

              if (jumpSw==1) {
                  
                  let rand=Math.random();
                  dummy.scale.x = rand;
                  dummy.scale.y = rand;
                  dummy.scale.z = rand;
                  dummy.position.x = 0;
                  dummy.position.y = 0;
                  dummy.position.z = 0;
                  
                  info.velocity[i].x=(Math.random() -0.5)*1*(falling/10);
                  info.velocity[i].y=Math.random() *1.6*(falling/10);
                  info.velocity[i].z=(Math.random() -0.5)*1*(falling/10);
                  
                  info.velocity[i].divideScalar(20);
                  info.alreadyHaveRipple[i]=false;
                  if(i>dropletNum){
                      dummy.scale.x = 0.001;
                      dummy.scale.y = 0.001;
                      dummy.scale.z = 0.001;
                  }
              }
              // else if(v>0){
              //     let rand=Math.random();
              //     dummy.scale.x = rand;
              //     dummy.scale.y = rand;
              //     dummy.scale.z = rand;
              //     dummy.position.x = 0;
              //     dummy.position.y = 0;
              //     dummy.position.z = 0;
                  
              //     info.velocity[i].x=(Math.random() -0.5)*1*(riseSpeed/5);
              //     info.velocity[i].y=Math.random() *1.6*(riseSpeed/5);
              //     info.velocity[i].z=(Math.random() -0.5)*1*(riseSpeed/5);
                  
              //     info.velocity[i].divideScalar(20);
              //     info.alreadyHaveRipple[i]=false;
              //     if(i>dropletNum2){
              //         dummy.scale.x = 0.001;
              //         dummy.scale.y = 0.001;
              //         dummy.scale.z = 0.001;
              //     }
                  
              // }
              if(dummy.position.y>=-100){
                  info.velocity[i].add(acc);
                  dummy.scale.x /=1.035;
                  dummy.scale.y /=1.035;
                  dummy.scale.z /=1.035;
                  dummy.position.add(info.velocity[i]);

                  dummy.rotation.copy(camera.rotation);
                  

                  dummy.updateMatrix();
                  
                  dropletMesh.setMatrixAt(i, dummy.matrix);
                  dropletMesh.instanceMatrix.needsUpdate = true;
              }
              if(dummy.position.y<0 && !info.alreadyHaveRipple[i] && dummy.scale.x>0.001){
                  dummy.scale.x=0.0001;
                  dummy.scale.y=0.0001;
                  dummy.scale.z=0.0001;
                  dummy.updateMatrix();
                  dropletMesh.setMatrixAt(i, dummy.matrix);
                  dropletMesh.instanceMatrix.needsUpdate = true;
                  positionsAttribute.setXYZ(i,dummy.position.x,0,dummy.position.z);
                  scalesAttribute.setX(i,Math.random()*0.2);
                  opacityAttribute.setX(i,0.5+0.3*Math.random());
                  waveFreqAttribute.setX(i, Math.random()*(i%10));
                  brokenAttribute.setX(i, Math.random()-0.8);
                  info.alreadyHaveRipple[i]=true;
              }
              else{
                  dummy.scale.x=0.0001;
                  dummy.scale.y=0.0001;
                  dummy.scale.z=0.0001;
              }
              opacityAttribute.setX(i,opacityAttribute.getX(i)-0.013);
              scalesAttribute.setX(i,scalesAttribute.getX(i)+0.02);
              if(brokenAttribute.getX(i)<1)
                  brokenAttribute.setX(i, brokenAttribute.getX(i)+0.02);
              
  
          }
          dropletRipplegroup.position.y = waterSurfacePos.y;
          positionsAttribute.needsUpdate = true;
          opacityAttribute.needsUpdate = true;
          scalesAttribute.needsUpdate = true;
          brokenAttribute.needsUpdate = true;
          waveFreqAttribute.needsUpdate = true;
          rippleMesh.material.uniforms.uTime.value=timestamp/1000;
          if(jumpSw==1){
              dropletgroup.position.copy(localPlayer.position);
              dropletRipplegroup.position.copy(localPlayer.position);
              jumpSw=2;
          }
          // if(v>0){
          //     dropletgroup.position.copy(localPlayer.position);
          //     dropletRipplegroup.position.copy(localPlayer.position);
          //     v=-1;
          // }
          
          dropletgroup.position.y = waterSurfacePos.y;
          dropletRipplegroup.position.y = waterSurfacePos.y;
  
  
      }
      
      });
  }
  //######################################################################  3 layers ripple ######################################################################
  {
      const identityQuaternion = new THREE.Quaternion();
      const count = 3;

      
      const _getRippleGeometry = geometry => {
          const geometry2 = new THREE.BufferGeometry();
          ['position', 'normal', 'uv'].forEach(k => {
            geometry2.setAttribute(k, geometry.attributes[k]);
          });
          geometry2.setIndex(geometry.index);
          
          const positions = new Float32Array(count * 3);
          const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
          geometry2.setAttribute('positions', positionsAttribute);
          const quaternions = new Float32Array(count * 4);
          for (let i = 0; i < count; i++) {
            identityQuaternion.toArray(quaternions, i * 4);
          }
          const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
          geometry2.setAttribute('quaternions', quaternionsAttribute);

          // const startTimes = new Float32Array(count);
          // const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
          // geometry2.setAttribute('startTimes', startTimesAttribute);

          const scales = new Float32Array(count);
          const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
          geometry2.setAttribute('scales', scaleAttribute);
      
          return geometry2;
      };

      //######################################################################### material #########################################################################
      const rippleMaterial = new THREE.ShaderMaterial({
          uniforms: {
              uTime: {
                  value: 0,
              },
              opacity: {
                  value: 0,
              },
              uBroken: {
                  value: 0,
              },
              perlinnoise:{
                  value: rippleTexture
              },
              noiseMap:{
                  value: noiseMap
              }
          },
          vertexShader: `\
              
              ${THREE.ShaderChunk.common}
              ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
          
          
              uniform float uTime;
      
              varying vec2 vUv;
              varying vec3 vPos;
              attribute vec3 positions;
              attribute float scales;
              attribute vec4 quaternions;

              vec3 qtransform(vec3 v, vec4 q) { 
                return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
              }
          
              void main() {
              vUv=uv;
              vPos=position;
              vec3 pos = position;
              pos+=positions;
              pos*=scales;
              pos = qtransform(pos, quaternions);
              //pos.y=cos(uTime/100.);
              vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectionPosition = projectionMatrix * viewPosition;
      
              gl_Position = projectionPosition;
              ${THREE.ShaderChunk.logdepthbuf_vertex}
              }
          `,
          fragmentShader: `\
              ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
              uniform float uTime;
              uniform float opacity;
              uniform float uBroken;
              varying vec2 vUv;
              varying vec3 vPos;
              uniform sampler2D perlinnoise;
              uniform sampler2D noiseMap;
              
              
              
              
              
              void main() {
                  vec3 ripple = texture2D(
                      perlinnoise,
                      mod(1.*vec2(5.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                  ).rgb; 

                  vec3 noise = texture2D(
                      noiseMap,
                      mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                  ).rgb;
                  


                  gl_FragColor = vec4(ripple.rgb,1.0);
                  
                  if(gl_FragColor.r >= 0.65){
                     gl_FragColor =  vec4(1.,1.,1.,1.);
                  }else{
                      gl_FragColor = vec4(0.,0.,1.,0.);
                  }
                  float broken = abs( sin( pow(1.0 - vUv.y,1.) ) ) - noise.g;
                  if ( broken < 0.0001 ) discard;
                  gl_FragColor.a*=opacity;
                  if(uTime>0.48)
                      gl_FragColor.a=0.;
                  
                  //gl_FragColor=vec4(1.0,1.0,0.,1.0);
              ${THREE.ShaderChunk.logdepthbuf_fragment}
              }
          `,
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          
      });


      let rippleApp;
      let group = new THREE.Group();
      (async () => {
          const u = `${baseUrl}/assets/torus2.glb`;
          rippleApp = await new Promise((accept, reject) => {
              const {gltfLoader} = useLoaders();
              gltfLoader.load(u, accept, function onprogress() {}, reject);
              
          });
          rippleApp.scene.traverse(o => {
              if (o.isMesh) {
                addInstancedMesh(o.geometry);
              }
          });
          
          
      })();

      let quaternion = new THREE.Quaternion();
      let euler = new THREE.Euler();
      let mesh=null;
      const addInstancedMesh=(rippleGeometry)=>{
          const geometry = _getRippleGeometry(rippleGeometry);
          mesh = new THREE.InstancedMesh(
              geometry,
              rippleMaterial,
              count
          );
          group.add(mesh);
          app.add(group);
          const positionsAttribute = mesh.geometry.getAttribute('positions');
          const scalesAttribute = mesh.geometry.getAttribute('scales');
          const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
          for (let i = 0; i < count; i++) {
              
              let randScale = 0.5+0.4*i*(Math.random());
              let randPos = 0.15*(Math.random());
              positionsAttribute.setXYZ(i, randPos, (Math.random()-0.5)*0.5, randPos);
              scalesAttribute.setX(i, randScale);
              
              euler.x=(Math.random()-0.5)*0.25;
              euler.y=(Math.random()-0.5);
              euler.z=(Math.random()-0.5)*0.25;
              
              
              quaternion.setFromEuler(euler);
              quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
              
             
          }
          positionsAttribute.needsUpdate = true;
          scalesAttribute.needsUpdate = true;
          quaternionsAttribute.needsUpdate = true;
      }

      app.updateMatrixWorld();

      
      let playEffectSw=0;
      useFrame(({timestamp}) => {
          if (contactWater){
              if(playEffectSw===0)
                  playEffectSw=1;
          }
          else{
              if(playEffectSw=2)
                  playEffectSw=0;
          }
          if (mesh) {
              const positionsAttribute = mesh.geometry.getAttribute('positions');
              const scalesAttribute = mesh.geometry.getAttribute('scales');
              const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
              let falling = fallindSpeed > 10 ? 10 : fallindSpeed;
              for (let i = 0; i < count; i++) {
                  if(playEffectSw==1){
                      
                      let randScale = (0.3 * (falling / 10) * (i + 1)) / 3;
                      scalesAttribute.setX(i, randScale * 2);
                      if(fallindSpeed <= 6){
                          if(i !== 2){
                              scalesAttribute.setX(i, 0);
                          }
                      }
                      
                      positionsAttribute.setXYZ(i, 0, (Math.random()-0.5)*0.1, 0);
                      
                      
                      euler.x=(Math.random()-0.5)*0.05;
                      euler.y=(Math.random()-0.5);
                      euler.z=(Math.random()-0.5)*0.05;
                      
                      
                      quaternion.setFromEuler(euler);
                      quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                  }
                  if(scalesAttribute.getX(i) > 0)
                      scalesAttribute.setX(i, scalesAttribute.getX(i) + 0.01 * (i + 1) * 0.25);
  
              }
              positionsAttribute.needsUpdate = true;
              scalesAttribute.needsUpdate = true;
              quaternionsAttribute.needsUpdate = true;
          }

         
         
          
          if(playEffectSw === 1){
              group.position.copy(localPlayer.position);
              rippleMaterial.uniforms.uTime.value=0.35;
              rippleMaterial.uniforms.opacity.value = 1;
              playEffectSw=2;
          }
          
          
          
          if(rippleMaterial.uniforms.uTime.value>0.43)
              rippleMaterial.uniforms.opacity.value-=0.05;
              
         
          rippleMaterial.uniforms.uTime.value += 0.0025 
          
          
          
          
          // if (localPlayer.avatar) {
          //     group.position.y -= localPlayer.avatar.height;
          //     group.position.y += 0.65;
          // }
          group.position.y=waterSurfacePos.y-0.1;
          app.updateMatrixWorld();
      });
    }
  

  return app;
};
