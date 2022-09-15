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
import {playersManager} from './players-manager.js';
import {alea} from './procgen/procgen.js';

import { triggerEmote } from './src/components/general/character/Poses.jsx';
import validEmotionMapping from "./validEmotionMapping.json";

const localVector2D = new THREE.Vector2();

const upVector = new THREE.Vector3(0, 1, 0);

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
    musicManager.playCurrentMusicName('battle');
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
    this.questChecked = false;
    this.questChecking = false;
    this.givesQuest = false;
    this.progressing = false;
    this.deltaY = 0;

    this.options = null;
    this.option = null;
    this.hoverIndex = null;

    /* this.addEventListener('message', e => {
      if (this.options) {
        const {message} = e.data;
        this.#setOption(message.text);
      }
    }); */
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

    cameraManager.setDynamicTarget(this.localPlayer.avatar.modelBones.Head, this.remotePlayer?.avatar.modelBones.Head);
  }
  addRemotePlayerMessage(text, emote, type = 'chat') {
    const message = {
      type,
      player: this.remotePlayer,
      name: this.remotePlayer.name,
      text,
      emote,
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

    cameraManager.setDynamicTarget(this.remotePlayer.avatar.modelBones.Head, this.localPlayer.avatar.modelBones.Head);

    if (emote !== 'none' && validEmotionMapping[emote]!== undefined) {
      triggerEmote(validEmotionMapping[emote], this.remotePlayer);
    }
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
    if (this.questChecking) {
      return;
    }
    
    console.log('progress chat');

    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const {
        value: comment,
        emote,
        done,
      } = await aiScene.generateChatMessage(this.messages, this.remotePlayer.name);
      
      if (!this.messages.some(m => m.text === comment && m.player === this.remotePlayer)) {
        this.addRemotePlayerMessage(comment, emote);
        done && this.finish();
      } else {
        this.finish();
      }
    });
  }
  progressSelf() {
    if (this.questChecking) {
      return;
    }

    console.log('progress self');

    this.wrapProgress(async () => {
      const aiScene = metaversefile.useLoreAIScene();
      const {
        value: comment,
        done,
      } = await aiScene.generateChatMessage(this.messages, this.localPlayer.name);
      
      if (!this.messages.some(m => m.text === comment && m.player === this.localPlayer)) {
        this.addLocalPlayerMessage(comment);
        done && this.finish();
      } else {
        this.finish();
      }
    });
  }
  progressSelfOptions() {
    if (this.questChecking) {
      return;
    }

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
    if (this.questChecking) {
      return;
    }
    
    if (!option) {
      option = this.options[this.hoverIndex];
      if (!option) {
        throw new Error('failed to select option (not in options state?)');
      }
    }

    // say the option
    this.addLocalPlayerMessage(option.message, 'option');

    if (option.emote !== 'none' && validEmotionMapping[option.emote]!== undefined) {
      triggerEmote(validEmotionMapping[option.emote], this.localPlayer);
    }
    
    // clear options
    this.#setOptions(null);
    this.#setOption(option);

    // 25% chance of self elaboration, 75% chance of other character reply
    this.localTurn = Math.random() < 0.25;
  }
  #getMessageAgo(n) {
    return this.messages[this.messages.length - n] ?? null;
  }
  progress() {
    if (this.questChecking) {
      return;
    }

    if (!this.finished && !this.givesQuest) {
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
          // 70% chance of showing options
          if (Math.random() < 0.7) {
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
    } else if (this.givesQuest) {
      console.log('is quest:', this.givesQuest)
      this.close();
    } else {
      if (!this.questChecking) {
      this.close();
      }
    }
  }
  async finish() {
    if (!this.questChecked) {
      this.questChecking = true;
      const aiScene = metaversefile.useLoreAIScene();
      let conv = ''
      const user1 = this.messages.length >= 1 ? this.messages[0].name : 'Annon';
      const user2 = this.messages.length >= 2 ? this.messages[1].name : 'Ann';
      const _location = aiScene.settings[Math.floor(Math.random() * aiScene.settings.length)];
      const location = _location && _location !== undefined ? _location : 'Tree House'
      for (const msg of this.messages) {
        if ((msg.type !== 'chat' && msg.type !== 'option') || msg.text?.length <= 0) {
          continue;
        }

        conv += msg.name?.trim() + ': ' + msg.text?.trim() + '\n';
        this.questChecking = false;
      }
      this.givesQuest = (await aiScene.checkIfQuestIsApplicable(location, conv, user1, user2) === 'yes');
      console.log('isQuest:', this.givesQuest)

      this.questChecking = false;
      this.questChecked = true;
      if (this.givesQuest) {
        this.progress();
        return
      }
    }

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
      const oldHoverIndexAbsolute = this.#getHoverIndexAbsolute();
      this.deltaY += e.deltaY;
      const newHoverIndexAbsolute = this.#getHoverIndexAbsolute();

      if (newHoverIndexAbsolute !== oldHoverIndexAbsolute) {
        const newHoverIndex = mod(newHoverIndexAbsolute, this.options.length);
        this.#setHoverIndex(newHoverIndex);
      }

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

let currentFieldMusic = null;
let currentFieldMusicIndex = 0;
export const handleStoryKeyControls = async (e) => {

  switch (e.which) {
    case 48: { // 0
      await musicManager.waitForLoad();
      _stopSwirl() || _startSwirl();
      return false;
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
      return false;
    }
    case 189: { // -
      await musicManager.waitForLoad();
      _stopSwirl();
      musicManager.playCurrentMusic('victory', {
        repeat: true,
      });
      return false;
    }
    case 187: { // =
      await musicManager.waitForLoad();

      _stopSwirl();
      musicManager.playCurrentMusic('gameOver', {
        repeat: true,
      });
      return false;
    }
  }

  return true;

};

const story = new EventTarget();

let currentConversation = null;
story.getConversation = () => currentConversation;

// returns whether the event was handled (used for options scrolling)
story.handleWheel = e => {
  if (currentConversation) {
    return currentConversation.handleWheel(e);
  } else {
    return false;
  }
};

const _startConversation = (comment, remotePlayer, done) => {
  const localPlayer = playersManager.getLocalPlayer();
  currentConversation = new Conversation(localPlayer, remotePlayer);
  currentConversation.addEventListener('close', () => {
    currentConversation = null;

    cameraManager.setDynamicTarget(null);
  }, {once: true});
  story.dispatchEvent(new MessageEvent('conversationstart', {
    data: {
      conversation: currentConversation,
    },
  }));
  currentConversation.addLocalPlayerMessage(comment);
  done && currentConversation.finish();
  return currentConversation;
};
story.startLocalPlayerComment = comment => {
  return _startConversation(comment, null, true);
};

story.listenHack = () => {
  window.document.addEventListener('click', async e => {
    if (cameraManager.pointerLockElement) {
      if (e.button === 0 && (cameraManager.focus && zTargeting.focusTargetReticle)) {
        const app = metaversefile.getAppByPhysicsId(zTargeting.focusTargetReticle.physicsId);
        
        if (app) {
          const {appType} = app;

          // cameraManager.setFocus(false);
          // zTargeting.focusTargetReticle = null;
          sounds.playSoundName('menuSelect');

          cameraManager.setFocus(false);
          cameraManager.setDynamicTarget();

          (async () => {
            const aiScene = metaversefile.useLoreAIScene();
            if (appType === 'npc') {
              const {name, description} = app.getLoreSpec();
              const remotePlayer = npcManager.npcs.find(npc => npc.npcApp === app);

              if (remotePlayer) {
                const {
                  value: comment,
                  done,
                } = await aiScene.generateSelectCharacterComment(name, description);

                console.log('starting conversation')
                _startConversation(comment, remotePlayer, done);
              } else {
                console.warn('no player associated with app', app);
              }
            } else {
              const {name, description} = app;
              const comment = await aiScene.generateSelectTargetComment(name, description);
              const fakePlayer = {
                avatar: {
                  modelBones: {
                    Head: app,
                  },
                },
              };
              _startConversation(comment, fakePlayer, true);
            }
          })();
        } else {
          console.warn('could not find app for physics id', zTargeting.focusTargetReticle.physicsId);
        }
      } else if (e.button === 0 && currentConversation) {
        if (!currentConversation.progressing) {
          currentConversation.progress();

          sounds.playSoundName('menuNext');
        }
      }
    }
  });
};
story.startCinematicIntro = () => {
  const rng = alea('lol' + Math.random());
  const r = n => {
    return -n + rng() * n * 2;
  }
  const rp = n => {
    return rng() * n;
  }
  const r3 = (n, target) => {
    return target.set(r(n), r(n), r(n));
  };

  const range = 30;
  const localPlayer = playersManager.getLocalPlayer();
  const center = localPlayer.position.clone()
    .add(
      new THREE.Vector3(0, range/4, 0)
        .applyQuaternion(localPlayer.quaternion)
    );
  const centerToPlayerDirection = localPlayer.position.clone()
    .sub(center)
    .normalize();
  
  const startPosition = new THREE.Vector3((rng() < 0.5 ? 1 : -1) * range, range/2, -range)
    .applyQuaternion(localPlayer.quaternion)
    .add(r3(5, new THREE.Vector3()));
  const baseQuaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().lookAt(
      startPosition,
      center,
      upVector
    )
  );
  const startQuaternion = baseQuaternion.clone().multiply(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-rp(Math.PI * 0.2), r(Math.PI * 0.2), r(Math.PI * 0.01), 'YXZ')
    )
  );
  const endPosition = center.clone()
    .add(
      centerToPlayerDirection.clone()
        .multiply(new THREE.Vector3(r(3), r(3), rp(3)))
    );
  const endEuler = new THREE.Euler().setFromQuaternion(baseQuaternion, 'YXZ');
  endEuler.x = 0;
  endEuler.z = 0;
  const endQuaternion = new THREE.Quaternion().setFromEuler(endEuler)
    .multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(-rp(Math.PI * 0.2), r(Math.PI * 0.2), 0, 'YXZ')
      )
    );

  const sp2x = r(1);
  const startPosition2 = localPlayer.position.clone()
    .add(new THREE.Vector3(sp2x, r(1) - 0.5, 1).applyQuaternion(localPlayer.quaternion));
  const startQuaternion2 = localPlayer.quaternion.clone();
  const endPosition2 = startPosition2.clone()
    .add(
      new THREE.Vector3((sp2x < 0 ? 1 : -1) * (1 + rp(2)), 0, 0)
        .applyQuaternion(localPlayer.quaternion)
    );
  const endQuaternion2 = startQuaternion2.clone();

  const cinematicScript = [
    {
      type: 'set',
      position: startPosition,
      quaternion: startQuaternion,
      duration: 1000,
    },
    {
      type: 'move',
      position: endPosition,
      quaternion: endQuaternion,
      duration: 5000,
    },
    {
      type: 'set',
      position: endPosition,
      quaternion: endQuaternion,
      duration: 500,
    },
    {
      type: 'set',
      position: startPosition2,
      quaternion: startQuaternion2,
      duration: 1000,
    },
    {
      type: 'move',
      position: endPosition2,
      quaternion: endQuaternion2,
      duration: 3000,
    },
  ];
  cameraManager.startCinematicScript(cinematicScript);

  // console.log('start cinematic intro');
};

export default story;