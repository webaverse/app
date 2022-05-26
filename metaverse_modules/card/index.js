import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useMaterials} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const cardPreviewHost = `https://card-preview.exokit.org`;
const dropItemSize = 0.2;
// const pickUpDistance = 1;

// const localVector = new THREE.Vector3();
// const localEuler = new THREE.Euler();

// const zeroVector = new THREE.Vector3(0, 0, 0);
// const gravity = new THREE.Vector3(0, -9.8, 0);
const cardWidth = 0.063 * 3;
const cardHeight = cardWidth / 2.5 * 3.5;

function getCardBackTexture() {
  const img = new Image();
  const texture = new THREE.Texture(img);

  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    texture.needsUpdate = true;
  };
  img.onerror = err => {
    console.warn(err);
  };
  img.src = `images/cardback-01.svg`;

  return texture;
}
const _makeCardMesh = () => {
  const {WebaverseShaderMaterial} = useMaterials();

  // let w = 520;
  // let h = 728;
  let w = cardWidth;
  let h = cardHeight;

  h /= w;
  w /= w;

  w *= dropItemSize;
  h *= dropItemSize;

  const geometry = new THREE.PlaneBufferGeometry(w, h)
    // .translate(0, 0.5, 0);
  const texture = getCardBackTexture();
  
  const material = new WebaverseShaderMaterial({
    uniforms: {
      uTex: {
        value: texture,
        needsUpdate: true,
      },
    },
    vertexShader: `\
      // uniform vec4 cameraBillboardQuaternion;
      varying vec2 vUv;

      /* vec3 rotate_vertex_position(vec3 position, vec4 q) {
        return position + 2.0 * cross(q.xyz, cross(q.xyz, position) + q.w * position);
      } */

      void main() {
        vec3 pos = position;

        // pos = rotate_vertex_position(pos, cameraBillboardQuaternion);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        vUv = uv;
      }
    `,
    fragmentShader: `\
      uniform sampler2D uTex;
      // uniform vec3 color1;
      // uniform vec3 color2;
      varying vec2 vUv;

      void main() {
        vec4 diffuseColor = texture2D(uTex, vUv);
        gl_FragColor = diffuseColor;
        if (gl_FragColor.a < 0.1) {
          discard;
        }
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const itemletMesh = new THREE.Mesh(geometry, material);
  // itemletMesh.velocity = new THREE.Vector3(0, 3, 0);
  itemletMesh.frustumCulled = false;
  // itemletMesh.updateMatrixWorld();
  return itemletMesh;
};

export default () => {
  const app = useApp();

  const cardMesh = _makeCardMesh();
  app.add(cardMesh);
  cardMesh.updateMatrixWorld();
  
  return app;
};