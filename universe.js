/*
this file contains the multiplayer code.
*/

import * as THREE from 'three';
import * as Y from 'yjs';
import {camera} from './renderer.js';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
// import minimap from './minimap.js';
// import cameraManager from './camera-manager.js';
// import physx from './physx.js';
// import {makeTextMesh} from './vr-ui.js';
import {parseQuery, parseCoord} from './util.js';
// import {arrowGeometry, arrowMaterial} from './shaders.js';
// import {landHost, worldUrl} from './constants.js';
import metaversefile from 'metaversefile';
import sceneNames from './scenes/scenes.json';

/* const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localBox = new THREE.Box3();
const localBox2 = new THREE.Box3();
const localObject = new THREE.Object3D(); */

let currentWorld = null;
const getWorldsHost = () => window.location.protocol + '//' + window.location.hostname + ':' +
  ((window.location.port ? parseInt(window.location.port, 10) : (window.location.protocol === 'https:' ? 443 : 80)) + 1) + '/worlds/';
const enterWorld = async worldSpec => {
  world.disconnectRoom();
  
  const localPlayer = metaversefile.useLocalPlayer();
  localPlayer.teleportTo(new THREE.Vector3(0, 1.5, 0), camera.quaternion, {
    relation: 'float',
  });
  physicsManager.setPhysicsEnabled(true);
  physicsManager.update(0);
  physicsManager.velocity.set(0, 0, 0);
  physicsManager.setPhysicsEnabled(false);

  const _doLoad = async () => {
    // world.clear();

    const promises = [];

    const {src, room} = worldSpec;
    if (!room) {
      const state = new Y.Doc();
      world.connectState(state);
      
      if (src === undefined) {
        promises.push(metaversefile.load('./scenes/' + sceneNames[0]));
      } else if (src === '') {
        // nothing
      } else {
        promises.push(metaversefile.load(src));
      }
    } else {
      const p = (async () => {
        const roomUrl = getWorldsHost() + room;
        await world.connectRoom(roomUrl);
      })();
      promises.push(p);
    }
    
    await Promise.all(promises);
  };
  await _doLoad().catch(err => {
    console.warn(err);
  });
  physicsManager.setPhysicsEnabled(true);
  physicsManager.update(0);
  physicsManager.velocity.set(0, 0, 0);

  currentWorld = worldSpec;
};
const reload = async () => {
  await enterWorld(currentWorld);
};
const pushUrl = async u => {
  history.pushState({}, '', u);
  window.dispatchEvent(new MessageEvent('pushstate'));
  await handleUrlUpdate();
};
const handleUrlUpdate = async () => {
  const q = parseQuery(location.search);
  await enterWorld(q);
};

export {
  enterWorld,
  reload,
  getWorldsHost,
  pushUrl,
  handleUrlUpdate,
};
