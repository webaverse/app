import metaversefile from 'metaversefile';

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const moduleUrls = {
  button: `${baseUrl}metaverse_modules/button/`,
  silk: `${baseUrl}metaverse_modules/silk/`,
  card: `${baseUrl}metaverse_modules/card/`,
  arrowLoader: `${baseUrl}metaverse_modules/arrow-loader/`,
  errorPlaceholder: `${baseUrl}metaverse_modules/error-placeholder/`,
  damageMesh: `${baseUrl}metaverse_modules/damage-mesh/`,
  ki: `${baseUrl}metaverse_modules/ki/`,
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