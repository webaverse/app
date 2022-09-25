import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
// import {getCaretAtPoint} from 'troika-three-text';
const {useApp, useInternals, useMaterials, useFrame, /*usePhysics,*/ useText} = metaversefile;

const localVector4D = new THREE.Vector4();

let multiText = null;

export default e => {
  const app = useApp();
  const {/*renderer, */scene/*, camera*/} = useInternals();
  // const physics = usePhysics();
  const {WebaverseShaderMaterial} = useMaterials();
  const Text = useText();

  const _makeMultiText = () => {
    class MultiText {
      constructor(material) {
        const text = new Text();
        text.material = material;
        // const derivedMaterial = text.material;
        // text._derivedMaterial = createTextDerivedMaterial(material);
        this.text = text;
      }
      makeText() {
        const text = new Text();
        text.material = this.text.material;
        text._derivedMaterial = this.text._derivedMaterial;
        return text;
      }
    }

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

          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return new MultiText(redMaterial);
  };

  const frameHandlers = [];

  {
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
      if (!multiText) {
        multiText = _makeMultiText();
      }
      const textMesh = multiText.makeText();
      // textMesh.material = redMaterial;
      textMesh.text = text + text;
      textMesh.font = font;
      textMesh.fontSize = fontSize;
      textMesh.color = color;
      textMesh.anchorX = anchorX;
      textMesh.anchorY = anchorY;
      textMesh.frustumCulled = false;
      // textMesh.outlineWidth = 0.1;
      // textMesh.outlineColor = 0x000000;
      await new Promise((accept, reject) => {
        textMesh.sync(accept);
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

      for (let i = 0; i < textMesh.geometry.attributes.aTroikaGlyphBounds.count*0.5; i++) {
        localVector4D.fromArray(textMesh.geometry.attributes.aTroikaGlyphBounds.array, i * 4)
          .toArray(textMesh.geometry.attributes.aTroikaGlyphBounds.array, textMesh.geometry.attributes.aTroikaGlyphBounds.array.length*0.5 + i * 4);
      }

      textMesh.position.set(-width * 0.5, height * 0.5, 0);
      
      return textMesh;
    }

    let textMeshSpec = null;

    let running = false;
    const frameHandler = async ({timestamp}) => {
      if (!running) {
        running = true;

        if (textMeshSpec && timestamp >= textMeshSpec.endTime) {
          for (const textMesh of textMeshSpec.textMeshes) {
            textMesh.geometry.dispose();
          } 
          textMeshSpec = null;
          scene.remove(app);
          frameHandlers.splice(frameHandlers.indexOf(frameHandler), 1);
        }
        if (!textMeshSpec) {
          const text = Math.floor(Math.random() * 2000) + '';
          const textMesh = await makeTextMesh(text);
          textMesh.frustumCulled = false;
          app.add(textMesh);
          textMesh.updateMatrixWorld();

          const textMeshes = [textMesh];
          textMeshSpec = {
            text,
            textMeshes,
            startTime: timestamp,
            endTime: timestamp + 1000,
          };
        }

        running = false;
      }

      if (textMeshSpec) {
        for (const textMesh of textMeshSpec.textMeshes) {
          textMesh.material.uniforms.uTime.value = (timestamp - textMeshSpec.startTime) / 1000;
        }
      }
    };
    frameHandlers.push(frameHandler);
  }

  useFrame(e => {
    for (const frameHandler of frameHandlers) {
      frameHandler(e);
    }
  });

  return app;
};