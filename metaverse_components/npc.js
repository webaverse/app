import * as THREE from 'three';
import metaversefile from 'metaversefile';

const localVector = new THREE.Vector3();

export default (app, component) => {
try {
  const {useFrame, useActivate, useLocalPlayer, useVoices, useChatManager, useLoreAIScene, useAvatarAnimations, useNpcManager, usePhysics, useCleanup} = metaversefile;
  const npcManager = useNpcManager();
  const localPlayer = useLocalPlayer();
  const physics = usePhysics();
  const chatManager = useChatManager();
  const loreAIScene = useLoreAIScene();
  const voices = useVoices();
  const animations = useAvatarAnimations();
  const hurtAnimation = animations.find(a => a.isHurt);
  const hurtAnimationDuration = hurtAnimation.duration;

  const mode = app.getComponent('mode') ?? 'attached';

  if (mode === 'attached') {
    const npcName = component.name ?? 'Anon';
    const npcVoiceName = component.voice ?? 'Shining armor';
    const npcBio = component.bio ?? 'A generic avatar.';
    const npcDetached = !!component.detached;
    let npcWear = component.wear ?? [];
    if (!Array.isArray(npcWear)) {
      npcWear = [npcWear];
    }

    let live = true;
    let vrmApp = app;
    app.npcPlayer = null;
    (async () => {
      const position = vrmApp.position.clone()
        .add(new THREE.Vector3(0, 1, 0));
      const {quaternion, scale} = vrmApp;
      const newNpcPlayer = npcManager.createNpc({
        name: npcName,
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
      
      app.npcPlayer = newNpcPlayer;
    })()

    app.getPhysicsObjects = () => app.npcPlayer ? [app.npcPlayer.characterController] : [];

    app.addEventListener('hittrackeradded', e => {
      app.hitTracker.addEventListener('hit', e => {
        if (!app.npcPlayer.hasAction('hurt')) {
          const newAction = {
            type: 'hurt',
            animation: 'pain_back',
          };
          app.npcPlayer.addAction(newAction);
          
          setTimeout(() => {
            app.npcPlayer.removeAction('hurt');
          }, hurtAnimationDuration * 1000);
        }
      });
    });

    let targetSpec = null;
    useActivate(() => {
      // console.log('activate npc');
      if (targetSpec?.object !== localPlayer) {
        targetSpec = {
          type: 'follow',
          object: localPlayer,
        };
      } else {
        targetSpec = null;
      }
    });

    const character = loreAIScene.addCharacter({
      name: npcName,
      bio: npcBio,
    });
    character.addEventListener('say', e => {
      console.log('got character say', e.data);
      const {message, emote, action, object, target} = e.data;
      chatManager.addPlayerMessage(app.npcPlayer, message);
      if (emote === 'supersaiyan' || action === 'supersaiyan' || /supersaiyan/i.test(object) || /supersaiyan/i.test(target)) {
        const newSssAction = {
          type: 'sss',
        };
        app.npcPlayer.addAction(newSssAction);  
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
    useFrame(({timestamp, timeDiff}) => {
      if (app.npcPlayer && physics.getPhysicsEnabled()) {
        if (targetSpec) {
          const target = targetSpec.object;
          const v = localVector.setFromMatrixPosition(target.matrixWorld)
            .sub(app.npcPlayer.position);
          v.y = 0;
          const distance = v.length();
          if (targetSpec.type === 'moveto' && distance < 2) {
            targetSpec = null;
          } else {
            const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
            v.normalize()
              .multiplyScalar(speed * timeDiff);
              app.npcPlayer.characterPhysics.applyWasd(v);
          }
        }

        app.npcPlayer.setTarget(localPlayer.position);

        app.npcPlayer.updatePhysics(timestamp, timeDiff);
        app.npcPlayer.updateAvatar(timestamp, timeDiff);
      }
    });

    useCleanup(() => {
      live = false;

      if (app.npcPlayer) {
        npcManager.destroyNpc(app.npcPlayer);
      }

      loreAIScene.removeCharacter(character);
    });
  }

  return app;
} catch(err) {
  console.warn(err);
}
};
