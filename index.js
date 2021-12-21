import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useInternals, useGeometries, useMaterials, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();

export default () => {
  const app = useApp();
  const {renderer, scene, camera} = useInternals();
  const physics = usePhysics();
  // const {CapsuleGeometry} = useGeometries();
  const {WebaverseShaderMaterial} = useMaterials();

  const physicsIds = [];

  const w = 8;
  const h = 4;
  const d = 8;
  const barrierGeometry = new THREE.BoxGeometry(w, h, d)
    .applyMatrix4(new THREE.Matrix4().makeTranslation(0, h/2, 0));
  for (let i = 0; i < barrierGeometry.attributes.position.count; i++) {
    const position = localVector.fromArray(barrierGeometry.attributes.position.array, i * 3)
    const normal = localVector2.fromArray(barrierGeometry.attributes.normal.array, i * 3)
      // .toArray(barrierGeometry.attributes.position.array, i * 3);
    if (normal.y !== 0) {
      localVector2D.set(position.x, position.z);
    } else if (normal.x !== 0) {
      localVector2D.set(position.y, position.z);
    } else {
      localVector2D.set(position.x, position.y);
    }
    localVector2D.toArray(barrierGeometry.attributes.uv.array, i * 2);
  }
  const barrierMaterial = new WebaverseShaderMaterial({
    uniforms: {
      iTime: {
        value: 0,
      },
      iResolution: {
        value: new THREE.Vector2(1024, 1024),
      },
    },
    vertexShader: `\
      precision highp float;
      precision highp int;

      uniform float uTime;
      varying vec3 vPosition;
      varying vec2 vUv;

      float getBezierT(float x, float a, float b, float c, float d) {
        return float(sqrt(3.) *
          sqrt(-4. * b * d + 4. * b * x + 3. * c * c + 2. * c * d - 8. * c * x - d * d + 4. * d * x)
            + 6. * b - 9. * c + 3. * d)
            / (6. * (b - 2. * c + d));
      }
      float easing(float x) {
        return getBezierT(x, 0., 1., 0., 1.);
      }
      float easing2(float x) {
        return easing(easing(x));
      }

      // const float moveDistance = 20.;
      // const float q = 0.1;

      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        vUv = uv;
        vPosition = position;
      }
    `,
    fragmentShader: `\
      precision highp float;
      precision highp int;

      #define PI 3.1415926535897932384626433832795

      uniform float iTime;
      uniform vec2 iResolution;
      varying vec3 vPosition;
      varying vec2 vUv;

      const vec3 lineColor1 = vec3(${new THREE.Color(0x29b6f6).toArray().join(', ')});
      const vec3 lineColor2 = vec3(${new THREE.Color(0x0288d1).toArray().join(', ')});
      const vec3 lineColor3 = vec3(${new THREE.Color(0xec407a).toArray().join(', ')});
      const vec3 lineColor4 = vec3(${new THREE.Color(0xc2185b).toArray().join(', ')});

      /* float edgeFactor(vec3 bary, float width) {
        // vec3 bary = vec3(vBC.x, vBC.y, 1.0 - vBC.x - vBC.y);
        vec3 d = fwidth(bary);
        vec3 a3 = smoothstep(d * (width - 0.5), d * (width + 0.5), bary);
        return min(min(a3.x, a3.y), a3.z);
      }

      void main() {
        vec3 c = mix(
          mix(lineColor1, lineColor2, vPosition.y / 10.),
          mix(lineColor3, lineColor4, vPosition.y / 10.),
          1. + sin(pow(time, 2.) * PI * 2.) * 0.5
        );
        // vec3 p = fwidth(vPosition);
        vec3 p = vPosition + 0.5;
        float f;
        if (vNormal.y != 0.) {
          f = min(mod(p.x, 1.), mod(p.z, 1.));
          f = min(f, mod(1.-p.x, 1.));
          f = min(f, mod(1.-p.z, 1.));
        } else if (vNormal.x != 0.) {
          f = min(mod(p.y, 1.), mod(p.z, 1.));
          f = min(f, mod(1.-p.y, 1.));
          f = min(f, mod(1.-p.z, 1.));
        } else {
          f = min(mod(p.x, 1.), mod(p.y, 1.));
          f = min(f, mod(1.-p.x, 1.));
          f = min(f, mod(1.-p.y, 1.));
        }
        f *= 10.;
        float a = max(1. - f, 0.);
        if (a < 0.75) {
          discard;
        } else {
          gl_FragColor = vec4(c, 1.);
          gl_FragColor = sRGBToLinear(gl_FragColor);
        }
      } */








      /*

        draw letter shapes after subdividing uv space randomly

      */

      float random2d(vec2 n) { 
          return fract(sin(dot(n, vec2(129.9898, 4.1414))) * 2398.5453);
      }

      vec2 getCellIJ(vec2 uv, float gridDims){
          return floor(uv * gridDims)/ gridDims;
      }

      vec2 rotate2D(vec2 position, float theta)
      {
          mat2 m = mat2( cos(theta), -sin(theta), sin(theta), cos(theta) );
          return m * position;
      }

      //from https://github.com/keijiro/ShaderSketches/blob/master/Text.glsl
      float letter(vec2 coord, float size)
      {
          vec2 gp = floor(coord / size * 7.); // global
          vec2 rp = floor(fract(coord / size) * 7.); // repeated
          vec2 odd = fract(rp * 0.5) * 2.;
          float rnd = random2d(gp);
          float c = max(odd.x, odd.y) * step(0.5, rnd); // random lines
          c += min(odd.x, odd.y); // fill corner and center points
          c *= rp.x * (6. - rp.x); // cropping
          c *= rp.y * (6. - rp.y);
          return clamp(c, 0., 1.);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
          vec2 uv = fragCoord;
          // vec2 uv = fragCoord.xy / iResolution.xy;    
          //correct aspect ratio
          // uv.x *= iResolution.x/iResolution.y;
          if (vPosition.y <= 0. || vPosition.y >= iResolution.y - 0.01) {
            discard;
          }
          uv /= 2.;

          float t = iTime;
          float scrollSpeed = 1.;
          float dims = 3.0;
          int maxSubdivisions = 1;
          
          // uv = rotate2D(uv,PI/12.0);
          uv.y -= floor(iTime * scrollSpeed);
          
          float cellRand;
          vec2 ij;
          
          for(int i = 0; i <= maxSubdivisions; i++) { 
              ij = getCellIJ(uv, dims);
              cellRand = random2d(ij);
              dims *= 2.0;
              //decide whether to subdivide cells again
              float cellRand2 = random2d(ij + 454.4543);
              if (cellRand2 > 0.3){
                break; 
              }
          }
        
          //draw letters    
          float b = letter(uv, 1.0 / (dims));
        
          //fade in
          /* float scrollPos = iTime*scrollSpeed + 0.5;
          float showPos = -ij.y + cellRand;
          float fade = smoothstep(showPos ,showPos + 0.05, scrollPos );
          b *= fade; */
          
          //hide some
          //if (cellRand < 0.1) b = 0.0;
          
          float c = 1.-b;
          if (b > 0.001) {
            fragColor = vec4(vec3(c), b);
          } else {
            discard;
          }
      }
      void main() {
        mainImage(gl_FragColor, vUv);
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const barrierMesh = new THREE.Mesh(barrierGeometry, barrierMaterial);
  barrierMesh.frustumCulled = false;
  app.add(barrierMesh);

  const _updateBarrierMesh = (now, timeDiff) => {
    barrierMesh.material.uniforms.iTime.value = now/1000;
    barrierMesh.material.uniforms.iResolution.value.set(w, h);
    // renderer.getSize(barrierMesh.material.uniforms.iResolution.value).multiplyScalar(renderer.getPixelRatio());
  };
  /* const material2 = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
  }); */
  // const mesh = new THREE.Mesh(geometry, material);
  // app.add(mesh);

  /* let activateCb = null;
  let frameCb = null;
  useActivate(() => {
    activateCb && activateCb();
  }); */
  useFrame(({timestamp, timeDiff}) => {
    // frameCb && frameCb();

    _updateBarrierMesh(timestamp, timeDiff);

    // material.uniforms.time.value = (performance.now() / 1000) % 1;
  });
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};