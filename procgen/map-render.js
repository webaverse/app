import * as THREE from 'three';
import {
  numBlocksPerChunk,
  voxelPixelSize,
  voxelWorldSize,
  chunkWorldSize,
  placeNames,
  MapBlock,
  MapChunk,
  createMapChunk,
} from './map-gen.js';
import easing from '../easing.js';
import {WebaverseShaderMaterial} from '../materials.js';

const cubicBezier = easing(0, 1, 0, 1);

const vertexShader = `\
  varying vec2 vUv;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
  }
`;
const planeFragmentShader = `\
  uniform float iTime;
  uniform sampler2D map;
  uniform vec2 chunkCoords;
  uniform float uHover;
  uniform float uSelect;
  varying vec2 vUv;

  const vec3 color1 = vec3(${new THREE.Color(0x66bb6a).toArray().join(', ')});
  const vec3 color2 = vec3(${new THREE.Color(0x9ccc65).toArray().join(', ')});
  const vec3 color3 = vec3(${new THREE.Color(0xd4e157).toArray().join(', ')});
  const vec3 color4 = vec3(${new THREE.Color(0x9ccc65).toArray().join(', ')});

  bool isInRange(float v, float e) {
    return abs(v - e) <= 0.1/255.;
  }

  void main() {
    vec3 c;
    float r = texture2D(map, vUv).r;
    if (isInRange(r, ${(MapBlock.TYPE_INDICES.exit / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.exit).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(MapBlock.TYPE_INDICES.center / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.center).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(MapBlock.TYPE_INDICES.spline / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.spline).toArray().map(n => n.toFixed(8)).join(', ')});
    } else if (isInRange(r, ${(MapBlock.TYPE_INDICES.path / 255).toFixed(8)})) {
      c = vec3(${new THREE.Color(MapBlock.COLORS.path).toArray().map(n => n.toFixed(8)).join(', ')});
    }
    gl_FragColor.rgb = c;

    // voxel border
    vec2 voxelUv = mod(vUv * ${numBlocksPerChunk.toFixed(8)}, 1.);
    const float limit = 0.075;
    if (
      voxelUv.x <= limit || voxelUv.x >= (1. - limit) ||
      voxelUv.y <= limit || voxelUv.y >= (1. - limit)
    ) {
      gl_FragColor.rgb = vec3(${new THREE.Color(0x111111).toArray().map(n => n.toFixed(8)).join(', ')});
    }

    // chunk border
    const float limit2 = limit/${numBlocksPerChunk.toFixed(8)};
    if (
      vUv.x <= limit2 || vUv.x >= (1. - limit2) ||
      vUv.y <= limit2 || vUv.y >= (1. - limit2)
    ) {
      if (uSelect > 0. && mod(iTime * 0.01, 2.) < 1.) {
        gl_FragColor.rgb = vec3(1.);
      } else {
        gl_FragColor.rgb = vec3(${new THREE.Color(0x181818).toArray().map(n => n.toFixed(8)).join(', ')});
      }
    }

    const float limit3 = 0.005;
    if (
      (
        vUv.x <= limit3 || vUv.x >= (1. - limit3) ||
        vUv.y <= limit3 || vUv.y >= (1. - limit3)
      ) && (
        uSelect > 0. &&
        mod(iTime * 0.01, 2.) < 1.
      )
    ) {
      gl_FragColor.rgb = vec3(1.);
    }
    
    gl_FragColor.gb += vUv * 0.2;
    
    if (uSelect > 0.) {
      gl_FragColor.rgb = mix(
        gl_FragColor.rgb,
        mix(
          mix(color1, color2, vUv.x),
          mix(color3, color4, vUv.x),
          vUv.y
        ),
        0.5
      );
    }

    float y = -vUv.x + uHover * 2.;
    if (vUv.y < y) {
      gl_FragColor.rgb += 0.3;
    }

    gl_FragColor.a = 1.;
  }
`;
export const createMapChunkMesh = (x, y, data) => {
  const planeGeometry = new THREE.PlaneGeometry(chunkWorldSize, chunkWorldSize)
    .applyMatrix4(
      new THREE.Matrix4()
        .makeRotationFromQuaternion(
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
        ),
    );
  const dataTexture = new THREE.DataTexture(
    data,
    numBlocksPerChunk,
    numBlocksPerChunk,
    THREE.RedFormat,
    THREE.UnsignedByteType,
  );
  dataTexture.flipY = true;
  dataTexture.needsUpdate = true;

  const material = new WebaverseShaderMaterial({
    vertexShader,
    fragmentShader: planeFragmentShader,
    uniforms: {
      iTime: {
        value: 0,
        needsUpdate: false,
      },
      uHover: {
        value: 0,
        needsUpdate: false,
      },
      uSelect: {
        value: 0,
        needsUpdate: false,
      },
      map: {
        value: dataTexture,
        needsUpdate: true,
      },
      chunkCoords: {
        value: new THREE.Vector2(x, y),
        needsUpdate: true,
      },
    },
    // transparent: true,
    // opacity: 0.5,
    // side: THREE.DoubleSide,
  });

  /* const m = new THREE.MeshPhongMaterial({
    color: 0xff0000,
  }); */
  const mesh = new THREE.Mesh(planeGeometry, material);

  mesh.hovered = false;
  let lastHoveredTime = -Infinity;
  let lastUnhoveredTime = -Infinity;
  mesh.setHovered = newHovered => {
    mesh.hovered = newHovered;
  };
  mesh.selected = false;
  mesh.setSelected = newSelected => {
    mesh.selected = newSelected;
  };
  mesh.update = (timestamp, timeDiff) => {
    if (mesh.material.uniforms) {
      mesh.material.uniforms.iTime.value = timestamp;
      mesh.material.uniforms.iTime.needsUpdate = true;

      const t = timestamp - (mesh.hovered ? lastUnhoveredTime : lastHoveredTime);
      const tS = t / 1000;
      const v = cubicBezier(tS);
      mesh.material.uniforms.uHover.value = mesh.hovered ? v : 1 - v;
      mesh.material.uniforms.uHover.needsUpdate = true;

      mesh.material.uniforms.uSelect.value = mesh.selected ? 1 : 0;
      mesh.material.uniforms.uSelect.needsUpdate = true;

      if (mesh.hovered) {
        lastHoveredTime = timestamp;
      } else {
        lastUnhoveredTime = timestamp;
      }
    }
  };
  mesh.frustumCulled = false;

  return mesh;
};
