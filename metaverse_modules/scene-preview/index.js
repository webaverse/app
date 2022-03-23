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

const resolution = 2048;
const worldSize = 100;
const near = 10;

export default e => {
  const app = useApp();
  // const physics = usePhysics();
  // const procGen = useProcGen();
  // const {alea, chunkWorldSize} = procGen;
  const renderer = useRenderer();
  const camera = useCamera();
  const {WebaverseShaderMaterial} = useMaterials();

  app.name = 'scene-preview';

  // const positionArray = app.getComponent('position') ?? [0, 0, 0];
  // const quaternionArray = app.getComponent('quaternion') ?? [0, 0, 0, 1];
  const previewPositionArray = app.getComponent('previewPosition') ?? [0, 0, 0];
  const sceneUrl = app.getComponent('sceneUrl') ?? '';

  // const position = new THREE.Vector3().fromArray(positionArray);
  // const quaternion = new THREE.Quaternion().fromArray(quaternionArray);
  const previewPosition = new THREE.Vector3().fromArray(previewPositionArray);

  const previewScene = new THREE.Scene();
  previewScene.name = 'previewScene';
  previewScene.autoUpdate = false;
  const previewContainer = new THREE.Object3D();
  previewContainer.name = 'previewContainer';
  previewScene.add(previewContainer);

  let subScene = null;
  e.waitUntil((async () => {
    subScene = await metaversefile.createAppAsync({
      start_url: sceneUrl,
      components: {
        mode: 'detached',
        objectComponents: [
          {
            key: 'physics',
            value: true,
          },
          {
            key: 'paused',
            value: true,
          },
        ],
      },
      parent: previewContainer,
    });
    // console.log('got sub scene', subScene, {position, quaternion, previewPosition});
    // subScene.position.copy(position);
    // subScene.quaternion.copy(quaternion);
    // app.add(subScene);
    // subScene.updateMatrixWorld();
  })());

  //

  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
    resolution,
    {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      // magFilter: THREE.LinearMipmapLinearFilter,
    },
  );
  cubeRenderTarget.texture.mapping = THREE.CubeRefractionMapping;
  const cubeCamera = new THREE.CubeCamera(near, camera.far, cubeRenderTarget);
  // cubeCamera.position.copy(previewPosition);
  // cubeCamera.updateMatrixWorld();
  // cubeCamera.position.copy(previewPosition);
  // cubeCamera.position.y += 200;
  // app.add(cubeCamera);
  // cubeCamera.updateMatrixWorld();
  
  let rendered = false;
  useFrame(() => {
    /* // push old state
    const oldRenderTarget = renderer.getRenderTarget();

    // renderer.setRenderTarget(cubeRenderTarget);
    renderer.render(previewScene, cubeCamera);

    // pop old state
    renderer.setRenderTarget(oldRenderTarget); */

    if (subScene && !rendered) {
      // push state
      // const oldParent = subScene.parent;
      // skyboxMesh.visible = false;

      // render
      previewContainer.matrixWorld.copy(app.matrixWorld);
      previewContainer.matrix.copy(app.matrixWorld);
      previewContainer.matrixWorld.decompose(previewContainer.position, previewContainer.quaternion, previewContainer.scale);
      subScene.updateMatrixWorld();

      cubeCamera.position.setFromMatrixPosition(skyboxMesh.matrixWorld);
      cubeCamera.updateMatrixWorld();
      
      cubeRenderTarget.clear(renderer, true, true, true);
      cubeCamera.update(renderer, previewScene);
      
      // pop state
      /* if (oldParent) {
        oldParent.add(subScene);
      } else {
        app.add(subScene);
      } */
      // subScene.updateMatrixWorld();
      // skyboxMesh.visible = true;
    }
  });

  //
  
  const skyboxGeometry = new THREE.SphereGeometry(worldSize, 64, 32);
  // skyboxGeometry.deleteAttribute('normal');
  // skyboxGeometry.deleteAttribute('uv');

  const uniforms = UniformsUtils.clone(ShaderLib.cube.uniforms);
  // console.log('got uniforms', uniforms);
  // uniforms.envMap.value = null;

  const vertex = /* glsl */`
  varying vec3 vWorldDirection;
  // #include <common>
  void main() {
    vWorldDirection = transformDirection( position, modelMatrix );
    #include <begin_vertex>
    #include <project_vertex>
    gl_Position.z = gl_Position.w; // set z to camera.far
  }
  `;
  const fragment = /* glsl */`
  #include <envmap_common_pars_fragment>
  uniform float opacity;
  varying vec3 vWorldDirection;
  #include <cube_uv_reflection_fragment>
  void main() {
    // gl_FragColor = vec4(1., 0., 0., 1.);
    vec3 vReflect = vWorldDirection;
    #include <envmap_fragment>
    gl_FragColor = envColor;
    gl_FragColor.a *= opacity;
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
  `;
  
  const skyboxMaterial = new WebaverseShaderMaterial({
    // name: 'BackgroundCubeMaterial',
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    // side: THREE.BackSide,
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
  // skyboxMaterial.uniforms.flipEnvMap.value = true;
  // window.cubeRenderTarget = cubeRenderTarget;

  const m = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    envMap: cubeRenderTarget.texture,
  });
  const skyboxMesh = new THREE.Mesh(skyboxGeometry, m);
  skyboxMesh.frustumCulled = false;
  skyboxMesh.position.copy(previewPosition);
  app.add(skyboxMesh);
  skyboxMesh.updateMatrixWorld();

  return app;
};
