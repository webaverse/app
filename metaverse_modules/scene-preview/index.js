import * as THREE from 'three';
import {ShaderLib} from 'three/src/renderers/shaders/ShaderLib.js';
import {UniformsUtils} from 'three/src/renderers/shaders/UniformsUtils.js';
import * as ThreeVrm from '@pixiv/three-vrm';
const {MToonMaterial} = ThreeVrm;
// window.ThreeVrm = ThreeVrm;
// import easing from './easing.js';
// import {StreetGeometry} from './StreetGeometry.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useRenderer, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const localVector = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();

export default e => {
  const app = useApp();
  // const physics = usePhysics();
  // const procGen = useProcGen();
  // const {alea, chunkWorldSize} = procGen;
  const renderer = useRenderer();

  app.name = 'scene-preview';

  const positionArray = app.getComponent('position') ?? [0, 0, 0];
  const quaternionArray = app.getComponent('quaternion') ?? [0, 0, 0, 1];
  const previewPositionArray = app.getComponent('previewPosition') ?? [0, 0, 0];
  const sceneUrl = app.getComponent('sceneUrl') ?? '';

  // const position = new THREE.Vector3().fromArray(positionArray);
  // const quaternion = new THREE.Quaternion().fromArray(quaternionArray);
  const previewPosition = new THREE.Vector3().fromArray(previewPositionArray);

  const previewScene = new THREE.Scene();
  previewScene.name = 'previewScene';
  previewScene.autoUpdate = false;
  let subScene = null;
  e.waitUntil((async () => {
    // console.log('create app', sceneUrl);
    subScene = await metaversefile.createAppAsync({
      start_url: sceneUrl,
      components: {
        mode: 'detached',
      },
      parent: app,
    });
    // console.log('got sub scene', subScene, {position, quaternion, previewPosition});
    // subScene.position.copy(position);
    // subScene.quaternion.copy(quaternion);
    // app.add(subScene);
    // subScene.updateMatrixWorld();
  })());

  //

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
    2 * 1024,
    {
      generateMipmaps: true,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    },
  );
  const cubeCamera = new THREE.CubeCamera(10, 1000, cubeRenderTarget);
  cubeCamera.position.copy(previewPosition);
  cubeCamera.updateMatrixWorld();
  
  useFrame(() => {
    /* // push old state
    const oldRenderTarget = renderer.getRenderTarget();

    // renderer.setRenderTarget(cubeRenderTarget);
    renderer.render(previewScene, cubeCamera);

    // pop old state
    renderer.setRenderTarget(oldRenderTarget); */

    if (subScene) {
      cubeCamera.update(renderer, previewScene);
    }
  });

  //
  
  const skyboxGeometry = new THREE.BoxBufferGeometry(100, 100, 100);
  skyboxGeometry.deleteAttribute('normal');
  skyboxGeometry.deleteAttribute('uv');

  const uniforms = UniformsUtils.clone(ShaderLib.cube.uniforms);
  // console.log('got uniforms', uniforms);
  // uniforms.envMap.value = null;
  
  const skyboxMaterial = new THREE.ShaderMaterial({
    // name: 'BackgroundCubeMaterial',
    uniforms,
    vertexShader: ShaderLib.cube.vertexShader,
    fragmentShader: ShaderLib.cube.fragmentShader,
    side: THREE.BackSide,
    // depthTest: false,
    // depthWrite: false,
    // fog: false,
  });
  Object.defineProperty(skyboxMaterial, 'envMap', {
    get: function() {
      return this.uniforms.envMap.value;
    },
  });
  skyboxMaterial.uniforms.envMap.value = cubeRenderTarget.texture;
  // boxMesh.material.uniforms.flipEnvMap.value

  /* const m = new THREE.MeshBasicMaterial({
    color: 0xFF0000,
    side: THREE.BackSide,
  }); */
  const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skyboxMesh.position.copy(previewPosition);
  app.add(skyboxMesh);
  skyboxMesh.updateMatrixWorld();

  return app;
};
