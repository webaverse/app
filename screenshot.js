import THREE from './three.module.js';

let renderer = null;
let camera = null;
const screenshot = (scene, cameraPosition, cameraTarget, options = {}) => {
  const width = typeof options.width === 'number' ? options.width : 1024;
  const height = typeof options.height === 'number' ? options.height : 1024;

  // const scene = new THREE.Scene();

  /* const gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper); */

  if (!camera) {
    camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 100);
  }
  camera.position.copy(cameraPosition);
  camera.lookAt(cameraTarget);
  // camera.quaternion.copy(cameraQuaternion);
  //camera.lookAt(model.boundingBoxMesh.getWorldPosition(new THREE.Vector3()));
  // const localAabb = model.boundingBoxMesh.scale.clone().applyQuaternion(model.quaternion);
  // const modelHeight = Math.max(model.boundingBoxMesh.scale.x, model.boundingBoxMesh.scale.y, model.boundingBoxMesh.scale.z);
  // camera.fov = 2 * Math.atan( modelHeight / ( 2 * dist ) ) * ( 180 / Math.PI );
  // camera.updateProjectionMatrix();

  // camera.lookAt(model.boundingBoxMesh.getWorldPosition(new THREE.Vector3()));

  if (!renderer) {
    renderer = new THREE.WebGLRenderer({
      // alpha: true,
      antialias: true,
    });
    renderer.setClearColor(0xFFFFFF, 1);
  }
  renderer.setSize(width, height);
  // renderer.clear(true, true, true);
  renderer.render(scene, camera);

  // const gl = renderer.getContext();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(renderer.domElement, 0, 0);
  return canvas;
  // return gl;
  /* const pixels = new Uint8Array(width*height*4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const pixels2 = new Uint8Array(width*height*4);
  for (let i = 0; i < height; i++) {
    // console.log('slice', pixels.slice(i * width*4, (i + 1) * width*4).some(n => n > 0));
    pixels2.set(
      pixels.slice((height - 1 - i) * width*4, (height - i) * width*4),
      i * width*4
    );
  }
  return pixels2; */
  /* const blob = await new Promise((accept, reject) => {
    renderer.domElement.toBlob(accept, 'image/png');
  });
  return blob; */
};
export default screenshot;
