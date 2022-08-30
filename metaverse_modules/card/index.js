import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useMaterials, useCardsManager} = metaversefile;

const dropItemSize = 0.2;

const cardWorldWidth = 0.063 * 3;
const cardWorldHeight = cardWorldWidth / 2.5 * 3.5;
const width = 520;

function getCardFrontTexture(appUrl) {
  const cardsManager = useCardsManager();

  const texture = new THREE.Texture();
  (async () => {
    const imageBitmap = await cardsManager.getCardsImage(
      appUrl,
      {
          width,
          flipY: true,
          // signal,
      }
    );
    texture.image = imageBitmap;
    texture.needsUpdate = true;

    texture.dispatchEvent({type: 'load'});
  })();
  return texture;
}
function getCardBackTexture() {
  const img = new Image();
  const texture = new THREE.Texture(img);

  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    texture.needsUpdate = true;

    texture.dispatchEvent({type: 'load'});
  };
  img.onerror = err => {
    console.warn(err);
  };
  img.src = `images/cardback-01.svg`;

  return texture;
}
const _makeCardMesh = ({
  appUrl,
}) => {
  const {WebaverseShaderMaterial} = useMaterials();

  // let w = 520;
  // let h = 728;
  let w = cardWorldWidth;
  let h = cardWorldHeight;

  h /= w;
  w /= w;

  w *= dropItemSize;
  h *= dropItemSize;

  const frontGeometry = new THREE.PlaneBufferGeometry(w, h);
  const backGeometry = new THREE.PlaneBufferGeometry(w, h).rotateY(Math.PI);

  const _setSideAttribute = (g, side) => {
    const sides = new Int32Array(g.attributes.position.count).fill(side);
    const sideAttribute = new THREE.BufferAttribute(sides, 1);
    g.setAttribute('side', sideAttribute);
  };
  _setSideAttribute(frontGeometry, 0);
  _setSideAttribute(backGeometry, 1);

  const geometry = BufferGeometryUtils.mergeBufferGeometries([
    frontGeometry,
    backGeometry,
  ]);

  const frontTexture = getCardFrontTexture(appUrl);
  {
    const load = () => {
      material.uniforms.uFrontTexLoaded.value = 1;
      material.uniforms.uFrontTexLoaded.needsUpdate = true;
      frontTexture.removeEventListener('load', load);
    };
    frontTexture.addEventListener('load', load);
  }
  const backTexture = getCardBackTexture();
  {
    const load = () => {
      material.uniforms.uBackTexLoaded.value = 1;
      material.uniforms.uBackTexLoaded.needsUpdate = true;
      backTexture.removeEventListener('load', load);
    };
    backTexture.addEventListener('load', load);
  }

  const material = new WebaverseShaderMaterial({
    uniforms: {
      uFrontTex: {
        value: frontTexture,
        needsUpdate: true,
      },
      uBackTex: {
        value: backTexture,
        needsUpdate: true,
      },
      uFrontTexLoaded: {
        value: 0,
        needsUpdate: true,
      },
      uBackTexLoaded: {
        value: 0,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      // uniform vec4 cameraBillboardQuaternion;
      attribute int side;
      varying vec2 vUv;
      flat varying int vSide;


      /* vec3 rotate_vertex_position(vec3 position, vec4 q) {
        return position + 2.0 * cross(q.xyz, cross(q.xyz, position) + q.w * position);
      } */

      void main() {
        vec3 pos = position;

        // pos = rotate_vertex_position(pos, cameraBillboardQuaternion);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        vUv = uv;
        vSide = side;
      }
    `,
    fragmentShader: `\
      uniform sampler2D uFrontTex;
      uniform sampler2D uBackTex;
      uniform int uFrontTexLoaded;
      uniform int uBackTexLoaded;
      varying vec2 vUv;
      flat varying int vSide;

      void main() {
        vec4 diffuseColor;
        if (vSide == 0) {
          diffuseColor = uFrontTexLoaded == 1 ? texture2D(uFrontTex, vUv) : vec4(vec3(0.0), 1.0);
        } else {
          diffuseColor = uBackTexLoaded == 1 ? texture2D(uBackTex, vUv) : vec4(vec3(0.0), 1.0);
        }
        gl_FragColor = diffuseColor;
        if (gl_FragColor.a < 0.1) {
          discard;
        }

        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }
    `,
    // side: THREE.DoubleSide,
    transparent: true,
  });
  const itemletMesh = new THREE.Mesh(geometry, material);
  // itemletMesh.velocity = new THREE.Vector3(0, 3, 0);
  // itemletMesh.frustumCulled = false;
  // itemletMesh.updateMatrixWorld();
  return itemletMesh;
};

export default () => {
  const app = useApp();

  const appUrl = app.getComponent('appUrl');

  if (appUrl) {
    const cardMesh = _makeCardMesh({
      appUrl,
    });
    app.add(cardMesh);
    cardMesh.updateMatrixWorld();
  } else {
    console.warn('card has no app url', app, new Error().stack);
  }

  return app;
};