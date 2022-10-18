import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useScene, useWorld, useScene2DManager} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default e => {
  const app = useApp();
  const physics = usePhysics();
  const localPlayer = useLocalPlayer();
  const scene = useScene();
  const world = useWorld();
  const scene2DManager = useScene2DManager();

  //const pointerControls = scene2DManager.pointerControls ? scene2DManager.pointerControls : null;

  app.name = 'raid-party';

  let initialized = false;
  let debugMeshes = [];

  let healthbarObject = null;

  let levelState = 0;

  let fighterPositions = [
    new THREE.Vector3(18, 2.07, 0),
    new THREE.Vector3(18, -3.44, 0),

    new THREE.Vector3(-18, 2.07, 0),
    new THREE.Vector3(-18, -3.44, 0)
  ]

  const bossPrefabs = [
    {
      "start_url": `${baseUrl}Assets/raidparty/1.gif`,
      "scale": [3,3,3],
      "position": [0,-5.3,0]
    },
    {
      "start_url": `${baseUrl}Assets/raidparty/2.gif`,
      "scale": [3,3,3],
      "position": [0,-5.3,0]
    },
    {
      "start_url": `${baseUrl}Assets/raidparty/3.gif`,
      "scale": [3,3,3],
      "position": [0,-5.3,0]
    },
    {
      "start_url": `${baseUrl}Assets/raidparty/4.gif`,
      "scale": [3,3,3],
      "position": [0,-5.3,0]
    },
    {
      "start_url": `${baseUrl}Assets/raidparty/5.gif`,
      "scale": [3,3,3],
      "position": [0,-5.3,0]
    },
    {
      "start_url": `${baseUrl}Assets/raidparty/6.gif`,
      "scale": [3,3,3],
      "position": [0,0,0],
      "name": "Bee"
    },
    {
      "start_url": `${baseUrl}Assets/raidparty/7.gif`,
      "scale": [3,3,3],
      "position": [0,0,0],
      "name": "Big Slime"
    }
  ]

  const partyApps = [
    {
      "start_url": '../metaverse_modules/healthbar/',
      "position": [0,8,0]
    }
  ]

  let bossApps = [];
  let subApps = [];
  let activeBossApp = null;

  const initDebug = () => {
    fighterPositions.forEach(pos => {
      const geometry = new THREE.BoxGeometry( 2, 2, 2 );
      const material = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: true} );
      const cube = new THREE.Mesh( geometry, material );
      
      scene.add( cube );

      cube.position.copy(pos);
      cube.updateMatrixWorld();

      debugMeshes.push(cube);
    });
  }

  const attack = () => {
    if(activeBossApp) {
      let dmg = Math.random() * (15 - 5) + 5;
      let hitPosition = new THREE.Vector3().copy(activeBossApp.position);
      let hitDirection = new THREE.Vector3().copy(activeBossApp.position);
      let hitQuaternion = new THREE.Quaternion().copy(activeBossApp.quaternion);
      activeBossApp.hit(dmg, {
        type: 'bullet',
        collisionId: activeBossApp.physicsObjects[0].physicsId,
        hitPosition,
        hitDirection,
        hitQuaternion,
      });

      if(healthbarObject) {
        const updateEvent = {
          type: 'updateAmount',
          amount: activeBossApp.hitTracker.hp
        };
        healthbarObject.dispatchEvent(updateEvent);
      }
    }
  }

  const loadBoss = () => {
    const loadPromise = (async () => {
      await Promise.all(bossPrefabs.map(async spec => {
        const {start_url, components} = spec;
        if(spec === bossPrefabs[levelState]) {
          const subApp = await metaversefile.addTrackedApp(start_url);
          if(subApp) {
            
            if(healthbarObject) {
              const updateEvent = {
                type: 'updateAmount',
                amount: subApp.hitTracker.hp
              };
              healthbarObject.dispatchEvent(updateEvent);
            }

            subApp.position.set(0,-5,0);
            subApp.scale.set(4,4,4);
            subApp.updateMatrixWorld();
            activeBossApp = subApp;

            subApp.addEventListener('hit', e => {
              //console.log(subApp, e, "hit raid-party");
            });
            subApp.addEventListener('focused', e => {
              attack();
            });
            subApp.addEventListener('die', e => {
              metaversefile.removeApp(subApp);
              levelState++;
              loadBoss();
            });
          }
        }
      }));
    })();
    e.waitUntil(loadPromise);
  }

  const init = () => {
    if (localPlayer && localPlayer.characterPhysics.characterController) {
      const rndPos = fighterPositions[Math.floor(Math.random() * fighterPositions.length)];
      localPlayer.characterPhysics.setPosition(rndPos);
      loadBoss();
      initialized = true;
    }
  }

  useFrame(() => {
      if(!initialized) { init(); };
  });

  let physicsIds = [];
  (async () => {
    const u = `${baseUrl}Assets/raid.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    o = o.scene;
    app.add(o);
    const physicsId = physics.addGeometry(o);
    physicsIds.push(physicsId);
  })();

  const loadPromise = (async () => {
    await Promise.all(partyApps.map(async spec => {
      const {start_url, components, position, scale} = spec;    
      const subApp = await metaversefile.createAppAsync({
        start_url,
        parent: app,
        components: components,
        position, position,
        scale: scale,
      });

      if(start_url.includes('healthbar')) {
        //console.log("yup issa healthbar");
        healthbarObject = subApp;
      }
      //healthbar

      subApps.push(subApp);
    }));
  })();
  e.waitUntil(loadPromise);
  
  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  app.hasSubApps = true;

  return app;
};