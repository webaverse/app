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
    this.progressing = false;
  }
  addLocalPlayerMessage(text, type = 'chat') {
    const message = {
      type,
      player: this.localPlayer,
      name: this.localPlayer.name,
      text,
    };
    this.messages.push(message);

    this.dispatchEvent(new MessageEvent('message', {
      data: {
        message,
      },
    }));

    (async () => {
      await _playerSay(this.localPlayer, text);
    })();
  }
  addRemotePlayerMessage(text, type = 'chat') {
    const message = {
      type,
      player: this.remotePlayer,
      name: this.remotePlayer.name,
      text,
    };
    this.messages.push(message);

    this.dispatchEvent(new MessageEvent('message', {
      data: {
        message,
      },
    }));
    
    (async () => {
      await _playerSay(this.remotePlayer, text);
    })();
  }
  async wrapProgress(fn) {
    if (!this.progressing) {
      this.progressing = true;
      this.dispatchEvent(new MessageEvent('progressstart'));

      try {
        await fn();
      } finally {
        this.progressing = false;
        this.dispatchEvent(new MessageEvent('progressend'));
      }
    } else {
      console.warn('ignoring conversation progress() because it was already in progress');
    }
  }
  progressChat() {
    console.log('progress chat');

    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const comment = await aiScene.generateChatMessage(this.messages, this.remotePlayer.name);
      
      this.addRemotePlayerMessage(comment);
    });
  }
  progressOptions() {
    console.log('progress options');
    
    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const options = await aiScene.generateDialogueOptions(this.messages);

      this.dispatchEvent(new MessageEvent('options', {
        data: {
          options,
        },
      }));
    });
  }
  progressOptionSelect(option) {
    // say the option
    this.addLocalPlayerMessage(option, 'option');
    
    // 25% chance of self elaboration, 75% chance of other character reply
    this.localTurn = Math.random() < 0.25;
  }
  progressSelf() {
    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const comment = await aiScene.generateChatMessage(this.messages, this.localPlayer.name);
      
      this.addLocalPlayerMessage(comment);
    });
  }
  #getMessageAgo(n) {
    return this.messages[this.messages.length - n] ?? null;
  }
  progress() {
    const lastMessage = this.#getMessageAgo(1);
    
    if (this.localTurn) {
      // console.log('check last message 1', lastMessage, lastMessage?.type === 'chat', lastMessage?.player === this.localPlayer);
      
      if (lastMessage?.type === 'chat' && lastMessage?.player === this.localPlayer) {
        // 50% chance of showing options
        if (Math.random() < 0.5) {
          this.progressOptions();
          this.localTurn = true;
        } else {
          this.progressSelf();

          // 50% chance of moving to the other character
          this.localTurn = Math.random() < 0.5;
        }
      } else {
        this.progressSelf();

        // 50% chance of moving to the other character
        this.localTurn = Math.random() < 0.5;
      }
    } else {
      // console.log('check last message 2', lastMessage, lastMessage?.type === 'chat', lastMessage?.player === this.remotePlayer);

      if (lastMessage?.type === 'chat' && lastMessage?.player === this.remotePlayer) {
        // 50% chance of showing options
        if (Math.random() < 0.5) {
          this.progressOptions();
          this.localTurn = true;
        } else {
          // otherwise 50% chance of each character taking a turn
          if (Math.random() < 0.5) {
            this.progressChat();
          } else {
            this.localTurn = true;
            this.progress();
          }
        }
      } else { // it is the remote character's turn
        this.progressChat();
      }
    }
  }
  end() {
    this.dispatchEvent(new MessageEvent('ended'));
  }
  /* destroy() {
    this.dispatchEvent(new MessageEvent('destroy'));
  } */
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
          const remotePlayer = npcManager.npcs.find(npc => {
            return true; // XXX
          });

          if (remotePlayer) {
            const comment = await aiScene.generateSelectCharacterComment(name, description);

            currentConversation = new Conversation(localPlayer, remotePlayer);
            story.dispatchEvent(new MessageEvent('conversationstart', {
              data: {
                conversation: currentConversation,
              },
            }));
            currentConversation.addLocalPlayerMessage(comment);
          }
        } else {
          const comment = await aiScene.generateSelectTargetComment(name, description);
          _playerSay(localPlayer, comment);
        }
      })();
    }
  });
};

const story = new EventTarget();
let currentConversation = null;
story.getConversation = () => currentConversation;
export default story;