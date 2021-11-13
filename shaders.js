import * as THREE from 'three';

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
const offsetDepthSmall = 0.000075;
const offsetDepthLarge = 0.00035;

const highlightVertexShader = `
    ${THREE.ShaderChunk.common}
    precision highp float;
    precision highp int;
    uniform float uVertexOffset;
    varying vec3 vViewPosition;
    varying vec2 vUv;
    varying vec2 vWorldUv;
    varying vec3 vPos;
    varying vec3 vNormal;

    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vec3 newPosition = position + normal * vec3( uVertexOffset, uVertexOffset, uVertexOffset );
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

      ${THREE.ShaderChunk.logdepthbuf_vertex}

      vViewPosition = -mvPosition.xyz;
      vUv = uv;
      vPos = position;
      vNormal = normal;
    }
  `;

const highlightGridFragmentShader = `
    
  uniform vec3 uColor;
  uniform float uTime;

  varying vec3 vViewPosition;
  varying vec2 vUv;

  varying vec3 vPos;
  varying vec3 vNormal;

  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

  float edgeFactor(vec2 uv) {
    float divisor = 0.5;
    float power = 0.5;
    return min(
      pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
      pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
    ) > 0.1 ? 0.0 : 1.0;
  }

  vec3 getTriPlanarBlend(vec3 _wNorm){
    // in wNorm is the world-space normal of the fragment
    vec3 blending = abs( _wNorm );
    blending = normalize(blending);
    return blending;
  }

  void main() {

    vec3 diffuseColor2 = uColor;
    float normalRepeat = 1.0;

    vec3 blending = getTriPlanarBlend(vNormal);
    float xaxis = edgeFactor(vPos.yz * normalRepeat);
    float yaxis = edgeFactor(vPos.xz * normalRepeat);
    float zaxis = edgeFactor(vPos.xy * normalRepeat);
    float f = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;

    if (abs(length(vViewPosition) - uTime * 20.) < 0.1) {
      f = 1.0;
    }

    float d = gl_FragCoord.z/gl_FragCoord.w;
    vec3 c = diffuseColor2; // mix(diffuseColor1, diffuseColor2, abs(vPos.y/10.));
    float f2 = 1. + d/10.0;
    gl_FragColor = vec4(c, 0.5 + max(f, 0.3) * f2 * 0.5);

    ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`;

const selectFragmentShader = `\
  precision highp float;
  precision highp int;

  uniform vec3 uColor;
  uniform float uTime;

  varying vec3 vViewPosition;
  varying vec2 vUv;
  varying vec2 vWorldUv;
  varying vec3 vPos;
  varying vec3 vNormal;

  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

  float edgeFactor(vec2 uv) {
    float divisor = 0.5;
    float power = 0.5;
    return min(
      pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
      pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
    ) > 0.1 ? 0.0 : 1.0;
  }

  vec3 getTriPlanarBlend(vec3 _wNorm){
    // in wNorm is the world-space normal of the fragment
    vec3 blending = abs( _wNorm );
    blending = normalize(blending);
    return blending;
  }

  void main() {
    float d = gl_FragCoord.z/gl_FragCoord.w;
    vec3 c = uColor;
    float f2 = max(1. - (d)/10.0, 0.);
    gl_FragColor = vec4(c, 0.1 + f2 * 0.7);

    ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`;

const damageFragmentShader = `\
  precision highp float;
  precision highp int;

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
  varying vec3 vPos;
  varying vec3 vNormal;

  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  float edgeFactor(vec2 uv) {
    float divisor = 0.5;
    float power = 0.5;
    return min(
      pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
      pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
    ) > 0.1 ? 0.0 : 1.0;
  }

  vec3 getTriPlanarBlend(vec3 _wNorm){
    // in wNorm is the world-space normal of the fragment
    vec3 blending = abs( _wNorm );
    blending = normalize(blending);
    return blending;
  }

  void main() {
    vec3 diffuseColor2 = vec3(${new THREE.Color(0xef5350).toArray().join(', ')});
    float normalRepeat = 1.0;

    vec3 blending = getTriPlanarBlend(vNormal);
    float xaxis = edgeFactor(vPos.yz * normalRepeat);
    float yaxis = edgeFactor(vPos.xz * normalRepeat);
    float zaxis = edgeFactor(vPos.xy * normalRepeat);
    float f = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;

    float d = gl_FragCoord.z/gl_FragCoord.w;
    vec3 c = diffuseColor2; // mix(diffuseColor1, diffuseColor2, abs(vPos.y/10.));
    float f2 = 1. + d/10.0;
    gl_FragColor = vec4(c, 0.5 + max(f, 0.3) * f2 * 0.5 * uTime);

    ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`;

const buildMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0x64b5f6),
      needsUpdate: true,
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthSmall,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: highlightGridFragmentShader,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
});

const highlightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0xcccccc),
      needsUpdate: true,
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthSmall,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: selectFragmentShader,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  // polygonOffsetUnits: 1,
});

const selectMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0xcccccc),
      needsUpdate: true,
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthSmall,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: selectFragmentShader,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  // polygonOffsetUnits: 1,
});

const hoverMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0x9ccc65),
      needsUpdate: true,
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthSmall,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: highlightGridFragmentShader,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  // polygonOffsetUnits: 1,
});

const hoverEquipmentMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0x7e57c2),
      needsUpdate: true,
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthLarge,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: selectFragmentShader,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  // polygonOffsetUnits: 1,
});

const damageMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthSmall,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: damageFragmentShader,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});

const activateMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
    uVertexOffset: {
      type: 'f',
      value: offsetDepthSmall,
    },
  },
  vertexShader: highlightVertexShader,
  fragmentShader: selectFragmentShader,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});

const portalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0xffa726),
    },
    uTime: {
      type: 'f',
      value: 0,
      // needsUpdate: true,
    },
    uDistance: {
      type: 'f',
      value: 0,
      // needsUpdate: true,
    },
    uUserPosition: {
      type: 'v3',
      value: new THREE.Vector3(),
      // needsUpdate: true,
    },
  },
  vertexShader: `\
    ${THREE.ShaderChunk.common}
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    uniform vec4 uSelectRange;
    uniform float uTime;
    uniform float uDistance;
    // uniform vec3 uUserPosition;

    // attribute vec3 barycentric;
    attribute float ao;
    attribute float skyLight;
    attribute float torchLight;
    attribute float particle;
    attribute float bar;

    // varying vec3 vViewPosition;
    varying vec3 vModelPosition;
    varying vec2 vUv;
    varying vec3 vBarycentric;
    varying float vAo;
    varying float vSkyLight;
    varying float vTorchLight;
    varying vec3 vSelectColor;
    varying vec2 vWorldUv;
    varying vec3 vPos;
    varying vec3 vNormal;
    varying float vParticle;
    varying float vBar;
    // varying float vUserDelta;

    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

    void main() {
      vec3 p = position;
      if (bar < 1.0) {
        float wobble = uDistance <= 0. ? sin(uTime * PI*10.)*0.02 : 0.;
        p.y *= (1.0 + wobble) * min(max(1. - uDistance/3., 0.), 1.0);
      }
      p.y += 0.01;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      vModelPosition = (modelMatrix * vec4(p, 1.0)).xyz;
      gl_Position = projectionMatrix * mvPosition;

      // vViewPosition = -mvPosition.xyz;
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

      vPos = p;
      vNormal = normal;
      vParticle = particle;
      vBar = bar;
      // vUserDelta = max(abs(modelPosition.x - uUserPosition.x), abs(modelPosition.z - uUserPosition.z));

      ${THREE.ShaderChunk.logdepthbuf_vertex}
    }
  `,
  fragmentShader: `\
    precision highp float;
    precision highp int;

    #define PI 3.1415926535897932384626433832795

    // uniform float sunIntensity;
    // uniform sampler2D tex;
    uniform vec3 uColor;
    uniform float uTime;
    // uniform vec3 sunDirection;
    uniform float uDistance;
    uniform vec3 uUserPosition;
    float parallaxScale = 0.3;
    float parallaxMinLayers = 50.;
    float parallaxMaxLayers = 50.;

    // varying vec3 vViewPosition;
    varying vec3 vModelPosition;
    varying vec2 vUv;
    varying vec3 vBarycentric;
    varying float vAo;
    varying float vSkyLight;
    varying float vTorchLight;
    varying vec3 vSelectColor;
    varying vec2 vWorldUv;
    varying vec3 vPos;
    varying vec3 vNormal;
    varying float vParticle;
    varying float vBar;
    // varying float vUserDelta;

    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

    float edgeFactor(vec2 uv) {
      float divisor = 0.5;
      float power = 0.5;
      return min(
        pow(abs(uv.x - round(uv.x/divisor)*divisor), power),
        pow(abs(uv.y - round(uv.y/divisor)*divisor), power)
      ) > 0.1 ? 0.0 : 1.0;
      /* return 1. - pow(abs(uv.x - round(uv.x/divisor)*divisor), power) *
        pow(abs(uv.y - round(uv.y/divisor)*divisor), power); */
    }

    vec3 getTriPlanarBlend(vec3 _wNorm){
      // in wNorm is the world-space normal of the fragment
      vec3 blending = abs( _wNorm );
      // blending = normalize(max(blending, 0.00001)); // Force weights to sum to 1.0
      // float b = (blending.x + blending.y + blending.z);
      // blending /= vec3(b, b, b);
      // return min(min(blending.x, blending.y), blending.z);
      blending = normalize(blending);
      return blending;
    }

    void main() {
      // vec3 diffuseColor2 = vec3(${new THREE.Color(0xffa726).toArray().join(', ')});
      float normalRepeat = 1.0;

      vec3 blending = getTriPlanarBlend(vNormal);
      float xaxis = edgeFactor(vPos.yz * normalRepeat);
      float yaxis = edgeFactor(vPos.xz * normalRepeat);
      float zaxis = edgeFactor(vPos.xy * normalRepeat);
      float f = xaxis * blending.x + yaxis * blending.y + zaxis * blending.z;

      // vec2 worldUv = vWorldUv;
      // worldUv = mod(worldUv, 1.0);
      // float f = edgeFactor();
      // float f = max(normalTex.x, normalTex.y, normalTex.z);

      /* if (vPos.y > 0.) {
        f = 1.0;
      } */

      float d = gl_FragCoord.z/gl_FragCoord.w;
      vec3 c = uColor; // diffuseColor2; // mix(diffuseColor1, diffuseColor2, abs(vPos.y/10.));
      // float f2 = 1. + d/10.0;
      float a;
      if (vParticle > 0.) {
        a = 1.;
      } else if (vBar > 0.) {
        float userDelta = length(uUserPosition - vModelPosition);
        a = 1.25 - userDelta;
      } else {
        a = min(max(f, 0.3), 1.);
      }
      if (uDistance <= 0.) {
        c *= 0.5 + pow(1. - uTime, 3.);
      }
      if (a < 0.) {
        discard;
      }
      gl_FragColor = vec4(c, a);

      ${THREE.ShaderChunk.logdepthbuf_fragment}
    }
  `,
  transparent: true,
  // polygonOffset: true,
  // polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});

/* const loadVsh = `
  #define M_PI 3.1415926535897932384626433832795
  uniform float uTime;

  mat4 rotationMatrix(vec3 axis, float angle)
  {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;

      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }

  void main() {
    // float f = 1.0 + pow(sin(uTime * M_PI), 0.5) * 0.2;
    gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix(vec3(0, 0, 1), -uTime * M_PI * 2.0) * vec4(position, 1.);
  }
`;
const loadFsh = `
  uniform float uHighlight;
  uniform float uTime;
  void main() {
    float f = 1.0 + max(1.0 - uTime, 0.0);
    gl_FragColor = vec4(vec3(${new THREE.Color(0xf4511e).toArray().join(', ')}) * f, 1.0);
  }
`;
const loadMeshMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      type: 'f',
      value: 0,
    },
  },
  vertexShader: loadVsh,
  fragmentShader: loadFsh,
  side: THREE.DoubleSide,
});
const _makeLoadMesh = (() => {
  const geometry = new THREE.RingBufferGeometry(0.05, 0.08, 128, 0, Math.PI / 2, Math.PI * 2 * 0.9);
  // .applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)));
  return () => {
    const mesh = new THREE.Mesh(geometry, loadMeshMaterial);
    // mesh.frustumCulled = false;
    return mesh;
  };
})();
const _ensureLoadMesh = p => {
  if (!p.loadMesh) {
    p.loadMesh = _makeLoadMesh();
    p.loadMesh.matrix.copy(p.matrix).decompose(p.loadMesh.position, p.loadMesh.quaternion, p.loadMesh.scale);
    scene.add(p.loadMesh);

    p.waitForRun()
      .then(() => {
        p.loadMesh.visible = false;
      });
  }
}; */

/* const redBuildMeshMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 1.05, 1.);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(${new THREE.Color(0xff7043).toArray().join(', ')}, 0.5);
    }
  `,
  // side: THREE.DoubleSide,
  transparent: true,
}); */

/* const wallGeometry = (() => {
  const panelGeometries = [];
  for (let x = -1 / 2; x <= 1 / 2; x++) {
    panelGeometries.push(
      new THREE.BoxBufferGeometry(0.01, 1, 0.01)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(x, 0, -1/2)),
    );
  }
  for (let h = 0; h <= 1; h++) {
    panelGeometries.push(
      new THREE.BoxBufferGeometry(1, 0.01, 0.01)
        .applyMatrix4(new THREE.Matrix4().makeTranslation(0, h -1/2, -1/2)),
    );
  }
  return BufferGeometryUtils.mergeBufferGeometries(panelGeometries);
})();
const topWallGeometry = wallGeometry.clone();
// .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const leftWallGeometry = wallGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2));
  // .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const rightWallGeometry = wallGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2));
  // .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const bottomWallGeometry = wallGeometry.clone()
  .applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), Math.PI));
  // .applyMatrix(new THREE.Matrix4().makeTranslation(-0.5, 0, -0.5));
const distanceFactor = 64;
export function GuardianMesh(extents, color) {
  const geometry = (() => {
    const geometries = [];
    const [x1, y1, z1, x2, y2, z2] = extents;
    const ax1 = (x1 + 0.5);
    const ay1 = (y1 + 0.5);
    const az1 = (z1 + 0.5);
    const ax2 = (x2 + 0.5);
    const ay2 = (y2 + 0.5);
    const az2 = (z2 + 0.5);
    for (let y = ay1; y < ay2; y++) {
      for (let x = ax1; x < ax2; x++) {
        geometries.push(
          topWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, az1)),
        );
        geometries.push(
          bottomWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation(x, y, (az2 - 1))),
        );
      }
      for (let z = az1; z < az2; z++) {
        geometries.push(
          leftWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation(ax1, y, z)),
        );
        geometries.push(
          rightWallGeometry.clone()
            .applyMatrix4(new THREE.Matrix4().makeTranslation((ax2 - 1), y, z)),
        );
      }
    }
    return BufferGeometryUtils.mergeBufferGeometries(geometries);
  })();
  const gridVsh = `
    // varying vec3 vWorldPos;
    // varying vec2 vUv;
    varying float vDepth;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      // vUv = uv;
      // vWorldPos = abs(position);
      vDepth = gl_Position.z / ${distanceFactor.toFixed(8)};
    }
  `;
  const gridFsh = `
    // uniform sampler2D uTex;
    uniform vec3 uColor;
    // uniform float uAnimation;
    // varying vec3 vWorldPos;
    varying float vDepth;
    void main() {
      gl_FragColor = vec4(uColor, (1.0-vDepth));
    }
  `;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: {
        type: 'c',
        value: new THREE.Color(color),
      },
    },
    vertexShader: gridVsh,
    fragmentShader: gridFsh,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.setColor = c => {
    mesh.material.uniforms.uColor.value.setHex(c);
  };
  return mesh;
} */

/* const itemMeshes = [];
const addItem = async (position, quaternion) => {
  const u = 'assets/mat.glb';
  const res = await fetch('./' + u);
  const file = await res.blob();
  file.name = u;
  let mesh = await runtime.loadFile(file, {
    optimize: false,
  }, {
    contentId: u,
  });
  for (let i = 0; i < mesh.children.length; i++) {
    const child = mesh.children[i];
    child.position.x = -3 + i;
    child.material = new THREE.MeshBasicMaterial({map: child.material.map});
  }
  const s = 0.1;
  mesh.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0)));
  mesh.scale.set(s, s, s);

  const itemMesh = (() => {
    const radius = 0.5;
    const segments = 12;
    const color = 0x66bb6a;
    const opacity = 0.5;

    const object = new THREE.Object3D();

    object.add(mesh);

    const skirtGeometry = new THREE.CylinderBufferGeometry(radius, radius, radius, segments, 1, true)
      .applyMatrix4(new THREE.Matrix4().makeTranslation(0, radius / 2, 0));
    const ys = new Float32Array(skirtGeometry.attributes.position.array.length / 3);
    for (let i = 0; i < skirtGeometry.attributes.position.array.length / 3; i++) {
      ys[i] = 1 - skirtGeometry.attributes.position.array[i * 3 + 1] / radius;
    }
    skirtGeometry.setAttribute('y', new THREE.BufferAttribute(ys, 1));
    const skirtMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uAnimation: {
          type: 'f',
          value: 0,
        },
      },
      vertexShader: `\
        #define PI 3.1415926535897932384626433832795

        uniform float uAnimation;
        attribute float y;
        attribute vec3 barycentric;
        varying float vY;
        varying float vUv;
        varying float vOpacity;
        void main() {
          vY = y * ${opacity.toFixed(8)};
          vUv = uv.x + uAnimation;
          vOpacity = 0.5 + 0.5 * (sin(uAnimation*20.0*PI*2.0)+1.0)/2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `\
        #define PI 3.1415926535897932384626433832795

        uniform sampler2D uCameraTex;
        varying float vY;
        varying float vUv;
        varying float vOpacity;

        vec3 c = vec3(${new THREE.Color(color).toArray().join(', ')});

        void main() {
          float a = vY * (0.9 + 0.1 * (sin(vUv*PI*2.0/0.02) + 1.0)/2.0) * vOpacity;
          gl_FragColor = vec4(c, a);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      // blending: THREE.CustomBlending,
    });
    const skirtMesh = new THREE.Mesh(skirtGeometry, skirtMaterial);
    skirtMesh.frustumCulled = false;
    skirtMesh.isBuildMesh = true;
    object.add(skirtMesh);

    let animation = null;
    object.update = posePosition => {
      if (!animation) {
        const now = Date.now();
        mesh.position.y = 1 + Math.sin(now/1000*Math.PI)*0.1;
        mesh.rotation.z = (now % 5000) / 5000 * Math.PI * 2;
        skirtMaterial.uniforms.uAnimation.value = (now % 60000) / 60000;
      } else {
        animation.update(posePosition);
      }
    };

    return object;
  })();
  itemMesh.position.copy(position)
  itemMesh.quaternion.copy(quaternion);
  scene.add(itemMesh);
  itemMeshes.push(itemMesh);
}; */

const arrowGeometry = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(-0.75, 0);
  shape.lineTo(0, -2);
  shape.lineTo(0.75, 0);
  shape.lineTo(0, -0.5);
  // shape.lineTo( -1, 0 );
  const extrudeSettings = {
    steps: 2,
    depth: 0.1,
    // bevelEnabled: false,
    bevelEnabled: true,
    bevelThickness: 0,
    bevelSize: 0,
    bevelOffset: 0,
    bevelSegments: 1,
  };
  const geometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.5, -0.1 / 2));
  return geometry;
})();
const arrowVsh = `
  ${THREE.ShaderChunk.common}
  #define PI 3.1415926535897932384626433832795

  uniform float uTime;

  mat4 rotationMatrix(vec3 axis, float angle)
  {
      axis = normalize(axis);
      float s = sin(angle);
      float c = cos(angle);
      float oc = 1.0 - c;
      
      return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                  oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                  oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                  0.0,                                0.0,                                0.0,                                1.0);
  }

  varying float vDepth;

  ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix(vec3(0, 1, 0), -uTime * PI * 2.0) * vec4(position + vec3(0., 1., 0.) * (0.5 + sin(uTime * PI * 2.0)*0.5), 1.);
    ${THREE.ShaderChunk.logdepthbuf_vertex}
  }
`;
const arrowFsh = `
  #define PI 3.1415926535897932384626433832795
  
  // uniform sampler2D uTex;
  uniform vec3 uColor;
  uniform float uTime;
  // varying float vDepth;
  
  vec3 grey = vec3(0.5);
  ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

  void main() {
    gl_FragColor = vec4(mix(grey, uColor, 1.0 - (0.5 + sin(uTime * PI * 2.0)*0.5)), 1.0);
    ${THREE.ShaderChunk.logdepthbuf_fragment}
  }
`;
const arrowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uColor: {
      type: 'c',
      value: new THREE.Color(0xef5350),
      needsUpdate: true,
    },
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
  },
  vertexShader: arrowVsh,
  fragmentShader: arrowFsh,
  side: THREE.DoubleSide,
  // transparent: true,
});

const glowMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: {
      type: 'f',
      value: 0,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    ${THREE.ShaderChunk.common}

    precision highp float;
    precision highp int;
    
    attribute vec3 color;

    varying vec2 vUv;
    varying vec3 vColor;
    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      vUv = uv;
      vColor = color;

      ${THREE.ShaderChunk.logdepthbuf_vertex}

    }
  `,
  fragmentShader: `\
  

    precision highp float;
    precision highp int;

    uniform float uTime;

    varying vec2 vUv;
    varying vec3 vColor;

    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

    void main() {
      gl_FragColor = vec4(vColor, 1. - vUv.y);

      ${THREE.ShaderChunk.logdepthbuf_fragment}
    }
  `,
  transparent: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  // polygonOffsetUnits: 1,
});

const copyScenePlaneGeometry = new THREE.PlaneGeometry(2, 2);
const copySceneVertexShader = `#version 300 es
${THREE.ShaderChunk.common}
  precision highp float;
  
  in vec3 position;
  in vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  out vec2 vUv;

  ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
    ${THREE.ShaderChunk.logdepthbuf_vertex}
  }
`;
const copyScene = (() => {
  const mesh = new THREE.Mesh(
    copyScenePlaneGeometry,
    new THREE.RawShaderMaterial({
      uniforms: {
        tex: {
          value: null,
          // needsUpdate: false,
        },
      },
      vertexShader: copySceneVertexShader,
      fragmentShader: `#version 300 es
        precision highp float;

        uniform sampler2D tex;
        in vec2 vUv;
        out vec4 fragColor;

        ${THREE.ShaderChunk.logdepthbuf_pars_fragment}

        void main() {
          fragColor = texture(tex, vUv);
          ${THREE.ShaderChunk.logdepthbuf_fragment}
        }
      `,
      depthWrite: false,
      depthTest: false,
    }),
  );
  const scene = new THREE.Scene();
  scene.add(mesh);
  scene.mesh = mesh;
  return scene;
})();
const copySceneCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export {
  /* LAND_SHADER,
  WATER_SHADER,
  VEGETATION_SHADER,
  THING_SHADER,
  makeDrawMaterial, */
  buildMaterial,
  highlightMaterial,
  selectMaterial,
  hoverMaterial,
  hoverEquipmentMaterial,
  damageMaterial,
  activateMaterial,
  portalMaterial,
  arrowGeometry,
  arrowMaterial,
  glowMaterial,
  copyScenePlaneGeometry,
  copySceneVertexShader,
  copyScene,
  copySceneCamera,
};
