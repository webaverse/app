import * as THREE from 'three';

const SilkRawShader = {
  
    vertexShader: `
    ${THREE.ShaderChunk.common}
    precision highp int;
    
    //uniform mat4 modelMatrix;
    //uniform mat4 modelViewMatrix;
    //uniform mat4 projectionMatrix;
    //uniform mat4 viewMatrix;
    //uniform mat3 normalMatrix;
    //uniform vec3 cameraPosition;
    uniform float time;
    
    //attribute vec3 position;
    //attribute vec3 normal;
    //attribute vec2 uv;
    attribute vec2 uv2;
    
    varying vec2 tileCaustic_vUv;
    varying vec2 noiseRipples_vUv;
    
    varying vec3 transGlow_normal;
    varying vec3 transGlow_position;
    varying vec3 glowEffect_normal;
    varying vec3 glowEffect_position;
    
    //varying vec3 vNormal;
    
    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
      vec4 tileCausticCol() {
        
        vec4 tileCausticPos = vec4(0.0);
        tileCaustic_vUv = uv;
        tileCausticPos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        return tileCausticPos *= 1.0;

      }

      vec4 noiseRippleCol() {
        
        vec4 noiseRipplePos = vec4( 0.0 );
        noiseRipples_vUv = uv;
        noiseRipplePos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        return noiseRipplePos *= 1.0;
        
      }

      vec4 transGlowCol() {

        vec4 transGlowPos = vec4( 0.0 );
        transGlow_normal = normalize( normalMatrix * normal );
        vec4 pos = modelViewMatrix * vec4( position, 1.0 );
        transGlow_position = pos.xyz;
        transGlowPos = projectionMatrix * pos;
        return transGlowPos *= 0.3;
      }

      vec4 glowEffectCol() {
        vec4 glowEffectPos = vec4(0.0);
        glowEffect_normal = normalize(normalMatrix * normal);
        vec4 pos = modelViewMatrix * vec4(position, 1.0);
        glowEffect_position = pos.xyz;
        glowEffectPos = projectionMatrix * pos;
        return glowEffectPos *= 1.0;
      }

      void main() {

        //vNormal = normal;
        gl_Position = tileCausticCol() + noiseRippleCol() + transGlowCol() + glowEffectCol(); 
        ${THREE.ShaderChunk.logdepthbuf_vertex}
      }

    `,

    fragmentShader: `
    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
      #define TAU 6.28318530718
      #define MAX_ITER 5
     
      precision highp float;
      precision highp int;
      
      uniform vec3 backgroundColor;
      
      uniform vec2 tileCaustic_resolution;
      uniform vec3 tileCaustic_col;
      uniform float tileCaustic_speed;
      uniform float tileCaustic_brightness;

      uniform float time;
      uniform float contrast;
      uniform float distortion;
      
      uniform float noiseRipples_speed;
      uniform vec3 noiseRipples_col;
      uniform float noiseRipples_brightness;
      
      uniform sampler2D noiseImage;
      uniform vec2 noiseRipples_res;
      
      uniform vec3 transGlow_col;
      uniform float transGlow_start;
      uniform float transGlow_end;
      uniform float transGlow_alpha;
      
      uniform vec3 glowEffect_col;
      uniform float glowEffect_start;
      uniform float glowEffect_end;
      uniform float glowEffect_alpha;
      
      varying vec2 tileCaustic_vUv;
      
      varying vec2 noiseRipples_vUv;
      
      mat2 makem2(in float theta) {
        float c = cos(theta);
        float s = sin(theta);
        return mat2(c, -s, s, c);
      }

      float noise(in vec2 x){
        return texture2D(noiseImage, x * .01).x;
      }
      
      float fbm(in vec2 p) {
        float z = 2.;
        float rz = 0.;
        vec2 bp = p;
        
        for (float i = 1.; i < 6.0; i++) {
          rz += abs((noise(p) - 0.5) * 2.0) / z;
          z = z * 2.;
          p = p * 2.;
        }
        
        return rz;
      }

      float dualfbm(in vec2 p) {
        vec2 p2 = p * distortion;
        vec2 basis = vec2(fbm(p2 - time * noiseRipples_speed * 1.6), fbm(p2 + time * noiseRipples_speed * 1.7));
        basis = (basis - .5) * .2;
        p += basis;
        return fbm(p * makem2(time * noiseRipples_speed * 0.2));
      }

      varying vec3 transGlow_position;
      varying vec3 transGlow_normal;
      varying vec3 glowEffect_position;
      varying vec3 glowEffect_normal;

      //varying vec3 vNormal;

      vec4 tileCausticCol() {
        
        vec4 tileCausticFragCol = vec4(0.0);
        vec2 uv = tileCaustic_vUv * tileCaustic_resolution;
        vec2 p = mod(uv * TAU, TAU) - 250.0;
        vec2 i = vec2(p);
        float c = 1.0;
        float inten = 0.005;

        for (int n = 0; n < MAX_ITER; n++) {
          float t = time * tileCaustic_speed * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
        }

        c /= float(MAX_ITER);
        c = 1.17 - pow(c, tileCaustic_brightness);
        vec3 rgb = vec3(pow(abs(c), 8.0));
        
        tileCausticFragCol = vec4(rgb * tileCaustic_col + backgroundColor, 1.0);
        return tileCausticFragCol *= 1.0;
      }
      
      vec4 noiseRippleCol() {
        vec4 noiseRipplesFragCol = vec4(0.0);
        vec2 p = (noiseRipples_vUv.xy - 0.5) * noiseRipples_res;
        float rz = dualfbm(p);
        vec3 col = (noiseRipples_col / rz) * noiseRipples_brightness;
        col = ((col - 0.5) * max(contrast, 0.0)) + 0.5;
        noiseRipplesFragCol = vec4(col, 1.0);
        return noiseRipplesFragCol *= 1.0;
      }

      vec4 transGlowCol() {
        vec4 transGlowFragCol = vec4(0.0);
        vec3 normal = normalize(transGlow_normal);
        vec3 eye = normalize(-transGlow_position.xyz);
        float rim = smoothstep(transGlow_start, transGlow_end, 1.0 - dot(normal, eye));
        float value = clamp(rim * transGlow_alpha, 0.0, 1.0);
        transGlowFragCol = vec4(transGlow_col * value, value);
        return transGlowFragCol *= 0.3;
      }

      vec4 glowEffectCol() {
        vec4 glowEffectFragCol = vec4(0.0);
        vec3 normal = normalize(glowEffect_normal);
        vec3 eye = normalize(-glowEffect_position.xyz);
        float rim = smoothstep(glowEffect_start, glowEffect_end, 1.0 - dot(normal, eye));
        glowEffectFragCol = vec4(clamp(rim, 0.0, 1.0) * glowEffect_alpha * glowEffect_col, 1.0);
        return glowEffectFragCol *= 1.0;
      }

      void main() {

        //vec3 light = vec3( 0.0, -0.5 , 0.0 );
				//light = normalize( light );

				//float d = max( 0.0, dot( vNormal, light ) );

        gl_FragColor = (tileCausticCol() + noiseRippleCol() + transGlowCol() + glowEffectCol()); 
				
        //gl_FragColor = vec4( gl_FragColor.r * d, gl_FragColor.g * d, gl_FragColor.b * d, 1.0 );
        ${THREE.ShaderChunk.logdepthbuf_fragment}
      }

    `,

    uniforms: {
      
      time: {
        value: 0.0
      },

      backgroundColor: {
        value: {
          r: 0.42,
          g: 0.65,
          b: 0.72
        }
      },

      tileCaustic_resolution: {
        value: {
          x: 1,
          y: 1
        }
      },

      tileCaustic_col: {
        value: {
          r: 0.80,
          g: 0.87,
          b: 0.20
        }
      },

      tileCaustic_speed: {
        value: 0.2
      },

      tileCaustic_brightness: {
        value: 1.5
      },

      noiseImage: {
        value: null
      },

      distortion: {
        value: 2
      },

      contrast: {
        value: 2.5
      },

      noiseRipples_speed: {
        value: 0.1
      },

      noiseRipples_col: {
        value: {
          r: 0.34,
          g: 0.98,
          b: 1.0
        }
      },
      noiseRipples_brightness: {
        value: 0.1
      },

      noiseRipples_res: {
        value: {
          x: 3.0,
          y: 3.0
        },
      },

      transGlow_col: {
        value: {
          r: 1,
          g: 0.53,
          b: 0.82
        }
      },

      transGlow_start: {
        value: 0.55
      },

      transGlow_end: {
        value: 0.44
      },

      transGlow_alpha: {
        value: 0.5
      },

      glowEffect_col: {
        value: {
          r: 1.0,
          g: 1.0,
          b: 1.0
        }
      },

      glowEffect_start: {
        value: 0.0
      },

      glowEffect_end: {
        value: 2.0
      },

      glowEffect_alpha: {
        value: 1.0
      }
    }
  
};

export default SilkRawShader;
  
    