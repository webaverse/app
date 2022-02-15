import metaversefile from 'metaversefile';

const moduleUrls = {
  button: `./metaverse_modules/button/`,
  silk: `./metaverse_modules/silk/`,
  card: `./metaverse_modules/card/`,
  arrowLoader: `./metaverse_modules/arrow-loader/`,
  errorPlaceholder: `./metaverse_modules/error-placeholder/`,
  damageMesh: `./metaverse_modules/damage-mesh/`,
};
const modules = {};
const loadPromise = (async () => {
  await Promise.resolve(); // wait for init
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
  moduleUrls,
  modules,
  waitForLoad,
};