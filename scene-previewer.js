import * as THREE from 'three';
// import metaversefile from 'metaversefile';
// const {useApp, useFrame, useRenderer, useCamera, useMaterials, useCleanup} = metaversefile;
import {getRenderer, camera} from './renderer.js';
import metaversefile from 'metaversefile';

const resolution = 2048;
const worldSize = 100;
const near = 10;

class ScenePreviewer {
  constructor() {
    const previewScene = new THREE.Scene();
    previewScene.name = 'previewScene';
    previewScene.autoUpdate = false;
    const previewContainer = new THREE.Object3D();
    previewContainer.name = 'previewContainer';
    previewScene.add(previewContainer);
    this.previewScene = previewScene;
    this.previewContainer = previewContainer;

    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(
      resolution,
      {
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        // magFilter: THREE.LinearMipmapLinearFilter,
      },
    );
    cubeRenderTarget.texture.mapping = THREE.CubeRefractionMapping;
    this.cubeRenderTarget = cubeRenderTarget;
    const cubeCamera = new THREE.CubeCamera(near, camera.far, cubeRenderTarget);
    this.cubeCamera = cubeCamera;

    const _makeSkyboxMesh = () => {
      // SphereGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength )
      const skyboxGeometry = new THREE.SphereGeometry(worldSize, 64, 32, 0, Math.PI);
      const skyboxMaterial = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        envMap: cubeRenderTarget.texture,
      });
      const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
      return skyboxMesh;
    };
    this.mesh = _makeSkyboxMesh();

    this.scene = null;
    this.renderedScene = null;
  }
  async loadScene(sceneUrl) {
    if (this.scene) {
      const oldScene = this.detachScene();
    }
    
    this.scene = await metaversefile.createAppAsync({
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
      parent: this.previewContainer,
    });
    this.render();
  }
  attachScene(scene) {
    this.scene = scene;
    this.previewContainer.add(scene);

    this.render();
  }
  detachScene() {
    const {scene} = this;
    if (scene) {
      this.previewContainer.remove(scene);
      this.scene = null;
    }
    return scene;
  }
  render() {
    const renderer = getRenderer();

    this.cubeCamera.position.setFromMatrixPosition(this.mesh.matrixWorld);
    this.cubeCamera.updateMatrixWorld();

    this.cubeRenderTarget.clear(renderer, true, true, true);
    this.cubeCamera.update(renderer, this.previewScene);
  }
};
// const createScenePreviewer = () => new ScenePreviewer();
export {
  ScenePreviewer,
  // createScenePreviewer,
};