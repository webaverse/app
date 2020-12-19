import * as THREE from './three.module.js';

/* const _makeHeightfieldShader = land => ({
  uniforms: {
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
  },
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

    ${land ? '' : `\
    varying vec3 ts_view_pos;
    varying vec3 ts_frag_pos;
    varying vec3 vTang;
    varying vec3 vBitang;
    `}
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

      ${land ? '' : `\
      ts_view_pos = tbn * vec3(0.);
      ts_frag_pos = tbn * vec3(modelViewMatrix * vec4(position, 1.0));
      vTang = vert_tang;
      vBitang = vert_bitang;
      `}
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

    ${land ? '' : `\
    varying vec3 ts_view_pos;
    varying vec3 ts_frag_pos;
    varying vec3 vTang;
    varying vec3 vBitang;
    `}
    varying vec2 vWorldUv;

    float edgeFactor() {
      vec3 d = fwidth(vBarycentric);
      vec3 a3 = smoothstep(vec3(0.0), d, vBarycentric);
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
      return texture2D(tex, tileOffset + uv * tileSize).r;
    }

${land ? '' : `\
#define USE_STEEP_PARALLAX 1

#ifdef USE_BASIC_PARALLAX
  vec2 parallaxMap( vec2 tileOffset, vec2 vUv, vec3 V ) {
    float initialHeight = sampleHeight( tileOffset, vUv );
    vec2 texCoordOffset = parallaxScale * V.xy * initialHeight;
    return vUv - texCoordOffset;
  }
#else
  vec2 parallaxMap( vec2 tileOffset, vec2 vUv, vec3 V ) {
    float numLayers = mix( parallaxMaxLayers, parallaxMinLayers, abs( dot( vec3( 0.0, 0.0, 1.0 ), V ) ) );
    float layerHeight = 1.0 / numLayers;
    float currentLayerHeight = 0.0;
    vec2 dtex = parallaxScale * V.xy / V.z / numLayers;
    vec2 currentTextureCoords = vUv;
    float heightFromTexture = sampleHeight( tileOffset, currentTextureCoords );

    vec3 pos = floor((vTang * currentTextureCoords.x + vBitang * currentTextureCoords.y) * 16.)/16.;
    heightFromTexture *= 0.3 + (1.0+sin((length(pos) - mod(uTime*30., 1.)) * PI*2.))/2.*0.5;

    for ( int i = 0; i < 50; i += 1 ) {
      if ( heightFromTexture <= currentLayerHeight ) {
        break;
      }
      currentLayerHeight += layerHeight;
      currentTextureCoords -= dtex;
      heightFromTexture = sampleHeight( tileOffset, currentTextureCoords );

      vec3 pos = floor((vTang * currentTextureCoords.x + vBitang * currentTextureCoords.y) * 16.)/16.;
      heightFromTexture *= 0.3 + (1.0+sin((length(pos) - mod(uTime*30., 1.)) * PI*2.))/2.*0.5;
    }
    #ifdef USE_STEEP_PARALLAX
      return currentTextureCoords;
    #elif defined( USE_RELIEF_PARALLAX )
      vec2 deltaTexCoord = dtex / 2.0;
      float deltaHeight = layerHeight / 2.0;
      currentTextureCoords += deltaTexCoord;
      currentLayerHeight -= deltaHeight;
      const int numSearches = 5;
      for ( int i = 0; i < numSearches; i += 1 ) {
        deltaTexCoord /= 2.0;
        deltaHeight /= 2.0;
        heightFromTexture = sampleHeight( tileOffset, currentTextureCoords );
        if( heightFromTexture > currentLayerHeight ) {
          currentTextureCoords -= deltaTexCoord;
          currentLayerHeight += deltaHeight;
        } else {
          currentTextureCoords += deltaTexCoord;
          currentLayerHeight -= deltaHeight;
        }
      }
      return currentTextureCoords;
    #elif defined( USE_OCLUSION_PARALLAX )
      vec2 prevTCoords = currentTextureCoords + dtex;
      float nextH = heightFromTexture - currentLayerHeight;
      float prevH = sampleHeight( tileOffset, prevTCoords ) - currentLayerHeight + layerHeight;
      float weight = nextH / ( nextH - prevH );
      return prevTCoords * weight + currentTextureCoords * ( 1.0 - weight );
    #else
      return vUv;
    #endif
  }
#endif
`}

    void main() {
      vec2 worldUv = vWorldUv;
      worldUv = mod(worldUv, 1.0);

      vec3 c = fourTapSample3(vUv, worldUv, tex);
      vec3 diffuseColor = c;
      if (edgeFactor() <= 0.99) {
        diffuseColor = mix(diffuseColor, vec3(1.0), max(1.0 - abs(pow(length(vViewPosition) - mod(uTime*60., 1.)*5.0, 3.0)), 0.0)*0.5);
        diffuseColor *= (0.9 + 0.1*min(gl_FragCoord.z/gl_FragCoord.w/10.0, 1.0));
      }
      diffuseColor += vSelectColor;
      float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0 * vAo;
      float cameraFactor = floor(8.0 - length(vViewPosition))/8.;
      diffuseColor *= max(max(worldFactor, cameraFactor), 0.1);
      diffuseColor = mix(diffuseColor, vec3(0.2 + sunIntensity*0.8), gl_FragCoord.z/gl_FragCoord.w/100.0);

      float a = ${land ? '1.0' : '0.9'};
      gl_FragColor = vec4(diffuseColor, a);
    }
  `,
});
const LAND_SHADER = _makeHeightfieldShader(true);
const WATER_SHADER = _makeHeightfieldShader(false);
const VEGETATION_SHADER = {
  uniforms: {
    map: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
    uHitId: {
      type: 'f',
      value: -1,
      needsUpdate: true,
    },
    uHitPosition: {
      type: 'v3',
      value: new THREE.Vector3(),
      needsUpdate: true,
    },
    uSelectId: {
      type: 'f',
      value: -1,
      needsUpdate: true,
    },
    sunIntensity: {
      type: 'f',
      value: 1,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    precision highp float;
    precision highp int;

    uniform float uHitId;
    uniform vec3 uHitPosition;
    uniform float uSelectId;
    attribute float id;
    attribute float skyLight;
    attribute float torchLight;

    varying vec2 vUv;
    varying vec3 vSelectColor;
    varying vec3 vWorldPosition;
    varying float vSkyLight;
    varying float vTorchLight;
    // varying vec3 vNormal;

    void main() {
      vUv = uv;
      vec3 p = position;
      vSelectColor = vec3(0.);
      if (uHitId == id) {
        vSelectColor = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
        p += uHitPosition;
      }
      if (uSelectId == id) {
        vSelectColor = vec3(${new THREE.Color(0x4fc3f7).toArray().join(', ')});
      }
      // vNormal = normal;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      vec4 worldPosition = modelViewMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;
      vSkyLight = skyLight/8.0;
      vTorchLight = torchLight/8.0;
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    uniform sampler2D map;
    uniform float sunIntensity;
    varying vec2 vUv;
    varying vec3 vSelectColor;
    varying vec3 vWorldPosition;
    varying float vSkyLight;
    varying float vTorchLight;
    // varying vec3 vNormal;

    // vec3 l = normalize(vec3(-1.0, -1.0, -1.0));

    void main() {
      gl_FragColor = texture2D(map, vUv);
      gl_FragColor.rgb += vSelectColor;
      float worldFactor = floor((sunIntensity * vSkyLight + vTorchLight) * 4.0 + 1.9) / 4.0;
      float cameraFactor = floor(8.0 - length(vWorldPosition))/8.;
      gl_FragColor.rgb *= max(max(worldFactor, cameraFactor), 0.1);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.2 + sunIntensity*0.8), gl_FragCoord.z/gl_FragCoord.w/100.0);
    }
  `,
};
const THING_SHADER = {
  uniforms: {
    map: {
      type: 't',
      value: null,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    attribute vec3 color;
    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      vUv = uv;
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    uniform sampler2D map;

    varying vec2 vUv;
    varying vec3 vColor;

    void main() {
      vec4 c = vec4(vColor, 1.);
      if (vUv.x >= 0.) {
        c *= texture2D(map, vUv);
      }
      gl_FragColor = c;
    }
  `,
};

const makeDrawMaterial = (color1, color2, numPoints) => new THREE.ShaderMaterial({
  uniforms: {
    color1: {
      type: 'c',
      value: new THREE.Color(color1),
      needsUpdate: true,
    },
    color2: {
      type: 'c',
      value: new THREE.Color(color2),
      needsUpdate: true,
    },
    numPoints: {
      type: 'f',
      value: numPoints,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `\
    uniform vec3 color1;
    uniform vec3 color2;
    uniform float numPoints;

    varying vec2 vUv;

    void main() {
      vec3 c = mix(color1, color2, vUv.y/numPoints);
      gl_FragColor = vec4(c, 1.);
    }
  `,
  side: THREE.DoubleSide,
}); */

const buildMaterial = new THREE.ShaderMaterial({
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
      return min(
        pow(abs(vUv.x - round(vUv.x/0.1)*0.1), 0.5),
        pow(abs(vUv.y - round(vUv.y/0.1)*0.1), 0.5)
      ) * 3.;
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

export {
  /* LAND_SHADER,
  WATER_SHADER,
  VEGETATION_SHADER,
  THING_SHADER,
  makeDrawMaterial, */
  buildMaterial,
};