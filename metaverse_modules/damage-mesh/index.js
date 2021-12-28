import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
// import {getCaretAtPoint} from 'troika-three-text';
const {useApp, useInternals, useGeometries, useMaterials, useFrame, useActivate, useLoaders, usePhysics, useTextInternal, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

// const localVector = new THREE.Vector3();
// const localVector2 = new THREE.Vector3();
// const localVector2D = new THREE.Vector2();
const localVector4D = new THREE.Vector4();

/* function mergeBufferAttributesArray(a, b, offset = false) {
  const array = new a.array.constructor(a.array.length + b.array.length);
  let index = 0;
  for (let i = 0; i < a.array.length; i++) {
    array[index++] = a.array[i];
  }
  if (!offset) {
    for (let i = 0; i < b.array.length; i++) {
      array[index++] = b.array[i];
    }
  } else {
    const offsetIndex = index;
    for (let i = 0; i < b.array.length; i++) {
      array[index++] = offsetIndex + b.array[i];
    }
  }
  a.array = array;
  a.needsUpdate = true;
} */

export default e => {
  const app = useApp();
  const {renderer, scene, camera} = useInternals();
  const physics = usePhysics();
  // const {CapsuleGeometry} = useGeometries();
  const {WebaverseShaderMaterial} = useMaterials();
  const Text = useTextInternal();

  const frameHandlers = [];

  {
    /* const outlineMaterial = new WebaverseShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },
        uWidth: {
          value: 0,
        },
        uCharacters: {
          value: 0,
        },
      },
      vertexShader: `\
        uniform float uTime;
        uniform float uCharacters;
        attribute vec3 color;
        attribute float characterIndex;
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          vPosition = vPosition;
          vUv = uv;
          
          const float rate = 1.5;
          const float range = 1.;

          float t = min(max(mod(uTime, 1.) - characterIndex*0.08, 0.), 1.);
          t = pow(t, 0.75);
          const float a = -20.;
          const float v = 4.;
          float y = max(0.5 * a * pow(t, 2.) + v * t, 0.);
          y *= 0.5;

          vec3 p = position * 1.1 +
            vec3(0, y, 0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `\
        varying vec3 vPosition;
        varying vec2 vUv;

        void main() {
          gl_FragColor = vec4(0., 0., 1.0);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    }); */
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
      const textMesh = new Text();
      textMesh.material = redMaterial;
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

      // const strokeColor = new THREE.Color(0x333333);
      // const outlineColor = new THREE.Color(0x000000);

      /* // color
      const colors = new Float32Array(textMesh.geometry.attributes.position.array.length*3);
      for (let i = 0; i < colors.length/3; i++) {
        strokeColor.toArray(colors, i * 3);
      }
      const colorsAttribute = new THREE.BufferAttribute(colors, 3, false);
      textMesh.geometry.setAttribute('color', colorsAttribute);
      
      const outlineGeometry = textMesh.geometry.clone();
      // scale
      for (let i = 0; i < outlineGeometry.attributes.position.count; i++) {
        localVector.fromArray(outlineGeometry.attributes.position.array, i)
          .multiplyScalar(1.1)
          .toArray(outlineGeometry.attributes.position.array, i);
      }
      // color
      for (let i = 0; i < outlineGeometry.attributes.color.count; i++) {
        outlineColor.toArray(outlineGeometry.attributes.color.array, i * 3);
      }
      
      // const mergedGeometryAttributes = {};
      for (const attributeName of ['position', 'normal', 'uv', 'color']) {
        const oldLength = textMesh.geometry.attributes[attributeName].length;
        mergeBufferAttributesArray(textMesh.geometry.attributes[attributeName], outlineGeometry.attributes[attributeName]);
        console.log(
          'got lengths',
          oldLength,
          textMesh.geometry.attributes[attributeName].array.length,
          outlineGeometry.attributes[attributeName].length
        );
      }
      mergeBufferAttributesArray(textMesh.geometry.index, outlineGeometry.index, true);
      textMesh.geometry.instanceCount++;

      setTimeout(() => {
        console.log('got geos', textMesh.geometry.attributes.position.array.length, outlineGeometry.attributes.position.array.length, textMesh.geometry, outlineGeometry);
      }, 1000);
      // debugger;
      // textMesh.geometry.attributes = mergedGeometryAttributes; */
      // window.textMesh = textMesh;
      
      return textMesh;
    }

    /* const numberStrings = Array(10);
    for (let i = 0; i < numberStrings.length; i++) {
      numberStrings[i] = i + '';
    } */
    /* const numberStrings = ['271'];
    let numberMeshes = null;
    let numberGeometries = null;
    let numberMaterials = null;
    e.waitUntil((async () => {
      numberMeshes = await Promise.all(numberStrings.map(async s => {
        // console.log('wait 1');
        const textMesh = await makeTextMesh(s);
        // console.log('wait 2');
        return textMesh;
      }));
      numberGeometries = numberMeshes.map(m => m.geometry);
      numberMaterials = numberMeshes.map(m => m.geometry);

      const tempScene = new THREE.Scene();
      for (const numberMesh of numberMeshes) {
        tempScene.add(numberMesh);
      }
      renderer.compile(tempScene, camera);
      for (const numberMesh of numberMeshes) {
        tempScene.remove(numberMesh);
      }

      window.numberMeshes = numberMeshes;
      window.numberGeometries = numberGeometries;
      window.numberMaterials = numberMaterials;
    })()); */

    let textMeshSpec = null;
    /* const textMesh = makeTextMesh('');
    textMesh.frustumCulled = false;
    scene.add(textMesh); */

    let running = false;
    const frameHandler = async ({timestamp}) => {
      // console.log('got', {numberGeometries, numberMaterial});
      if (!running) {
        running = true;

        if (textMeshSpec && timestamp >= textMeshSpec.endTime) {
          for (const textMesh of textMeshSpec.textMeshes) {
            textMesh.geometry.dispose();
            textMesh.material.dispose();
            // scene.remove(textMesh);
          }
          textMeshSpec = null;
          scene.remove(app);
          frameHandlers.splice(frameHandlers.indexOf(frameHandler), 1);
        }
        if (!textMeshSpec) {
          const text = Math.floor(Math.random() * 2000) + '';
          const textMesh = await makeTextMesh(text);
          // textMesh.position.y = 2;
          textMesh.frustumCulled = false;
          app.add(textMesh);
          textMesh.updateMatrixWorld();

          /* const textMesh = makeTextMesh(text, undefined, 1, 'center', 'middle', 0xffffff);
          setTimeout(() => {
            console.log('got', textMesh.geometry.attributes.aTroikaGlyphBounds?.array.length);
          }, 1000); */
          const textMeshes = [textMesh];
          textMeshSpec = {
            text,
            textMeshes,
            startTime: timestamp,
            endTime: timestamp + 1000,
          };
          // window.textMeshSpec = textMeshSpec;
        }

        running = false;
      }

      if (textMeshSpec) {
        for (const textMesh of textMeshSpec.textMeshes) {
          textMesh.material.uniforms.uTime.value = (timestamp - textMeshSpec.startTime) / 1000;
          // console.log('text length', textMeshSpec.text.length);
        }
      }
    };
    frameHandlers.push(frameHandler);

    /* const physicsIds = [];
    useCleanup(() => {
      for (const physicsId of physicsIds) {
        physics.removeGeometry(physicsId);
      }
    }); */
  }

  useFrame(e => {
    for (const frameHandler of frameHandlers) {
      frameHandler(e);
    }
  });

  return app;
};