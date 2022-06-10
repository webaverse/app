// import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useInternals, useRenderSettings, usePostProcessing, useCleanup} = metaversefile;

export default e => {
  const app = useApp();
  const renderSettings = useRenderSettings();

  const srcUrl = ${this.srcUrl};

  let live = true;
  let json = null;
  let localRenderSettings = null;
  (async () => {
    const res = await fetch(srcUrl);
    if (!live) return;
    json = await res.json();
    if (!live) return;
    localRenderSettings = renderSettings.makeRenderSettings(json);
  })();
  
  useCleanup(() => {
    live = false;
    localRenderSettings = null;
  });

  app.getRenderSettings = () => localRenderSettings;

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'rendersettings';
export const components = ${this.components};