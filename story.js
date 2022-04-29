/*
this file contains the story beat triggers (battles, victory, game over, etc.)
*/

import * as THREE from 'three';
import metaversefile from 'metaversefile';
import {SwirlPass} from './SwirlPass.js';
import {
  getRenderer,
  getComposer,
  rootScene,
  // sceneHighPriority,
  // scene,
  // sceneLowPriority,
  camera,
} from './renderer.js';
import * as sounds from './sounds.js';
import musicManager from './music-manager.js';
import zTargeting from './z-targeting.js';
import cameraManager from './camera-manager.js';
import npcManager from './npc-manager.js';
import {chatManager} from './chat-manager.js';

const localVector2D = new THREE.Vector2();

function makeSwirlPass() {
  const renderer = getRenderer();
  const size = renderer.getSize(localVector2D)
    .multiplyScalar(renderer.getPixelRatio());
  const resolution = size;

  const swirlPass = new SwirlPass(rootScene, camera, resolution.x, resolution.y);
  // swirlPass.enabled = false;
  return swirlPass;
}
const _startSwirl = () => {
  const composer = getComposer();
  if (!composer.swirlPass) {
    composer.swirlPass = makeSwirlPass();
    composer.passes.push(composer.swirlPass);

    sounds.playSoundName('battleTransition');
    musicManager.playCurrentMusic('battle');
  }
};
const _stopSwirl = () => {
  const composer = getComposer();
  if (composer.swirlPass) {
    const swirlPassIndex = composer.passes.indexOf(composer.swirlPass);
    composer.passes.splice(swirlPassIndex, 1);
    composer.swirlPass = null;

    musicManager.stopCurrentMusic();
    return true;
  } else {
    return false;
  }
};

//

const _playerSay = async (player, message) => {
  const preloadedMessage = player.voicer.preloadMessage(message);
  await chatManager.waitForVoiceTurn(() => {
    // setText(message);
    return player.voicer.start(preloadedMessage);
  });
  // setText('');
};
class Conversation extends EventTarget {
  constructor(localPlayer, remotePlayer) {
    super();

    this.localPlayer = localPlayer;
    this.remotePlayer = remotePlayer;

    this.messages = [];
  }
  addLocalPlayerMessage(message) {
    (async () => {
      await _playerSay(this.localPlayer, message);
    })();
  }
  addRemotePlayerMessage(message) {
    (async () => {
      await _playerSay(this.remotePlayer, message);
    })();
  }
  destroy() {
    this.dispatchEvent(new MessageEvent('destroy'));
  }
}

//

const fieldMusicNames = [
  'dungeon',
  'homespace',
];

//

export const listenHack = () => {
  let currentFieldMusic = null;
  let currentFieldMusicIndex = 0;
  window.document.addEventListener('keydown', async e => {
    switch (e.which) {
      case 48: { // 0
        await musicManager.waitForLoad();

        _stopSwirl() || _startSwirl();
        break;
      }
      case 57: { // 9
        await musicManager.waitForLoad();

        _stopSwirl();
        if (currentFieldMusic) {
          musicManager.stopCurrentMusic();
          currentFieldMusic = null;
        } else {
          const fieldMusicName = fieldMusicNames[currentFieldMusicIndex];
          currentFieldMusicIndex = (currentFieldMusicIndex + 1) % fieldMusicNames.length;
          
          currentFieldMusic = musicManager.playCurrentMusic(fieldMusicName, {
            repeat: true,
          });
        }
        break;
      }
      case 189: { // -
        await musicManager.waitForLoad();
        
        _stopSwirl();
        musicManager.playCurrentMusic('victory', {
          repeat: true,
        });
        break;
      }
      case 187: { // =
        await musicManager.waitForLoad();

        _stopSwirl();
        musicManager.playCurrentMusic('gameOver', {
          repeat: true,
        });
        break;
      }
    }
  });

  window.document.addEventListener('click', async e => {
    if (e.button === 0 && (zTargeting.focusTargetReticle && zTargeting.lastFocus)) {
      const app = metaversefile.getAppByPhysicsId(zTargeting.focusTargetReticle.physicsId);
      // console.log('click reticle', app);
      const {name, description, appType} = app;

      cameraManager.setFocus(false);
      zTargeting.focusTargetReticle = null;
      sounds.playSoundName('menuSelect');

      (async () => {
        const localPlayer = metaversefile.useLocalPlayer();
        const aiScene = metaversefile.useLoreAIScene();
        // console.log('generate 1');
        if (appType === 'vrm') {
          const comment = await aiScene.generateSelectCharacterComment(name, description);
          const remotePlayer = npcManager.npcs.find(npc => {
            console.log('find npc', npc);
            return false;
          });

          const conversation = new Conversation(localPlayer, remotePlayer);
          story.dispatchEvent(new MessageEvent({
            data: {
              conversation,
            },
          }));
          conversation.addLocalPlayerMessage(comment);
        } else {
          const comment = await aiScene.generateSelectTargetComment(name, description);
          _playerSay(localPlayer, comment);
        }
      })();
    }
  });
};

const story = new EventTarget();
export default story;