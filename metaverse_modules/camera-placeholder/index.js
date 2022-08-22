import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useGeometries} = metaversefile;

export default () => {
  const app = useApp();
  const {CameraGeometry} = useGeometries();

  const _makeCameraMesh = () => {
    const geometry = new CameraGeometry();
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'camera-mesh';
    return mesh;
  };

  app.name = 'camera-placeholder';

  window.cameraPlaceholder = app;

  const cameraMesh = _makeCameraMesh();
  app.add(cameraMesh);
  cameraMesh.updateMatrixWorld();

  return app;
};