import metaversefile from './metaversefile-api.js';

const moduleUrls = {
  button: `./metaverse_modules/button/`,
  silk: `./metaverse_modules/silk/`,
  card: `./metaverse_modules/card/`,
};
const modules = {};
const loadPromise = (async () => {
  const promises = [];
  for (const moduleName in moduleUrls) {
    const moduleUrl = moduleUrls[moduleName];
    const p = metaversefile.import(moduleUrl)
      .then(m => {
        modules[moduleName] = m;
      });
    promises.push(p);
  }
  await Promise.all(promises);
})();
const waitForLoad = () => loadPromise;
export {
  modules,
  waitForLoad,
};