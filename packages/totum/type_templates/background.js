import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useCleanup, useInternals} = metaversefile;

export default e => {
  const app = useApp();
  const {scene} = useInternals();

  const srcUrl = ${this.srcUrl};
  
  let live = true;
  (async () => {
    const res = await fetch(srcUrl);
    if (!live) return;
    const j = await res.json();
    if (!live) return;
    let {color} = j;
    if (Array.isArray(color) && color.length === 3 && color.every(n => typeof n === 'number')) {
      scene.background = new THREE.Color(color[0]/255, color[1]/255, color[2]/255);
    }
  })();
  
  useCleanup(() => {
    live = false;
    scene.background = null;
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'background';
export const components = ${this.components};