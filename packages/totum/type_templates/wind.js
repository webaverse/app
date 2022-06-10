import metaversefile from 'metaversefile';
const {useApp, useCleanup, setWinds, removeWind} = metaversefile;

export default e => {
  const app = useApp();
  const srcUrl = ${this.srcUrl};
  const mode = app.getComponent('mode') ?? 'attached';
  let j = null;
  if (mode === 'attached') {
    (async () => {
      const res = await fetch(srcUrl);
      j = await res.json();
      if (j) {
        setWinds(j);
      }
    })();
  }
  
  useCleanup(() => {
    removeWind(j);
  });

  return app;
};
export const contentId = ${this.contentId};
export const name = ${this.name};
export const description = ${this.description};
export const type = 'wind';
export const components = ${this.components};