import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useInternals, useAvatarSpriter} = metaversefile;

export default () => {
  const app = useApp();
  const localPlayer = useLocalPlayer();
  const {scene, camera} = useInternals();
  const {createSpriteMegaMesh} = useAvatarSpriter();
  
  let spriteMegaAvatarMesh = null;
  (async () => {
    const vrmUrl = `https://webaverse.github.io/app/public/avatars/Scillia_Drophunter_V19.vrm`;
    const m = await metaversefile.import(vrmUrl);
    const app2 = metaversefile.createApp();
    await app2.addModule(m);
    
    await app2.setSkinning(true);
    
    scene.add(app2);

    spriteMegaAvatarMesh = createSpriteMegaMesh(app2.skinnedVrm);
    // spriteMegaAvatarMesh.updateMatrixWorld();
    scene.add(spriteMegaAvatarMesh);
    localPlayer.avatar.model.visible = false;
  })();

  useFrame(({timestamp, timeDiff}) => {
    spriteMegaAvatarMesh && spriteMegaAvatarMesh.update(timestamp, timeDiff, {
      playerAvatar: localPlayer.avatar,
      camera,
    });
  });
  
  return app;
};