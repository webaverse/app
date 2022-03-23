import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useRenderer, useCamera, useMaterials, useCleanup} = metaversefile;

const resolution = 2048;
const worldSize = 100;
const near = 10;

export default e => {
  const app = useApp();
  const renderer = useRenderer();
  const camera = useCamera();

  app.name = 'scene-preview';

  const previewPositionArray = app.getComponent('previewPosition') ?? [0, 0, 0];
  const sceneUrl = app.getComponent('sceneUrl') ?? '';

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
  
  let rendered = false;
  useFrame(() => {
    if (subScene && !rendered) {
      previewContainer.matrixWorld.copy(app.matrixWorld);
      previewContainer.matrix.copy(app.matrixWorld);
      previewContainer.matrixWorld.decompose(previewContainer.position, previewContainer.quaternion, previewContainer.scale);
      subScene.updateMatrixWorld();

      cubeCamera.position.setFromMatrixPosition(skyboxMesh.matrixWorld);
      cubeCamera.updateMatrixWorld();
      
      cubeRenderTarget.clear(renderer, true, true, true);
      cubeCamera.update(renderer, previewScene);
    }
  });

  //
  
  const skyboxGeometry = new THREE.SphereGeometry(worldSize, 64, 32);
  const skyboxMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    envMap: cubeRenderTarget.texture,
  });
  const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skyboxMesh.frustumCulled = false;
  skyboxMesh.position.copy(previewPosition);
  app.add(skyboxMesh);
  skyboxMesh.updateMatrixWorld();

  return app;
};
