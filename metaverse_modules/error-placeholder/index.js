import {Mesh, PlaneGeometry, DoubleSide, MeshBasicMaterial, NearestFilter, Texture} from 'three';
// import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import metaversefile from 'metaversefile';
const {useApp, useActivate, removeApp} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');
const imagePath = baseUrl + 'textures/x.png';

const geometry = new PlaneGeometry(1, 1, 1);
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
    texture.minFilter = NearestFilter;
    texture.magFilter = NearestFilter;
    texture.needsUpdate = true;
    material.map = texture;
    material.needsUpdate = true;
  } catch(err) {
    console.warn(err);
    material.color = 0xFF0000;
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
