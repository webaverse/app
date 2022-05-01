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
import {mod} from './util.js';

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
    this.finished = false;
    this.progressing = false;
    this.deltaY = 0;

    this.options = null;
    this.hoverIndex = null;
    this.option = null;

    this.addEventListener('message', e => {
      if (this.options) {
        const {message} = e.data;

        this.#setOptions(null);
        this.#setOption(message);
      }
    });
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
      const {
        value: comment,
        done,
      } = await aiScene.generateChatMessage(this.messages, this.remotePlayer.name);
      
      this.addRemotePlayerMessage(comment);
      done && this.finish();
    });
  }
  progressSelf() {
    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const {
        value: comment,
        done,
      } = await aiScene.generateChatMessage(this.messages, this.localPlayer.name);
      
      this.addLocalPlayerMessage(comment);
      done && this.finish();
    });
  }
  progressSelfOptions() {
    console.log('progress self options');
    
    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const {
        value: options,
        done,
       } = await aiScene.generateDialogueOptions(this.messages, this.localPlayer.name);

      if (!done) {
        this.#setOptions(options);
        this.#setHoverIndex(0);
      } else {
        this.finish();
      }
    });
  }
  progressOptionSelect(option) {
    if (!option) {
      option = this.options[this.hoverIndex];
      if (!option) {
        throw new Error('failed to select option (not in options state?)');
      }
    }

    // say the option
    this.addLocalPlayerMessage(option, 'option');
    
    // 25% chance of self elaboration, 75% chance of other character reply
    this.localTurn = Math.random() < 0.25;
  }
  #getMessageAgo(n) {
    return this.messages[this.messages.length - n] ?? null;
  }
  progress() {
    if (!this.finished) {
      const lastMessage = this.#getMessageAgo(1);
      
      const _handleLocalTurn = () => {
        // console.log('check last message 1', lastMessage, lastMessage?.type === 'chat', lastMessage?.player === this.localPlayer);
        
        if (lastMessage?.type === 'chat' && lastMessage?.player === this.localPlayer) {
          // 50% chance of showing options
          if (Math.random() < 0.5) {
            this.progressSelfOptions();
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
      };
      const _handleOtherTurn = () => {
        // console.log('check last message 2', lastMessage, lastMessage?.type === 'chat', lastMessage?.player === this.remotePlayer);

        if (lastMessage?.type === 'chat' && lastMessage?.player === this.remotePlayer) {
          // 90% chance of showing options
          if (Math.random() < 0.9) {
            this.progressSelfOptions();
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
      };

      if (this.options) {
        this.progressOptionSelect();
      } else {
        if (this.localTurn) {
          _handleLocalTurn();
        } else {
          _handleOtherTurn();
        }
      }
    } else {
      this.close();
    }
  }
  finish() {
    this.finished = true;
    this.dispatchEvent(new MessageEvent('finish'));
  }
  close() {
    this.dispatchEvent(new MessageEvent('close'));
  }
  #setOptions(options) {
    this.options = options;
    
    this.dispatchEvent(new MessageEvent('options', {
      data: {
        options,
      },
    }));
  }
  #setOption(option) {
    this.option = option;

    this.dispatchEvent(new MessageEvent('option', {
      data: {
        option: this.option,
      },
    }));
  }
  #getHoverIndexAbsolute() {
    const selectScrollIncrement = 150;
    return Math.floor(this.deltaY / selectScrollIncrement);
  }
  #setHoverIndex(hoverIndex) {
    this.hoverIndex = hoverIndex;

    this.dispatchEvent(new MessageEvent('hoverindex', {
      data: {
        hoverIndex: this.hoverIndex,
      },
    }));
  }
  handleWheel(e) {
    if (this.options) {
      // console.log('got delta Y', this.options, e.deltaY);

      const oldHoverIndexAbsolute = this.#getHoverIndexAbsolute();
      this.deltaY += e.deltaY;
      const newHoverIndexAbsolute = this.#getHoverIndexAbsolute();

      if (newHoverIndexAbsolute !== oldHoverIndexAbsolute) {
        const newHoverIndex = mod(newHoverIndexAbsolute, this.options.length);
        this.#setHoverIndex(newHoverIndex);
      }

      /* const modDeltaY = mod(this.deltaY, scrollIncrement);
      this.deltaY = modDeltaY; */
      return true;
    } else {
      return false;
    }
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
    const inputFocused = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.nodeName);

    if (!inputFocused) {
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
    }
  });

  window.document.addEventListener('click', async e => {
    if (cameraManager.pointerLockElement) {
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
              const {
                value: comment,
                done,
              } = await aiScene.generateSelectCharacterComment(name, description);

              currentConversation = new Conversation(localPlayer, remotePlayer);
              currentConversation.addEventListener('close', () => {
                currentConversation = null;
              }, {once: true});
              /* currentConversation.addEventListener('options', e => {
                const {options} = e.data;
                console.log('got options', options);
                currentOptions = options;
              });
              currentConversation.addEventListener('message', () => {
                console.log('got message; clearing options');
                currentOptions = null;
              }); */
              story.dispatchEvent(new MessageEvent('conversationstart', {
                data: {
                  conversation: currentConversation,
                },
              }));
              currentConversation.addLocalPlayerMessage(comment);
              done && currentConversation.finish();
            }
          } else {
            const comment = await aiScene.generateSelectTargetComment(name, description);
            _playerSay(localPlayer, comment);
          }
        })();
      } else if (e.button === 0 && currentConversation) {
        if (!currentConversation.progressing) {
          currentConversation.progress();

          sounds.playSoundName('menuNext');
        }
      }
    }
  });
};

const story = new EventTarget();

let currentConversation = null;
story.getConversation = () => currentConversation;

// returns whether the event was handled
story.handleWheel = e => {
  if (currentConversation) {
    return currentConversation.handleWheel(e);
  } else {
    return false;
  }
};

export default story;