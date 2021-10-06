import * as THREE from "three";
import metaversefile from "metaversefile";

class EquipmentRender {
  constructor() {
    this.previewCanvas = null;
    this.previewContext = null;
    this.previewRenderer = null;

    this.initializeScene();
  }

  initializeScene() {
    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(
      10,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.previewCamera.position.set(0, 0, 10);

    // const geometry = new THREE.BoxBufferGeometry(2, 2, 2);
    // const material = new THREE.MeshBasicMaterial();
    // const cube = new THREE.Mesh(geometry, material);
    // previewScene.add(cube);
  }

  async bindPreviewCanvas(pCanvas) {
    this.previewCanvas = pCanvas;

    const rect = this.previewCanvas.getBoundingClientRect();
    this.previewContext =
      this.previewCanvas &&
      this.previewCanvas.getContext("webgl2", {
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: false,
        xrCompatible: true,
      });
    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: this.previewCanvas,
      context: this.previewContext,
      antialias: true,
      alpha: true,
    });
    this.previewRenderer.setSize(rect.width, rect.height);
    this.previewRenderer.setPixelRatio(window.devicePixelRatio);
    this.previewRenderer.autoClear = false;
    this.previewRenderer.sortObjects = false;
    this.previewRenderer.physicallyCorrectLights = true;
    this.previewRenderer.outputEncoding = THREE.sRGBEncoding;
    this.previewRenderer.gammaFactor = 2.2;

    if (!this.previewContext) {
      this.previewContext = this.previewRenderer.getContext();
    }
    this.previewContext.enable(this.previewContext.SAMPLE_ALPHA_TO_COVERAGE);
    this.previewRenderer.xr.enabled = true;

    const defaultAvatarUrl = './avatars/citrine.vrm';
    await this.addPreviewObject(defaultAvatarUrl)
  }

  async addPreviewObject (contentId) {
    const module = await metaversefile.import(contentId);

    const app = metaversefile.createApp({
      name: contentId,
      type: (() => {
        const match = contentId.match(/\.([a-z0-9]+)$/i);
        if (match) {
          return match[1];
        } else {
          return "";
        }
      })(),
    });

    app.position.set(0, -4.75, -1.5);
    app.rotation.set(0, 3, 0);
    app.scale.set(3.5, 3.5, 2.5);
    app.updateMatrixWorld();
    app.contentId = contentId;
    app.setComponent("physics", true);

    this.previewScene.add(app);
    await app.addModule(module);
    console.log(this.previewScene);
  }

  render () {
    this.previewRenderer.clear();
    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }
}

const equipmentRender = new EquipmentRender();
export default equipmentRender;