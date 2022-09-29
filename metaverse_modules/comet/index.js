import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import metaversefile from 'metaversefile';
const {
  useApp,
  useFrame,
  useCleanup,
  useMaterials,
  useSound,
  useLocalPlayer,
  useDropManager,
  useDefaultModules,
} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const cardWidth = 0.063;
// const cardHeight = cardWidth / 2.5 * 3.5;
// const cardHeight = cardWidth;
// const cardsBufferFactor = 1.1;
// const menuWidth = cardWidth * cardsBufferFactor * 4;
// const menuHeight = cardHeight * cardsBufferFactor * 4;
// const menuRadius = 0.025;

/* function mod(a, n) {
  return (a % n + n) % n;
} */

const numCylinders = 3;
const minRadius = 0.4;
// const radiusStep = minRadius;
const maxRadius = minRadius + minRadius * numCylinders;
const explosionScaleFactor = 4;
const dropItemSize = 0.2;
const pickUpDistance = 1;

const localVector = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
const localEuler = new THREE.Euler();

const zeroVector = new THREE.Vector3(0, 0, 0);
const gravity = new THREE.Vector3(0, -9.8, 0);

const makeSeamlessNoiseTexture = () => {
  const img = new Image();
  const texture = new THREE.Texture(img);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    // console.log('load image', img);
    // document.body.appendChild(img);
    texture.needsUpdate = true;
  };
  img.onerror = err => {
    console.warn(err);
  };
  img.src = `${baseUrl}perlin-noise.jpg`;

  return texture;
};
const getSeamlessNoiseTexture = (() => {
  let noiseTexture = null;
  return () => {
    if (!noiseTexture) {
      noiseTexture = makeSeamlessNoiseTexture();
    }
    return noiseTexture;
  };
})();

function createShockwaveGeometry() {
  const radius = 1;
  const g = new THREE.SphereGeometry(
    radius, // radius
    8, // widthSegments
    6, // heightSegments
    0, // phiStart
    Math.PI * 2, // phiLength
    0, // thetaStart
    Math.PI / 2, // thetaLength
  )
    .rotateX(Math.PI)
    .translate(0, radius - radius / 2, 0)
    .scale(1, 2, 1);

  for (let i = 0; i < g.attributes.uv.count; i++) {
    localVector2D.fromArray(g.attributes.uv.array, i * 2);
    localVector2D.y = 1 - localVector2D.y;
    localVector2D.toArray(g.attributes.uv.array, i * 2);
  }

  const instances = new Float32Array(g.attributes.position.count).fill(-1);
  g.setAttribute('instance', new THREE.BufferAttribute(instances, 1));

  return g;
}
function createCylindersGeometry(front) {
  const radiusTop = 1.5;
  const radiusBottom = 1;
  const height = 2;
  const radialSegments = 8;
  const heightSegments = 1;
  const openEnded = true;
  const baseGeometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    heightSegments,
    openEnded,
  ).translate(0, height / 2, 0);

  const geometries = [];
  const _push = i => {
    const g = baseGeometry.clone();
    const instances = new Float32Array(g.attributes.position.count).fill(i);
    g.setAttribute('instance', new THREE.BufferAttribute(instances, 1));
    geometries.push(g);
  };
  if (!front) {
    for (let i = 0; i < numCylinders; i++) {
      _push(i);
    }
  } else {
    for (let i = numCylinders - 1; i >= 0; i--) {
      _push(i);
    }
  }

  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  return geometry;
}
function createExplosionGeometry(front) {
  const radius = 1;
  const sphereGeometry = new THREE.SphereGeometry(
    radius, // radius
    8, // widthSegments
    6, // heightSegments
    0, // phiStart
    Math.PI * 2, // phiLength
    0, // thetaStart
    Math.PI / 2, // thetaLength
  );
  const haloRadius = radius * 0.5;
  const cylinderGeometry = new THREE.CylinderGeometry(
    1, // radiusTop
    1, // radiusBottom
    haloRadius, // height
    8, // radialSegments
    1, // heightSegments
    true, // openEnded
  ).translate(0, haloRadius / 2, 0);

  const geometries = [cylinderGeometry, sphereGeometry];

  if (!front) {
    geometries.reverse();
  }
  const g = BufferGeometryUtils.mergeBufferGeometries(geometries);
  const instances = new Float32Array(g.attributes.position.count).fill(-1);
  g.setAttribute('instance', new THREE.BufferAttribute(instances, 1));
  return g;
}
const vertexShader = `\
precision highp float;
precision highp int;

attribute float instance;
uniform float uTime;
uniform sampler2D uSeamlessNoiseTexture;
varying vec2 vUv;
varying float vInstance;
varying float vDistance;

// #define PI 3.1415926535897932384626433832795

void main() {
  vec3 p = position;

  if (instance >= 0.) {
    float factor = mod(uTime, 1.);
    float distance1 = ${minRadius.toFixed(8)} + instance * ${minRadius.toFixed(
  8,
)};;
    float distance2 = distance1 + ${minRadius.toFixed(8)};
    float distance = distance1 * (1.0 - factor) + distance2 * factor - ${minRadius.toFixed(
      8,
    )};
    p.xz *= distance / distance1;
    
    float distanceFactor = (distance) / ${(maxRadius - minRadius).toFixed(8)};
    distanceFactor = mod(distanceFactor, 1.);
    vDistance = distanceFactor; // sin(distanceFactor * PI);
    float vDistance2 = sin(distanceFactor * PI * 0.8);
    p.y *= vDistance2;
  }

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  vUv = uv;
  vInstance = instance;
}
`;
const fragmentShader = `\
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;
varying float vDistance;
varying float vInstance;

#define nsin(x) (sin(x) * 0.5 + 0.5)
#define PI 3.1415926535897932384626433832795

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float hermite(float t)
{
  return t * t * (3.0 - 2.0 * t);
}

float noise(vec2 co, float frequency)
{
  vec2 v = vec2(co.x * frequency, co.y * frequency);

  float ix1 = floor(v.x);
  float iy1 = floor(v.y);
  float ix2 = floor(v.x + 1.0);
  float iy2 = floor(v.y + 1.0);

  float fx = hermite(fract(v.x));
  float fy = hermite(fract(v.y));

  float fade1 = mix(rand(vec2(ix1, iy1)), rand(vec2(ix2, iy1)), fx);
  float fade2 = mix(rand(vec2(ix1, iy2)), rand(vec2(ix2, iy2)), fx);

  return mix(fade1, fade2, fy);
}

float pnoise(vec2 co, float freq, int steps, float persistence)
{
  float value = 0.0;
  float ampl = 1.0;
  float sum = 0.0;
  for(int i=0 ; i<steps ; i++)
  {
    sum += ampl;
    value += noise(co, freq) * ampl;
    freq *= 2.0;
    ampl *= persistence;
  }
  return value / sum;
}

void mainImage(out vec4 fragColor, in vec2 uv) {
  float gradient = 1.0 - uv.y;
  float gradientStep = 0.2;
  
  float uvSpeed = vInstance >= 0. ? 0.1 : 1.;

  vec2 pos = uv;
  pos.y -= uTime * uvSpeed;
  
  vec4 brighterColor = vec4(1.0, 0.65, 0.1, 0.25);
  vec4 darkerColor = vec4(1.0, 0.0, 0.15, 0.0625);
  vec4 middleColor = mix(brighterColor, darkerColor, 0.5);

  float noiseTexel = pnoise(pos, 10.0, 5, 0.5);
  
  float firstStep = smoothstep(0.0, noiseTexel, gradient);
  float darkerColorStep = smoothstep(0.0, noiseTexel, gradient - gradientStep);
  float darkerColorPath = firstStep - darkerColorStep;
  vec4 color = mix(brighterColor, darkerColor, darkerColorPath);

  float middleColorStep = smoothstep(0.0, noiseTexel, gradient - 0.2 * 2.0);
  
  color = mix(color, middleColor, darkerColorStep - middleColorStep);
  color = mix(vec4(0.0), color, firstStep);
  color *= 1.5;
	fragColor = color;

  fragColor.a *= (1. - vDistance) * 2. * uOpacity;

  #include <tonemapping_fragment>
  #include <encodings_fragment>
}

void main() {
  mainImage(gl_FragColor, vUv);
}

/** SHADERDATA
{
	"title": "Fire shader",
	"description": "Fire shader after @febucci",
	"model": "nothing"
}
*/
`;
const _makeCometMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();
  // const localPlayer = useLocalPlayer();

  // console.log('make cylinders mesh');

  const object = new THREE.Object3D();

  const shockwaveGeometry = createShockwaveGeometry();
  const frontGeometry = BufferGeometryUtils.mergeBufferGeometries([
    shockwaveGeometry,
    createCylindersGeometry(true),
  ]);
  const backGeometry = BufferGeometryUtils.mergeBufferGeometries([
    shockwaveGeometry,
    createCylindersGeometry(false),
  ]);
  const explosionFrontGeometry = createExplosionGeometry(true);
  const explosionBackGeometry = createExplosionGeometry(false);
  const frontMaterial = new WebaverseShaderMaterial({
    uniforms: {
      uTime: {
        value: 0,
        needsUpdate: true,
      },
      uOpacity: {
        value: 1,
        needsUpdate: true,
      },
      uSeamlessNoiseTexture: {
        value: getSeamlessNoiseTexture(),
        needsUpdate: true,
      },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    transparent: true,
  });
  const backMaterial = new WebaverseShaderMaterial({
    uniforms: {
      uTime: {
        value: 0,
        needsUpdate: true,
      },
      uOpacity: {
        value: 1,
        needsUpdate: true,
      },
      uSeamlessNoiseTexture: {
        value: getSeamlessNoiseTexture(),
        needsUpdate: true,
      },
    },
    vertexShader,
    fragmentShader,
    side: THREE.FrontSide,
    transparent: true,
  });

  const frontMesh = new THREE.Mesh(frontGeometry, frontMaterial);
  object.add(frontMesh);
  const backMesh = new THREE.Mesh(backGeometry, backMaterial);
  object.add(backMesh);
  const explosionFrontMesh = new THREE.Mesh(
    explosionFrontGeometry,
    frontMaterial,
  );
  object.add(explosionFrontMesh);
  const explosionBackMesh = new THREE.Mesh(explosionBackGeometry, backMaterial);
  object.add(explosionBackMesh);

  let explosionStartTime = NaN;
  let dropped = false;
  object.update = (timestamp, timeDiff) => {
    frontMesh.visible = false;
    backMesh.visible = false;
    explosionFrontMesh.visible = false;
    explosionBackMesh.visible = false;

    const timeSinceLastExplosion = timestamp - explosionStartTime;

    // animate
    if (isNaN(explosionStartTime)) {
      object.position.y -= timeDiff * 0.01;
    } else {
      const scaleFactor = Math.pow(
        Math.min(Math.max(timeSinceLastExplosion / 1000, 0), 1),
        0.1,
      );
      object.scale.setScalar(scaleFactor * explosionScaleFactor);
    }
    object.updateMatrixWorld();

    // check for collision
    if (isNaN(explosionStartTime)) {
      const worldPosition = localVector.setFromMatrixPosition(
        object.matrixWorld,
      );
      if (worldPosition.y >= 0) {
        // nothing
      } else {
        explosionStartTime = timestamp;

        if (!dropped) {
          object.dispatchEvent({
            type: 'drop',
          });

          dropped = true;
        }
      }
    }

    // check for explosion timeout
    /* if (timeSinceLastExplosion > 1000) {
      explosionStartTime = NaN;

      object.position.y += 10;
      object.scale.setScalar(1);
      object.updateMatrixWorld();
    } */

    // set visibility
    if (isNaN(explosionStartTime)) {
      frontMesh.visible = true;
      backMesh.visible = true;
    } else {
      explosionFrontMesh.visible = true;
      explosionBackMesh.visible = true;
    }

    // update uniforms
    const _updateUniforms = () => {
      const maxTime = 400;
      const f = (timestamp / maxTime) % maxTime;
      const timeSinceLastExplosion2 = (timestamp - explosionStartTime) / 1000;
      const opacityFactor = isNaN(explosionStartTime)
        ? 1
        : Math.min(Math.max(1 - timeSinceLastExplosion2, 0), 1);

      frontMaterial.uniforms.uTime.value = f;
      frontMaterial.uniforms.uTime.needsUpdate = true;
      frontMaterial.uniforms.uOpacity.value = opacityFactor;
      frontMaterial.uniforms.uOpacity.needsUpdate = true;

      backMaterial.uniforms.uTime.value = f;
      backMaterial.uniforms.uTime.needsUpdate = true;
      backMaterial.uniforms.uOpacity.value = opacityFactor;
      backMaterial.uniforms.uOpacity.needsUpdate = true;
    };
    _updateUniforms();
  };
  return object;
};
export default () => {
  const app = useApp();
  const dropManager = useDropManager();
  const {moduleUrls} = useDefaultModules();
  // const sounds = useSound();

  app.name = 'comet';

  app.setComponent('renderPriority', 'lower');

  const mesh = _makeCometMesh();

  // const dropMeshes = [];
  mesh.addEventListener('drop', e => {
    /* const dropMesh = _makeDropMesh();
    dropMesh.position.copy(worldPosition);
    // dropMesh.position.y += 0.5;
    // dropMesh.updateMatrixWorld();
    dropMeshes.push(dropMesh); */

    (async () => {
      const worldPosition = localVector.setFromMatrixPosition(mesh.matrixWorld);
      const dropApp = await dropManager.createDropApp({
        type: 'key',
        start_url: moduleUrls.card,
        components: [
          {
            key: 'appName',
            value: 'Silsword',
          },
          {
            key: 'appUrl',
            value: 'https://webaverse.github.io/silsword/',
          },
          {
            key: 'voucher',
            value: 'fakeVoucher',
          },
        ],
        position: worldPosition.clone().add(new THREE.Vector3(0, 0.5, 0)),
        // quaternion: app.quaternion,
        // scale: app.scale
        velocity: new THREE.Vector3(0, 3, 0),
      });

      // remove + add for sorting
      const parent = app.parent;
      parent.remove(app);
      parent.add(app);
    })();
  });
  app.add(mesh);
  mesh.updateMatrixWorld();

  useFrame(({timestamp, timeDiff}) => {
    mesh.update(timestamp, timeDiff);

    /* for (let i = 0; i < dropMeshes.length; i++) {
      const dropMesh = dropMeshes[i];
      dropMesh.update(timestamp, timeDiff);
    } */
  });

  /* useCleanup(() => {
    for (let i = 0; i < dropMeshes.length; i++) {
      const dropMesh = dropMeshes[i];
      dropMesh.parent.remove(dropMesh);
    }
  }); */

  return app;
};
