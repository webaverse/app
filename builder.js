import * as THREE from './three.module.js';
import {rigManager} from './rig.js';
import {appManager, renderer, scene, camera, dolly} from './app-object.js';

const localVector = new THREE.Vector3();

const geometry = new THREE.BoxBufferGeometry(1, 0.1, 1, 10, 1, 10).toNonIndexed();
{
  const barycentrics = new Float32Array(geometry.attributes.position.array.length);
  let barycentricIndex = 0;
  for (let i = 0; i < geometry.attributes.position.array.length; i += 9) {
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 0;
    barycentrics[barycentricIndex++] = 1;
  }
  geometry.setAttribute('barycentric', new THREE.BufferAttribute(barycentrics, 3));
}
const material = new THREE.ShaderMaterial({
  /* uniforms: {
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    tex: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
    sunIntensity: {
      type: 'f',
      value: 1,
      needsUpdate: true,
    },
    sunDirection: {
      type: 'v3',
      value: new THREE.Vector3(),
      needsUpdate: true,
    },
    uSelectRange: {
      type: 'v4',
      value: new THREE.Vector4().setScalar(NaN),
      needsUpdate: true,
    },
    // "parallaxScale": { value: 0.5 },
    // "parallaxMinLayers": { value: 25 },
    // "parallaxMaxLayers": { value: 30 },
  }, */
  vertexShader: `\
    precision highp float;
    precision highp int;

    uniform vec4 uSelectRange;

    // attribute vec3 barycentric;
    attribute float ao;
    attribute float skyLight;
    attribute float torchLight;

    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vBarycentric;
    varying float vAo;
    varying float vSkyLight;
    varying float vTorchLight;
    varying vec3 vSelectColor;
    varying vec2 vWorldUv;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vViewPosition = -mvPosition.xyz;
      vUv = uv;
      // vBarycentric = barycentric;
      float vid = float(gl_VertexID);
      if (mod(vid, 3.) < 0.5) {
        vBarycentric = vec3(1., 0., 0.);
      } else if (mod(vid, 3.) < 1.5) {
        vBarycentric = vec3(0., 1., 0.);
      } else {
        vBarycentric = vec3(0., 0., 1.);
      }
      vAo = ao/27.0;
      vSkyLight = skyLight/8.0;
      vTorchLight = torchLight/8.0;

      vSelectColor = vec3(0.);
      if (
        position.x >= uSelectRange.x &&
        position.z >= uSelectRange.y &&
        position.x < uSelectRange.z &&
        position.z < uSelectRange.w
      ) {
        vSelectColor = vec3(${new THREE.Color(0x4fc3f7).toArray().join(', ')});
      }

      vec3 vert_tang;
      vec3 vert_bitang;
      if (abs(normal.y) < 0.05) {
        if (abs(normal.x) > 0.95) {
          vert_bitang = vec3(0., 1., 0.);
          vert_tang = normalize(cross(vert_bitang, normal));
          vWorldUv = vec2(dot(position, vert_tang), dot(position, vert_bitang));
        } else {
          vert_bitang = vec3(0., 1., 0.);
          vert_tang = normalize(cross(vert_bitang, normal));
          vWorldUv = vec2(dot(position, vert_tang), dot(position, vert_bitang));
        }
      } else {
        vert_tang = vec3(1., 0., 0.);
        vert_bitang = normalize(cross(vert_tang, normal));
        vWorldUv = vec2(dot(position, vert_tang), dot(position, vert_bitang));
      }
      vWorldUv /= 4.0;
      vec3 vert_norm = normal;

      vec3 t = normalize(normalMatrix * vert_tang);
      vec3 b = normalize(normalMatrix * vert_bitang);
      vec3 n = normalize(normalMatrix * vert_norm);
      mat3 tbn = transpose(mat3(t, b, n));
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    uniform float sunIntensity;
    uniform sampler2D tex;
    uniform float uTime;
    uniform vec3 sunDirection;
    float parallaxScale = 0.3;
    float parallaxMinLayers = 50.;
    float parallaxMaxLayers = 50.;

    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec3 vBarycentric;
    varying float vAo;
    varying float vSkyLight;
    varying float vTorchLight;
    varying vec3 vSelectColor;
    varying vec2 vWorldUv;

    float edgeFactor() {
      vec3 d = fwidth(vBarycentric);
      vec3 a3 = vBarycentric;
      float p = 0.5;
      a3.x = pow(a3.x, p);
      a3.y = pow(a3.y, p);
      a3.z = pow(a3.z, p);
      // a3 *= 0.3;
      return min(min(a3.x, a3.y), a3.z);
    }

    vec2 tileSize = vec2(16./2048.);
    vec4 fourTapSample(
      vec2 tileOffset,
      vec2 tileUV,
      sampler2D atlas
    ) {
      //Initialize accumulators
      vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
      float totalWeight = 0.0;

      for(int dx=0; dx<2; ++dx)
      for(int dy=0; dy<2; ++dy) {
        //Compute coordinate in 2x2 tile patch
        vec2 tileCoord = 2.0 * fract(0.5 * (tileUV + vec2(dx,dy)));

        //Weight sample based on distance to center
        float w = pow(1.0 - max(abs(tileCoord.x-1.0), abs(tileCoord.y-1.0)), 16.0);

        //Compute atlas coord
        vec2 atlasUV = tileOffset + tileSize * tileCoord;

        //Sample and accumulate
        color += w * texture2D(atlas, atlasUV);
        totalWeight += w;
      }

      //Return weighted color
      return color / totalWeight;
    }
    float fourTapSample1(
      vec2 tileOffset,
      vec2 tileUV,
      sampler2D atlas
    ) {
      //Initialize accumulators
      float color = 0.0;
      float totalWeight = 0.0;

      for(int dx=0; dx<2; ++dx)
      for(int dy=0; dy<2; ++dy) {
        //Compute coordinate in 2x2 tile patch
        vec2 tileCoord = 2.0 * fract(0.5 * (tileUV + vec2(dx,dy)));

        //Weight sample based on distance to center
        float w = pow(1.0 - max(abs(tileCoord.x-1.0), abs(tileCoord.y-1.0)), 16.0);

        //Compute atlas coord
        vec2 atlasUV = tileOffset + tileSize * tileCoord;

        //Sample and accumulate
        color += w * texture2D(atlas, atlasUV).r;
        totalWeight += w;
      }

      //Return weighted color
      return color / totalWeight;
    }
    vec3 fourTapSample3(
      vec2 tileOffset,
      vec2 tileUV,
      sampler2D atlas
    ) {
      //Initialize accumulators
      vec3 color = vec3(0.0, 0.0, 0.0);
      float totalWeight = 0.0;

      for(int dx=0; dx<2; ++dx)
      for(int dy=0; dy<2; ++dy) {
        //Compute coordinate in 2x2 tile patch
        vec2 tileCoord = 2.0 * fract(0.5 * (tileUV + vec2(dx,dy)));

        //Weight sample based on distance to center
        float w = pow(1.0 - max(abs(tileCoord.x-1.0), abs(tileCoord.y-1.0)), 16.0);

        //Compute atlas coord
        vec2 atlasUV = tileOffset + tileSize * tileCoord;

        //Sample and accumulate
        color += w * texture2D(atlas, atlasUV).rgb;
        totalWeight += w;
      }

      //Return weighted color
      return color / totalWeight;
    }

    float sampleHeight(vec2 tileOffset, vec2 uv) {
      tileOffset.x += 16.*2.*2./2048.;
      // return fourTapSample1(tileOffset, uv, tex);
      // vec2 texcoord = tileOffset + uv * tileSize;
      // return texture2DGradEXT(tex, texcoord, dFdx(texcoord), dFdy(texcoord)).r;
      uv = mod(uv, 1.0);
      // uv = floor(uv*16.)/16.;
      /* if (uv.x < 0.5) {
        uv.x += 1.;
      }
      if (uv.y < 0.5) {
        uv.y += 1.;
      } */
      return texture2D(tex, tileOffset + uv * tileSize).r;
    }

    void main() {
      vec2 worldUv = vWorldUv;
      worldUv = mod(worldUv, 1.0);

      // vec3 c = fourTapSample3(vUv, worldUv, tex);
      vec3 diffuseColor = vec3(${new THREE.Color(0x26c6da).toArray().join(', ')});
      float f = edgeFactor();
      /* if (f <= 0.5) {
        diffuseColor = mix(diffuseColor, vec3(1.0), max(1.0 - abs(pow(length(vViewPosition) - mod(uTime*60., 1.)*5.0, 3.0)), 0.0)*0.5);
        // diffuseColor *= (0.9 + 0.1*min(gl_FragCoord.z/gl_FragCoord.w/10.0, 1.0));
      } else {
        discard;
      } */
      /* diffuseColor += vSelectColor;
      float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0 * vAo;
      float cameraFactor = floor(8.0 - length(vViewPosition))/8.;
      diffuseColor *= max(max(worldFactor, cameraFactor), 0.1);
      diffuseColor = mix(diffuseColor, vec3(0.2 + sunIntensity*0.8), gl_FragCoord.z/gl_FragCoord.w/100.0); */

      gl_FragColor = vec4(diffuseColor, 1.0 - f);
    }
  `,
  transparent: true,
});
const mesh = new THREE.Mesh(geometry, material);
const update = () => {
  const transforms = rigManager.getRigTransforms();
  const [{position, quaternion}] = transforms;

  mesh.position.copy(position)
    .add(localVector.set(0, -0.5, -0.5).applyQuaternion(quaternion));
  mesh.quaternion.copy(quaternion);
};

const builder = {
  mesh,
  update,
};

export default builder;