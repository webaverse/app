import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScenePreviewer} = metaversefile;

export default e => {
  const app = useApp();
  const {ScenePreviewer} = useScenePreviewer();

  app.name = 'scene-preview';

  const sceneUrl = app.getComponent('sceneUrl') ?? '';
  const previewPositionArray = app.getComponent('previewPosition') ?? [0, 0, 0];
  const previewPosition = new THREE.Vector3().fromArray(previewPositionArray);

  const scenePreviewer = new ScenePreviewer();
  const {previewContainer, mesh} = scenePreviewer;
  previewContainer.matrixWorld.copy(app.matrixWorld);
  previewContainer.matrix.copy(app.matrixWorld);
  previewContainer.matrixWorld.decompose(previewContainer.position, previewContainer.quaternion, previewContainer.scale);

  mesh.position.copy(previewPosition);
  app.add(mesh);
  mesh.updateMatrixWorld();

  e.waitUntil((async () => {
    await scenePreviewer.loadScene(sceneUrl);
  })());

  return app;
};
