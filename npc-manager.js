/*
npc manager provides features for instances of all npcs.
npcs includes,
  - character npcs in party system
  - world npcs
  - detached npcs for player select view

features includes,
  - create npc app
  - destroy npc app
  - query all npcs
*/

import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import {LocalPlayer} from './character-controller.js';
import {playersManager} from './players-manager.js';
import {partyManager} from './party-manager.js';
import * as voices from './voices.js';
import {world} from './world.js';
import {chatManager} from './chat-manager.js';
import {makeId, createRelativeUrl} from './util.js';
import { triggerEmote } from './src/components/general/character/Poses.jsx';
import validEmotionMapping from "./validEmotionMapping.json";
import metaversefile from './metaversefile-api.js';
import {runSpeed, walkSpeed} from './constants.js';
import {charactersManager} from './avatars/characters-manager.js';

const localVector = new THREE.Vector3();

const updatePhysicsFnMap = new WeakMap();
const updateAvatarsFnMap = new WeakMap();
const cancelFnMap = new WeakMap();

class NpcManager extends EventTarget {
  constructor() {
    super();

    this.npcs = [];
  }

  async initDefaultPlayer() {
    const defaultPlayerSpec = charactersManager.defaultCharacterSpec;
    const localPlayer = metaversefile.useLocalPlayer();
    // console.log('set player spec', defaultPlayerSpec);
    await localPlayer.setPlayerSpec(defaultPlayerSpec);

    const createPlayerNpc = () => {
      const app = metaversefile.createApp();
      app.instanceId = makeId(5);
      app.name = 'player';
      app.contentId = defaultPlayerSpec.avatarUrl;
      return app;
    };
    const playerApp = createPlayerNpc();

    const importPlayerToNpcManager = () => {
      this.addPlayerApp(playerApp, localPlayer, defaultPlayerSpec);

      world.appManager.importApp(playerApp);
      world.appManager.transplantApp(playerApp, partyManager.appManager);

      playerApp.addEventListener('destroy', () => {
        this.removeNpcApp(playerApp);
      });
    };
    importPlayerToNpcManager();
  }

  async createNpcAsync({
    name,
    npcApp,
    // avatarApp,
    avatarUrl,
    position,
    quaternion,
    scale,
    detached,
  }) {
    const npcPlayer = new LocalPlayer({
      npc: true,
      detached,
    });
    npcPlayer.name = name;

    let matrixNeedsUpdate = false;
    if (position) {
      npcPlayer.position.copy(position);
      matrixNeedsUpdate = true;
    }
    if (quaternion) {
      npcPlayer.quaternion.copy(quaternion);
      matrixNeedsUpdate = true;
    }
    if (scale) {
      npcPlayer.scale.copy(scale);
      matrixNeedsUpdate = true;
    }
    if (matrixNeedsUpdate) {
      npcPlayer.updateMatrixWorld();
    }

    await npcPlayer.setAvatarUrl(avatarUrl);
    npcPlayer.updateAvatar(0, 0);

    return npcPlayer;
  }

  destroyNpc(npcPlayer) {
    npcPlayer.destroy();

    const removeIndex = this.npcs.indexOf(npcPlayer);
    if (removeIndex !== -1) {
      this.npcs.splice(removeIndex, 1);
    }
  }

  updatePhysics(timestamp, timeDiff) {
    for (const npc of this.npcs) {
      const updatePhysicsFn = updatePhysicsFnMap.get(npc.npcApp);
      if (updatePhysicsFn) {
        updatePhysicsFn(timestamp, timeDiff);
      }
    }
  }

  updateAvatar(timestamp, timeDiff) {
    for (const npc of this.npcs) {
      const updateAvatarsFn = updateAvatarsFnMap.get(npc.npcApp);
      if (updateAvatarsFn) {
        updateAvatarsFn(timestamp, timeDiff);
      }
    }
  }

  async addPlayerApp(app, npcPlayer, json) {
    npcPlayer.npcApp = app; // for lore AI, and party system
    if (app) {
      app.npcPlayer = npcPlayer; // for character select
    }

    let live = true;
    let character = null;
    const cancelFns = [
      () => {
        live = false;

        if (npcPlayer) {
          npcManager.destroyNpc(npcPlayer);
        }
        if (character) {
          world.loreAIScene.removeCharacter(character);
        }
      },
    ];
    cancelFnMap.set(app, () => {
      for (const cancelFn of cancelFns) {
        cancelFn();
      }
    });

    const mode = app.getComponent('mode') ?? 'attached';
    
    const animations = Avatar.getAnimations();
    const hurtAnimation = animations.find(a => a.isHurt);
    const hurtAnimationDuration = hurtAnimation.duration;

    app.setPhysicsObject(npcPlayer.characterPhysics.characterController);
    app.getLoreSpec = () => {
      return {
        name: json.name,
        description: json.bio,
      }
    };

    // events
    let targetSpec = null;
    if (mode === 'attached') {
      const _listenEvents = () => {
        const hittrackeradd = e => {
          app.hitTracker.addEventListener('hit', e => {
            if (!npcPlayer.hasAction('hurt')) {
              const newAction = {
                type: 'hurt',
                animation: 'pain_back',
              };
              npcPlayer.addAction(newAction);
              
              setTimeout(() => {
                npcPlayer.removeAction('hurt');
              }, hurtAnimationDuration * 1000);
            }
          });
        };
        app.addEventListener('hittrackeradded', hittrackeradd);

        const activate = () => {
          if (!npcPlayer.isInParty) {
            partyManager.addPlayer(npcPlayer);
          } else {
            npcPlayer.dispatchEvent({
              type: 'activate'
            });
          }
        };
        app.addEventListener('activate', activate);

        const updatePhysicsFn = (timestamp, timeDiff) => {
          const localPlayer = playersManager.getLocalPlayer();
          if (npcPlayer) {

            if (!npcPlayer.isLocalPlayer) {
              let target = null;
              if (npcPlayer.isInParty) { // if party, follow in a line
                target = partyManager.getTargetPlayer(npcPlayer);
              } else {
                if (targetSpec) { // if npc, look to targetSpec
                  target = targetSpec.object;
                }
              }

              npcPlayer.setTarget(localPlayer.position);
              if (target) {
                const v = localVector.setFromMatrixPosition(target.matrixWorld)
                  .sub(npcPlayer.position);
                v.y = 0;
                const distance = v.length();
                if (npcPlayer.isInParty) { // follow
                  const speed = THREE.MathUtils.clamp(
                    THREE.MathUtils.mapLinear(
                      distance,
                      2, 3.5,
                      walkSpeed, runSpeed,
                    ),
                    0, runSpeed,
                  );
                  const velocity = v.normalize().multiplyScalar(speed);
                  npcPlayer.characterPhysics.applyWasd(velocity, timeDiff);

                  npcPlayer.setTarget(target.position);
                } else {
                  if (targetSpec.type === 'moveto' && distance < 2) {
                    targetSpec = null;
                  }
                }
              }
            }

            /* if (isNaN(npcPlayer.position.x)) {
              debugger;
            } */
            npcPlayer.updatePhysics(timestamp, timeDiff);
            /* if (isNaN(npcPlayer.position.x)) {
              debugger;
            } */
          }
        };
        const updateAvatarFn = (timestamp, timeDiff) => {
          npcPlayer.updateAvatar(timestamp, timeDiff);
          /* if (isNaN(npcPlayer.position.x)) {
            debugger;
          } */
        };

        updatePhysicsFnMap.set(app, updatePhysicsFn);
        updateAvatarsFnMap.set(app, updateAvatarFn);

        cancelFns.push(() => {
          app.removeEventListener('hittrackeradded', hittrackeradd);
          app.removeEventListener('activate', activate);
          updatePhysicsFnMap.delete(app);
          updateAvatarsFnMap.delete(app);
        });
      };
      _listenEvents();
    }

    // load
    if (mode === 'attached') {
      const npcName = json.name;
      const npcVoiceName = json.voice;
      const npcBio = json.bio;
      const npcDetached = !!json.detached;
      let npcWear = json.wear ?? [];
      if (!Array.isArray(npcWear)) {
        npcWear = [npcWear];
      }

      // ai scene
      const _addToAiScene = () => {
        character = world.loreAIScene.addCharacter({
          name: npcName,
          bio: npcBio,
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
          if (emote !== 'none' && validEmotionMapping[emote]!== undefined) {
            triggerEmote(validEmotionMapping[emote], npcPlayer);
          }
          if (emote === 'supersaiyan' || action === 'supersaiyan' || /supersaiyan/i.test(object) || /supersaiyan/i.test(target)) {
            const newSssAction = {
              type: 'sss',
            };
            npcPlayer.addAction(newSssAction);  
          } else if (action === 'follow' || (object === 'none' && target === localPlayer.name)) { // follow player
            targetSpec = {
              type: 'follow',
              object: localPlayer,
            };
          } else if (action === 'stop') { // stop
            targetSpec = null;
          } else if (action === 'moveto' || (object !== 'none' && target === 'none')) { // move to object
            console.log('move to object', object);
          } else if (action === 'moveto' || (object === 'none' && target !== 'none')) { // move to player
            targetSpec = {
              type: 'moveto',
              object: localPlayer,
            };
          } else if (['pickup', 'grab', 'take', 'get'].includes(action)) { // pick up object
            console.log('pickup', action, object, target);
          } else if (['use', 'activate'].includes(action)) { // use object
            console.log('use', action, object, target);
          }
        });
      };
      _addToAiScene();

      const newNpcPlayer = npcPlayer;

      if (!npcDetached) {
        this.npcs.push(npcPlayer);
      }

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
        const voice = voices.voiceEndpoints.find(v => v.name.toLowerCase().replaceAll(' ', '') === npcVoiceName.toLowerCase().replaceAll(' ', ''));
        if (voice) {
          newNpcPlayer.setVoiceEndpoint(voice.drive_id);
        } else {
          console.error('*** unknown voice name', npcVoiceName, voices.voiceEndpoints);
        }
      };
      _setVoiceEndpoint();
      // wearables
      const _updateWearables = async () => {
        const wearablePromises = npcWear.map(wear => (async () => {
          const {start_url, components} = wear;
          const app = await newNpcPlayer.appManager.addTrackedApp(
            start_url,
            undefined,
            undefined,
            undefined,
            components,
          );
          /* const app = await metaversefile.createAppAsync({
            start_url,
          }); */
          // if (!live) return;

          newNpcPlayer.wear(app);
        })());
        await wearablePromises;
      };
      await _updateWearables();
    }
  }

  async addNpcApp(app, srcUrl) {
    let json = null;

    const mode = app.getComponent('mode') ?? 'attached';

    // load
    if (mode === 'attached') {
      // load json
      const res = await fetch(srcUrl);
      json = await res.json();
      //if (!live) return;

      const npcName = json.name;

      // npc pameters
      let avatarUrl = json.avatarUrl;
      avatarUrl = createRelativeUrl(avatarUrl, srcUrl);

      const npcDetached = !!json.detached;
      
      // create npc
      const newNpcPlayer = await npcManager.createNpcAsync({
        name: npcName,
        npcApp: app,
        // avatarApp: vrmApp,
        avatarUrl,
        position: app.position.clone()
          .add(new THREE.Vector3(0, 1, 0)),
        quaternion: app.quaternion,
        scale: app.scale,
        detached: npcDetached,
      });

      this.addPlayerApp(app, newNpcPlayer, json);
    }
  }
  removeNpcApp(app) {
    const cancelFn = cancelFnMap.get(app);
    if (cancelFn) {
      cancelFnMap.delete(app);
      cancelFn();
    }
  }
}
const npcManager = new NpcManager();
export default npcManager;
