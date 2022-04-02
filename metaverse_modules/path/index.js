import * as THREE from 'three';
// import Simplex from './simplex-noise.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, usePhysics, useGeometries, useProcGen, waitForSceneLoaded} = metaversefile;

// const localVector = new THREE.Vector3();
// const simplex = new Simplex('lol');

export default () => {
  const app = useApp();
  const physics = usePhysics();
  const {StreetLineGeometry} = useGeometries();
  const {alea} = useProcGen();

  app.name = 'path';

  const line = app.getComponent('line') ?? [
    [0, 0, 0],
    [0, 0, -1],
  ];

  const startPoint = new THREE.Vector3().fromArray(line[0]);
  const endPoint = new THREE.Vector3().fromArray(line[1]);
  const direction = endPoint.clone().sub(startPoint).normalize();
  const distance = startPoint.distanceTo(endPoint);
  const segmentLength = 0.5;
  const numPoints = Math.round(distance / segmentLength);
  const stepRange = 0.2;

  const _makePathMesh = async () => {
    await waitForSceneLoaded();

    const rng = alea('path');
    const r = () => -1 + 2 * rng();

    const splinePoints = Array(numPoints);
    // const point = new THREE.Vector3(0, 0, 0);
    // const direction = new THREE.Vector3(r(), r(), r()).normalize();
    for (let i = 0; i <= numPoints; i++) {
      const position = startPoint.clone()
        .add(direction.clone().multiplyScalar(i * distance / numPoints));
      position.x += r() * stepRange;
      // point.y += r() * stepRange;
      position.y += 100;
      position.z += r() * stepRange;
      
      const result = physics.raycast(
        position,
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          -Math.PI / 2
        )
      );
      if (result) {
        const {
          point,
        } = result;

        const p = new THREE.Vector3().fromArray(point);
        p.y += 0.05;
        splinePoints[i] = p;
      } /* else {
        console.warn('no raycast', position);
      } */
    }
    const curve = new THREE.CatmullRomCurve3(splinePoints);

    const geometry = new StreetLineGeometry(
      curve, // path
      numPoints, // tubularSegments
      0.1, // radiusX
      0.01, // radiusY
    );

    const material = new THREE.MeshNormalMaterial({
      // color: 0xFF0000,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.frustumCulled = false;
    return mesh;
  };
  (async () => {
    const pathMesh = await _makePathMesh();
    app.add(pathMesh);
    pathMesh.updateMatrixWorld();
  })();

  return app;
};