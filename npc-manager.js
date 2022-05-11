import * as THREE from 'three';
import Avatar from './avatars/avatars.js';
import physicsManager from './physics-manager.js';
import {NpcPlayer} from './character-controller.js';
import {localPlayer} from './players.js';
import * as voices from './voices.js';
import {world} from './world.js';
import {chatManager} from './chat-manager.js';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();

const cancelFnMap = new WeakMap();

class NpcManager extends EventTarget {
  constructor() {
    super();

    this.npcs = [];
  }

  createNpc({
    name,
    npcApp,
    avatarApp,
    position,
    quaternion,
    scale,
    detached,
  }) {
    const npcPlayer = new NpcPlayer();
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

    npcPlayer.npcApp = npcApp;

    npcPlayer.setAvatarApp(avatarApp);
    // npcPlayer.importAvatarApp(avatarApp);

    if (!detached) {
      this.npcs.push(npcPlayer);
      /* this.dispatchEvent(new MessageEvent('npcadd', {
        data: {
          player: npcPlayer,
        },
      })); */
    }

    return npcPlayer;
  }

  destroyNpc(npcPlayer) {
    npcPlayer.destroy();

    const removeIndex = this.npcs.indexOf(npcPlayer);
    if (removeIndex !== -1) {
      this.npcs.splice(removeIndex, 1);
      /* this.dispatchEvent(new MessageEvent('npcremove', {
        data: {
          player: npcPlayer,
        },
      })); */
    }
  }

  addNpcApp(app, srcUrl) {
    let live = true;
    let json = null;
    let npcPlayer = null;
    let character = null;
    const cancelFns = [
      () => {
        live = false;

        if (npcPlayer) {
          npcManager.destroyNpc(npcPlayer);
          // npcPlayer = null;
        }
        if (character) {
          world.loreAIScene.removeCharacter(character);
          // character = null;
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
          // console.log('activate npc');
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

        cancelFns.push(() => {
          app.removeEventListener('hittrackeradded', hittrackeradd);
          app.removeEventListener('activate', activate);
        });
      };
      _listenEvents();
    }

    (async () => {
      if (mode === 'attached') {
        const res = await fetch(srcUrl);
        if (!live) return;
        json = await res.json();
        if (!live) return;

        const vrmApp = await metaversefile.createAppAsync({
          start_url: json.avatarUrl,
          position: app.position,
          quaternion: app.quaternion,
          scale: app.scale,
        });

        {
          app.position.set(0, 0, 0);
          app.quaternion.identity();
          app.scale.set(1, 1, 1);

          app.add(vrmApp);
          app.updateMatrixWorld();
        }

        const npcName = json.name ?? 'Anon';
        const npcVoiceName = json.voice ?? 'Shining armor';
        const npcBio = json.bio ?? 'A generic avatar.';
        const npcDetached = !!json.detached;
        let npcWear = json.wear ?? [];
        if (!Array.isArray(npcWear)) {
          npcWear = [npcWear];
        }

        (async () => {
          const position = vrmApp.position.clone()
            .add(new THREE.Vector3(0, 1, 0));
          const {quaternion, scale} = vrmApp;
          const newNpcPlayer = npcManager.createNpc({
            name: npcName,
            npcApp: app,
            avatarApp: vrmApp,
            position,
            quaternion,
            scale,
            detached: npcDetached,
          });

          const _setVoiceEndpoint = () => {
            const voice = voices.voiceEndpoints.find(v => v.name === npcVoiceName);
            if (voice) {
              newNpcPlayer.setVoiceEndpoint(voice.drive_id);
            } else {
              console.warn('unknown voice name', npcVoiceName, voices.voiceEndpoints);
            }
          };
          _setVoiceEndpoint();

          const _updateWearables = async () => {
            const wearablePromises = npcWear.map(wear => (async () => {
              const {start_url} = wear;
              const app = await metaversefile.createAppAsync({
                start_url,
              });
              // if (!live) return;

              newNpcPlayer.wear(app);
            })());
            await wearablePromises;
          };
          await _updateWearables();
          if (!live) return;
          
          npcPlayer = newNpcPlayer;
        })()

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

        const slowdownFactor = 0.4;
        const walkSpeed = 0.075 * slowdownFactor;
        const runSpeed = walkSpeed * 8;
        const speedDistanceRate = 0.07;
        world.appManager.addEventListener('frame', e => {
          const {timestamp, timeDiff} = e.data;
          if (npcPlayer && physicsManager.getPhysicsEnabled()) {
            // console.log('update npc player', npcPlayer.position.toArray().join(','));
            if (targetSpec) {
              const target = targetSpec.object;
              const v = localVector.setFromMatrixPosition(target.matrixWorld)
                .sub(npcPlayer.position);
              v.y = 0;
              const distance = v.length();
              if (targetSpec.type === 'moveto' && distance < 2) {
                targetSpec = null;
              } else {
                const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
                v.normalize()
                  .multiplyScalar(speed * timeDiff);
                npcPlayer.characterPhysics.applyWasd(v);
              }
            }

            npcPlayer.eyeballTarget.copy(localPlayer.position);
            npcPlayer.eyeballTargetEnabled = true;

            if (isNaN(npcPlayer.position.x)) {
              debugger;
            }
            npcPlayer.updatePhysics(timestamp, timeDiff);
            if (isNaN(npcPlayer.position.x)) {
              debugger;
            }
            npcPlayer.updateAvatar(timestamp, timeDiff);
            if (isNaN(npcPlayer.position.x)) {
              debugger;
            }
          }
        });
      }
    })();
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
