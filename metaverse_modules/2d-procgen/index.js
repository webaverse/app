import * as THREE from 'three';
import metaversefile from 'metaversefile';
import Simplex from '../../simplex-noise.js';
const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useScene, useWorld, useScene2DManager} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default e => {
  const app = useApp();
  const physics = usePhysics();
  const localPlayer = useLocalPlayer();
  const scene = useScene();
  const world = useWorld();
  const scene2DManager = useScene2DManager();

  let realObj = new THREE.Object3D;

  const geometry = new THREE.BoxGeometry( 0.5, 50, 0.5 );
  const material = new THREE.MeshStandardMaterial( {color: 0xebac38} );
  const prefabCube = new THREE.Mesh( geometry, material );

  const shakeNoise = new Simplex('hewn');

  let width = 10000;
  let height = 1;

  let lastPrefab = null;

  const branchGeometry = new THREE.BoxGeometry( 0.25, 2, 0.25 );
  const branchMaterial = new THREE.MeshStandardMaterial( {color: 0xebac38} );
  const prefabBranch = new THREE.Mesh( geometry, material );

  const randomPlace = (Math.random() > 0.9);

  for (let h = 0; h < height; h++) {
    for (let w = 0; w < width; w++) {
      let prefab = prefabCube.clone();

      //lastPrefab = prefab;
  
      prefab.position.x += w/2;
      //console.log(shakeNoise.noise1D(w));
      prefab.position.y += shakeNoise.noise1D(w/5 + shakeNoise.noise1D(Math.random()));
      
      if(prefab.position.y > 0.9) {
        prefab.material.color = new THREE.Color(0xebac38);
      }

      if(randomPlace) {
        let rasa = prefabBranch.clone();
        rasa.position.x = prefab.position.x;
        rasa.position.y = prefab.position.y + 100;
        realObj.add(rasa);
      }

      // if(lastPrefab) {
      //   prefab.lookAt(lastPrefab)
      //   prefab.updateMatrixWorld();
      // }
      //prefab.lookAt(lastPrefab)
      //prefab.updateMatrixWorld();
      ///prefab.position.y += w/height;
      //lastPrefab = prefab;
      realObj.add(prefab);
    } 
  }
  
  app.add(realObj);
  physics.addGeometry(realObj);

  app.add( cube );

  app.name = 'raid-party';

  useFrame(() => {
    //nothing
  });
  
  useCleanup(() => {
    // for (const physicsId of physicsIds) {
    //   physics.removeGeometry(physicsId);
    // }
  });

  app.hasSubApps = true;

  return app;
};