import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import renderSettingsManager from './rendersettings-manager.js';
import {localPlayer} from './players.js';
import physicsManager from './physics-manager.js';

window.lol = true;
window.backBottomLefts = [];
window.positionOffsetsScaled = [];

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localVector4D = new THREE.Vector4();
// const localTriangle = new THREE.Triangle();

const cameraNear = 0;
// const cameraFar = 1000;
// const cameraHeight = 30;

/* const imageBitmap2ImageData = imageBitmap => {
  const canvas = document.createElement('canvas');
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const context = canvas.getContext('2d');
  context.drawImage(imageBitmap, 0, 0);
  return context.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
};
const renderer2ImageData = (renderer, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(renderer.domElement, 0, 0);
  return context.getImageData(0, 0, width, height);
}; */
const floatImageData = imageData => {
  const result = new Float32Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    imageData.data.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
  const {width, height} = imageData;
  // flip Y
  for (let y = 0; y < height / 2; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const j = (height - y - 1) * width + x;
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
  }
  return result;
};

const depthVertexShader = `\
  ${THREE.ShaderChunk.common}

  precision highp float;
  precision highp int;
  /* uniform float uVertexOffset;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  varying vec2 vWorldUv;
  varying vec3 vPos;
  varying vec3 vNormal; */

  ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

  void main() {
    // vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // vec3 newPosition = position + normal * vec3( uVertexOffset, uVertexOffset, uVertexOffset );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    ${THREE.ShaderChunk.logdepthbuf_vertex}

    // vViewPosition = -mvPosition.xyz;
    // vUv = uv;
    // vPos = position;
    // vNormal = normal;
  }
`;
const depthFragmentShader = `\
  // uniform vec3 uColor;
  // uniform float uTime;
  uniform float cameraNear;
  uniform float cameraFar;

  // varying vec3 vViewPosition;
  // varying vec2 vUv;

  // varying vec3 vPos;
  // varying vec3 vNormal;

  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

  #define FLOAT_MAX  1.70141184e38
  #define FLOAT_MIN  1.17549435e-38

  lowp vec4 encode_float(highp float v) {
    highp float av = abs(v);

    //Handle special cases
    if(av < FLOAT_MIN) {
      return vec4(0.0, 0.0, 0.0, 0.0);
    } else if(v > FLOAT_MAX) {
      return vec4(127.0, 128.0, 0.0, 0.0) / 255.0;
    } else if(v < -FLOAT_MAX) {
      return vec4(255.0, 128.0, 0.0, 0.0) / 255.0;
    }

    highp vec4 c = vec4(0,0,0,0);

    //Compute exponent and mantissa
    highp float e = floor(log2(av));
    highp float m = av * pow(2.0, -e) - 1.0;
    
    //Unpack mantissa
    c[1] = floor(128.0 * m);
    m -= c[1] / 128.0;
    c[2] = floor(32768.0 * m);
    m -= c[2] / 32768.0;
    c[3] = floor(8388608.0 * m);
    
    //Unpack exponent
    highp float ebias = e + 127.0;
    c[0] = floor(ebias / 2.0);
    ebias -= c[0] * 2.0;
    c[1] += floor(ebias) * 128.0; 

    //Unpack sign bit
    c[0] += 128.0 * step(0.0, -v);

    //Scale back to range
    return c / 255.0;
  }

  // note: the 0.1s here an there are voodoo related to precision
  float decode_float(vec4 v) {
    vec4 bits = v * 255.0;
    float sign = mix(-1.0, 1.0, step(bits[3], 128.0));
    float expo = floor(mod(bits[3] + 0.1, 128.0)) * 2.0 +
                floor((bits[2] + 0.1) / 128.0) - 127.0;
    float sig = bits[0] +
                bits[1] * 256.0 +
                floor(mod(bits[2] + 0.1, 128.0)) * 256.0 * 256.0;
    return sign * (1.0 + sig / 8388607.0) * pow(2.0, expo);
  }

  float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
    return linearClipZ * ( near - far ) - near;
  }

  void main() {
    float d = gl_FragCoord.z/gl_FragCoord.w;
    float viewZ = orthographicDepthToViewZ(d, cameraNear, cameraFar);
    gl_FragColor = encode_float(viewZ).abgr;

    ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`;
const depthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    cameraNear: {
      value: 0,
      needsUpdate: true,
    },
    cameraFar: {
      value: 1,
      needsUpdate: true,
    },
  },
  vertexShader: depthVertexShader,
  fragmentShader: depthFragmentShader,
});

const _snap = v => {
  v.x = Math.round(v.x);
  v.y = Math.round(v.y);
  v.z = Math.round(v.z);
  return v;
};
const _makeGeometry = (position, quaternion, center, worldSize, worldDepthResolution, depthFloatImageData, ethers) => {
  const worldDepthResolutionP1 = worldDepthResolution.clone().add(new THREE.Vector3(1, 1, 1));
  
  const geometries = [];
  const baseGeometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);

  const forwardDirection = _snap(new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion));
  const upDirection = _snap(new THREE.Vector3(0, -1, 0).applyQuaternion(quaternion));
  const rightDirection = _snap(new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion));
  // const backPlanePosition = new THREE.Vector3(0, 0, worldDepthResolution.x / 2).applyQuaternion(quaternion);
  const baseWorldPosition = position.clone()
    .add(new THREE.Vector3(-worldSize.x/2, worldSize.y/2, -worldSize.z).applyQuaternion(quaternion));
  // console.log('got position world size', {position, worldSize, baseWorldPosition});
  /* _snap(new THREE.Vector3(
    -worldDepthResolution.x/2,
    -worldDepthResolution.y/2,
    worldDepthResolution.x
  ).add(
    new THREE.Vector3(
      worldDepthResolution.x/2,
      worldDepthResolution.y/2,
      worldDepthResolution.x/2
    ).applyQuaternion(quaternion)
  )); */
  // window.backBottomLefts.push(backBottomLeft);

  const geometry = new THREE.PlaneBufferGeometry(worldSize.x, worldSize.z, worldDepthResolution.x, worldDepthResolution.y)
    .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
  // const badIndices = {};
  for (let y = 0; y <= worldDepthResolution.y; y++) {
    for (let x = 0; x <= worldDepthResolution.x; x++) {
      const index = y * worldDepthResolutionP1.x + x;
      // const index2 = (worldDepthResolutionP1.y - 1 - z) * worldDepthResolutionP1.x + x;
      let z = depthFloatImageData[index];
      // window.depthFloatImageData = depthFloatImageData;
      // console.log('got y', y);
      // y = Math.max(y, -cameraHeight);
      /* if (y <= -cameraHeight * 2) {
        y = -cameraHeight;
        // badIndices[index] = true;
        // console.log('bad index', index, x, z);
      } */

      localVector.fromArray(geometry.attributes.position.array, index * 3)
        .add(position)
        .add(localVector2.set(0, 0, z).applyQuaternion(quaternion));
      localVector.toArray(geometry.attributes.position.array, index * 3);

      {
        // const worldBottomLeft = position.clone()

        const z2 = z * worldDepthResolution.x / worldSize.x;
        const localLocation = localVector.set(0, 0, 0)
          .add(rightDirection.clone().multiplyScalar(x))
          .add(upDirection.clone().multiplyScalar(y))
          .add(forwardDirection.clone().multiplyScalar(-worldDepthResolution.x - z2))
          .multiplyScalar(worldSize.x/worldDepthResolution.x)
          .add(baseWorldPosition);
        const g = baseGeometry.clone(); 
        g.translate(localLocation.x, localLocation.y, localLocation.z);
        geometries.push(g);

        // console.log('position offset', position.toArray());

        const basePosition = position.clone()
          .sub(new THREE.Vector3(worldSize.x / 2, worldSize.y / 2, worldSize.z / 2));
        const positionOffset = localLocation.clone().sub(basePosition);
        const positionOffsetScaled = positionOffset.clone().multiply(
          new THREE.Vector3(worldDepthResolutionP1.x/worldSize.x, worldDepthResolutionP1.y/worldSize.y, worldDepthResolutionP1.x/worldSize.z)
        );

        /* localLocation
          .add(
            localVector2.set(worldDepthResolutionP1.x/2, worldDepthResolutionP1.y/2, 0)
              .applyQuaternion(quaternion)
          )
          .multiply(
            localVector2.set(worldDepthResolutionP1.x)
          ); */
        window.positionOffsetsScaled.push(positionOffsetScaled);

        // ethers is a flattened 3d array of size worldDepthResolutionP1
        // here we compute the index into ethers based on localLocation
        const ethersIndex = Math.floor(localLocation.x / worldSize.x * worldDepthResolutionP1.x) +
          Math.floor(localLocation.z / worldSize.z * worldDepthResolutionP1.y) * worldDepthResolutionP1.x;
        // ethers
      }
    }
  }
  /* {
    let allocator = new Allocator();

    const dimsTypedArray = allocator.alloc(Int32Array, 3);
    dimsTypedArray.set(dims);

    const potentialTypedArray = allocator.alloc(Float32Array, potential.length);
    potentialTypedArray.set(potential);

    const shiftTypedArray = allocator.alloc(Float32Array, 3);
    shiftTypedArray.set(shift);

    const scaleTypedArray = allocator.alloc(Float32Array, 3);
    scaleTypedArray.set(scale);

    const outputBufferOffset = moduleInstance._doMarchingCubes(
      dimsTypedArray.byteOffset,
      potentialTypedArray.byteOffset,
      shiftTypedArray.byteOffset,
      scaleTypedArray.byteOffset
    );

    allocator.freeAll();

    const head = outputBufferOffset / 4;

    const positionCount = moduleInstance.HEAP32[head];
    const faceCount = moduleInstance.HEAP32[head + 1];
    const positions = moduleInstance.HEAPF32.slice(head + 2, head + 2 + positionCount);
    const faces = moduleInstance.HEAP32.slice(head + 2 + positionCount, head + 2 + positionCount + faceCount);

    moduleInstance._doFree(outputBufferOffset);

    return {
      positionCount: positionCount,
      faceCount: faceCount,
      positions: positions,
      faces: faces
    }
  } */

  /* for (let z = 0; z <= worldDepthResolution.y; z++) {
    for (let x = 0; x <= worldDepthResolution.x; x++) {
      const index = z * worldDepthResolutionP1.x + x;
      localVector.fromArray(geofmetry.attributes.position.array, index * 3);
    }
  } */
  /* for (let i = 0; i < geometry.index.array.length; i += 3) {
    const ai = geometry.index.array[i];
    const bi = geometry.index.array[i + 1];
    const ci = geometry.index.array[i + 2];

    // console.log('bad indices', !!(badIndices[ai] && badIndices[bi] && badIndices[ci]));
    if (badIndices[ai] && badIndices[bi] && badIndices[ci]) {
      geometry.index.array[i] = 0;
      geometry.index.array[i + 1] = 0;
      geometry.index.array[i + 2] = 0;
    }
  } */

  const geometry2 = BufferGeometryUtils.mergeBufferGeometries(geometries);
  window.geometries = geometries;
  return [geometry, geometry2];
};
const normalMaterial = new THREE.MeshNormalMaterial();
const baseMaterial = new THREE.MeshBasicMaterial({
  map: null,
  color: 0xFFFFFF,

  clipping: false,
  fog: false,
  lights: false,
});
baseMaterial.freeze();
export function snapshotMapChunk(
  scene,
  position,
  worldSize,
  worldResolution,
  worldDepthResolution
) {
  const worldResolutionP1 = worldResolution.clone().add(new THREE.Vector3(1, 1, 1));
  const worldDepthResolutionP1 = worldDepthResolution.clone().add(new THREE.Vector3(1, 1, 1));

  const _makeMesh = (position, quaternion, worldSize, worldDepthResolution, ethers) => {
    const colorRenderTarget = new THREE.WebGLRenderTarget(
      worldResolutionP1.x,
      worldResolutionP1.y,
      {
        type: THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
        // encoding: THREE.sRGBEncoding,
      }
    );
    const depthRenderTarget = new THREE.WebGLRenderTarget(
      worldDepthResolutionP1.x,
      worldDepthResolutionP1.y,
      {
        type: THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
      }
    );

    const cameraFar = worldSize.z;

    const camera = new THREE.OrthographicCamera(
      -worldSize.x / 2,
      worldSize.x / 2,
      worldSize.z / 2,
      -worldSize.z / 2,
      cameraNear,
      cameraFar,
    );
    camera.position.copy(position)
      .add(
        localVector.set(0, 0, cameraFar/2)
          .applyQuaternion(quaternion)
      );
    camera.quaternion.copy(quaternion);
    camera.updateMatrixWorld();

    // render
    let colorImageData = null;
    let depthFloatImageData = null;
    {
      const renderer = getRenderer();
      
      const _pushState = () => {
        // renderer state
        const oldViewport = renderer.getViewport(localVector4D);
        const oldRenderTarget = renderer.getRenderTarget();
        const oldOverrideMaterial = scene.overrideMaterial;
        // const oldFog = scene.fog;

        // avatar state
        const oldAvatarModel = localPlayer.avatar?.model;
        const oldAvatarModelParent = oldAvatarModel?.parent;
        if (oldAvatarModel) {
          scene.add(oldAvatarModel);
        }

        return () => {
          // renderer state
          renderer.setViewport(oldViewport.x, oldViewport.y, oldViewport.z, oldViewport.w);
          renderer.setRenderTarget(oldRenderTarget);
          scene.overrideMaterial = oldOverrideMaterial;
          // scene.fog = oldFog;

          // avatar state
          if (oldAvatarModel) {
            if (oldAvatarModelParent) {
              oldAvatarModelParent.add(oldAvatarModel);
            }
          } else {
            scene.remove(oldAvatarModel);
          }
        };
      };
      const popState = _pushState();

      // render
      const _renderOverrideMaterial = (renderTarget, overrideMaterial, wp1) => {
        renderer.setViewport(0, 0, wp1.x, wp1.y);
        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        scene.overrideMaterial = overrideMaterial;

        const pop = renderSettingsManager.push(scene);
        // scene.fog = null;
        renderer.render(scene, camera);
        pop();

        const imageData = {
          data: new Uint8Array(wp1.x * wp1.y * 4),
          width: wp1.x,
          height: wp1.y,
        };
        renderer.readRenderTargetPixels(renderTarget, 0, 0, wp1.x, wp1.y, imageData.data);
        return imageData;
      };
      // color
      colorImageData = _renderOverrideMaterial(colorRenderTarget, null, worldResolutionP1);
      // depth
      depthMaterial.uniforms.cameraNear.value = cameraNear;
      depthMaterial.uniforms.cameraNear.needsUpdate = true;
      depthMaterial.uniforms.cameraFar.value = cameraFar;
      depthMaterial.uniforms.cameraFar.needsUpdate = true;
      depthFloatImageData = floatImageData(_renderOverrideMaterial(depthRenderTarget, depthMaterial, worldDepthResolutionP1));

      popState();
    }

    const [
      geometry,
      geometry2,
    ] = _makeGeometry(
      camera.position,
      camera.quaternion,
      position,
      worldSize,
      worldDepthResolution,
      depthFloatImageData,
      ethers,
    );

    const colorTex = new THREE.DataTexture(
      colorImageData.data,
      worldResolutionP1.x,
      worldResolutionP1.y,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.NearestFilter,
      THREE.NearestFilter,
      0
    );
    colorTex.needsUpdate = true;
    
    const material = baseMaterial.clone();
    material.map = colorTex;
    material.freeze(baseMaterial.programCacheKey.bind(baseMaterial));
    // material.needsUpdate = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.geometry.depthFloatImageData = depthFloatImageData;

    const mesh2 = new THREE.Mesh(geometry2, normalMaterial);
    mesh2.frustumCulled = false;

    return [
      mesh,
      mesh2,
    ];
  };

  if (
    worldSize.x !== worldSize.y || worldSize.x !== worldSize.z ||
    worldDepthResolution.x !== worldDepthResolution.y
  ) {
    debugger;
    throw new Error('non-cube dimensions not supported');
  }
  const ethers = new Float32Array(worldDepthResolutionP1.x * worldDepthResolutionP1.x * worldDepthResolutionP1.x)
    .fill(1);

  const topMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2),
    worldSize,
    worldDepthResolution,
    ethers
  );
  /* const bottomMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2),
    worldSize,
    worldDepthResolution,
    ethers
  );
  const leftMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2),
    worldSize,
    worldDepthResolution,
    ethers
  );
  const rightMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2),
    worldSize,
    worldDepthResolution,
    ethers
  );
  const frontMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0),
    worldSize,
    worldDepthResolution,
    ethers
  );
  const backMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
    worldSize,
    worldDepthResolution,
    ethers
  ); */
  
  /* {
    const clipRange = 3;
    const _cleanGeometry = (geometry, axis) => {
      let index = 0;

      for (let iy = 0; iy < worldDepthResolution.y; iy++) {
        for (let ix = 0; ix < worldDepthResolution.x; ix++) {
          const a = geometry.index.array[index];
          const b = geometry.index.array[index + 1];
          const d = geometry.index.array[index + 2];
          // const b = geometry.index.array[index + 3];
          const c = geometry.index.array[index + 4];
          // const d = geometry.index.array[index + 5];

          {
            localTriangle.set(
              localVector.fromArray(geometry.attributes.position.array, a * 3),
              localVector2.fromArray(geometry.attributes.position.array, b * 3),
              localVector3.fromArray(geometry.attributes.position.array, d * 3),
            );
            const center = localTriangle.getMidpoint(localVector4);
            
            if (
              localTriangle.a.distanceTo(center) > clipRange ||
              localTriangle.b.distanceTo(center) > clipRange ||
              localTriangle.c.distanceTo(center) > clipRange
            ) {
              geometry.index.array[index] = 0;
              geometry.index.array[index + 1] = 0;
              geometry.index.array[index + 2] = 0;
            }
          }
          {
            localTriangle.set(
              localVector.fromArray(geometry.attributes.position.array, b * 3),
              localVector2.fromArray(geometry.attributes.position.array, c * 3),
              localVector3.fromArray(geometry.attributes.position.array, d * 3),
            );
            const center = localTriangle.getMidpoint(localVector4);

            if (
              localTriangle.a.distanceTo(center) > clipRange ||
              localTriangle.b.distanceTo(center) > clipRange ||
              localTriangle.c.distanceTo(center) > clipRange
            ) {
              geometry.index.array[index + 3] = 0;
              geometry.index.array[index + 4] = 0;
              geometry.index.array[index + 5] = 0;
            }
          }
        
          index += 6;
        }
      }
    };
    // _cleanGeometry(topMesh.geometry);
    // _cleanGeometry(bottomMesh.geometry);
    // _cleanGeometry(leftMesh.geometry);
    // _cleanGeometry(rightMesh.geometry);
    // _cleanGeometry(frontMesh.geometry);
    // _cleanGeometry(backMesh.geometry);
  } */

  const dims = worldDepthResolutionP1.toArray();
  const shift = [0, 0, 0];
  const scale = [1, 1, 1];
  const mc = physicsManager.marchingCubes(dims, ethers, shift, scale)
  console.log('got marching cubes', mc);

  const object = new THREE.Object3D();
  object.add(topMesh[0]);
  object.add(topMesh[1]);
  object.updateMatrixWorld();
  // console.log('got top mesh', topMesh);
  window.topMesh = topMesh;
  // object.add(bottomMesh);
  // object.add(leftMesh);
  // object.add(rightMesh);
  // object.add(frontMesh);
  // object.add(backMesh);
  return object;
};