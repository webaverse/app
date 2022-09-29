import * as THREE from 'three';
import {getRenderer} from './renderer.js';
import renderSettingsManager from './rendersettings-manager.js';
import {WebaverseShaderMaterial} from './materials.js';
import {playersManager} from './players-manager.js';
import physicsManager from './physics-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
const localVector4D = new THREE.Vector4();
// const localMatrix = new THREE.Matrix4();

const cameraNear = 0;

const floatImageData = imageData => {
  const result = new Float32Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    imageData.data.byteLength / Float32Array.BYTES_PER_ELEMENT,
  );
  const {width, height} = imageData;
  // flip Y
  for (let y = 0; y < height / 2; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const j = (height - 1 - y) * width + x;
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
  }
  return result;
};

const depthVertexShader = `\
  precision highp float;
  precision highp int;
  /* uniform float uVertexOffset;
  varying vec3 vViewPosition;
  varying vec2 vUv;
  varying vec2 vWorldUv;
  varying vec3 vPos;
  varying vec3 vNormal; */

  void main() {
    // vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // vec3 newPosition = position + normal * vec3( uVertexOffset, uVertexOffset, uVertexOffset );
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

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
  }
`;
const depthMaterial = new WebaverseShaderMaterial({
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
const _getEtherIndex = worldDepthResolutionP3 => p =>
  p.x +
  worldDepthResolutionP3.x * p.z +
  worldDepthResolutionP3.x * worldDepthResolutionP3.x * p.y;
const _makeGeometry = (
  position,
  quaternion,
  worldSize,
  worldDepthResolution,
  depthFloatImageData,
  ethers,
) => {
  const worldDepthResolutionP2 = worldDepthResolution
    .clone()
    .add(new THREE.Vector2(2, 2));
  const worldDepthResolutionP3 = worldDepthResolution
    .clone()
    .add(new THREE.Vector2(3, 3));
  const worldDepthVoxelSize = new THREE.Vector2(
    worldSize.x,
    worldSize.y,
  ).divide(worldDepthResolution);
  const cameraFar = worldSize.z + worldDepthVoxelSize.x * 2;

  // const cubePositions = [];

  const forwardDirection = _snap(
    new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion),
  );
  const upDirection = _snap(
    new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion),
  );
  const rightDirection = _snap(
    new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion),
  );
  const baseWorldPosition = position
    .clone()
    .add(
      new THREE.Vector3(
        -worldSize.x / 2,
        worldSize.y / 2,
        -worldSize.z,
      ).applyQuaternion(quaternion),
    );

  const _isWhole = n => n % 1 === 0;
  const _isGez = n => n >= 0;
  const _etherIndex = _getEtherIndex(worldDepthResolutionP3);
  const _setEther = (p, v) => {
    if (
      _isWhole(p.x) &&
      _isWhole(p.y) &&
      _isWhole(p.z) &&
      _isGez(p.x) &&
      _isGez(p.y) &&
      _isGez(p.z)
    ) {
      const index = _etherIndex(p);
      if (index >= 0 && index < ethers.length) {
        ethers[index] = v;
      }
    }
  };
  for (let y = 0; y < worldDepthResolutionP3.y; y++) {
    for (let x = 0; x < worldDepthResolutionP3.x; x++) {
      const index = y * worldDepthResolutionP3.x + x;
      const z = depthFloatImageData[index];

      /* {
        const x2 = x - 1;
        const y2 = -(y - 1);
        const z2 = (1 + z / cameraFar) * worldDepthResolutionP2.x - 2;
        const voxelLocationPlane = _snap(
          localVector.set(0, 0, 0)
            .add(rightDirection.clone().multiplyScalar(x2))
            .add(upDirection.clone().multiplyScalar(y2))
        );

        const voxelLocationTarget = localVector2.copy(voxelLocationPlane)
          .add(forwardDirection.clone().multiplyScalar(z2));
        const absoluteLocation = localVector3.copy(voxelLocationTarget)
          .multiplyScalar(worldDepthVoxelSize.x)
          .add(baseWorldPosition);
        cubePositions.push(absoluteLocation.clone());
      } */

      {
        const x2 = x;
        const y2 = -y;
        const z2 = (1 + z / cameraFar) * worldDepthResolutionP2.x;
        const voxelLocationPlane = _snap(
          localVector
            .set(0, 0, 0)
            .add(rightDirection.clone().multiplyScalar(x2))
            .add(upDirection.clone().multiplyScalar(y2)),
        );

        for (let dz = worldDepthResolutionP3.x - 1; dz >= 0; dz--) {
          if (dz > z2) {
            // empty
            const voxelLocationTarget = localVector2
              .copy(voxelLocationPlane)
              .add(forwardDirection.clone().multiplyScalar(dz));
            _setEther(voxelLocationTarget, 1);
          } else {
            const lastDz = dz + 1;
            if (lastDz >= 0) {
              const factor = lastDz - z2;
              if (factor <= 0.5) {
                // first half of the cube; adjust from
                const voxelLocationTargetLast = localVector2
                  .copy(voxelLocationPlane)
                  .add(forwardDirection.clone().multiplyScalar(lastDz));
                _setEther(voxelLocationTargetLast, factor / 0.5);
              } else {
                // second half of the cube; adjust to
                const factor2 = 1 - factor;
                const voxelLocationTarget = localVector2
                  .copy(voxelLocationPlane)
                  .add(forwardDirection.clone().multiplyScalar(dz));
                _setEther(voxelLocationTarget, -factor2 / 0.5);
              }
            }
            break;
          }
        }
      }
    }
  }

  const _initializeSides = () => {
    const v = 1_000_000;

    // left
    {
      const x = 0;
      for (let z = 0; z < worldDepthResolutionP3.x; z++) {
        for (let y = 0; y < worldDepthResolutionP3.x; y++) {
          _setEther(localVector.set(x, y, z), v);
        }
      }
    }
    // right
    {
      const x = worldDepthResolutionP3.x - 1;
      for (let z = 0; z < worldDepthResolutionP3.x; z++) {
        for (let y = 0; y < worldDepthResolutionP3.x; y++) {
          _setEther(localVector.set(x, y, z), v);
        }
      }
    }
    // down
    {
      const y = 0;
      for (let x = 0; x < worldDepthResolutionP3.x; x++) {
        for (let z = 0; z < worldDepthResolutionP3.x; z++) {
          _setEther(localVector.set(x, y, z), v);
        }
      }
    }
    // up
    {
      const y = worldDepthResolutionP3.x - 1;
      for (let x = 0; x < worldDepthResolutionP3.x; x++) {
        for (let z = 0; z < worldDepthResolutionP3.x; z++) {
          _setEther(localVector.set(x, y, z), v);
        }
      }
    }
    // forward
    {
      const z = 0;
      for (let x = 0; x < worldDepthResolutionP3.x; x++) {
        for (let y = 0; y < worldDepthResolutionP3.x; y++) {
          _setEther(localVector.set(x, y, z), v);
        }
      }
    }
    // backward
    {
      const z = worldDepthResolutionP3.x - 1;
      for (let x = 0; x < worldDepthResolutionP3.x; x++) {
        for (let y = 0; y < worldDepthResolutionP3.x; y++) {
          _setEther(localVector.set(x, y, z), v);
        }
      }
    }
  };
  _initializeSides();

  const dims = [
    worldDepthResolutionP3.x,
    worldDepthResolutionP3.x,
    worldDepthResolutionP3.x,
  ];
  const shift = [0, 0, 0];
  const scale = new THREE.Vector3().setScalar(worldDepthVoxelSize.x).toArray();
  const mc = physicsManager.marchingCubes(dims, ethers, shift, scale);
  const {faces, positions} = mc;
  const geometry2 = new THREE.BufferGeometry();
  geometry2.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry2.setIndex(new THREE.BufferAttribute(faces, 1));
  geometry2.computeVertexNormals();

  return [geometry2 /*, cubePositions */];
};
// const normalMaterial = new THREE.MeshNormalMaterial();
const baseMaterial = new THREE.MeshBasicMaterial({
  map: null,
  color: 0xffffff,
  fog: false,
});
const triplanarVertexShader = `\
  precision highp float;
  precision highp int;

  varying vec3 vPosition;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vPosition = position;
  }
`;
const triplanarFragmentShader = `\
  uniform sampler2D uColor;
  uniform vec3 uSize;

  varying vec3 vPosition;

  void main() {
    vec2 uv = vPosition.xz / uSize.xz;
    uv.y = 1.- uv.y;
    vec4 c = texture2D(uColor, uv);
    gl_FragColor = vec4(c.rgb, 1.);
    // gl_FragColor = vec4(uv, 0., 1.);
  }
`;
const triplanarMaterial = new WebaverseShaderMaterial({
  uniforms: {
    uColor: {
      value: null,
      needsUpdate: false,
    },
    uSize: {
      value: new THREE.Vector3(1, 1, 1),
      needsUpdate: true,
    },
  },
  vertexShader: triplanarVertexShader,
  fragmentShader: triplanarFragmentShader,

  clipping: false,
  fog: false,
  lights: false,
});
export function snapshotMapChunk(
  scene,
  position,
  worldSize,
  worldResolution,
  worldDepthResolution,
) {
  const worldDepthResolutionP3 = worldDepthResolution
    .clone()
    .add(new THREE.Vector2(3, 3));
  const worldDepthVoxelSize = new THREE.Vector2(
    worldSize.x,
    worldSize.y,
  ).divide(worldDepthResolution);
  const localPlayer = playersManager.getLocalPlayer();

  const _makeMesh = (position, quaternion, ethers) => {
    const colorRenderTarget = new THREE.WebGLRenderTarget(
      worldResolution.x,
      worldResolution.y,
      {
        type: THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
        // encoding: THREE.sRGBEncoding,
      },
    );
    const depthRenderTarget = new THREE.WebGLRenderTarget(
      worldDepthResolutionP3.x,
      worldDepthResolutionP3.y,
      {
        type: THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
      },
    );

    const cameraFar = worldSize.z + worldDepthVoxelSize.x * 2;

    const camera = new THREE.OrthographicCamera(
      -worldSize.x / 2 - worldDepthVoxelSize.x,
      worldSize.x / 2 + worldDepthVoxelSize.x,
      worldSize.z / 2 + worldDepthVoxelSize.y,
      -worldSize.z / 2 - worldDepthVoxelSize.y,
      cameraNear,
      cameraFar,
    );
    camera.position
      .copy(position)
      .add(localVector.set(0, 0, cameraFar / 2).applyQuaternion(quaternion));
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
          renderer.setViewport(
            oldViewport.x,
            oldViewport.y,
            oldViewport.z,
            oldViewport.w,
          );
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
      const _renderOverrideMaterial = (
        renderTarget,
        overrideMaterial,
        wrp1,
      ) => {
        renderer.setViewport(0, 0, wrp1.x, wrp1.y);
        renderer.setRenderTarget(renderTarget);
        renderer.clear();
        scene.overrideMaterial = overrideMaterial;

        {
          const popRenderSettings = renderSettingsManager.push(scene);

          // elide fog rendering for scene snapshot
          scene.fog.density = 0;

          renderer.render(scene, camera);

          popRenderSettings();
        }

        const imageData = {
          data: new Uint8Array(wrp1.x * wrp1.y * 4),
          width: wrp1.x,
          height: wrp1.y,
        };
        renderer.readRenderTargetPixels(
          renderTarget,
          0,
          0,
          wrp1.x,
          wrp1.y,
          imageData.data,
        );
        return imageData;
      };
      // color
      colorImageData = _renderOverrideMaterial(
        colorRenderTarget,
        null,
        worldResolution,
      );
      // depth
      depthMaterial.uniforms.cameraNear.value = cameraNear;
      depthMaterial.uniforms.cameraNear.needsUpdate = true;
      depthMaterial.uniforms.cameraFar.value = cameraFar;
      depthMaterial.uniforms.cameraFar.needsUpdate = true;
      depthFloatImageData = floatImageData(
        _renderOverrideMaterial(
          depthRenderTarget,
          depthMaterial,
          worldDepthResolutionP3,
        ),
      );
      for (let i = 0; i < depthFloatImageData.length; i++) {
        if (depthFloatImageData[i] === cameraNear) {
          depthFloatImageData[i] = -cameraFar;
        }
      }

      popState();
    }

    const [
      geometry2,
      // cubePositions,
    ] = _makeGeometry(
      camera.position,
      camera.quaternion,
      worldSize,
      worldDepthResolution,
      depthFloatImageData,
      ethers,
    );

    const colorTex = new THREE.DataTexture(
      colorImageData.data,
      worldResolution.x,
      worldResolution.y,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.NearestFilter,
      THREE.NearestFilter,
      0,
    );
    colorTex.needsUpdate = true;

    const material2 = triplanarMaterial.clone();
    material2.freeze(triplanarMaterial.programCacheKey.bind(triplanarMaterial));
    material2.uniforms.uColor.value = colorTex;
    material2.uniforms.uColor.needsUpdate = true;
    material2.uniforms.uSize.value.setScalar(
      worldSize.x + worldDepthVoxelSize.x * 2,
    );
    material2.uniforms.uSize.needsUpdate = true;
    const mesh2 = new THREE.Mesh(geometry2, material2);
    const baseWorldPosition = position
      .clone()
      .add(
        new THREE.Vector3(
          -worldSize.x / 2 - worldDepthVoxelSize.x,
          -worldSize.y / 2 - worldDepthVoxelSize.x,
          -worldSize.z / 2 - worldDepthVoxelSize.x,
        ),
      );
    mesh2.position.copy(baseWorldPosition);
    mesh2.frustumCulled = false;
    mesh2.updateMatrixWorld();

    /* const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const mesh3 = new THREE.InstancedMesh(cubeGeometry, normalMaterial, cubePositions.length);
    for (let i = 0; i < cubePositions.length; i++) {
      const position = cubePositions[i];
      mesh3.setMatrixAt(i, localMatrix.makeTranslation(position.x, position.y, position.z));
    }
    mesh3.instanceMatrix.needsUpdate = true;
    mesh3.frustumCulled = false; */

    return [
      mesh2,
      // mesh3,
    ];
  };

  if (
    worldSize.x !== worldSize.y ||
    worldSize.x !== worldSize.z ||
    worldDepthResolution.x !== worldDepthResolution.y
  ) {
    throw new Error('non-cube dimensions not supported');
  }
  const ethers = new Float32Array(
    worldDepthResolutionP3.x *
      worldDepthResolutionP3.x *
      worldDepthResolutionP3.x,
  ).fill(-1);

  const topMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -Math.PI / 2,
    ),
    ethers,
  );
  /* const bottomMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2),
    ethers
  );
  const leftMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2),
    ethers
  );
  const rightMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2),
    ethers
  );
  const frontMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0),
    ethers
  );
  const backMesh = _makeMesh(
    position,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
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

  const object = new THREE.Object3D();
  object.add(topMesh[0]);
  // object.add(topMesh[1]);
  // object.add(bottomMesh);
  // object.add(leftMesh);
  // object.add(rightMesh);
  // object.add(frontMesh);
  // object.add(backMesh);
  object.updateMatrixWorld();

  // console.log('got top mesh', topMesh);
  // window.topMesh = topMesh;

  return object;
}
