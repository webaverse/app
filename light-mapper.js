import * as THREE from 'three';
// import {getRenderer, scene} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localBox = new THREE.Box3();

// const zeroVector = new THREE.Vector3();

//

/* const _writeTex3d = (() => {
  const localVector = new THREE.Vector3();
  const localBox = new THREE.Box3();
  return (dstTex, dstSize, dstPosition, srcArray, sourceBox) => {
    const renderer = getRenderer();

    _copyArray3d(dstTex.image.data, dstSize, dstPosition, srcArray, sourceBox);

    const w = sourceBox.max.x - sourceBox.min.x + 1;
    const h = sourceBox.max.y - sourceBox.min.y + 1;
    const d = sourceBox.max.z - sourceBox.min.z + 1;

    const destinationBox = localBox.set(
      dstPosition,
      localVector.set(dstPosition.x + w - 1, dstPosition.y + h - 1, dstPosition.z + d - 1),
    );

    const level = 0;

    renderer.copyTextureToTexture3D(destinationBox, dstPosition, dstTex, dstTex, level);
  };
})();
const _writeTex3dWithin = (() => {
  const localVector = new THREE.Vector3();
  const localBox = new THREE.Box3();
  return (dstTex, dstSize, dstPosition, sourceBox) => {
    const renderer = getRenderer();

    _copyArray3dWithin(dstTex.image.data, dstSize, dstPosition, sourceBox);
    
    const w = sourceBox.max.x - sourceBox.min.x + 1;
    const h = sourceBox.max.y - sourceBox.min.y + 1;
    const d = sourceBox.max.z - sourceBox.min.z + 1;

    const destinationBox = localBox.set(
      dstPosition,
      localVector.set(dstPosition.x + w - 1, dstPosition.y + h - 1, dstPosition.z + d - 1),
    );

    const level = 0;

    renderer.copyTextureToTexture3D(destinationBox, dstPosition, dstTex, dstTex, level);
  };
})();

//

const _copyArray3d = (dstArray, dstSize, dstPosition, srcArray, sourceBox) => {
  const sw = sourceBox.max.x - sourceBox.min.x + 1;
  const sh = sourceBox.max.y - sourceBox.min.y + 1;
  const sd = sourceBox.max.z - sourceBox.min.z + 1;
  
  for (let z = 0; z < sd; z++) {
    const sz = z + sourceBox.min.z;
    const dz = dstPosition.z + z;
    for (let y = 0; y < sh; y++) {
      const sy = y + sourceBox.min.y;
      const dy = dstPosition.y + y;
      let srcIndex = sourceBox.min.x + sy * sw + sz * sw * sh;
      let dstIndex = dstPosition.x + dy * dstSize.x + dz * dstSize.x * dstSize.y;
      for (let x = 0; x < sw; x++) {
        dstArray[dstIndex++] = srcArray[srcIndex++];
      }
    }
  }
};
const _copyArray3dWithin = (array, dstSize, dstPosition, sourceBox) => {
  // note that we need to pay attention to the copy direction
  // if the src < dst, we need to copy backwards
  const sw = sourceBox.max.x - sourceBox.min.x + 1;
  const sh = sourceBox.max.y - sourceBox.min.y + 1;
  const sd = sourceBox.max.z - sourceBox.min.z + 1;

  const flipX = sourceBox.min.x < dstPosition.x;
  const flipY = sourceBox.min.y < dstPosition.y;
  const flipZ = sourceBox.min.z < dstPosition.z;

  const startX = flipX ? sw - 1 : 0;
  const startY = flipY ? sh - 1 : 0;
  const startZ = flipZ ? sd - 1 : 0;

  // const endX = flipX ? -1 : sw;
  const endY = flipY ? -1 : sh;
  const endZ = flipZ ? -1 : sd;

  const deltaX = flipX ? -1 : 1;
  const deltaY = flipY ? -1 : 1;
  const deltaZ = flipZ ? -1 : 1;

  for (let z = startZ; z !== endZ; z += deltaZ) {
    const sz = z + sourceBox.min.z;
    const dz = dstPosition.z + z;
    for (let y = startY; y !== endY; y += deltaY) {
      const sy = y + sourceBox.min.y;
      const dy = dstPosition.y + y;
      let srcIndex = startX + sourceBox.min.x + sy * dstSize.x + sz * dstSize.x * dstSize.y;
      let dstIndex = startX + dstPosition.x + dy * dstSize.x + dz * dstSize.x * dstSize.y;
      for (let x = 0; x < sw; x++) {
        array[dstIndex] = array[srcIndex];
        dstIndex += deltaX;
        srcIndex += deltaX;
      }
    }
  }
}; */

//

export class LightMapper /* extends EventTarget */ {
  constructor({
    // chunkSize,
    // terrainSize,
    // range,
    procGenInstance,
    size,
    debug,
  }) {
    // super();

    this.procGenInstance = procGenInstance;
    this.size = size;
    // this.chunkSize = chunkSize;
    // this.terrainSize = terrainSize;
    // this.range = range;
    // this.debug = debug;

    this.lastUpdateCoord = new THREE.Vector3(NaN, NaN, NaN);

    this.queued = false;
    this.queuedPosition = new THREE.Vector3();

    const skylightData = new Uint8Array(size.x * size.y * size.z);
    const skylightTex = new THREE.DataTexture3D(skylightData, size.x, size.y, size.z);
    skylightTex.format = THREE.RedFormat;
    skylightTex.type = THREE.UnsignedByteType;
    skylightTex.minFilter = THREE.LinearFilter;
    skylightTex.magFilter = THREE.LinearFilter;
    skylightTex.flipY = false;
    skylightTex.needsUpdate = true;
    skylightTex.generateMipmaps = false;
    this.skylightTex = skylightTex;

    const aoData = new Uint8Array(size.x * size.y * size.z);
    const aoTex = new THREE.DataTexture3D(aoData, size.x, size.y, size.z);
    aoTex.format = THREE.RedFormat;
    aoTex.type = THREE.UnsignedByteType;
    aoTex.minFilter = THREE.LinearFilter;
    aoTex.magFilter = THREE.LinearFilter;
    // aoTex.minFilter = THREE.NearestFilter;
    // aoTex.magFilter = THREE.NearestFilter;
    aoTex.flipY = false;
    aoTex.needsUpdate = true;
    aoTex.generateMipmaps = false;
    this.aoTex = aoTex;

    /* this.lightBasePosition = new THREE.Vector3(
      -terrainSize / 2,
      0,
      -terrainSize / 2
    );
    this.lightTexSize = new THREE.Vector3(terrainSize, terrainSize, terrainSize); */

    this.debugMesh = null;
    if (debug) {
      this.debugMesh = (() => {
        const maxInstances = size.x * size.y * size.z;
        const instancedCubeGeometry = new THREE.InstancedBufferGeometry();
        {
          const cubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
          for (const k in cubeGeometry.attributes) {
            instancedCubeGeometry.setAttribute(k, cubeGeometry.attributes[k]);
          }
          instancedCubeGeometry.setIndex(cubeGeometry.index);
        }
        const debugMaterial = new WebaverseShaderMaterial({
          uniforms: {
            uSkylightTex: {
              value: this.skylightTex,
              needsUpdate: true,
            },
            uAoTex: {
              value: this.aoTex,
              needsUpdate: true,
            },
          },
          vertexShader: `\
            varying vec3 vNormal;
            varying vec3 vUv;
            
            const vec3 size = vec3(${size.toArray().map(n => n.toFixed(8)).join(',')});
            
            void main() {
              float instance = float(gl_InstanceID);
              float x = mod(instance, size.x);
              instance = (instance - x) / size.x;
              float y = mod(instance, size.y);
              instance = (instance - y) / size.y;
              float z = instance;

              vec3 offset = vec3(x, y, z);
              vUv = offset / size;

              gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);

              vNormal = normalMatrix * normal;
            }
          `,
          fragmentShader: `\
            precision highp sampler3D;
          
            uniform sampler3D uSkylightTex;
            uniform sampler3D uAoTex;

            varying vec3 vNormal;
            varying vec3 vUv;

            void main() {
              float skylight = texture(uSkylightTex, vUv).r;
              float ao = texture(uAoTex, vUv).r;

              // float c = 1. - (skylight * 255. / 8.);

              float s = skylight * 255. / 8.;
              float a = ao * 255. / 27.;

              s = 1. - s;
              a = 1. - a;

              if (s > 0.0) {
                gl_FragColor = vec4(vNormal, s);
              } else {
                discard;
              }
            }
          `,
          // color: 0xFFFFFF,
          transparent: true,
          // opacity: 0.1,
        });
        const debugMesh = new THREE.InstancedMesh(instancedCubeGeometry, debugMaterial, maxInstances);
        debugMesh.frustumCulled = false;
        
        return debugMesh;
      })();
    }
  }
  /* drawChunk(chunk, {
    skylights,
    aos,
  }) {
    const position = localVector.copy(chunk)
      .multiplyScalar(this.chunkSize)
      .sub(this.lightBasePosition);
    if (
      position.x >= 0 && position.x < this.terrainSize &&
      position.y >= 0 && position.y < this.terrainSize &&
      position.z >= 0 && position.z < this.terrainSize
    ) {
      const sourceBox = localBox.set(
        localVector2.set(0, 0, 0),
        localVector3.set(this.chunkSize - 1, this.chunkSize - 1, this.chunkSize - 1)
      );

      _writeTex3d(this.skylightTex, this.lightTexSize, position, skylights, sourceBox);
      _writeTex3d(this.aoTex, this.lightTexSize, position, aos, sourceBox);
    } else {
      // chunk out of lighting range
    }

    this.dispatchEvent(new MessageEvent('chunkupdate', {
      data: {
        chunk,
        // skylights,
        // ao,
      },
    }));
  } */
  update(position) {
    if (!this.updating) {
      (async () => {
        this.updating = true;
      
        const coord = localVector.copy(position);
        coord.x = Math.floor(coord.x);
        coord.y = Math.floor(coord.y);
        coord.z = Math.floor(coord.z);
        if (!this.lastUpdateCoord.equals(coord)) {
          this.lastUpdateCoord.copy(coord);

          if (this.debugMesh) {
            const coordOffset = localVector2.set(
              coord.x - Math.floor(this.size.x / 2),
              coord.y - Math.floor(this.size.y / 2),
              coord.z - Math.floor(this.size.z / 2)
            );
            const lod = 1;
            const {
              skylights,
              aos,
            } = await this.procGenInstance.dcWorkerManager.getLightRange(
              coordOffset.x,
              coordOffset.y,
              coordOffset.z,
              this.size.x,
              this.size.y,
              this.size.z,
              lod
            );

            this.skylightTex.image.data.set(skylights);
            this.skylightTex.needsUpdate = true;

            this.aoTex.image.data.set(aos);
            this.aoTex.needsUpdate = true;

            /* console.log(
              'got skylights aos',
              skylights.filter(n => n !== 0).slice(0, 16).join(','),
              aos.filter(n => n !== 0).slice(0, 16).join(','),
              this.skylightTex.image.data.filter(n => n !== 0).slice(0, 16).join(','),
            ); */

            // this.heightfieldTexture.image.data.set(heightfield);
            // this.heightfieldTexture.needsUpdate = true;

            this.debugMesh.position.copy(coordOffset);
            /* if (this.debugMesh.parent) {
              this.debugMesh.position
                .applyMatrix4(localMatrix.copy(this.debugMesh.parent.matrixWorld).invert());
            } */
            // console.log('got position', this.debugMesh.position.toArray().join(','));
            this.debugMesh.updateMatrixWorld();
          }
        }

        this.updating = false;
        
        if (this.queued) {
          this.queued = false;
          this.update(this.queuedPosition);
        }
      })();
    } else {
      this.queued = true;
      this.queuedPosition.copy(position);
    }
  }
  /* updateCoord(min1xCoord) {
    const lastPosition = this.lightBasePosition;
    const newPosition = localVector.copy(min1xCoord)
      .multiplyScalar(this.chunkSize);
    const deltaNegative = localVector2.copy(lastPosition)
      .sub(newPosition);

    if (!deltaNegative.equals(zeroVector)) {
      const position = deltaNegative;
      const sourceBox = localBox.set(
        localVector3.set(0, 0, 0),
        localVector4.set(this.terrainSize - 1, this.terrainSize - 1, this.terrainSize - 1)
      );

      // clip to texture bounds
      if (position.x < 0) {
        const deltaX = -position.x;
        sourceBox.min.x += deltaX;
        position.x += deltaX;
      } else if (position.x > 0) {
        sourceBox.max.x -= position.x;
      }
      if (position.y < 0) {
        const deltaY = -position.y;
        sourceBox.min.y += deltaY;
        position.y += deltaY;
      } else if (position.y > 0) {
        sourceBox.max.y -= position.y;
      }
      if (position.z < 0) {
        const deltaZ = -position.z;
        sourceBox.min.z += deltaZ;
        position.z += deltaZ;
      } else if (position.z > 0) {
        sourceBox.max.z -= position.z;
      }

      _writeTex3dWithin(this.skylightTex, this.lightTexSize, position, sourceBox);
      _writeTex3dWithin(this.aoTex, this.lightTexSize, position, sourceBox);

      this.lightBasePosition.copy(newPosition);

      this.dispatchEvent(new MessageEvent('coordupdate', {
        data: {
          coord: newPosition,
        },
      }));
    }
  } */
}