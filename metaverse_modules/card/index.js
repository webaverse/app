import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useMaterials} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const cardPreviewHost = `https://card-preview.exokit.org`;
const dropItemSize = 0.2;
const pickUpDistance = 1;

const localVector = new THREE.Vector3();
const localEuler = new THREE.Euler();

const zeroVector = new THREE.Vector3(0, 0, 0);
const gravity = new THREE.Vector3(0, -9.8, 0);
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

  let pickedUp = false;
  let rotY = 0;
  itemletMesh.update = (timestamp, timeDiff) => {
    const timeDiffS = timeDiff / 1000;
    const localPlayer = useLocalPlayer();

    if (!pickedUp) {
      if (!itemletMesh.velocity.equals(zeroVector)) {
        itemletMesh.position.add(localVector.copy(itemletMesh.velocity).multiplyScalar(timeDiffS));
        itemletMesh.velocity.add(localVector.copy(gravity).multiplyScalar(timeDiffS));
        if (itemletMesh.position.y < 0) {
          itemletMesh.position.y = 0;
          itemletMesh.velocity.set(0, 0, 0);
        }
      } else {
        const localPosition = localVector.copy(localPlayer.position);
        localPosition.y -= localPlayer.avatar.height;

        if (localPosition.distanceTo(itemletMesh.position) < pickUpDistance) {
          console.log('trigger drop pickUp');
          
          const localPlayer = useLocalPlayer();
          localPlayer.addAction({
            type: 'pickUp',
          });

          pickedUp = true;
        }
      }

      // rotation
      rotY += 0.3 * Math.PI * 2 * timeDiffS;
      rotY = rotY % (Math.PI * 2);
      localEuler.set(0, rotY, 0, 'YXZ');
      itemletMesh.quaternion.setFromEuler(localEuler);
      
      // console.log('got rotation', localEuler.y);
    } /* else {
      // console.log('animate');
    } */

    itemletMesh.updateMatrixWorld();
  };
  return itemletMesh;
};









/* const _loadImage = u => new Promise((accept, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  
  img.src = u;
  img.onload = () => {
    accept(img);
  };
  img.onerror = reject;
});
const cardFrontGeometry = new THREE.PlaneBufferGeometry(cardWidth, cardHeight);
const cardBackGeometry = cardFrontGeometry.clone()
  .applyMatrix4(
    new THREE.Matrix4().compose(
      new THREE.Vector3(0, 0, -0.001),
      new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
      new THREE.Vector3(1, 1, 1)
    )
  );
const _makeCardBackMaterial = () => {
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    map: new THREE.Texture(),
    transparent: true,
  });
  (async () => {
    const img = await _loadImage(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}cardback.png`);
    material.map.image = img;
    material.map.minFilter = THREE.LinearMipmapLinearFilter;
    material.map.magFilter = THREE.LinearFilter;
    material.map.encoding = THREE.sRGBEncoding;
    material.map.anisotropy = 16;
    material.map.needsUpdate = true;
  })();
  return material;
};
const _makeCardMesh = img => {
  const geometry = cardFrontGeometry;
  const material = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
    map: new THREE.Texture(img),
    side: THREE.DoubleSide,
    transparent: true,
  });
  material.map.minFilter = THREE.LinearMipmapLinearFilter;
  material.map.magFilter = THREE.LinearFilter;
  material.map.encoding = THREE.sRGBEncoding;
  material.map.anisotropy = 16;
  material.map.needsUpdate = true;
  const mesh = new THREE.Mesh(geometry, material);
  
  {
    const geometry = cardBackGeometry;
    const material = _makeCardBackMaterial();
    const back = new THREE.Mesh(geometry, material);
    mesh.add(back);
    mesh.back = back;
  }
  
  return mesh;
}; */
export default () => {
  const app = useApp();

  const cardMesh = _makeCardMesh();
  app.add(cardMesh);
  cardMesh.updateMatrixWorld();
  /* let cardMesh = null;
  (async() => {
    const id = 1;
    const w = 1024;
    const ext = 'png';
    const u = `${cardPreviewHost}/?t=${id}&w=${w}&ext=${ext}`;
    const img = await _loadImage(u);
    cardMesh = _makeCardMesh(img);
    cardMesh.rotation.order = 'YXZ';
    app.add(cardMesh);
  })(); */
  
  /* useFrame(({timestamp, timeDiff}) => {
    cardMesh.update(timestamp, timeDiff);
  }); */
  
  return app;
};