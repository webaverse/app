
import * as THREE from 'three';
import { Text } from 'troika-three-text';
import metaversefile from 'metaversefile';

const { useApp } = metaversefile;

//

export default () => {

  const app = useApp();

  const bbox = new THREE.Box3().setFromObject( app );

  const textLabelMesh = new Text();
  textLabelMesh.text = app.meta.name;
  textLabelMesh.position.y = bbox.max.y + 0.15;
  textLabelMesh.anchorX = 'center';
  textLabelMesh.updateWorldMatrix();
  textLabelMesh.sync();
  app.add( textLabelMesh );

  return app;

};
