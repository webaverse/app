import metaversefile from 'metaversefile';

const moduleUrls = {
  button: `./metaverse_modules/button/`,
  silk: `./metaverse_modules/silk/`,
  card: `./metaverse_modules/card/`,
  arrowLoader: `./metaverse_modules/arrow-loader/`,
  errorPlaceholder: `./metaverse_modules/error-placeholder/`,
  damageMesh: `./metaverse_modules/damage-mesh/`,
  ki: `./metaverse_modules/ki/`,
  sonicBoom: `./metaverse_modules/sonic-boom/`,
  filter: './metaverse_modules/filter/',
  barrier: './metaverse_modules/barrier/',
  infinistreet: './metaverse_modules/infinistreet/',
  spawner: './metaverse_modules/spawner/',
  defaultScene: './metaverse_modules/default-scene/',
  path: './metaverse_modules/path/',
  area: './metaverse_modules/area/',
  cameraPlaceholder: './metaverse_modules/camera-placeholder/',
  halo: './metaverse_modules/halo/',
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
      }, err => {
        console.warn(err);
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