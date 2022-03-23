import * as THREE from 'three';
import {ShaderLib} from 'three/src/renderers/shaders/ShaderLib.js';
import {UniformsUtils} from 'three/src/renderers/shaders/UniformsUtils.js';
// import * as ThreeVrm from '@pixiv/three-vrm';
// const {MToonMaterial} = ThreeVrm;
// window.ThreeVrm = ThreeVrm;
// import easing from './easing.js';
// import {StreetGeometry} from './StreetGeometry.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useRenderer, useCamera, useMaterials, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const localVector = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();

export default e => {
  const app = useApp();
  // const physics = usePhysics();
  // const procGen = useProcGen();
  // const {alea, chunkWorldSize} = procGen;
  // const renderer = useRenderer();
  // const camera = useCamera();
  // const {WebaverseShaderMaterial} = useMaterials();

  app.name = 'overworld';

  const initObjects = [
    {
      name: 'street',
      type: 'scene',
      start_url: './scenes/street.scn',
    },
    {
      name: 'barrier',
      type: 'app',
      start_url: '../metaverse_modules/barrier/',
      components: [
        {
          key: 'bounds',
          value: [
            [-150, -150, -450],
            [150, 150, -150]
          ]
        }
      ]
    },
  ];

  const objects = new Map();
  const _loadObject = async spec => {
    const {name, type, start_url} = spec;
    if (type === 'scene') {
      const scene = await metaversefile.createAppAsync({
        start_url,
        components: {
          mode: 'detached',
        },
      });
      scene.name = name;
      return scene;
    } else if (type === 'app') {
      const {start_url, position, quaternion, scale, components} = spec;
      const app = metaversefile.createAppAsync({
        start_url,
        position,
        quaternion,
        scale,
        components,
      });
      app.name = name;
      return app;
    } else {
      throw new Error(`unknown object type ${type}`);
    }
  };
  e.waitUntil((async () => {
    const promises = initObjects.map(async spec => {
      const o = await _loadObject(spec);
      app.add(o);
      objects.set(spec.name, o);
      return o;
    });
    await Promise.all(promises);
  })());

  //

  /* const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
    resolution,
    {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      // magFilter: THREE.LinearMipmapLinearFilter,
    },
  );
  cubeRenderTarget.texture.mapping = THREE.CubeRefractionMapping;
  const cubeCamera = new THREE.CubeCamera(near, camera.far, cubeRenderTarget); */

  return app;
};