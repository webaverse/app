/*
this file contains the multiplayer code.
*/

import * as THREE from 'three';
import * as Z from 'zjs';
import {world} from './world.js';
import physicsManager from './physics-manager.js';
import {initialPosY} from './constants.js';
import {parseQuery, parseCoord} from './util.js';
import metaversefile from 'metaversefile';
import sceneNames from './scenes/scenes.json';
import { rootScene } from './renderer'

let currentWorld = null;
const getWorldsHost = () => window.location.protocol + '//' + window.location.hostname + ':' +
  ((window.location.port ? parseInt(window.location.port, 10) : (window.location.protocol === 'https:' ? 443 : 80)) + 1) + '/worlds/';
const enterWorld = async worldSpec => {
  world.disconnectRoom();
  
  const localPlayer = metaversefile.useLocalPlayer();
  window.localPlayer = localPlayer // TEST
  /* localPlayer.teleportTo(new THREE.Vector3(0, 1.5, 0), camera.quaternion, {
    relation: 'float',
  }); */
  localPlayer.position.set(0, initialPosY, 0);
  localPlayer.resetPhysics();
  localPlayer.updateMatrixWorld(true);
  physicsManager.setPhysicsEnabled(true);
  localPlayer.updatePhysics(0, 0);
  physicsManager.setPhysicsEnabled(false);

  const _doLoad = async () => {
    // world.clear();

    const promises = [];

    const {src, room} = worldSpec;
    if (!room) {
      const state = new Z.Doc();
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
  console.log(111)
  await _doLoad().catch(err => {
    console.warn(err);
  });
  console.log(222)

  localPlayer.resetPhysics();
  physicsManager.setPhysicsEnabled(true);
  localPlayer.updatePhysics(0, 0);

  setTimeout(() => {
    // TODO: Do not use setTimeout, find the place where the load is really complete.
    console.log(333)
    rootScene.traverse((child) => {
      if (child.type === 'vrm') {
        window.role = child
        window.role.position.y = 1
      }
      // child.matrixWorldNeedsUpdate = true
      child.updateMatrix()
    })
    rootScene.updateMatrixWorld(true)
  }, 10000)

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
