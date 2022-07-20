import metaversefile from 'metaversefile';

const moduleUrls = {
  button: `./metaverse_modules/button/`,
  silk: `./metaverse_modules/silk/`,
  card: `./metaverse_modules/card/`,
  arrowLoader: `./metaverse_modules/arrow-loader/`,
  errorPlaceholder: `./metaverse_modules/error-placeholder/`,
  damageMesh: `./metaverse_modules/damage-mesh/`,
  nameplate: `./metaverse_modules/nameplate/`,
  ki: `./metaverse_modules/ki/`,
  sonicBoom: `./metaverse_modules/sonic-boom/`,
  healEffect: `./metaverse_modules/heal-effect/`,
  filter: './metaverse_modules/filter/',
  barrier: './metaverse_modules/barrier/',
  comet: './metaverse_modules/comet/',
  infinistreet: './metaverse_modules/infinistreet/',
  spawner: './metaverse_modules/spawner/',
  defaultScene: './metaverse_modules/default-scene/',
  path: './metaverse_modules/path/',
  area: './metaverse_modules/area/',
  cameraPlaceholder: './metaverse_modules/camera-placeholder/',
  targetReticle: './metaverse_modules/target-reticle/',
  halo: './metaverse_modules/halo/',
  silks: './metaverse_modules/silks/',
  magic: './metaverse_modules/magic/',
  limit: './metaverse_modules/limit/',
  flare: './metaverse_modules/flare/',
  firedrop: './metaverse_modules/firedrop/',
  meshLodItem: './metaverse_modules/mesh-lod-item/',
};
const modules = {};
let loadPromise = null;
const _load = async () => {
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
};
const waitForLoad = () => {
  if (!loadPromise) {
    loadPromise = _load();
  }
  return loadPromise;
};
export {
  moduleUrls,
  modules,
  waitForLoad,
};
