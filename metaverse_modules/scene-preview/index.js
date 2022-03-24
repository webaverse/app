import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScenePreviewer, useInternals} = metaversefile;

export default e => {
  const app = useApp();
  const {ScenePreviewer} = useScenePreviewer();
  // const {sceneHighPriority, sceneLowPriority} = useInternals();

  app.name = 'scene-preview';

  const sceneUrl = app.getComponent('sceneUrl') ?? '';
  const focus = app.getComponent('focus') ?? false;
  const previewPositionArray = app.getComponent('previewPosition') ?? [0, 0, 0];
  const previewPosition = new THREE.Vector3().fromArray(previewPositionArray);
  const previewPositionQuaternion = app.getComponent('previewQuaternion') ?? [0, 0, 0, 1];
  const previewQuaternion = new THREE.Quaternion().fromArray(previewPositionQuaternion);

  const scenePreviewer = new ScenePreviewer();
  scenePreviewer.setFocus(focus);
  const {skyboxMesh, sceneObject} = scenePreviewer;
  scenePreviewer.matrixWorld.copy(app.matrixWorld);
  scenePreviewer.matrix.copy(app.matrix);
  scenePreviewer.position.copy(app.position);
  scenePreviewer.quaternion.copy(app.quaternion);
  scenePreviewer.scale.copy(app.scale);

  skyboxMesh.position.copy(previewPosition);
  skyboxMesh.quaternion.copy(previewQuaternion);
  app.add(skyboxMesh);
  skyboxMesh.updateMatrixWorld();

  app.add(sceneObject);

  app.setFocus = scenePreviewer.setFocus.bind(scenePreviewer);

  e.waitUntil((async () => {
    await scenePreviewer.loadScene(sceneUrl);
  })());

  // app.setComponent('renderPriority', 'low');

  return app;
};
