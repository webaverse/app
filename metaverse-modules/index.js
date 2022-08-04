import metaversefile from 'metaversefile';

const moduleUrls = {
  button: `/metaverse-modules/button/`,
  silk: `/metaverse-modules/silk/`,
  card: `/metaverse-modules/card/`,
  arrowLoader: `/metaverse-modules/arrow-loader/`,
  errorPlaceholder: `/metaverse-modules/error-placeholder/`,
  damageMesh: `/metaverse-modules/damage-mesh/`,
  nameplate: `/metaverse-modules/nameplate/`,
  ki: `/metaverse-modules/ki/`,
  sonicBoom: `/metaverse-modules/sonic-boom/`,
  healEffect: `/metaverse-modules/heal-effect/`,
  filter: '/metaverse-modules/filter/',
  barrier: '/metaverse-modules/barrier/',
  comet: '/metaverse-modules/comet/',
  infinistreet: '/metaverse-modules/infinistreet/',
  spawner: '/metaverse-modules/spawner/',
  defaultScene: '/metaverse-modules/default-scene/',
  path: '/metaverse-modules/path/',
  area: '/metaverse-modules/area/',
  cameraPlaceholder: '/metaverse-modules/camera-placeholder/',
  targetReticle: '/metaverse-modules/target-reticle/',
  halo: '/metaverse-modules/halo/',
  silks: '/metaverse-modules/silks/',
  magic: '/metaverse-modules/magic/',
  limit: '/metaverse-modules/limit/',
  flare: '/metaverse-modules/flare/',
  firedrop: '/metaverse-modules/firedrop/',
  meshLodItem: '/metaverse-modules/mesh-lod-item/',
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
