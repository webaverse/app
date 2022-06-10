// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useNpcManager, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  const npcManager = useNpcManager();

  const srcUrl = ${this.srcUrl};

  e.waitUntil((async () => {
    await npcManager.addNpcApp(app, srcUrl);
  })());

  useCleanup(() => {
    npcManager.removeNpcApp(app);
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'npc';
export const components = ${this.components};