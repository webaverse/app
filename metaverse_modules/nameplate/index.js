import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
// import {getCaretAtPoint} from 'troika-three-text';
const {useApp, useInternals, useMaterials, useFrame, /* usePhysics, */ useText} = metaversefile;

const localVector4D = new THREE.Vector4();

const {WebaverseShaderMaterial} = useMaterials();
const Text = useText();

const redMaterial = new WebaverseShaderMaterial({
  uniforms: {
    uTime: {
      value: 0,
    },
    uWidth: {
      value: 0,
      needsUpdate: true,
    },
    uCharacters: {
      value: 0,
      needsUpdate: true,
    },
  },
  vertexShader: `\
    uniform float uTime;
    uniform float uCharacters;
    uniform float uWidth;
    attribute vec3 color;
    attribute float characterIndex;
    // attribute vec4 aTroikaGlyphBounds;
    varying vec3 vPosition;
    varying vec3 vColor;
    varying vec2 vUv;

    void main() {
      vPosition = vPosition;
      vUv = uv;
      // vColor = color;
      
      const float rate = 1.5;
      const float range = 1.;

      float characterIndex2 = characterIndex;
      if (characterIndex2 >= uCharacters) {
        characterIndex2 -= uCharacters;
      }
      float t = min(max(mod(uTime, 1.) - characterIndex2*0.08, 0.), 1.);
      t = pow(t, 0.75);
      const float a = -20.;
      const float v = 4.;
      float y = max(0.5 * a * pow(t, 2.) + v * t, 0.);
      y *= 0.5;

      vec3 p = position;
      if (characterIndex < uCharacters) {
        // p -= center;
        p.x += 0.02;
        p.y += 0.02;
        // p *= 1.3;// * vec3(1.2, 1., 1.);
        // p += center;
        p.z += -0.01;
        vColor = vec3(0.);
      } else {
        vColor = vec3(1.);
      }
      /* } else {
        p = (position + vec3(-uWidth, 0., 0.)) + vec3(0., 0., -0.1);
      } */
      p.y += y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragmentShader: `\
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vColor;

    vec3 color1 = vec3(${new THREE.Color(0xffca28).toArray().map(n => n.toFixed(8)).join(', ')});
    vec3 color2 = vec3(${new THREE.Color(0xff6f00).toArray().map(n => n.toFixed(8)).join(', ')});

    void main() {
      vec3 c = (color1*(1. - vUv.y) + color2*vUv.y);
      gl_FragColor = vec4(c * vColor, 1.0);
    }
  `,
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});

async function makeTextMesh(
  text = '',
  // font = '/fonts/Plaza Regular.ttf',
  font = '/fonts/WinchesterCaps.ttf',
  // font = '/fonts/Koloss.ttf',
  fontSize = 0.25,
  anchorX = 'left',
  anchorY = 'middle',
  color = 0x000000,
) {
  const _makeText = () => {
    const text = new Text();
    text.material = redMaterial;
    return text;
  };

  const textMesh = _makeText();
  // textMesh.material = redMaterial;
  textMesh.text = text;
  textMesh.font = font;
  textMesh.fontSize = fontSize;
  textMesh.color = color;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;

  await new Promise((resolve, reject) => {
    textMesh.sync(resolve);
  });

  // character indices
  const characterIndices = new Float32Array(textMesh.geometry.attributes.aTroikaGlyphIndex.array.length);
  for (let i = 0; i < characterIndices.length; i++) {
    // const index = i < characterIndices.length/2 ? i : i - characterIndices.length/2;
    characterIndices[i] = i;
  }
  const characterIndexAttribute = new THREE.InstancedBufferAttribute(characterIndices, 1, false);
  textMesh.geometry.setAttribute('characterIndex', characterIndexAttribute);

  let minXPoint = Infinity;
  let maxXPoint = -Infinity;
  let minYPoint = Infinity;
  let maxYPoint = -Infinity;
  for (let i = 0; i < textMesh.geometry.attributes.aTroikaGlyphBounds.count; i++) {
    const boundingBox = localVector4D.fromArray(textMesh.geometry.attributes.aTroikaGlyphBounds.array, i * 4);
    minXPoint = Math.min(boundingBox.x, minXPoint);
    maxXPoint = Math.max(boundingBox.z, maxXPoint);
    minYPoint = Math.min(boundingBox.y, minYPoint);
    maxYPoint = Math.max(boundingBox.w, maxYPoint);
  }
  const width = (maxXPoint - minXPoint) * 0.5; // half because of the text being doubled
  const height = maxYPoint - minYPoint;
  textMesh.material.uniforms.uWidth.value = width;
  textMesh.material.uniforms.uWidth.needsUpdate = true;
  textMesh.material.uniforms.uCharacters.value = text.length;
  textMesh.material.uniforms.uCharacters.needsUpdate = true;

  for (let i = 0; i < textMesh.geometry.attributes.aTroikaGlyphBounds.count * 0.5; i++) {
    localVector4D.fromArray(textMesh.geometry.attributes.aTroikaGlyphBounds.array, i * 4)
      .toArray(textMesh.geometry.attributes.aTroikaGlyphBounds.array, textMesh.geometry.attributes.aTroikaGlyphBounds.array.length * 0.5 + i * 4);
  }

  textMesh.position.set(-width * 0.5, height * 0.5, 0);

  return textMesh;
}

export default e => {
  console.log("e is", e)
  const app = useApp();
  const {/* renderer, */scene/*, camera */} = useInternals();
  let textMesh = null;
  // const physics = usePhysics();
  (async () => {
    textMesh = await makeTextMesh("Anonymous");
    app.add(textMesh);
  })();

  useFrame(async () => {
    if (!textMesh) return;
    textMesh.updateMatrixWorld();
    // make sure techmesh position is updated
    // rotate textmesh to face camera
  });

  // do something with this
  const destroy = () => {
      textMesh.geometry.dispose();
      scene.remove(app);
  };

  return app;
};
