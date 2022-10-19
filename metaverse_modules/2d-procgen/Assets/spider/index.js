import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useScene, useLocalPlayer} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default () => {
  const app = useApp();
  const physics = usePhysics();
  const scene = useScene();
  const localPlayer = useLocalPlayer();

  app.name = 'EXAMPLE';

  let init = false;
  let restPos = [];

  let timeSinceMove = 0;

  let t = 0;

  useFrame(({timestamp, timeDiffS}) => {

    t += 0.001;

    if(legs.length > 0) {
      for (let i = 0; i < legs.length; i++) {

        var meshGlobal = new THREE.Vector3().setFromMatrixPosition(app.matrixWorld);

        var twinGlobalPos = new THREE.Vector3().setFromMatrixPosition(legs[i].matrix).add(meshGlobal);

        let worldPos = new THREE.Vector3();
        legs[i].getWorldPosition(worldPos);

        worldPos.y -= 0.25;

        //debug
        debugArray[i].position.copy(worldPos);
        debugArray[i].updateMatrixWorld();
        //

        const downQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);

        let result = physics.raycast(worldPos, downQuat);
        let point = new THREE.Vector3();

        if(result && !init) {

          if((timestamp - timeSinceMove) > 1000) {
            timeSinceMove = timestamp;
            point.fromArray(result.point);
            //legs[i].worldToLocal(point);
            restPos[i] = point;
          }

          if(restPos[i]) {
            //console.log(restPos[i])
            let vec = restPos[i].clone();
            legs[i].worldToLocal(vec);
            legs[i].position.copy(vec);
            legs[i].updateMatrixWorld();
          }
        }

        //legs[i].localToWorld(point);

        //legs[i].position.copy(point);
        legs[i].updateMatrixWorld();

        let dist = restPositions[i].distanceTo(twinGlobalPos);

        //console.log(dist);

        if(dist > 10.5) {

        }
        // if(dist > 10.5) {
        //   restPositions[i] =
        // }

      }

      app.position.add(new THREE.Vector3(0,0,0.1));
      app.updateMatrixWorld();
    }

    let vel = new THREE.Vector3(0,0,0.1);

    app.rotateY(0.001);
    vel.applyQuaternion(app.quaternion);
    app.position.add(vel);

    if(localPlayer && localPlayer.characterPhysics.lastGrounded) {
      //console.log(localPlayer.characterPhysics.lastGrounded)

        //vel.applyQuaternion(app.quaternion);
        const flags = physics.moveCharacterController(
          localPlayer.characterPhysics.characterController,
          vel,
          0,
          timeDiffS,
          localPlayer.characterPhysics.characterController.position,
    );
    }


    app.updateMatrixWorld();

  });

  let physicsIds = [];
  let legs = [];
  let restPositions = [];
  let debugArray = [];
  (async () => {
    const u = `${baseUrl}spider/platform.glb`;
    let o = await new Promise((accept, reject) => {
      const {gltfLoader} = useLoaders();
      gltfLoader.load(u, accept, function onprogress() {}, reject);
    });
    o = o.scene;

    let skinnedMesh = null;
    o.traverse(child => {
      if (skinnedMesh === null && child.isSkinnedMesh) {
        skinnedMesh = child;
      }
    });
    if (skinnedMesh) {

      legs[0] = skinnedMesh.skeleton.bones.find(
        bone => bone.name === "bone_front_left",
      );

      legs[1] = skinnedMesh.skeleton.bones.find(
        bone => bone.name === "bone_front_right",
      );

      legs[2] = skinnedMesh.skeleton.bones.find(
        bone => bone.name === "bone_back_left",
      );

      legs[3] = skinnedMesh.skeleton.bones.find(
        bone => bone.name === "bone_back_right",
      );

      const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
      const material = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: true} );
      let cube = new THREE.Mesh( geometry, material );

      for (let i = 0; i < legs.length; i++) {
        restPositions[i] = legs[i].position;

        debugArray[i] = cube.clone();
        scene.add( debugArray[i] );
        debugArray[i].quaternion.copy(legs[i].quaternion)
        debugArray[i].position.copy(restPositions[i]);
      }

      //console.log(legs, "legs");
      //console.log(restPositions);
    }
    app.add(o);

    const physicsId = physics.addGeometry(o);
    physicsIds.push(physicsId);
  })();

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
