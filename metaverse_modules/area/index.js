import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
// import easing from './easing.js';
import metaversefile from 'metaversefile';
// import {chunkWorldSize} from '../../procgen/map-gen';
const {useApp, useLocalPlayer, useProcGen, useGeometries, useCamera, useMaterials, useFrame, useActivate, usePhysics, useCleanup} = metaversefile;

// const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
// const localVector3 = new THREE.Vector3();
// const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localVector2D = new THREE.Vector2();
// const localBox = new THREE.Box3();
const localLine = new THREE.Line3();
const localMatrix = new THREE.Matrix4();
const oneVector = new THREE.Vector3(1, 1, 1);

/* const ClippedPlane = (() => {
  const localVector = new THREE.Vector3();
  // const localVector2 = new THREE.Vector3();
  const localVector3 = new THREE.Vector3();
  const localVector2D = new THREE.Vector2();
  const zeroVector = new THREE.Vector3(0, 0, 0);
  
  class ClippedPlane extends THREE.Plane {
    constructor(normal, coplanarPoint, size = new THREE.Vector2(1, 1), up = new THREE.Vector3(0, 1, 0)) {
      super();
      this.setFromNormalAndCoplanarPoint(normal, coplanarPoint);

      this.coplanarPoint = coplanarPoint;
      this.size = size;
      this.up = up;
      this.right = new THREE.Vector3().crossVectors(this.normal, this.up).normalize();

      const center = this.projectPoint(zeroVector, localVector);
      // {
        const topLeft = center.clone()
          .add(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .sub(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        const bottomLeft = center.clone()
          .sub(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .sub(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        this.leftLine = new THREE.Line3(bottomLeft, topLeft);
      // }
      // {
        const bottomLeft2 = center.clone()
          .sub(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .sub(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        const bottomRight2 = center.clone()
          .sub(localVector3.copy(this.up).multiplyScalar(this.size.y / 2))
          .add(localVector3.copy(this.right).multiplyScalar(this.size.x / 2));
        this.bottomLine = new THREE.Line3(bottomLeft2, bottomRight2);
      // }
    }
    getUV(point, target) {
      const x = this.leftLine.closestPointToPointParameter(point, false);
      const y = this.bottomLine.closestPointToPointParameter(point, false);

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        // console.log('got uv', x, y, this.normal.toArray(), point.toArray(), this.leftLine, this.bottomLine);
        return target.set(x, y);
      } else {
        return null;
      }
    }
    getPenetrationNormalVector(line, target) {
      const intersection = this.intersectLine(line, localVector)
      if (intersection) {
        const uv = this.getUV(intersection, localVector2D);
        if (uv !== null) {
          const direction = localVector.copy(line.end)
            .sub(line.start);
          if (direction.dot(this.normal) < 0) {
            return target.copy(this.normal)
              .multiplyScalar(-1);
          } else {
            return null;
          }
        } else {
          return null;
        }
      } else {
        return null;
      }
    }
  }
  return ClippedPlane;
})(); */

const _makePlaneGeometry = (width, height) => {
  return new THREE.PlaneBufferGeometry(width, height)
    .applyMatrix4(localMatrix.makeTranslation(0, height/2, 0));
};
const _makeAreaMesh = (width, height, depth) => {
  const geometries = [
    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth/2)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width/2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI/2)),
    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth/2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width/2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI*3/2)),

    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI/4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth/2)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI/4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width/2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI/2)),
    _makePlaneGeometry(width, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI/4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, depth/2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI)),
    _makePlaneGeometry(depth, height)
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(1, 0, 0), Math.PI/4))
      .applyMatrix4(localMatrix.makeTranslation(0, 0, width/2))
      .applyMatrix4(localMatrix.makeRotationAxis(localVector.set(0, 1, 0), Math.PI*3/2)),
  ];
  const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
  const material = new THREE.MeshNormalMaterial({
    side: THREE.DoubleSide,
    opacity: 0.5,
    transparent: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  return mesh;
};

export default () => {
  const app = useApp();
  /* const camera = useCamera();
  const physics = usePhysics();
  const {
    voxelWorldSize,
    chunkWorldSize,
  } = useProcGen(); */
  // const {CapsuleGeometry} = useGeometries();
  // const {WebaverseShaderMaterial} = useMaterials();

  app.name = 'area';

  const sizeArray = app.getComponent('size') ?? [4, 2, 4];
  const [width, height, depth] = sizeArray;

  // console.log('got area size', sizeArray);

  const mesh = _makeAreaMesh(width, height, depth);
  app.add(mesh);
  mesh.updateMatrixWorld();

  // window.areaMesh = mesh;

  // const localPlayer = useLocalPlayer();
  useFrame(({timestamp, timeDiff}) => {
    // XXX
  });

  return app;
};