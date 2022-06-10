import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useInternals, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  const {rootScene} = useInternals();

  const srcUrl = ${this.srcUrl};
  const mode = app.getComponent('mode') ?? 'attached';

  if (mode === 'attached') {
    let live = true;
    (async () => {
      const res = await fetch(srcUrl);
      if (!live) return;
      const fog = await res.json();
      // console.log('got fog', fog);
      if (!live) return;
      /* if (fog.fogType === 'linear') {
        const {args = []} = fog;
        rootScene.fog = new THREE.Fog(new THREE.Color(args[0][0]/255, args[0][1]/255, args[0][2]/255).getHex(), args[1], args[2]);
      } else */if (fog.fogType === 'exp') {
        const {args = []} = fog;
        // console.log('got fog args', {fog, args});
        rootScene.fog = new THREE.FogExp2(new THREE.Color(args[0][0]/255, args[0][1]/255, args[0][2]/255).getHex(), args[1]);
      } else {
        console.warn('unknown fog type:', fog.fogType);
      }
    })();
    
    useCleanup(() => {
      live = false;
      rootScene.fog = null;
    });
  }

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'fog';
export const components = ${this.components};