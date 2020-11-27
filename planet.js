import * as THREE from 'https://static.xrpackage.org/xrpackage/three.module.js';
import {renderer, scene, camera} from './app-object.js';
import alea from './alea.js';

const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localFrustum = new THREE.Frustum();

const PARCEL_SIZE = 300;
const SUBPARCEL_SIZE = 10;
const SUBPARCEL_SIZE_P1 = SUBPARCEL_SIZE + 1;
const NUM_PARCELS = PARCEL_SIZE/SUBPARCEL_SIZE;

const MAX_NAME_LENGTH = 32;
const PLANET_OBJECT_SLOTS = 4;
const PLANET_OBJECT_SIZE = (
  Uint32Array.BYTES_PER_ELEMENT + // id
  Uint32Array.BYTES_PER_ELEMENT + // type
  MAX_NAME_LENGTH * Uint8Array.BYTES_PER_ELEMENT + // build.name
  Float32Array.BYTES_PER_ELEMENT * 3 + // build.position
  Float32Array.BYTES_PER_ELEMENT * 4 // build.quaternion
);

const parcelSize = PARCEL_SIZE;
const subparcelSize = SUBPARCEL_SIZE;

const chunkDistance = 2;

const numSlices = (1+chunkDistance*2+1)**3;
const slabRadius = Math.sqrt((SUBPARCEL_SIZE/2)*(SUBPARCEL_SIZE/2)*3);

const slabTotalSize = 30 * 1024 * 1024;
const slabNumAttributes = 4;
const slabAttributeSize = slabTotalSize/slabNumAttributes;
const slabSliceTris = Math.floor(slabAttributeSize/numSlices/9/Float32Array.BYTES_PER_ELEMENT);
const slabSliceVertices = slabSliceTris * 3;

const meshId = 1;

let _update = null;

(async () => {
  const colors = await (async () => {
    const res = await fetch('./colors.json');
    return await res.json();
  })();

  const seedString = 'lol';
  const rng = alea(seedString);
  const seedNum = Math.floor(rng() * 0xFFFFFF);

  function abs(n) {
    return (n ^ (n >> 31)) - (n >> 31);
  }
  function sign(n) {
    return -(n >> 31);
  }
  const _getSubparcelIndex = (x, y, z) => abs(x)|(abs(y)<<9)|(abs(z)<<18)|(sign(x)<<27)|(sign(y)<<28)|(sign(z)<<29);
  const _getSubparcelXYZ = index => {
    let x = index&0x1FF; // (1<<9)-1
    index >>>= 9;
    let y = index&0x1FF;
    index >>>= 9;
    let z = index&0x1FF;
    index >>>= 9;
    const sx = index&0x1;
    if (sx) { x *= -1; }
    index >>>= 1;
    const sy = index&0x1;
    if (sy) { y *= -1; }
    index >>>= 1;
    const sz = index&0x1;
    if (sz) { z *= -1; }
    return [x, y, z];
  };
  const _getPotentialIndex = (x, y, z) => x + y*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1 + z*SUBPARCEL_SIZE_P1;
  const potentialDefault = -0.5;

  const chunkWorker = await (async () => {
    const cbs = [];
    const w = new Worker('chunk-worker.js');
    w.onmessage = e => {
      const {data} = e;
      const {error, result} = data;
      cbs.shift()(error, result);
    };
    w.onerror = err => {
      console.warn(err);
    };
    w.request = (req, transfers) => new Promise((accept, reject) => {
      w.postMessage(req, transfers);

      cbs.push((err, result) => {
        if (!err) {
          accept(result);
        } else {
          reject(err);
        }
      });
    });
    w.requestLoadPotentials = (seed, meshId, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize, subparcelSize) => {
      return w.request({
        method: 'loadPotentials',
        seed,
        meshId,
        x,
        y,
        z,
        baseHeight,
        freqs,
        octaves,
        scales,
        uvs,
        amps,
        parcelSize,
        subparcelSize
      });
    };
    w.requestMarchLand = (seed, meshId, x, y, z, potentials, parcelSize, subparcelSize) => {
      return w.request({
        method: 'marchLand',
        seed,
        meshId,
        x,
        y,
        z,
        potentials,
        parcelSize,
        subparcelSize
      });
    };
    w.requestMine = (meshId, mineSpecs, subparcelSize) => {
      return w.request({
        method: 'mine',
        meshId,
        mineSpecs,
        subparcelSize,
      });
    };
    w.requestGetHeight = (seed, x, y, z, baseHeight, freqs, octaves, scales, uvs, amps, parcelSize) => {
      return w.request({
        method: 'getHeight',
        seed,
        x,
        y,
        z,
        baseHeight,
        freqs,
        octaves,
        scales,
        uvs,
        amps,
        parcelSize,
      });
    };
    return w;
  })();

  class Subparcel {
    constructor(data) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.index = 0;
      this.data = null;
      this.potentials = null;
      this._numObjects = null;
      this.vegetations = [];
      this.packages = [];
      this.load = null;
      this.dirty = false;
      this.potentials = new Float32Array(SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1);

      // this.latchData(data || new ArrayBuffer(Subparcel.offsets.initialLength));
      // data && this.reload();
    }
    /* latchData(data) {
      this.data = data;
      this.potentials = new Float32Array(this.data, Subparcel.offsets.potentials, SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1*SUBPARCEL_SIZE_P1);
      this._numObjects = new Uint32Array(this.data, Subparcel.offsets.numObjects, 1);
    }
    reload() {
      this.readMetadata();
      this.vegetations.length = 0;
      this.packages.length = 0;
      const numObjects = this._numObjects[0];
      for (let i = 0; i < numObjects; i++) {
        const o = new SubparcelObject(this.data, Subparcel.offsets.objects + i*PLANET_OBJECT_SIZE, i, this);
        o.readMetadata();
        if (o.type === OBJECT_TYPES.VEGETATION) {
          this.vegetations.push(o);
        } else if (o.type === OBJECT_TYPES.PACKAGE) {
          this.packages.push(o);
        }
      }
    }
    update() {
      planet.dispatchEvent(new MessageEvent('subparcelupdate', {
        data: this,
      }));
    }
    writeMetadata() {
      const dst = new Int32Array(this.data, Subparcel.offsets.xyz, 3);
      dst[0] = this.x;
      dst[1] = this.y;
      dst[2] = this.z;
    }
    readMetadata() {
      const src = new Int32Array(this.data, Subparcel.offsets.xyz, 3);
      this.x = src[0];
      this.y = src[1];
      this.z = src[2];
      this.index = _getSubparcelIndex(this.x, this.y, this.z);
    } */
    /* setCube(x, y, z, r, fn) {
      for (let dx = -r; dx <= r; dx++) {
        const ax = x + dx;
        for (let dy = -r; dy <= r; dy++) {
          const ay = y + dy;
          for (let dz = -r; dz <= r; dz++) {
            const az = z + dz;
            const index = _getPotentialIndex(ax, ay, az);
            this.potentials[index] = fn(ax, ay, az);
          }
        }
      }
    }
    clearCube(x, y, z, r) {
      for (let dx = -r; dx <= r; dx++) {
        const ax = x + dx;
        for (let dy = -r; dy <= r; dy++) {
          const ay = y + dy;
          for (let dz = -r; dz <= r; dz++) {
            const az = z + dz;
            const index = _getPotentialIndex(ax, ay, az);
            this.potentials[index] = potentialDefault;
          }
        }
      }
    } */
    /* addVegetation(type, position, quaternion) {
      const nextIndex = this._numObjects[0]++;
      if (Subparcel.offsets.objects + nextIndex*PLANET_OBJECT_SIZE >= this.data.byteLength) {
        const newData = new ArrayBuffer(this.data.byteLength + PLANET_OBJECT_SLOTS*PLANET_OBJECT_SIZE);
        new Uint8Array(newData).set(new Uint8Array(this.data));
        this.latchData(newData);
        this.reload();
      }

      const vegetation = new SubparcelObject(this.data, Subparcel.offsets.objects + nextIndex*PLANET_OBJECT_SIZE, nextIndex, this);
      vegetation.id = Math.floor(Math.random()*0xFFFFFF);
      vegetation.type = OBJECT_TYPES.VEGETATION;
      vegetation.name = type;
      position.toArray(vegetation.position);
      quaternion.toArray(vegetation.quaternion);
      vegetation.writeMetadata();
      this.vegetations.push(vegetation);
      return vegetation;
    }
    removeVegetation(vegetationId) {
      const index = this.vegetations.findIndex(v => v.id === vegetationId);
      if (index !== -1) {
        for (let i = index; i < this.vegetations.length-1; i++) {
          const vegetation = this.vegetations[i];
          vegetation.copy(this.vegetations[i+1]);
          vegetation.readMetadata();
        }
        this.vegetations.length--;
        this._numObjects[0]--;
      } else {
        console.warn('removing nonexistent vegetation', vegetation);
      }
    } */
    /* addPackage(dataHash, position, quaternion) {
      for (let i = 0; i < this._freeList.length; i++) {
        if (!this._freeList[i]) {
          this._freeList[i] = 1;

          const pkg = new SubparcelObject(this.data, this.offset + this.offsets.objects + i*PLANET_OBJECT_SIZE, i, this);
          pkg.id = ++this._objectId[0];
          pkg.type = OBJECT_TYPES.PACKAGE;
          pkg.name = type;
          position.toArray(pkg.position);
          quaternion.toArray(pkg.quaternion);
          pkg.writeMetadata();
          this.packages.push(pkg);
          return pkg;
        }
      }
      throw new Error('no more slots for package');
    }
    removePackage(pkg) {
      const index = this.packages.indexOf(pkg);
      if (index !== -1) {
        this._freeList[pkg.index] = 0;
        this.packages.splice(index, 1);
      } else {
        console.warn('removing nonexistent package', pkg);
      }
    } */
    clone() {
      const subparcel = new Subparcel(this.data.slice());
      subparcel.reload();
      return subparcel;
    }
  }
  Subparcel.offsets = (() => {
    let index = 0;

    const xyz = index;
    index += Int32Array.BYTES_PER_ELEMENT * 3;
    const potentials = index;
    index += SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * SUBPARCEL_SIZE_P1 * Float32Array.BYTES_PER_ELEMENT;
    // const numObjects = index;
    // index += Uint32Array.BYTES_PER_ELEMENT;
    // const objects = index;
    // index += PLANET_OBJECT_SIZE * PLANET_OBJECT_SLOTS;
    const initialLength = index;

    return {
      xyz,
      potentials,
      // numObjects,
      // objects,
      initialLength,
    };
  })();

  let subparcels = {};
  const _addSubparcel = (x, y, z, index) => {
    const subparcel = new Subparcel();
    subparcel.x = x;
    subparcel.y = y;
    subparcel.z = z;
    subparcel.index = index;
    // subparcel.writeMetadata();
    // subparcel.vegetations = _makeVegetations(subparcel.x, subparcel.y, subparcel.z);
    subparcels[index] = subparcel;
    return subparcel;
  };
  const _getSubparcelByIndex = index => {
    let subparcel = subparcels[index];
    if (!subparcel) {
      const [x, y, z] = _getSubparcelXYZ(index);
      subparcel = _addSubparcel(x, y, z, index);
    }
    return subparcel;
  };
  const _getSubparcel = (x, y, z) => {
    const index = _getSubparcelIndex(x, y, z);
    let subparcel = subparcels[index];
    if (!subparcel) {
      subparcel = _addSubparcel(x, y, z, index);
    }
    return subparcel;
  };

  const _ensureCoord = coord => {
    const {x: ax, y: ay, z: az, index} = coord;

    for (let dx = 0; dx <= 1; dx++) {
      const adx = ax + dx;
      for (let dy = 0; dy <= 1; dy++) {
        const ady = ay + dy;
        for (let dz = 0; dz <= 1; dz++) {
          const adz = az + dz;
          const subparcel = _getSubparcel(adx, ady, adz);

          if (!subparcel.load) {
            subparcel.load = chunkWorker.requestLoadPotentials(
              seedNum,
              meshId,
              adx,
              ady,
              adz,
              parcelSize/2-10,
              [
                1,
                1,
                1,
              ], [
                3,
                3,
                3,
              ], [
                0.08,
                0.012,
                0.016,
              ], [
                0,
                0,
                0,
              ], [
                1,
                1.5,
                4,
              ],
              parcelSize,
              subparcelSize
            ).then(parcelSpec => {
               subparcel.potentials.set(parcelSpec.potentials);
               /* for (const object of parcelSpec.objects) {
                 subparcel.addVegetation('tree', localVector.fromArray(object.position), localQuaternion.fromArray(object.quaternion));
               } */
            });
          }
        }
      }
    }
  };
  const _loadCoord = coord => {
    const {x: ax, y: ay, z: az, index} = coord;
    /* if (
      !slabs[index] ||
      subparcelsNeedUpdate.some(([x, y, z]) => x === ax && y === ay && z === az)
    ) { */
    let live = true;
    (async () => {
      const subparcel = _getSubparcelByIndex(index);
      await subparcel.load;
      if (!live) return;

      const specs = await chunkWorker.requestMarchLand(
        seedNum,
        meshId,
        ax, ay, az,
        subparcel.potentials,
        parcelSize,
        subparcelSize
      );
      if (!live) return;

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const {x, y, z} = spec;
        const slab = mesh.getSlab(x, y, z);
        slab.position.set(spec.positions);
        slab.barycentric.set(spec.barycentrics);
        slab.id.set(spec.ids);
        const indexOffset = slab.slabIndex * slabSliceTris;
        for (let i = 0; i < spec.indices.length; i++) {
          spec.indices[i] += indexOffset;
        }
        slab.indices.set(spec.indices);

        mesh.updateGeometry(slab, spec);

        const group = geometry.groups.find(group => group.start === slab.slabIndex * slabSliceVertices);
        group.count = spec.positions.length/3;
      }
      /* const bakeSpecs = specs.filter(spec => spec.positions.length > 0).map(spec => {
        const {positions, x, y, z} = spec;
        return positions.length > 0 ? {
          positions,
          x,
          y,
          z,
        } : null;
      });
      if (bakeSpecs.length > 0) {
        const result = await physicsWorker.requestBakeGeometries(bakeSpecs.map(spec => {
          const {positions} = spec;
          return {
            positions,
          };
        }));
        for (let i = 0; i < result.physicsGeometryBuffers.length; i++) {
          const physxGeometry = result.physicsGeometryBuffers[i];
          const {x, y, z} = bakeSpecs[i];
          const slab = currentChunkMesh.getSlab(x, y, z);
          if (slab.physxGeometry) {
            physxWorker.unregisterGeometry(slab.physxGeometry);
            slab.physxGeometry = 0;
          }
          slab.physxGeometry = physxWorker.registerBakedGeometry(currentChunkMesh.meshId, physxGeometry, x, y, z);
        }
      } */
    })()
      .finally(() => {
        if (live) {
          subparcelTasks.splice(subparcelTasks.indexOf(task), 1);
        }
      });
    const task = {
      cancel() {
        live = false;
      },
    };
    let subparcelTasks = marchesTasks[index];
    if (!subparcelTasks) {
      subparcelTasks = [];
      marchesTasks[index] = subparcelTasks;
    }
    subparcelTasks.push(task);
    // }
  };

  const HEIGHTFIELD_SHADER = {
    uniforms: {
      isCurrent: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      uTime: {
        type: 'f',
        value: 0,
        needsUpdate: true,
      },
      tex: {
        type: 't',
        value: new THREE.Texture(),
        needsUpdate: true,
      },
      heightColorTex: {
        type: 't',
        value: null,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      #define LOG2 1.442695
      precision highp float;
      precision highp int;
      uniform float fogDensity;
      // attribute vec4 color;
      attribute vec3 barycentric;
      // attribute float index;
      // attribute float skyLightmap;
      // attribute float torchLightmap;

      // varying vec3 vPosition;
      varying vec3 vWorldPosition;
      varying vec3 vBarycentric;
      // varying vec3 vViewPosition;
      // varying vec4 vColor;
      // varying float vIndex;
      // varying vec3 vNormal;
      // varying float vSkyLightmap;
      // varying float vTorchLightmap;
      // varying float vFog;

      void main() {
        // vColor = color;
        // vNormal = normal;

        vec4 mvPosition = modelViewMatrix * vec4(position.xyz, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // vPosition = position.xyz;
        vWorldPosition = mvPosition.xyz;
        vBarycentric = barycentric;
        // vIndex = index;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;
      // uniform vec3 ambientLightColor;
      uniform float sunIntensity;
      uniform vec3 fogColor;
      // uniform vec3 cameraPosition;
      // uniform sampler2D tex;
      uniform sampler2D heightColorTex;

      // varying vec3 vPosition;
      varying vec3 vWorldPosition;
      varying vec3 vBarycentric;
      // varying float vIndex;
      // varying vec3 vViewPosition;
      // varying vec4 vColor;
      // varying vec3 vNormal;
      // varying float vSkyLightmap;
      // varying float vTorchLightmap;
      // varying float vFog;

      uniform float isCurrent;
      uniform float uTime;

      #define saturate(a) clamp( a, 0.0, 1.0 )

      vec3 lightDirection = normalize(vec3(-1.0, -1.0, -1.0));

      float edgeFactor() {
        vec3 d = fwidth(vBarycentric);
        vec3 a3 = smoothstep(vec3(0.0), d, vBarycentric);
        return min(min(a3.x, a3.y), a3.z);
      }

      void main() {
        /* float lightColor = floor(
          (
            min((vSkyLightmap * sunIntensity) + vTorchLightmap, 1.0)
          ) * 4.0 + 0.5
        ) / 4.0; */
        /* vec3 ambientLightColor = vec3(0.5, 0.5, 0.5);
        vec3 xTangent = dFdx( vPosition );
        vec3 yTangent = dFdy( vPosition );
        vec3 faceNormal = normalize( cross( xTangent, yTangent ) );
        float lightColor = 0.5; // dot(faceNormal, lightDirection);

        vec2 uv = vec2(
          mod((vPosition.x) / 4.0, 1.0),
          mod((vPosition.z) / 4.0, 1.0)
        ); */

        // float d = length(vPosition - vec3(${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}));
        // float dMax = length(vec3(${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}, ${PARCEL_SIZE/2}));
        // vec2 uv2 = vec2(d / dMax, 0.5);
        vec2 uv2 = vec2(0.1 + gl_FragCoord.z/gl_FragCoord.w/10.0 + vWorldPosition.y/30.0, 0.5);
        vec3 c = texture2D(heightColorTex, uv2).rgb;
        vec3 diffuseColor = c * uv2.x;
        if (edgeFactor() <= 0.99) {
          if (isCurrent != 0.0) {
            diffuseColor = mix(diffuseColor, vec3(1.0), max(1.0 - abs(pow(length(vWorldPosition) - uTime*5.0, 3.0)), 0.0)*0.5);
          }
          diffuseColor *= (0.9 + 0.1*min(gl_FragCoord.z/gl_FragCoord.w/10.0, 1.0));
        }

        gl_FragColor = vec4(diffuseColor, 1.0);
      }
    `
  };

  const slabArrayBuffer = new ArrayBuffer(slabTotalSize);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 0*slabAttributeSize, slabSliceVertices*numSlices*3), 3));
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 1*slabAttributeSize, slabSliceVertices*numSlices*3), 3));
  geometry.setAttribute('id', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 2*slabAttributeSize, slabSliceVertices*numSlices), 1));
  geometry.setAttribute('index', new THREE.BufferAttribute(new Float32Array(slabArrayBuffer, 3*slabAttributeSize, slabSliceVertices*numSlices), 1));

  const heightfieldMaterial = new THREE.ShaderMaterial({
    uniforms: (() => {
      const uniforms = Object.assign(
        THREE.UniformsUtils.clone(THREE.UniformsLib.lights),
        THREE.UniformsUtils.clone(HEIGHTFIELD_SHADER.uniforms)
      );
      // uniforms.fogColor.value = scene.fog.color;
      // uniforms.fogDensity.value = scene.fog.density;
      return uniforms;
    })(),
    vertexShader: HEIGHTFIELD_SHADER.vertexShader,
    fragmentShader: HEIGHTFIELD_SHADER.fragmentShader,
    // lights: true,
    extensions: {
      derivatives: true,
    },
  });
  heightfieldMaterial.customProgramCacheKey = () => 'lol';

  const numStops = 1;
  const stops = Array(numStops);
  const colorKeys = Object.keys(colors);
  for (let i = 0; i < numStops; i++) {
    const pos = i === 0 ? 0 : Math.floor(rng() *255);
    const colorIndex = colorKeys[Math.floor(rng() * colorKeys.length)];
    const color = colors[colorIndex];
    const col = parseInt('0x' + color[400].slice(1));
    stops[i] = [pos, col];
  }
  stops.sort((a, b) => a[0] - b[0]);
  heightfieldMaterial.uniforms.heightColorTex.value = new THREE.DataTexture(new Uint8Array(256*3), 256, 1, THREE.RGBFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter, 1);
  heightfieldMaterial.uniforms.heightColorTex.needsUpdate = true;
  stops.forEach((stop, i) => {
    const [startIndex, colorValue] = stop;
    const nextStop = stops[i+1] || null;
    const endIndex = nextStop ? nextStop[0] : 256;
    const color = new THREE.Color(colorValue);
    const colorArray = Uint8Array.from([
      color.r*255,
      color.g*255,
      color.b*255,
    ]);
    for (let j = startIndex; j < endIndex; j++) {
      heightfieldMaterial.uniforms.heightColorTex.value.image.data.set(colorArray, j*3);
    }
  });
  heightfieldMaterial.uniforms.heightColorTex.value.needsUpdate = true;

  const mesh = new THREE.Mesh(geometry, [heightfieldMaterial]);
  mesh.frustumCulled = false;
  /* mesh.meshId = meshId;
  mesh.seedString = seedString;
  mesh.parcelSize = parcelSize;
  mesh.subparcelSize = subparcelSize; */

  const slabs = {};
  const freeSlabs = [];
  let slabIndex = 0;
  mesh.getSlab = (x, y, z) => {
    const index = _getSubparcelIndex(x, y, z);
    let slab = slabs[index];
    if (!slab) {
      slab = freeSlabs.pop();
      if (slab) {
        slab.x = x;
        slab.y = y;
        slab.z = z;
        slab.index = index;
        slabs[index] = slab;
        const {slabIndex} = slab;
        geometry.addGroup(slabIndex * slabSliceVertices, slab.position.length/3, 0);
        geometry.groups[geometry.groups.length-1].boundingSphere =
          new THREE.Sphere(
            new THREE.Vector3(x*subparcelSize + subparcelSize/2, y*subparcelSize + subparcelSize/2, z*subparcelSize + subparcelSize/2),
            slabRadius
          );
      } else {
        slab = {
          x,
          y,
          z,
          index,
          slabIndex,
          position: new Float32Array(geometry.attributes.position.array.buffer, geometry.attributes.position.array.byteOffset + slabIndex*slabSliceVertices*3*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices*3),
          barycentric: new Float32Array(geometry.attributes.barycentric.array.buffer, geometry.attributes.barycentric.array.byteOffset + slabIndex*slabSliceVertices*3*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices*3),
          id: new Float32Array(geometry.attributes.id.array.buffer, geometry.attributes.id.array.byteOffset + slabIndex*slabSliceVertices*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices),
          indices: new Float32Array(geometry.attributes.index.array.buffer, geometry.attributes.index.array.byteOffset + slabIndex*slabSliceVertices*Float32Array.BYTES_PER_ELEMENT, slabSliceVertices),
        };
        slabs[index] = slab;
        geometry.addGroup(slabIndex * slabSliceVertices, slab.position.length/3, 0);
        geometry.groups[geometry.groups.length-1].boundingSphere =
          new THREE.Sphere(
            new THREE.Vector3(x*subparcelSize + subparcelSize/2, y*subparcelSize + subparcelSize/2, z*subparcelSize + subparcelSize/2),
            slabRadius
          );
        slabIndex++;
      }
    }
    return slab;
  };
  mesh.updateGeometry = (slab, spec) => {
    geometry.attributes.position.updateRange.offset = slab.slabIndex*slabSliceVertices*3;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.barycentric.updateRange.offset = slab.slabIndex*slabSliceVertices*3;
    geometry.attributes.barycentric.needsUpdate = true;
    geometry.attributes.id.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.id.needsUpdate = true;
    geometry.attributes.index.updateRange.offset = slab.slabIndex*slabSliceVertices;
    geometry.attributes.index.needsUpdate = true;

    geometry.attributes.position.updateRange.count = spec.positions.length;
    geometry.attributes.barycentric.updateRange.count = spec.barycentrics.length;
    geometry.attributes.id.updateRange.count = spec.ids.length;
    geometry.attributes.index.updateRange.count = spec.indices.length;
    renderer.geometries.update(geometry);
  };

  const currentCoord = new THREE.Vector3(2, 0, 2);
  const marchesTasks = [];
  const vegetationsTasks = [];
  let packagesRunning = false;
  mesh.updateSlab = (x, y, z) => {
    const j = numUpdatedCoords++;
    let coord = updatedCoords[j];
    if (!coord) {
      coord = new THREE.Vector3();
      coord.index = 0;
      updatedCoords[j] = coord;
    }
    coord.x = x;
    coord.y = y;
    coord.z = z;
    coord.index = _getSubparcelIndex(x, y, z);
  };
  scene.add(mesh);

  let i = 0;
  for (let dx = -chunkDistance; dx <= chunkDistance; dx++) {
    const ax = dx + currentCoord.x;
    for (let dy = -chunkDistance; dy <= chunkDistance; dy++) {
      const ay = dy + currentCoord.y;
      for (let dz = -chunkDistance; dz <= chunkDistance; dz++) {
        const az = dz + currentCoord.z;

        const addedCoord = new THREE.Vector3(ax, ay, az);
        addedCoord.index = _getSubparcelIndex(ax, ay, az);
        _ensureCoord(addedCoord);
        _loadCoord(addedCoord);
      }
    }
  }

  _update = () => {
    localFrustum.setFromProjectionMatrix(
      localMatrix.multiplyMatrices(camera.projectionMatrix, localMatrix2.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld))
    );
    // mesh.geometry.originalGroups = mesh.geometry.groups.slice();
    // mesh.geometry.groups = mesh.geometry.groups.filter(group => localFrustum.intersectsSphere(group.boundingSphere));
    // window.groups = mesh.geometry.groups;
  };

  /* const specs = await chunkWorker.requestMarchLand(
    seedNum,
    meshId,
    ax, ay, az,
    subparcel.potentials,
    parcelSize,
    subparcelSize
  );
  if (!live) return;

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const {x, y, z} = spec;
    const slab = mesh.getSlab(x, y, z);
    slab.position.set(spec.positions);
    slab.barycentric.set(spec.barycentrics);
    slab.id.set(spec.ids);
    const indexOffset = slab.slabIndex * slabSliceTris;
    for (let i = 0; i < spec.indices.length; i++) {
      spec.indices[i] += indexOffset;
    }
    slab.indices.set(spec.indices);

    mesh.updateGeometry(slab, spec);

    const group = geometry.groups.find(group => group.start === slab.slabIndex * slabSliceVertices);
    group.count = spec.positions.length/3;
  } */
})();

const update = () => {
  _update && _update();
};
export {
  update,
}