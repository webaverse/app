import * as THREE from 'three';
import React from 'react';
const {useEffect} = React;
import physicsManager from './physics-manager.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localMatrix = new THREE.Matrix4();

const makeAppContextObject = app => {
  function Box(props) { 
    useEffect(() => {
      const position = props.position ? new THREE.Vector3().fromArray(props.position) : new THREE.Vector3();
      const quaternion = props.quaternion ? new THREE.Quaternion().fromArray(props.quaternion) : new THREE.Quaternion();
      const scale = props.scale ? new THREE.Vector3().fromArray(props.scale) : new THREE.Vector3();
      const physicsId = physics.addBoxGeometry(position, quaternion, scale.clone().multiplyScalar(0.5), false);
      // console.log('got floor', position, quaternion, scale.clone().multiplyScalar(0.5), physicsId);
      
      return () => {
        // debugger;
        // console.log('render props 2', position.toArray(), quaternion.toArray(), scale.toArray(), physicsId);
        physicsManager.removeGeometry(physicsId);
      };
    }, []);
    return React.createElement('object3D', {}, props.children || []);
  }
  const physics = {
    addBoxGeometry(position, quaternion, size, dynamic) {
      app.rootObject.updateMatrixWorld();
      localMatrix
        .compose(position, quaternion, localVector2.set(1, 1, 1))
        .premultiply(app.rootObject.matrixWorld)
        .decompose(localVector, localQuaternion, localVector2);
      position = localVector;
      quaternion = localQuaternion;
      const physicsId = physicsManager.addBoxGeometry.call(this, position, quaternion, size, dynamic);

      app.physicsIds.push(physicsId);

      return physicsId;
    },
    removeGeometry(physicsId) {
      physicsManager.removeGeometry.apply(this, arguments);

      const index = app.physicsIds.indexOf(physicsId);
      if (index !== -1) {
        app.physicsIds.splice(index);
      }
    },
    Box,
  };

  return {
    physics,
  };
};
export {
  makeAppContextObject,
};