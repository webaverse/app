import {Vector3, Matrix4, Mesh, BoxGeometry, PlaneGeometry, DoubleSide, sRGBEncoding, MeshBasicMaterial, NearestFilter, Texture} from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import totum from 'totum';
const {useApp, useActivate, removeApp} = totum;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');
const imagePath = baseUrl + 'textures/remove.svg';
const redColor = 0xef5350;

const geometry = BufferGeometryUtils.mergeBufferGeometries([
  new BoxGeometry(1, 0.1, 0.1 + 0.01)
    .applyMatrix4(
      new Matrix4().lookAt(
        new Vector3(0, 0, 0),
        new Vector3(0, 0, -1),
        new Vector3(1, 1, 0).normalize(),
      ),
    ),
  new BoxGeometry(1, 0.1, 0.1)
    .applyMatrix4(
      new Matrix4().lookAt(
        new Vector3(0, 0, 0),
        new Vector3(0, 0, -1),
        new Vector3(-1, 1, 0).normalize(),
      ),
    ),
]);
const material = new MeshBasicMaterial({
  side: DoubleSide,
  transparent: true,
  alphaTest: 0.5,
});
(async () => {
  try {
    const img = await new Promise((accept, reject) => {
      const img = new Image();
      img.onload = () => {
        accept(img);
      };
      img.onerror = reject;
      img.crossOrigin = 'Anonymous';
      img.src = imagePath;
    });
    const texture = new Texture(img);
    texture.encoding = sRGBEncoding;
    texture.anisotropy = 16;
    // texture.minFilter = NearestFilter;
    // texture.magFilter = NearestFilter;
    texture.needsUpdate = true;
    material.map = texture;
    material.needsUpdate = true;
  } catch(err) {
    console.warn(err);
    material.color = redColor;
    material.needsUpdate = true;
  }
})();

export default () => {
  const app = useApp();
  // const physics = usePhysics();
	
	// let physicsIds = [];

  const mesh = new Mesh(geometry, material);
  app.add(mesh);
  
  /* const physicsId = physics.addGeometry(mesh);
  physicsIds.push(physicsId); */
	
	useActivate(() => {
		removeApp(app);
    app.destroy();
	});

  return app;
};
