import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import physicsManager from './physics-manager.js';
import {LocalPlayer} from './character-controller.js';
import {getLocalPlayer} from './players.js';
import * as voices from './voices.js';
import {world} from './world.js';
import {chatManager} from './chat-manager.js';
import {createRelativeUrl} from './util.js';
import { NpcLoadoutManager } from './loadout-manager.js';

const localVector = new THREE.Vector3();

const cancelFnMap = new WeakMap();

class NpcManager extends EventTarget {
  constructor() {
    super();

    this.npcs = [];
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
      // detached,
    });
    npcPlayer.name = name;

    npcPlayer.addEventListener('wearupdate', e => {
      console.log(e);
    });

    if (!window.npcPlayers) {
      window.npcPlayers = [];
      window.npcPlayer = npcPlayer;
    }
    window.npcPlayers.push(npcPlayer);

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

    npcPlayer.npcApp = npcApp; // for lore AI
    if (npcApp) {
      npcApp.npcPlayer = npcPlayer; // for character select
    }

    npcPlayer.loadoutmanager = new NpcLoadoutManager(npcPlayer);

    await npcPlayer.setAvatarUrl(avatarUrl);

    if (!detached) {
      this.npcs.push(npcPlayer);
    }

    return npcPlayer;
  }

  destroyNpc(npcPlayer) {
    npcPlayer.destroy();

    const removeIndex = this.npcs.indexOf(npcPlayer);
    if (removeIndex !== -1) {
      this.npcs.splice(removeIndex, 1);
    }
  }

  async addNpcApp(app, srcUrl) {
    const localPlayer = getLocalPlayer();

    let live = true;
    let json = null;
    let npcPlayer = null;
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

    app.getPhysicsObjects = () => npcPlayer ? [npcPlayer.characterController] : [];
    app.getLoreSpec = () => {
      const name = json.name ?? 'Anon';
      const description = json.bio ?? '';
      return {
        name,
        description,
      }
    };

    // events
    let targetSpec = null;
    if (mode === 'attached') {
      // debugger
      const _listenEvents = () => {
        /* const hittrackeradd = e => {
          debugger
          app.hitTracker.addEventListener('hit', e => {
            debugger
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
        app.addEventListener('hittrackeradded', hittrackeradd); */

        app.addEventListener('hit', e => {
          if (!npcPlayer.hasAction('hurt')) {
            const newAction = {
              type: 'hurt',
              animation: 'pain_back',
            };
            // console.log('add hurtAction', 'npc-manager.js')
            npcPlayer.addAction(newAction);
            // console.log('remove use', 'npc-manager.js')
            npcPlayer.removeAction('use'); // todo: setControlAction() ?

            setTimeout(() => {
              // npcPlayer.removeAction('hurt');
            // }, hurtAnimationDuration * 1000);
            }, 0);
          }
        })

        const activate = () => {
          console.log(npcPlayer);
          if (targetSpec?.object !== localPlayer) {
            targetSpec = {
              type: 'follow',
              object: localPlayer,
            };
          } else {
            targetSpec = null;
          }
        };
        app.addEventListener('activate', activate);

        const animationCombo = ['swordSideSlash', 'swordSideSlashStep', 'swordTopDownSlash', 'swordTopDownSlashStep'];
        let lastSwordActionTime = 0;
        let swordActionIndex = 0;


        const addSwordAction = (timestamp) => {
          const swordApp = npcPlayer.loadoutmanager.getSelectedApp();
          npcPlayer.addAction({
            animationCombo,
            behavior: 'sword',
            boneAttachment: 'leftHand',
            index: swordActionIndex,
            instanceId: swordApp.instanceId,
            position: [-0.07, -0.03, 0],
            quaternion: [0.7071067811865475, 0, 0, 0.7071067811865476],
            scale: [1, 1, 1],
            type: 'use',
          });
          lastSwordActionTime = timestamp;
          if(++swordActionIndex > animationCombo.length - 1) swordActionIndex = 0;
        };

        const slowdownFactor = 0.4;
        const walkSpeed = 0.075 * slowdownFactor;
        const runSpeed = walkSpeed * 8;
        const speedDistanceRate = 0.07;
        
        const frame = e => {
          if (npcPlayer && physicsManager.getPhysicsEnabled()) {
            const {timestamp, timeDiff} = e.data;

            if (targetSpec) {
              const target = targetSpec.object;
              const v = localVector.setFromMatrixPosition(target.matrixWorld)
                .sub(npcPlayer.position);
              v.y = 0;
              const distance = v.length();
              // console.log(distance);
              if (targetSpec.type === 'moveto' && distance < 2) {
                targetSpec = null;
              } else {
                if (!npcPlayer.hasAction('hurt')) {
                  
                  if(distance <= 1.5) {
                    if(timestamp > lastSwordActionTime + 850) {
                      addSwordAction(timestamp);
                    }
                  } else if(!npcPlayer.hasAction('use')) {
                    const speed = Math.min(Math.max(walkSpeed + ((distance - 0.5) * speedDistanceRate), 0), runSpeed);
                    v.normalize()
                      .multiplyScalar(speed * timeDiff);
                    npcPlayer.characterPhysics.applyWasd(v);
                  }


                  
                    
                  
                    
                  
                  
                }

                

                
              }
            }

            npcPlayer.eyeballTarget.copy(localPlayer.position);
            npcPlayer.eyeballTargetEnabled = true;

            /* if (isNaN(npcPlayer.position.x)) {
              debugger;
            } */
            npcPlayer.updatePhysics(timestamp, timeDiff);
            /* if (isNaN(npcPlayer.position.x)) {
              debugger;
            } */
            npcPlayer.updateAvatar(timestamp, timeDiff);
            /* if (isNaN(npcPlayer.position.x)) {
              debugger;
            } */
          }
        };
        world.appManager.addEventListener('frame', frame);

        cancelFns.push(() => {
          app.removeEventListener('hittrackeradded', hittrackeradd);
          app.removeEventListener('activate', activate);
          world.appManager.removeEventListener('frame', frame);
        });
      };
      _listenEvents();
    }

    // load
    if (mode === 'attached') {
      // load json
      const res = await fetch(srcUrl);
      if (!live) return;
      json = await res.json();
      if (!live) return;

      // npc pameters
      let avatarUrl = json.avatarUrl;
      avatarUrl = createRelativeUrl(avatarUrl, srcUrl);
      const npcName = json.name ?? 'Anon';
      const npcVoiceName = json.voice ?? 'Shining armor';
      const npcBio = json.bio ?? 'A generic avatar.';
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
          console.log('got character say', e.data);
          const {message, emote, action, object, target} = e.data;
          chatManager.addPlayerMessage(npcPlayer, message);
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
        const voice = voices.voiceEndpoints.find(v => v.name === npcVoiceName);
        if (voice) {
          newNpcPlayer.setVoiceEndpoint(voice.drive_id);
        } else {
          console.warn('unknown voice name', npcVoiceName, voices.voiceEndpoints);
        }
      };
      _setVoiceEndpoint();

      // wearables
      const _updateWearables = async () => {
        const wearablePromises = npcWear.map(wear => (async () => {
          const {start_url} = wear;
          const app = await newNpcPlayer.appManager.addTrackedApp(start_url);
          /* const app = await metaversefile.createAppAsync({
            start_url,
          }); */
          // if (!live) return;

          newNpcPlayer.wear(app);
        })());
        await wearablePromises;
      };
      await _updateWearables();
      if (!live) return;
      
      // latch
      npcPlayer = newNpcPlayer;
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
