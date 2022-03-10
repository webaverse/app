import * as THREE from 'three';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useActivate, useLoaders, usePhysics, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

// const localVector = new THREE.Vector3();
const localVector2D = new THREE.Vector3();

export default () => {
  const app = useApp();
  const physics = usePhysics();

  app.name = 'filter';

  const physicsIds = [];
  {
    const outerWidth = 16;
    const outerHeight = 8;
    const boxPosition = new THREE.Vector2(outerWidth / 2, outerHeight / 2);
    const boxSize = new THREE.Vector2(4, 4);
    const innerBox = new THREE.Box2(
      boxPosition.clone().sub(localVector2D.copy(boxSize).divideScalar(2)),
      boxPosition.clone().add(localVector2D.copy(boxSize).divideScalar(2))
    );

    const wallShape = new THREE.Shape();

    wallShape.moveTo(-outerWidth / 2, -outerHeight / 2);
    wallShape.lineTo(-outerWidth / 2, outerHeight / 2);
    wallShape.lineTo(outerWidth / 2, outerHeight / 2);
    wallShape.lineTo(outerWidth / 2, -outerHeight / 2);
    wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);

    wallShape.lineTo(-outerWidth / 2 + innerBox.min.x, -outerHeight / 2 + innerBox.min.y);
    wallShape.lineTo(-outerWidth / 2 + innerBox.max.x, -outerHeight / 2 + innerBox.min.y);
    wallShape.lineTo(-outerWidth / 2 + innerBox.max.x, -outerHeight / 2 + innerBox.max.y);
    wallShape.lineTo(-outerWidth / 2 + innerBox.min.x, -outerHeight / 2 +innerBox.max.y);
    wallShape.lineTo(-outerWidth / 2 + innerBox.min.x, -outerHeight / 2 +innerBox.min.y);
    wallShape.lineTo(-outerWidth / 2, -outerHeight / 2);

    const geometry = new THREE.ShapeGeometry(wallShape);
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    const mesh = new THREE.Mesh(geometry, material);
    app.add(mesh);
    app.updateMatrixWorld();
  }

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
