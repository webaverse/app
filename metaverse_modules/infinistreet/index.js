import * as THREE from 'three';
import * as ThreeVrm from '@pixiv/three-vrm';
// window.ThreeVrm = ThreeVrm;
// import easing from './easing.js';
// import {StreetGeometry} from './StreetGeometry.js';
import metaversefile from 'metaversefile';
const {MToonMaterial} = ThreeVrm;
const {useApp, useFrame, useActivate, useGeometries, useLoaders, usePhysics, useProcGen, addTrackedApp, useDefaultModules, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
// const localQuaternion = new THREE.Quaternion();

const _makeBlueSphere = () => {
  const geometry = new THREE.SphereGeometry(0.2, 32, 32);

  const c = new THREE.Color(0x2048e0)
    .offsetHSL(0, 0.3, 0);
  const params = {
    // cutoff: 0.1,

    color: new THREE.Vector4().fromArray(c.toArray().concat([1])),
    shadeColor: new THREE.Vector4().fromArray(new THREE.Color(0xFFFFFF).toArray().concat([1])),
    // emissionColor: new THREE.Vector4().fromArray(new THREE.Color(0x2048e0).toArray().concat([1])),
    shadeToony: 1,
    shadeShift: 0,
    lightColorAttenuation: 0,
    indirectLightIntensity: 0,

    rimLightingMix: 1,
    rimFresnelPower: 2,
    rimLift: -0.1,
    rimColor: new THREE.Vector4().fromArray(new THREE.Color(0xFFFFFF).toArray().concat([1])),

    // outlineWidth: 0.5,
    // outlineScaledMaxDistance: 0.5,
    outlineColor: new THREE.Vector4().fromArray(new THREE.Color(0x000000).toArray().concat([1])),
    // outlineLightingMix: 0.5,
  };
  const material = new MToonMaterial(params);

  // const material2 = new MToonMaterial(params);
  // material2.isOutline = true;

  const group = new THREE.Group();
  const m1 = new THREE.Mesh(geometry, material);
  group.add(m1);

  /* const m2 = new THREE.Mesh(geometry, material2);
  m2.scale.multiplyScalar(1.05);
  m2.updateMatrixWorld
  group.add(m2); */

  return group;
};

export default () => {
  const app = useApp();
  const physics = usePhysics();
  const {StreetGeometry} = useGeometries();
  const procGen = useProcGen();
  const {alea, chunkWorldSize} = procGen;

  app.name = 'infinistreet';

  const activateCb = null;
  const frameCb = null;
  useActivate(() => {
    activateCb && activateCb();
  });
  useFrame(() => {
    frameCb && frameCb();
  });

  const [dx, dy] = app.getComponent('delta');

  const children = [];
  const physicsIds = [];
  const _render = (dx, dy) => {
    const numPoints = 3;
    // const range = 100;
    const stepRange = 0.2;
    const segmentLength = 30;

    const rng = alea(['street', dx, dy].join(':'));
    const r = () => -1 + 2 * rng();

    const splinePoints = Array(numPoints);
    const point = new THREE.Vector3(0, 0, 0);
    const direction = new THREE.Vector3(r(), r(), r()).normalize();
    for (let i = 0; i < numPoints; i++) {
      splinePoints[i] = point.clone();
      direction.x += r() * stepRange;
      direction.y += r() * stepRange;
      direction.z += r() * stepRange;
      direction.normalize();
      point.add(
        localVector.copy(direction)
          .multiplyScalar(segmentLength),
      );
      /* splinePoints[i] = new THREE.Vector3(
        rng() * range,
        rng() * range,
        rng() * range,
      ); */
    }
    const curve = new THREE.CatmullRomCurve3(splinePoints);

    /* const boxGeometry = new THREE.BoxBufferGeometry(0.25, 0.1, 0.5);
    const geometries = [];

    const points = curve.getPoints(numPoints);
    const frenetFrames = curve.computeFrenetFrames(numPoints);
    const {tangents, normals, binormals} = frenetFrames;
    const lengths = curve.getLengths(numPoints);
    // console.log('got points', points, frenetFrames);
    for (let i = 0; i < points.length - 1; i++) {
      const point = points[i];
      const tangent = tangents[i];
      const normal = normals[i];
      const binormal = binormals[i];
      const length = lengths[i];

      const nextPoint = points[i + 1];

      const midpoint = point.clone().lerp(nextPoint, 0.5);

      const g = boxGeometry.clone();
      const matrix = new THREE.Matrix4().compose(
        midpoint,
        new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            point,
            nextPoint,
            new THREE.Vector3(0, 1, 0)
          )
        ),
        new THREE.Vector3(1, 1, length),
      );
      g.applyMatrix(matrix);
      geometries.push(g);
    }

    const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries); */

    const geometry = new StreetGeometry(
      curve, // path
      numPoints, // tubularSegments
      4, // radiusX
      0.1, // radiusY
      4, // radialSegments
      false, // closed
    ).applyMatrix4(
      new THREE.Matrix4().makeTranslation(dx * chunkWorldSize, 0, dy * chunkWorldSize),
    );

    // geometry.computeFaceNormals();
    const material = new THREE.MeshNormalMaterial({
      // color: 0xFF0000,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.set(0, 34, -67);
    // mesh.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    app.add(mesh);
    mesh.updateMatrixWorld();
    mesh.frustumCulled = false;
    // scene.add(mesh);
    // window.mesh = mesh;
    children.push(mesh);

    const physicsId = physics.addGeometry(mesh);
    physicsIds.push(physicsId);

    const blueSphere = _makeBlueSphere();
    blueSphere.position.set(0, 1, -1)
      .add(localVector.set(dx * chunkWorldSize, 0, dy * chunkWorldSize));
    app.add(blueSphere);
    blueSphere.updateMatrixWorld();
    children.push(blueSphere);
  };
  _render(dx, dy);

  app.addEventListener('componentupdate', ({key, value}) => {
    if (key === 'delta') {
      _cleanup();

      const [dx, dy] = value;
      _render(dx, dy);
    }
  });

  const _cleanup = () => {
    for (const child of children) {
      app.remove(child);
    }
    children.length = 0;

    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
    physicsIds.length = 0;
  };
  useCleanup(() => {
    _cleanup();
  });

  return app;
};
