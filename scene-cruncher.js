import * as THREE from 'three';
// import { BufferGeometryUtils } from 'three';
import {getRenderer, rootScene} from './renderer.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const localVector4D = new THREE.Vector4();

const cameraNear = 0;
const cameraFar = 1000;

const imageBitmap2ImageData = imageBitmap => {
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
};
const floatImageData = imageData => {
  return new Float32Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    imageData.data.byteLength / Float32Array.BYTES_PER_ELEMENT
  );
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
    float viewZ = orthographicDepthToViewZ(d, ${cameraNear.toFixed(8)}, ${cameraFar.toFixed(8)});
    gl_FragColor = encode_float(viewZ).abgr;

    ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`;

export async function snapshotMapChunk(x, y, worldSize, worldResolution) {
  try {
  
  const worldResolutionP1 = worldResolution + 1;

  const colorRenderTarget = new THREE.WebGLRenderTarget(
    worldResolutionP1,
    worldResolutionP1,
    {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
    }
  );
  const depthRenderTarget = new THREE.WebGLRenderTarget(
    worldResolutionP1,
    worldResolutionP1,
    {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
    }
  );

  const camera = new THREE.OrthographicCamera(
    -worldSize / 2,
    worldSize / 2,
    worldSize / 2,
    -worldSize / 2,
    cameraNear,
    cameraFar,
  );
  camera.position.set(0, 100, 0);
  camera.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
  camera.updateMatrixWorld();

  const depthMaterial = new THREE.ShaderMaterial({
    vertexShader: depthVertexShader,
    fragmentShader: depthFragmentShader,
  });

  // render
  let colorImageData = null;
  let depthFloatImageData = null;
  {
    const renderer = getRenderer();
    
    // push old state
    const oldViewport = renderer.getViewport(localVector4D);
    const oldRenderTarget = renderer.getRenderTarget();
    const oldOverrideMaterial = rootScene.overrideMaterial;

    // render
    const _renderOverrideMaterial = (renderTarget, overrideMaterial) => {
      renderer.setViewport(0, 0, worldResolutionP1, worldResolutionP1);
      renderer.setRenderTarget(renderTarget);
      renderer.clear();
      rootScene.overrideMaterial = overrideMaterial;
      renderer.render(rootScene, camera);

      const imageData = {
        data: new Uint8Array(worldResolutionP1 * worldResolutionP1 * 4),
      };
      renderer.readRenderTargetPixels(renderTarget, 0, 0, worldResolutionP1, worldResolutionP1, imageData.data);
      return imageData;
    };
    colorImageData = _renderOverrideMaterial(colorRenderTarget, null);
    depthFloatImageData = floatImageData(_renderOverrideMaterial(depthRenderTarget, depthMaterial));

    // pop old state
    renderer.setViewport(oldViewport.x, oldViewport.y, oldViewport.z, oldViewport.w);
    renderer.setRenderTarget(oldRenderTarget);
    rootScene.overrideMaterial = oldOverrideMaterial;
  }

  const geometry = new THREE.PlaneBufferGeometry(worldSize, worldSize, worldResolution, worldResolution)
    .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2));
  for (let z = 0; z <= worldResolution; z++) {
    for (let x = 0; x <= worldResolution; x++) {
      const index = z * worldResolutionP1 + x;
      const index2 = (worldResolutionP1 - 1 - z) * worldResolutionP1 + x;
      const y = camera.position.y + depthFloatImageData[index2];

      const indexY = index * 3 + 1;
      geometry.attributes.position.array[indexY] = y;
    }
  }

  /* const geometries = [];
  const boxGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  for (let z = 0; z <= worldResolution; z++) {
    for (let x = 0; x <= worldResolution; x++) {
      const geometry = boxGeometry.clone();
      const index = (worldResolutionP1 - 1 - z) * worldResolutionP1 + x;
      const y = floatImageData[index];
      const position = camera.position.clone()
        .add(new THREE.Vector3(
          (x - worldResolution/2) * worldSize / worldResolution,
          y,
          (z - worldResolution/2) * worldSize / worldResolution,
        ));
      geometry.translate(position.x, position.y, position.z);
      geometries.push(geometry);
    }
  }
  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries); */
  const material = new THREE.MeshPhongMaterial({
    color: 0xFF0000,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;

  } catch (e) {
    console.warn(e);
  }
}