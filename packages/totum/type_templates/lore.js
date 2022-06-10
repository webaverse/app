// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useLoreAIScene, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  const loreAIScene = useLoreAIScene();

  const srcUrl = ${this.srcUrl};

  let live = true;
  let setting = null;
  (async () => {
    const res = await fetch(srcUrl);
    if (!live) return;
    let j = await res.json();
    // console.log('got lore json', j);
    if (!live) return;
    if (Array.isArray(j)) {
      j = j.join('\\n');
    }
    if (typeof j === 'string') {
      setting = loreAIScene.addSetting(j);
    }
  })();
  
  useCleanup(() => {
    live = false;

    if (setting !== null) {
      loreAIScene.removeSetting(setting);
      setting = null;
    }
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'lore';
export const components = ${this.components};