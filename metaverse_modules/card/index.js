import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame} = metaversefile;

const cardPreviewHost = `https://card-preview.exokit.org`;
// const cubicBezier = easing(0, 1, 0, 1);

const cardWidth = 0.063 * 3;
const cardHeight = cardWidth / 2.5 * 3.5;
const _loadImage = u => new Promise((accept, reject) => {
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
};
export default () => {
  const app = useApp();

  let cardMesh = null;
  (async() => {
    const id = 1;
    const w = 1024;
    const ext = 'png';
    const u = `${cardPreviewHost}/?t=${id}&w=${w}&ext=${ext}`;
    const img = await _loadImage(u);
    cardMesh = _makeCardMesh(img);
    cardMesh.rotation.order = 'YXZ';
    app.add(cardMesh);
  })();
  
  useFrame(() => {
    if (cardMesh) {
      const maxTime = 2000;
      const f = (Date.now() % maxTime) / maxTime;
      cardMesh.rotation.y = f * (2*Math.PI);
    }
  });
  
  return app;
};