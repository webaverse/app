import * as THREE from 'three';
import {getRenderer} from './renderer.js';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector4D = new THREE.Vector4();
const localTriangle = new THREE.Triangle();

const cameraNear = 0;
const cameraFar = 1000;
const cameraHeight = 30;

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

const _makeGeometry = (position, quaternion, worldSize, worldDepthResolution, depthFloatImageData) => {
  const worldDepthResolutionP1 = worldDepthResolution + 1;
  
  const geometry = new THREE.PlaneBufferGeometry(worldSize, worldSize, worldDepthResolution, worldDepthResolution)
    .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
  const badIndices = {};
  for (let z = 0; z <= worldDepthResolution; z++) {
    for (let x = 0; x <= worldDepthResolution; x++) {
      const index = z * worldDepthResolutionP1 + x;
      const index2 = (worldDepthResolutionP1 - 1 - z) * worldDepthResolutionP1 + x;
      let y = depthFloatImageData[index];
      // window.depthFloatImageData = depthFloatImageData;
      // console.log('got y', y);
      // y = Math.max(y, -cameraHeight);
      /* if (y <= -cameraHeight * 2) {
        y = -cameraHeight;
        // badIndices[index] = true;
        // console.log('bad index', index, x, z);
      } */

      // if (y > -cameraHeight) {
        localVector.fromArray(geometry.attributes.position.array, index * 3)
          .add(position)
          .add(localVector2.set(0, 0, y).applyQuaternion(quaternion));
      /* } else {
        localVector.setScalar(NaN);
      } */
      localVector.toArray(geometry.attributes.position.array, index * 3);
    }
  }
  /* for (let z = 0; z <= worldDepthResolution; z++) {
    for (let x = 0; x <= worldDepthResolution; x++) {
      const index = z * worldDepthResolutionP1 + x;
      localVector.fromArray(geometry.attributes.position.array, index * 3);
    }
  } */
  for (let i = 0; i < geometry.index.array.length; i += 3) {
    const ai = geometry.index.array[i];
    const bi = geometry.index.array[i + 1];
    const ci = geometry.index.array[i + 2];

    // console.log('bad indices', !!(badIndices[ai] && badIndices[bi] && badIndices[ci]));
    if (badIndices[ai] && badIndices[bi] && badIndices[ci]) {
      geometry.index.array[i] = 0;
      geometry.index.array[i + 1] = 0;
      geometry.index.array[i + 2] = 0;
    }
  }

  return geometry;
};
export async function snapshotMapChunk(scene, position, worldSize, worldResolution, worldDepthResolution) {
  const worldResolutionP1 = worldResolution + 1;
  const worldDepthResolutionP1 = worldDepthResolution + 1;

  const _makeMesh = (position, quaternion, worldSize, worldDepthResolution) => {
    const colorRenderTarget = new THREE.WebGLRenderTarget(
      worldResolutionP1,
      worldResolutionP1,
      {
        type: THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
        // encoding: THREE.sRGBEncoding,
      }
    );
    const depthRenderTarget = new THREE.WebGLRenderTarget(
      worldDepthResolutionP1,
      worldDepthResolutionP1,
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
    camera.position.copy(position)
      .add(
        localVector.set(0, 0, cameraHeight)
          .applyQuaternion(quaternion)
      );
    camera.quaternion.copy(quaternion);
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
      const oldOverrideMaterial = scene.overrideMaterial;
      const oldFog = scene.fog;

      // render
      const _renderOverrideMaterial = (renderTarget, overrideMaterial, wp1) => {
        renderer.setViewport(0, 0, wp1, wp1);
        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        scene.overrideMaterial = overrideMaterial;
        scene.fog = null;
        renderer.render(scene, camera);

        const imageData = {
          data: new Uint8Array(wp1 * wp1 * 4),
          width: wp1,
          height: wp1,
        };
        renderer.readRenderTargetPixels(renderTarget, 0, 0, wp1, wp1, imageData.data);
        return imageData;
      };
      colorImageData = _renderOverrideMaterial(colorRenderTarget, null, worldResolutionP1);
      depthFloatImageData = floatImageData(_renderOverrideMaterial(depthRenderTarget, depthMaterial, worldDepthResolutionP1));

      // pop old state
      renderer.setViewport(oldViewport.x, oldViewport.y, oldViewport.z, oldViewport.w);
      renderer.setRenderTarget(oldRenderTarget);
      scene.overrideMaterial = oldOverrideMaterial;
      scene.fog = oldFog;
    }

    const geometry = _makeGeometry(
      camera.position,
      camera.quaternion,
      worldSize,
      worldDepthResolution,
      depthFloatImageData,
    );

    const colorTex = new THREE.DataTexture(
      colorImageData.data,
      worldResolutionP1,
      worldResolutionP1,
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
    const material = new THREE.MeshBasicMaterial({
      // map: colorRenderTarget.texture,
      map: colorTex,
      color: 0xFFFFFF,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.depthFloatImageData = depthFloatImageData;
    return mesh;
  };
  const topMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2),
    worldSize,
    worldDepthResolution,
  );
  const bottomMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2),
    worldSize,
    worldDepthResolution,
  );
  const leftMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2),
    worldSize,
    worldDepthResolution,
  );
  const rightMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2),
    worldSize,
    worldDepthResolution,
  );
  const frontMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0),
    worldSize,
    worldDepthResolution,
  );
  const backMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
    worldSize,
    worldDepthResolution,
  );

  {
    const clipRange = 3;
    const _cleanGeometry = geometry => {
      let index = 0;

      for (let iy = 0; iy < worldDepthResolution; iy++) {
        for (let ix = 0; ix < worldDepthResolution; ix++) {
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
    _cleanGeometry(topMesh.geometry);
    _cleanGeometry(bottomMesh.geometry);
    _cleanGeometry(leftMesh.geometry);
    _cleanGeometry(rightMesh.geometry);
    _cleanGeometry(frontMesh.geometry);
    _cleanGeometry(backMesh.geometry);
  }

  const object = new THREE.Object3D();
  object.add(topMesh);
  object.add(bottomMesh);
  object.add(leftMesh);
  object.add(rightMesh);
  object.add(frontMesh);
  object.add(backMesh);
  return object;
}