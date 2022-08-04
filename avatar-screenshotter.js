import * as THREE from 'three';
import metaversefile from './metaversefile-api.js';
// import Avatar from './avatars/avatars.js';
import npcManager from './npc-manager.js';
import dioramaManager from './diorama.js';

const FPS = 60;

const _makeLights = () => {
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 5);
  directionalLight.position.set(1, 1.5, -2);
  directionalLight.updateMatrixWorld();

  return [
    directionalLight,
  ];
};

export const screenshotAvatarUrl = async ({
  start_url,
  width = 300,
  height = 300,
  canvas,
  cameraOffset,
  emotion,
}) => {
  const player = await npcManager.createNpcAsync({
    name: 'sceenshot-npc',
    avatarUrl: start_url,
    detached: true,
  });

  const result = await screenshotPlayer({
    player,
    width,
    height,
    canvas,
    cameraOffset,
    emotion,
  });
  player.destroy();
  return result;
};
export const screenshotPlayer = async ({
  player,
  width = 300,
  height = 300,
  canvas,
  cameraOffset,
  emotion,
}) => {
  player.position.set(0, 1.5, 0);
  player.quaternion.identity();
  player.scale.set(1, 1, 1);
  player.updateMatrixWorld();
  
  let now = 0;
  const timeDiff = 1000/FPS;

  const _setTransform = () => {
    player.position.y = player.avatar.height;
    player.updateMatrixWorld();
  };
  _setTransform();

  const _initializeAnimation = () => {
    player.avatar.setTopEnabled(false);
    player.avatar.setHandEnabled(0, false);
    player.avatar.setHandEnabled(1, false);
    player.avatar.setBottomEnabled(false);
    player.avatar.inputs.hmd.position.y = player.avatar.height;
    player.avatar.inputs.hmd.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    player.avatar.inputs.hmd.updateMatrixWorld();
    if (emotion) {
      player.clearActions();
      player.addAction({
        type: 'facepose',
        emotion,
      });
    }
  };
  const _preAnimate = () => {
    for (let i = 0; i < FPS*2; i++) {
      _animate(now, timeDiff);
    };
  };
  const localVector = new THREE.Vector3();
  const localVector2 = new THREE.Vector3();
  
  const _updateTarget = (timestamp, timeDiff) => {
    
    //v1
    // let height = null;
    // player.avatar.object.scene.traverse(o => {
    //   // console.log(o.name, o.isMesh);
    //   if (o.isMesh && o.geometry.boundingBox && !height) {
    //     var boundingBox = new THREE.Box3();
    //     var mesh = o;
    //     boundingBox.copy( mesh.geometry.boundingBox );
    //     mesh.updateMatrixWorld( true ); // ensure world matrix is up to date
    //     boundingBox.applyMatrix4( mesh.matrixWorld );
    //     height = boundingBox.max.y;
    //   }
    // });
    // const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBoneOutputs.Left_shoulder.matrixWorld);
    // console.log(height - headPosition.y);


    //v2
    // const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBones.Neck.matrixWorld);
    // let tempMesh = null;
    // player.avatar.object.scene.traverse(o => {
    //   if (o.isMesh) {
    //     tempMesh = o;
    //   }
    // });
    // if(!tempMesh.geometry.boundingBox){
    //   tempMesh.geometry.computeBoundingBox()
    //   tempMesh.geometry.computeBoundingSphere()
    // }
    // console.log(tempMesh.geometry.boundingBox.max.y - headPosition.y);
    // console.log(tempMesh.geometry.boundingBox.max.y, headPosition.y);
    // console.log(player.avatar.modelBones)
    // console.log('Neck correct:', headPosition.y)

    //v3
    // const bbox = new THREE.Box3().setFromObject(player.avatar.modelBones.Head);
    // console.log(bbox)

    target.matrixWorld.copy(player.avatar.modelBones.Head.matrixWorld)
      .decompose(target.position, target.quaternion, target.scale);

    const decapitatePosition = localVector.setFromMatrixPosition(player.avatar.modelBones.Head.savedMatrixWorld);
    let maxY = 0;
    let tempMesh = null;
    player.avatar.model.traverse(o => {
      if (o.isMesh) {
        for(let i = 0; i < o.geometry.attributes.position.array.length; i++){
          if(i % 3 === 1){
            maxY = (o.geometry.attributes.position.array[i] > maxY) ? o.geometry.attributes.position.array[i] : maxY; 
            tempMesh = o;
          }
        } 
      }
    });
    maxY += tempMesh.position.y;
    
    
    let headHeight = maxY - decapitatePosition.y;
    
    console.log('decapitatePosition:', decapitatePosition.y);
    console.log('maxY:', maxY)
    console.log('headHeight:', headHeight)
    
    const fov = 50 * ( Math.PI / 180 );
    let cameraZ = Math.abs( headHeight / 10 * Math.tan( fov * 2 ) );

    let offset = Math.pow(1. + headHeight, 1.8);
    console.log(offset)
    // offset = offset > 2 ? 2 : offset;
    cameraZ *= offset;

    target.position.set(player.position.x, target.position.y, player.position.z - cameraZ);
    target.quaternion.copy(player.quaternion);
    target.matrixWorld.compose(target.position, target.quaternion, target.scale);
  };
  const _animate = (timestamp, timeDiff) => {
    player.updateAvatar(timestamp, timeDiff);
  };

  // rendering
  let writeCanvas;
  if (canvas) {
    writeCanvas = canvas;
  } else {
    writeCanvas = document.createElement('canvas');
    writeCanvas.width = width;
    writeCanvas.height = height;
  }

  const localLights = _makeLights();
  const objects = localLights.concat([
    player.avatar.model,
  ]);
  const target = new THREE.Object3D();
  const diorama = dioramaManager.createPlayerDiorama({
    // target: player,
    target,
    cameraOffset,
    objects,
    lights: false,
    // label: true,
    // outline: true,
    // grassBackground: true,
    // glyphBackground: true,
    detached: true,
  });
  diorama.addCanvas(writeCanvas);
  diorama.setClearColor(0xFFFFFF, 1);

  const _render = () => {
    _initializeAnimation();
    _preAnimate();
    _updateTarget(now, timeDiff);
    diorama.update(now, timeDiff);
  };
  _render();

  diorama.destroy();
  // player.destroy();

  return writeCanvas;
};