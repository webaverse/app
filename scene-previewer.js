import * as THREE from 'three';
// import metaversefile from 'metaversefile';
// const {useApp, useFrame, useRenderer, useCamera, useMaterials, useCleanup} = metaversefile;
import {getRenderer, camera} from './renderer.js';
import {WebaverseShaderMaterial} from './materials.js';
import renderSettingsManager from './rendersettings-manager.js';
import {snapshotMapChunk} from './scene-cruncher.js';
import metaversefile from 'metaversefile';

const resolution = 2048;
const worldSize = 10000;
const near = 0.1;

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const localPlane = new THREE.Plane();
const zeroVector = new THREE.Vector3(0, 0, 0);
const upVector = new THREE.Vector3(0, 1, 0);

const _planeToVector4 = (plane, target) => {
  target.copy(plane.normal);
  target.w = plane.constant;
};

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
  uniform vec4 plane;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  float distanceToPoint(vec4 plane, vec3 point) {
    vec3 normal = plane.xyz;
    float constant = plane.w;
    return dot(normal, point) + constant;
  }
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

    float d = distanceToPoint(plane, cameraPosition);
    gl_FragColor.a = 1.0 - smoothstep(0.0, 20.0, d);
    if (gl_FragColor.a <= 0.0) {
      discard;
    }
  }
`;

const _makeSkyboxMesh = () => {
  const skyboxGeometry = new THREE.SphereGeometry(
    worldSize,
    64,
    32,
    0,
    Math.PI,
  );
  const skyboxMaterial = new WebaverseShaderMaterial({
    uniforms: {
      envMap: {
        value: this.cubeRenderTarget.texture,
        needsUpdate: true,
      },
      plane: {
        value: new THREE.Vector4(0, 0, 0, 0),
        needsUpdate: false,
      },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    transparent: true,
  });
  const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skyboxMesh.onBeforeRender = () => {
    const position = localVector;
    const quaternion = localQuaternion;
    const scale = localVector2;
    skyboxMesh.matrixWorld.decompose(position, quaternion, scale);

    const normal = localVector3.set(0, 0, -1).applyQuaternion(quaternion);
    localPlane.setFromNormalAndCoplanarPoint(normal, position);

    _planeToVector4(localPlane, skyboxMesh.material.uniforms.plane.value);
    skyboxMesh.material.uniforms.plane.needsUpdate = true;
  };
  return skyboxMesh;
};

class ScenePreviewer extends THREE.Object3D {
  constructor({
    size = new THREE.Vector3(100, 100, 100),
    enterNormals = [],
  } = {}) {
    super();

    this.size = size;
    this.enterNormals = enterNormals;

    const previewScene = new THREE.Scene();
    previewScene.name = 'previewScene';
    previewScene.matrixWorldAutoUpdate = false;
    this.previewScene = previewScene;

    const previewContainer = new THREE.Object3D();
    previewContainer.name = 'previewContainer';
    this.previewContainer = previewContainer;
    this.previewScene.add(previewContainer);

    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(resolution, {
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      // magFilter: THREE.LinearMipmapLinearFilter,
    });
    cubeRenderTarget.texture.mapping = THREE.CubeRefractionMapping;
    this.cubeRenderTarget = cubeRenderTarget;
    const cubeCamera = new THREE.CubeCamera(near, camera.far, cubeRenderTarget);
    this.cubeCamera = cubeCamera;

    this.lodMesh = this.#makeLodMesh();
    this.skyboxMeshes = this.#makeSkyboxMeshes(size, enterNormals);
    this.sceneObject = new THREE.Object3D();

    this.scene = null;
    this.renderedScene = null;
    this.focused = false;
    this.rendered = false;
  }

  async loadScene(sceneUrl) {
    /* if (this.scene) {
      this.detachScene();
    } */

    const popPreviewContainerTransform = !this.focused
      ? this.#pushPreviewContainerTransform()
      : null;
    this.scene = await metaversefile.createAppAsync({
      start_url: sceneUrl,
      components: {
        mode: 'detached',
        paused: !this.focused,
        objectComponents: [
          {
            key: 'physics',
            value: true,
          },
        ],
      },
      parent: this.previewContainer,
    });
    popPreviewContainerTransform && popPreviewContainerTransform();
    if (this.#canRender()) {
      this.render();
    }
  }

  /* attachScene(scene) {
    this.scene = scene;
    this.previewContainer.add(scene);

    if (this.#canRender()) {
      this.render();
    }
  }
  detachScene() {
    const oldScene = this.scene;
    if (oldScene) {
      oldScene.parent.remove(oldScene);
      this.scene = null;
    }
    return oldScene;
  } */
  setFocus(focus) {
    this.focused = focus;

    if (this.focused) {
      this.sceneObject.add(this.previewContainer);
    } else {
      this.previewScene.add(this.previewContainer);
    }

    const previewVisible = !this.focused;
    this.lodMesh.visible = previewVisible;
    for (const skyboxMesh of this.skyboxMeshes) {
      skyboxMesh.visible = previewVisible;
    }

    if (this.scene) {
      this.scene.setComponent('paused', !this.focused);
    }

    if (this.#canRender()) {
      this.render();
    }
  }

  #makeLodMesh() {
    const mesh = new THREE.Mesh();
    mesh.visible = false;
    return mesh;
  }

  #makeSkyboxMeshes(size, normals) {
    const result = [];
    for (const normal of normals) {
      const skyboxMesh = _makeSkyboxMesh();
      skyboxMesh.position
        .copy(this.position)
        .add(localVector.copy(normal).multiplyScalar(size));
      skyboxMesh.quaternion.setFromRotationMatrix(
        localMatrix.lookAt(normal, zeroVector, upVector),
      );
      skyboxMesh.updateMatrixWorld();
    }
    return result;
  }

  #pushPreviewContainerTransform() {
    const oldPosition = localVector.copy(this.position);
    const oldQuaternion = localQuaternion.copy(this.quaternion);
    const oldScale = localVector2.copy(this.scale);
    const oldMatrix = localMatrix.copy(this.matrix);
    const oldMatrixWorld = localMatrix2.copy(this.matrixWorld);

    // set transforms
    this.previewContainer.position.copy(this.position);
    this.previewContainer.quaternion.copy(this.quaternion);
    this.previewContainer.scale.copy(this.scale);
    this.previewContainer.matrix.copy(this.matrix);
    this.previewContainer.matrixWorld.copy(this.matrixWorld);

    return () => {
      this.previewContainer.position.copy(oldPosition);
      this.previewContainer.quaternion.copy(oldQuaternion);
      this.previewContainer.scale.copy(oldScale);
      this.previewContainer.matrix.copy(oldMatrix);
      this.previewContainer.matrixWorld.copy(oldMatrixWorld);
    };
  }

  #canRender() {
    return !!this.scene && !this.rendered;
  }

  render() {
    {
      const renderer = getRenderer();

      // push old state
      const popPreviewContainerTransform =
        this.#pushPreviewContainerTransform();
      const popRenderSettings = renderSettingsManager.push(
        this.scene,
        this.previewScene,
      );

      for (const skyboxMesh of this.skyboxMeshes) {
        this.cubeCamera.position.setFromMatrixPosition(skyboxMesh.matrixWorld);
        this.cubeCamera.updateMatrixWorld();

        // render
        this.cubeRenderTarget.clear(renderer, true, true, true);
        this.cubeCamera.update(renderer, this.previewScene);
      }

      // pop old state
      popPreviewContainerTransform();
      popRenderSettings();
    }

    {
      const worldResolution = new THREE.Vector2(2048, 2048);
      const worldDepthResolution = new THREE.Vector2(128, 128);
      const oldPreviewContainerParent = this.previewContainer.parent;

      this.previewScene.add(this.previewContainer);
      const popPreviewContainerTransform =
        this.#pushPreviewContainerTransform();
      const lodMesh = snapshotMapChunk(
        this.previewScene,
        this.position,
        this.size,
        worldResolution,
        worldDepthResolution,
      );
      popPreviewContainerTransform();
      oldPreviewContainerParent.add(this.previewContainer);

      {
        const oldParent = this.lodMesh.parent;
        const oldVisible = this.lodMesh.visible;

        if (oldParent) {
          oldParent.remove(this.lodMesh);
          oldParent.add(lodMesh);
          lodMesh.updateMatrixWorld();
        }
        lodMesh.visible = oldVisible;
      }
      this.lodMesh = lodMesh;
    }

    this.rendered = true;
  }
}
export {ScenePreviewer};
