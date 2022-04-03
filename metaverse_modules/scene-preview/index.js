import * as THREE from 'three';
import metaversefile from 'metaversefile';
const {useApp, useScenePreviewer, useRenderSettings} = metaversefile;

export default e => {
  const app = useApp();
  const {ScenePreviewer} = useScenePreviewer();

  app.name = 'scene-preview';

  const sceneUrl = app.getComponent('sceneUrl') ?? '';
  const focus = app.getComponent('focus') ?? false;
  /* const previewPositionArray = app.getComponent('previewPosition') ?? [0, 0, 0];
  const previewPosition = new THREE.Vector3().fromArray(previewPositionArray);
  const previewPositionQuaternion = app.getComponent('previewQuaternion') ?? [0, 0, 0, 1];
  const previewQuaternion = new THREE.Quaternion().fromArray(previewPositionQuaternion); */
  const sizeArray = app.getComponent('size') ?? [100, 100, 100];
  const size = new THREE.Vector3().fromArray(sizeArray);
  const enterNormalsArray = app.getComponent('enterNormals') ?? [];
  const enterNormals = enterNormalsArray.map(a => new THREE.Vector3().fromArray(a));

  const previewer = new ScenePreviewer({
    size,
    enterNormals,
  });
  console.log('previewer set focus', focus, sceneUrl);
  previewer.setFocus(focus);

  previewer.matrixWorld.copy(app.matrixWorld);
  previewer.matrix.copy(app.matrix);
  previewer.position.copy(app.position);
  previewer.quaternion.copy(app.quaternion);
  previewer.scale.copy(app.scale);

  const {skyboxMeshes, sceneObject} = previewer;
  for (const skyboxMesh of skyboxMeshes) {
    // skyboxMesh.position.copy(previewPosition);
    // skyboxMesh.quaternion.copy(previewQuaternion);
    app.add(skyboxMesh);
    skyboxMesh.updateMatrixWorld();
  }

  app.add(sceneObject);

  app.previewer = previewer;
  app.hasSubApps = true;

  e.waitUntil((async () => {
    await previewer.loadScene(sceneUrl);
  })());

  // app.setComponent('renderPriority', 'low');

  return app;
};
