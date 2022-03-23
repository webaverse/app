import * as THREE from 'three';
// import metaversefile from 'metaversefile';
// const {useApp, useFrame, useRenderer, useCamera, useMaterials, useCleanup} = metaversefile;
import {getRenderer, camera} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';
import metaversefile from 'metaversefile';

const resolution = 2048;
const worldSize = 10000;
const near = 10;

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 objectNormal = vec3(normal);
    vec3 transformedNormal = objectNormal;
    transformedNormal = normalMatrix * transformedNormal;
    transformedNormal = -transformedNormal; // due to THREE.BackSide, FLIP_SIDED
    vNormal = normalize(transformedNormal);

    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
		vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `\
  vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
    // dir can be either a direction vector or a normal vector
    // upper-left 3x3 of matrix is assumed to be orthogonal
    return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
  }

  //

  uniform samplerCube envMap;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 normal = normalize(vNormal);
    const float flipEnvMap = 1.;
    // const float refractionRatio = 0.98;
    const float refractionRatio = 1.;

    vec3 cameraToFrag;
    cameraToFrag = normalize( vWorldPosition - cameraPosition );

    // Transforming Normal Vectors with the Inverse Transformation
    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
    
    vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );

    vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
    gl_FragColor = envColor;
  }
`;

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
      const skyboxGeometry = new THREE.SphereGeometry(worldSize, 64, 32, 0, Math.PI);
      const skyboxMaterial = new WebaverseShaderMaterial({
        uniforms: {
          envMap: {
            value: cubeRenderTarget.texture,
            needsUpdate: true,
          },
        },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
      });
      /* const skyboxMaterial = new THREE.MeshBasicMaterial({
        envMap: cubeRenderTarget.texture,
        side: THREE.BackSide,
      });
      skyboxMaterial.onBeforeCompile = function() {
        debugger;
      }; */
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
export {
  ScenePreviewer,
};