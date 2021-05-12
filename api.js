import * as THREE from 'three';
import React from 'react';
const {useEffect} = React;
import physicsManager from './physics-manager.js';

/* function Box(props) { 
  useEffect(() => {
    const position = props.position ? new THREE.Vector3().fromArray(props.position) : new THREE.Vector3(0, 0, 0);
    const quaternion = props.quaternion ? new THREE.Quaternion().fromArray(props.quaternion) : new THREE.Quaternion();
    const scale = props.scale ? new THREE.Vector3().fromArray(props.scale) : new THREE.Vector3(1, 1, 1);
    const dynamic = true;
    const physicsId = physicsManager.addBoxGeometry(position, quaternion, scale, dynamic);
    
    console.log('render props 1', position.toArray(), quaternion.toArray(), scale.toArray(), physicsId);
    
    return () => {
      console.log('render props 2', position.toArray(), quaternion.toArray(), scale.toArray(), physicsId);
      physicsManager.removeGeometry(physicsId);
    };
  }, []);
  return React.createElement('object3D', {}, props.children || []);
} */
function Box(props) { 
  useEffect(() => {
    const position = props.position ? new THREE.Vector3().fromArray(props.position) : new THREE.Vector3();
    const quaternion = props.quaternion ? new THREE.Quaternion().fromArray(props.quaternion) : new THREE.Quaternion();
    const scale = props.scale ? new THREE.Vector3().fromArray(props.scale) : new THREE.Vector3();
    const physicsId = physics.addBoxGeometry(position, quaternion, scale.clone().multiplyScalar(0.5), false);
    console.log('got floor', position, quaternion, scale.clone().multiplyScalar(0.5), physicsId);
    
    return () => {
      // debugger;
      // console.log('render props 2', position.toArray(), quaternion.toArray(), scale.toArray(), physicsId);
      physicsManager.removeGeometry(physicsId);
    };
  }, []);
  return React.createElement('object3D', {}, props.children || []);
}

const physics = {
  addBoxGeometry: physicsManager.addBoxGeometry.bind(physicsManager),
  removeGeometry: physicsManager.removeGeometry.bind(physicsManager),
  Box,
};
export {
  physics,
};