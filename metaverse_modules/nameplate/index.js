import * as THREE from 'three';
// import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
// import {getCaretAtPoint} from 'troika-three-text';
const {useApp, useCamera, useLocalPlayer, useInternals, useMaterials, useFrame, /* usePhysics, */ useText} = metaversefile;

const localVector4D = new THREE.Vector4();

const {WebaverseShaderMaterial} = useMaterials();
const Text = useText();

const destroyForLocalPlayer = true;
const height = 0.6;

async function makeTextMesh(
  text = '',
  font = './fonts/Plaza Regular.ttf',
  fontSize = 0.75,
  anchorX = 'left',
  anchorY = 'middle',
  color = 0x000000,
) {
  const textMesh = new Text();
  textMesh.text = text;
  textMesh.font = font;
  textMesh.fontSize = fontSize;
  textMesh.color = color;
  textMesh.anchorX = anchorX;
  textMesh.anchorY = anchorY;
  textMesh.frustumCulled = false;
  await new Promise(resolve => {
    textMesh.sync(resolve);
  });
  return textMesh;
}

export default e => {
  const app = useApp();
  const camera = useCamera();
  const localPlayer = useLocalPlayer();
  // do something with this
  const destroy = () => {
    textMesh.geometry.dispose();
    scene.remove(app);
    this.destroy()
  };
  if (destroyForLocalPlayer && app.player === localPlayer) return destroy();
  let name = app.player.name;
  const {/* renderer, */scene/*, camera */} = useInternals();
  let textMesh = null;
  // const physics = usePhysics();
  (async () => {
    const font = './fonts/GeosansLight.ttf';
    const fontSize = 0.25;
    const anchorX = 'center';
    const anchorY = 'top';
    const color = 0xFFFF00;

    textMesh = await makeTextMesh(name, font, fontSize, anchorX, anchorY, color);
    app.add(textMesh);
    app.text = textMesh;

    textMesh.updateMatrixWorld();
  })();

  useFrame(() => {
    if (!textMesh || !app.player) return;
    app.position.set(app.player.position.x, app.player.position.y + height, app.player.position.z);

    // app and camera are both THREE.Object3D type
    // write a function the makes app face camera
    const appToCamera = new THREE.Vector3().subVectors(camera.position, app.position);
    const appToCameraAngle = Math.atan2(appToCamera.x, appToCamera.z);
    app.rotation.y = appToCameraAngle;
    app.updateMatrixWorld();

    // name change
    // TODO: This should be an event listener
    if (name !== app.player.name) {
      name = app.player.name;
      textMesh.text = name;
      textMesh.sync();
    }
  });

  return app;
};
