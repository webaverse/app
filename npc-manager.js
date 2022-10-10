/*
npc manager tracks instances of all npcs.
npcs includes,
  - characters in party system
  - world npcs
  - detached npcs for character select preview
*/

import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import {LocalPlayer} from './character-controller.js';
import {playersManager} from './players-manager.js';
import * as voices from './voices.js';
import {world} from './world.js';
import {chatManager} from './chat-manager.js';
import {makeId, createRelativeUrl} from './util.js';
import {triggerEmote} from './src/components/general/character/Poses.jsx';
import validEmotionMapping from './validEmotionMapping.json';
import metaversefile from './metaversefile-api.js';
import {runSpeed, walkSpeed} from './constants.js';
import {characterSelectManager} from './characterselect-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();

const updatePhysicsFnMap = new WeakMap();
const updateAvatarsFnMap = new WeakMap();
const cancelFnsMap = new WeakMap();

const followTarget = (player, target, timeDiff) => {
  if (target) {
    const v = localVector
      .setFromMatrixPosition(target.matrixWorld)
      .sub(player.position);
    v.y = 0;
    const distance = v.length();

    const speed = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(distance, 2, 3.5, walkSpeed, runSpeed),
      0,
      runSpeed,
    );
    const velocity = v.normalize().multiplyScalar(speed);
    player.characterPhysics.applyWasd(velocity, timeDiff);

    return distance;
  }
  return 0;
};

class NpcManager extends EventTarget {
  constructor() {
    super();

    this.npcs = [];
    this.detachedNpcs = [];
    this.npcAppMap = new WeakMap();
    this.targetMap = new WeakMap();
  }

  getAppByNpc(npc) {
    return this.npcAppMap.get(npc);
  }

  getNpcByApp(app) {
    return this.npcs.find(npc => this.getAppByNpc(npc) === app);
  }

  getDetachedNpcByApp(app) {
    return this.detachedNpcs.find(npc => this.getAppByNpc(npc) === app);
  }

  async initDefaultPlayer() {
    const spec = await characterSelectManager.getDefaultSpecAsync();
    const player = metaversefile.useLocalPlayer();
    // console.log('set player spec', spec);
    await player.setPlayerSpec(spec);

    const createPlayerApp = () => {
      const app = metaversefile.createApp();
      app.instanceId = makeId(5);
      app.name = 'player';
      app.contentId = spec.avatarUrl;
      return app;
    };
    const app = createPlayerApp();

    await this.#setNpcApp({
      npc: player,
      app,
      json: spec,
    });

    app.addEventListener('destroy', () => {
      this.removeNpcApp(app);
    });

    this.dispatchEvent(
      new MessageEvent('defaultplayeradd', {
        data: {
          player,
        },
      }),
    );
  }

  async addNpcApp(app, srcUrl) {
    const mode = app.getComponent('mode') ?? 'attached';

    // load
    if (mode === 'attached') {
      // load json
      const res = await fetch(srcUrl);
      const json = await res.json();

      // npc pameters
      const name = json.name;
      const avatarUrl = createRelativeUrl(json.avatarUrl, srcUrl);
      const detached = !!json.detached;

      const position = localVector
        .setFromMatrixPosition(app.matrixWorld)
        .add(localVector2.set(0, 1, 0));
      const quaternion = app.quaternion;
      const scale = app.scale;
      const components = [
        {
          key: 'quality',
          value: app.getComponent('quality'),
        },
      ];

      // create npc
      const npc = await this.#createNpcAsync({
        name,
        avatarUrl,
        position,
        quaternion,
        scale,
        detached,
        components,
      });

      await this.#setNpcApp({
        npc,
        app,
        json,
      });
    }
  }

  removeNpcApp(app) {
    const fn = cancelFnsMap.get(app);
    if (fn) {
      cancelFnsMap.delete(app);
      fn();
    }
  }

  updatePhysics(timestamp, timeDiff) {
    const allNpcs = [].concat(this.npcs, this.detachedNpcs);
    for (const npc of allNpcs) {
      const fn = updatePhysicsFnMap.get(this.getAppByNpc(npc));
      if (fn) {
        fn(timestamp, timeDiff);
      }
    }
  }

  updateAvatar(timestamp, timeDiff) {
    const allNpcs = [].concat(this.npcs, this.detachedNpcs);
    for (const npc of allNpcs) {
      const fn = updateAvatarsFnMap.get(this.getAppByNpc(npc));
      if (fn) {
        fn(timestamp, timeDiff);
      }
    }
  }

  setPartyTarget(player, target) {
    this.targetMap.set(player, target);
  }

  #getPartyTarget(player) {
    return this.targetMap.get(player);
  }

  async #createNpcAsync({
    name,
    avatarUrl,
    position,
    quaternion,
    scale,
    detached,
    components,
  }) {
    const player = new LocalPlayer({
      npc: true,
      detached,
    });
    player.name = name;

    let matrixNeedsUpdate = false;
    if (position) {
      player.position.copy(position);
      matrixNeedsUpdate = true;
    }
    if (quaternion) {
      player.quaternion.copy(quaternion);
      matrixNeedsUpdate = true;
    }
    if (scale) {
      player.scale.copy(scale);
      matrixNeedsUpdate = true;
    }
    if (matrixNeedsUpdate) {
      player.updateMatrixWorld();
    }

    await player.loadAvatar(avatarUrl, {
      components,
    });
    player.updateAvatar(0, 0);

    return player;
  }

  async #setNpcApp({npc, app, json}) {
    // cleanFns
    const cancelFns = [
      () => {
        npc.destroy();
      },
    ];
    cancelFnsMap.set(app, () => {
      for (const cancelFn of cancelFns) {
        cancelFn();
      }
    });

    // npcs list
    const detached = !!json.detached;
    if (!detached) {
      this.npcs.push(npc);
      cancelFns.push(() => {
        const removeIndex = this.npcs.indexOf(npc);
        this.npcs.splice(removeIndex, 1);
      });
    } else {
      this.detachedNpcs.push(npc);
      cancelFns.push(() => {
        const removeIndex = this.detachedNpcs.indexOf(npc);
        this.detachedNpcs.splice(removeIndex, 1);
      });
    }

    // npcApp map
    this.npcAppMap.set(npc, app);
    cancelFns.push(() => {
      this.npcAppMap.delete(npc);
    });

    // playeradd/playerremove events
    const player = npc;
    this.dispatchEvent(
      new MessageEvent('playeradd', {
        data: {
          player,
        },
      }),
    );
    cancelFns.push(() => {
      this.dispatchEvent(
        new MessageEvent('playerremove', {
          data: {
            player,
          },
        }),
      );
    });

    // physics object tracking
    app.setPhysicsObject(player.characterPhysics.characterController);
    const avatarupdate = e => {
      app.setPhysicsObject(player.characterPhysics.characterController);
    };
    player.addEventListener('avatarupdate', avatarupdate);
    cancelFns.push(() => {
      player.removeEventListener('avatarupdate', avatarupdate);
    });

    // lore spec
    app.getLoreSpec = () => {
      return {
        name: json.name,
        description: json.bio,
      };
    };

    // events
    let targetSpec = null;
    const _listenEvents = () => {
      const animations = Avatar.getAnimations();
      const hurtAnimation = animations.find(a => a.isHurt);
      const hurtAnimationDuration = hurtAnimation.duration;
      const hittrackeradd = e => {
        app.hitTracker.addEventListener('hit', e => {
          if (!player.hasAction('hurt')) {
            const newAction = {
              type: 'hurt',
              animation: 'pain_back',
            };
            player.addAction(newAction);

            setTimeout(() => {
              player.removeAction('hurt');
            }, hurtAnimationDuration * 1000);
          }
        });
      };
      app.addEventListener('hittrackeradded', hittrackeradd);
      cancelFns.push(() => {
        app.removeEventListener('hittrackeradded', hittrackeradd);
      });

      const activate = () => {
        if (player.getControlMode() === 'npc') {
          this.dispatchEvent(
            new MessageEvent('playerinvited', {
              data: {
                player,
              },
            }),
          );
        } else {
          this.dispatchEvent(
            new MessageEvent('playerexpelled', {
              data: {
                player,
              },
            }),
          );
        }
      };
      app.addEventListener('activate', activate);
      cancelFns.push(() => {
        app.removeEventListener('activate', activate);
      });

      const updatePhysicsFn = (timestamp, timeDiff) => {
        if (player) {
          if (player.getControlMode() !== 'controlled') {
            if (player.getControlMode() === 'party') {
              // if party, follow in a line
              const target = this.#getPartyTarget(player);
              followTarget(player, target, timeDiff);
            } else if (player.getControlMode() === 'npc') {
              if (targetSpec) {
                // if npc, look to targetSpec
                const target = targetSpec.object;
                const distance = followTarget(player, target, timeDiff);

                if (target) {
                  if (targetSpec.type === 'moveto' && distance < 2) {
                    targetSpec = null;
                  }
                }
              }
            }
            const localPlayer = playersManager.getLocalPlayer();
            player.setTarget(localPlayer.position);
          }

          player.updatePhysics(timestamp, timeDiff);
        }
      };
      updatePhysicsFnMap.set(app, updatePhysicsFn);
      cancelFns.push(() => {
        updatePhysicsFnMap.delete(app);
      });

      const updateAvatarFn = (timestamp, timeDiff) => {
        player.updateAvatar(timestamp, timeDiff);
      };
      updateAvatarsFnMap.set(app, updateAvatarFn);
      cancelFns.push(() => {
        updateAvatarsFnMap.delete(app);
      });
    };
    _listenEvents();

    // load
    const npcName = json.name;
    const npcVoiceName = json.voice;
    const npcBio = json.bio;
    let npcWear = json.wear ?? [];
    if (!Array.isArray(npcWear)) {
      npcWear = [npcWear];
    }

    // ai scene
    const _addToAiScene = () => {
      const character = world.loreAIScene.addCharacter({
        name: npcName,
        bio: npcBio,
      });
      cancelFns.push(() => {
        world.loreAIScene.removeCharacter(character);
      });
      character.addEventListener('say', e => {
        const localPlayer = playersManager.getLocalPlayer();

        const {message, emote, action, object, target} = e.data;
        const chatId = makeId(5);

        const m = {
          type: 'chat',
          chatId,
          playerId: localPlayer.playerId,
          playerName: localPlayer.name,
          message,
        };

        chatManager.addPlayerMessage(npcPlayer, m);
        if (emote !== 'none' && validEmotionMapping[emote] !== undefined) {
          triggerEmote(validEmotionMapping[emote], npcPlayer);
        }
        if (
          emote === 'supersaiyan' ||
          action === 'supersaiyan' ||
          /supersaiyan/i.test(object) ||
          /supersaiyan/i.test(target)
        ) {
          const newSssAction = {
            type: 'sss',
          };
          npcPlayer.addAction(newSssAction);
        } else if (
          action === 'follow' ||
          (object === 'none' && target === localPlayer.name)
        ) {
          // follow player
          targetSpec = {
            type: 'follow',
            object: localPlayer,
          };
        } else if (action === 'stop') {
          // stop
          targetSpec = null;
        } else if (
          action === 'moveto' ||
          (object !== 'none' && target === 'none')
        ) {
          // move to object
          console.log('move to object', object);
        } else if (
          action === 'moveto' ||
          (object === 'none' && target !== 'none')
        ) {
          // move to player
          targetSpec = {
            type: 'moveto',
            object: localPlayer,
          };
        } else if (['pickup', 'grab', 'take', 'get'].includes(action)) {
          // pick up object
          console.log('pickup', action, object, target);
        } else if (['use', 'activate'].includes(action)) {
          // use object
          console.log('use', action, object, target);
        }
      });
    };
    _addToAiScene();

    // attach to scene
    const _addPlayerAvatarToApp = () => {
      app.position.set(0, 0, 0);
      app.quaternion.identity();
      app.scale.set(1, 1, 1);

      // app.add(vrmApp);
      app.updateMatrixWorld();
    };
    _addPlayerAvatarToApp();

    // voice endpoint setup
    const _setVoiceEndpoint = () => {
      const voice = voices.voiceEndpoints.find(
        v =>
          v.name.toLowerCase().replaceAll(' ', '') ===
          npcVoiceName.toLowerCase().replaceAll(' ', ''),
      );
      if (voice) {
        player.setVoiceEndpoint(voice.drive_id);
      } else {
        console.error(
          '*** unknown voice name',
          npcVoiceName,
          voices.voiceEndpoints,
        );
      }
    };
    _setVoiceEndpoint();
    // wearables
    const _updateWearables = async () => {
      const wearablePromises = npcWear.map(wear =>
        (async () => {
          const {start_url, components} = wear;
          const app = await player.appManager.addTrackedApp(
            start_url,
            undefined,
            undefined,
            undefined,
            components,
          );
          /* const app = await metaversefile.createAppAsync({
          start_url,
        }); */

          player.wear(app);
        })(),
      );
      await wearablePromises;
    };
    await _updateWearables();
  }
}
const npcManager = new NpcManager();
export default npcManager;
