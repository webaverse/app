import * as THREE from 'three';
import metaversefile from 'metaversefile';

class EquipmentRender {
  constructor() {
    this.previewCanvas = null;
    this.previewContext = null;
    this.previewRenderer = null;

    this.initializeScene();
  }

  initializeScene() {
    this.previewScene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
    this.previewScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 2);
    directionalLight.position.set(1, 2, 3);
    this.previewScene.add(directionalLight);

    this.previewCamera = new THREE.PerspectiveCamera(
      10,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    this.previewCamera.position.set(0, 1.35, 4.5);
  }

  async bindPreviewCanvas(pCanvas) {
    this.previewCanvas = pCanvas;

    const rect = this.previewCanvas.getBoundingClientRect();
    this.previewContext =
      this.previewCanvas &&
      this.previewCanvas.getContext('webgl2', {
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
    // this.previewRenderer.outputEncoding = THREE.sRGBEncoding;
    // this.previewRenderer.gammaFactor = 2.2;

    if (!this.previewContext) {
      this.previewContext = this.previewRenderer.getContext();
    }
    this.previewContext.enable(this.previewContext.SAMPLE_ALPHA_TO_COVERAGE);
    this.previewRenderer.xr.enabled = true;

    let avatar = null;
    const localPlayer = metaversefile.useLocalPlayer();
    localPlayer.addEventListener('avatarupdate', e => {
      if (avatar) {
        avatar.parent.remove(avatar);
        avatar = null;
      }

      if (e.app) {
        const newAvatar = e.app.clone();

        newAvatar.position.set(0, 0, 0);
        newAvatar.rotation.set(0, 0, 0);
        newAvatar.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

        // this.previewScene.clear();
        this.previewScene.add(newAvatar);

        newAvatar.instanceId = metaversefile.getNextInstanceId();

        avatar = newAvatar;
      }
    });
  }

  render() {
    return;
    this.previewRenderer.clear();
    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }
}

const equipmentRender = new EquipmentRender();
export default equipmentRender;
